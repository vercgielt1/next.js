use anyhow::{Context, Result};
use turbo_tasks::Vc;
use turbopack_core::{
    asset::{Asset, AssetContent},
    chunk::{AsyncModuleInfo, ChunkableModule, ChunkingContext, EvaluatableAsset},
    ident::AssetIdent,
    module::{Module, OptionModule},
    reference::{ModuleReference, ModuleReferences, SingleModuleReference},
    resolve::ModulePart,
};

use super::{
    chunk_item::EcmascriptModulePartChunkItem, get_part_id, part_of_module, split, split_module,
    PartId, SplitResult,
};
use crate::{
    chunk::{EcmascriptChunkPlaceable, EcmascriptExports},
    parse::ParseResult,
    references::analyse_ecmascript_module,
    AnalyzeEcmascriptModuleResult, EcmascriptAnalyzable, EcmascriptModuleAsset,
    EcmascriptModuleAssetType, EcmascriptModuleContent, EcmascriptParsable,
};

/// A reference to part of an ES module.
///
/// This type is used for an advanced tree shkaing.
#[turbo_tasks::value]
pub struct EcmascriptModulePartAsset {
    pub full_module: Vc<EcmascriptModuleAsset>,
    pub part: Vc<ModulePart>,
}

#[turbo_tasks::value_impl]
impl EcmascriptParsable for EcmascriptModulePartAsset {
    #[turbo_tasks::function]
    async fn failsafe_parse(&self) -> Result<Vc<ParseResult>> {
        let parsed = self.full_module.failsafe_parse();
        let split_data = split(
            self.full_module.ident(),
            self.full_module.source(),
            parsed,
            self.full_module.options().await?.special_exports,
        );
        Ok(part_of_module(split_data, self.part))
    }
    #[turbo_tasks::function]
    fn parse_original(&self) -> Vc<ParseResult> {
        self.full_module.parse_original()
    }

    #[turbo_tasks::function]
    fn ty(&self) -> Vc<EcmascriptModuleAssetType> {
        self.full_module.ty()
    }
}

#[turbo_tasks::value_impl]
impl EcmascriptAnalyzable for EcmascriptModulePartAsset {
    #[turbo_tasks::function]
    fn analyze(&self) -> Vc<AnalyzeEcmascriptModuleResult> {
        let part = self.part;
        analyse_ecmascript_module(self.full_module, Some(part))
    }

    #[turbo_tasks::function]
    fn module_content_without_analysis(&self) -> Vc<EcmascriptModuleContent> {
        self.full_module.module_content_without_analysis()
    }

    #[turbo_tasks::function]
    fn module_content(
        &self,
        chunking_context: Vc<Box<dyn ChunkingContext>>,
        async_module_info: Option<Vc<AsyncModuleInfo>>,
    ) -> Vc<EcmascriptModuleContent> {
        self.full_module
            .module_content(chunking_context, async_module_info)
    }
}

#[turbo_tasks::value_impl]
impl EcmascriptModulePartAsset {
    /// Create a new instance of [Vc<EcmascriptModulePartAsset>], whcih consists
    /// of a pointer to the full module and the [ModulePart] pointing the part
    /// of the module.
    #[turbo_tasks::function]
    pub fn new(module: Vc<EcmascriptModuleAsset>, part: Vc<ModulePart>) -> Vc<Self> {
        EcmascriptModulePartAsset {
            full_module: module,
            part,
        }
        .cell()
    }

    /// Returns `None` only if the part is a proxied export. (Which is allowed to not exist)
    #[turbo_tasks::function]
    pub async fn select_part(
        module: Vc<EcmascriptModuleAsset>,
        part: Vc<ModulePart>,
    ) -> Result<Vc<OptionModule>> {
        let split_result = split_module(module).await?;

        Ok(Vc::cell(
            if matches!(&*split_result, SplitResult::Failed { .. }) {
                Some(Vc::upcast(module))
            } else if matches!(&*part.await?, ModulePart::Export(..)) {
                let part_id = get_part_id(&split_result, part).await?;
                if part_id.is_some() {
                    Some(Vc::upcast(EcmascriptModulePartAsset::new(module, part)))
                } else {
                    None
                }
            } else {
                Some(Vc::upcast(EcmascriptModulePartAsset::new(module, part)))
            },
        ))
    }

    #[turbo_tasks::function]
    pub async fn is_async_module(self: Vc<Self>) -> Result<Vc<bool>> {
        let this = self.await?;
        let result = analyse_ecmascript_module(this.full_module, Some(this.part));

        if let Some(async_module) = *result.await?.async_module.await? {
            Ok(async_module.is_self_async(self.references()))
        } else {
            Ok(Vc::cell(false))
        }
    }
}

#[turbo_tasks::value_impl]
impl Module for EcmascriptModulePartAsset {
    #[turbo_tasks::function]
    async fn ident(&self) -> Result<Vc<AssetIdent>> {
        let inner = self.full_module.ident();
        let result = split_module(self.full_module);

        match &*result.await? {
            SplitResult::Ok { .. } => Ok(inner.with_part(self.part)),
            SplitResult::Failed { .. } => Ok(inner),
        }
    }

    #[turbo_tasks::function]
    async fn references(&self) -> Result<Vc<ModuleReferences>> {
        let split_data = split_module(self.full_module).await?;

        let analyze = analyze(self.full_module, self.part).await?;

        let deps = match &*split_data {
            SplitResult::Ok { deps, .. } => deps,
            SplitResult::Failed { .. } => return Ok(analyze.references),
        };

        let part_dep = |part: Vc<ModulePart>| -> Vc<Box<dyn ModuleReference>> {
            Vc::upcast(SingleModuleReference::new(
                Vc::upcast(EcmascriptModulePartAsset::new(self.full_module, part)),
                Vc::cell("ecmascript module part".into()),
            ))
        };

        let mut references = analyze.references.await?.to_vec();

        // Facade depends on evaluation and re-exports
        if matches!(&*self.part.await?, ModulePart::Facade) {
            references.push(part_dep(ModulePart::evaluation()));
            references.push(part_dep(ModulePart::exports()));
            return Ok(Vc::cell(references));
        }

        let deps = {
            let Some(part_id) = get_part_id(&split_data, self.part)
                .await
                .with_context(|| format!("part {:?} is not found in the module", self.part))?
            else {
                return Ok(analyze.references);
            };

            match deps.get(&part_id) {
                Some(v) => &**v,
                None => &[],
            }
        };

        references.extend(
            deps.iter()
                .filter_map(|part_id| {
                    Some(part_dep(match part_id {
                        // This is an internal part that is not for evaluation, so we don't need to
                        // force-add it.
                        PartId::Internal(.., false) => return None,
                        PartId::Internal(part_id, true) => ModulePart::internal(*part_id),
                        PartId::Export(name) => ModulePart::export(name.clone()),
                        _ => unreachable!(
                            "PartId other than Internal and Export should not be used here"
                        ),
                    }))
                })
                .collect::<Vec<_>>(),
        );

        Ok(Vc::cell(references))
    }
}

#[turbo_tasks::value_impl]
impl Asset for EcmascriptModulePartAsset {
    #[turbo_tasks::function]
    fn content(&self) -> Vc<AssetContent> {
        self.full_module.content()
    }
}

#[turbo_tasks::value_impl]
impl EcmascriptChunkPlaceable for EcmascriptModulePartAsset {
    #[turbo_tasks::function]
    async fn get_exports(self: Vc<Self>) -> Result<Vc<EcmascriptExports>> {
        Ok(self.analyze().await?.exports)
    }
}

#[turbo_tasks::value_impl]
impl ChunkableModule for EcmascriptModulePartAsset {
    #[turbo_tasks::function]
    fn as_chunk_item(
        self: Vc<Self>,
        chunking_context: Vc<Box<dyn ChunkingContext>>,
    ) -> Vc<Box<dyn turbopack_core::chunk::ChunkItem>> {
        Vc::upcast(
            EcmascriptModulePartChunkItem {
                module: self,
                chunking_context,
            }
            .cell(),
        )
    }
}

#[turbo_tasks::value_impl]
impl EcmascriptModulePartAsset {
    #[turbo_tasks::function]
    pub(super) fn analyze(&self) -> Vc<AnalyzeEcmascriptModuleResult> {
        analyze(self.full_module, self.part)
    }
}

#[turbo_tasks::function]
fn analyze(
    module: Vc<EcmascriptModuleAsset>,
    part: Vc<ModulePart>,
) -> Vc<AnalyzeEcmascriptModuleResult> {
    analyse_ecmascript_module(module, Some(part))
}

#[turbo_tasks::value_impl]
impl EvaluatableAsset for EcmascriptModulePartAsset {}

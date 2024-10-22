use std::hash::Hash;

use anyhow::Result;
use tracing::Instrument;
use turbo_tasks::{ValueToString, Vc};
use turbo_tasks_fs::FileSystemPath;

use crate::{
    asset::{Asset, AssetContent},
    ident::AssetIdent,
    module::Module,
    output::{OutputAsset, OutputAssets},
    reference::referenced_modules_and_affecting_sources,
};

/// Converts a [Module] graph into an [OutputAsset] graph by placing it into a
/// different directory.
#[turbo_tasks::value]
#[derive(Hash)]
pub struct RebasedAsset {
    module: Vc<Box<dyn Module>>,
    input_dir: Vc<FileSystemPath>,
    output_dir: Vc<FileSystemPath>,
}

#[turbo_tasks::value_impl]
impl RebasedAsset {
    #[turbo_tasks::function]
    pub fn new(
        module: Vc<Box<dyn Module>>,
        input_dir: Vc<FileSystemPath>,
        output_dir: Vc<FileSystemPath>,
    ) -> Vc<Self> {
        Self::cell(RebasedAsset {
            module,
            input_dir,
            output_dir,
        })
    }
}

#[turbo_tasks::value_impl]
impl OutputAsset for RebasedAsset {
    #[turbo_tasks::function]
    fn ident(&self) -> Vc<AssetIdent> {
        AssetIdent::from_path(FileSystemPath::rebase(
            self.module.ident().path(),
            self.input_dir,
            self.output_dir,
        ))
    }

    #[turbo_tasks::function]
    async fn references(&self) -> Result<Vc<OutputAssets>> {
        let span = tracing::info_span!(
            "RebasedAsset references",
            module = self.module.ident().to_string().await?.to_string()
        );
        async move {
            let references = referenced_modules_and_affecting_sources(self.module)
                .await?
                .iter()
                .map(|m| Vc::upcast(RebasedAsset::new(*m, self.input_dir, self.output_dir)))
                .collect();
            Ok(Vc::cell(references))
        }
        .instrument(span)
        .await
    }
}

#[turbo_tasks::value_impl]
impl Asset for RebasedAsset {
    #[turbo_tasks::function]
    fn content(&self) -> Vc<AssetContent> {
        self.module.content()
    }
}

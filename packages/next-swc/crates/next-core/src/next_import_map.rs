use std::collections::{BTreeMap, HashMap};

use anyhow::{Context, Result};
use turbo_tasks::{Value, Vc};
use turbopack_binding::{
    turbo::tasks_fs::{glob::Glob, FileSystem, FileSystemPath},
    turbopack::{
        core::{
            resolve::{
                options::{ConditionValue, ImportMap, ImportMapping, ResolveOptions, ResolvedMap},
                parse::Request,
                pattern::Pattern,
                resolve, AliasPattern, ResolveAliasMap, SubpathValue,
            },
            source::Source,
        },
        node::execution_context::ExecutionContext,
        turbopack::{resolve_options, resolve_options_context::ResolveOptionsContext},
    },
};

use crate::{
    embed_js::{next_js_fs, VIRTUAL_PACKAGE_NAME},
    mode::NextMode,
    next_client::context::ClientContextType,
    next_config::NextConfig,
    next_font::{
        google::{NextFontGoogleCssModuleReplacer, NextFontGoogleReplacer},
        local::{NextFontLocalCssModuleReplacer, NextFontLocalReplacer},
    },
    next_server::context::ServerContextType,
};

// Make sure to not add any external requests here.
/// Computes the Next-specific client import map.
#[turbo_tasks::function]
pub async fn get_next_client_import_map(
    project_path: Vc<FileSystemPath>,
    ty: Value<ClientContextType>,
    next_config: Vc<NextConfig>,
    execution_context: Vc<ExecutionContext>,
) -> Result<Vc<ImportMap>> {
    let mut import_map = ImportMap::empty();

    insert_next_shared_aliases(
        &mut import_map,
        project_path,
        execution_context,
        next_config,
    )
    .await?;

    insert_alias_option(
        &mut import_map,
        project_path,
        next_config.resolve_alias_options(),
        ["browser"],
    )
    .await?;

    let vendor_dir = get_next_package(project_path).join("vendored".into());

    match ty.into_value() {
        ClientContextType::Pages { pages_dir } => {
            insert_alias_to_alternatives(
                &mut import_map,
                format!("{VIRTUAL_PACKAGE_NAME}/pages/_app"),
                vec![
                    request_to_import_mapping(pages_dir, "./_app"),
                    request_to_import_mapping(pages_dir, "next/app"),
                ],
            );
            insert_alias_to_alternatives(
                &mut import_map,
                format!("{VIRTUAL_PACKAGE_NAME}/pages/_document"),
                vec![
                    request_to_import_mapping(pages_dir, "./_document"),
                    request_to_import_mapping(pages_dir, "next/document"),
                ],
            );
            insert_alias_to_alternatives(
                &mut import_map,
                format!("{VIRTUAL_PACKAGE_NAME}/pages/_error"),
                vec![
                    request_to_import_mapping(pages_dir, "./_error"),
                    request_to_import_mapping(pages_dir, "next/error"),
                ],
            );
        }
        ClientContextType::App { app_dir: _ } => {
            import_map.insert_exact_alias(
                "next/dynamic",
                request_to_import_mapping(project_path, "next/dist/shared/lib/app-dynamic"),
            );

            for (package_name, vendored_name) in [
                ("react", "react-vendored"),
                ("react-dom", "react-dom-vendored"),
                (
                    "react-server-dom-webpack",
                    "react-server-dom-webpack-vendored",
                ),
                ("scheduler", "scheduler-vendored"),
                ("client-only", "client-only-vendored"),
                ("server-only", "server-only-vendored"),
            ] {
                import_map.insert_exact_alias(
                    package_name,
                    request_to_import_mapping(vendor_dir, vendored_name),
                );
                import_map.insert_wildcard_alias(
                    format!("{}{}", package_name, "/"),
                    request_to_import_mapping(
                        vendor_dir,
                        format!("{}{}", vendored_name, "/*").as_str(),
                    ),
                );
            }
        }
        ClientContextType::Fallback => {}
        ClientContextType::Other => {}
    }

    match ty.into_value() {
        ClientContextType::Pages { .. }
        | ClientContextType::App { .. }
        | ClientContextType::Fallback => {
            for (original, alias) in NEXT_ALIASES {
                import_map.insert_exact_alias(
                    format!("node:{original}"),
                    request_to_import_mapping(project_path, alias),
                );
            }
        }
        ClientContextType::Other => {}
    }

    insert_turbopack_dev_alias(&mut import_map);

    Ok(import_map.cell())
}

/// Computes the Next-specific client import map.
#[turbo_tasks::function]
pub fn get_next_build_import_map() -> Vc<ImportMap> {
    let mut import_map = ImportMap::empty();

    insert_package_alias(
        &mut import_map,
        &format!("{VIRTUAL_PACKAGE_NAME}/"),
        next_js_fs().root(),
    );

    let external = ImportMapping::External(None).cell();

    import_map.insert_exact_alias("next", external);
    import_map.insert_wildcard_alias("next/", external);
    import_map.insert_exact_alias("styled-jsx", external);
    import_map.insert_wildcard_alias("styled-jsx/", external);

    import_map.cell()
}

/// Computes the Next-specific client fallback import map, which provides
/// polyfills to Node.js externals.
#[turbo_tasks::function]
pub fn get_next_client_fallback_import_map(ty: Value<ClientContextType>) -> Vc<ImportMap> {
    let mut import_map = ImportMap::empty();

    match ty.into_value() {
        ClientContextType::Pages {
            pages_dir: context_dir,
        }
        | ClientContextType::App {
            app_dir: context_dir,
        } => {
            for (original, alias) in NEXT_ALIASES {
                import_map
                    .insert_exact_alias(original, request_to_import_mapping(context_dir, alias));
            }
        }
        ClientContextType::Fallback => {}
        ClientContextType::Other => {}
    }

    insert_turbopack_dev_alias(&mut import_map);

    import_map.cell()
}

/// Computes the Next-specific server-side import map.
#[turbo_tasks::function]
pub async fn get_next_server_import_map(
    project_path: Vc<FileSystemPath>,
    ty: Value<ServerContextType>,
    mode: NextMode,
    next_config: Vc<NextConfig>,
    execution_context: Vc<ExecutionContext>,
) -> Result<Vc<ImportMap>> {
    let mut import_map = ImportMap::empty();

    insert_next_shared_aliases(
        &mut import_map,
        project_path,
        execution_context,
        next_config,
    )
    .await?;

    insert_alias_option(
        &mut import_map,
        project_path,
        next_config.resolve_alias_options(),
        [],
    )
    .await?;

    let ty = ty.into_value();

    insert_next_server_special_aliases(project_path, &mut import_map, ty, mode).await?;
    let external = ImportMapping::External(None).cell();

    match ty {
        ServerContextType::Pages { .. } | ServerContextType::PagesData { .. } => {
            import_map.insert_exact_alias("next", external);
            import_map.insert_wildcard_alias("next/", external);
            import_map.insert_exact_alias("react", external);
            import_map.insert_wildcard_alias("react/", external);
            import_map.insert_exact_alias("react-dom", external);
            import_map.insert_wildcard_alias("react-dom/", external);
            import_map.insert_exact_alias("styled-jsx", external);
            import_map.insert_wildcard_alias("styled-jsx/", external);
            import_map.insert_exact_alias("react-server-dom-webpack/", external);
        }
        ServerContextType::AppSSR { .. }
        | ServerContextType::AppRSC { .. }
        | ServerContextType::AppRoute { .. } => {
            match mode {
                NextMode::Development | NextMode::Build => {
                    import_map.insert_wildcard_alias("next/dist/server/", external);
                    import_map.insert_wildcard_alias("next/dist/shared/", external);
                }
                NextMode::DevServer => {
                    // The sandbox can't be bundled and needs to be external
                    import_map.insert_exact_alias("next/dist/server/web/sandbox", external);
                }
            }
            import_map.insert_exact_alias(
                "next/head",
                request_to_import_mapping(project_path, "next/dist/client/components/noop-head"),
            );
            import_map.insert_exact_alias(
                "next/dynamic",
                request_to_import_mapping(project_path, "next/dist/shared/lib/app-dynamic"),
            );
        }
        ServerContextType::Middleware => {}
    }

    Ok(import_map.cell())
}

/// Computes the Next-specific edge-side import map.
#[turbo_tasks::function]
pub async fn get_next_edge_import_map(
    project_path: Vc<FileSystemPath>,
    ty: Value<ServerContextType>,
    mode: NextMode,
    next_config: Vc<NextConfig>,
    execution_context: Vc<ExecutionContext>,
) -> Result<Vc<ImportMap>> {
    let mut import_map = ImportMap::empty();

    insert_next_shared_aliases(
        &mut import_map,
        project_path,
        execution_context,
        next_config,
    )
    .await?;

    insert_alias_option(
        &mut import_map,
        project_path,
        next_config.resolve_alias_options(),
        [],
    )
    .await?;

    let ty = ty.into_value();

    insert_next_server_special_aliases(project_path, &mut import_map, ty, mode).await?;

    match ty {
        ServerContextType::Pages { .. } | ServerContextType::PagesData { .. } => {}
        ServerContextType::AppSSR { .. }
        | ServerContextType::AppRSC { .. }
        | ServerContextType::AppRoute { .. } => {
            import_map.insert_exact_alias(
                "next/head",
                request_to_import_mapping(project_path, "next/dist/client/components/noop-head"),
            );
            import_map.insert_exact_alias(
                "next/dynamic",
                request_to_import_mapping(project_path, "next/dist/shared/lib/app-dynamic"),
            );
        }
        ServerContextType::Middleware => {}
    }

    Ok(import_map.cell())
}

pub fn get_next_client_resolved_map(
    context: Vc<FileSystemPath>,
    root: Vc<FileSystemPath>,
) -> Vc<ResolvedMap> {
    let glob_mappings = vec![
        // Temporary hack to replace the hot reloader until this is passable by props in next.js
        (
            context.root(),
            Glob::new(
                "**/next/dist/client/components/react-dev-overlay/hot-reloader-client.js"
                    .to_string(),
            ),
            ImportMapping::PrimaryAlternative(
                "@vercel/turbopack-next/dev/hot-reloader.tsx".to_string(),
                Some(root),
            )
            .into(),
        ),
    ];
    ResolvedMap {
        by_glob: glob_mappings,
    }
    .cell()
}

static NEXT_ALIASES: [(&str, &str); 23] = [
    ("assert", "next/dist/compiled/assert"),
    ("buffer", "next/dist/compiled/buffer"),
    ("constants", "next/dist/compiled/constants-browserify"),
    ("crypto", "next/dist/compiled/crypto-browserify"),
    ("domain", "next/dist/compiled/domain-browser"),
    ("http", "next/dist/compiled/stream-http"),
    ("https", "next/dist/compiled/https-browserify"),
    ("os", "next/dist/compiled/os-browserify"),
    ("path", "next/dist/compiled/path-browserify"),
    ("punycode", "next/dist/compiled/punycode"),
    ("process", "next/dist/build/polyfills/process"),
    ("querystring", "next/dist/compiled/querystring-es3"),
    ("stream", "next/dist/compiled/stream-browserify"),
    ("string_decoder", "next/dist/compiled/string_decoder"),
    ("sys", "next/dist/compiled/util"),
    ("timers", "next/dist/compiled/timers-browserify"),
    ("tty", "next/dist/compiled/tty-browserify"),
    ("url", "next/dist/compiled/native-url"),
    ("util", "next/dist/compiled/util"),
    ("vm", "next/dist/compiled/vm-browserify"),
    ("zlib", "next/dist/compiled/browserify-zlib"),
    ("events", "next/dist/compiled/events"),
    ("setImmediate", "next/dist/compiled/setimmediate"),
];

pub async fn insert_next_server_special_aliases(
    project_path: Vc<FileSystemPath>,
    import_map: &mut ImportMap,
    ty: ServerContextType,
    mode: NextMode,
) -> Result<()> {
    let vendor_dir = get_next_package(project_path).join("vendored".into());
    match (mode, ty) {
        (_, ServerContextType::Pages { pages_dir }) => {
            import_map.insert_exact_alias(
                "@opentelemetry/api",
                // TODO(WEB-625) this actually need to prefer the local version of
                // @opentelemetry/api
                external_request_to_import_mapping("next/dist/compiled/@opentelemetry/api"),
            );
            insert_alias_to_alternatives(
                import_map,
                format!("{VIRTUAL_PACKAGE_NAME}/pages/_app"),
                vec![
                    request_to_import_mapping(pages_dir, "./_app"),
                    external_request_to_import_mapping("next/app"),
                ],
            );
            insert_alias_to_alternatives(
                import_map,
                format!("{VIRTUAL_PACKAGE_NAME}/pages/_document"),
                vec![
                    request_to_import_mapping(pages_dir, "./_document"),
                    external_request_to_import_mapping("next/document"),
                ],
            );
            insert_alias_to_alternatives(
                import_map,
                format!("{VIRTUAL_PACKAGE_NAME}/pages/_error"),
                vec![
                    request_to_import_mapping(pages_dir, "./_error"),
                    external_request_to_import_mapping("next/error"),
                ],
            );
        }
        (_, ServerContextType::PagesData { .. }) => {}
        // In development, we *always* use the bundled version of React, even in
        // SSR, since we're bundling Next.js alongside it.
        (
            NextMode::DevServer,
            ServerContextType::AppSSR { app_dir }
            | ServerContextType::AppRSC { app_dir, .. }
            | ServerContextType::AppRoute { app_dir },
        ) => {
            import_map.insert_exact_alias(
                "@opentelemetry/api",
                // TODO(WEB-625) this actually need to prefer the local version of
                // @opentelemetry/api
                request_to_import_mapping(app_dir, "next/dist/compiled/@opentelemetry/api"),
            );

            for (package_name, vendored_name) in [
                ("react", "react-vendored"),
                ("react-dom", "react-dom-vendored"),
                (
                    "react-server-dom-webpack",
                    "react-server-dom-webpack-vendored",
                ),
                ("scheduler", "scheduler-vendored"),
                ("client-only", "client-only-vendored"),
                ("server-only", "server-only-vendored"),
            ] {
                import_map.insert_exact_alias(
                    package_name,
                    request_to_import_mapping(vendor_dir, vendored_name),
                );
                import_map.insert_wildcard_alias(
                    format!("{}{}", package_name, "/"),
                    request_to_import_mapping(
                        vendor_dir,
                        format!("{}{}", vendored_name, "/*").as_str(),
                    ),
                );
            }
        }
        // NOTE(alexkirsz) This logic maps loosely to
        // `next.js/packages/next/src/build/webpack-config.ts`, where:
        //
        // ## RSC
        //
        // * always bundles
        // * maps react -> react/shared-subset (through the "react-server" exports condition)
        // * maps react-dom -> react-dom/server-rendering-stub
        // * passes through (react|react-dom|react-server-dom-webpack)/(.*) to
        //   next/dist/compiled/$1/$2
        (
            NextMode::Build | NextMode::Development,
            ServerContextType::AppRSC { app_dir, .. } | ServerContextType::AppRoute { app_dir },
        ) => {
            import_map.insert_exact_alias(
                "@opentelemetry/api",
                // TODO(WEB-625) this actually need to prefer the local version of
                // @opentelemetry/api
                request_to_import_mapping(app_dir, "next/dist/compiled/@opentelemetry/api"),
            );

            for (package_name, vendored_name) in [
                ("react", "react-vendored"),
                ("react-dom", "react-dom-vendored"),
                (
                    "react-server-dom-webpack",
                    "react-server-dom-webpack-vendored",
                ),
                ("scheduler", "scheduler-vendored"),
                ("client-only", "client-only-vendored"),
                ("server-only", "server-only-vendored"),
            ] {
                import_map.insert_exact_alias(
                    package_name,
                    request_to_import_mapping(vendor_dir, vendored_name),
                );
                import_map.insert_wildcard_alias(
                    format!("{}{}", package_name, "/"),
                    request_to_import_mapping(
                        vendor_dir,
                        format!("{}{}", vendored_name, "/*").as_str(),
                    ),
                );
            }
        }
        // ## SSR
        //
        // * always uses externals, to ensure we're using the same React instance as the Next.js
        //   runtime
        (NextMode::Build | NextMode::Development, ServerContextType::AppSSR { .. }) => {
            for package_name in [
                "react",
                "react-dom",
                "react-server-dom-webpack",
                "scheduler",
                "client-only",
                "server-only",
            ] {
                import_map.insert_exact_alias(
                    package_name,
                    external_request_to_import_mapping(package_name),
                );
                import_map.insert_wildcard_alias(
                    format!("{}{}", package_name, "/"),
                    external_request_to_import_mapping(
                        format!("{}{}", package_name, "/*").as_str(),
                    ),
                );
            }
        }
        (_, ServerContextType::Middleware) => {}
    }

    Ok(())
}

pub fn mdx_import_source_file() -> String {
    format!("{VIRTUAL_PACKAGE_NAME}/mdx-import-source")
}

// Make sure to not add any external requests here.
pub async fn insert_next_shared_aliases(
    import_map: &mut ImportMap,
    project_path: Vc<FileSystemPath>,
    execution_context: Vc<ExecutionContext>,
    next_config: Vc<NextConfig>,
) -> Result<()> {
    let package_root = next_js_fs().root();

    if *next_config.mdx_rs().await? {
        insert_alias_to_alternatives(
            import_map,
            mdx_import_source_file(),
            vec![
                request_to_import_mapping(project_path, "./mdx-components"),
                request_to_import_mapping(project_path, "./src/mdx-components"),
                request_to_import_mapping(project_path, "@mdx-js/react"),
            ],
        );
    }

    // we use the next.js hydration code, so we replace the error overlay with our
    // own
    import_map.insert_exact_alias(
        "next/dist/compiled/@next/react-dev-overlay/dist/client",
        request_to_import_mapping(package_root, "./overlay/client.ts"),
    );

    insert_package_alias(
        import_map,
        &format!("{VIRTUAL_PACKAGE_NAME}/"),
        package_root,
    );

    import_map.insert_alias(
        // Request path from js via next-font swc transform
        AliasPattern::exact("next/font/google/target.css"),
        ImportMapping::Dynamic(Vc::upcast(NextFontGoogleReplacer::new(project_path))).into(),
    );

    import_map.insert_alias(
        // Request path from js via next-font swc transform
        AliasPattern::exact("@next/font/google/target.css"),
        ImportMapping::Dynamic(Vc::upcast(NextFontGoogleReplacer::new(project_path))).into(),
    );

    import_map.insert_alias(
        AliasPattern::exact("@vercel/turbopack-next/internal/font/google/cssmodule.module.css"),
        ImportMapping::Dynamic(Vc::upcast(NextFontGoogleCssModuleReplacer::new(
            project_path,
            execution_context,
        )))
        .into(),
    );

    import_map.insert_alias(
        // Request path from js via next-font swc transform
        AliasPattern::exact("next/font/local/target.css"),
        ImportMapping::Dynamic(Vc::upcast(NextFontLocalReplacer::new(project_path))).into(),
    );

    import_map.insert_alias(
        // Request path from js via next-font swc transform
        AliasPattern::exact("@next/font/local/target.css"),
        ImportMapping::Dynamic(Vc::upcast(NextFontLocalReplacer::new(project_path))).into(),
    );

    import_map.insert_alias(
        AliasPattern::exact("@vercel/turbopack-next/internal/font/local/cssmodule.module.css"),
        ImportMapping::Dynamic(Vc::upcast(NextFontLocalCssModuleReplacer::new(
            project_path,
        )))
        .into(),
    );

    import_map.insert_singleton_alias("@swc/helpers", get_next_package(project_path));
    import_map.insert_singleton_alias("styled-jsx", get_next_package(project_path));
    import_map.insert_singleton_alias("next", project_path);
    import_map.insert_singleton_alias("react", project_path);
    import_map.insert_singleton_alias("react-dom", project_path);

    insert_turbopack_dev_alias(import_map);
    insert_package_alias(
        import_map,
        "@vercel/turbopack-node/",
        turbopack_binding::turbopack::node::embed_js::embed_fs().root(),
    );

    Ok(())
}

#[turbo_tasks::function]
async fn package_lookup_resolve_options(
    project_path: Vc<FileSystemPath>,
) -> Result<Vc<ResolveOptions>> {
    Ok(resolve_options(
        project_path,
        ResolveOptionsContext {
            enable_node_modules: Some(project_path.root().resolve().await?),
            enable_node_native_modules: true,
            custom_conditions: vec!["development".to_string()],
            ..Default::default()
        }
        .cell(),
    ))
}

#[turbo_tasks::function]
pub async fn get_next_package(context_directory: Vc<FileSystemPath>) -> Result<Vc<FileSystemPath>> {
    let result = resolve(
        context_directory,
        Request::parse(Value::new(Pattern::Constant(
            "next/package.json".to_string(),
        ))),
        package_lookup_resolve_options(context_directory),
    );
    let source = result
        .first_source()
        .await?
        .context("Next.js package not found")?;
    Ok(source.ident().path().parent())
}

pub async fn insert_alias_option<const N: usize>(
    import_map: &mut ImportMap,
    project_path: Vc<FileSystemPath>,
    alias_options: Vc<ResolveAliasMap>,
    conditions: [&'static str; N],
) -> Result<()> {
    let conditions = BTreeMap::from(conditions.map(|c| (c.to_string(), ConditionValue::Set)));
    for (alias, value) in &alias_options.await? {
        if let Some(mapping) = export_value_to_import_mapping(value, &conditions, project_path) {
            import_map.insert_alias(alias, mapping);
        }
    }
    Ok(())
}

fn export_value_to_import_mapping(
    value: &SubpathValue,
    conditions: &BTreeMap<String, ConditionValue>,
    project_path: Vc<FileSystemPath>,
) -> Option<Vc<ImportMapping>> {
    let mut result = Vec::new();
    value.add_results(
        conditions,
        &ConditionValue::Unset,
        &mut HashMap::new(),
        &mut result,
    );
    if result.is_empty() {
        None
    } else {
        Some(if result.len() == 1 {
            ImportMapping::PrimaryAlternative(result[0].to_string(), Some(project_path)).cell()
        } else {
            ImportMapping::Alternatives(
                result
                    .iter()
                    .map(|m| {
                        ImportMapping::PrimaryAlternative(m.to_string(), Some(project_path)).cell()
                    })
                    .collect(),
            )
            .cell()
        })
    }
}

/// Inserts an alias to an alternative of import mappings into an import map.
fn insert_alias_to_alternatives<'a>(
    import_map: &mut ImportMap,
    alias: impl Into<String> + 'a,
    alternatives: Vec<Vc<ImportMapping>>,
) {
    import_map.insert_exact_alias(alias, ImportMapping::Alternatives(alternatives).into());
}

/// Inserts an alias to an import mapping into an import map.
fn insert_package_alias(
    import_map: &mut ImportMap,
    prefix: &str,
    package_root: Vc<FileSystemPath>,
) {
    import_map.insert_wildcard_alias(
        prefix,
        ImportMapping::PrimaryAlternative("./*".to_string(), Some(package_root)).cell(),
    );
}

/// Inserts an alias to @vercel/turbopack-dev into an import map.
fn insert_turbopack_dev_alias(import_map: &mut ImportMap) {
    insert_package_alias(
        import_map,
        "@vercel/turbopack-ecmascript-runtime/",
        turbopack_binding::turbopack::ecmascript_runtime::embed_fs().root(),
    );
}

/// Creates a direct import mapping to the result of resolving a request
/// in a context.
fn request_to_import_mapping(context_path: Vc<FileSystemPath>, request: &str) -> Vc<ImportMapping> {
    ImportMapping::PrimaryAlternative(request.to_string(), Some(context_path)).cell()
}

/// Creates a direct import mapping to the result of resolving an external
/// request.
fn external_request_to_import_mapping(request: &str) -> Vc<ImportMapping> {
    ImportMapping::External(Some(request.to_string())).into()
}

//! Scanner for `next/image` and `next/script`.

use anyhow::{Context, Error};
use napi::{CallContext, JsString};
use rayon::prelude::*;
use std::{fs, path::PathBuf, sync::Arc};
use swc_common::SourceMap;
use swc_ecmascript::{
    ast::{EsVersion, ImportDecl},
    parser::{parse_file_as_program, EsConfig, Syntax, TsConfig},
    visit::{Visit, VisitWith},
};

use serde::Serialize;

use crate::util::MapErr;

#[js_function(1)]
pub fn scan_next_imports_js(cx: CallContext) -> napi::Result<JsString> {
    let entry = cx.get::<JsString>(0)?.into_utf8()?.into_owned()?;
    let result = scan_next_imports(entry.into()).convert_err()?;

    let result = serde_json::to_string(&result)
        .context("failed to serialize result")
        .convert_err()?;
    cx.env.create_string(&result)
}

#[allow(unused)]
fn scan_next_imports(entry: PathBuf) -> Result<ScanResult, Error> {
    let worker = Worker {
        cm: Default::default(),
    };
    worker.scan_path(entry)
}

struct Worker {
    cm: Arc<SourceMap>,
}
impl Worker {
    fn scan_path(&self, entry: PathBuf) -> Result<ScanResult, Error> {
        let metadata = fs::metadata(&entry)
            .with_context(|| format!("failed to get metadata of '{}'", entry.display()))?;

        if metadata.is_dir() {
            let iter = fs::read_dir(&entry)
                .with_context(|| format!("failed to read directory at '{}'", entry.display()))?;

            return iter
                .par_bridge()
                .filter_map(Result::ok)
                .map(|e| self.scan_path(e.path()))
                .reduce(
                    || Ok(ScanResult::default()),
                    |a, b| {
                        let mut a = a?;
                        a.files.extend(b?.files);
                        Ok(a)
                    },
                );
        } else if metadata.is_file() {
            if let Some(ext) = entry.extension() {
                if ext == "js" || ext == "jsx" || ext == "ts" || ext == "tsx" {
                    let fm = self
                        .cm
                        .load_file(&entry)
                        .with_context(|| format!("failed to load file '{}'", entry.display()))?;

                    let program = parse_file_as_program(
                        &fm,
                        if ext == "js" || ext == "jsx" {
                            Syntax::Es(EsConfig {
                                jsx: ext == "jsx",
                                ..Default::default()
                            })
                        } else {
                            Syntax::Typescript(TsConfig {
                                tsx: ext == "tsx",
                                ..Default::default()
                            })
                        },
                        EsVersion::latest(),
                        None,
                        &mut vec![],
                    );
                    // Ignore parsing errors

                    if let Ok(p) = program {
                        let mut data = FileScanResult {
                            path: entry.to_path_buf(),
                            images: Default::default(),
                            scripts: Default::default(),
                        };
                        let mut v = Scanner {
                            cm: &self.cm,
                            data: &mut data,
                        };
                        p.visit_with(&mut v);

                        if !v.data.images.is_empty() || !v.data.scripts.is_empty() {
                            return Ok(ScanResult { files: vec![data] });
                        }
                    }
                }
            }
        }

        Ok(Default::default())
    }
}

#[derive(Debug, Default, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub files: Vec<FileScanResult>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileScanResult {
    pub path: PathBuf,

    pub images: Vec<LineCol>,
    pub scripts: Vec<LineCol>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LineCol {
    pub line: usize,
    pub col: usize,
}

struct Scanner<'a> {
    cm: &'a Arc<SourceMap>,
    data: &'a mut FileScanResult,
}

impl Visit for Scanner<'_> {
    fn visit_import_decl(&mut self, n: &ImportDecl) {
        n.visit_children_with(self);

        if &*n.src.value == "next/image" || &*n.src.value == "next/script" {
            let loc = self.cm.lookup_char_pos(n.src.span.lo);
            let loc = LineCol {
                line: loc.line,
                col: loc.col_display,
            };

            if &*n.src.value == "next/image" {
                self.data.images.push(loc);
            } else {
                self.data.scripts.push(loc);
            }
        }
    }
}

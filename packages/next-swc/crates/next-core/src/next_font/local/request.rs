use serde::{Deserialize, Serialize};
use turbo_binding::turbo::tasks::trace::TraceRawVcs;

/// The top-most structure encoded into the query param in requests to
/// `next/font/local` generated by the next/font swc transform. e.g.
/// `next/font/local/target.css?{"path": "index.js", "arguments": {"src":...
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct NextFontLocalRequest {
    pub arguments: (NextFontLocalRequestArguments,),
    pub variable_name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct NextFontLocalRequestArguments {
    pub src: SrcRequest,
    pub weight: Option<String>,
    pub style: Option<String>,
    #[serde(default = "default_display")]
    pub display: String,
    #[serde(default = "default_preload")]
    pub preload: bool,
    pub fallback: Option<Vec<String>>,
    #[serde(
        default = "default_adjust_font_fallback",
        deserialize_with = "deserialize_adjust_font_fallback"
    )]
    pub adjust_font_fallback: AdjustFontFallback,
    pub variable: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub(super) enum SrcRequest {
    One(String),
    Many(Vec<SrcDescriptor>),
}

#[derive(Clone, Debug, Deserialize)]
pub(super) struct SrcDescriptor {
    pub path: String,
    pub weight: Option<String>,
    pub style: Option<String>,
}

/// The user's desired fallback font
#[derive(
    Clone, Debug, Deserialize, Hash, Ord, PartialOrd, PartialEq, Eq, Serialize, TraceRawVcs,
)]
pub(super) enum AdjustFontFallback {
    Arial,
    TimesNewRoman,
    None,
}

fn default_adjust_font_fallback() -> AdjustFontFallback {
    AdjustFontFallback::Arial
}

/// Deserializes and validates JS (bool | string) into [[AdjustFontFallback]]'s
/// None, Arial, TimesNewRoman
fn deserialize_adjust_font_fallback<'de, D>(
    de: D,
) -> std::result::Result<AdjustFontFallback, D::Error>
where
    D: serde::Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum AdjustFontFallbackInner {
        Named(String),
        None(bool),
    }

    match AdjustFontFallbackInner::deserialize(de)? {
        AdjustFontFallbackInner::Named(name) => match name.as_str() {
            "Arial" => Ok(AdjustFontFallback::Arial),
            "Times New Roman" => Ok(AdjustFontFallback::TimesNewRoman),
            _ => Err(serde::de::Error::invalid_value(
                serde::de::Unexpected::Other("adjust_font_fallback"),
                &"Expected either \"Arial\" or \"Times New Roman\"",
            )),
        },
        AdjustFontFallbackInner::None(val) => {
            if val {
                Err(serde::de::Error::invalid_value(
                    serde::de::Unexpected::Other("adjust_font_fallback"),
                    &"Expected string or `false`. Received `true`",
                ))
            } else {
                Ok(AdjustFontFallback::None)
            }
        }
    }
}

fn default_preload() -> bool {
    true
}

fn default_display() -> String {
    "swap".to_owned()
}

#[cfg(test)]
mod tests {
    use anyhow::Result;
    use serde::Deserialize;

    use super::{
        default_adjust_font_fallback, deserialize_adjust_font_fallback, AdjustFontFallback,
    };

    #[derive(Debug, Deserialize, PartialEq)]
    #[serde(rename_all = "camelCase")]
    struct TestFallback {
        #[serde(
            default = "default_adjust_font_fallback",
            deserialize_with = "deserialize_adjust_font_fallback"
        )]
        pub adjust_font_fallback: AdjustFontFallback,
    }

    #[test]
    fn test_deserialize_adjust_font_fallback_fails_on_true() {
        match serde_json::from_str::<TestFallback>(r#"{"adjustFontFallback": true}"#) {
            Ok(_) => panic!("Should fail"),
            Err(error) => assert!(error.to_string().contains(
                "invalid value: adjust_font_fallback, expected Expected string or `false`. \
                 Received `true`"
            )),
        };
    }

    #[test]
    fn test_deserialize_adjust_font_fallback_fails_on_unknown_string() {
        match serde_json::from_str::<TestFallback>(r#"{"adjustFontFallback": "Roboto"}"#) {
            Ok(_) => panic!("Should fail"),
            Err(error) => assert!(
                error.to_string().contains(
                    r#"invalid value: adjust_font_fallback, expected Expected either "Arial" or "Times New Roman""#
                )
            ),
        };
    }

    #[test]
    fn test_deserializes_false_as_none() -> Result<()> {
        assert_eq!(
            serde_json::from_str::<TestFallback>(r#"{"adjustFontFallback": false}"#)?,
            TestFallback {
                adjust_font_fallback: AdjustFontFallback::None
            }
        );

        Ok(())
    }

    #[test]
    fn test_deserializes_arial() -> Result<()> {
        assert_eq!(
            serde_json::from_str::<TestFallback>(r#"{"adjustFontFallback": "Arial"}"#)?,
            TestFallback {
                adjust_font_fallback: AdjustFontFallback::Arial
            }
        );

        Ok(())
    }
}

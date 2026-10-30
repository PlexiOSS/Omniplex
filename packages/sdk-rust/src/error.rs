use std::collections::HashMap;
use std::time::Duration;

pub type Result<T, E = Error> = std::result::Result<T, E>;

#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum Error {
    #[error("{message}")]
    Api {
        status: u16,
        message: String,
        context: Option<HashMap<String, String>>,
        retry_after: Option<Duration>,
    },
    #[error(
        "this request needs an API token; create one under API sessions in your Omniplex dashboard"
    )]
    MissingToken,
    #[error("request to {path} failed: {source}")]
    Http {
        path: String,
        #[source]
        source: reqwest::Error,
    },
    #[error("couldn't decode the response from {path}: {source}")]
    Decode {
        path: String,
        #[source]
        source: serde_json::Error,
    },
}

impl Error {
    pub fn status(&self) -> Option<u16> {
        match self {
            Error::Api { status, .. } => Some(*status),
            _ => None,
        }
    }
}

#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum WebhookError {
    #[error("a webhook secret is required")]
    MissingSecret,
    #[error("the X-Webhook-Protocol header is missing")]
    MissingProtocol,
    #[error("unsupported webhook protocol \"{0}\"")]
    UnsupportedProtocol(String),
    #[error("the webhook signature doesn't match")]
    SignatureMismatch,
    #[error("the webhook secret doesn't match")]
    SecretMismatch,
    #[error("the webhook nonce is missing")]
    MissingNonce,
    #[error("the webhook body isn't valid hex")]
    InvalidHex,
    #[error("the webhook body is too short")]
    TooShort,
    #[error("the webhook body couldn't be decrypted")]
    Decrypt,
    #[error("the webhook payload isn't valid JSON: {0}")]
    Json(#[source] serde_json::Error),
}

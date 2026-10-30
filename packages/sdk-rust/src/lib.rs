#![doc = include_str!("../README.md")]

mod client;
mod error;
mod types;
mod webhooks;

pub use client::{AutoPoster, DEFAULT_BASE_URL, Omniplex, OmniplexBuilder};
pub use error::{Error, Result, WebhookError};
pub use types::*;
pub use webhooks::{WebhookHeaders, verify_webhook};

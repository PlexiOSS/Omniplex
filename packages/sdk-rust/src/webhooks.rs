use std::collections::HashMap;

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use hmac::{Hmac, Mac};
use sha2::{Digest, Sha256, Sha512};
use subtle::ConstantTimeEq;

use crate::error::WebhookError;
use crate::types::WebhookEvent;

pub trait WebhookHeaders {
    fn header(&self, name: &str) -> Option<&str>;
}

impl WebhookHeaders for http::HeaderMap {
    fn header(&self, name: &str) -> Option<&str> {
        self.get(name).and_then(|v| v.to_str().ok())
    }
}

impl<S: std::hash::BuildHasher> WebhookHeaders for HashMap<String, String, S> {
    fn header(&self, name: &str) -> Option<&str> {
        self.iter()
            .find(|(k, _)| k.eq_ignore_ascii_case(name))
            .map(|(_, v)| v.as_str())
    }
}

impl WebhookHeaders for [(&str, &str)] {
    fn header(&self, name: &str) -> Option<&str> {
        self.iter()
            .find(|(k, _)| k.eq_ignore_ascii_case(name))
            .map(|(_, v)| *v)
    }
}

impl<const N: usize> WebhookHeaders for [(&str, &str); N] {
    fn header(&self, name: &str) -> Option<&str> {
        self.as_slice().header(name)
    }
}

fn hmac_sha256_hex(key: &[u8], data: &[u8]) -> String {
    let mut mac =
        <Hmac<Sha256> as KeyInit>::new_from_slice(key).expect("HMAC accepts any key length");
    mac.update(data);
    hex::encode(mac.finalize().into_bytes())
}

fn hmac_sha512_hex(key: &[u8], data: &[u8]) -> String {
    let mut mac =
        <Hmac<Sha512> as KeyInit>::new_from_slice(key).expect("HMAC accepts any key length");
    mac.update(data);
    hex::encode(mac.finalize().into_bytes())
}

fn equal(a: &str, b: &str) -> bool {
    a.len() == b.len() && bool::from(a.as_bytes().ct_eq(b.as_bytes()))
}

fn open_splashtail(body: &[u8], secret: &str, nonce: &str) -> Result<Vec<u8>, WebhookError> {
    let text = std::str::from_utf8(body).map_err(|_| WebhookError::InvalidHex)?;
    let sealed = hex::decode(text.trim()).map_err(|_| WebhookError::InvalidHex)?;
    if sealed.len() < 12 + 16 {
        return Err(WebhookError::TooShort);
    }

    let key = Sha256::digest(format!("{secret}{nonce}").as_bytes());
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|_| WebhookError::Decrypt)?;
    let (iv, ciphertext) = sealed.split_at(12);
    let iv = Nonce::try_from(iv).map_err(|_| WebhookError::Decrypt)?;
    cipher
        .decrypt(&iv, ciphertext)
        .map_err(|_| WebhookError::Decrypt)
}

pub fn verify_webhook<H: WebhookHeaders + ?Sized>(
    body: &[u8],
    headers: &H,
    secret: &str,
) -> Result<WebhookEvent, WebhookError> {
    if secret.is_empty() {
        return Err(WebhookError::MissingSecret);
    }

    let signature = || {
        headers
            .header("x-webhook-signature")
            .unwrap_or_default()
            .to_ascii_lowercase()
    };

    let opened;
    let payload: &[u8] = match headers.header("x-webhook-protocol") {
        Some("hmac-sha256") => {
            let expected = format!("sha256={}", hmac_sha256_hex(secret.as_bytes(), body));
            if !equal(&signature(), &expected) {
                return Err(WebhookError::SignatureMismatch);
            }
            body
        }
        Some("simple-auth") => {
            if !equal(headers.header("authorization").unwrap_or_default(), secret) {
                return Err(WebhookError::SecretMismatch);
            }
            body
        }
        Some("splashtail") => {
            let nonce = headers
                .header("x-webhook-nonce")
                .filter(|n| !n.is_empty())
                .ok_or(WebhookError::MissingNonce)?;
            let inner = hmac_sha512_hex(secret.as_bytes(), body);
            let expected = hmac_sha512_hex(nonce.as_bytes(), inner.as_bytes());
            if !equal(&signature(), &expected) {
                return Err(WebhookError::SignatureMismatch);
            }
            opened = open_splashtail(body, secret, nonce)?;
            &opened
        }
        Some(other) if !other.is_empty() => {
            return Err(WebhookError::UnsupportedProtocol(other.to_owned()));
        }
        _ => return Err(WebhookError::MissingProtocol),
    };

    serde_json::from_slice(payload).map_err(WebhookError::Json)
}

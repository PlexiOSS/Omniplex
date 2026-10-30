use std::collections::HashMap;

use omniplex::{WebhookError, WebhookEvent, WebhookEventData, verify_webhook};
use serde::Deserialize;

#[derive(Deserialize)]
struct Fixtures {
    secret: String,
    payload: String,
    hmac: Hmac,
    splashtail: Splashtail,
}

#[derive(Deserialize)]
struct Hmac {
    body: String,
    signature: String,
}

#[derive(Deserialize)]
struct Splashtail {
    body: String,
    nonce: String,
    signature: String,
}

fn fixtures() -> Fixtures {
    serde_json::from_str(include_str!("fixtures/webhooks.json")).unwrap()
}

fn wrong_secret(f: &Fixtures) -> String {
    f.secret.chars().rev().collect()
}

fn check_vote(event: &WebhookEvent) {
    assert_eq!(event.kind(), "NEW_VOTE");
    let WebhookEventData::NewVote(data) = &event.data else {
        panic!("expected a vote, got {:?}", event.data);
    };
    assert_eq!(
        (data.votes, data.per_user, data.downvote, data.auto),
        (12, 2, false, false)
    );
    assert_eq!(event.creator.as_ref().unwrap().id, "510065483693817867");
    assert_eq!(
        event.targets.bot.as_ref().unwrap().id,
        "1234567890123456789"
    );
    assert_eq!(event.metadata.created_at, 1761700000);
    assert!(!event.metadata.test);
}

#[test]
fn hmac_webhook_verifies() {
    let f = fixtures();
    let headers = [
        ("X-Webhook-Protocol", "hmac-sha256"),
        ("X-Webhook-Signature", f.hmac.signature.as_str()),
    ];
    check_vote(&verify_webhook(f.hmac.body.as_bytes(), &headers, &f.secret).unwrap());
}

#[test]
fn hmac_rejects_wrong_secret_and_tampered_body() {
    let f = fixtures();
    let headers = [
        ("x-webhook-protocol", "hmac-sha256"),
        ("x-webhook-signature", f.hmac.signature.as_str()),
    ];
    assert!(matches!(
        verify_webhook(f.hmac.body.as_bytes(), &headers, &wrong_secret(&f)),
        Err(WebhookError::SignatureMismatch)
    ));
    let tampered = f.hmac.body.replacen("\"votes\":12", "\"votes\":99", 1);
    assert!(matches!(
        verify_webhook(tampered.as_bytes(), &headers, &f.secret),
        Err(WebhookError::SignatureMismatch)
    ));
}

#[test]
fn splashtail_webhook_verifies_and_decrypts() {
    let f = fixtures();
    let mut headers = HashMap::new();
    headers.insert("X-Webhook-Protocol".to_owned(), "splashtail".to_owned());
    headers.insert(
        "X-Webhook-Signature".to_owned(),
        f.splashtail.signature.clone(),
    );
    headers.insert("X-Webhook-Nonce".to_owned(), f.splashtail.nonce.clone());
    check_vote(&verify_webhook(f.splashtail.body.as_bytes(), &headers, &f.secret).unwrap());

    assert!(matches!(
        verify_webhook(f.splashtail.body.as_bytes(), &headers, &wrong_secret(&f)),
        Err(WebhookError::SignatureMismatch)
    ));
    headers.insert("X-Webhook-Nonce".to_owned(), "other".to_owned());
    assert!(matches!(
        verify_webhook(f.splashtail.body.as_bytes(), &headers, &f.secret),
        Err(WebhookError::SignatureMismatch)
    ));
}

#[test]
fn simple_auth_webhook() {
    let f = fixtures();
    let mut headers = http::HeaderMap::new();
    headers.insert("x-webhook-protocol", "simple-auth".parse().unwrap());
    headers.insert("authorization", f.secret.parse().unwrap());
    check_vote(&verify_webhook(f.payload.as_bytes(), &headers, &f.secret).unwrap());

    headers.insert("authorization", "nope".parse().unwrap());
    assert!(matches!(
        verify_webhook(f.payload.as_bytes(), &headers, &f.secret),
        Err(WebhookError::SecretMismatch)
    ));
}

#[test]
fn missing_and_unknown_protocol() {
    let f = fixtures();
    let none: [(&str, &str); 0] = [];
    assert!(matches!(
        verify_webhook(f.payload.as_bytes(), &none, &f.secret),
        Err(WebhookError::MissingProtocol)
    ));
    assert!(matches!(
        verify_webhook(f.payload.as_bytes(), &[("x-webhook-protocol", "carrier-pigeon")], &f.secret),
        Err(WebhookError::UnsupportedProtocol(p)) if p == "carrier-pigeon"
    ));
    assert!(matches!(
        verify_webhook(
            f.payload.as_bytes(),
            &[("x-webhook-protocol", "simple-auth")],
            &f.secret[..0]
        ),
        Err(WebhookError::MissingSecret)
    ));
}

#[test]
fn unknown_event_keeps_raw_data() {
    let event: WebhookEvent = serde_json::from_str(
        r#"{"type":"SOMETHING_NEW","data":{"x":1},"creator":null,"targets":{},"metadata":{"created_at":1,"test":true}}"#,
    )
    .unwrap();
    assert_eq!(event.kind(), "SOMETHING_NEW");
    let WebhookEventData::Unknown { data, .. } = event.data else {
        panic!("expected Unknown");
    };
    assert_eq!(data["x"], 1);
}

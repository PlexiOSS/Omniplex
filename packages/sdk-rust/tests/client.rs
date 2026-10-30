use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use omniplex::{BotStats, Error, Omniplex, PresenceStatus, ServerStats};
use serde_json::{Value, json};
use wiremock::matchers::{header, method, path};
use wiremock::{Mock, MockServer, Request, ResponseTemplate};

fn client(server: &MockServer) -> Omniplex {
    Omniplex::builder()
        .token("tok")
        .base_url(format!("{}/", server.uri()))
        .build()
}

fn body(req: &Request) -> Value {
    serde_json::from_slice(&req.body).unwrap()
}

#[tokio::test]
async fn post_bot_stats_sends_token_and_snake_case() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/bots/stats"))
        .and(header("authorization", "tok"))
        .respond_with(ResponseTemplate::new(204))
        .expect(1)
        .mount(&server)
        .await;

    client(&server)
        .post_bot_stats(&BotStats {
            servers: Some(213),
            shards: Some(1),
            shard_list: Some(vec![0]),
            status: Some(PresenceStatus::Online),
            ..Default::default()
        })
        .await
        .unwrap();

    let sent = body(&server.received_requests().await.unwrap()[0]);
    assert_eq!(
        sent,
        json!({"servers": 213, "shards": 1, "shard_list": [0], "status": "online"})
    );
}

#[tokio::test]
async fn post_server_stats() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/servers/stats"))
        .respond_with(ResponseTemplate::new(204))
        .mount(&server)
        .await;

    client(&server)
        .post_server_stats(&ServerStats {
            total_members: Some(120),
            online_members: Some(40),
        })
        .await
        .unwrap();

    let sent = body(&server.received_requests().await.unwrap()[0]);
    assert_eq!(sent, json!({"total_members": 120, "online_members": 40}));
}

#[tokio::test]
async fn posting_without_token_fails_before_any_request() {
    let server = MockServer::start().await;
    let anonymous = Omniplex::builder().base_url(server.uri()).build();
    let err = anonymous
        .post_bot_stats(&BotStats::default())
        .await
        .unwrap_err();
    assert!(matches!(err, Error::MissingToken));
    assert!(server.received_requests().await.unwrap().is_empty());
}

#[tokio::test]
async fn has_voted_reads_public_vote_endpoint() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/users/222/bots/111/votes"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "has_voted": true,
            "valid_votes": [{
                "itag": "0b6a9c2e-0000-0000-0000-000000000000",
                "target_type": "bot", "target_id": "111", "author": "222",
                "upvote": true, "void": false, "void_reason": null, "voided_at": null,
                "created_at": "2026-10-29T12:00:00Z", "vote_num": 1,
                "credit_redeem": null, "immutable": false, "auto": false
            }],
            "vote_info": {"per_user": 1, "vote_time": 12},
            "wait": {"hours": 11, "minutes": 59, "seconds": 3}
        })))
        .mount(&server)
        .await;

    let c = client(&server);
    assert!(c.has_voted("111", "222").await.unwrap());
    let vote = c.get_bot_vote("111", "222").await.unwrap();
    assert_eq!(vote.valid_votes[0].author, "222");
    assert_eq!(
        vote.wait.unwrap().duration(),
        Duration::from_secs(11 * 3600 + 59 * 60 + 3)
    );

    let req = &server.received_requests().await.unwrap()[0];
    assert!(req.headers.get("authorization").is_none());
}

#[tokio::test]
async fn api_errors_carry_status_message_and_context() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .respond_with(ResponseTemplate::new(400).set_body_json(json!({
            "message": "Status must be one of online, idle, dnd or offline",
            "context": {"status": "oneof"}
        })))
        .mount(&server)
        .await;

    let err = client(&server)
        .post_bot_stats(&BotStats::default())
        .await
        .unwrap_err();
    let Error::Api {
        status,
        message,
        context,
        ..
    } = &err
    else {
        panic!("expected an API error, got {err:?}");
    };
    assert_eq!(*status, 400);
    assert_eq!(
        message,
        "Status must be one of online, idle, dnd or offline"
    );
    assert_eq!(context.as_ref().unwrap()["status"], "oneof");
    assert_eq!(err.status(), Some(400));
}

#[tokio::test]
async fn retries_after_429() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .respond_with(ResponseTemplate::new(429).insert_header("Retry-After", "0"))
        .up_to_n_times(1)
        .mount(&server)
        .await;
    Mock::given(method("POST"))
        .respond_with(ResponseTemplate::new(204))
        .mount(&server)
        .await;

    client(&server)
        .post_bot_stats(&BotStats::default())
        .await
        .unwrap();
    assert_eq!(server.received_requests().await.unwrap().len(), 2);
}

#[tokio::test]
async fn retries_gets_on_server_errors_but_not_posts() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .respond_with(ResponseTemplate::new(503))
        .up_to_n_times(1)
        .mount(&server)
        .await;
    Mock::given(method("GET"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({"id": "1"})))
        .mount(&server)
        .await;
    Mock::given(method("POST"))
        .respond_with(ResponseTemplate::new(503).set_body_json(json!({"message": "down"})))
        .mount(&server)
        .await;

    let c = client(&server);
    assert_eq!(c.get_user("1").await.unwrap()["id"], "1");
    assert_eq!(server.received_requests().await.unwrap().len(), 2);

    let err = c.post_bot_stats(&BotStats::default()).await.unwrap_err();
    assert_eq!(err.status(), Some(503));
    assert_eq!(server.received_requests().await.unwrap().len(), 3);
}

#[test]
fn trailing_slashes_are_trimmed_quickly() {
    let started = Instant::now();
    let c = Omniplex::builder()
        .base_url(format!("https://api.example{}", "/".repeat(100_000)))
        .build();
    assert!(started.elapsed() < Duration::from_millis(100));
    assert_eq!(c.base_url(), "https://api.example");
}

#[tokio::test]
async fn auto_post_posts_straight_away_and_stops() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .respond_with(ResponseTemplate::new(204))
        .mount(&server)
        .await;

    let posted = Arc::new(Mutex::new(Vec::new()));
    let seen = posted.clone();
    let poster = client(&server).auto_post_bot_stats_with(
        Duration::from_secs(3600),
        || async {
            BotStats {
                servers: Some(7),
                ..Default::default()
            }
        },
        move |result| {
            seen.lock()
                .unwrap()
                .push(result.map(|s| s.servers).ok().flatten())
        },
    );

    let deadline = Instant::now() + Duration::from_secs(5);
    while posted.lock().unwrap().is_empty() && Instant::now() < deadline {
        tokio::time::sleep(Duration::from_millis(10)).await;
    }
    poster.stop();

    assert_eq!(*posted.lock().unwrap(), vec![Some(7)]);
    assert_eq!(server.received_requests().await.unwrap().len(), 1);
}

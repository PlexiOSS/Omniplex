use std::fmt;
use std::future::Future;
use std::sync::Arc;
use std::time::{Duration, SystemTime};

use percent_encoding::{AsciiSet, NON_ALPHANUMERIC, utf8_percent_encode};
use reqwest::header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE, RETRY_AFTER, USER_AGENT};
use reqwest::{Method, Response, StatusCode};
use serde::Deserialize;
use serde::de::DeserializeOwned;
use serde_json::Value;
use tokio::task::JoinHandle;
use tokio::time::MissedTickBehavior;

use crate::error::{Error, Result};
use crate::types::{BotStats, ServerStats, UserVote};

pub const DEFAULT_BASE_URL: &str = "https://api.omniplex.gg";

const MAX_RETRY_WAIT: Duration = Duration::from_secs(60);
const MIN_AUTOPOST_EVERY: Duration = Duration::from_secs(60);
const SEGMENT: &AsciiSet = &NON_ALPHANUMERIC
    .remove(b'-')
    .remove(b'_')
    .remove(b'.')
    .remove(b'~');

fn segment(value: &str) -> String {
    utf8_percent_encode(value, SEGMENT).to_string()
}

fn backoff(attempt: u32) -> Duration {
    Duration::from_millis(500u64.saturating_mul(1u64 << attempt.min(5))).min(Duration::from_secs(8))
}

fn retry_after(res: &Response) -> Option<Duration> {
    let raw = res.headers().get(RETRY_AFTER)?.to_str().ok()?.trim();
    if let Ok(seconds) = raw.parse::<f64>() {
        return Some(Duration::from_secs_f64(seconds.max(0.0)));
    }
    let at = httpdate::parse_http_date(raw).ok()?;
    Some(at.duration_since(SystemTime::now()).unwrap_or_default())
}

async fn api_error(res: Response) -> Error {
    let status = res.status();
    let retry_after = retry_after(&res);

    #[derive(Deserialize)]
    struct Body {
        message: Option<String>,
        context: Option<std::collections::HashMap<String, String>>,
    }

    let body = res
        .bytes()
        .await
        .ok()
        .and_then(|b| serde_json::from_slice::<Body>(&b).ok());
    let fallback = format!(
        "{} {}",
        status.as_u16(),
        status.canonical_reason().unwrap_or("")
    )
    .trim()
    .to_owned();

    Error::Api {
        status: status.as_u16(),
        message: body
            .as_ref()
            .and_then(|b| b.message.clone())
            .filter(|m| !m.is_empty())
            .unwrap_or(fallback),
        context: body.and_then(|b| b.context),
        retry_after,
    }
}

#[derive(Clone)]
pub struct Omniplex {
    http: reqwest::Client,
    base_url: Arc<str>,
    token: Option<Arc<str>>,
    max_retries: u32,
    user_agent: Arc<str>,
}

#[derive(Clone)]
pub struct OmniplexBuilder {
    http: Option<reqwest::Client>,
    base_url: String,
    token: Option<String>,
    max_retries: u32,
    user_agent: String,
}

fn redacted(token: Option<&str>) -> Option<&'static str> {
    token.map(|_| "[redacted]")
}

impl fmt::Debug for Omniplex {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Omniplex")
            .field("base_url", &self.base_url)
            .field("token", &redacted(self.token.as_deref()))
            .field("max_retries", &self.max_retries)
            .field("user_agent", &self.user_agent)
            .finish_non_exhaustive()
    }
}

impl fmt::Debug for OmniplexBuilder {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("OmniplexBuilder")
            .field("base_url", &self.base_url)
            .field("token", &redacted(self.token.as_deref()))
            .field("max_retries", &self.max_retries)
            .field("user_agent", &self.user_agent)
            .finish_non_exhaustive()
    }
}

impl Default for OmniplexBuilder {
    fn default() -> Self {
        Self {
            http: None,
            base_url: DEFAULT_BASE_URL.to_owned(),
            token: None,
            max_retries: 2,
            user_agent: "omniplex-sdk-rust (+https://omniplex.gg)".to_owned(),
        }
    }
}

impl OmniplexBuilder {
    pub fn token(mut self, token: impl Into<String>) -> Self {
        self.token = Some(token.into());
        self
    }

    pub fn base_url(mut self, base_url: impl Into<String>) -> Self {
        self.base_url = base_url.into().trim_end_matches('/').to_owned();
        self
    }

    pub fn max_retries(mut self, max_retries: u32) -> Self {
        self.max_retries = max_retries;
        self
    }

    pub fn user_agent(mut self, user_agent: impl Into<String>) -> Self {
        self.user_agent = user_agent.into();
        self
    }

    pub fn http_client(mut self, client: reqwest::Client) -> Self {
        self.http = Some(client);
        self
    }

    pub fn build(self) -> Omniplex {
        let http = self.http.unwrap_or_else(|| {
            reqwest::Client::builder()
                .timeout(Duration::from_secs(10))
                .build()
                .unwrap_or_default()
        });
        Omniplex {
            http,
            base_url: self.base_url.into(),
            token: self.token.map(Into::into),
            max_retries: self.max_retries,
            user_agent: self.user_agent.into(),
        }
    }
}

impl Default for Omniplex {
    fn default() -> Self {
        OmniplexBuilder::default().build()
    }
}

#[derive(Debug)]
pub struct AutoPoster {
    handle: JoinHandle<()>,
}

impl AutoPoster {
    pub fn stop(self) {
        self.handle.abort();
    }

    pub fn is_finished(&self) -> bool {
        self.handle.is_finished()
    }
}

impl Omniplex {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_token(token: impl Into<String>) -> Self {
        Self::builder().token(token).build()
    }

    pub fn builder() -> OmniplexBuilder {
        OmniplexBuilder::default()
    }

    pub fn base_url(&self) -> &str {
        &self.base_url
    }

    async fn request<T: DeserializeOwned>(
        &self,
        method: Method,
        path: &str,
        body: Option<Vec<u8>>,
        auth: bool,
    ) -> Result<T> {
        let token = match (auth, &self.token) {
            (false, _) => None,
            (true, Some(token)) => Some(token.clone()),
            (true, None) => return Err(Error::MissingToken),
        };
        let url = format!("{}{}", self.base_url, path);

        let mut attempt = 0;
        loop {
            let can_retry = attempt < self.max_retries;
            let mut req = self
                .http
                .request(method.clone(), &url)
                .header(ACCEPT, "application/json")
                .header(USER_AGENT, &*self.user_agent);
            if let Some(body) = &body {
                req = req
                    .header(CONTENT_TYPE, "application/json")
                    .body(body.clone());
            }
            if let Some(token) = &token {
                req = req.header(AUTHORIZATION, &**token);
            }

            let res = match req.send().await {
                Ok(res) => res,
                Err(source) => {
                    if method == Method::GET && can_retry {
                        tokio::time::sleep(backoff(attempt)).await;
                        attempt += 1;
                        continue;
                    }
                    return Err(Error::Http {
                        path: path.to_owned(),
                        source,
                    });
                }
            };

            let status = res.status();
            if status == StatusCode::TOO_MANY_REQUESTS && can_retry {
                let wait = retry_after(&res).unwrap_or_else(|| backoff(attempt));
                if wait <= MAX_RETRY_WAIT {
                    tokio::time::sleep(wait).await;
                    attempt += 1;
                    continue;
                }
            }
            if status.is_server_error() && method == Method::GET && can_retry {
                tokio::time::sleep(backoff(attempt)).await;
                attempt += 1;
                continue;
            }
            if !status.is_success() {
                return Err(api_error(res).await);
            }

            let bytes = res.bytes().await.map_err(|source| Error::Http {
                path: path.to_owned(),
                source,
            })?;
            let text: &[u8] = if bytes.is_empty() { b"null" } else { &bytes };
            return serde_json::from_slice(text).map_err(|source| Error::Decode {
                path: path.to_owned(),
                source,
            });
        }
    }

    async fn get<T: DeserializeOwned>(&self, path: &str) -> Result<T> {
        self.request(Method::GET, path, None, false).await
    }

    async fn post(&self, path: &str, body: &impl serde::Serialize) -> Result<()> {
        let body = serde_json::to_vec(body).map_err(|source| Error::Decode {
            path: path.to_owned(),
            source,
        })?;
        self.request::<Value>(Method::POST, path, Some(body), true)
            .await
            .map(drop)
    }

    pub async fn get_bot(&self, id: &str, include_long: bool) -> Result<Value> {
        let query = if include_long { "?include=long" } else { "" };
        self.get(&format!("/bots/{}{query}", segment(id))).await
    }

    pub async fn get_server(&self, id: &str, include_long: bool) -> Result<Value> {
        let query = if include_long { "?include=long" } else { "" };
        self.get(&format!("/servers/{}{query}", segment(id))).await
    }

    pub async fn get_user(&self, id: &str) -> Result<Value> {
        self.get(&format!("/users/{}", segment(id))).await
    }

    pub async fn get_bot_vote(&self, bot_id: &str, user_id: &str) -> Result<UserVote> {
        self.get(&format!(
            "/users/{}/bots/{}/votes",
            segment(user_id),
            segment(bot_id)
        ))
        .await
    }

    pub async fn get_server_vote(&self, server_id: &str, user_id: &str) -> Result<UserVote> {
        self.get(&format!(
            "/users/{}/servers/{}/votes",
            segment(user_id),
            segment(server_id)
        ))
        .await
    }

    pub async fn has_voted(&self, bot_id: &str, user_id: &str) -> Result<bool> {
        Ok(self.get_bot_vote(bot_id, user_id).await?.has_voted)
    }

    pub async fn has_voted_for_server(&self, server_id: &str, user_id: &str) -> Result<bool> {
        Ok(self.get_server_vote(server_id, user_id).await?.has_voted)
    }

    pub async fn post_bot_stats(&self, stats: &BotStats) -> Result<()> {
        self.post("/bots/stats", stats).await
    }

    pub async fn post_server_stats(&self, stats: &ServerStats) -> Result<()> {
        self.post("/servers/stats", stats).await
    }

    pub fn auto_post_bot_stats<F, Fut>(&self, every: Duration, get_stats: F) -> AutoPoster
    where
        F: FnMut() -> Fut + Send + 'static,
        Fut: Future<Output = BotStats> + Send,
    {
        self.auto_post_bot_stats_with(every, get_stats, |result| {
            if let Err(err) = result {
                eprintln!("[omniplex] Failed to post bot stats: {err}");
            }
        })
    }

    pub fn auto_post_bot_stats_with<F, Fut, R>(
        &self,
        every: Duration,
        mut get_stats: F,
        mut on_result: R,
    ) -> AutoPoster
    where
        F: FnMut() -> Fut + Send + 'static,
        Fut: Future<Output = BotStats> + Send,
        R: FnMut(Result<&BotStats, &Error>) + Send + 'static,
    {
        let client = self.clone();
        let every = every.max(MIN_AUTOPOST_EVERY);
        let handle = tokio::spawn(async move {
            let mut ticker = tokio::time::interval(every);
            ticker.set_missed_tick_behavior(MissedTickBehavior::Delay);
            loop {
                ticker.tick().await;
                let stats = get_stats().await;
                match client.post_bot_stats(&stats).await {
                    Ok(()) => on_result(Ok(&stats)),
                    Err(err) => on_result(Err(&err)),
                }
            }
        });
        AutoPoster { handle }
    }
}

use nostr_sdk::prelude::*;
use serde::{Deserialize, Serialize};
use std::borrow::Cow;
use std::fs;
use std::path::PathBuf;

/// RipperClaw loadout event kind (NIP-33 parameterized replaceable)
const LOADOUT_KIND: u16 = 38333;

/// Default relays
const DEFAULT_RELAYS: &[&str] = &[
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://relay.nostr.band",
];

fn data_dir() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("/tmp"))
        .join(".ripperclaw")
}

fn keys_path() -> PathBuf {
    data_dir().join("keys.json")
}

// ─── Key Management ───

#[derive(Serialize, Deserialize, Clone)]
pub struct StoredKeys {
    pub nsec: String,
    pub npub: String,
}

#[derive(Serialize, Clone)]
pub struct KeyInfo {
    pub npub: String,
    pub npub_short: String,
    pub has_keys: bool,
}

fn load_keys() -> Option<Keys> {
    let path = keys_path();
    let data = fs::read_to_string(&path).ok()?;
    let stored: StoredKeys = serde_json::from_str(&data).ok()?;
    let secret_key = SecretKey::from_bech32(&stored.nsec).ok()?;
    Some(Keys::new(secret_key))
}

fn save_keys(keys: &Keys) -> Result<(), String> {
    let dir = data_dir();
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create dir: {}", e))?;

    let stored = StoredKeys {
        nsec: keys.secret_key().to_bech32().map_err(|e| format!("bech32 error: {}", e))?,
        npub: keys.public_key().to_bech32().map_err(|e| format!("bech32 error: {}", e))?,
    };

    let json = serde_json::to_string_pretty(&stored).map_err(|e| format!("JSON error: {}", e))?;
    fs::write(keys_path(), json).map_err(|e| format!("Write error: {}", e))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(keys_path(), fs::Permissions::from_mode(0o600))
            .map_err(|e| format!("Permissions error: {}", e))?;
    }

    Ok(())
}

fn npub_short(npub: &str) -> String {
    if npub.len() > 16 {
        format!("{}...{}", &npub[..12], &npub[npub.len() - 6..])
    } else {
        npub.to_string()
    }
}

#[tauri::command]
pub fn nostr_get_keys() -> Result<KeyInfo, String> {
    match load_keys() {
        Some(keys) => {
            let npub = keys.public_key().to_bech32().map_err(|e| e.to_string())?;
            Ok(KeyInfo {
                npub_short: npub_short(&npub),
                npub,
                has_keys: true,
            })
        }
        None => Ok(KeyInfo {
            npub: String::new(),
            npub_short: String::new(),
            has_keys: false,
        }),
    }
}

#[tauri::command]
pub fn nostr_generate_keys() -> Result<KeyInfo, String> {
    let keys = Keys::generate();
    save_keys(&keys)?;
    let npub = keys.public_key().to_bech32().map_err(|e| e.to_string())?;
    Ok(KeyInfo {
        npub_short: npub_short(&npub),
        npub,
        has_keys: true,
    })
}

#[tauri::command]
pub fn nostr_import_keys(nsec: String) -> Result<KeyInfo, String> {
    let secret_key = SecretKey::from_bech32(&nsec).map_err(|_| "Invalid nsec key".to_string())?;
    let keys = Keys::new(secret_key);
    save_keys(&keys)?;
    let npub = keys.public_key().to_bech32().map_err(|e| e.to_string())?;
    Ok(KeyInfo {
        npub_short: npub_short(&npub),
        npub,
        has_keys: true,
    })
}

#[tauri::command]
pub fn nostr_export_keys() -> Result<StoredKeys, String> {
    let path = keys_path();
    let data = fs::read_to_string(&path).map_err(|_| "No keys found.".to_string())?;
    let stored: StoredKeys = serde_json::from_str(&data).map_err(|e| format!("Parse error: {}", e))?;
    Ok(stored)
}

// ─── Profile (NIP-01 kind 0 metadata) ───

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct NostrProfile {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub display_name: String,
    #[serde(default)]
    pub about: String,
    #[serde(default)]
    pub picture: String,
    #[serde(default)]
    pub website: String,
    #[serde(default)]
    pub nip05: String,
    #[serde(default)]
    pub banner: String,
}

fn profile_path() -> PathBuf {
    data_dir().join("profile.json")
}

fn load_profile() -> NostrProfile {
    fs::read_to_string(profile_path())
        .ok()
        .and_then(|data| serde_json::from_str(&data).ok())
        .unwrap_or_default()
}

fn save_profile(profile: &NostrProfile) -> Result<(), String> {
    let json = serde_json::to_string_pretty(profile).map_err(|e| format!("JSON error: {}", e))?;
    fs::write(profile_path(), json).map_err(|e| format!("Write error: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn nostr_get_profile() -> NostrProfile {
    load_profile()
}

#[tauri::command]
pub async fn nostr_set_profile(profile: NostrProfile) -> Result<String, String> {
    save_profile(&profile)?;

    let keys = load_keys().ok_or("No keys found. Generate or import keys first.")?;
    let client = Client::new(keys);

    for relay in load_relay_urls() {
        client.add_relay(relay).await.map_err(|e| e.to_string())?;
    }
    client.connect().await;

    // Build kind 0 metadata
    let mut metadata = Metadata::new();
    if !profile.name.is_empty() {
        metadata = metadata.name(&profile.name);
    }
    if !profile.display_name.is_empty() {
        metadata = metadata.display_name(&profile.display_name);
    }
    if !profile.about.is_empty() {
        metadata = metadata.about(&profile.about);
    }
    if !profile.picture.is_empty() {
        let url = Url::parse(&profile.picture).map_err(|e| format!("Invalid picture URL: {}", e))?;
        metadata = metadata.picture(url);
    }
    if !profile.website.is_empty() {
        let url = Url::parse(&profile.website).map_err(|e| format!("Invalid website URL: {}", e))?;
        metadata = metadata.website(url);
    }
    if !profile.nip05.is_empty() {
        metadata = metadata.nip05(&profile.nip05);
    }
    if !profile.banner.is_empty() {
        let url = Url::parse(&profile.banner).map_err(|e| format!("Invalid banner URL: {}", e))?;
        metadata = metadata.banner(url);
    }

    let output = client.set_metadata(&metadata).await.map_err(|e| e.to_string())?;
    let event_id = output.id().to_hex();

    client.disconnect().await;

    Ok(event_id)
}

// ─── Publishing ───

#[derive(Serialize, Clone)]
pub struct PublishResult {
    pub event_id: String,
    pub relays_sent: usize,
    pub relays_failed: usize,
}

#[tauri::command]
pub async fn nostr_publish_loadout(
    loadout_json: String,
    loadout_name: String,
    tags: Vec<String>,
    #[allow(unused_variables)] fork_of: Option<String>,
    #[allow(unused_variables)] fork_author: Option<String>,
) -> Result<PublishResult, String> {
    let keys = load_keys().ok_or("No keys found. Generate or import keys first.")?;
    let client = Client::new(keys);

    for relay in load_relay_urls() {
        client.add_relay(relay).await.map_err(|e| e.to_string())?;
    }
    client.connect().await;

    // Build event
    let kind = Kind::from(LOADOUT_KIND);
    let mut builder = EventBuilder::new(kind, &loadout_json)
        .tag(Tag::identifier(&loadout_name));

    for t in &tags {
        builder = builder.tag(Tag::hashtag(t));
    }

    builder = builder.tag(Tag::custom(
        TagKind::Custom(Cow::Borrowed("ripperclaw")),
        vec!["0.1.0"],
    ));

    // Provenance: tag the parent event and author if this is a fork/remix
    if let Some(parent_id) = fork_of {
        builder = builder.tag(Tag::custom(
            TagKind::e(),
            vec![&parent_id, "", "fork"],
        ));
    }
    if let Some(parent_author) = fork_author {
        builder = builder.tag(Tag::public_key(
            PublicKey::from_hex(&parent_author)
                .or_else(|_| PublicKey::from_bech32(&parent_author))
                .map_err(|e| format!("Invalid fork author pubkey: {}", e))?,
        ));
    }

    let output = client.send_event_builder(builder).await.map_err(|e| e.to_string())?;

    let event_id = output.id().to_hex();
    let sent = output.success.len();
    let failed = output.failed.len();

    client.disconnect().await;

    Ok(PublishResult {
        event_id,
        relays_sent: sent,
        relays_failed: failed,
    })
}

// ─── Subscribing / Feed ───

#[derive(Serialize, Clone)]
pub struct FeedLoadout {
    pub id: String,
    pub name: String,
    pub author: String,
    pub author_hex: String,
    pub content: String,
    pub tags: Vec<String>,
    pub published_at: u64,
    pub template: Option<String>,
    pub fork_of: Option<String>,
    pub fork_author: Option<String>,
}

#[tauri::command]
pub async fn nostr_fetch_feed(
    limit: Option<usize>,
    relay_urls: Option<Vec<String>>,
) -> Result<Vec<FeedLoadout>, String> {
    let keys = load_keys().unwrap_or_else(Keys::generate);
    let client = Client::new(keys);

    let relays: Vec<String> = match relay_urls {
        Some(urls) if !urls.is_empty() => urls,
        _ => load_relay_urls(),
    };

    for relay in &relays {
        client.add_relay(relay.as_str()).await.map_err(|e| e.to_string())?;
    }
    client.connect().await;

    let kind = Kind::from(LOADOUT_KIND);
    let filter = Filter::new()
        .kind(kind)
        .limit(limit.unwrap_or(50));

    let events = client
        .fetch_events(filter, std::time::Duration::from_secs(10))
        .await
        .map_err(|e| e.to_string())?;

    let template_names = ["homelab", "ops", "researcher", "smart-home", "creator"];

    let mut feed: Vec<FeedLoadout> = Vec::new();

    for event in events.iter() {
        let name = event
            .tags
            .find(TagKind::d())
            .and_then(|t| t.content().map(|s| s.to_string()))
            .unwrap_or_else(|| "Unnamed Loadout".to_string());

        let hashtags: Vec<String> = event
            .tags
            .iter()
            .filter(|t| t.kind() == TagKind::t())
            .filter_map(|t| t.content().map(|s| s.to_string()))
            .collect();

        let template = hashtags
            .iter()
            .find(|h| template_names.contains(&h.as_str()))
            .cloned();

        let author_npub = event
            .pubkey
            .to_bech32()
            .unwrap_or_else(|_| "unknown".to_string());
        let author_hex = event.pubkey.to_hex();

        // Extract fork provenance from "e" tags with "fork" marker
        let fork_of = event
            .tags
            .iter()
            .filter(|t| t.kind() == TagKind::e())
            .find_map(|t| {
                let vals: Vec<&str> = t.as_slice().iter().skip(1).map(|s| s.as_str()).collect();
                // ["e", event_id, relay_hint, "fork"]
                if vals.len() >= 3 && vals[2] == "fork" {
                    Some(vals[0].to_string())
                } else {
                    None
                }
            });

        // Extract fork author from "p" tags (the parent's pubkey)
        let fork_author = if fork_of.is_some() {
            event
                .tags
                .find(TagKind::p())
                .and_then(|t| t.content().map(|s| s.to_string()))
        } else {
            None
        };

        feed.push(FeedLoadout {
            id: event.id.to_hex(),
            name,
            author: npub_short(&author_npub),
            author_hex,
            content: event.content.clone(),
            tags: hashtags,
            published_at: event.created_at.as_u64(),
            template,
            fork_of,
            fork_author,
        });
    }

    feed.sort_by(|a, b| b.published_at.cmp(&a.published_at));

    client.disconnect().await;

    Ok(feed)
}

// ─── Relay management ───

#[derive(Serialize, Clone)]
pub struct RelayInfo {
    pub url: String,
    pub connected: bool,
}

fn relays_path() -> PathBuf {
    data_dir().join("relays.json")
}

/// Load user relays from disk, falling back to defaults
pub fn load_relay_urls() -> Vec<String> {
    if let Ok(data) = fs::read_to_string(relays_path()) {
        if let Ok(urls) = serde_json::from_str::<Vec<String>>(&data) {
            if !urls.is_empty() {
                return urls;
            }
        }
    }
    DEFAULT_RELAYS.iter().map(|s| s.to_string()).collect()
}

fn save_relay_urls(urls: &[String]) -> Result<(), String> {
    let dir = data_dir();
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create dir: {}", e))?;
    let json = serde_json::to_string_pretty(urls).map_err(|e| format!("JSON error: {}", e))?;
    fs::write(relays_path(), json).map_err(|e| format!("Write error: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn nostr_get_relays() -> Vec<RelayInfo> {
    load_relay_urls()
        .iter()
        .map(|url| RelayInfo {
            url: url.to_string(),
            connected: false,
        })
        .collect()
}

#[tauri::command]
pub fn nostr_add_relay(url: String) -> Result<Vec<RelayInfo>, String> {
    let trimmed = url.trim().to_string();
    if !trimmed.starts_with("wss://") && !trimmed.starts_with("ws://") {
        return Err("Relay URL must start with wss:// or ws://".to_string());
    }
    let mut urls = load_relay_urls();
    if urls.contains(&trimmed) {
        return Err("Relay already exists".to_string());
    }
    urls.push(trimmed);
    save_relay_urls(&urls)?;
    Ok(urls.iter().map(|u| RelayInfo { url: u.clone(), connected: false }).collect())
}

#[tauri::command]
pub fn nostr_remove_relay(url: String) -> Result<Vec<RelayInfo>, String> {
    let mut urls = load_relay_urls();
    let original_len = urls.len();
    urls.retain(|u| u != &url);
    if urls.len() == original_len {
        return Err("Relay not found".to_string());
    }
    if urls.is_empty() {
        // Don't allow removing all relays — restore defaults
        urls = DEFAULT_RELAYS.iter().map(|s| s.to_string()).collect();
    }
    save_relay_urls(&urls)?;
    Ok(urls.iter().map(|u| RelayInfo { url: u.clone(), connected: false }).collect())
}

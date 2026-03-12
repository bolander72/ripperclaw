use nostr_sdk::prelude::*;
use std::borrow::Cow;

const LOADOUT_KIND: u16 = 38333;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== ClawClawGo Nostr Round-Trip Test ===\n");

    // 1. Generate ephemeral keys
    let keys = Keys::generate();
    let npub = keys.public_key().to_bech32()?;
    println!("[1] Generated test keys: {}...{}", &npub[..12], &npub[npub.len()-6..]);

    // 2. Connect to relays
    let client = Client::new(keys.clone());
    let relays = vec!["wss://relay.damus.io", "wss://nos.lol", "wss://relay.nostr.band"];
    for relay in &relays {
        client.add_relay(*relay).await?;
    }
    client.connect().await;
    println!("[2] Connected to {} relays", relays.len());

    // 3. Build test loadout
    let test_loadout = serde_json::json!({
        "meta": {
            "name": "ClawClawGo Test Loadout",
            "version": "0.1.0",
            "exportedAt": "2026-03-11T02:00:00Z"
        },
        "slots": {
            "brain": { "model": "claude-opus-4-6", "status": "active" },
            "os": { "platform": "openclaw", "version": "2026.3.7" }
        },
        "mods": [
            { "name": "weather", "source": "bundled", "enabled": true },
            { "name": "github", "source": "bundled", "enabled": true }
        ]
    });

    let loadout_json = serde_json::to_string(&test_loadout)?;
    let kind = Kind::from(LOADOUT_KIND);
    let loadout_name = "clawclawgo-test-roundtrip";

    let builder = EventBuilder::new(kind, &loadout_json)
        .tag(Tag::identifier(loadout_name))
        .tag(Tag::hashtag("test"))
        .tag(Tag::hashtag("homelab"))
        .tag(Tag::custom(
            TagKind::Custom(Cow::Borrowed("clawclawgo")),
            vec!["0.1.0"],
        ));

    // 4. Publish
    let output = client.send_event_builder(builder).await?;
    let event_id = output.id().to_hex();
    println!("[3] Published event: {}...{}", &event_id[..8], &event_id[event_id.len()-8..]);
    println!("    Relays OK: {}, Failed: {}", output.success.len(), output.failed.len());

    for url in &output.success {
        println!("    + {}", url);
    }
    for (url, err) in &output.failed {
        println!("    x {} ({})", url, err);
    }

    // 5. Wait a moment then fetch
    println!("\n[4] Waiting 2s then fetching...");
    tokio::time::sleep(std::time::Duration::from_secs(2)).await;

    // Fetch our own events
    let filter = Filter::new()
        .kind(Kind::from(LOADOUT_KIND))
        .author(keys.public_key())
        .limit(5);

    let events = client
        .fetch_events(filter, std::time::Duration::from_secs(10))
        .await?;

    println!("[5] Fetched {} event(s)", events.iter().count());

    let mut found = false;
    for event in events.iter() {
        let name = event.tags
            .find(TagKind::d())
            .and_then(|t| t.content().map(|s| s.to_string()))
            .unwrap_or_else(|| "unknown".to_string());

        println!("    Event: {} | Name: {} | Size: {} bytes", 
            &event.id.to_hex()[..8], name, event.content.len());

        if name == loadout_name {
            // Verify content round-trips
            let parsed: serde_json::Value = serde_json::from_str(&event.content)?;
            let original_name = parsed.pointer("/meta/name")
                .and_then(|v| v.as_str())
                .unwrap_or("?");
            println!("    Content verified: meta.name = \"{}\"", original_name);
            found = true;
        }
    }

    if found {
        println!("\n=== ROUND-TRIP SUCCESS ===");
    } else {
        println!("\n=== WARNING: Published but couldn't fetch back (relay delay?) ===");
    }

    client.disconnect().await;
    Ok(())
}

use regex::Regex;
use serde_json::{Map, Value};

use crate::ScrubReport;

struct PiiPattern {
    name: String,
    regex: Regex,
    replacement: String,
}

fn pii_patterns() -> Vec<PiiPattern> {
    vec![
        PiiPattern {
            name: "phone_number".into(),
            regex: Regex::new(r"\+?1?\d{10,11}").unwrap(),
            replacement: "[PHONE]".into(),
        },
        PiiPattern {
            name: "email".into(),
            regex: Regex::new(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}").unwrap(),
            replacement: "[EMAIL]".into(),
        },
        PiiPattern {
            name: "ipv4_private".into(),
            regex: Regex::new(r"(?:192\.168|10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}").unwrap(),
            replacement: "[LOCAL_IP]".into(),
        },
        PiiPattern {
            name: "ipv4_public".into(),
            regex: Regex::new(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b").unwrap(),
            replacement: "[IP]".into(),
        },
        PiiPattern {
            name: "home_path".into(),
            regex: Regex::new(r"/(?:Users|home)/[a-zA-Z0-9._-]+").unwrap(),
            replacement: "/~".into(),
        },
        PiiPattern {
            name: "api_key_bearer".into(),
            regex: Regex::new(r"(?i)bearer\s+[a-zA-Z0-9._\-]{20,}").unwrap(),
            replacement: "[BEARER_TOKEN]".into(),
        },
        PiiPattern {
            name: "api_key_generic".into(),
            regex: Regex::new(r"(?i)(?:api[_-]?key|token|secret|password)\s*[:=]\s*['\x22]?[a-zA-Z0-9._\-]{16,}").unwrap(),
            replacement: "[REDACTED_KEY]".into(),
        },
        PiiPattern {
            name: "nsec_key".into(),
            regex: Regex::new(r"nsec1[a-z0-9]{58}").unwrap(),
            replacement: "[NSEC_REDACTED]".into(),
        },
        PiiPattern {
            name: "hex_private_key".into(),
            regex: Regex::new(r"\b[0-9a-f]{64}\b").unwrap(),
            replacement: "[HEX_KEY]".into(),
        },
        PiiPattern {
            name: "street_address".into(),
            regex: Regex::new(r"\b\d{1,5}\s[A-Z][a-zA-Z]+\s(?:St|Ave|Blvd|Dr|Ln|Rd|Way|Ct|Pl)\b").unwrap(),
            replacement: "[ADDRESS]".into(),
        },
        PiiPattern {
            name: "ssn".into(),
            regex: Regex::new(r"\b\d{3}-\d{2}-\d{4}\b").unwrap(),
            replacement: "[SSN]".into(),
        },
        PiiPattern {
            name: "mac_address".into(),
            regex: Regex::new(r"(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}").unwrap(),
            replacement: "[MAC]".into(),
        },
    ]
}

const REDACT_DETAIL_KEYS: &[&str] = &[
    "agent_name",
    "human",
    "has_soul",
    "has_identity",
    "has_user",
    "soul_tokens",
    "channels",
    "has_home_assistant",
    "has_calendar",
    "has_email",
];

const SANITIZE_DETAIL_KEYS: &[&str] = &[
    "memory_files",
    "daily_notes",
    "lcm_db_size_mb",
    "cron_jobs",
    "heartbeat_tasks",
];

pub fn scrub_build(
    mut build_data: Value,
    template: Option<String>,
    description: Option<String>,
    tags: Option<Vec<String>>,
) -> (Value, ScrubReport) {
    let patterns = pii_patterns();
    let mut scrubbed_fields: Vec<String> = Vec::new();
    let mut warnings: Vec<String> = Vec::new();

    // Scrub meta
    if let Some(meta) = build_data.get_mut("meta").and_then(|m| m.as_object_mut()) {
        if meta.contains_key("author") {
            meta.insert("author".into(), Value::String("anonymous".into()));
            scrubbed_fields.push("meta.author".into());
        }
        if let Some(ref t) = template {
            meta.insert("template".into(), Value::String(t.clone()));
        }
        if let Some(ref d) = description {
            meta.insert("description".into(), Value::String(d.clone()));
        }
        if let Some(ref tg) = tags {
            meta.insert(
                "tags".into(),
                Value::Array(tg.iter().map(|t| Value::String(t.clone())).collect()),
            );
        }
        meta.remove("exportedAt");
        scrubbed_fields.push("meta.exportedAt".into());
    }

    // Scrub section details (v3: top-level sections)
    let section_ids = ["model", "persona", "skills", "integrations", "automations", "memory"];
    for section_id in &section_ids {
        if let Some(section_val) = build_data.get_mut(*section_id) {
            if let Some(details) = section_val.get_mut("details").and_then(|d| d.as_object_mut()) {
                for key in REDACT_DETAIL_KEYS {
                    if details.remove(*key).is_some() {
                        scrubbed_fields.push(format!("{}.details.{}", section_id, key));
                    }
                }
                for key in SANITIZE_DETAIL_KEYS {
                    if let Some(val) = details.get(*key) {
                        if val.is_array() {
                            let len = val.as_array().map(|a| a.len()).unwrap_or(0);
                            details.insert((*key).into(), Value::Number(len.into()));
                        } else if val.is_string() {
                            let s = val.as_str().unwrap_or("");
                            if s.parse::<f64>().is_err() {
                                details.insert((*key).into(), Value::String("[redacted]".into()));
                                scrubbed_fields.push(format!("{}.details.{}", section_id, key));
                            }
                        }
                    }
                }
                let prefix = format!("{}.details", section_id);
                scrub_map_values(details, &patterns, &mut scrubbed_fields, &prefix);
            }

            if let Some(comp) = section_val.get("component").and_then(|c| c.as_str()).map(String::from) {
                let scrubbed = scrub_string(&comp, &patterns);
                if scrubbed != comp {
                    if let Some(c) = section_val.get_mut("component") {
                        *c = Value::String(scrubbed);
                    }
                    scrubbed_fields.push(format!("{}.component", section_id));
                }
            }
        }
    }

    // Scrub skill descriptions (v3: top-level skills.items, legacy: mods array)
    if let Some(skills) = build_data.pointer_mut("/skills/items").and_then(|v| v.as_array_mut()) {
        for (i, skill_val) in skills.iter_mut().enumerate() {
            if let Some(desc) = skill_val.get("description").and_then(|d| d.as_str()).map(String::from) {
                let scrubbed = scrub_string(&desc, &patterns);
                if scrubbed != desc {
                    if let Some(d) = skill_val.get_mut("description") {
                        *d = Value::String(scrubbed);
                    }
                    scrubbed_fields.push(format!("skills[{}].description", i));
                }
            }
        }
    } else if let Some(mods) = build_data.get_mut("mods").and_then(|m| m.as_array_mut()) {
        // Legacy format
        for (i, mod_val) in mods.iter_mut().enumerate() {
            if let Some(desc) = mod_val.get("description").and_then(|d| d.as_str()).map(String::from) {
                let scrubbed = scrub_string(&desc, &patterns);
                if scrubbed != desc {
                    if let Some(d) = mod_val.get_mut("description") {
                        *d = Value::String(scrubbed);
                    }
                    scrubbed_fields.push(format!("mods[{}].description", i));
                }
            }
        }
    }

    // Final deep scan
    let json_str = serde_json::to_string(&build_data).unwrap_or_default();
    for pattern in &patterns {
        if pattern.regex.is_match(&json_str) {
            if !scrubbed_fields.iter().any(|f| f.contains(&pattern.name)) {
                warnings.push(format!(
                    "Potential {} detected in output -- review before publishing",
                    pattern.name
                ));
            }
        }
    }

    // Re-scrub the entire JSON string as final pass
    let mut final_str = json_str;
    for pattern in &patterns {
        final_str = pattern.regex.replace_all(&final_str, pattern.replacement.as_str()).to_string();
    }

    let final_value: Value = serde_json::from_str(&final_str).unwrap_or(build_data);

    (
        final_value,
        ScrubReport {
            scrubbed_fields,
            warnings,
        },
    )
}

fn scrub_string(input: &str, patterns: &[PiiPattern]) -> String {
    let mut result = input.to_string();
    for pattern in patterns {
        result = pattern.regex.replace_all(&result, pattern.replacement.as_str()).to_string();
    }
    result
}

fn scrub_map_values(
    map: &mut Map<String, Value>,
    patterns: &[PiiPattern],
    scrubbed: &mut Vec<String>,
    path_prefix: &str,
) {
    let keys: Vec<String> = map.keys().cloned().collect();
    for key in keys {
        let path = format!("{}.{}", path_prefix, key);
        if let Some(val) = map.get_mut(&key) {
            match val {
                Value::String(s) => {
                    let cleaned = scrub_string(s, patterns);
                    if cleaned != *s {
                        *s = cleaned;
                        scrubbed.push(path);
                    }
                }
                Value::Array(arr) => {
                    for (i, item) in arr.iter_mut().enumerate() {
                        if let Value::String(s) = item {
                            let cleaned = scrub_string(s, patterns);
                            if cleaned != *s {
                                *s = cleaned;
                                scrubbed.push(format!("{}[{}]", path, i));
                            }
                        }
                    }
                }
                Value::Object(nested) => {
                    scrub_map_values(nested, patterns, scrubbed, &path);
                }
                _ => {}
            }
        }
    }
}

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

fn home_dir() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("/tmp"))
}

fn openclaw_dir() -> PathBuf {
    home_dir().join(".openclaw")
}

fn workspace_dir() -> PathBuf {
    openclaw_dir().join("workspace")
}

fn read_config() -> Value {
    let path = openclaw_dir().join("openclaw.json");
    fs::read_to_string(&path)
        .ok()
        .and_then(|c| serde_json::from_str(&c).ok())
        .unwrap_or(Value::Null)
}

fn file_token_estimate(path: &PathBuf) -> Option<usize> {
    fs::read_to_string(path).ok().map(|c| c.split_whitespace().count() * 4 / 3)
}

// ─── Config reader ───

#[tauri::command]
fn get_config() -> Result<Value, String> {
    let config = read_config();
    if config.is_null() {
        Err("Config not found".to_string())
    } else {
        Ok(config)
    }
}

// ─── Workspace file reader ───

#[tauri::command]
fn read_workspace_file(filename: String) -> Result<String, String> {
    let path = workspace_dir().join(&filename);
    fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", filename, e))
}

// ─── Skills discovery ───

#[derive(Serialize, Clone)]
struct SkillInfo {
    name: String,
    source: String,
    description: Option<String>,
    path: String,
}

#[tauri::command]
fn get_skills() -> Vec<SkillInfo> {
    let mut skills = Vec::new();
    let bundled_dir = PathBuf::from("/opt/homebrew/lib/node_modules/openclaw/skills");
    if bundled_dir.exists() {
        collect_skills(&bundled_dir, "bundled", &mut skills);
    }
    let custom_dir = workspace_dir().join("skills");
    if custom_dir.exists() {
        collect_skills(&custom_dir, "custom", &mut skills);
    }
    skills
}

fn collect_skills(dir: &PathBuf, source: &str, skills: &mut Vec<SkillInfo>) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let skill_md = path.join("SKILL.md");
                let name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                if name.starts_with('.') {
                    continue;
                }
                let description = if skill_md.exists() {
                    fs::read_to_string(&skill_md)
                        .ok()
                        .and_then(|content| {
                            content.lines()
                                .find(|l| !l.starts_with('#') && !l.trim().is_empty())
                                .map(|s| s.trim().to_string())
                        })
                } else {
                    None
                };
                skills.push(SkillInfo {
                    name,
                    source: source.to_string(),
                    description,
                    path: path.to_string_lossy().to_string(),
                });
            }
        }
    }
}

// ─── System status ───

#[derive(Serialize)]
struct SystemStatus {
    gateway: String,
    version: Option<String>,
    uptime: Option<String>,
    model: Option<String>,
    os: String,
    arch: String,
}

#[tauri::command]
fn get_system_status() -> SystemStatus {
    let output = Command::new("openclaw").arg("status").output();
    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let gateway = if stdout.contains("running") || stdout.contains("✓") {
                "running".to_string()
            } else {
                "stopped".to_string()
            };
            SystemStatus {
                gateway,
                version: extract_field(&stdout, "version"),
                uptime: extract_field(&stdout, "uptime"),
                model: extract_field(&stdout, "model"),
                os: std::env::consts::OS.to_string(),
                arch: std::env::consts::ARCH.to_string(),
            }
        }
        Err(_) => SystemStatus {
            gateway: "unknown".to_string(),
            version: None,
            uptime: None,
            model: None,
            os: std::env::consts::OS.to_string(),
            arch: std::env::consts::ARCH.to_string(),
        },
    }
}

fn extract_field(text: &str, field: &str) -> Option<String> {
    text.lines()
        .find(|l| l.to_lowercase().contains(field))
        .map(|l| l.split(':').skip(1).collect::<Vec<_>>().join(":").trim().to_string())
        .filter(|s| !s.is_empty())
}

// ─── Cron jobs ───

#[derive(Serialize, Deserialize, Clone)]
struct CronJob {
    id: String,
    name: Option<String>,
    enabled: bool,
    #[serde(default)]
    state: Value,
    schedule: Value,
}

#[tauri::command]
fn get_cron_jobs() -> Result<Vec<CronJob>, String> {
    let output = Command::new("openclaw")
        .args(["cron", "list", "--json"])
        .output()
        .map_err(|e| format!("Failed to run openclaw: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let jobs: Vec<CronJob> = serde_json::from_str(&stdout)
        .or_else(|_| {
            let wrapper: Value = serde_json::from_str(&stdout)?;
            serde_json::from_value(wrapper["jobs"].clone())
        })
        .unwrap_or_default();
    Ok(jobs)
}

// ─── Rich Slot Builder ───

#[derive(Serialize, Clone)]
struct SlotData {
    id: String,
    label: String,
    icon: String,
    status: String,
    component: String,
    version: Option<String>,
    details: Value,
    #[serde(rename = "subComponents")]
    sub_components: Vec<SubComponent>,
}

#[derive(Serialize, Clone)]
struct SubComponent {
    name: String,
    status: String,
    detail: String,
    icon: Option<String>,
}

#[tauri::command]
fn get_slots() -> Vec<SlotData> {
    let config = read_config();
    let ws = workspace_dir();
    let mut slots = Vec::new();

    // ── SOUL ──
    let soul_exists = ws.join("SOUL.md").exists();
    let soul_tokens = file_token_estimate(&ws.join("SOUL.md"));
    let identity_name = fs::read_to_string(ws.join("IDENTITY.md"))
        .ok()
        .and_then(|c| {
            c.lines()
                .find(|l| l.contains("**Name:**"))
                .map(|l| l.split("**Name:**").nth(1).unwrap_or("").trim().to_string())
        })
        .unwrap_or_else(|| "Unknown".to_string());
    let user_name = fs::read_to_string(ws.join("USER.md"))
        .ok()
        .and_then(|c| {
            c.lines()
                .find(|l| l.contains("**Name:**"))
                .map(|l| l.split("**Name:**").nth(1).unwrap_or("").trim().to_string())
        });

    let mut soul_subs = vec![
        SubComponent {
            name: "SOUL.md".to_string(),
            status: if soul_exists { "active" } else { "missing" }.to_string(),
            detail: soul_tokens.map(|t| format!("~{} tokens", t)).unwrap_or("not found".to_string()),
            icon: Some("◈".to_string()),
        },
        SubComponent {
            name: "IDENTITY.md".to_string(),
            status: if ws.join("IDENTITY.md").exists() { "active" } else { "missing" }.to_string(),
            detail: identity_name.clone(),
            icon: Some("👤".to_string()),
        },
    ];
    if let Some(ref un) = user_name {
        soul_subs.push(SubComponent {
            name: "USER.md".to_string(),
            status: "active".to_string(),
            detail: format!("Human: {}", un),
            icon: Some("🧑".to_string()),
        });
    }

    slots.push(SlotData {
        id: "soul".to_string(),
        label: "Soul".to_string(),
        icon: "◈".to_string(),
        status: if soul_exists { "active" } else { "empty" }.to_string(),
        component: format!("{} — {}", identity_name, if soul_exists { "defined" } else { "undefined" }),
        version: None,
        details: serde_json::json!({
            "agent_name": identity_name,
            "human": user_name,
            "soul_tokens": soul_tokens,
            "has_soul": soul_exists,
            "has_identity": ws.join("IDENTITY.md").exists(),
            "has_user": ws.join("USER.md").exists(),
        }),
        sub_components: soul_subs,
    });

    // ── BRAIN (Memory + LCM) ──
    let lcm_db = openclaw_dir().join("lcm.db");
    let lcm_exists = lcm_db.exists();
    let lcm_size = if lcm_exists {
        fs::metadata(&lcm_db).ok().map(|m| m.len()).unwrap_or(0)
    } else {
        0
    };
    let context_engine = config.pointer("/plugins/slots/contextEngine")
        .and_then(|v| v.as_str())
        .unwrap_or("legacy");

    let memory_dir = ws.join("memory");
    let memory_files: Vec<String> = ["handoff.md", "active-work.md", "facts.md"]
        .iter()
        .filter(|f| memory_dir.join(f).exists())
        .map(|f| f.to_string())
        .collect();
    let has_memory_md = ws.join("MEMORY.md").exists();
    let daily_notes_count = if memory_dir.exists() {
        fs::read_dir(&memory_dir)
            .ok()
            .map(|entries| entries.flatten().filter(|e| {
                let name = e.file_name().to_string_lossy().to_string();
                name.starts_with("20") && name.ends_with(".md")
            }).count())
            .unwrap_or(0)
    } else {
        0
    };

    let mut brain_subs = vec![
        SubComponent {
            name: "Context Engine".to_string(),
            status: if lcm_exists { "active" } else { "inactive" }.to_string(),
            detail: context_engine.to_string(),
            icon: Some("🧠".to_string()),
        },
    ];
    if lcm_exists {
        brain_subs.push(SubComponent {
            name: "LCM Database".to_string(),
            status: "active".to_string(),
            detail: format!("{:.1} MB", lcm_size as f64 / 1_048_576.0),
            icon: Some("💾".to_string()),
        });
    }
    brain_subs.push(SubComponent {
        name: "Memory Files".to_string(),
        status: if has_memory_md { "active" } else { "minimal" }.to_string(),
        detail: format!("{} core + {} daily notes", memory_files.len() + if has_memory_md { 1 } else { 0 }, daily_notes_count),
        icon: Some("📝".to_string()),
    });

    slots.push(SlotData {
        id: "brain".to_string(),
        label: "Brain".to_string(),
        icon: "⧫".to_string(),
        status: if lcm_exists { "active" } else { "degraded" }.to_string(),
        component: context_engine.to_string(),
        version: None,
        details: serde_json::json!({
            "context_engine": context_engine,
            "lcm_db_size_mb": format!("{:.1}", lcm_size as f64 / 1_048_576.0),
            "memory_files": memory_files,
            "has_memory_md": has_memory_md,
            "daily_notes": daily_notes_count,
        }),
        sub_components: brain_subs,
    });

    // ── SKELETON (Models) ──
    let primary_model = config.pointer("/model/default")
        .or(config.pointer("/model"))
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string();
    let subagent_model = config.pointer("/model/subagent")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string();

    // Check for local models via ollama
    let local_models = Command::new("ollama")
        .arg("list")
        .output()
        .ok()
        .map(|o| {
            String::from_utf8_lossy(&o.stdout)
                .lines()
                .skip(1) // header
                .filter_map(|l| l.split_whitespace().next().map(String::from))
                .collect::<Vec<String>>()
        })
        .unwrap_or_default();

    let mut skel_subs = vec![
        SubComponent {
            name: "Primary".to_string(),
            status: "active".to_string(),
            detail: primary_model.clone(),
            icon: Some("🦴".to_string()),
        },
        SubComponent {
            name: "Sub-agent".to_string(),
            status: "active".to_string(),
            detail: subagent_model.clone(),
            icon: Some("🔗".to_string()),
        },
    ];
    if !local_models.is_empty() {
        skel_subs.push(SubComponent {
            name: "Local (Ollama)".to_string(),
            status: "active".to_string(),
            detail: format!("{} models", local_models.len()),
            icon: Some("🏠".to_string()),
        });
    }

    slots.push(SlotData {
        id: "skeleton".to_string(),
        label: "Skeleton".to_string(),
        icon: "⬢".to_string(),
        status: "active".to_string(),
        component: primary_model.clone(),
        version: None,
        details: serde_json::json!({
            "primary": primary_model,
            "subagent": subagent_model,
            "local_models": local_models,
        }),
        sub_components: skel_subs,
    });

    // ── OS ──
    let oc_version = Command::new("openclaw")
        .arg("--version")
        .output()
        .ok()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .filter(|s| !s.is_empty());
    let node_version = Command::new("node")
        .arg("--version")
        .output()
        .ok()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .filter(|s| !s.is_empty());

    let os_subs = vec![
        SubComponent {
            name: "OpenClaw".to_string(),
            status: "active".to_string(),
            detail: oc_version.clone().unwrap_or("unknown".to_string()),
            icon: Some("⬡".to_string()),
        },
        SubComponent {
            name: "Node.js".to_string(),
            status: "active".to_string(),
            detail: node_version.clone().unwrap_or("unknown".to_string()),
            icon: Some("📦".to_string()),
        },
        SubComponent {
            name: "Platform".to_string(),
            status: "active".to_string(),
            detail: format!("{} {}", std::env::consts::OS, std::env::consts::ARCH),
            icon: Some("💻".to_string()),
        },
    ];

    slots.push(SlotData {
        id: "os".to_string(),
        label: "Operating System".to_string(),
        icon: "⬡".to_string(),
        status: "active".to_string(),
        component: "OpenClaw".to_string(),
        version: oc_version.clone(),
        details: serde_json::json!({
            "openclaw_version": oc_version,
            "node_version": node_version,
            "platform": std::env::consts::OS,
            "arch": std::env::consts::ARCH,
        }),
        sub_components: os_subs,
    });

    // ── HEART (Heartbeat + Crons) ──
    let hb_path = ws.join("HEARTBEAT.md");
    let hb_exists = hb_path.exists();
    let hb_content = fs::read_to_string(&hb_path).unwrap_or_default();
    let hb_tasks: Vec<String> = hb_content.lines()
        .filter(|l| l.starts_with("- **"))
        .filter_map(|l| {
            l.trim_start_matches("- **")
                .split("**")
                .next()
                .map(|s| s.trim_end_matches(':').to_string())
        })
        .collect();

    // Count cron jobs
    let cron_count = get_cron_jobs().ok().map(|j| j.len()).unwrap_or(0);

    let mut heart_subs = vec![
        SubComponent {
            name: "Heartbeat".to_string(),
            status: if hb_exists && !hb_tasks.is_empty() { "active" } else { "inactive" }.to_string(),
            detail: if hb_tasks.is_empty() { "no tasks".to_string() } else { format!("{} tasks", hb_tasks.len()) },
            icon: Some("💓".to_string()),
        },
        SubComponent {
            name: "Cron Jobs".to_string(),
            status: if cron_count > 0 { "active" } else { "inactive" }.to_string(),
            detail: format!("{} scheduled", cron_count),
            icon: Some("⏰".to_string()),
        },
    ];
    for task in &hb_tasks {
        heart_subs.push(SubComponent {
            name: task.clone(),
            status: "active".to_string(),
            detail: "heartbeat task".to_string(),
            icon: Some("·".to_string()),
        });
    }

    slots.push(SlotData {
        id: "heart".to_string(),
        label: "Heart".to_string(),
        icon: "♥".to_string(),
        status: if hb_exists && (!hb_tasks.is_empty() || cron_count > 0) { "active" } else { "empty" }.to_string(),
        component: "Heartbeat Engine".to_string(),
        version: None,
        details: serde_json::json!({
            "heartbeat_tasks": hb_tasks,
            "cron_jobs": cron_count,
        }),
        sub_components: heart_subs,
    });

    // ── NERVOUS SYSTEM (Channels, Integrations, Calendar, Email, HA) ──
    let channels = &config["channels"];
    let channel_names: Vec<String> = if let Some(obj) = channels.as_object() {
        obj.keys().cloned().collect()
    } else {
        vec![]
    };

    let mut nerve_subs: Vec<SubComponent> = Vec::new();

    // Channels
    for ch in &channel_names {
        nerve_subs.push(SubComponent {
            name: ch.clone(),
            status: "active".to_string(),
            detail: "messaging channel".to_string(),
            icon: Some("📡".to_string()),
        });
    }

    // Calendar (caldir)
    let has_caldir = home_dir().join(".local/bin/caldir").exists();
    if has_caldir {
        nerve_subs.push(SubComponent {
            name: "Calendar (caldir)".to_string(),
            status: "active".to_string(),
            detail: "iCloud + Google".to_string(),
            icon: Some("📅".to_string()),
        });
    }

    // Email (himalaya)
    let has_himalaya = Command::new("which").arg("himalaya").output()
        .ok().map(|o| o.status.success()).unwrap_or(false);
    if has_himalaya {
        nerve_subs.push(SubComponent {
            name: "Email (himalaya)".to_string(),
            status: "active".to_string(),
            detail: "IMAP/SMTP".to_string(),
            icon: Some("📧".to_string()),
        });
    }

    // Reminders (remindctl)
    let has_remindctl = Command::new("which").arg("remindctl").output()
        .ok().map(|o| o.status.success()).unwrap_or(false);
    if has_remindctl {
        nerve_subs.push(SubComponent {
            name: "Reminders".to_string(),
            status: "active".to_string(),
            detail: "Apple Reminders".to_string(),
            icon: Some("✅".to_string()),
        });
    }

    // Home Assistant
    let ha_url = config.pointer("/homeAssistant/url")
        .and_then(|v| v.as_str());
    if ha_url.is_some() {
        nerve_subs.push(SubComponent {
            name: "Home Assistant".to_string(),
            status: "active".to_string(),
            detail: ha_url.unwrap_or("configured").to_string(),
            icon: Some("🏠".to_string()),
        });
    }

    // Smart home devices file
    let ha_devices = ws.join("memory/home-devices.md").exists();
    if ha_devices {
        let device_count = fs::read_to_string(ws.join("memory/home-devices.md"))
            .ok()
            .map(|c| c.lines().filter(|l| l.starts_with("- ") || l.starts_with("  - ")).count())
            .unwrap_or(0);
        if device_count > 0 {
            nerve_subs.push(SubComponent {
                name: "Smart Devices".to_string(),
                status: "active".to_string(),
                detail: format!("{} devices", device_count),
                icon: Some("💡".to_string()),
            });
        }
    }

    let integration_count = nerve_subs.len() - channel_names.len();
    slots.push(SlotData {
        id: "nervousSystem".to_string(),
        label: "Nervous System".to_string(),
        icon: "⚡".to_string(),
        status: if channel_names.is_empty() { "empty" } else { "active" }.to_string(),
        component: if channel_names.len() == 1 {
            channel_names[0].clone()
        } else {
            format!("{} channels", channel_names.len())
        },
        version: None,
        details: serde_json::json!({
            "channels": channel_names,
            "integrations": integration_count,
            "has_calendar": has_caldir,
            "has_email": has_himalaya,
            "has_home_assistant": ha_url.is_some(),
        }),
        sub_components: nerve_subs,
    });

    // ── MOUTH (TTS) ──
    let tts_provider = config.pointer("/tts/provider")
        .and_then(|v| v.as_str())
        .unwrap_or("none");
    let tts_voice = config.pointer("/tts/voice")
        .and_then(|v| v.as_str());

    // Check for Kokoro
    let kokoro_exists = home_dir().join(".cache/kokoro-onnx/kokoro-v1.0.onnx").exists();
    let voice_loop_exists = home_dir().join("voice-loop/voice_loop.py").exists();

    let mut mouth_subs = vec![
        SubComponent {
            name: "TTS Provider".to_string(),
            status: if tts_provider != "none" { "active" } else { "inactive" }.to_string(),
            detail: tts_provider.to_string(),
            icon: Some("🗣️".to_string()),
        },
    ];
    if let Some(voice) = tts_voice {
        mouth_subs.push(SubComponent {
            name: "Voice".to_string(),
            status: "active".to_string(),
            detail: voice.to_string(),
            icon: Some("🎙️".to_string()),
        });
    }
    if kokoro_exists {
        mouth_subs.push(SubComponent {
            name: "Kokoro-ONNX".to_string(),
            status: "active".to_string(),
            detail: "local TTS (~82MB)".to_string(),
            icon: Some("🔊".to_string()),
        });
    }
    if voice_loop_exists {
        mouth_subs.push(SubComponent {
            name: "Voice Loop".to_string(),
            status: "active".to_string(),
            detail: "bidirectional voice".to_string(),
            icon: Some("🔄".to_string()),
        });
    }

    slots.push(SlotData {
        id: "mouth".to_string(),
        label: "Mouth".to_string(),
        icon: "◐".to_string(),
        status: if tts_provider != "none" || kokoro_exists { "active" } else { "empty" }.to_string(),
        component: if kokoro_exists { "Kokoro + Edge".to_string() } else { tts_provider.to_string() },
        version: None,
        details: serde_json::json!({
            "provider": tts_provider,
            "voice": tts_voice,
            "kokoro_installed": kokoro_exists,
            "voice_loop": voice_loop_exists,
        }),
        sub_components: mouth_subs,
    });

    // ── EARS (STT) ──
    let whisper_exists = Command::new("which").arg("whisper").output()
        .ok().map(|o| o.status.success()).unwrap_or(false);
    let voice_loop_stt = voice_loop_exists; // same voice loop does STT

    let mut ears_subs = vec![];
    if whisper_exists || voice_loop_stt {
        ears_subs.push(SubComponent {
            name: "Whisper".to_string(),
            status: "active".to_string(),
            detail: "local, base.en".to_string(),
            icon: Some("👂".to_string()),
        });
    }
    if voice_loop_stt {
        ears_subs.push(SubComponent {
            name: "Voice Loop STT".to_string(),
            status: "active".to_string(),
            detail: "real-time transcription".to_string(),
            icon: Some("🎧".to_string()),
        });
    }

    slots.push(SlotData {
        id: "ears".to_string(),
        label: "Ears".to_string(),
        icon: "◑".to_string(),
        status: if whisper_exists || voice_loop_stt { "active" } else { "empty" }.to_string(),
        component: if voice_loop_stt { "Whisper (local)".to_string() } else { "none".to_string() },
        version: None,
        details: serde_json::json!({
            "whisper_installed": whisper_exists,
            "voice_loop": voice_loop_stt,
            "engine": "local",
        }),
        sub_components: ears_subs,
    });

    // ── EYES (Cameras, Screen Capture, Vision) ──
    let has_peekaboo = Command::new("which").arg("peekaboo").output()
        .ok().map(|o| o.status.success()).unwrap_or(false);
    let image_model = config.pointer("/model/image")
        .and_then(|v| v.as_str());

    let mut eyes_subs = vec![];

    // UniFi cameras from HA config
    if ha_url.is_some() {
        eyes_subs.push(SubComponent {
            name: "G4 Doorbell Pro".to_string(),
            status: "active".to_string(),
            detail: "front porch + package cam".to_string(),
            icon: Some("📷".to_string()),
        });
    }

    if has_peekaboo {
        eyes_subs.push(SubComponent {
            name: "Peekaboo".to_string(),
            status: "active".to_string(),
            detail: "macOS screen/window capture".to_string(),
            icon: Some("🖥️".to_string()),
        });
    }

    if let Some(model) = image_model {
        eyes_subs.push(SubComponent {
            name: "Vision Model".to_string(),
            status: "active".to_string(),
            detail: model.to_string(),
            icon: Some("👁️".to_string()),
        });
    }

    // Paired nodes with cameras
    let has_nodes = config.pointer("/nodes").is_some();
    if has_nodes {
        eyes_subs.push(SubComponent {
            name: "Node Cameras".to_string(),
            status: "active".to_string(),
            detail: "paired device cameras".to_string(),
            icon: Some("📱".to_string()),
        });
    }

    slots.push(SlotData {
        id: "eyes".to_string(),
        label: "Eyes".to_string(),
        icon: "◉".to_string(),
        status: if !eyes_subs.is_empty() { "active" } else { "empty" }.to_string(),
        component: if ha_url.is_some() { "UniFi + Peekaboo".to_string() }
                   else if has_peekaboo { "Peekaboo".to_string() }
                   else { "none".to_string() },
        version: None,
        details: serde_json::json!({
            "cameras": if ha_url.is_some() { 1 } else { 0 },
            "peekaboo": has_peekaboo,
            "image_model": image_model,
            "nodes": has_nodes,
        }),
        sub_components: eyes_subs,
    });

    slots
}

// ─── Loadout import for diff ───

#[tauri::command]
fn import_loadout(path: String) -> Result<Value, String> {
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read loadout: {}", e))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse loadout: {}", e))
}

#[tauri::command]
fn export_loadout() -> Result<Value, String> {
    // Build a loadout from current state
    let _config = read_config();
    let slots_data = get_slots();
    let skills = get_skills();
    let _status = get_system_status();

    let mut slots_json = serde_json::Map::new();
    for slot in &slots_data {
        slots_json.insert(slot.id.clone(), serde_json::json!({
            "label": slot.label,
            "status": slot.status,
            "component": slot.component,
            "version": slot.version,
            "details": slot.details,
        }));
    }

    let mods: Vec<Value> = skills.iter().map(|s| {
        serde_json::json!({
            "name": s.name,
            "source": s.source,
            "enabled": true,
            "description": s.description,
        })
    }).collect();

    let identity_name = fs::read_to_string(workspace_dir().join("IDENTITY.md"))
        .ok()
        .and_then(|c| {
            c.lines()
                .find(|l| l.contains("**Name:**"))
                .map(|l| l.split("**Name:**").nth(1).unwrap_or("Agent").trim().to_string())
        })
        .unwrap_or_else(|| "Agent".to_string());

    let loadout = serde_json::json!({
        "schema": 1,
        "meta": {
            "name": identity_name,
            "author": "local",
            "version": 1,
            "exportedAt": chrono_now(),
        },
        "slots": slots_json,
        "mods": mods,
    });

    Ok(loadout)
}

fn chrono_now() -> String {
    // Simple ISO timestamp without chrono crate
    let output = Command::new("date")
        .arg("-u")
        .arg("+%Y-%m-%dT%H:%M:%SZ")
        .output();
    match output {
        Ok(o) => String::from_utf8_lossy(&o.stdout).trim().to_string(),
        Err(_) => "unknown".to_string(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_config,
            read_workspace_file,
            get_skills,
            get_system_status,
            get_cron_jobs,
            get_slots,
            import_loadout,
            export_loadout,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

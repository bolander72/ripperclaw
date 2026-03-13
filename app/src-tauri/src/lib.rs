mod nostr;
mod scrub;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

// Build schema embedded at compile time
const BUILD_SCHEMA_JSON: &str = include_str!("../../../specs/build.schema.json");

fn validate_build_schema(build: &Value) -> Result<(), Vec<String>> {
    let schema: Value = serde_json::from_str(BUILD_SCHEMA_JSON)
        .expect("embedded build schema is invalid JSON");
    let validator = jsonschema::validator_for(&schema)
        .map_err(|e| vec![format!("Failed to compile schema: {}", e)])?;

    let errors: Vec<String> = validator
        .iter_errors(build)
        .map(|e| {
            let path = e.instance_path.to_string();
            if path.is_empty() {
                format!("{}", e)
            } else {
                format!("{}: {}", path, e)
            }
        })
        .collect();

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

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

// ─── Agent discovery ───

#[derive(Serialize, Clone)]
struct AgentInfo {
    id: String,
    name: Option<String>,
    is_default: bool,
    workspace: Option<String>,
    model: Option<String>,
    skill_count: Option<usize>,
}

#[tauri::command]
fn get_agents() -> Vec<AgentInfo> {
    let config = read_config();
    let mut agents = Vec::new();

    // Read agents.list array
    if let Some(list) = config.pointer("/agents/list").and_then(|v| v.as_array()) {
        for entry in list {
            let id = entry.get("id").and_then(|v| v.as_str()).unwrap_or("unknown").to_string();
            let name = entry.get("name").and_then(|v| v.as_str()).map(|s| s.to_string());
            let is_default = entry.get("default").and_then(|v| v.as_bool()).unwrap_or(false);
            let workspace = entry.get("workspace").and_then(|v| v.as_str()).map(|s| s.to_string());
            let model = entry.get("model").and_then(|v| {
                // model can be a string or object with .primary
                if let Some(s) = v.as_str() { Some(s.to_string()) }
                else { v.pointer("/primary").and_then(|p| p.as_str()).map(|s| s.to_string()) }
            });
            let skill_count = entry.get("skills").and_then(|v| v.as_array()).map(|a| a.len());

            agents.push(AgentInfo { id, name, is_default, workspace, model, skill_count });
        }
    }

    // If no agents.list, synthesize one from defaults
    if agents.is_empty() {
        let defaults = config.pointer("/agents/defaults");
        let model = defaults
            .and_then(|d| d.pointer("/model/primary"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let workspace = defaults
            .and_then(|d| d.get("workspace"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        // Try to get agent name from IDENTITY.md
        let ws = workspace.as_ref()
            .map(|w| PathBuf::from(w))
            .unwrap_or_else(|| workspace_dir());
        let name = fs::read_to_string(ws.join("IDENTITY.md"))
            .ok()
            .and_then(|c| {
                c.lines()
                    .find(|l| l.contains("**Name:**"))
                    .map(|l| l.split("**Name:**").nth(1).unwrap_or("").trim().to_string())
            });

        agents.push(AgentInfo {
            id: "main".to_string(),
            name,
            is_default: true,
            workspace,
            model,
            skill_count: None,
        });
    }

    agents
}

/// Resolve workspace path for a given agent ID
fn resolve_agent_workspace(agent_id: &str) -> PathBuf {
    let config = read_config();
    if let Some(list) = config.pointer("/agents/list").and_then(|v| v.as_array()) {
        for entry in list {
            let id = entry.get("id").and_then(|v| v.as_str()).unwrap_or("");
            if id == agent_id {
                if let Some(ws) = entry.get("workspace").and_then(|v| v.as_str()) {
                    return PathBuf::from(ws);
                }
            }
        }
    }
    // Fallback to default workspace
    let default_ws = config.pointer("/agents/defaults/workspace")
        .and_then(|v| v.as_str())
        .map(|s| PathBuf::from(s));
    default_ws.unwrap_or_else(|| workspace_dir())
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
struct BlockData {
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
fn get_blocks(agent_id: Option<String>) -> Vec<BlockData> {
    let config = read_config();
    let ws = agent_id.as_ref()
        .map(|id| resolve_agent_workspace(id))
        .unwrap_or_else(|| workspace_dir());
    let mut blocks_list = Vec::new();

    // ── MODEL ──
    let primary_model = config.pointer("/model/default")
        .or(config.pointer("/model"))
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string();
    let subagent_model = config.pointer("/model/subagent")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string();

    let local_models = Command::new("ollama")
        .arg("list")
        .output()
        .ok()
        .map(|o| {
            String::from_utf8_lossy(&o.stdout)
                .lines()
                .skip(1)
                .filter_map(|l| l.split_whitespace().next().map(String::from))
                .collect::<Vec<String>>()
        })
        .unwrap_or_default();

    let mut model_subs = vec![
        SubComponent {
            name: "Primary".to_string(),
            status: "active".to_string(),
            detail: primary_model.clone(),
            icon: Some("🧠".to_string()),
        },
        SubComponent {
            name: "Sub-agent".to_string(),
            status: "active".to_string(),
            detail: subagent_model.clone(),
            icon: Some("🔗".to_string()),
        },
    ];
    if !local_models.is_empty() {
        model_subs.push(SubComponent {
            name: "Local (Ollama)".to_string(),
            status: "active".to_string(),
            detail: format!("{} models", local_models.len()),
            icon: Some("🏠".to_string()),
        });
    }

    blocks_list.push(BlockData {
        id: "model".to_string(),
        label: "Model".to_string(),
        icon: "⬢".to_string(),
        status: "active".to_string(),
        component: primary_model.clone(),
        version: None,
        details: serde_json::json!({
            "primary": primary_model,
            "subagent": subagent_model,
            "local_models": local_models,
        }),
        sub_components: model_subs,
    });

    // ── PERSONA ──
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

    let mut persona_subs = vec![
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
        persona_subs.push(SubComponent {
            name: "USER.md".to_string(),
            status: "active".to_string(),
            detail: format!("Human: {}", un),
            icon: Some("🧑".to_string()),
        });
    }

    blocks_list.push(BlockData {
        id: "persona".to_string(),
        label: "Persona".to_string(),
        icon: "◈".to_string(),
        status: if soul_exists { "active" } else { "empty" }.to_string(),
        component: format!("{} - {}", identity_name, if soul_exists { "defined" } else { "undefined" }),
        version: None,
        details: serde_json::json!({
            "agent_name": identity_name,
            "human": user_name,
            "soul_tokens": soul_tokens,
            "has_soul": soul_exists,
            "has_identity": ws.join("IDENTITY.md").exists(),
            "has_user": ws.join("USER.md").exists(),
        }),
        sub_components: persona_subs,
    });

    // ── SKILLS ──
    let all_skills = get_skills();
    let bundled_count = all_skills.iter().filter(|s| s.source == "bundled").count();
    let custom_count = all_skills.iter().filter(|s| s.source == "custom").count();

    let mut skills_subs: Vec<SubComponent> = vec![
        SubComponent {
            name: "Bundled".to_string(),
            status: "active".to_string(),
            detail: format!("{} skills", bundled_count),
            icon: Some("📦".to_string()),
        },
    ];
    if custom_count > 0 {
        skills_subs.push(SubComponent {
            name: "Custom".to_string(),
            status: "active".to_string(),
            detail: format!("{} skills", custom_count),
            icon: Some("🔧".to_string()),
        });
    }
    // List individual skills (up to 10)
    for skill in all_skills.iter().take(10) {
        skills_subs.push(SubComponent {
            name: skill.name.clone(),
            status: "active".to_string(),
            detail: skill.source.clone(),
            icon: Some("⚡".to_string()),
        });
    }
    if all_skills.len() > 10 {
        skills_subs.push(SubComponent {
            name: format!("+{} more", all_skills.len() - 10),
            status: "active".to_string(),
            detail: "".to_string(),
            icon: Some("…".to_string()),
        });
    }

    blocks_list.push(BlockData {
        id: "skills".to_string(),
        label: "Skills".to_string(),
        icon: "⚡".to_string(),
        status: if all_skills.is_empty() { "empty" } else { "active" }.to_string(),
        component: format!("{} installed", all_skills.len()),
        version: None,
        details: serde_json::json!({
            "total": all_skills.len(),
            "bundled": bundled_count,
            "custom": custom_count,
            "names": all_skills.iter().map(|s| &s.name).collect::<Vec<_>>(),
        }),
        sub_components: skills_subs,
    });

    // ── INTEGRATIONS (Channels + Tools + Voice I/O + Cameras) ──
    let channels = &config["channels"];
    let channel_names: Vec<String> = if let Some(obj) = channels.as_object() {
        obj.keys().cloned().collect()
    } else {
        vec![]
    };

    let mut integ_subs: Vec<SubComponent> = Vec::new();

    // Messaging channels
    for ch in &channel_names {
        integ_subs.push(SubComponent {
            name: ch.clone(),
            status: "active".to_string(),
            detail: "messaging channel".to_string(),
            icon: Some("📡".to_string()),
        });
    }

    // Calendar (caldir)
    let has_caldir = home_dir().join(".local/bin/caldir").exists();
    if has_caldir {
        integ_subs.push(SubComponent {
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
        integ_subs.push(SubComponent {
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
        integ_subs.push(SubComponent {
            name: "Reminders".to_string(),
            status: "active".to_string(),
            detail: "Apple Reminders".to_string(),
            icon: Some("✅".to_string()),
        });
    }

    // Home Assistant
    let ha_url_config = config.pointer("/homeAssistant/url")
        .and_then(|v| v.as_str());
    let tools_md = fs::read_to_string(ws.join("TOOLS.md")).unwrap_or_default();
    let ha_in_tools = tools_md.contains("Home Assistant") || tools_md.contains("home_assistant");
    let ha_url = ha_url_config.or(if ha_in_tools { Some("via TOOLS.md") } else { None });
    if ha_url.is_some() {
        integ_subs.push(SubComponent {
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
            integ_subs.push(SubComponent {
                name: "Smart Devices".to_string(),
                status: "active".to_string(),
                detail: format!("{} devices", device_count),
                icon: Some("💡".to_string()),
            });
        }
    }

    // Paired nodes
    let paired_file = openclaw_dir().join("devices/paired.json");
    let paired_count = fs::read_to_string(&paired_file)
        .ok()
        .and_then(|c| serde_json::from_str::<Value>(&c).ok())
        .and_then(|v| v.as_array().map(|a| a.len()))
        .unwrap_or(0);
    if paired_count > 0 {
        integ_subs.push(SubComponent {
            name: "Paired Nodes".to_string(),
            status: "active".to_string(),
            detail: format!("{} device{}", paired_count, if paired_count == 1 { "" } else { "s" }),
            icon: Some("🔗".to_string()),
        });
    }

    // Git/GitHub
    let has_gh = Command::new("which").arg("gh").output()
        .ok().map(|o| o.status.success()).unwrap_or(false);
    if has_gh {
        integ_subs.push(SubComponent {
            name: "GitHub CLI".to_string(),
            status: "active".to_string(),
            detail: "gh".to_string(),
            icon: Some("🐙".to_string()),
        });
    }

    // Apple Notes (memo CLI)
    let has_memo = Command::new("which").arg("memo").output()
        .ok().map(|o| o.status.success()).unwrap_or(false);
    if has_memo {
        integ_subs.push(SubComponent {
            name: "Apple Notes".to_string(),
            status: "active".to_string(),
            detail: "memo CLI".to_string(),
            icon: Some("📒".to_string()),
        });
    }

    // Voice I/O (TTS + STT, folded into integrations)
    let tts_provider = config.pointer("/tts/provider")
        .and_then(|v| v.as_str())
        .unwrap_or("none");
    let kokoro_exists = home_dir().join(".cache/kokoro-onnx/kokoro-v1.0.onnx").exists();
    let voice_loop_exists = home_dir().join("voice-loop/voice_loop.py").exists();
    if kokoro_exists {
        integ_subs.push(SubComponent {
            name: "Kokoro-ONNX (TTS)".to_string(),
            status: "active".to_string(),
            detail: "local voice output".to_string(),
            icon: Some("🗣️".to_string()),
        });
    } else if tts_provider != "none" {
        integ_subs.push(SubComponent {
            name: format!("TTS ({})", tts_provider),
            status: "active".to_string(),
            detail: "voice output".to_string(),
            icon: Some("🗣️".to_string()),
        });
    }

    let whisper_exists = Command::new("which").arg("whisper").output()
        .ok().map(|o| o.status.success()).unwrap_or(false);
    if whisper_exists || voice_loop_exists {
        integ_subs.push(SubComponent {
            name: "Whisper (STT)".to_string(),
            status: "active".to_string(),
            detail: "local voice input".to_string(),
            icon: Some("👂".to_string()),
        });
    }

    if voice_loop_exists {
        integ_subs.push(SubComponent {
            name: "Voice Loop".to_string(),
            status: "active".to_string(),
            detail: "bidirectional voice".to_string(),
            icon: Some("🔄".to_string()),
        });
    }

    // Cameras + Vision
    let has_peekaboo = Command::new("which").arg("peekaboo").output()
        .ok().map(|o| o.status.success()).unwrap_or(false);
    let image_model = config.pointer("/model/image")
        .and_then(|v| v.as_str());
    if ha_url.is_some() {
        integ_subs.push(SubComponent {
            name: "UniFi Cameras".to_string(),
            status: "active".to_string(),
            detail: "via Home Assistant".to_string(),
            icon: Some("📷".to_string()),
        });
    }
    if has_peekaboo {
        integ_subs.push(SubComponent {
            name: "Peekaboo".to_string(),
            status: "active".to_string(),
            detail: "macOS screen capture".to_string(),
            icon: Some("🖥️".to_string()),
        });
    }
    if let Some(model) = image_model {
        integ_subs.push(SubComponent {
            name: "Vision Model".to_string(),
            status: "active".to_string(),
            detail: model.to_string(),
            icon: Some("👁️".to_string()),
        });
    }

    blocks_list.push(BlockData {
        id: "integrations".to_string(),
        label: "Integrations".to_string(),
        icon: "⚡".to_string(),
        status: if integ_subs.is_empty() { "empty" } else { "active" }.to_string(),
        component: format!("{} connected", integ_subs.len()),
        version: None,
        details: serde_json::json!({
            "channels": channel_names,
            "total": integ_subs.len(),
            "has_calendar": has_caldir,
            "has_email": has_himalaya,
            "has_home_assistant": ha_url.is_some(),
            "has_voice": kokoro_exists || tts_provider != "none",
            "has_stt": whisper_exists || voice_loop_exists,
            "has_cameras": has_peekaboo || ha_url.is_some(),
        }),
        sub_components: integ_subs,
    });

    // ── AUTOMATIONS (Heartbeat + Crons) ──
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

    let cron_count = get_cron_jobs().ok().map(|j| j.len()).unwrap_or(0);

    let mut auto_subs = vec![
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
        auto_subs.push(SubComponent {
            name: task.clone(),
            status: "active".to_string(),
            detail: "heartbeat task".to_string(),
            icon: Some("·".to_string()),
        });
    }

    blocks_list.push(BlockData {
        id: "automations".to_string(),
        label: "Automations".to_string(),
        icon: "⏱".to_string(),
        status: if hb_exists && (!hb_tasks.is_empty() || cron_count > 0) { "active" } else { "empty" }.to_string(),
        component: format!("{} heartbeat + {} cron", hb_tasks.len(), cron_count),
        version: None,
        details: serde_json::json!({
            "heartbeat_tasks": hb_tasks,
            "cron_jobs": cron_count,
        }),
        sub_components: auto_subs,
    });

    // ── MEMORY ──
    let lcm_db = openclaw_dir().join("lcm.db");
    let lcm_exists = lcm_db.exists();
    let lcm_size = if lcm_exists {
        fs::metadata(&lcm_db).ok().map(|m| m.len()).unwrap_or(0)
    } else {
        0
    };
    let context_engine = config.pointer("/plugins/blocks/contextEngine")
        .or(config.pointer("/plugins/slots/contextEngine")) // fallback for old configs
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

    let plugins_allow = config.pointer("/plugins/allow")
        .and_then(|v| v.as_array())
        .map(|a| a.iter().filter_map(|v| v.as_str().map(String::from)).collect::<Vec<_>>())
        .unwrap_or_default();

    let mut mem_subs = vec![
        SubComponent {
            name: "Context Engine".to_string(),
            status: if lcm_exists { "active" } else { "inactive" }.to_string(),
            detail: context_engine.to_string(),
            icon: Some("🧠".to_string()),
        },
    ];
    if lcm_exists {
        mem_subs.push(SubComponent {
            name: "LCM Database".to_string(),
            status: "active".to_string(),
            detail: format!("{:.1} MB", lcm_size as f64 / 1_048_576.0),
            icon: Some("💾".to_string()),
        });
    }
    mem_subs.push(SubComponent {
        name: "Memory Files".to_string(),
        status: if has_memory_md { "active" } else { "minimal" }.to_string(),
        detail: format!("{} core + {} daily notes", memory_files.len() + if has_memory_md { 1 } else { 0 }, daily_notes_count),
        icon: Some("📝".to_string()),
    });
    if !plugins_allow.is_empty() {
        mem_subs.push(SubComponent {
            name: "Plugins".to_string(),
            status: "active".to_string(),
            detail: plugins_allow.join(", "),
            icon: Some("🔌".to_string()),
        });
    }

    blocks_list.push(BlockData {
        id: "memory".to_string(),
        label: "Memory".to_string(),
        icon: "◉".to_string(),
        status: if lcm_exists || has_memory_md { "active" } else { "empty" }.to_string(),
        component: context_engine.to_string(),
        version: None,
        details: serde_json::json!({
            "context_engine": context_engine,
            "lcm_db_size_mb": format!("{:.1}", lcm_size as f64 / 1_048_576.0),
            "memory_files": memory_files,
            "has_memory_md": has_memory_md,
            "daily_notes": daily_notes_count,
            "plugins": plugins_allow,
        }),
        sub_components: mem_subs,
    });

    blocks_list
}

// ─── Build import for diff ───

#[tauri::command]
fn import_build(path: String) -> Result<Value, String> {
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read build_cfg: {}", e))?;
    let build: Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse build_cfg: {}", e))?;

    // Schema v2 builds get full validation; legacy builds skip it
    if build.get("schema").and_then(|s| s.as_u64()) == Some(2) {
        if let Err(errors) = validate_build_schema(&build) {
            return Err(format!("Schema validation failed:\n- {}", errors.join("\n- ")));
        }
    }

    Ok(build)
}

#[tauri::command]
fn export_build() -> Result<Value, String> {
    // Build a build (schema v2) from current state
    let _config = read_config();
    let _blocks_data = get_blocks(None);
    let skills = get_skills();
    let _status = get_system_status();

    let ws = workspace_dir();

    // Skills block
    let skills_items: Vec<Value> = skills.iter().map(|s| {
        serde_json::json!({
            "name": s.name,
            "source": s.source,
            "description": s.description,
        })
    }).collect();

    let identity_name = fs::read_to_string(ws.join("IDENTITY.md"))
        .ok()
        .and_then(|c| {
            c.lines()
                .find(|l| l.contains("**Name:**"))
                .map(|l| l.split("**Name:**").nth(1).unwrap_or("Agent").trim().to_string())
        })
        .unwrap_or_else(|| "Agent".to_string());

    let build = serde_json::json!({
        "schema": 2,
        "meta": {
            "name": identity_name.clone(),
            "agentName": identity_name,
            "author": "local",
            "version": 1,
            "exportedAt": chrono_now(),
        },
        "blocks": {
            "skills": {
                "items": skills_items
            }
        }
    });

    Ok(build)
}

// ─── PII-safe export for publishing ───

#[derive(Serialize)]
struct ScrubReport {
    scrubbed_fields: Vec<String>,
    warnings: Vec<String>,
}

#[tauri::command]
fn export_build_safe(
    template: Option<String>,
    description: Option<String>,
    tags: Option<Vec<String>>,
) -> Result<(Value, ScrubReport), String> {
    let raw = export_build()?;
    let (scrubbed, report) = scrub::scrub_build(raw, template, description, tags);
    Ok((scrubbed, report))
}

// ─── Clone build_cfg (apply another build_cfg) ───

#[derive(Serialize)]
struct CloneResult {
    applied_skills: Vec<String>,
    skipped_skills: Vec<String>,
    block_changes: Vec<String>,
    backup_path: Option<String>,
}

#[tauri::command]
fn clone_build(build_json: String, mode: String, agent_id: Option<String>) -> Result<CloneResult, String> {
    let build_cfg: Value = serde_json::from_str(&build_json)
        .map_err(|e| format!("Invalid build_cfg JSON: {}", e))?;

    let builds_dir = workspace_dir().join("builds");
    let _ = fs::create_dir_all(&builds_dir);

    if mode == "new" {
        // Save as a new named build_cfg file
        let name = build_cfg.pointer("/meta/name")
            .and_then(|v| v.as_str())
            .unwrap_or("imported-build_cfg");
        let safe_name: String = name.chars()
            .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '-' })
            .collect();
        let timestamp = chrono_now().replace(':', "-").replace('T', "_");
        let filename = format!("{}-{}.build_cfg.json", safe_name, timestamp);
        let path = builds_dir.join(&filename);

        fs::write(&path, serde_json::to_string_pretty(&build_cfg).unwrap_or_default())
            .map_err(|e| format!("Failed to write build_cfg: {}", e))?;

        return Ok(CloneResult {
            applied_skills: vec![],
            skipped_skills: vec![],
            block_changes: vec![format!("Saved as {}", filename)],
            backup_path: Some(path.to_string_lossy().to_string()),
        });
    }

    // Mode: "overwrite" - apply build_cfg to an existing agent
    let target_workspace = match &agent_id {
        Some(id) => resolve_agent_workspace(id),
        None => workspace_dir(),
    };

    // Backup current config
    let config_path = openclaw_dir().join("openclaw.json");
    let backup_name = format!("openclaw.backup-{}.json", chrono_now().replace(':', "-"));
    let backup_path = openclaw_dir().join(&backup_name);
    if config_path.exists() {
        let _ = fs::copy(&config_path, &backup_path);
    }

    let mut applied_skills: Vec<String> = Vec::new();
    let mut skipped_skills: Vec<String> = Vec::new();
    let mut block_changes: Vec<String> = Vec::new();

    // ── Persona: write SOUL.md, IDENTITY.md, AGENTS.md if included ──
    if let Some(persona) = build_cfg.pointer("/blocks/persona") {
        if let Some(identity) = persona.get("identity") {
            let name = identity.get("name").and_then(|v| v.as_str()).unwrap_or("Agent");
            let creature = identity.get("creature").and_then(|v| v.as_str()).unwrap_or("AI assistant");
            let vibe = identity.get("vibe").and_then(|v| v.as_str()).unwrap_or("");
            let content = format!(
                "# IDENTITY.md - Who Am I?\n\n- **Name:** {}\n- **Creature:** {}\n- **Vibe:** {}\n",
                name, creature, vibe
            );
            fs::write(target_workspace.join("IDENTITY.md"), &content)
                .map_err(|e| format!("Write IDENTITY.md: {}", e))?;
            block_changes.push(format!("persona: wrote IDENTITY.md ({})", name));
        }

        if let Some(soul) = persona.get("soul") {
            if soul.get("included").and_then(|v| v.as_bool()).unwrap_or(false) {
                if let Some(content) = soul.get("content").and_then(|v| v.as_str()) {
                    fs::write(target_workspace.join("SOUL.md"), content)
                        .map_err(|e| format!("Write SOUL.md: {}", e))?;
                    block_changes.push("persona: wrote SOUL.md".to_string());
                }
            }
        }

        if let Some(agents_md) = persona.get("agents") {
            if agents_md.get("included").and_then(|v| v.as_bool()).unwrap_or(false) {
                if let Some(content) = agents_md.get("content").and_then(|v| v.as_str()) {
                    fs::write(target_workspace.join("AGENTS.md"), content)
                        .map_err(|e| format!("Write AGENTS.md: {}", e))?;
                    block_changes.push("persona: wrote AGENTS.md".to_string());
                }
            }
        }
    }

    // ── Skills: install from ClawHub, track bundled ──
    if let Some(skills) = build_cfg.pointer("/blocks/skills/items").and_then(|v| v.as_array()) {
        let skills_dir = target_workspace.join("skills");
        let _ = fs::create_dir_all(&skills_dir);

        for skill in skills {
            let name = skill.get("name").and_then(|n| n.as_str()).unwrap_or("");
            let source = skill.get("source").and_then(|s| s.as_str()).unwrap_or("");
            if name.is_empty() { continue; }

            if source == "bundled" {
                // Bundled skills are inherited from defaults, just note them
                applied_skills.push(format!("{} (bundled)", name));
                continue;
            }

            // Check if already installed in target workspace
            if skills_dir.join(name).exists() {
                applied_skills.push(format!("{} (already installed)", name));
                continue;
            }

            // Try installing from ClawHub
            let result = Command::new("clawhub")
                .args(["install", name, "--workdir", &target_workspace.to_string_lossy(), "--no-input"])
                .output();
            match result {
                Ok(output) if output.status.success() => {
                    applied_skills.push(name.to_string());
                }
                _ => {
                    skipped_skills.push(format!("{} (source: {}, install failed)", name, source));
                }
            }
        }
        if !applied_skills.is_empty() || !skipped_skills.is_empty() {
            block_changes.push(format!("skills: {} installed, {} skipped", applied_skills.len(), skipped_skills.len()));
        }
    } else if let Some(mods) = build_cfg.get("mods").and_then(|m| m.as_array()) {
        // Legacy format: check mods array
        let skills_dir = target_workspace.join("skills");
        let _ = fs::create_dir_all(&skills_dir);

        for m in mods {
            let name = m.get("name").and_then(|n| n.as_str()).unwrap_or("");
            let source = m.get("source").and_then(|s| s.as_str()).unwrap_or("");
            if name.is_empty() { continue; }

            let bundled = PathBuf::from("/opt/homebrew/lib/node_modules/openclaw/skills").join(name);
            let custom = skills_dir.join(name);

            if bundled.exists() || custom.exists() {
                applied_skills.push(name.to_string());
            } else if source == "custom" {
                // Try ClawHub install
                let result = Command::new("clawhub")
                    .args(["install", name, "--workdir", &target_workspace.to_string_lossy(), "--no-input"])
                    .output();
                match result {
                    Ok(output) if output.status.success() => {
                        applied_skills.push(name.to_string());
                    }
                    _ => {
                        skipped_skills.push(format!("{} (source: {}, not found)", name, source));
                    }
                }
            } else {
                skipped_skills.push(format!("{} (source: {}, not found locally)", name, source));
            }
        }
    }

    // ── Automations: write HEARTBEAT.md ──
    if let Some(hb) = build_cfg.pointer("/blocks/automations/heartbeat") {
        if hb.get("included").and_then(|v| v.as_bool()).unwrap_or(false) {
            if let Some(content) = hb.get("content").and_then(|v| v.as_str()) {
                fs::write(target_workspace.join("HEARTBEAT.md"), content)
                    .map_err(|e| format!("Write HEARTBEAT.md: {}", e))?;
                block_changes.push("automations: wrote HEARTBEAT.md".to_string());
            }
        }
    }

    // ── Memory: create directory structure and templates ──
    if let Some(structure) = build_cfg.pointer("/blocks/memory/structure") {
        if let Some(dirs) = structure.get("directories").and_then(|v| v.as_array()) {
            for dir in dirs {
                if let Some(d) = dir.as_str() {
                    let _ = fs::create_dir_all(target_workspace.join(d));
                }
            }
        }
        if let Some(templates) = structure.get("templateFiles").and_then(|v| v.as_array()) {
            for tmpl in templates {
                let path_str = tmpl.get("path").and_then(|v| v.as_str()).unwrap_or("");
                let content = tmpl.get("content").and_then(|v| v.as_str()).unwrap_or("");
                if !path_str.is_empty() {
                    let full_path = target_workspace.join(path_str);
                    if !full_path.exists() {
                        if let Some(parent) = full_path.parent() {
                            let _ = fs::create_dir_all(parent);
                        }
                        let _ = fs::write(&full_path, content);
                    }
                }
            }
        }
        block_changes.push("memory: created directory structure".to_string());
    }

    // ── Model: update agent config if build_cfg has model tiers ──
    if let Some(tiers) = build_cfg.pointer("/blocks/model/tiers") {
        if let Some(main_tier) = tiers.get("main") {
            let model = format!(
                "{}/{}",
                main_tier.get("provider").and_then(|v| v.as_str()).unwrap_or("anthropic"),
                main_tier.get("model").and_then(|v| v.as_str()).unwrap_or("claude-sonnet-4-5")
            );
            // Update agent config entry if it exists in agents.list
            if let Some(aid) = &agent_id {
                let mut config: Value = fs::read_to_string(&config_path)
                    .ok()
                    .and_then(|c| serde_json::from_str(&c).ok())
                    .unwrap_or(serde_json::json!({}));

                if let Some(list) = config.pointer_mut("/agents/list").and_then(|v| v.as_array_mut()) {
                    for entry in list.iter_mut() {
                        if entry.get("id").and_then(|v| v.as_str()) == Some(aid) {
                            entry.as_object_mut().unwrap().insert(
                                "model".to_string(),
                                serde_json::json!({ "primary": model }),
                            );
                            block_changes.push(format!("model: set primary to {}", model));
                            break;
                        }
                    }
                    fs::write(&config_path, serde_json::to_string_pretty(&config).unwrap_or_default())
                        .map_err(|e| format!("Failed to write config: {}", e))?;
                }
            }
        }
    }

    // Save the build_cfg to builds dir for reference
    let ref_name = format!("cloned-{}.build_cfg.json", chrono_now().replace(':', "-"));
    let ref_path = builds_dir.join(&ref_name);
    let _ = fs::write(&ref_path, serde_json::to_string_pretty(&build_cfg).unwrap_or_default());

    Ok(CloneResult {
        applied_skills,
        skipped_skills,
        block_changes,
        backup_path: Some(backup_path.to_string_lossy().to_string()),
    })
}

// ─── Apply build_cfg to new agent ───

#[derive(Serialize)]
struct ApplyResult {
    ok: bool,
    results: Vec<Value>,
    warnings: Vec<String>,
    workspace: String,
}

#[tauri::command]
fn apply_build(
    build_json: String,
    agent_id: String,
    agent_name: String,
    use_my_models: bool,
) -> Result<ApplyResult, String> {
    let build_cfg: Value = serde_json::from_str(&build_json)
        .map_err(|e| format!("Invalid build_cfg JSON: {}", e))?;

    let agents_dir = openclaw_dir().join("agents");
    let agent_workspace = agents_dir.join(&agent_id);

    // Safety: never overwrite existing agent
    if agent_workspace.exists() {
        return Err(format!(
            "Agent workspace already exists at {}. Choose a different agent ID.",
            agent_workspace.display()
        ));
    }

    let config = read_config();
    let defaults = config.pointer("/agents/defaults").cloned().unwrap_or(Value::Null);
    let agents_list = config.pointer("/agents/list")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    let mut results: Vec<Value> = Vec::new();
    let mut warnings: Vec<String> = Vec::new();
    let mut config_entries: Vec<Value> = Vec::new();

    // Protect current default agent if agents.list is empty
    if agents_list.is_empty() {
        let default_workspace = defaults.pointer("/workspace")
            .and_then(|v| v.as_str())
            .unwrap_or("~/.openclaw/workspace");
        let default_model = defaults.pointer("/model/primary")
            .and_then(|v| v.as_str())
            .unwrap_or("anthropic/claude-sonnet-4-5");

        config_entries.push(serde_json::json!({
            "id": "main",
            "name": "Main Agent",
            "workspace": default_workspace,
            "model": { "primary": default_model },
            "default": true
        }));
        warnings.push("📌 Your current agent added to agents.list as \"main\" with default: true".to_string());
    }

    // Create workspace
    fs::create_dir_all(&agent_workspace)
        .map_err(|e| format!("Failed to create workspace: {}", e))?;
    fs::create_dir_all(agent_workspace.join("memory"))
        .map_err(|e| format!("Failed to create memory dir: {}", e))?;
    results.push(serde_json::json!({
        "type": "create-workspace",
        "status": "ok"
    }));

    // Model: resolved via config entry below
    let main_model = if use_my_models {
        defaults.pointer("/model/primary")
            .and_then(|v| v.as_str())
            .unwrap_or("anthropic/claude-sonnet-4-5")
            .to_string()
    } else if let Some(tiers) = build_cfg.pointer("/blocks/model/tiers") {
        if let Some(main_tier) = tiers.get("main") {
            format!(
                "{}/{}",
                main_tier.get("provider").and_then(|v| v.as_str()).unwrap_or("anthropic"),
                main_tier.get("model").and_then(|v| v.as_str()).unwrap_or("claude-sonnet-4-5")
            )
        } else {
            "anthropic/claude-sonnet-4-5".to_string()
        }
    } else {
        "anthropic/claude-sonnet-4-5".to_string()
    };

    results.push(serde_json::json!({
        "type": "set-model",
        "status": "ok",
        "model": main_model
    }));

    // Persona files
    if let Some(persona) = build_cfg.pointer("/blocks/persona") {
        // IDENTITY.md
        if let Some(identity) = persona.get("identity") {
            let name = identity.get("name").and_then(|v| v.as_str()).unwrap_or("Agent");
            let creature = identity.get("creature").and_then(|v| v.as_str()).unwrap_or("AI assistant");
            let vibe = identity.get("vibe").and_then(|v| v.as_str()).unwrap_or("");
            let content = format!(
                "# IDENTITY.md - Who Am I?\n\n- **Name:** {}\n- **Creature:** {}\n- **Vibe:** {}\n",
                name, creature, vibe
            );
            fs::write(agent_workspace.join("IDENTITY.md"), &content)
                .map_err(|e| format!("Write IDENTITY.md: {}", e))?;
            results.push(serde_json::json!({ "type": "write-identity", "status": "ok" }));
        }

        // SOUL.md
        if let Some(soul) = persona.get("soul") {
            if soul.get("included").and_then(|v| v.as_bool()).unwrap_or(false) {
                if let Some(content) = soul.get("content").and_then(|v| v.as_str()) {
                    fs::write(agent_workspace.join("SOUL.md"), content)
                        .map_err(|e| format!("Write SOUL.md: {}", e))?;
                    results.push(serde_json::json!({ "type": "write-soul", "status": "ok" }));
                }
            }
        }

        // AGENTS.md
        if let Some(agents_md) = persona.get("agents") {
            if agents_md.get("included").and_then(|v| v.as_bool()).unwrap_or(false) {
                if let Some(content) = agents_md.get("content").and_then(|v| v.as_str()) {
                    fs::write(agent_workspace.join("AGENTS.md"), content)
                        .map_err(|e| format!("Write AGENTS.md: {}", e))?;
                    results.push(serde_json::json!({ "type": "write-agents", "status": "ok" }));
                }
            }
        }

        // USER.md: blank template
        let user_path = agent_workspace.join("USER.md");
        if !user_path.exists() {
            fs::write(&user_path, "# USER.md - About Your Human\n\n_(Fill in your details)_\n")
                .map_err(|e| format!("Write USER.md: {}", e))?;
        }
    }

    // Skills
    if let Some(skills) = build_cfg.pointer("/blocks/skills/items").and_then(|v| v.as_array()) {
        let bundled: Vec<&str> = skills.iter()
            .filter(|s| s.get("source").and_then(|v| v.as_str()) == Some("bundled"))
            .filter_map(|s| s.get("name").and_then(|v| v.as_str()))
            .collect();
        let clawhub: Vec<&str> = skills.iter()
            .filter(|s| s.get("source").and_then(|v| v.as_str()) == Some("clawhub"))
            .filter_map(|s| s.get("name").and_then(|v| v.as_str()))
            .collect();

        if !bundled.is_empty() {
            results.push(serde_json::json!({
                "type": "enable-skills",
                "status": "ok",
                "count": bundled.len(),
                "detail": "Bundled skills enabled via agent config"
            }));
        }

        // Install ClawHub skills into agent workspace
        let skills_dir = agent_workspace.join("skills");
        let _ = fs::create_dir_all(&skills_dir);
        let mut installed = 0;
        let mut failed = 0;
        for skill_name in &clawhub {
            let result = Command::new("clawhub")
                .args(["install", skill_name, "--workdir", &agent_workspace.to_string_lossy(), "--no-input"])
                .output();
            match result {
                Ok(output) if output.status.success() => installed += 1,
                _ => {
                    failed += 1;
                    warnings.push(format!("Failed to install skill: {}", skill_name));
                }
            }
        }
        results.push(serde_json::json!({
            "type": "install-skills",
            "status": if failed == 0 { "ok" } else { "partial" },
            "installed": installed,
            "failed": failed
        }));
    }

    // Integrations: always manual
    if let Some(items) = build_cfg.pointer("/blocks/integrations/items").and_then(|v| v.as_array()) {
        for item in items {
            let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("?");
            warnings.push(format!("🔧 Integration \"{}\" - manual setup required", name));
        }
        results.push(serde_json::json!({
            "type": "flag-integrations",
            "status": "ok",
            "count": items.len()
        }));
    }

    // Automations: write HEARTBEAT.md
    if let Some(hb) = build_cfg.pointer("/blocks/automations/heartbeat") {
        if hb.get("included").and_then(|v| v.as_bool()).unwrap_or(false) {
            if let Some(content) = hb.get("content").and_then(|v| v.as_str()) {
                fs::write(agent_workspace.join("HEARTBEAT.md"), content)
                    .map_err(|e| format!("Write HEARTBEAT.md: {}", e))?;
                results.push(serde_json::json!({ "type": "write-heartbeat", "status": "ok" }));
            }
        }
    }

    // Memory structure
    if let Some(structure) = build_cfg.pointer("/blocks/memory/structure") {
        if let Some(dirs) = structure.get("directories").and_then(|v| v.as_array()) {
            for dir in dirs {
                if let Some(d) = dir.as_str() {
                    let _ = fs::create_dir_all(agent_workspace.join(d));
                }
            }
        }
        if let Some(templates) = structure.get("templateFiles").and_then(|v| v.as_array()) {
            for tmpl in templates {
                let path = tmpl.get("path").and_then(|v| v.as_str()).unwrap_or("");
                let content = tmpl.get("content").and_then(|v| v.as_str()).unwrap_or("");
                if !path.is_empty() {
                    let full_path = agent_workspace.join(path);
                    if !full_path.exists() {
                        if let Some(parent) = full_path.parent() {
                            let _ = fs::create_dir_all(parent);
                        }
                        let _ = fs::write(&full_path, content);
                    }
                }
            }
        }
        results.push(serde_json::json!({ "type": "create-memory", "status": "ok" }));
    }

    // Write agent config entry
    config_entries.push(serde_json::json!({
        "id": agent_id,
        "name": agent_name,
        "workspace": agent_workspace.to_string_lossy(),
        "model": { "primary": main_model }
    }));

    // Update openclaw.json
    let config_path = openclaw_dir().join("openclaw.json");
    let mut config: Value = fs::read_to_string(&config_path)
        .ok()
        .and_then(|c| serde_json::from_str(&c).ok())
        .unwrap_or(serde_json::json!({}));

    // Backup first
    let backup_name = format!("openclaw.backup-{}.json", chrono_now().replace(':', "-"));
    let _ = fs::copy(&config_path, openclaw_dir().join(&backup_name));

    // Ensure agents.list exists
    if config.pointer("/agents/list").is_none() {
        if config.get("agents").is_none() {
            config.as_object_mut().unwrap().insert("agents".to_string(), serde_json::json!({}));
        }
        config.pointer_mut("/agents").unwrap()
            .as_object_mut().unwrap()
            .insert("list".to_string(), serde_json::json!([]));
    }

    let list = config.pointer_mut("/agents/list").unwrap().as_array_mut().unwrap();
    for entry in config_entries {
        let entry_id = entry.get("id").and_then(|v| v.as_str()).unwrap_or("");
        if !list.iter().any(|a| a.get("id").and_then(|v| v.as_str()) == Some(entry_id)) {
            list.push(entry);
        }
    }

    fs::write(&config_path, serde_json::to_string_pretty(&config).unwrap_or_default())
        .map_err(|e| format!("Failed to write config: {}", e))?;

    results.push(serde_json::json!({
        "type": "add-agent-config",
        "status": "ok"
    }));

    Ok(ApplyResult {
        ok: true,
        results,
        warnings,
        workspace: agent_workspace.to_string_lossy().to_string(),
    })
}

// ─── List saved builds ───

#[tauri::command]
fn list_builds() -> Vec<Value> {
    let builds_dir = workspace_dir().join("builds");
    // Also check legacy builds/ dir for migration
    let legacy_dir = workspace_dir().join("builds");

    let mut builds = Vec::new();
    for dir in [&builds_dir, &legacy_dir] {
        if !dir.exists() { continue; }
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) == Some("json") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        if let Ok(build_cfg) = serde_json::from_str::<Value>(&content) {
                            let name = build_cfg.pointer("/meta/name")
                                .and_then(|v| v.as_str())
                                .unwrap_or("unknown");
                            let exported_at = build_cfg.pointer("/meta/exportedAt")
                                .and_then(|v| v.as_str())
                                .unwrap_or("");
                            builds.push(serde_json::json!({
                                "filename": path.file_name().unwrap_or_default().to_string_lossy(),
                                "name": name,
                                "exportedAt": exported_at,
                                "path": path.to_string_lossy(),
                                "blocks": build_cfg.get("blocks").and_then(|s| s.as_object()).map(|o| o.len()).unwrap_or(0),
                                "skills": build_cfg.get("blocks").and_then(|b| b.get("skills")).and_then(|s| s.get("items")).and_then(|i| i.as_array()).map(|a| a.len()).unwrap_or(0),
                            }));
                        }
                    }
                }
            }
        }
    }
    builds
}

/// Import a build_cfg from an absolute file path into the builds directory
#[tauri::command]
fn import_build_file(path: String) -> Result<Value, String> {
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    let build_cfg: Value = serde_json::from_str(&content)
        .map_err(|e| format!("Invalid JSON: {}", e))?;

    // Validate it looks like a build
    if build_cfg.get("blocks").is_none() && build_cfg.get("mods").is_none() {
        return Err("File doesn't look like a valid build (missing blocks)".to_string());
    }

    // Schema v2 builds get full JSON Schema validation
    if build_cfg.get("schema").and_then(|s| s.as_u64()) == Some(2) {
        if let Err(errors) = validate_build_schema(&build_cfg) {
            return Err(format!("Schema validation failed:\n- {}", errors.join("\n- ")));
        }
    }

    // Save to builds directory
    let builds_dir = workspace_dir().join("builds");
    let _ = fs::create_dir_all(&builds_dir);

    let name = build_cfg.pointer("/meta/name")
        .and_then(|v| v.as_str())
        .unwrap_or("imported");
    let safe_name: String = name.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '-' })
        .collect();
    let timestamp = chrono_now().replace(':', "-").replace('T', "_");
    let filename = format!("{}-{}.build_cfg.json", safe_name, timestamp);
    let dest = builds_dir.join(&filename);

    fs::write(&dest, serde_json::to_string_pretty(&build_cfg).unwrap_or_default())
        .map_err(|e| format!("Failed to save build_cfg: {}", e))?;

    Ok(serde_json::json!({
        "filename": filename,
        "name": name,
        "path": dest.to_string_lossy(),
    }))
}

#[tauri::command]
fn validate_build(build_json: String) -> Result<Value, String> {
    let build: Value = serde_json::from_str(&build_json)
        .map_err(|e| format!("Invalid JSON: {}", e))?;

    if build.get("schema").and_then(|s| s.as_u64()) != Some(2) {
        return Ok(serde_json::json!({
            "valid": true,
            "schema": build.get("schema").and_then(|s| s.as_u64()).unwrap_or(1),
            "note": "Legacy build, schema validation skipped"
        }));
    }

    match validate_build_schema(&build) {
        Ok(()) => Ok(serde_json::json!({
            "valid": true,
            "schema": 2,
            "errors": []
        })),
        Err(errors) => Ok(serde_json::json!({
            "valid": false,
            "schema": 2,
            "errors": errors
        }))
    }
}

#[tauri::command]
fn read_file_absolute(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", path, e))
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
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_config,
            read_workspace_file,
            get_skills,
            get_system_status,
            get_cron_jobs,
            get_blocks,
            get_agents,
            import_build,
            import_build_file,
            export_build,
            export_build_safe,
            clone_build,
            apply_build,
            list_builds,
            validate_build,
            read_file_absolute,
            nostr::nostr_get_keys,
            nostr::nostr_generate_keys,
            nostr::nostr_import_keys,
            nostr::nostr_export_keys,
            nostr::nostr_get_profile,
            nostr::nostr_set_profile,
            nostr::nostr_publish_build_cfg,
            nostr::nostr_fetch_feed,
            nostr::nostr_get_relays,
            nostr::nostr_add_relay,
            nostr::nostr_remove_relay,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

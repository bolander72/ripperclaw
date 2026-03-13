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

// ─── Build Reader ───

#[tauri::command]
fn get_build(agent_id: Option<String>) -> Result<Value, String> {
    let ws = agent_id.as_ref()
        .map(|id| resolve_agent_workspace(id))
        .unwrap_or_else(|| workspace_dir());

    // Try to find an existing build file in workspace/builds/
    let builds_dir = ws.join("builds");
    if builds_dir.exists() {
        if let Ok(entries) = fs::read_dir(&builds_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) == Some("json") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        if let Ok(build) = serde_json::from_str::<Value>(&content) {
                            // Return the most recently modified build
                            return Ok(build);
                        }
                    }
                }
            }
        }
    }

    // No saved build found - return empty build structure
    Ok(serde_json::json!({
        "schema": 3,
        "meta": {
            "name": "Current Build",
            "agentName": "Agent",
            "author": "local",
            "version": 1,
            "exportedAt": chrono_now()
        }
    }))
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
    // Build a build (schema v3) from current state
    let _config = read_config();
    // Removed: _sections_data = get_sections(None);
    let skills = get_skills();
    let _status = get_system_status();

    let ws = workspace_dir();

    // Skills config
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
        "schema": 3,
        "meta": {
            "name": identity_name.clone(),
            "agentName": identity_name,
            "author": "local",
            "version": 1,
            "exportedAt": chrono_now(),
        },
        "skills": {
            "items": skills_items
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
    section_changes: Vec<String>,
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
            section_changes: vec![format!("Saved as {}", filename)],
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
    let mut section_changes: Vec<String> = Vec::new();

    // ── Persona: write SOUL.md, IDENTITY.md, AGENTS.md if included ──
    if let Some(persona) = build_cfg.pointer("/persona") {
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
            section_changes.push(format!("persona: wrote IDENTITY.md ({})", name));
        }

        if let Some(soul) = persona.get("soul") {
            if soul.get("included").and_then(|v| v.as_bool()).unwrap_or(false) {
                if let Some(content) = soul.get("content").and_then(|v| v.as_str()) {
                    fs::write(target_workspace.join("SOUL.md"), content)
                        .map_err(|e| format!("Write SOUL.md: {}", e))?;
                    section_changes.push("persona: wrote SOUL.md".to_string());
                }
            }
        }

        if let Some(agents_md) = persona.get("agents") {
            if agents_md.get("included").and_then(|v| v.as_bool()).unwrap_or(false) {
                if let Some(content) = agents_md.get("content").and_then(|v| v.as_str()) {
                    fs::write(target_workspace.join("AGENTS.md"), content)
                        .map_err(|e| format!("Write AGENTS.md: {}", e))?;
                    section_changes.push("persona: wrote AGENTS.md".to_string());
                }
            }
        }
    }

    // ── Skills: install from ClawHub, track bundled ──
    if let Some(skills) = build_cfg.pointer("/skills/items").and_then(|v| v.as_array()) {
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
            section_changes.push(format!("skills: {} installed, {} skipped", applied_skills.len(), skipped_skills.len()));
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
    if let Some(hb) = build_cfg.pointer("/automations/heartbeat") {
        if hb.get("included").and_then(|v| v.as_bool()).unwrap_or(false) {
            if let Some(content) = hb.get("content").and_then(|v| v.as_str()) {
                fs::write(target_workspace.join("HEARTBEAT.md"), content)
                    .map_err(|e| format!("Write HEARTBEAT.md: {}", e))?;
                section_changes.push("automations: wrote HEARTBEAT.md".to_string());
            }
        }
    }

    // ── Memory: create directory structure and templates ──
    if let Some(structure) = build_cfg.pointer("/memory/structure") {
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
        section_changes.push("memory: created directory structure".to_string());
    }

    // ── Model: update agent config if build_cfg has model tiers ──
    if let Some(tiers) = build_cfg.pointer("/model/tiers") {
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
                            section_changes.push(format!("model: set primary to {}", model));
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
        section_changes,
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
    } else if let Some(tiers) = build_cfg.pointer("/model/tiers") {
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
    if let Some(persona) = build_cfg.pointer("/persona") {
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
    if let Some(skills) = build_cfg.pointer("/skills/items").and_then(|v| v.as_array()) {
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
    if let Some(items) = build_cfg.pointer("/integrations/items").and_then(|v| v.as_array()) {
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
    if let Some(hb) = build_cfg.pointer("/automations/heartbeat") {
        if hb.get("included").and_then(|v| v.as_bool()).unwrap_or(false) {
            if let Some(content) = hb.get("content").and_then(|v| v.as_str()) {
                fs::write(agent_workspace.join("HEARTBEAT.md"), content)
                    .map_err(|e| format!("Write HEARTBEAT.md: {}", e))?;
                results.push(serde_json::json!({ "type": "write-heartbeat", "status": "ok" }));
            }
        }
    }

    // Memory structure
    if let Some(structure) = build_cfg.pointer("/memory/structure") {
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
                                "sections": ["model", "persona", "skills", "integrations", "automations", "memory"]
                                    .iter()
                                    .filter(|k| build_cfg.get(*k).is_some())
                                    .count(),
                                "skills": build_cfg.get("skills")
                                    .and_then(|s| s.get("items"))
                                    .and_then(|i| i.as_array())
                                    .map(|a| a.len())
                                    .unwrap_or(0),
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
    // Check for v3 (top-level sections), v2 (blocks wrapper), or legacy (mods)
    let has_sections = ["model", "persona", "skills", "integrations", "automations", "memory"]
        .iter()
        .any(|k| build_cfg.get(*k).is_some());
    if !has_sections && build_cfg.get("blocks").is_none() && build_cfg.get("mods").is_none() {
        return Err("File doesn't look like a valid build".to_string());
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
            get_build,
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

# Dependency Resolution Spec

How ClawClawGo figures out what a build needs and tells the applying user where to get it.

## Problem

When someone exports a build with "Voice Loop (Whisper + Kokoro)", the receiver has no way to know they need Python 3.x, pip packages, model file downloads, or hardware requirements. Skills and integrations don't declare their system-level dependencies.

## Design

### 1. Skill Dependency Manifest

Each skill can declare dependencies in its SKILL.md frontmatter metadata:

```yaml
metadata:
  openclaw:
    emoji: "🎤"
    requires:
      anyBins: ["python3"]           # At least one must exist on PATH
      allBins: ["ffmpeg"]            # All must exist on PATH
      brew: ["portaudio"]            # Homebrew packages
      pip: ["whisper", "kokoro-onnx"] # Python packages  
      npm: ["@anthropic-ai/sdk"]     # npm global packages
      models:                        # Model file downloads
        - name: "kokoro-v1.0.onnx"
          url: "https://github.com/thewh1teagle/kokoro-onnx/releases/..."
          path: "~/.cache/kokoro-onnx/"
          size: "82MB"
      config:                        # Config/credential requirements
        - key: "OPENAI_API_KEY"
          description: "OpenAI API key for Whisper API"
          required: false
        - key: "keychain:kokoro-model"
          description: "Path to Kokoro model files"
          required: true
      platform: ["darwin", "linux"]  # Supported platforms (optional)
      minOpenclawVersion: "1.4.0"    # Minimum OpenClaw version (optional)
```

### 2. Integration Dependency Manifest

Integrations in the build schema gain a `setup` field:

```json
{
  "type": "calendar",
  "name": "Calendar (caldir)",
  "provider": "caldir",
  "autoApply": false,
  "setup": {
    "install": "brew install caldir || pip install caldir",
    "bins": ["caldir"],
    "config": [
      {
        "key": "icloud-credentials",
        "description": "iCloud app-specific password",
        "docsUrl": "https://support.apple.com/en-us/102654"
      }
    ],
    "platform": ["darwin"],
    "docsUrl": "https://docs.openclaw.ai/integrations/calendar"
  }
}
```

### 3. Build-Level Dependency Resolution

On export, ClawClawGo:
1. Walks all skills, reads their `requires` from SKILL.md metadata
2. Walks all integrations, reads their `setup` field
3. Deduplicates (e.g., two skills both need ffmpeg = one ffmpeg entry)
4. Produces a top-level `dependencies` summary in the build JSON

```json
{
  "schema": 3,
  "meta": { ... },
  "model": { ... },
  "persona": { ... },
  "skills": { ... },
  "integrations": { ... },
  "automations": { ... },
  "memory": { ... },
  "dependencies": {
    "bins": ["python3", "ffmpeg", "caldir", "himalaya", "gh"],
    "brew": ["portaudio"],
    "pip": ["whisper", "kokoro-onnx"],
    "npm": [],
    "models": [
      {
        "name": "kokoro-v1.0.onnx",
        "url": "https://...",
        "path": "~/.cache/kokoro-onnx/",
        "size": "82MB"
      }
    ],
    "config": [
      { "key": "OPENAI_API_KEY", "description": "...", "required": false }
    ],
    "platform": ["darwin"],
    "minOpenclawVersion": "1.4.0"
  }
}
```

### 4. Apply-Time Dependency Check

On apply, ClawClawGo:
1. Reads `dependencies` from the build
2. Checks each requirement against the local system:
   - `bins`: `which <bin>` for each
   - `brew`: `brew list <pkg>` for each (macOS only)
   - `pip`: `pip show <pkg>` for each
   - `npm`: `npm list -g <pkg>` for each
   - `models`: check if file exists at path
   - `config`: check env vars, keychain entries
   - `platform`: check `process.platform`
   - `minOpenclawVersion`: compare semver
3. Produces a dependency report:

```
Dependencies for "Quinn's Build":

  INSTALLED                 MISSING
  ✅ python3               ❌ ffmpeg        → brew install ffmpeg
  ✅ gh                    ❌ caldir        → brew install caldir
  ✅ himalaya              ❌ portaudio     → brew install portaudio
                           ❌ kokoro-onnx   → pip install kokoro-onnx
                           ❌ kokoro model  → download 82MB from [url]

  ⚠️  Platform: darwin only (you're on darwin ✅)
  ⚠️  Requires OpenClaw >= 1.4.0 (you have 1.3.8 ❌)

  3 dependencies missing. Install all? [y/N]
```

### 5. Auto-Install (Optional)

If the user opts in, ClawClawGo can run install commands:
- `brew install <pkg>` for brew deps
- `pip install <pkg>` for pip deps
- `npm install -g <pkg>` for npm deps
- Download model files to specified paths
- Skip config/credential setup (always manual)

Auto-install is NEVER the default. Always show what will be installed first.

### 6. Export-Time Detection

When exporting, ClawClawGo should detect dependencies from the local system:
- For each skill with a SKILL.md `requires` block: include as-is
- For skills without requires: scan for common patterns (shebangs, import statements)
- For integrations: detect via `which` + known provider-to-package mappings
- Known mappings (hardcoded for now):
  - `caldir` -> brew: caldir
  - `himalaya` -> brew: himalaya  
  - `gh` -> brew: gh
  - `bluebubbles` -> docs: bluebubbles setup guide
  - `homeassistant` -> docs: HA setup guide
  - `voice-loop` -> pip: whisper, kokoro-onnx; brew: portaudio

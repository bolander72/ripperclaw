# Dependency Resolution

ClawClawGo detects what a build needs and tells you where to get it.

## How It Works

### On Export

When exporting, ClawClawGo walks all skills and integrations to build a dependency manifest:

1. **Skills**: Reads `requires` from each SKILL.md frontmatter metadata
2. **Integrations**: Reads `setup` field from integration definitions
3. **Deduplication**: Combines and deduplicates (two skills needing ffmpeg = one ffmpeg entry)
4. **Produces**: Top-level `dependencies` object in the build JSON

### On Apply

When applying, ClawClawGo checks each requirement against the local system:

| Check | How |
|-------|-----|
| `bins` | `which <bin>` for each |
| `brew` | `brew list <pkg>` for each (macOS only) |
| `pip` | `pip show <pkg>` for each |
| `npm` | `npm list -g <pkg>` for each |
| `models` | Check if file exists at path |
| `config` | Check env vars, keychain entries |
| `platform` | Check `process.platform` |
| `minOpenclawVersion` | Compare semver |

## Dependency Report

The apply command shows what's installed and what's missing:

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

## Dependency Types

### Binaries (`bins`)

Required binaries on PATH.

```json
{
  "bins": ["python3", "ffmpeg", "caldir", "gh"]
}
```

### Homebrew Packages (`brew`)

Homebrew packages (macOS only).

```json
{
  "brew": ["portaudio", "ffmpeg"]
}
```

### Python Packages (`pip`)

Python pip packages.

```json
{
  "pip": ["whisper", "kokoro-onnx"]
}
```

### npm Packages (`npm`)

npm global packages.

```json
{
  "npm": ["@anthropic-ai/sdk"]
}
```

### Model Files (`models`)

Model file downloads.

```json
{
  "models": [
    {
      "name": "kokoro-v1.0.onnx",
      "url": "https://github.com/thewh1teagle/kokoro-onnx/releases/...",
      "path": "~/.cache/kokoro-onnx/",
      "size": "82MB"
    }
  ]
}
```

### Configuration (`config`)

Configuration or credential requirements.

```json
{
  "config": [
    {
      "key": "OPENAI_API_KEY",
      "description": "OpenAI API key for Whisper API",
      "required": false
    },
    {
      "key": "keychain:kokoro-model",
      "description": "Path to Kokoro model files",
      "required": true
    }
  ]
}
```

### Platform (`platform`)

Supported platforms.

```json
{
  "platform": ["darwin", "linux"]
}
```

Values: `darwin` (macOS), `linux`, `win32` (Windows).

### Minimum OpenClaw Version (`minOpenclawVersion`)

Minimum OpenClaw version required.

```json
{
  "minOpenclawVersion": "1.4.0"
}
```

## Auto-Install (Optional)

If you opt in, ClawClawGo can run install commands for you:

- `brew install <pkg>` for brew deps
- `pip install <pkg>` for pip deps
- `npm install -g <pkg>` for npm deps
- Download model files to specified paths
- Skip config/credential setup (always manual)

**Auto-install is NEVER the default.** You always see what will be installed first.

## Skill Dependency Manifest

Skills declare dependencies in their SKILL.md frontmatter:

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
      models:
        - name: "kokoro-v1.0.onnx"
          url: "https://github.com/thewh1teagle/kokoro-onnx/releases/..."
          path: "~/.cache/kokoro-onnx/"
          size: "82MB"
      config:
        - key: "OPENAI_API_KEY"
          description: "OpenAI API key for Whisper API"
          required: false
      platform: ["darwin", "linux"]
      minOpenclawVersion: "1.4.0"
```

## Known Provider Mappings

ClawClawGo has hardcoded mappings for common integrations:

| Provider | Package | Install |
|----------|---------|---------|
| `caldir` | caldir | `brew install caldir` |
| `himalaya` | himalaya | `brew install himalaya` |
| `gh` | gh | `brew install gh` |
| `bluebubbles` | (none) | See [setup guide](https://docs.openclaw.ai/guides/bluebubbles.md) |
| `homeassistant` | (none) | See [setup guide](https://docs.openclaw.ai/guides/home-assistant.md) |

## Skipping Dependency Checks

Use `--skip-deps` to skip dependency checking:

```bash
clawclawgo apply my-build.json --agent test-bot --skip-deps
```

Useful when you know dependencies are already installed or when testing in isolated environments.

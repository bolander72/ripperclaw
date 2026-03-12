# Installation

## Desktop App

Download the latest release from [GitHub Releases](https://github.com/bolander72/clawclawgo/releases/latest).

### macOS

1. Download the `.dmg` for your architecture (Apple Silicon or Intel)
2. Open the DMG and drag ClawClawGo to Applications
3. On first launch, right-click → Open (macOS may block unsigned apps)

::: tip
ClawClawGo requires OpenClaw installed and running. The app reads your config from `~/.openclaw/openclaw.json`.
:::

### Windows

1. Download the `.exe` installer
2. Run the installer
3. Launch ClawClawGo from the Start menu

### Linux

**Debian/Ubuntu:**
```bash
sudo dpkg -i clawclawgo_*.deb
```

**AppImage:**
```bash
chmod +x ClawClawGo_*.AppImage
./ClawClawGo_*.AppImage
```

## CLI

The CLI is a standalone Node.js script. No install needed beyond cloning the repo:

```bash
git clone https://github.com/bolander72/clawclawgo.git
cd clawclawgo/cli
node clawclawgo.mjs --help
```

### Requirements

- Node.js 18+
- OpenClaw installed (`~/.openclaw/openclaw.json` must exist)
- [ClawHub CLI](https://clawhub.com) for skill installation during apply

## Building from Source

```bash
git clone https://github.com/bolander72/clawclawgo.git
cd clawclawgo/app

# Install frontend deps
npm install

# Dev mode
npm run tauri dev

# Production build
npm run tauri build
```

### Build Requirements

- Rust (stable)
- Node.js 18+
- Platform-specific dependencies:
  - **macOS:** Xcode Command Line Tools
  - **Linux:** `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`
  - **Windows:** Visual Studio Build Tools, WebView2

#!/usr/bin/env bash
#
# setup-local-claude.sh — point Claude Code at a local Ollama model on macOS.
#
# What it does (idempotent — safe to re-run):
#   1. Installs Ollama (via Homebrew) if it's not already present.
#   2. Pulls the coding model you choose below.
#   3. Installs a launchd LaunchAgent so `ollama serve` starts at login.
#   4. Adds a Claude Code env block to your shell profile so `claude` uses it.
#
# Requires Ollama >= 0.14.0 (Jan 2026), which speaks the Anthropic Messages API
# natively — that's what lets Claude Code talk to it with no proxy.
#
# Usage:
#   chmod +x local-models/setup-local-claude.sh
#   ./local-models/setup-local-claude.sh
#
set -euo pipefail

# ----------------------------------------------------------------------------
# Config — edit these to taste.
# ----------------------------------------------------------------------------
# The Ollama model Claude Code will use. Swap for a bigger/smaller one anytime:
#   qwen2.5-coder:32b  -> strongest, needs a big GPU / lots of unified memory
#   qwen2.5-coder:14b  -> strong, ~12GB+
#   qwen2.5-coder:7b   -> good balance, runs on most Apple Silicon (default)
#   qwen2.5-coder:3b   -> light, weaker at tool use
MODEL="${MODEL:-qwen2.5-coder:7b}"

# Larger context helps Claude Code, which sends big prompts. Lower if RAM is tight.
CONTEXT_LENGTH="${CONTEXT_LENGTH:-32768}"

PLIST_LABEL="com.spicet.ollama"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"
LOG_DIR="$HOME/Library/Logs"

# Detect your login shell profile.
if [ -n "${ZSH_VERSION:-}" ] || [ "$(basename "${SHELL:-}")" = "zsh" ]; then
  PROFILE="$HOME/.zshrc"
else
  PROFILE="$HOME/.bashrc"
fi

# ----------------------------------------------------------------------------
say()  { printf "\033[1;34m==>\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m!! \033[0m %s\n" "$*"; }

if [ "$(uname -s)" != "Darwin" ]; then
  warn "This script targets macOS. For Linux use a systemd --user service instead."
  exit 1
fi

# ----------------------------------------------------------------------------
# 1. Install Ollama
# ----------------------------------------------------------------------------
if ! command -v ollama >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    say "Installing Ollama via Homebrew..."
    brew install ollama
  else
    warn "Homebrew not found. Install Ollama from https://ollama.com/download then re-run."
    exit 1
  fi
else
  say "Ollama already installed: $(ollama --version 2>/dev/null || echo unknown)"
fi

OLLAMA_BIN="$(command -v ollama)"
say "Using ollama binary at: $OLLAMA_BIN"

# ----------------------------------------------------------------------------
# 2. Install launchd agent so Ollama starts at login
# ----------------------------------------------------------------------------
say "Writing LaunchAgent -> $PLIST_PATH"
mkdir -p "$(dirname "$PLIST_PATH")" "$LOG_DIR"
cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${OLLAMA_BIN}</string>
        <string>serve</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>OLLAMA_CONTEXT_LENGTH</key>
        <string>${CONTEXT_LENGTH}</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${LOG_DIR}/ollama.log</string>
    <key>StandardErrorPath</key>
    <string>${LOG_DIR}/ollama.log</string>
</dict>
</plist>
PLIST

# Reload the agent (bootout may fail the first time; that's fine).
launchctl bootout "gui/$(id -u)/${PLIST_LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
say "Ollama will now start automatically at login (and is starting now)."

# Give the server a moment to come up before pulling.
sleep 3

# ----------------------------------------------------------------------------
# 3. Pull the model
# ----------------------------------------------------------------------------
say "Pulling model: $MODEL (this can take a while the first time)..."
"$OLLAMA_BIN" pull "$MODEL"

# ----------------------------------------------------------------------------
# 4. Wire Claude Code env vars into the shell profile
# ----------------------------------------------------------------------------
BEGIN="# >>> claude-code local models (managed by setup-local-claude.sh) >>>"
END="# <<< claude-code local models <<<"

say "Updating Claude Code env block in $PROFILE"
touch "$PROFILE"
# Remove any previous managed block, then append a fresh one.
if grep -qF "$BEGIN" "$PROFILE" 2>/dev/null; then
  tmp="$(mktemp)"
  awk -v b="$BEGIN" -v e="$END" '
    $0==b {skip=1} !skip {print} $0==e {skip=0}
  ' "$PROFILE" > "$tmp"
  mv "$tmp" "$PROFILE"
fi
cat >> "$PROFILE" <<PROFILE_BLOCK
$BEGIN
# Adds a 'claude-local' command that runs Claude Code against the local Ollama
# model. Your normal 'claude' is UNCHANGED and keeps using cloud Claude /
# your subscription as usual. Use whichever you want, per session:
#   claude        -> cloud Claude (Opus, your subscription)
#   claude-local  -> local model ($MODEL), free & offline
claude-local() {
  ANTHROPIC_BASE_URL="http://localhost:11434" \\
  ANTHROPIC_AUTH_TOKEN="ollama" \\
  ANTHROPIC_DEFAULT_SONNET_MODEL="$MODEL" \\
  ANTHROPIC_DEFAULT_OPUS_MODEL="$MODEL" \\
  ANTHROPIC_DEFAULT_HAIKU_MODEL="$MODEL" \\
  command claude --model "$MODEL" "\$@"
}
$END
PROFILE_BLOCK

say "Done!"
echo
echo "Next steps:"
echo "  1. Open a NEW terminal (or run: source \"$PROFILE\")"
echo "  2. Use whichever you want, per session:"
echo "       claude        -> your normal cloud Claude (Opus / subscription)"
echo "       claude-local  -> the local $MODEL model (free & offline)"

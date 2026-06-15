#!/usr/bin/env bash
#
# setup-local-claude.sh — point Claude Code at a local Ollama model on macOS.
#
# What it does (idempotent — safe to re-run):
#   1. Installs Ollama (via Homebrew) if it's not already present.
#   2. Pulls the coding model you choose below.
#   3. Starts Ollama via 'brew services' so it runs and auto-starts at login.
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
# 2. Run Ollama as a login service (via Homebrew's service manager)
# ----------------------------------------------------------------------------
# Homebrew's 'brew services' is far more reliable than a hand-rolled
# LaunchAgent. Remove any old agent left by earlier versions of this script.
launchctl bootout "gui/$(id -u)/${PLIST_LABEL}" 2>/dev/null || true
rm -f "$PLIST_PATH"

# Claude Code sends large prompts, so give Ollama a generous context window.
launchctl setenv OLLAMA_CONTEXT_LENGTH "$CONTEXT_LENGTH" 2>/dev/null || true

say "Starting Ollama via 'brew services' (auto-starts at login)..."
brew services restart ollama >/dev/null 2>&1 || brew services start ollama
say "Ollama is running and will start automatically at login."

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
  MAX_THINKING_TOKENS=0 \\
  CLAUDE_CODE_EFFORT_LEVEL=low \\
  command claude --model "$MODEL" "\$@"
}
# MAX_THINKING_TOKENS=0 + low effort skip the heavy "extended thinking" that
# makes small local models crawl. Remove those two lines if you want the model
# to reason more (slower). Your cloud 'claude' is unaffected.
$END
PROFILE_BLOCK

say "Done!"
echo
echo "Next steps:"
echo "  1. Open a NEW terminal (or run: source \"$PROFILE\")"
echo "  2. Use whichever you want, per session:"
echo "       claude        -> your normal cloud Claude (Opus / subscription)"
echo "       claude-local  -> the local $MODEL model (free & offline)"

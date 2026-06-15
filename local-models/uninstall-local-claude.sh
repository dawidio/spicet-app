#!/usr/bin/env bash
#
# uninstall-local-claude.sh — undo setup-local-claude.sh.
# Stops/removes the Ollama LaunchAgent and strips the Claude Code env block
# from your shell profile. Does NOT uninstall Ollama or delete pulled models.
#
set -euo pipefail

PLIST_LABEL="com.spicet.ollama"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"

if [ -n "${ZSH_VERSION:-}" ] || [ "$(basename "${SHELL:-}")" = "zsh" ]; then
  PROFILE="$HOME/.zshrc"
else
  PROFILE="$HOME/.bashrc"
fi

echo "==> Stopping Ollama service"
brew services stop ollama 2>/dev/null || true
# Also remove any old hand-rolled LaunchAgent from earlier script versions.
launchctl bootout "gui/$(id -u)/${PLIST_LABEL}" 2>/dev/null || true
rm -f "$PLIST_PATH"

BEGIN="# >>> claude-code local models (managed by setup-local-claude.sh) >>>"
END="# <<< claude-code local models <<<"
if grep -qF "$BEGIN" "$PROFILE" 2>/dev/null; then
  echo "==> Removing Claude Code env block from $PROFILE"
  tmp="$(mktemp)"
  awk -v b="$BEGIN" -v e="$END" '
    $0==b {skip=1} !skip {print} $0==e {skip=0}
  ' "$PROFILE" > "$tmp"
  mv "$tmp" "$PROFILE"
fi

echo "==> Done. Open a new terminal; 'claude' will use cloud Claude again."
echo "    (To fully remove Ollama: 'brew uninstall ollama' and delete ~/.ollama)"

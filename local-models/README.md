# Local models for Claude Code (macOS)

Point Claude Code at a model running locally via [Ollama](https://ollama.com)
instead of Anthropic's cloud API. Ollama starts automatically at login, so it's
ready whenever you sit down at your laptop.

This works because **Ollama ≥ 0.14.0 (Jan 2026) speaks the Anthropic Messages
API natively** — Claude Code talks to it directly with no proxy or router.

## Setup (run once)

```bash
chmod +x local-models/setup-local-claude.sh
./local-models/setup-local-claude.sh
```

Then open a new terminal and run `claude` — it now uses your local model.

The script is idempotent; re-run it any time (e.g. after changing `MODEL`).

## Choosing a model

Edit `MODEL` at the top of `setup-local-claude.sh`, or pass it inline:

```bash
MODEL=qwen2.5-coder:14b ./local-models/setup-local-claude.sh
```

| Model                | Notes                                                |
|----------------------|------------------------------------------------------|
| `qwen2.5-coder:32b`  | Strongest; needs lots of unified memory / big GPU    |
| `qwen2.5-coder:14b`  | Strong; ~12GB+                                        |
| `qwen2.5-coder:7b`   | Good balance — **default**                            |
| `qwen2.5-coder:3b`   | Light; weaker at tool use                             |

## What gets installed

- **Ollama** via Homebrew (if not already present).
- A **launchd LaunchAgent** at `~/Library/LaunchAgents/com.spicet.ollama.plist`
  that runs `ollama serve` at login (logs to `~/Library/Logs/ollama.log`).
- A **managed env block** in your `~/.zshrc` (or `~/.bashrc`) setting
  `ANTHROPIC_BASE_URL` and the model mappings Claude Code reads.

## Switching back to cloud Claude

Comment out the managed block in your shell profile and open a new terminal, or
run the uninstaller:

```bash
./local-models/uninstall-local-claude.sh
```

(The uninstaller removes the auto-start agent and env block. It does **not**
uninstall Ollama or delete downloaded models.)

## Honest caveats

- **Quality gap is real.** Even Qwen 2.5 Coder is noticeably weaker than cloud
  Claude at multi-step tool use (editing files, chaining commands). Expect more
  retries and the occasional wrong tool call.
- Ollama's compatibility layer **ignores `tool_choice`** and Anthropic
  `cache_control` doesn't apply, which can cause Claude Code to occasionally
  pick the wrong tool.
- Best for **offline/privacy work, cost-free experimentation, or learning** —
  not for heavy production tasks where cloud Claude pays for itself.

## Sources

- [Ollama: Anthropic API compatibility](https://ollama.com/blog/claude)
- [Ollama Anthropic compatibility docs](https://docs.ollama.com/api/anthropic-compatibility)
- [Pairing Claude Code with Local Models — KDnuggets](https://www.kdnuggets.com/pairing-claude-code-with-local-models)

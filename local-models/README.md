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

Then open a new terminal. You now have **two commands**:

- `claude` — your normal cloud Claude (Opus / subscription), unchanged.
- `claude-local` — the local Ollama model, free and offline.

Pick whichever you want per session. The script is idempotent; re-run it any
time (e.g. after changing `MODEL`).

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
- Ollama running as a **`brew services`** background service, which also
  auto-starts it at login (`brew services list` shows its status).
- A **managed block** in your `~/.zshrc` (or `~/.bashrc`) defining the
  `claude-local` shell function. Your plain `claude` command is left untouched.

## Cloud vs local — they coexist

Nothing is forced. Within any terminal:

```bash
claude         # cloud Claude (Opus / your subscription)
claude-local   # local Ollama model — free & offline
```

`claude-local` sets the Ollama env vars for that one invocation only, so it
never affects your normal cloud `claude`.

> Want the cloud model to *automatically* offload small/background tasks to the
> local model within a single session? That requires
> [Claude Code Router](https://github.com/musistudio/claude-code-router) (a
> proxy), and the cloud side must use an Anthropic **API key** (pay-per-token) —
> Anthropic does not permit routing a Pro/Max subscription through third-party
> proxies. The simple `claude` / `claude-local` split above avoids that.

## Removing the setup

```bash
./local-models/uninstall-local-claude.sh
```

(Removes the auto-start agent and the `claude-local` block. Does **not**
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

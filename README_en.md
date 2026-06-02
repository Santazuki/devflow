<h1 align="center">DevFlow</h1>
<p align="center"><em>A dual-pipeline multi-agent workflow framework</em></p>
<p align="center">
  PM + 7 agents + 5 gates = code that doesn't silently break
</p>
<p align="center">
  <a href="README.md">中文</a> | English
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0-blue" alt="version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
  <img src="https://img.shields.io/badge/agentskills.io-compatible-purple" alt="agentskills.io">
  <img src="https://img.shields.io/badge/universal-Claude%20Code%20%7C%20Copilot%20%7C%20Cursor%20%7C%20Windsurf-lightgrey" alt="universal">
</p>

---

## ✨ What is DevFlow?

DevFlow is a reusable **Agent Skill** that turns Claude Code into a project manager. When you say "multi-agent", instead of blindly dispatching subagents, it follows a battle-tested workflow:

```
Leader requests
  → PM aligns scope + real-time research
    → Part 0: Research Agent discovery (Step 0.5)
    → Part 1: Architect designs → Developer builds → 3×Reviewers audit
    → Part 2: Security Lead → QA tests → RE fixes (≤3 rounds)
      → CLEAN → Step 6 Spec sync → Step 7 post-mortem
```

Born from building [unblind](https://github.com/Santazuki/unblind). Three iterations, forged by real problems.

## 🎯 What It Solves

Giving Claude Code the Agent tool is like handing someone a fleet of workers with no foreman.

| Without DevFlow | With DevFlow |
|------|------|
| PM does the work themselves — gates meaningless | PM hard constraints: 4 roles must be independent agents |
| Two devs edit the same file — merge hell | File intersection check before dispatch |
| Three reviewers audit same code — none go deep | Security / Quality / Integration split, zero overlap |
| Reviewer finds a critical bug — now what? | CRITICAL blocks Part 2 → revert → same reviewer re-checks |

## ⚙️ Core Rules

**PM Hard Constraints**: SL, Reviewer, QA, RE, and Research roles must be dispatched as independent agents.

**Serial vs Parallel**: Two questions — does B depend on A's output? Same file? If neither, parallel. Read-only agents always parallel.

**Reviewer Dimension Split**: #1 Security (hardcoded keys, injection) · #2 Code Quality (interfaces, DRY, compat) · #3 Integration (data consistency, call chain)

**Step 0.5 Discovery**: Research domain standards, patterns, and anti-patterns before design. Findings injected into downstream agent prompts.

**6 Iron Rules**: PM never takes agent roles · no merge without tests · never skip alignment · CRITICAL requires re-review · never ask for commit/advance permission mid-flow · never skip Step 0.5 (Full mode)

**5 Quality Gates**: G1 design done → G2 SL reviews design → G3 reviewers find no CRITICAL → G4 QA all green → G5 SL final verdict

## 🚀 Quick Start

Send this to Claude Code:

> Install the devflow skill from https://github.com/Santazuki/devflow — clone it to .claude/skills/devflow.

Or manually:

```bash
git clone https://github.com/Santazuki/devflow.git .claude/skills/devflow
```

In Claude Code, say: `"multi-agent dev"`, `"dispatch plan"`, `"which tasks can parallelize"`

Integrate into CLAUDE.md:

```bash
cat resources/workflow-config-template.md >> CLAUDE.md
```

## 🧪 Battle Tested

Ran through unblind's Provider v3.0 refactor — 9 files, 3 developers parallel, QA in 1 round:

| Metric | Before | After |
|------|:---:|:---:|
| Tests | 95 | 171 |
| Provider code | ~347 LOC (3 subclasses) | ~290 LOC (1 class + pure functions) |
| Issues caught | — | 1 CRITICAL + 6 HIGH |

## Contributing

Issues and PRs welcome.

### Development Setup

```bash
git clone https://github.com/Santazuki/devflow.git
# Pure Markdown + YAML, no compilation, no dependencies
```

### Verify

```bash
node tests/devflow-check.js
```

## License

MIT © 2026 Santaz

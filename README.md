<!--
Hey there! Thanks for checking out DevFlow. This README follows standard open-source conventions — badges up top, quick start right after, docs at the bottom. Let me know if anything is unclear.
-->

<h1 align="center">DevFlow</h1>
<p align="center">
  <em>A dual-pipeline multi-agent workflow framework.</em>
  <br>
  PM + 6 agents + 5 gates = code that doesn't silently break.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
  <img src="https://img.shields.io/badge/agentskills.io-compatible-purple" alt="agentskills.io">
  <img src="https://img.shields.io/badge/Claude%20Code-ready-orange" alt="Claude Code">
</p>

---

## What is DevFlow?

DevFlow is a **reusable agent skill** that turns Claude Code into a project manager.

When you say "多 agent", instead of blindly dispatching subagents, the PM Agent follows a structured workflow:

```
Leader (you) says "build X"
  → PM Agent aligns scope
    → Part 1: Architect designs → Developer builds → 3 Reviewers audit
    → Part 2: Security Lead → QA tests → RE fixes (≤3 rounds)
      → CLEAN or loop back
```

It was born from a real project — [unblind](https://github.com/Santazuki/unblind) — where a junior CS student accidentally built a reusable development methodology while trying to ship a vision skill.

## The Problem

Giving Claude Code the `Agent` tool is like handing someone a fleet of workers with no foreman.

What happens without DevFlow:
- **PM does the work themselves** — "It's faster if I just review the code" → blind spot
- **Parallel dispatch causes merge conflicts** — two developers edit the same file
- **Reviewers read the same thing** — 3 people audit all files, miss different things
- **No rollback mechanism** — a reviewer finds a critical bug? Now what?

## How DevFlow Solves It

### 1. Hard Constraints on PM

The PM is **forbidden** from doing these roles themselves. Must dispatch independent agents:

| Role | Trigger Point | Why Independent |
|------|:---:|---|
| Security Lead | Design review + Final audit | PM reviewing their own design = blind spot |
| Reviewer ×3 | Code review | Different eyes on different dimensions |
| QA Engineer | Full test suite | Testing and fixing can't be the same person |
| Reliability Engineer | Fix failures | Same reason |

### 2. Serial vs Parallel Decision Tree

Two questions determine everything:

```
Q1: Does B's output depend on A's code?  → Serial (A first)
Q2: Do A and B modify the SAME file?     → Serial (no parallel edits)
Neither?                                   → Parallel!
```

Read-only agents (Reviewer, SL) are **always parallel** — they don't write files.

### 3. Reviewer Dimension Splitting

3 reviewers, 3 dimensions, zero overlap:

| Reviewer | Dimension | What they check |
|----------|-----------|-----------------|
| #1 | Security | Hardcoded keys, injection, error message leaks |
| #2 | Code Quality | Interface consistency, DRY, backward compat |
| #3 | Integration | Data consistency, call chain, end-to-end flow |

### 4. 5 Quality Gates

| Gate | Condition | On Failure |
|------|-----------|------------|
| G1 | Architect outputs design doc | Wait for Architect |
| G2 | Independent SL agent reviews design | Send back to Architect |
| G3 | Reviewers find NO CRITICAL issues | Block Part 2 → Developer fixes → Same reviewer re-checks |
| G4 | Independent QA agent: all tests pass | Send to RE (≤3 rounds) |
| G5 | After 3 rounds: SL final verdict | Notify Leader |

### 5. Post-Refactor Scan

After every major refactor: grep old class names, old file names, old test counts, old version numbers. Fix every stale reference in README, SKILL, CLAUDE, package.json, and memory files. One missed reference = future AI working off wrong assumptions.

## Quick Start

### Install

```bash
# Clone into your project's skills directory
git clone https://github.com/Santazuki/devflow.git .claude/skills/devflow

# Or install globally
git clone https://github.com/Santazuki/devflow.git ~/.claude/skills/devflow
```

### Use

In Claude Code, just say one of these:

```
"多agent开发这个功能"
"用 devflow"
"哪些任务可以并行?"
"派发计划"
```

The PM Agent will pick up the skill, align with you on scope, and start the pipeline.

### Integrate with your CLAUDE.md

Copy the template segment into your project's CLAUDE.md:

```bash
cat resources/claude-md-template.md >> CLAUDE.md
```

Then customize: adjust role names, model preferences, and tool permissions for your project.

## Project Structure

```
devflow/
├── SKILL.md                          # The skill (agentskills.io format)
├── README.md                         # You're reading it
├── LICENSE                           # MIT
├── resources/
│   └── claude-md-template.md         # Copy-paste into your CLAUDE.md
└── docs/
    └── methodology.md                # Full backstory, v0→v3 evolution, unblind case study
```

## When to Use

✅ **Use DevFlow when:**
- Building a feature spanning 3+ files
- Doing a significant refactor
- Working on security-sensitive code (API keys, auth, user input)
- Collaborating with multiple agent invocations

❌ **Skip DevFlow when:**
- Fixing a typo or single-line bug
- Updating documentation only
- Changing a config value
- Working solo on a < 50 line prototype

## Real-World Usage

DevFlow was used to build unblind's Provider v3.0 refactor:

| Metric | Before | After |
|--------|:---:|:---:|
| Modules | 16 | 15 |
| Tests | 95 | 171 |
| Provider code | ~347 lines (3 subclasses) | ~290 lines (1 class + pure functions) |
| Adding a provider | Write a build function | Add 1 line of data |
| Review issues caught | — | 1 CRITICAL + 6 HIGH before hitting production |

Full case study: [`docs/methodology.md`](docs/methodology.md)

## Documentation

| Document | What's in it |
|----------|-------------|
| [`SKILL.md`](SKILL.md) | The skill itself — role definitions, gates, dispatch rules |
| [`docs/methodology.md`](docs/methodology.md) | The full story — why it exists, how it evolved (v0→v3), unblind case study |
| [`resources/claude-md-template.md`](resources/claude-md-template.md) | Drop-in CLAUDE.md segment for your project |

## License

MIT © 2026 Santaz

---

<p align="center">
  <sub>Built with Claude Code. Designed by accident. Refined through iteration.</sub>
</p>

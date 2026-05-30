<h1 align="center">DevFlow</h1>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0-blue" alt="version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
  <img src="https://img.shields.io/badge/agentskills.io-compatible-purple" alt="agentskills.io">
  <img src="https://img.shields.io/badge/Claude%20Code-ready-orange" alt="Claude Code">
</p>
<p align="center">
  <em>A dual-pipeline multi-agent workflow framework.</em>
  <br>
  PM + 6 agents + 5 gates = code that doesn't silently break.
</p>

---

[中文](README.md) | English

## What is DevFlow?

DevFlow is a reusable **Agent Skill** that turns Claude Code into a project manager. When you say "multi-agent", instead of blindly dispatching subagents, it follows a battle-tested workflow:

```
Leader requests
  → PM aligns scope
    → Part 1: Architect designs → Developer builds → 3×Reviewers audit
    → Part 2: Security Lead → QA tests → RE fixes (≤3 rounds)
      → CLEAN or loop back
```

Born from building [unblind](https://github.com/Santazuki/unblind). Three iterations, forged by real problems.

## What It Solves

Giving Claude Code the Agent tool is like handing someone a fleet of workers with no foreman.

| Without DevFlow | With DevFlow |
|------|------|
| PM does the work themselves — gates meaningless | PM hard constraints: 4 roles must be independent agents |
| Two devs edit the same file — merge hell | File intersection check before dispatch |
| Three reviewers audit same code — none go deep | Security / Quality / Integration split, zero overlap |
| Reviewer finds a critical bug — now what? | CRITICAL blocks Part 2 → revert → same reviewer re-checks |

## Core Rules

**PM Hard Constraints**: SL, Reviewer, QA, and RE roles must be dispatched as independent agents. PM asks after each gate: *"Did I do this, or an independent agent?"*

**Serial vs Parallel**: Two questions — does B depend on A's output? Same file? If neither, parallel. Read-only agents always parallel.

**Reviewer Dimension Split**: #1 Security (hardcoded keys, injection) · #2 Code Quality (interfaces, DRY, compat) · #3 Integration (data consistency, call chain)

**5 Quality Gates**: G1 design done → G2 SL reviews design → G3 reviewers find no CRITICAL → G4 QA all green → G5 SL final verdict

## Quick Start

```bash
git clone https://github.com/Santazuki/devflow.git .claude/skills/devflow
```

In Claude Code, say: `"multi-agent dev"`, `"dispatch plan"`, `"which tasks can parallelize"`

Integrate into CLAUDE.md:

```bash
cat resources/claude-md-template.md >> CLAUDE.md
```

## Battle Tested

Ran through unblind's Provider v3.0 refactor — 9 files, 3 developers parallel, QA in 1 round:

| Metric | Before | After |
|------|:---:|:---:|
| Tests | 95 | 171 |
| Provider code | ~347 LOC (3 subclasses) | ~290 LOC (1 class + pure functions) |
| Issues caught | — | 1 CRITICAL + 6 HIGH |

## License

MIT © 2026 Santaz

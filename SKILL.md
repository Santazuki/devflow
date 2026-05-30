---
name: devflow
description: >
  Use when starting any multi-step development task that benefits from structured
  multi-agent collaboration. Orchestrates a dual-pipeline workflow: Part 1
  (Architect → Developer + Reviewer) with security-left-shift, Part 2
  (Security Lead → QA → RE ≤3 rounds) with 5 quality gates. Provides PM agent
  with hard constraints, parallel/serial dispatch rules, and reviewer
  dimension-splitting. Triggers: "多agent", "devflow", "dual pipeline",
  "dispatch plan", "派发计划", "关口", "multi-agent workflow".
  NOT: single-file edits, config changes, documentation-only updates,
  simple bug fixes.
metadata:
  version: "1.0.0"
  category: workflow
  author: Santaz
  repository: https://github.com/Santazuki/devflow
  requirements:
    - Claude Code (or compatible agent platform)
  bundled_resources:
    - resources/claude-md-template.md
    - docs/methodology.md
compatibility: Claude Code (Agent tool + worktree isolation)
allowed-tools: Agent(Read, Write, Edit, Bash, Grep, Glob)
model: inherit
context: fork
evals:
  - trigger: "多agent开发这个功能"
    expect: Invoke devflow skill, present role checklist
  - trigger: "哪些任务可以并行"
    expect: Output dispatch plan with file intersection analysis
  - trigger: "用双pipeline模式"
    expect: Set up Part 1 pipeline, confirm Leader alignment first
  - trigger: "派发计划"
    expect: List tasks, check file intersections, output serial/parallel decision
  - trigger: "fix a typo in README"
    expect: Do NOT invoke devflow — single-file trivial edit
scenarios:
  - "用户说'多agent开发这个功能' → PM与Leader对齐需求 → 派Architect设计 → 关口推进"
  - "用户说'帮我排一下哪些可以并行' → PM列出文件清单 → 检查交集 → 输出派发计划"
  - "审查发现CRITICAL → PM阻断Part 2 → 退回Developer → 同一Reviewer复审查 → 确认→放行"
  - "Part 2 QA失败 → RE诊断 → 环境/配置问题本轮修 → 代码bug回Developer → 重测"
---

<!-- L1: Metadata (~200 tokens) | L2: Instructions below (~900 tokens) -->

# DevFlow — 双 Pipeline 多 Agent 协作

## 概述

你是 PM Agent，管理 6 个 Subagent 通过双 Pipeline 完成开发。严格按照本文档的铁律、关口和调度规则执行。

## 触发条件

| 触发 | 不触发 |
|------|--------|
| "多agent"、"devflow"、"双pipeline" | 单文件改动 |
| "派发计划"、"哪些可以并行" | 配置修改 |
| "关口"、"CRITICAL"、"回退" | 纯文档更新 |
| 跨 3+ 文件的开发或重构 | typo 修复 |

## Iron Rules

1. PM 不得亲自执行 SL / Reviewer / QA / RE。违反 = 关口无效
2. 派发 Developer 前必须检查文件交集。有交集 = 串行
3. Step 0 对齐需求不可跳过。未对齐不派任何 Agent
4. Step -1 首次必执行。确保项目 CLAUDE.md 含多 Agent 协作段
5. CRITICAL 阻断 Part 2，必须同一 Reviewer 复审查后才放行

| 你可能在想 | 事实 |
|-----------|------|
| "我自己审更快，不派 Agent 了" | 自己审自己派的活 = 盲区，查不出问题 |
| "这两个 Dev 可以同时派吧" | 先检查文件清单有没有交集 |
| "QA 就一个 node --test，我跑一下就行" | 测试和修 bug 不能同一人 |
| "这个 CRITICAL 修完直接进 Part 2 吧" | 必须同一 Reviewer 复审查确认 |

## 错误处理

| 情况 | 原因 | 处理 |
|------|------|------|
| PM 违规亲自做了审查 | 跳过了 Agent 派发 | 补派独立 Agent，重新审查 |
| Developer 并行后合并冲突 | 文件有交集但未检查 | 回退，标记冲突文件，串行重来 |
| Reviewer 发现 CRITICAL | 安全漏洞/逻辑错误/接口断裂 | 阻断 Part 2，回 Developer，同 Reviewer 复审 |
| QA 测试失败 | 代码 bug / 环境问题 / 测试过时 | RE 诊断 → 环境/测试本轮修，代码 bug 回 Developer |
| 3 轮 QA 仍未通过 | 问题超出修复能力 | SL 判定：非阻塞→known-issues，阻塞性→通知 Leader |

## Step -1: 加载项目模板

首次使用或项目 CLAUDE.md 无多 Agent 段时：

1. 读取 `resources/claude-md-template.md`
2. 检查项目 CLAUDE.md 是否已有 `PM 硬约束` 或 `多 Agent 协作` 章节
3. 若没有 → 追加模板
4. 若有但内容过时 → 提示 Leader 更新

## Step 0: 对齐需求

与 Leader 确认后才派任何 Agent：

- **目标**：一句话
- **边界**：不做什么
- **优先级**：多任务时的顺序
- **成功标准**：怎么算做完

## Step 1-5: 双 Pipeline 执行

### Step 1: Architect 设计 (G1)

```
Agent(description="Architect: 设计<feature>", subagent_type="Plan")
```

输出设计文档。Architect 不完成不派 Developer。

### Step 2: SL 安全左移 (G2)

Architect 输出后立即并行派 SL：

```
Agent(description="SL: 审查设计安全", subagent_type="Explore")
```

输出文件:行号 + 严重度。安全问题 → 回 Architect。

### Step 3: Developer 实现

**派发前必做**：列出每个 Developer 的文件路径 → 检查交集。

串行/并行判定：
1. B 依赖 A 的产出？→ 串行
2. A 和 B 改同一文件？→ 串行
3. 都不是 → 并行（`isolation="worktree"`，事后 cherry-pick）

### Step 4: Reviewer 三维审查 (G3)

派 3 个 Reviewer，各负责一个维度：

| # | 维度 | 关注点 |
|---|------|--------|
| 1 | 安全 | 硬编码 Key、注入、错误消息泄露 |
| 2 | 代码质量 | 接口一致性、DRY、overrides、向后兼容 |
| 3 | 集成 | 数据一致性、调用链、端到端链路 |

CRITICAL → 阻断 Part 2 → 回退 Developer → 同一 Reviewer 复审查 → CLEAN 放行。

### Step 5: Part 2 质量门 (G4→G5)

```
SL 攻击面汇总
  → QA 全量测试 (Agent 独立跑)
    → PASS? → SL 最终评估 → CLEAN
    → FAIL? → RE 修复 (配置/环境/测试→本轮修，代码bug→回Developer)
      → QA 重测 (≤3轮)
        → SL 最终判定 (非阻塞→known-issues, 阻塞性→通知Leader)
```

## 派发前自问 6 条

1. 这个角色我能亲自做？（SL/Reviewer/QA/RE → 不能）
2. 多个 Developer 文件路径有交集？
3. 有人 import 另一个将创建的模块？
4. 这个 Agent 需要前一个 Agent 的产出？
5. 这个 Agent 是只读的？（是 → 自动并行）
6. Part 1 没走完能进 Part 2？（不能）

## 回退规则

| 失败类型 | 谁修 | 回退到 |
|---------|------|--------|
| 配置/环境/测试断言 | RE | 本轮 |
| 代码逻辑 bug | Developer | Part 1 |
| 设计缺陷/接口断裂 | Architect | Part 1 从头 |

## 重构后全量扫描

Part 2 CLEAN 后：grep 旧类名/旧文件名/旧模块数/旧测试数 → README/SKILL/CLAUDE/package/memory 逐文件修。

## 记忆口诀

```
只读一定并行，写操作用文件判。
无交无依赖并行，有交有依赖串行。
Part 2 全程串行，CRITICAL 必回退。
PM 不得亲自做，自己审自己是盲区。
```

<!-- L3: Resources (on-demand) -->

## Resources

- `resources/claude-md-template.md` — CLAUDE.md 多 Agent 段模板。Step -1 自动集成
- `docs/methodology.md` — 完整方法论（v0→v3 演进 + unblind 实战案例）
- `README.md` — 安装指南、核心规则速查

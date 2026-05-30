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

<!-- L1: Metadata (~180 tokens) | L2: Instructions below (~800 tokens) -->

# DevFlow — 双 Pipeline 多 Agent 协作框架

## 概述

你是一个 PM Agent，负责协调 6 个 Subagent 通过双 Pipeline 完成开发任务。严格按照本文档的关口、调度规则和硬约束执行，不要走捷径。

## 启动流程

### Step 0: 对齐需求

在派发任何 Agent 之前，与 Leader 确认：

- **目标**：一句话描述本次要完成什么
- **边界**：明确不做什么
- **优先级**：如果有多个任务，哪个先
- **成功标准**：怎么算做完（测试数、性能、文档等）

不跳过这一步。

### Step 1: 派 Architect 设计

```
Agent(description="Architect: 设计<feature>", subagent_type="Plan")
```

Architect 输出设计文档到 `docs/design/`。**不等 Architect 完成不派 Developer。**

### Step 2: SL 安全左移（G2）

Architect 输出设计文档后，**立即并行**派 SL 审查设计：

```
Agent(description="SL: 审查设计安全", subagent_type="Explore")
```

SL 输出：文件:行号 + 严重度（HIGH/MEDIUM）+ 修复建议。安全问题 → 回 Architect。

### Step 3: 派 Developer 实现

**派发前必须检查文件交集**。每个 Developer 任务需声明涉及的文件路径。

**调度决策**：
1. B 依赖 A 的代码？→ 串行
2. A 和 B 改同一文件？→ 串行
3. 都不是 → 并行

并行 Developer 使用 `isolation="worktree"` 隔离。事后 cherry-pick 合并。

### Step 4: Reviewer 三维审查（G3）

派 3 个 Reviewer，各负责一个维度：

```
#1: Agent(description="CR #1: 安全", subagent_type="Explore")
     关注: API Key泄露、硬编码Key、注入、错误消息泄露

#2: Agent(description="CR #2: 代码质量", subagent_type="Explore")
     关注: 接口一致性、DRY、overrides、向后兼容

#3: Agent(description="CR #3: 集成", subagent_type="Explore")
     关注: 数据一致性、调用链、开关行为、端到端链路
```

CRITICAL 发现 → 阻断 Part 2 → 退回 Developer → **同一 Reviewer 复审查** → CLEAN 才放行。

### Step 5: Part 2 质量门

```
SL 攻击面汇总
  → QA 全量测试
    → RE 修复失败项（配置/环境/测试bug本轮修，代码bug回Developer）
      → QA 重测（≤3轮）
        → SL 最终评估 → CLEAN
```

## PM 硬约束

**以下角色必须通过 Agent 工具派发独立 Agent。PM 亲自做 = 关口无效。**

| 角色 | 派发时机 | 自检 |
|------|----------|------|
| Security Lead | G2 + Part 2 | "SL 报告是独立 Agent 写的？" |
| Reviewer #1/#2/#3 | G3 | "审查结论是独立 Agent 出的？" |
| QA Engineer | Part 2 | "测试是独立 Agent 跑的？" |
| Reliability Engineer | Part 2 | "修复是独立 Agent 做的？" |

## 派发前自问 6 条

1. 这个角色我能不能亲自做？（SL/Reviewer/QA/RE → 不能）
2. 派多个 Developer，文件路径有交集吗？
3. 有谁 import 另一个将创建的模块？
4. 这个 Agent 需要前一个 Agent 的产出吗？
5. 这个 Agent 是只读的吗？（是 → 自动并行）
6. Part 1 没走完能进 Part 2 吗？（不能）

## CRITICAL 阻断规则

| 类型 | 示例 | 处理 |
|------|------|------|
| 安全漏洞 | 硬编码 Key、注入点 | 阻断→回退→同Reviewer复审 |
| 逻辑错误 | 数据损坏、状态机错误 | 同上 |
| 接口断裂 | Provider 签名变更未同步 | 同上 |

WARNING/INFO 不阻断。

## 回退规则

| 失败类型 | 谁修 | 回退到 |
|---------|------|--------|
| CI配置/环境/测试断言过时 | RE | 本轮 |
| 代码逻辑 bug | Developer | Part 1 |
| 设计缺陷/接口断裂 | Architect | Part 1 从头 |

## 重构后全量扫描

Part 2 CLEAN 后执行。grep 旧类名/旧文件名/旧模块数/旧测试数 → README/SKILL/CLAUDE/package/memory 逐文件修。

## 记忆口诀

```
只读一定并行，写操作用文件判。
无交无依赖并行，有交有依赖串行。
Part 2 全程串行，CRITICAL 必回退。
PM 不得亲自做，自己审自己是盲区。
```

## 资源

- `resources/claude-md-template.md` — 可复制到项目的 CLAUDE.md 多 Agent 段
- `docs/methodology.md` — 完整方法论（背景、v0→v3 演进、unblind 案例）

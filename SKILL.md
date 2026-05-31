---
name: devflow
description: >
  Use when starting any multi-step development task that benefits from structured
  multi-agent collaboration. Orchestrates a dual-pipeline workflow with 5 quality
  gates: Part 1 (Architect → Developer + Reviewer, Security Lead reviews design
  in parallel) and Part 2 (Security Lead → QA Engineer → Reliability Engineer,
  ≤3 rounds). Provides PM agent with hard constraints, parallel/serial dispatch
  rules, and reviewer dimension-splitting (security / code quality / integration).
  Platform-agnostic — adapts to Claude Code, Copilot, Cursor, Windsurf, or any
  agent-capable environment.
  Triggers: "多agent", "devflow", "dual pipeline", "dispatch plan", "派发计划",
  "关口", "multi-agent workflow".
  NOT: single-file edits, config changes, documentation-only updates, simple bug fixes.
metadata:
  version: "1.0.0"
  category: workflow
  author: Santaz
  repository: https://github.com/Santazuki/devflow
  requirements:
    - Agent-capable platform (Claude Code, Copilot, Cursor, Windsurf, etc.)
  bundled_resources:
    - resources/claude-md-template.md
    - resources/dispatch-rules.md
    - resources/platform-adapters.md
    - docs/methodology.md
compatibility: Claude Code, GitHub Copilot, Codex, Cursor, Windsurf, any agent platform
---

<!-- LEVEL 1: Metadata above (~200 tokens, always loaded) -->
<!-- LEVEL 2: Instructions below (~700 tokens, loaded on trigger) -->

# DevFlow

双 Pipeline 多 Agent 协作。你是 PM Agent，管理 6 个 Subagent，按铁律和关口执行。不要走捷径。

## Iron Rules

1. PM 不得亲自执行 SL / Reviewer / QA / RE。违反 = 关口无效
2. 派发 Developer 前必须检查文件交集。有交集 = 串行
3. Step 0 对齐需求不可跳过
4. Step -1 首次必执行。确保项目配置含多 Agent 协作规则
5. CRITICAL 阻断 Part 2，必须同一 Reviewer 复审查后才放行

## Quick Start

Leader 说"多agent" → PM 对齐 → Architect 设计 → SL 并行审设计 → Developer 实现 → Reviewer 三维审查 → Part 2 质量门 → CLEAN → 文档

## Edge Cases

- PM 违规亲自做了审查 → 补派独立 Agent，关口不计数
- Reviewer 发现 CRITICAL → 阻断 Part 2，回 Developer，同 Reviewer 复审
- QA 测试失败 → RE 诊断；环境/配置本轮修，代码 bug 回 Developer
- 3 轮 QA 未过 → SL 判定：非阻塞→known-issues，阻塞性→通知 Leader

## Step -1: 加载项目配置

1. 读取 `resources/claude-md-template.md`（或其他平台等效项）
2. 检查项目配置是否已有 `PM 硬约束` 或 `多 Agent 协作` 规则
3. 若没有 → 追加。若过时 → 提示 Leader 更新

## Step 0: 对齐需求

与 Leader 确认：**目标** / **边界** / **优先级** / **成功标准**。不跳过。

## Step 1-6: 双 Pipeline

### Step 1: Architect 设计 (G1)

派 Architect 输出设计文档。不等 Architect 完成不派 Developer。平台语法见 `resources/platform-adapters.md`。

### Step 2: SL 安全左移 (G2)

Architect 输出后立即并行派 SL 审查设计安全 → 输出文件:行号 + 严重度。安全问题 → 回 Architect。

### Step 3: Developer 实现

**派发前必做**：列出每个 Developer 的文件路径 → 检查交集。B 依赖 A 的产出？→ 串行 · 改同一文件？→ 串行 · 都不是 → 并行（独立工作区，事后合并）

### Step 4: Reviewer 三维审查 (G3)

| # | 维度 | 关注点 |
|---|------|--------|
| 1 | 安全 | 硬编码 Key、注入、错误消息泄露 |
| 2 | 代码质量 | 接口一致性、DRY、overrides、向后兼容 |
| 3 | 集成 | 数据一致性、调用链、端到端链路 |

CRITICAL → 阻断 Part 2 → Developer 修复 → 同一 Reviewer 复审查 → CLEAN 放行。

### Step 5: Part 2 质量门 (G4→G5)

```
SL 攻击面汇总 → QA 全量测试 (独立 Agent)
  → PASS? → SL 最终评估 → CLEAN
  → FAIL? → RE 修复 → QA 重测 (≤3轮) → SL 判定
```

### Step 6: 文档撰写

按项目类型选择同步策略（详见 `resources/dispatch-rules.md`）。所有类型必做：测试报告 + 项目配置数据同步。文档后执行全量扫描。

## 记忆口诀

```
只读一定并行，写操作用文件判。
无交无依赖并行，有交有依赖串行。
Part 2 全程串行，CRITICAL 必回退。
PM 不得亲自做，自己审自己是盲区。
```

<!-- LEVEL 3: Resources (on-demand, see files below) -->

## Resources

- `resources/claude-md-template.md` — 项目配置模板。Step -1 自动集成
- `resources/dispatch-rules.md` — 派发自问6条、回退规则、文档策略、全量扫描
- `resources/platform-adapters.md` — 各平台 Agent 派发语法（Claude Code/Copilot/Cursor 等）
- `docs/methodology.md` — 完整方法论（v0→v3 演进 + unblind 实战案例）
- `README.md` — 安装指南、核心规则速查

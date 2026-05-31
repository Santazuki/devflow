---
name: devflow
description: >
  Use when starting any multi-step development task that benefits from structured
  multi-agent collaboration. Orchestrates a dual-pipeline workflow with 5 quality
  gates: Part 1 (Architect → Developer + Reviewer, Security Lead reviews design
  in parallel) and Part 2 (Security Lead → QA Engineer → Reliability Engineer,
  ≤3 rounds). Provides PM agent with hard constraints, parallel/serial dispatch
  rules, and reviewer dimension-splitting (security / code quality / integration).
  Triggers: "多agent", "devflow", "dual pipeline", "dispatch plan", "派发计划",
  "关口", "multi-agent workflow".
  NOT: single-file edits, config changes, documentation-only updates, simple bug fixes.
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
---

<!-- LEVEL 1: Metadata above (~200 tokens, always loaded) -->
<!-- LEVEL 2: Instructions below (~800 tokens, loaded on trigger) -->

# DevFlow

双 Pipeline 多 Agent 协作。你是 PM Agent，管理 6 个 Subagent，严格按照铁律、关口和调度规则执行。

## Iron Rules

1. PM 不得亲自执行 SL / Reviewer / QA / RE。违反 = 关口无效
2. 派发 Developer 前必须检查文件交集。有交集 = 串行
3. Step 0 对齐需求不可跳过。未对齐不派任何 Agent
4. Step -1 首次必执行。确保项目 CLAUDE.md 含多 Agent 协作段
5. CRITICAL 阻断 Part 2，必须同一 Reviewer 复审查后才放行

## Quick Start

Leader 说"多agent开发这个功能" → PM 对齐需求 → 派 Architect 设计 → SL 并行审设计 → Developer 实现 → Reviewer 三维审查 → Part 2 质量门 → CLEAN

## Edge Cases

- PM 违规亲自做了审查 → 补派独立 Agent，重新审查，关口不计数
- Developer 并行后合并冲突 → 标记冲突文件，串行重来
- Reviewer 发现 CRITICAL → 阻断 Part 2，回 Developer，同 Reviewer 复审
- QA 测试失败 → RE 诊断；环境/配置本轮修，代码 bug 回 Developer
- 3 轮 QA 仍未通过 → SL 判定：非阻塞→known-issues.md，阻塞性→通知 Leader
- Leader 未指定优先级 → 按文件依赖关系自动排序
- 项目无 CLAUDE.md → Step -1 从模板创建

## Step -1: 加载项目模板

1. 读取 `resources/claude-md-template.md`
2. 检查项目 CLAUDE.md 是否已有 `PM 硬约束` 或 `多 Agent 协作` 章节
3. 若没有 → 追加模板
4. 若有但内容过时 → 提示 Leader 更新

## Step 0: 对齐需求

与 Leader 确认后才派任何 Agent：
- **目标** / **边界** / **优先级** / **成功标准**

## Step 1-5: 双 Pipeline

### Step 1: Architect 设计 (G1)

`Agent(description="Architect: 设计<feature>", subagent_type="Plan")` → 输出设计文档。不等 Architect 完成不派 Developer。

### Step 2: SL 安全左移 (G2)

Architect 输出后立即并行派：`Agent(description="SL: 审查设计安全", subagent_type="Explore")` → 输出文件:行号 + 严重度。安全问题 → 回 Architect。

### Step 3: Developer 实现

**派发前必做**：列出每个 Developer 的文件路径 → 检查交集。

串行/并行判定：B 依赖 A 的产出？→ 串行 · 改同一文件？→ 串行 · 都不是 → 并行（`isolation="worktree"`，cherry-pick 合并）

### Step 4: Reviewer 三维审查 (G3)

派 3 个 Reviewer，各负责一个维度：

| # | 维度 | 关注点 |
|---|------|--------|
| 1 | 安全 | 硬编码 Key、注入、错误消息泄露 |
| 2 | 代码质量 | 接口一致性、DRY、overrides、向后兼容 |
| 3 | 集成 | 数据一致性、调用链、端到端链路 |

CRITICAL → 阻断 Part 2 → Developer 修复 → 同一 Reviewer 复审查 → CLEAN 放行。

### Step 5: Part 2 质量门 (G4→G5)

```
SL 攻击面汇总 → QA 全量测试 (Agent 独立跑)
  → PASS? → SL 最终评估 → CLEAN
  → FAIL? → RE 修复 → QA 重测 (≤3轮) → SL 判定
```

### Step 6: 文档撰写

Part 2 CLEAN 后，PM 执行以下文档工作：

- **测试报告**：输出到 `docs/test-results/step<N>-<name>.md`，含测试数、通过/失败/跳过统计
- **CLAUDE.md 同步**：更新模块数、测试数、Phase 状态、架构描述
- **README/SKILL/package 同步**：版本号、功能列表、目录结构
- **记忆文件**：设计决策、项目状态、文档索引写入 memory/

文档写完后执行全量扫描确保无遗漏。

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

<!-- LEVEL 3: Resources (on-demand, see files below) -->

## Resources

- `resources/claude-md-template.md` — CLAUDE.md 多 Agent 段模板。Step -1 自动集成
- `docs/methodology.md` — 完整方法论（v0→v3 演进 + unblind 实战案例）
- `README.md` — 安装指南、核心规则速查

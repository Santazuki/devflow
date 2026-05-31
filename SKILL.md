---
name: devflow
description: >
  Use when starting any multi-step development task that benefits from structured
  multi-agent collaboration. Orchestrates a dual-pipeline workflow with 5 quality
  gates: Part 1 (Architect → Developer + Reviewer, Security Lead reviews design
  in parallel) and Part 2 (Security Lead → QA Engineer → Reliability Engineer,
  ≤3 rounds). Provides PM agent with hard constraints, parallel/serial dispatch
  rules, and reviewer dimension-splitting (security / code quality / integration).
  Universal workflow — adapts to any environment capable of task delegation.
  Triggers: "多agent", "devflow", "dual pipeline", "dispatch plan", "派发计划",
  "关口", "multi-agent workflow".
  NOT: single-file edits, config changes, documentation-only updates, simple bug fixes.
metadata:
  version: "1.0.0"
  category: workflow
  author: Santaz
  repository: https://github.com/Santazuki/devflow
  requirements: none
  bundled_resources:
    - resources/workflow-config-template.md
    - resources/dispatch-rules.md
    - resources/platform-adapters.md
    - docs/methodology.md
compatibility: universal
---

<!-- LEVEL 1: Metadata above (~200 tokens, always loaded) -->
<!-- LEVEL 2: Instructions below (~600 tokens, loaded on trigger) -->

# DevFlow

双 Pipeline 多 Agent 协作方法论。你是 PM，按关口推进、按规则调度、不越权替代。

不依赖特定工具。有 Agent 平台可以自动化，没有则可以手动执行。**核心是流程本身，不是执行方式。**

## Iron Rules

1. PM 不得亲自执行 SL / Reviewer / QA / RE。违反 = 关口无效
2. 派发实现者前必须检查文件交集。有交集 = 串行
3. Step 0 对齐需求不可跳过
4. CRITICAL 阻断 Part 2，必须同一审查者复审查后才放行

## Edge Cases

- PM 违规亲自做了审查 → 补派独立审查者，关口不计数
- 审查者发现 CRITICAL → 阻断 Part 2，回实现者，同审查者复审
- 测试失败 → 诊断修复；环境/配置本轮修，代码 bug 回实现者
- 3 轮测试未过 → SL 判定：非阻塞→known-issues，阻塞性→通知 Leader

## Step 0: 对齐需求

与 Leader 确认：**目标** / **边界** / **优先级** / **成功标准** / **分支策略**。同时检测项目是否关联 GitHub 和 npm。不跳过。

## Step 1-7: 双 Pipeline

### Step 1: 设计 (G1)

指定设计者输出设计文档。设计未完成不推进实现。

### Step 2: 安全左移 (G2)

设计完成后，指定独立安全审查者审设计——不等实现开始。输出文件:行号 + 严重度。安全问题 → 回设计者。

### Step 3: 实现

**派发前必做**：列出每个实现者的文件路径 → 检查交集。B 依赖 A 的产出？→ 串行 · 改同一文件？→ 串行 · 都不是 → 并行（独立工作空间）

### Step 4: 三维审查 (G3)

3 个审查者，各负责一个维度（审查者 ≠ 实现者）：

| # | 维度 | 关注点 |
|---|------|--------|
| 1 | 安全 | 硬编码 Key、注入、错误消息泄露 |
| 2 | 代码质量 | 接口一致性、DRY、overrides、向后兼容 |
| 3 | 集成 | 数据一致性、调用链、端到端链路 |

CRITICAL → 阻断 Part 2 → 实现者修复 → 同一审查者复审查 → CLEAN 放行。

### Step 5: 质量门 (G4→G5)

安全审查者汇总攻击面 → 独立测试者全量测试（单元≥70%, 集成≥20%, E2E≥10%）→ 通过则 CLEAN，失败则修复后重测（≤3轮）→ 安全审查者最终判定。

### Step 6: 文档撰写

按项目类型选择同步策略。所有类型必做：版本号更新（semver）+ 测试报告 + 项目元数据同步。npm 包执行发布流程。详情见 `resources/dispatch-rules.md`。

### Step 7: 复盘

CLEAN 后启动复盘。对事不对人，关注系统改进而非追责。输出时间线 + 根因 + Action Items。详情见 `resources/dispatch-rules.md`。

## 记忆口诀

```
只读一定并行，写操作用文件判。
无交无依赖并行，有交有依赖串行。
Part 2 全程串行，CRITICAL 必回退。
PM 不得亲自做，自己审自己是盲区。
```

<!-- LEVEL 3: Resources (on-demand, see files below) -->

## Resources

- `resources/workflow-config-template.md` — 项目配置模板。首次使用时集成
- `resources/dispatch-rules.md` — 派发自问6条、回退规则、文档策略、全量扫描
- `resources/platform-adapters.md` — 各平台执行方式（Claude Code/Copilot/Cursor/手动等）
- `docs/methodology.md` — 完整方法论（v0→v3 演进 + unblind 实战案例）
- `README.md` — 安装指南、核心规则速查

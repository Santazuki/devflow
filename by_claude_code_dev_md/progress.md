# DevFlow 本身开发进展

> **本文件用途**：记录 DevFlow 方法论/工具本身的开发进度。
> **更新时机**：① 新 Plan 经 Leader 同意后 ② DevFlow 在实战中有了新进展（检验了哪些部分、暴露了什么问题、验证了哪些假设）。
> 最后更新：2026-06-03。

---

## 当前阶段

**Phase 1 核心机制完成（含 Step 6 Spec 同步增强），Phase 2/3 待实战反馈后启动。版本 1.1.0。**

---

## ✅ 已完成

### 方法论核心（v1.0.0 → v1.1.0）

- 双 Pipeline 架构：Part 0 (Research) → Part 1 (Architect → Developer + Reviewer) → Part 2 (SL → QA → RE ≤3 轮)
- 5 个质量关口：G1(设计出) → G2(SL 审设计) → G3(Reviewer 无 CRITICAL) → G4(QA 全绿) → G5(SL 最终判)
- **6 条 Iron Rules**（原 4 条，v1.1.0 新增 2 条）：

| # | 规则 | 版本 |
|---|------|:---:|
| 1 | PM 不得亲自执行 SL / Reviewer / QA / RE | v1.0.0 |
| 2 | 无测试不合并 | v1.0.0 |
| 3 | Step 0 对齐需求不可跳过 | v1.0.0 |
| 4 | CRITICAL 阻断 Part 2，同审查者复审查后放行 | v1.0.0 |
| 5 | PM 不得中途问 commit 或推进许可。commit 是终点，推进是 PM 职责。中间仅方向同步，Leader 指定全自动则跳过 | v1.1.0 |
| 6 | Step 0.5 不可跳过（Full 模式）。设计前必须完成上下文调研并注入下游提示词 | v1.1.0 |

- Full / Lite 双模式
- **Step 0.5 Discovery 上下文调研**（v1.1.0 新增）
- **Research Agent**：第 7 个 Agent 类型（v1.1.0 新增）
- **3 种搜索模式**：低 / 中 / 高（v1.1.0 新增）
- **PM 与 Leader 交互纪律**（v1.1.0 新增，2026-06-03 精确化为 Part 级方向同步）
- **完全自动化模式**（v1.1.0 新增）
- **Step 6 Spec 同步**（v1.1.0 新增，2026-06-03）：设计文档归档 + CHANGELOG delta 记录

### Step -1 → Step 7 闭环（v1.1.0）

| 步骤 | 内容 | 关口 | 版本 |
|------|------|:---:|:---:|
| Step -1 | 熟悉项目（静默） | — | v1.0.0 |
| Step 0 | 对齐需求 + 实时调研 + 选择模式 | — | v1.1.0 增强 |
| Step 0.5 | Discovery 上下文调研（规划调研 + 编译提示词） | — | v1.1.0 新增 |
| Step 1 | 设计（受 Knowledge Brief 约束） | G1 | v1.1.0 增强 |
| Step 2 | 安全左移（含调研注入的合规检查项） | G2 | v1.1.0 增强 |
| Step 3 | 实现 | — | v1.0.0 |
| Step 4 | 三维审查（含调研注入的特化检查项） | G3 | v1.1.0 增强 |
| Step 5 | 质量门（SL→QA→RE，含调研注入的测试场景） | G4→G5 | v1.1.0 增强 |
| Step 6 | 文档撰写（含调研附录归档 + Spec 同步 + CHANGELOG） | — | v1.1.0 增强 |
| Step 7 | 复盘（含 Knowledge Brief 准确度对照） | — | v1.1.0 增强 |

### 调度规则

- 串行/并行两问决策
- 6+1 条派发前自问清单（v1.1.0 新增第 7 条：Step 0.5 做了吗？）
- 只读 Agent 永远可并行（含 Research Agent）
- Worktree 隔离 ≠ 并行通行证
- **PM 与 Leader 交互纪律完整章节**（v1.1.0 新增）
- **上下文调研两时机**：Step 0 对齐中实时调研 + Step 0.5 规划调研（v1.1.0 新增）

### Agent 阵容（v1.1.0）

```
PM → 7 个 Subagent：
  Part 0: Research Agent ×1-3（上下文调研）
  Part 1: Architect → Developer + Reviewer×3 + SL（并行审设计）
  Part 2: SL → QA → RE（≤3 轮）
```

### 资源文件（L3）

| 文件 | 内容 | 版本 |
|------|------|:---:|
| `resources/dispatch-rules.md` | 派发自问、PM 交互纪律、上下文调研规则、测试分层、DoD、回退规则、版本管理、分支策略、复盘框架 | v1.1.0 |
| `resources/platform-adapters.md` | Claude Code / Copilot / Cursor / Windsurf + Research Agent 行 | v1.1.0 |
| `resources/research-agent-schema.md` | Research Agent 完整定义：3 种搜索模式 + 2 种状态 + Schema + 搜索策略 | v1.1.0 新增 |
| `resources/prompt-augmentation-guide.md` | PM 提示词编译指南 + 6 个 Agent 提示词模板 + 注入量控制 | v1.1.0 新增 |
| `resources/research-taxonomy.md` | 知识领域分类体系 + 10 行映射表 + 搜集方向判定算法 | v1.1.0 新增 |
| `resources/workflow-config-template.md` | 项目 CLAUDE.md 集成模板（含 Step 0.5） | v1.1.0 |
| `docs/methodology.md` | 完整方法论（v0→v3 演进 + unblind 实战案例） | v1.0.0 |
| `docs/contextual-research-plan.md` | 上下文调研增强设计文档（Phase 1-3 完整设计） | v1.1.0 新增 |
| `docs/devflow-validation.md` | 完整性检验文档（102 项） | v1.1.0 |
| `README.md` + `README_en.md` | 安装指南、核心规则速查 | v1.0.0 |
| `CLAUDE.md` | 本仓库开发指南 | v1.1.0 |

### 测试

- `tests/devflow-check.js`：65 → **104 项**（v1.1.0）
- 9 个检验类别：SKILL.md 结构、文件存在性、dispatch-rules 完整性、platform-adapters 覆盖、工作流链路、Iron Rules 映射、资源互引用、Research Agent Schema 完整性、Prompt Augmentation Guide 完整性

### 实战检验

| 项目 | 模式 | 状态 | 备注 |
|------|:---:|:---:|------|
| **unblind Provider v3.0 重构** | Full（旧版） | ✅ 通过 | 16→15 模块，95→171 tests，1 CRITICAL + 6 HIGH |
| **zeshim 优化** | Lite（旧版 v1.0.0） | ✅ 通过 | 旧版本 Lite 模式，未含 Step 0.5 / Research Agent |

---

## ⚠️ 待验证

| 项目 | 说明 |
|------|------|
| **v1.1.0 Full 模式** | Step 0.5 + Research Agent + 提示词工程管道未在实战中完整跑过 |
| **v1.1.0 Lite 模式** | 新 Lite 模式（含最小调研）未验证 |
| **Research Agent 状态二** | 对齐中实时调研 + Step 1-5 触发调研未验证 |
| **三种搜索模式** | 低/中/高的实际效果和 token 消耗未实测 |
| **完全自动化模式** | autoMode 跳过所有中间同步，未验证 |
| **提示词工程管道** | promptAugmentation 的实际注入效果未验证 |
| **非 Claude Code 平台** | Copilot/Cursor/Windsurf 适配器未测试 |
| **自举** | devflow 自身未经历 v1.1.0 Full 模式 |

---

## 🔧 待优化

| 项目 | 说明 | 计划 |
|------|------|------|
| Phase 2 映射表扩充 | 10 行 → 30+ 行映射表 + 速查卡 | 依赖实战反馈 |
| Phase 3 反馈闭环 | Step 7 复盘 ↔ Knowledge Brief 准确度评估 | 依赖 Phase 2 |
| dispatch-rules.md 长度 | 已 17 章节（含新增 PM 交互纪律 + 上下文调研），可能需拆分 | 待评估 |
| 英文版资源 | research-agent-schema / prompt-augmentation-guide / taxonomy 目前仅中文 | 待需求 |
| workflow-config-template.md | "复制即用"未验证 | — |
| git-workflow skill 打通 | Step 6 触发自动提交/打 tag | — |
| **知识领域整理机制** | 映射表自底向上抽象重组：相似下层条目抽象升到上层。核心难点：分类重组（何时新增关注面/何时合并）和合并去重（相似搜索方向如何判定）。当前晋升/同步机制够用但缺少系统性整理逻辑。需新开文档设计 | 等实战积累 ≥10 条扩展条目后启动 |

---

## 下一步

1. **在真实项目中检验 v1.1.0**：用 Full 模式跑一次完整周期，验证 Step 0.5 → 提示词注入 → 审查/测试增强的全链路
2. **收集反馈**：Research Agent 的搜索质量、提示词注入的实用性、三种模式的参数是否需要调整
3. **Phase 2**：根据反馈扩充映射表，为高频领域写速查卡

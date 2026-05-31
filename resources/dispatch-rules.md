# DevFlow 调度规则参考

> L3 资源，PM 按需读取。L2 中已覆盖核心流程，此处为完整细节。

## 派发前自问 6 条

1. 这个角色我能亲自做？（SL/Reviewer/QA/RE → 不能）
2. 多个 Developer 文件路径有交集？
3. 有人 import 另一个将创建的模块？
4. 这个 Agent 需要前一个 Agent 的产出？
5. 这个 Agent 是只读的？（是 → 自动并行）
6. Part 1 没走完能进 Part 2？（不能）

## 测试分层（Testing Pyramid）

PM 在 Step 5 确保测试覆盖合理比例。参照行业标准（UK Home Office 2025, Mike Cohn）：

| 层级 | 占比 | 说明 |
|------|:---:|------|
| **单元测试** | ~70% | 快速、隔离、无网络依赖。每个模块独立验证 |
| **集成测试** | ~20% | 模块间交互、API 契约、数据库连接 |
| **端到端测试** | ~10% | 关键用户路径，全链路验证 |

QA 执行时检查：单元测试是否覆盖新增逻辑（≥80% 新代码）？集成测试是否覆盖模块边界？E2E 是否覆盖核心流程？

## 每步 Definition of Done

PM 推进下一步前，确认当前步骤满足 DoD：

| 步骤 | Definition of Done |
|------|------|
| Step 1 设计 | 设计文档已输出、Leader 已确认、文件已提交 |
| Step 2 安全左移 | SL 审查报告已出、安全问题已修复或记录 |
| Step 3 实现 | 代码已提交、`node --test` 通过、`.gitignore` 已更新 |
| Step 4 审查 | 3 维度审查报告已出、无 CRITICAL、问题已修复 |
| Step 5 质量门 | QA 全量通过、SL 最终评估 CLEAN |
| Step 6 文档 | 测试报告已写、CLAUDE.md/README 已同步、全量扫描无遗漏 |
| Step 7 复盘 | 复盘报告已写、Action Items 已分配、known-issues 已更新 |

DoD 不满足 → 不得推进下一步。

## 回退规则

| 失败类型 | 谁修 | 回退到 |
|---------|------|--------|
| 配置/环境/测试断言 | RE | 本轮 |
| 代码逻辑 bug | Developer | Part 1 |
| 设计缺陷/接口断裂 | Architect | Part 1 从头 |

## 测试代码路径

QA 执行测试时，PM 必须明确测试代码位置。若项目未约定，按以下默认规则：

| 路径 | 用途 | 是否提交 |
|------|------|:---:|
| `tests/` 或 `test/` | 测试源码（用例、fixtures） | ✅ 提交 |
| `docs/test-results/` | 测试报告（Step 6 产出） | ✅ 提交 |
| 测试产生的临时文件 | 缓存、截图、日志 | ❌ `.gitignore` 排除 |

PM 在 Step 0 对齐需求时确认测试路径。如项目无测试目录，指定一个（推荐 `tests/`）。

### .gitignore

项目必须排除测试产生的临时文件。最低配置：

```gitignore
# 测试临时文件
tests/**/*.log
tests/**/tmp/
tests/sample_images/*
!tests/sample_images/*.md
```

PM 在 Step 3 实现阶段确保 `.gitignore` 覆盖测试临时文件。

## 重构后全量扫描

Part 2 CLEAN 后执行。grep 旧类名/旧文件名/旧模块数/旧测试数 → README/SKILL/CLAUDE/package/memory 逐文件修。

## 文档撰写策略（Step 6）

| 项目类型 | 同步内容 |
|----------|------|
| **Agent Skill** | SKILL.md、README、CLAUDE.md、测试报告、memory/ |
| **npm 包 / SDK** | README、package.json、CHANGELOG、API 文档 |
| **CLI 工具** | README、--help 输出、man page |
| **通用项目** | README、CLAUDE.md、测试报告 |

所有类型必做：测试报告（`docs/test-results/step<N>-<name>.md`）+ CLAUDE.md 模块/测试数同步。

## 复盘（Post-Mortem）

Part 2 CLEAN 且文档完成后，PM 启动复盘。参照 WHOOP 8-section 模型和 Google SRE 实践：

### 复盘结构

| 节 | 内容 |
|----|------|
| **发生了什么** | 一句话概括 + 影响范围 |
| **时间线** | 关键节点（PR 提交、审查发现、测试失败、修复完成） |
| **根因** | 不是"谁犯了错"，是"什么系统条件导致了问题" |
| **做得好的** | 哪些流程/工具/决策起了作用（强化正面行为） |
| **可改进的** | 具体问题 + 改进建议，按优先级排列 |
| **Action Items** | SMART 条目：负责人 + 截止日期 + 跟踪方式 |

### 原则

- **对事不对人** — "部署流程允许未审查的变更" 而非 "张三没审查就部署了"
- **不追责个体** — 复盘不是审判，是学习
- **Action Items 必须闭环** — 写入项目 issue/任务系统，下次复盘时检查完成率（目标 >90%）

## Action Item 跟踪

| 来源 | 跟踪方式 |
|------|------|
| 审查 CRITICAL | 修复提交 + Reviewer 复审查确认 |
| 复盘 Action Items | 写入项目 issue 系统，标注 `devflow-retro` |
| 已知问题（known-issues） | 写入 `docs/known-issues.md`，标注发现日期和阻塞性 |

PM 在每次触发 devflow 时检查上次复盘 Action Items 的完成状态。

## 记忆口诀

```
只读一定并行，写操作用文件判。
无交无依赖并行，有交有依赖串行。
Part 2 全程串行，CRITICAL 必回退。
PM 不得亲自做，自己审自己是盲区。
```

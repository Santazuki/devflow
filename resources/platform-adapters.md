# DevFlow 平台适配

> L3 资源。DevFlow 核心流程是平台无关的，本文档提供各平台的 Agent 派发语法映射。

## 通用模式

DevFlow 的每个 Step 描述的是**做什么**和**谁来做**，不绑定特定平台的语法。PM 在具体平台执行时，将角色描述翻译为对应平台的 Agent 调用。

## 平台语法映射

### Claude Code

| 角色 | Agent 调用 |
|------|-----------|
| Architect | `Agent(description="Architect: 设计<feature>", subagent_type="Plan")` |
| SL | `Agent(description="SL: 审查设计安全", subagent_type="Explore")` |
| Developer | `Agent(description="Dev: 实现<task>", subagent_type="general-purpose", isolation="worktree")` |
| Reviewer #1 | `Agent(description="CR #1: 安全审计", subagent_type="Explore")` |
| Reviewer #2 | `Agent(description="CR #2: 代码质量", subagent_type="Explore")` |
| Reviewer #3 | `Agent(description="CR #3: 集成兼容", subagent_type="Explore")` |
| QA | `Agent(description="QA: 全量测试")` |
| RE | `Agent(description="RE: 修复失败项")` |

工具：`Read, Write, Edit, Bash, Grep, Glob`。并行 Developer 使用 `isolation="worktree"`。

### GitHub Copilot / Codex

| 角色 | 方法 |
|------|------|
| Architect | 对话中描述设计需求，要求输出设计文档 |
| Developer | 使用 `@workspace` 或文件上下文，逐个任务实现 |
| Reviewer | 使用 `/review` 或对话审查，指定审查维度 |
| QA | 运行 `node --test` 或项目测试命令 |
| RE | 根据测试失败日志修复 |

无原生 Agent 派发——PM 手动控制对话上下文和审查流程。

### Cursor / Windsurf

| 角色 | 方法 |
|------|------|
| Architect | Composer 模式，输入设计需求 |
| Developer | Composer + 文件上下文，逐个任务实现 |
| Reviewer | Chat 模式审查代码片段，指定维度 |
| QA | Terminal 运行测试命令 |
| RE | Composer 修复失败项 |

### 通用 CLI / API

任何支持 LLM 调用的环境均可适配。核心是保持 Part 1 → Part 2 的串行关口和执行顺序。

## 平台无关的核心规则

无论在哪个平台运行，以下规则不变：

- PM 不得亲自执行 SL/Reviewer/QA/RE（在无 Agent 工具的环境，可由 Leader 指定不同对话/上下文执行）
- 派发前检查文件交集（Developer 间）
- 5 个关口严格顺序
- CRITICAL → 阻断 → 回退 → 同一 Reviewer 复审
- Part 2 循环 ≤3 轮

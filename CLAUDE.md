# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

DevFlow 是一个可安装的 **Agent Skill**——把 Claude Code 变成多 Agent 开发任务的项目经理。当用户说"多agent"或"devflow"时，该 Skill 编排一套双 Pipeline 工作流：PM + 6 个专职 Agent + 5 道质量关口。

本仓库是**纯 Markdown + YAML**——无编译、无构建、零依赖。

## 校验

唯一的测试是结构完整性检查：

```bash
node tests/devflow-check.js
```

校验 65 项：SKILL.md 章节完整性、资源文件就位、交叉引用、Iron Rules → Edge Cases 映射、工作流链路（Step 0→7）。预期输出：`65 pass, 0 fail`。

## 架构：渐进式加载（L1→L2→L3）

`SKILL.md` 采用三级渐进式加载，最小化 token 消耗：

| 层级 | 位置 | 大小 | 内容 |
|-------|----------|------|---------|
| **L1** | YAML frontmatter | ~200 tokens | name、description、triggers、compatibility —— 始终加载 |
| **L2** | Markdown 正文 | ~600 tokens | Iron Rules、Edge Cases、Step -1 到 Step 7、记忆口诀 —— 触发匹配后加载 |
| **L3** | `resources/` 文件 | 按需 | 完整派发规则、平台适配、方法论详述 |

编辑 `SKILL.md` 时，L2 保持精简（~600 tokens）。详细规则写入 `resources/` 文件，不放正文。frontmatter 的 `description` 字段是触发匹配面——写清楚何时使用、何时不使用。

## 关键文件

- **`SKILL.md`** — Skill 本身。agentskills.io skill 系统的入口。包含触发后加载的工作流定义。
- **`resources/dispatch-rules.md`** — L3 资源。完整细节：Full/Lite 模式选择、派发前6问清单、测试金字塔比例、每步 Definition of Done、回退规则、版本号管理（semver）、npm 发布流程、分支策略、文档撰写策略、复盘结构。
- **`resources/platform-adapters.md`** — L3 资源。将 DevFlow 的平台无关角色映射到各平台的具体 Agent 调用（Claude Code、Copilot、Cursor、Windsurf、通用 CLI）。
- **`resources/workflow-config-template.md`** — 用户复制到自己项目 CLAUDE.md 中的集成模板。
- **`docs/methodology.md`** — 起源故事：方法论在 unblind 开发中经历 v1→v2→v3 的演进过程，含 Provider v3.0 重构实战案例。
- **`docs/devflow-validation.md`** — 记录校验脚本检查的内容（65 项，8 个类别）。

## .gitignore 注意事项

本仓库自身的 `.gitignore` 排除了 `tests/`、`by_claude_code_dev_md/`、编辑器/OS 文件。这意味着 `tests/devflow-check.js` 通过 git 追踪，但 `tests/` 内的测试输出、日志、临时文件不被追踪。`tests/` 目录本身必须保留在 git 中——仅其**除 devflow-check.js 之外的内容**被忽略。

## 编辑方法论

修改工作流规则时：

1. **从 `SKILL.md` L2 入手**——改核心规则（Iron Rules、Edge Cases、Step 流程）。保持在 ~700 tokens 以内。
2. **细节写入 `resources/dispatch-rules.md`**——Full/Lite 模式差异、DoD 表格、回退矩阵、测试比例等。
3. **如项目集成模板有变，更新 `resources/workflow-config-template.md`**。
4. **如角色定义或派发模式有变，更新 `resources/platform-adapters.md`**。
5. **任何结构性变更后运行 `node tests/devflow-check.js`**——校验交叉引用和章节完整性。
6. **如新增校验类别，更新 `docs/devflow-validation.md`**。
7. **按 semver 更新 `SKILL.md` frontmatter 版本号**（`metadata.version`）。

## 兼容性

该 Skill 标记为 `compatibility: universal`——适用于 Claude Code、Copilot、Cursor、Windsurf 及任何支持任务委派的环境。方法论本身是平台无关的；平台适配器将角色翻译为具体工具调用。添加功能时，避免在核心工作流（L2）中假设 Claude Code 专属工具。平台相关细节属于 `resources/platform-adapters.md`。

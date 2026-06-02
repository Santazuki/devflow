# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

DevFlow 是一个可安装的 **Agent Skill**——把 Claude Code 变成多 Agent 开发任务的项目经理。当用户说"多agent"或"devflow"时，该 Skill 编排一套双 Pipeline 工作流：PM + 7 个专职 Agent + 5 道质量关口 + Step 0.5 上下文调研。

本仓库是**纯 Markdown + YAML**——无编译、无构建、零依赖。

## 校验

唯一的测试是结构完整性检查：

```bash
node tests/devflow-check.js
```

校验项目：SKILL.md 章节完整性、资源文件就位、交叉引用、Iron Rules → Edge Cases 映射、工作流链路、新文件内容完整性。预期输出：全部 ✅。

## 架构：渐进式加载（L1→L2→L3）

`SKILL.md` 采用三级渐进式加载，最小化 token 消耗：

| 层级 | 位置 | 大小 | 内容 |
|-------|----------|------|---------|
| **L1** | YAML frontmatter | ~200 tokens | name、description、triggers、compatibility —— 始终加载 |
| **L2** | Markdown 正文 | ~700 tokens | Iron Rules、Edge Cases、Step -1 到 Step 7、记忆口诀 —— 触发匹配后加载 |
| **L3** | `resources/` 文件 | 按需 | 完整派发规则、平台适配、Research Agent 定义、提示词编译指南、方法论详述 |

编辑 `SKILL.md` 时，L2 保持精简。详细规则写入 `resources/` 文件。frontmatter 的 `description` 字段是触发匹配面——写清楚何时使用、何时不使用。

## 关键文件

- **`SKILL.md`** — Skill 本身。agentskills.io skill 系统的入口。含 6 条 Iron Rules、完整 Step 流程。
- **`resources/dispatch-rules.md`** — 完整调度规则：Full/Lite 模式、派发前 6 问、PM 交互纪律、上下文调研规则、测试金字塔、DoD、回退规则、版本管理、分支策略、复盘。
- **`resources/platform-adapters.md`** — 将 DevFlow 的平台无关角色映射到各平台的具体 Agent 调用。含 Research Agent。
- **`resources/research-agent-schema.md`** — Research Agent 完整定义：两种状态（规划/触发）、输出 Schema、搜索策略。
- **`resources/prompt-augmentation-guide.md`** — PM 如何将调研发现编译为下游 6 个 Agent 的场景化提示词，含每个 Agent 的提示词模板。
- **`resources/workflow-config-template.md`** — 用户复制到自己项目 CLAUDE.md 中的集成模板。
- **`docs/methodology.md`** — 方法论演进（v0→v3）+ unblind 实战案例。
- **`docs/contextual-research-plan.md`** — 上下文调研增强设计文档。

## .gitignore 注意事项

本仓库自身的 `.gitignore` 排除了 `tests/`、`by_claude_code_dev_md/`、编辑器/OS 文件。`tests/devflow-check.js` 通过 git 追踪，但 `tests/` 内其他内容不被追踪。`tests/` 目录本身必须保留在 git 中。

## 编辑方法论

修改工作流规则时：

1. **从 `SKILL.md` L2 入手**——改核心规则（Iron Rules、Edge Cases、Step 流程）。保持在 ~700 tokens 以内。
2. **细节写入 `resources/dispatch-rules.md`**——Full/Lite 模式差异、DoD 表格、回退矩阵、调研规则等。
3. **新增 Agent 类型** → 更新 `resources/research-agent-schema.md` + `resources/platform-adapters.md`。
4. **新增提示词模板** → 更新 `resources/prompt-augmentation-guide.md`。
5. **模板有变** → 更新 `resources/workflow-config-template.md`。
6. **任何结构性变更后运行 `node tests/devflow-check.js`**。
7. **按 semver 更新 `SKILL.md` frontmatter 版本号**（`metadata.version`）。本次已更新到 1.1.0。

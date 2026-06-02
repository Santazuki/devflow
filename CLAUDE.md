# CLAUDE.md

本文件为 AI Agent 开发 DevFlow 自身时提供指导。

## 项目

DevFlow —— 双 Pipeline 多 Agent 协作工作流 Skill。纯 Markdown + YAML，无编译、零依赖。

## 校验

```bash
node tests/devflow-check.js
```

## 架构

`SKILL.md` 三级渐进加载：
- L1（~340 tok）frontmatter —— 始终加载
- L2（~2,400 tok）正文 —— 触发后加载，含 Iron Rules + Step -1→7 + 记忆口诀
- L3 `resources/` —— 按需加载，共 9 个文件（~18,800 tok 合计）

## 关键文件

| 文件 | 用途 |
|------|------|
| `SKILL.md` | Skill 入口，6 Iron Rules + Edge Cases + Step -1→7 |
| `resources/dispatch/rules.md` | 调度规则索引（按需加载 dispatch-core/interaction/research/lifecycle） |
| `resources/dispatch/core.md` | 核心调度：模式、派发、测试、DoD、回退、口诀 |
| `resources/dispatch/interaction.md` | PM-Leader 交互纪律 |
| `resources/dispatch/research.md` | 上下文调研规则 |
| `resources/dispatch/lifecycle.md` | 流程管理：版本、文档、Spec、流程闭环、复盘 |
| `resources/platform-adapters.md` | 各平台 Agent 调用语法映射 |
| `resources/research/schema.md` | Research Agent 定义：3 模式 + 2 状态 + Schema |
| `resources/prompt/guide.md` | 提示词工程索引（编译管道 + 路由规则） |
| `resources/prompt/templates.md` | Agent 提示词模板 |
| `resources/prompt/compression.md` | 注入量控制 + 三级压缩 + 故障应对 |
| `resources/research/taxonomy.md` | 知识分类体系 + 映射表 + 未命中处理 |
| `resources/research/taxonomy-extended.md` | 扩展映射表（未命中记录 + 候选） |
| `resources/research/taxonomy-reorganization.md` | 知识领域整理机制（晋升/合并/归档） |
| `resources/research/search-strategy.md` | 搜索操作规范：关键词构造、来源判定、Fetch 要求 |
| `resources/workflow-config-template.md` | 用户项目集成模板 |
| `README.md` + `README_en.md` | 安装指南、核心规则速查 |
| `docs/methodology.md` | 方法论演进（v0→v3）+ unblind 实战案例 |
| `docs/contextual-research-plan.md` | 调研增强设计文档（参考，非 L3 操作文件） |
| `docs/devflow-validation.md` | 完整性检验文档 |
| `tests/devflow-check.js` | 结构完整性校验脚本 |
| `by_claude_code_dev_md/progress.md` | **DevFlow 自身开发进度记录。新 Plan 经同意后 or 实战有新进展时必须更新** |

## 编辑指南

1. 改核心规则 → `SKILL.md` L2，保持 ~700 tok 以内
2. 改细节 → `resources/dispatch/rules.md`
3. 新增/改 Agent 类型 → `resources/research/schema.md` + `platform-adapters.md`
4. 改提示词模板/压缩策略 → `resources/prompt/guide.md`
5. 改集成模板 → `resources/workflow-config-template.md`
6. 分类体系/映射表 → `resources/research/taxonomy.md`
7. 任何结构性变更后跑 `node tests/devflow-check.js`
8. 按 semver 更新 `SKILL.md` metadata.version

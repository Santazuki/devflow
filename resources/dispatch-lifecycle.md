# 流程管理规则（Step 6 + Step 7）

> 加载时机：Step 6 文档撰写、Step 7 复盘、版本发布时。
> 涵盖版本管理、文档策略、Spec 同步、流程闭环、复盘。

## 版本号管理

PM 在 Step 6 文档撰写时执行版本号更新。遵循 [Semantic Versioning](https://semver.org) 规范：

| 变更类型 | 版本 | 示例 |
|------|:---:|------|
| Bug 修复（不改变 API） | PATCH | 1.0.0 → 1.0.1 |
| 新功能（向后兼容） | MINOR | 1.0.1 → 1.1.0 |
| 破坏性变更（API 不兼容） | MAJOR | 1.1.0 → 2.0.0 |

**何时更新**：每次 Part 2 CLEAN 后，PM 根据本次变更内容判定版本，按项目类型同步：

| 项目类型 | 版本文件 | 同步目标 |
|------|------|------|
| **npm 包** | `package.json` | npm registry |
| **Agent Skill** | `SKILL.md` metadata.version | 安装提示 |
| **CLI 工具** | `package.json` + `--version` 输出 | 发布渠道 |
| **通用项目** | 无强制要求 | Git tag（推荐） |

## npm 包发布流程

若项目是 npm 包（如 zeshim），Step 6 完成后 PM 执行：

```
1. npm version patch|minor|major（自动 bump + commit + tag）
2. 更新 CHANGELOG.md（记录本次变更），amend 到上一步 commit
3. git push && git push --tags（触发 GitHub CI）
4. npm publish（建议 CI 自动：git tag v* → npm publish）
```

`npm version` 会自动：更新 `package.json` 版本号 → `git commit` → 创建 `git tag`（如 `v1.1.0`）。一步完成三步操作。

**自动同步链**：若项目同时满足以下条件——git 管理、关联 GitHub 仓库、已发布 npm 包——PM 在 Step 6 完成版本号更新后，自动执行全域同步：

```
npm version → git push --tags → GitHub Actions → npm publish
                                    └── 若未配 CI：手动 npm publish
```

PM 在 Step 0 对齐时检测：`git remote -v`（确认 GitHub）、`npm view <name>`（确认已发布）。若三个条件都满足，Step 6 按此链自动推进，无需 Leader 额外确认。

## 分支管理

PM 在 Step 0 对齐时确认分支策略。团队协作项目推荐 [Trunk-Based Development](https://trunkbaseddevelopment.com/)：

| 分支类型 | 命名 | 生命周期 | 说明 |
|------|------|------|------|
| **trunk** | `main` / `master` | 永久 | 始终可发布，CI 保护 |
| **feature** | `feat/<name>` | 1-3 天 | 短分支，频繁合并回 trunk |
| **hotfix** | `fix/<name>` | <1 天 | 从 trunk 切出，修完立即合并 |

**规则**：
- 所有变更通过 PR 合并（不直接 push trunk）
- PR 合并前必须通过 CI（测试 + lint + 安全扫描）
- feature 分支存活超过 3 天 → PM 提醒拆分或合并
- 冲突解决在 feature 分支侧（rebase trunk，不 merge 反向）
- 个人项目可简化：直接在 trunk 上工作，feature 分支可选

## 重构后全量扫描

Part 2 CLEAN 后执行。grep 旧类名/旧文件名/旧模块数/旧测试数 → README/SKILL/CLAUDE/package/memory 逐文件修。

## 文档撰写策略（Step 6）

| 项目类型 | 同步内容 |
|----------|------|
| **Agent Skill** | SKILL.md、README、CLAUDE.md、测试报告、memory/ |
| **npm 包 / SDK** | README、package.json、CHANGELOG、API 文档 |
| **CLI 工具** | README、--help 输出、man page |
| **通用项目** | README、CLAUDE.md、测试报告 |

所有类型必做：测试报告 + CLAUDE.md 同步 + **README 同步**（版本号、Agent 数、Iron Rules 数、检验项数等关键数据）+ **Spec 同步**。

### README 同步

每次 CLEAN 后，PM 检查 README 中的关键数据是否与当前版本一致并更新：

- 版本号、Agent 数量、Iron Rules 条数
- Step 流程图（如有新增/删除步骤）
- 核心规则描述（如 Iron Rules 新增则追加）
- 校验命令和检验项数
- 实战案例表（如有新案例）

此规则同样适用于本仓库自身——devflow 每次发版后 `README.md` 和 `README_en.md` 必须同步。

### Spec 同步（Step 6 子步骤）

每次 devflow 周期 CLEAN 后，PM 执行以下 2 项操作。≤3 个文件，零依赖。

**1. 设计文档归档**

Step 1 产出的设计文档（如有）从工作区移动到归档目录，附带版本号：

```
操作：
  docs/design/<feature>.md
    → docs/design/archive/<feature>-v<version>.md

规则：
  - 仅在本次周期产生了设计文档时执行（Full 模式必有，Lite 模式可能无）
  - 版本号取自本次 semver 更新后的版本（如 v1.1.0）
  - 归档目录 `docs/design/archive/` 如不存在则创建
  - 原位置文件删除（归档即移动，不保留副本）
  - 如本次无设计文档（Lite 模式跳过了设计），此步骤跳过
```

**2. CHANGELOG Delta 记录**

在 `docs/CHANGELOG.md` 追加本次变更摘要：

```markdown
## [版本号] - YYYY-MM-DD

### 变更摘要
- 模块：[变更前] → [变更后]（+N/-M）
- 测试：[变更前] → [变更后]（+N）
- 新增文件：N 个
- 修改文件：M 个
- 删除文件：K 个

### 关键变更
- [变更描述 1]
- [变更描述 2]

### 审查捕获
- [严重度]：[数量] 个
```

**记录规则**：
- 版本号与 semver 更新一致
- 模块数和测试数来自项目元数据（Step -1 记录 vs 当前计数）
- 文件变更列表来自 `git diff --stat` 或 PM 手动汇总
- 关键变更描述由 PM 根据本次 Step 1-5 的实际改动摘要编写（3-5 条要点）
- 审查捕获汇总来自 Step 4 审查报告和 Step 5 QA 报告
- CHANGELOG.md 如不存在则创建

---

## 开发流程闭环

> PM 在每个 checkpoint（大任务/Part 完成）后执行本节流程。
> 适用于任何项目，不仅 DevFlow 自身。

### 分支策略

- 每次大任务从 master/main 切新分支：`feat/<name>` 或 `fix/<name>`
- 任务完成后合并回主干，删除 feature 分支
- 个人项目或 Lite 模式可直接在主干工作，分支可选

### 提交节奏

每个大任务（对应 DevFlow 的一个 Part 或明确 checkpoint）完成后自动 commit，不等全部完成。Step 6 的 commit 是最终版本提交。

### Changelog 生成

PM 在每个 checkpoint 完成后执行 `git diff --stat <base-branch>`，记录新增/修改/删除的文件及行数变化，最终汇总到 Step 6 CHANGELOG。

### 路线偏离判定

PM 在每个 checkpoint 完成后对比原 Step 0 对齐的计划，从四个维度判定：

| 维度 | 检查方法 | ON_TRACK | MINOR | MAJOR |
|------|------|:---:|:---:|:---:|
| 范围 | `git diff --stat` vs 计划文件列表 | 一致 | +1-2 非核心文件 | +3+ 或触及核心架构 |
| 功能 | changelog vs 原计划目标 | 无计划外变更 | 有计划外小优化 | 计划外大功能或遗漏核心功能 |
| 复杂度 | 新增代码量/模块数 vs 预期 | 在预期内 | 略有超出 | 大幅超出或新依赖 |
| 方向 | 当前产出 vs 原计划 milestone | 一致 | 路径略不同 | 与原计划核心方向矛盾 |

判定结果：
- **ON_TRACK**：自动进入下一步，同步时告知 Leader
- **DEVIATION_MINOR**：继续推进，同步时提示 Leader 注意
- **DEVIATION_MAJOR**：暂停推进，必须 Leader 明确决策

### Leader 决策门

PM 在 Part 级方向同步时附带偏离判定：

```
Checkpoint: [Part N / 任务名]
变更: ±N 文件, +N -M 行
Changelog: [3-5 条关键变更]
偏离: ON_TRACK / DEVIATION_MINOR / DEVIATION_MAJOR
  [偏离项说明]
建议: 合并 / 调整 / 回退 / 重新对齐
```

Leader 决定后 PM 执行。ON_TRACK 默认推进，DEVIATION_MAJOR 必须 Leader 明确批准。

---

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

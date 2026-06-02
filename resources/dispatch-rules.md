# DevFlow 调度规则参考

> L3 资源，PM 按需读取。L2 中已覆盖核心流程，此处为完整细节。

## 规模模式

### Full 模式（默认）

适用于 >5 文件、架构变更、安全敏感模块。Step 1-7 全流程：设计 → SL 安全左移 → 实现 → 3 维审查 → Part 2 质量门（SL→QA→RE）→ 文档 → 复盘。

### Lite 模式

适用于 2-5 文件、低风险、无 API/接口变更。步骤合并以降低流程开销：

| Full 步骤 | Lite 处理 |
|------|------|
| Step 1 设计 | 轻量设计——一段话描述方案，Leader 确认即过 |
| Step 2 安全左移 | 跳过（除非改动涉及 auth/API Key/注入面） |
| Step 3 实现 | 同 Full，文件交集检查后串行/并行 |
| Step 4 审查 | **1 个 Reviewer**（代码质量为主，兼顾安全） |
| Step 5 质量门 | QA 全量测试，SL 评估合并为一步（PM 或 Leader 判定） |
| Step 6 文档 | 仅测试报告 + CLAUDE.md 数据同步 |
| Step 7 复盘 | 轻量复盘——一段话总结 + Action Items（如有） |

**Lite 硬约束不变**：PM 不得亲自做 Reviewer / QA（仍须独立视角）。CRITICAL 同样阻断。

### 判定流程

```
Step 0, PM 向 Leader 提出：
  "本次改动涉及 <N> 个文件，<有/无>安全影响，<有/无>接口变更。
   建议使用 [Full / Lite] 模式。你的偏好？"
```

Leader 确认或调整。不确定时默认 Full。

## 派发前自问 6 条

1. 这个角色我能亲自做？（SL/Reviewer/QA/RE → 不能）
2. 多个 Developer 文件路径有交集？
3. 有人 import 另一个将创建的模块？
4. 这个 Agent 需要前一个 Agent 的产出？
5. 这个 Agent 是只读的？（是 → 自动并行）
6. Part 1 没走完能进 Part 2？（不能）

## PM 与 Leader 交互纪律

> Iron Rule #5 的详细执行规范。PM 什么时候可以打断 Leader，什么时候闭嘴干活。

### 核心原则

```
commit 是终点，不是中间站。
推进是 PM 的职责，不是 Leader 的负担。
方向同步是唯一的例外，完全自动化则例外也关闭。
```

### 禁止行为

| 行为 | 为什么禁止 | 正确做法 |
|------|------|------|
| "要不要先 commit？" | commit 在 Step 6 完成后才执行。中途 commit 打断流程、产生无意义历史 | 不到 Step 6 不提 commit 二字 |
| "要不要进入下一步？" | PM 的职责就是判断 DoD 是否满足。问 Leader 等于推卸判断责任 | 检查关口 DoD → 满足就自动推进并通知 Leader，不满足就修 |
| "这一步做完了，要继续吗？" | 同上——流程不因做完而停止，因 DoD 未满足而停止 | 自动进入下一步 |
| "你确认一下这个可以吗？"（非关口） | 实现细节不应该烦 Leader。Leader 关注的是方向和结果 | 只在关口 G1-G5 做方向确认 |

### 允许的中间交互：Part 级方向同步

方向同步 = PM 在一个 Part 完整结束后，主动向 Leader 核对进展、确认方向无误。**不是征求推进许可，是确认"走在正确的路上"。**

同步以 Part 为单位，不是以 Step 为单位。Part 内部各 Step 之间 PM 自行推进，不打扰 Leader。

| 同步点 | 时机 | 内容 | 格式 |
|------|------|------|------|
| **Part 0 完成后** | Step 0.5 调研结果出来 | "调研发现：命中了 [关注面]，关键约束有 [X 条]，推荐模式有 [Y 条]。方向对吗？有遗漏吗？" | 核对后进 Part 1 |
| **Part 1 完成后** | G3 审查通过（无 CRITICAL） | "设计→实现→审查完成。设计方向 [X]，审查发现 [N] 个问题已修复，当前状态 CLEAN。确认可以进 Part 2 吗？" | 核对后进 Part 2 |
| **Part 2 完成后** | G5 CLEAN | 此处**不需要**方向同步——Step 6（文档）和 Step 7（复盘）本身就是对全流程的总结汇报。直接进入即可 | — |
| **CRITICAL 阻断** | 任意时刻 | "发现 CRITICAL：[描述]，已阻断 Part 2，回退至 [Developer/Architect]。无需确认，仅通知。" | 通知，不征求意见 |
| **3 轮未过** | Part 2 循环耗尽 | "3 轮 RE 后仍有 [X] 项失败。SL 判定：[非阻塞→known-issues / 阻塞性→需你决策]" | 仅阻塞性需 Leader 决策 |

**同步原则**：
- Part 间同步 = 确认方向，不是征求推进许可
- Part 内推进 = PM 自行判断 DoD，不打扰 Leader
- 最后一步（Step 6/7）= 本身就是总结，替换了最后一次同步
- 同步时 PM 必须带具体信息（发现数、问题数、状态），禁止空洞的"要确认一下吗？"

### 完全自动化模式

Leader 在 Step 0 说"完全自动化"或"不用问我，全自动执行"时：

- PM 记录 `autoMode: true`
- **关闭所有 Part 级方向同步**——Part 0 和 Part 1 完成后不核对方向，直接推进
- PM 自行判定所有决策点（模式选择、设计方向、回退处理、CRITICAL 处理）
- **唯一汇报时机**：全部 CLEAN 后，Step 7 复盘时一次性汇报全流程总结
- 仅在遇到以下**不可自动处理**的情况时才中断：
  - 3 轮 RE 后仍阻塞性失败 → "阻塞，需要你决策：..."
  - 文件冲突无法自动解决 → "冲突，需要你决策：..."
- commit 仍然在 Step 6 执行，不会提前

### 自检

PM 每次想向 Leader 发消息前，自问：

1. 我是在问 commit？→ 闭嘴
2. 我是在征求推进许可？→ 闭嘴，DoD 满足就推
3. 现在是一个 Part 刚完成、方向需要确认？（且 autoMode 为 false）→ 同步方向
4. Part 2 刚完成？→ 不需要同步，直接进 Step 6/7 总结汇报
5. 现在是 Part 内部的 Step 之间？→ 闭嘴，自己推进
6. Leader 说了完全自动化？→ 所有方向同步跳过，仅最终总结和阻塞性故障汇报

---

## 测试分层（Testing Pyramid）

PM 在 Step 5 确保测试覆盖合理比例。参照行业标准（UK Home Office 2025, Mike Cohn）：

| 层级 | 占比 | 说明 |
|------|:---:|------|
| **单元测试** | ~70% | 快速、隔离、无网络依赖。每个模块独立验证 |
| **集成测试** | ~20% | 模块间交互、API 契约、数据库连接 |
| **端到端测试** | ~10% | 关键用户路径，全链路验证 |

QA 执行时检查：单元测试是否覆盖新增逻辑（≥80% 新代码）？集成测试是否覆盖模块边界？E2E 是否覆盖核心流程？

以上比例为**新增代码**目标。老项目现有覆盖率低的，设定渐进目标：

| 现有覆盖率 | 本轮目标（新增代码） | 下轮目标 |
|:---:|:---:|:---:|
| <20% | ≥50% | 60% |
| 20-50% | ≥70% | 80% |
| >50% | ≥80% | 维持 |

每次 devflow 触发时提升一点，不追求一步到位。

## 每步 Definition of Done

PM 推进下一步前，确认当前步骤满足 DoD：

| 步骤 | Definition of Done |
|------|------|
| Step 1 设计 | 设计文档已输出、Leader 已确认、文件已提交 |
| Step 2 安全左移 | SL 审查报告已出、安全问题已修复或记录 |
| Step 3 实现 | 代码已提交、`node --test` 通过、`.gitignore` 已更新 |
| Step 4 审查 | 3 维度审查报告已出、无 CRITICAL、问题已修复 |
| Step 5 质量门 | QA 全量通过、SL 最终评估 CLEAN |
| Step 6 文档 | 测试报告已写、CLAUDE.md/README 已同步、全量扫描无遗漏、Spec 已归档、CHANGELOG 已更新 |
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

所有类型必做：测试报告（`docs/test-results/step<N>-<name>.md`）+ CLAUDE.md 模块/测试数同步 + **Spec 同步**。

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

**示例**（本仓库 v1.1.0）：

```markdown
## [1.1.0] - 2026-06-02

### 变更摘要
- 模块：N/A（纯文档项目）
- 测试：65 → 102 项（+37）
- 新增文件：3 个（research-agent-schema.md, prompt-augmentation-guide.md, research-taxonomy.md）
- 修改文件：6 个（SKILL.md, dispatch-rules.md, platform-adapters.md, workflow-config-template.md, devflow-check.js, devflow-validation.md）

### 关键变更
- 新增 Step 0.5 Discovery 上下文调研流程
- 新增 Research Agent（第 7 个 Agent 类型），含 3 种搜索模式 + 2 种运行状态
- 新增 Iron Rules #5（PM 交互纪律）和 #6（Step 0.5 不可跳过）
- 新增 PM 与 Leader 交互纪律完整章节
- 新增提示词工程管道：调研发现 → 下游 6 个 Agent 场景化提示词

### 审查捕获
- N/A（本次为方法论自身增强，未经过完整 devflow 流程）
```


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

## 上下文调研规则（Step 0 + Step 0.5）

> 详细定义见 `resources/research-agent-schema.md` 和 `resources/prompt-augmentation-guide.md`。
> 本节规定 PM 在 Step 0 对齐中及 Step 0.5 的调研调度规则。

### 调研的两个时机

调研不只在 Step 0.5 发生。它在两个时机以两种状态运行：

```
Step 0: PM-Leader 对齐需求
   │
   ├─ 讨论中暴露知识缺口 → 状态二即时搜索（≤2 轮）
   │   "这个功能要 PCI 合规吗？"→ 搜 → 当场回答
   │   "业界怎么做支付幂等？"→ 搜 → 当场回答
   │   结果反哺讨论，对齐更准确
   │
   ▼ 对齐完成
Step 0.5: 规划调研
   └─ 状态一系统搜索：覆盖所有命中关注面 → 编译 Knowledge Brief → 注入下游提示词
```

| | Step 0 对齐中 | Step 0.5 对齐后 |
|------|:---:|:---:|
| **状态** | 状态二（触发调研） | 状态一（规划调研） |
| **驱动** | 讨论中的知识缺口 | PM 系统判定搜集方向 |
| **范围** | 窄——回答 Leader 的具体问题 | 宽——覆盖所有命中关注面 |
| **产出** | 口头回答 / 一段话备注 | 完整 Knowledge Brief → 下游提示词 |
| **目的** | 让对齐更准确，不凭猜讨论 | 让设计有据可依，不凭空白猜 |
| **可跳过** | Lite 可跳过 | Full 不可跳过 |

### 搜集方向判定

PM 在 Step 0 对齐需求后，从需求描述中提取关键词，对照分类体系确定搜集方向：

```
1. 提取关键词：
   - 安全：auth, login, password, API key, payment, encrypt, PII, token
   - 架构：refactor, redesign, new module, new API, breaking change, migrate
   - 性能：slow, timeout, 1000/10000/1M users, concurrent, cache, batch
   - 合规：GDPR, HIPAA, PCI, SOC2, compliant, audit, regulatory
   - 集成：webhook, callback, 3rd party, external API, SDK, message queue
   - UI：form, button, modal, page, responsive, mobile, accessibility, a11y
   - 数据：schema, migration, backup, consistency, transaction, index

2. 命中关注面 → 确定搜集方向 → 展示给 Leader

3. Leader 确认或调整

4. 不确定时默认搜集安全和架构两个面（最低保障）
```

### 规划调研（状态一）派发规则

| 规则 | 值 |
|------|:---:|
| 最大 Research Agent 数 | 3 |
| 每个 Agent 关注面数 | 1-2 |
| 默认搜索模式 | 高（系统调研）或中（单关注面） |
| 搜索轮次上限 | 高 8 轮 / 中 4 轮 |
| WebFetch 上限 | 高 12 篇 / 中 5 篇 |
| 最大 findings | 高 15 条 / 中 8 条 |
| Token 预算 | 高 ~3000 / 中 ~1500 |
| 超时 | 高 180s / 中 90s |

**并行策略**：所有 Research Agent 可并行（不同搜索方向，无文件冲突）。

**输出检查**：PM 收到 JSON 后检查——
- [ ] 每条 finding 有 source URL
- [ ] sourceVerified 标注正确
- [ ] 来源交叉验证达标（高 ≥3 源 / 中 ≥2 源）
- [ ] targetAgents 不为空
- [ ] 每条 finding 的 promptAugmentation 为每个 targetAgent 写了文本

### 触发调研（状态二）规则

| 规则 | 值 |
|------|:---:|
| 触发者 | 任何 Agent 或 PM |
| 默认搜索模式 | Step 0 对齐中→低，Step 1-5→中 |
| 搜索轮次上限 | 中 4 轮 / 低 2 轮 |
| WebFetch 上限 | 中 5 篇 / 低 2 篇 |
| 同 Agent 同 Step 上限 | 3 次 |
| 最大 findings | 中 8 条 / 低 3 条 |
| Token 预算 | 中 ~1500 / 低 ~500 |
| 阻塞性 | 不阻塞——搜不到用自己的知识继续 |

**PM 监控职责**：
- 某 Agent 频繁触发（同 Step >3 次）→ 可能能力边界问题，考虑换 Agent 类型或拆分任务
- 某 Agent 用"搜索"拖延 → PM 可终止并强制推进
- 触发搜索结果汇总到 Knowledge Brief 附录（Step 6）

### 编译与注入（PM 职责）

PM 在派发下游 Agent 前，将调研发现按 `targetAgent` 路由编译为提示词段。详见 `resources/prompt-augmentation-guide.md`。

**核心约束**：
- standard → 硬约束（Architect 必须满足，Reviewer 必须检查）
- pattern → 软建议（Architect 推荐采纳，不采纳需说明理由）
- anti-pattern → 禁止项（Reviewer 主动扫描禁止）
- sourceVerified=false → 降级标注"参考（未验证）"
- 注入内容 > 该 Agent 上限的 50% → 触发三级压缩（键值对 → 优先级截断 → 摘要式），详见 `resources/prompt-augmentation-guide.md`

### Lite 模式调研

Lite 模式下跳过正式规划调研。PM 自行 1-2 次搜索后追加一段上下文备注到需求记录。触发调研仍然可用。

---

## 记忆口诀

```
只读一定并行，写操作用文件判。
无交无依赖并行，有交有依赖串行。
Part 2 全程串行，CRITICAL 必回退。
PM 不得亲自做，自己审自己是盲区。
```

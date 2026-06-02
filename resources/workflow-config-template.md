# CLAUDE.md 多 Agent 协作段模板

> 复制到你的项目 CLAUDE.md 中，按需调整角色名和工具。

## 开发工作流

采用 **双 Pipeline 多 Agent 协作模式**。Leader（你）定方向 → PM Agent（我）派任务 → 7 个 Subagent 执行。

```
需求 → 对齐（PM与Leader确认）→ Step 0.5 Discovery（按需调研）
  → Architect 设计 → Developer 实现 → Reviewer 审查
  → Security Lead 质量门 → QA 测试 → RE 修复 → CLEAN
```

### 多 Agent 协作

采用双 Pipeline 多 Agent 协作模式。

**角色**：Leader（你）→ PM Agent（我）→ 7 个 Subagent：
Part 0: Research Agent(s) — 上下文调研（Step 0.5）
Part 1: Architect → Developer + Reviewer (SL 并行审设计)
Part 2: SL → QA → RE (≤3 轮)

**PM 硬约束**：SL / Reviewer / QA / RE 必须通过 Agent 工具派发独立 Agent，PM 不得亲自替代。每关完成后自问："这关是独立 Agent 做的还是我自己做的？"

**PM 交互纪律**：PM 不得中途问 commit（commit 是终点，Step 6 完成后执行）。PM 不得征求推进许可（关口 DoD 满足即自动推进）。**方向同步以 Part 为单位**：Part 0 调研后、Part 1 审查通过后各核对一次方向；Part 2 完成后直接进 Step 6/7 总结。Part 内部各 Step 之间 PM 自行推进不打扰。Leader 在 Step 0 指定完全自动化则跳过所有同步点，仅最终总结时汇报。详细规则见 `resources/dispatch-rules.md`。

**5 关口**：G1(设计出) → G2(SL审设计) → G3(Reviewer无CRITICAL) → G4(QA全绿) → G5(SL最终判)

**派发前必答两问**：
1. B 的产出依赖 A 的代码？→ 串行
2. B 和 A 修改同一文件？→ 串行
3. 都不是 → 并行（只读 Agent 永远可并行）

**Step 0.5 Discovery**：Full 模式下，PM 在 Step 0 对齐后按需搜集领域知识。对照分类体系确定方向 → 派 Research Agent(s) 搜索 → 编译发现为下游 Agent 提示词段。标准为硬约束，模式为软建议，反模式为禁止项。Lite 模式可最小调研。详见 `resources/dispatch-rules.md`。

**派发前 PM 自问清单**：
1. 这个角色我能不能亲自做？（SL/Reviewer/QA/RE/Research → 不能）
2. 如果派多个 Developer，文件路径清单有交集吗？
3. 有谁 import 另一个将创建的模块？
4. 这个 Agent 是否需要前一个 Agent 的产出？
5. 这个 Agent 是只读的吗？（是 → 自动与所有人并行。Research Agent 永远只读可并行）
6. Part 1 没走完能进 Part 2 吗？（不能 — G3 无 CRITICAL 是准入条件）
7. Step 0.5 做了吗？（Full 模式不可跳过，Lite 可最小调研）

**Reviewer 三维分工**：3 个 Reviewer 各负责安全/代码质量/集成一个维度。CRITICAL → 阻断 Part 2 → 回 Developer → 同一 Reviewer 复审查 → CLEAN 才进 Part 2。

**回退规则**：代码 bug → Developer · 设计缺陷 → Architect · 配置/环境/测试 → RE

**Subagent 模型选择**：机械任务用 flash，集成/判断用 pro。

**测试路径约定**：测试源码 → `tests/`（提交）。测试报告 → `docs/test-results/`（提交）。临时文件（日志/缓存/截屏）→ `.gitignore` 排除。测试分层：单元 70% / 集成 20% / E2E 10%。

**每步 Definition of Done**：设计文档已确认 → SL 审查 CLEAN → 代码提交且测试通过 → 审查无 CRITICAL → QA 全绿 → 文档同步（README + Spec 归档 + CHANGELOG）→ 复盘完成。

**重构后全量扫描**：grep 旧类名/旧文件名/旧模块数/旧测试数 → README/SKILL/CLAUDE/package/memory 逐文件修。

**版本号管理**：每次 CLEAN 后按 semver 更新。Bug→PATCH · Feature→MINOR · Breaking→MAJOR。npm 包同步 `package.json`，Skill 同步 `SKILL.md`。

**分支策略**：Trunk-Based Development。每次大任务切 `feat/<name>` 或 `fix/<name>`，完成后合并回主干。每个 checkpoint 完成后自动 commit，最终 Step 6 提交。

**路线偏离判定**：PM 在每个 checkpoint 完成后对比原计划（范围/功能/复杂度/方向四维度）。ON_TRACK 自动推进，MINOR 通知 Leader，MAJOR 必须 Leader 决策。详见 `resources/dispatch-rules.md`。

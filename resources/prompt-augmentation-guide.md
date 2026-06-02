# 提示词工程指南

> L3 资源。PM 在 Step 0.5 如何将 Research Agent 的结构化输出编译为下游每个 Agent 的场景化提示词。
> 调研是原料，提示词编译是加工，Agent 输出是产品。

## 1. 编译管道

```
Research Agent(s) JSON 输出
         ↓
PM 聚合 + 去重 + 按 targetAgent 路由
         ↓
    ┌────┼────┬────┬────┬────┐
    ↓    ↓    ↓    ↓    ↓    ↓
  Arch  SL   R#1  R#2  R#3  QA/RE/Dev
```

### 1.1 路由规则

PM 解析每条 finding 的 `targetAgents` 字段，按以下映射归入 Agent 桶：

```
"Architect"      → Architect 桶
"SL"             → Security Lead 桶
"Reviewer#1"     → Reviewer #1 桶（安全）
"Reviewer#2"     → Reviewer #2 桶（代码质量）
"Reviewer#3"     → Reviewer #3 桶（集成）
"QA"             → QA 桶
"Developer"      → Developer 桶
"RE"             → RE 桶
```

一条 finding 可能同时进多个桶（如 PCI-DSS 发现同时进 Architect、Reviewer#1、QA）。

### 1.2 桶内处理

对每个 Agent 桶：

```
1. 按 category 排序：standard → pattern → anti-pattern → reference
2. 同 category 内按 sourceVerified 排序：true 优先
3. 去重：title 相似的合并，保留 sourceVerified=true 的版本
4. 截断：每个桶保留 ≤8 条（约 500 tokens），超出按 category 优先级截断
5. 编译为 §2 对应模板的文本段
```

### 1.3 category 到约束级别的映射

| category | 注入下游时的约束级别 | 下游 Agent 的行为要求 |
|------|:---:|------|
| `standard` | **硬约束** | 必须满足。Architect 在设计文档中逐一说明满足方式。Reviewer 逐条检查。QA 逐条验证。 |
| `pattern` | **软建议** | 推荐采纳。Architect 如不采纳需在设计文档中说明理由。Reviewer 检查理由是否合理。 |
| `anti-pattern` | **禁止项** | 不得出现。Reviewer 主动 grep 扫描。Developer 实现时规避。 |
| `reference` | **参考** | 可借鉴，不强制。Architect 可在设计中引用。 |

---

## 2. 各 Agent 提示词模板

PM 在派发 Agent 时，提示词 = `<角色基础指令>` + `<场景增强段>` + `<Iron Rules 约束>`。

基础指令来自 SKILL.md L2 的角色描述。场景增强段来自本节模板 + 实际调研数据。

---

### 2.1 Architect（设计者）

```markdown
## 任务
设计 [功能名称] 的完整方案。

## 项目上下文（来自 Step -1）
[项目类型、技术栈、现有架构、关键约束]

## 设计约束 —— 必须满足（来自 Step 0.5 Research）
以下约束为硬约束，必须在设计文档方案中体现。对每条约束，说明满足方式：
[注入 category=standard 的 findings，每条格式：]
- [约束标题]：来源 [source]。满足方式：[Architect 在此说明]

## 推荐模式 —— 建议采纳（来自 Step 0.5 Research）
以下模式为业界推荐做法，请评估是否适用于本次设计。如不采纳，说明理由：
[注入 category=pattern 的 findings，每条格式：]
- [模式标题]：来源 [source]。采纳 是/否，理由：[Architect 在此说明]

## 应避免的反模式（来自 Step 0.5 Research）
在设计阶段即规避以下陷阱：
[注入 category=anti-pattern 的 findings]

## 参考资料（来自 Step 0.5 Research）
可借鉴的实现和文档：
[注入 category=reference 的 findings]

## 输出要求
- 设计文档（含模块划分、接口定义、数据流、错误处理策略）
- 对每个硬约束的满足说明
- 对不采纳的推荐模式，逐一说明理由
```

---

### 2.2 Security Lead（安全左移 + 最终评估）

**Step 2 安全左移**：

```markdown
## 任务
审查设计文档的安全性。不等实现开始，在设计中找出安全问题。

## 适用标准（来自 Step 0.5 Research）
本次设计需对照以下行业标准：
[注入 category=standard 的 findings]

## 审查维度
1. 敏感数据：设计方案中的加密策略、密钥管理、数据脱敏是否满足上述标准
2. 攻击面：设计方案暴露的 API/接口是否存在注入、越权、信息泄露风险
3. 依赖安全：设计引入的第三方服务/SDK 是否有安全最佳实践
4. 日志与审计：设计方案中敏感数据是否会在日志/错误消息中泄露

## 输出格式
文件路径:行号 + 问题描述 + 严重度(CRITICAL/HIGH/MEDIUM/LOW) + 修复建议
如无问题，输出 "CLEAN"
```

**Step 5 最终评估**：

```markdown
## 任务
对本次变更做最终安全评估。对照 Knowledge Brief 逐条确认。

## 合规逐条确认（来自 Step 0.5 Research）
[注入所有 standard 类 findings，每条格式：]
- [X] [标准标题]：通过 / 不通过 → [证据]

## 攻击面最终确认
[由 SL 汇总 Part 2 中所有安全相关发现]

## 最终判定
CLEAN / NEEDS_FIX / KNOWN_ISSUE
```

---

### 2.3 Reviewer #1（安全审查）

```markdown
## 任务
对本次代码变更进行安全审查。

## 基础检查项
- 硬编码凭据（API Key、密码、Token）
- 注入攻击面（SQL、XSS、命令注入）
- 错误消息泄露敏感信息
- 敏感数据在日志/响应中暴露

## 本次特化检查项（来自 Step 0.5 Research）
[注入 targetAgents 含 "Reviewer#1" 的 promptAugmentation 文本]
[格式：每条为独立检查项，末尾标注来源]

## 输出格式
文件路径:行号 + 问题描述 + 严重度 + 修复建议
特化检查项中每项必须标记 ✅ 通过 或 ❌ 发现问题
```

---

### 2.4 Reviewer #2（代码质量审查）

```markdown
## 任务
对本次代码变更进行代码质量审查。

## 基础检查项
- 接口一致性：新增/修改的接口与项目现有风格一致
- DRY 原则：是否存在可抽取的重复逻辑
- 向后兼容：是否破坏现有 API 合约
- 命名与结构：变量/函数/模块命名是否符合项目惯例

## 本次特化检查项（来自 Step 0.5 Research）
[注入 targetAgents 含 "Reviewer#2" 的 promptAugmentation 文本]

## 输出格式
文件路径:行号 + 问题描述 + 严重度 + 改进建议
```

---

### 2.5 Reviewer #3（集成审查）

```markdown
## 任务
对本次代码变更进行集成兼容性审查。

## 基础检查项
- 数据一致性：跨模块的数据读写是否保证一致性
- 调用链完整：新增/修改的调用是否覆盖所有分支
- 端到端链路：从入口到出口的完整路径是否可追踪
- 错误传播：模块间的错误传递是否正确

## 本次特化检查项（来自 Step 0.5 Research）
[注入 targetAgents 含 "Reviewer#3" 的 promptAugmentation 文本]

## 输出格式
文件路径:行号 + 问题描述 + 严重度 + 修复建议
```

---

### 2.6 QA（测试）

```markdown
## 任务
对本次变更进行全量测试。

## 测试分层目标
- 单元测试 ≥70%（新增代码）
- 集成测试 ≥20%（新增代码）
- E2E 测试 ≥10%（新增代码）

## 本次领域特化测试场景（来自 Step 0.5 Research）
以下场景为本次领域特化，必须在测试计划中覆盖：
[注入 targetAgents 含 "QA" 的 promptAugmentation 文本]

## 合规验证用例（来自 Step 0.5 Research）
以下用例与合规要求直接关联：
[注入 category=standard 且 targetAgents 含 "QA" 的 findings]

## 输出
- 测试报告（pass/fail/skip + 覆盖率）
- 对领域特化场景逐条标记 ✅ 覆盖 或 ⚠️ 未覆盖
```

---

### 2.7 Developer（实现者）—— 可选

Developer 的增强提示词相对轻量。约束和模式已通过 Architect 的设计间接传达，此处仅补充**实现层面的最佳实践提示**：

```markdown
## 实现提示（来自 Step 0.5 Research）
以下最佳实践建议在实现时参考：
[注入 category=pattern 或 anti-pattern 且 targetAgents 含 "Developer" 的 findings]

## 注意规避的反模式
[注入 category=anti-pattern 且 targetAgents 含 "Developer" 的 findings]
```

---

### 2.8 RE（可靠性工程师）—— 可选

```markdown
## 已知陷阱（来自 Step 0.5 Research + QA 测试失败分析）
修复以下失败项时，注意以下已知陷阱：
[注入 category=anti-pattern 的 findings]

## 约束
- 仅修配置/环境/测试断言问题
- 代码逻辑 bug 回 Developer
- 设计缺陷回 Architect
```

---

## 3. 注入量控制

| Agent | 最大注入条数 | 最大注入 tokens | 优先级截断规则 |
|------|:---:|:---:|------|
| Architect | 8 | 500 | standard > pattern > anti-pattern > reference |
| SL | 6 | 350 | standard > pattern |
| Reviewer #1 | 5 | 250 | standard > anti-pattern |
| Reviewer #2 | 5 | 250 | pattern > anti-pattern |
| Reviewer #3 | 5 | 250 | standard > pattern |
| QA | 6 | 300 | standard > pattern |
| Developer | 4 | 200 | pattern > anti-pattern |
| RE | 3 | 150 | anti-pattern |

### 3.1 压缩触发条件

注入内容超过该 Agent **最大注入 tokens 的 50%** 时，触发压缩。PM 在编译时逐 Agent 检查：

```
注入 tokens / 最大注入 tokens > 50%  →  触发压缩
```

**压缩执行者**：压缩操作本身交由**轻量 LLM**（haiku / flash / lite 级模型）执行，PM（主 LLM）仅负责准备压缩指令和审核输出结果。原因：压缩是机械性文本转换任务，不需要深度推理，不应占用复杂 LLM 的上下文窗口。

### 3.2 三级压缩策略

压缩按**信息保真度从高到低**的顺序依次尝试。上一级达标则停止，不继续压缩。

---

**第一级：键值对压缩（Key-Value Compression）** `执行：轻量 LLM`

将 prose 描述转换为紧凑的 `key: value` 格式。无损——信息不丢失，仅改变表达密度。PM 将原始注入内容发给轻量 LLM，附固定转换指令，一次性完成。

```
PM 指令（~50 tokens，发给轻量 LLM）：
  "将以下设计约束压缩为 key:value 格式。保留所有数值和条件。
   格式: '约束主题:值 | 约束主题:值'。
   原始：[注入内容]"

轻量 LLM 输出示例: "金额:int(分) | DB:BIGINT | 禁:float/double"
```

**压缩格式规则**：standard → `key:value`（保留数值）\| pattern → `推荐:[方案名]` \| anti-pattern → `禁:[关键词]` \| reference → `参考:[链接]`。来源 URL 保留不压缩。

**达标判定**：≤50% 上限 → 注入。>50% → 进入第二级。

---

**第二级：优先级截断（Priority Truncation）**

按 category 优先级排序后，从低优先级开始丢弃，直到满足 50% 阈值。

```
丢弃顺序（从低到高）：
  reference → anti-pattern → pattern → standard

同 category 内 sourceVerified=false 优先丢弃，与当前 Agent 职责关联最弱的优先丢弃。

**操作**：按优先级从低到高逐条丢弃，每丢一条重新计算。丢弃条目记录到 Knowledge Brief。

**达标判定**：≤50% → 注入。仍 >50% → 进入第三级。

---

**第三级：摘要式压缩（Summarization Compression）** `执行：轻量 LLM`

PM 将剩余注入内容发轻量 LLM，要求重写为更短版本。保留硬约束完整语义，软建议合并。PM 审核输出后注入。

```
PM 指令（发轻量 LLM，~100 tokens）：

"将以下提示词注入内容压缩至 ≤[目标 tokens] tokens。
 规则：
 1. 硬约束（标注 [standard]）→ 保留完整语义，不得丢失任何具体数值或条件
 2. 软建议（标注 [pattern]）→ 可合并为一句，仅保留方案名和来源
 3. 反模式（标注 [anti-pattern]）→ 保留禁止项关键词
 4. 保留所有 source URL

 原始内容：
 [注入内容]"
```

---

### 3.3 压缩决策流程（含故障路径）

```
>50%? → 否:注入 | 是→L1[轻量LLM]键值压缩 → 达标:注入 | 失败/仍超标→L2[PM]截断
  → 达标:注入 | 仍超标→L3[轻量LLM]摘要压缩 → 达标:注入 | 失败→硬截断
  → 硬约束丢失+CRITICAL? → 通知Leader | 否则→降级注入(L4)
```

执行者：L1/L3=轻量LLM，L2=PM规则，审核=PM。

---

### 3.4 故障分级应对

| 级别 | 场景 | 应对 |
|:---:|------|------|
| **L1** | 轻量 LLM 不可用 | 跳过第一/三级，PM 直接规则截断 |
| **L2** | 压缩导致硬约束语义丢失 | 回退上一级结果，丢弃软建议保硬约束 |
| **L3** | 硬截断后 CRITICAL 约束丢失 | 通知 Leader |
| **L4** | 全流程彻底失败 | **降级注入**：≤100 tokens 最简提示词（仅 standard 标题 + Knowledge Brief 路径），Agent 靠自身知识补位 |

---

## 4. PM 自检清单

编译完成后，PM 在派发第一个下游 Agent 前自问：

- [ ] 每个 Agent 的增强段 ≤ token 上限？
- [ ] 每个 Agent 的增强段 > 50% 上限时，已执行压缩？
- [ ] 压缩后硬约束完整保留？（没丢具体数值，禁止项语义不变）
- [ ] 压缩失败时已按故障分级（L1→L2→L3→L4）逐级降级？
- [ ] L4 降级注入时保留了 Knowledge Brief 文档路径？
- [ ] 所有 source 含 URL？
- [ ] standard 类发现进入 Architect 的硬约束段？
- [ ] sourceVerified=false 的发现已降级标注？
- [ ] 同 Agent 桶内去重完成？
- [ ] 丢弃/截断/降级的条目已记录到 Knowledge Brief？
- [ ] 编译结果已向 Leader 展示？（Full 模式）

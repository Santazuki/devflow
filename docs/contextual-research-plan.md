# DevFlow 上下文调研增强计划

> 让 DevFlow 从"流程引擎"变成"流程引擎 + 按需领域知识注入"。
> 核心不是加一个步骤，而是新增一个 Agent 类型 + 一条提示词工程管道。

## 1. 问题与洞察

### 1.1 当前瓶颈

DevFlow 管住了 Agent 之间的调度，但管不住 Agent **在什么上下文里思考**。

```
当前状态：
  Architect 收到的提示词：  "设计支付模块"
  Reviewer #1 收到的提示词："审查支付模块的安全"
  QA 收到的提示词：        "全量测试"

问题：
  这三个 Agent 分别在各自的 LLM 训练数据里随机召回"支付安全"相关知识。
  召回多少、质量如何——完全随机。
  PCI-DSS 可能被提到，也可能被漏掉。
  幂等性可能被想到，也可能被忽略。
```

### 1.2 核心洞察

**调研不是目的，是原料。真正的产出是下游 Agent 的场景化提示词。而且调研不止一种模式。**

```
Research Agent 有两种状态：

状态一（规划调研）：PM 驱动，自上而下
  需求 → 关注面 → Research Agent → Knowledge Brief → 下游提示词

状态二（触发调研）：上下文驱动，自下而上
  代码/错误/疑问 → 任何 Agent 检测缺口 → 即时搜索 → 直接消费
```

两次调研互为补充——规划调研保证大方向不偏，触发调研保证执行中不掉坑。两次调研的发现最终汇入 Step 7 复盘，形成知识闭环。

### 1.3 设计原则

| 原则 | 说明 |
|------|------|
| **Research Agent 是独立 Agent 类型** | 有自己的角色定义、工具边界、输出 Schema。不是通用 Agent 客串 |
| **提示词工程是桥** | 调研发现不写成静态文档就完事——PM 必须将其转化为每个下游 Agent 的定制化提示词段 |
| **按需搜集，按角色分发** | 不是把所有发现发给所有 Agent。安全发现→安全角色，模式发现→设计角色 |
| **来源可追溯** | 每个注入下游的提示词段附带来源，Agent 执行时可自行验证 |

---

## 2. 新增 Agent 类型：Research Agent（研究员）

### 2.1 角色定义

```
角色名：Research Agent（研究员）
类型：只读分析型（与 Reviewer、SL 同属只读类）
工具：WebSearch, WebFetch（检索 + 深度阅读）
不可用工具：Write, Edit, Bash（纯研究，不动代码）
适用场景：Step 0.5 Discovery 阶段，也可以在 Step 1 设计过程中被 Architect 按需调用
```

### 2.2 与其他 Agent 的关键区别

| 特性 | Reviewer / SL | Research Agent |
|------|:---:|:---:|
| 审什么 | 审**代码/设计**（项目内的东西） | 审**外部知识**（行业标准、最佳实践、竞品） |
| 数据源 | 项目文件（Read/Grep/Glob） | 互联网（WebSearch/WebFetch） |
| 输出 | Bug  находка + 严重度 + 行号 | 模式/标准/反模式 + 对下游 Agent 的提示词语义 |
| 产出消费者 | Developer（修 bug） | PM → Architect, Reviewer, QA（丰富提示词） |

### 2.3 两种运行状态

Research Agent 不是只有"PM 叫我搜我才搜"一种模式。它在 DevFlow 中有两种完全不同的运行状态，区别在于**谁触发、为什么触发、搜多深、产出流向谁**。

---

#### 状态一：规划调研（Planned Research）

> "我们准备做 X，X 涉及哪些领域？需要提前知道什么？"

**定位**：前置性、系统性的知识搜集。PM 驱动，发生在设计之前。

| 维度 | 说明 |
|------|------|
| **触发者** | PM（Step 0.5） |
| **触发时机** | Step 0 对齐需求完成后，Step 1 设计开始前 |
| **触发条件** | Full 模式 + 需求命中至少 1 个关注面（安全/合规/架构/性能/集成） |
| **搜什么** | 对照 §5 分类体系，系统性覆盖所有命中的关注面 |
| **搜多深** | 深度。每个关注面 3-8 条结构化 findings，含 source、targetAgents、promptAugmentation |
| **谁执行** | PM 并行派 1-3 个 Research Agent，每个负责 1-2 个关注面 |
| **输出** | 完整 Knowledge Brief（含设计约束、推荐模式、反模式、审查/测试增强清单） |
| **消费者** | PM 编译为下游 6 个 Agent 的场景化提示词 |
| **Token 预算** | 总输出 ≤3000 tokens（3 个 Agent × ≤1000 tokens），编译后每个下游 Agent 增量 ≤500 tokens |
| **频率** | 每个 devflow 周期 1 次（Step 0.5） |

**流程**：
```
PM 分析需求 → 确定搜集方向 → 向 Leader 展示计划 → 确认
  → 并行派 Research Agent(s) → 收 JSON → 去重编译 → Knowledge Brief
  → 注入下游 Agent 提示词 → 进入 Step 1
```

**典型场景**：
- "新增支付模块" → 搜 PCI-DSS + 幂等性 + 金额精度 + 审计日志
- "重构到微服务" → 搜服务拆分粒度 + 事务边界 + Circuit Breaker + API 版本化
- "加用户认证" → 搜 OAuth 2.1 + OWASP 认证清单 + session vs JWT + 密码存储标准

---

#### 状态二：触发调研（Reactive Research）

> "当前上下文出现了 X，X 的最佳实践是什么？有什么坑？"

**定位**：即时性、精准的知识补位。任何 Agent 或 PM 在流程中检测到知识缺口时触发。

| 维度 | 说明 |
|------|------|
| **触发者** | 任何 Agent（Architect/Developer/Reviewer/QA/RE/SL）或 PM |
| **触发时机** | Step 1-5 任意时刻，执行中发现知识缺口时 |
| **触发条件** | 遇到以下情况之一：① 不熟悉的模式/技术出现在代码中 ② 错误/警告信息需要查根因 ③ 发现了可疑代码但不确定是否真的是问题 ④ 两个设计方案间无法从第一性原理裁决 |
| **搜什么** | **只搜当前缺口**——一个具体的模式、一个具体的错误、一个具体的最佳实践问题 |
| **搜多深** | 轻量。1-3 条精准发现，不需要完整 Knowledge Brief |
| **谁执行** | 触发者自行检索（1 次 WebSearch + ≤2 次 WebFetch），或 PM 派 1 个 Research Agent（如果触发者忙） |
| **输出** | 轻量 JSON（1-3 条 findings）+ 直接注入触发者的决策/实现 |
| **消费者** | 触发者自己（立即使用），PM 归档到 Knowledge Brief 附录 |
| **Token 预算** | 总输出 ≤500 tokens |
| **频率** | 不限，每次遇到缺口即触发。但同一 Agent 在同一 Step 内 ≤3 次（防无限搜索） |

**流程**：
```
Agent 执行中 → 检测到知识缺口 → 暂停当前任务
  → 自检索（WebSearch + WebFetch，≤2 轮）
  → 得到 1-3 条发现 → 立即用于当前决策/实现
  → 通知 PM："在 Step X 触发调研 Y，发现 Z，已应用"
  → PM 追加到 Knowledge Brief 附录（供复盘审查）
```

**典型场景**：

| 触发者 | 场景 | 搜索示例 |
|------|------|------|
| Developer | 实现中看到项目用了 `setTimeout` 做重试，不确定是否正确 | "Node.js retry pattern best practice exponential backoff" |
| Reviewer #1 | 发现代码用 `eval()` 但不确定是否有安全的替代方案 | "safe alternative to eval in JavaScript dynamic code execution" |
| Reviewer #2 | 发现两个模块有相同逻辑但抽取方式不明确 | "DRY vs coupling tradeoff when extracting shared logic" |
| QA | 测试中遇到 flaky test，不确定是测试问题还是代码问题 | "flaky test root cause analysis async operation timeout" |
| Architect | 设计时在事件驱动和请求-响应之间犹豫 | "event-driven vs request-response tradeoffs for order processing system" |
| PM | 两个 Developer 各执一词，需要查业界共识 | "layered architecture vs hexagonal architecture which one 2025" |

---

#### 两种状态对比

| | 状态一：规划调研 | 状态二：触发调研 |
|------|:---:|:---:|
| **驱动方式** | 需求驱动（自上而下） | 上下文驱动（自下而上） |
| **比喻** | 战前侦察——提前摸清地形 | 战中查地图——走到哪查到哪 |
| **谁发起** | PM（计划性） | 任何 Agent（自发性） |
| **范围** | 宽——覆盖所有命中关注面 | 窄——一个具体缺口 |
| **深度** | 深——完整 Knowledge Brief | 浅——1-3 条精准发现 |
| **输出** | 结构化 JSON → Knowledge Brief → 下游提示词 | 轻量 JSON → 直接消费 + PM 归档 |
| **消费者** | 6 个下游 Agent（被动接收） | 触发者自己（主动使用） |
| **频率** | 1 次 / devflow 周期 | 不限，遇到即搜 |
| **Token** | ≤3000 总输出 | ≤500 单次 |
| **Leader 参与** | 需确认搜集方向 | 无需，Agent 自行判断 |
| **失败处理** | 搜不到 → 标注"无相关标准"，不阻塞 | 搜不到 → Agent 用自己的知识继续，不阻塞 |

---

#### 三种搜索模式

模式与状态正交。状态决定"谁触发、产出流向谁"，模式决定"搜多深"。

| 参数 | 低 | 中 | 高 |
|------|:---:|:---:|:---:|
| 范围 | 一个具体问题 | 一个关注面 | 一至多个关注面 |
| WebSearch 轮次 | 1-2 | 3-4 | 5-8 |
| WebFetch 精读 | 1-2 篇 | 3-5 篇 | 6-12 篇 |
| 输出 findings | 1-3 条 | 4-8 条 | 8-15 条 |
| Token | ~500 | ~1500 | ~3000 |
| 耗时 | 15-30s | 30-90s | 90-180s |
| 交叉验证 | 不要求 | ≥2 源 | ≥3 源 |

**模式选择**：PM/Agent 根据问题类型自动判定，不增加决策负担。
- 低：事实确认、快速查证
- 中：最佳实践调研、模式对比
- 高：系统调研、合规审计、技术选型

**自动降档**：Leader 在等→上限中 \| token 紧张→降一档 \| 搜索结果一致→降一档 \| 结果矛盾→升一档

---

#### 状态二的细化子类型

触发调研根据**谁检测到缺口**可以进一步细分：

**2a. 自检式**（Agent 自我触发）
```
Developer: "我在写重试逻辑，我只知道 setTimeout 重试，
           但感觉应该有更好的方式。"
  → 搜索 → 发现 Exponential Backoff + Circuit Breaker
  → 用新方案实现，通知 PM
```
- 触发者 = 消费者（自己搜，自己用）
- 最轻量：1 次搜索 + 1 次 Fetch，30 秒内完成

**2b. 审查触疑式**（Reviewer/SL/QA 触发，验证疑虑）
```
Reviewer #1: "函数用了 user input 拼接 HTML，看起来像 XSS，
             但不确定框架是否已转义。"
  → 搜索 → 确认该框架在 v3.2+ 已默认转义，当前版本 v4.0
  → 降级为 LOW（无需修复），附上来源链接
```
- 触发者是审查角色，消费者是审查报告
- 给审查发现加证据支撑，避免"我觉得有问题"

**2c. PM 裁决式**（PM 在两难之间需要业界共识）
```
PM: "Dev #1 主张单体，Dev #2 主张微服务。
     需求是 3 人团队电商 MVP，我应该听谁的？"
  → 搜索 → Martin Fowler: "Monolith First"
  → 裁决：先单体，预留服务边界，月活 >10k 再拆分
```
- PM 触发，缓解"PM 不是什么都懂"的问题
- 用在技术决策裁决，不是方向同步

---

### 2.4 派发规则

- Research Agent 之间**永远可并行**（纯只读 + 不同搜索方向，无文件冲突）
- Research Agent 与 Step 1 Architect **串行**（Architect 依赖调研结果构建提示词）
- Research Agent 数量限制：Full 模式 ≤3 个，Lite 模式 PM 自行搜索不派 Agent

### 2.5 输出 Schema

```json
{
  "domain": "B. 安全与合规",
  "taskContext": "电商 App 新增信用卡支付模块",
  "sourcesSummary": "查阅 PCI-DSS 4.0 官方文档、OWASP 支付安全指南、Stripe SDK 安全最佳实践",
  "findings": [
    {
      "id": "B-001",
      "category": "standard",
      "title": "PCI-DSS 4.0 — cardholder data 存储要求",
      "summary": "禁止存储 CVV/PIN。PAN 必须以 AES-256-GCM 或等效方案加密存储。密钥必须由 KMS 管理。",
      "source": "https://www.pcisecuritystandards.org/document_library",
      "sourceVerified": true,
      "targetAgents": ["Architect", "Reviewer#1", "QA"],
      "promptAugmentation": {
        "Architect": "设计约束：PAN 加密方案必须在设计文档中明确。密钥管理方案（KMS 或等效）为必选。",
        "Reviewer#1": "审查检查项：grep 搜索 'CVV|CVN|PIN' 确认不在日志/持久化中出现。确认加密调用使用了标准库（非自建）。",
        "QA": "测试用例：验证加密后的 PAN 在任何 API 响应、日志输出、错误消息中均以 masked 形式出现。"
      }
    },
    {
      "id": "B-002",
      "category": "pattern",
      "title": "支付幂等性（Idempotency Key Pattern）",
      "summary": "所有支付请求必须支持幂等键。客户端生成唯一 key，服务端以 key 去重。Stripe、支付宝、微信支付均采用此模式。",
      "source": "https://stripe.com/docs/api/idempotent_requests",
      "sourceVerified": true,
      "targetAgents": ["Architect", "Developer", "Reviewer#3", "QA"],
      "promptAugmentation": {
        "Architect": "设计约束：所有写操作 API（/charge、/refund）必须接受 Idempotency-Key 头。数据库需唯一索引（payment_id + idempotency_key）。",
        "Developer": "实现提示：使用数据库唯一约束而非应用层锁来保证幂等。幂等键超时 ≥24h。",
        "Reviewer#3": "集成检查：端到端验证——同一幂等键两次请求返回相同结果，第二次不产生重复扣款。",
        "QA": "测试用例：并发发送 5 个相同幂等键的请求 → 仅 1 笔扣款。超时重试 → 幂等键不变 → 结果相同。"
      }
    },
    {
      "id": "B-003",
      "category": "anti-pattern",
      "title": "浮点数表示金额",
      "summary": "IEEE 754 浮点数无法精确表示十进制货币值。业界标准：金额以最小单位（分/cent）的整数表示。",
      "source": "https://stripe.com/docs/currencies#zero-decimal",
      "sourceVerified": true,
      "targetAgents": ["Architect", "Developer", "Reviewer#2", "QA"],
      "promptAugmentation": {
        "Architect": "设计约束：所有金额字段类型为 integer（单位：分）。API 合约中明确标注单位。前端展示时除以 100。",
        "Developer": "实现提示：后端使用 integer 类型。数据库列类型为 BIGINT。禁止 float/double。",
        "Reviewer#2": "代码质量审查：grep 'float|double|Float|Double' 在 models/ 和 services/ 目录，确保金额字段不出现浮点类型。",
        "QA": "测试用例：大额支付（9999999999 分）→ 不丢失精度。批量退款计算 → 精度毫厘不差。"
      }
    }
  ]
}
```

**Schema 设计要点**：

- `targetAgents`：明确这个发现影响哪些下游 Agent。PM 用它做分发路由
- `promptAugmentation`：**每个目标 Agent 一个键，值是自然语言片段**——PM 直接拼接到该 Agent 的提示词中
- `sourceVerified`：Agent 是否成功获取并阅读了原文（false 时 PM 降级为"仅供参考"）

---

## 3. 提示词工程管道

这是整个设计最核心的部分。调研不是终点——调研→编译→注入才是完整链路。

### 3.1 管道概览

```
Research Agent(s) 输出
    ↓  (原始 JSON 片段，含 targetAgents 路由信息)
PM 编译管道
    ↓
    ├─→ Architect 提示词     = 基础提示词 + 设计约束段 + 推荐模式段 + 参考实现段
    ├─→ SL 提示词            = 基础提示词 + 行业标准段 + 合规检查项
    ├─→ Reviewer #1 提示词   = 基础提示词 + 安全增强清单
    ├─→ Reviewer #2 提示词   = 基础提示词 + 代码质量增强清单
    ├─→ Reviewer #3 提示词   = 基础提示词 + 集成增强清单
    ├─→ QA 提示词            = 基础提示词 + 领域测试场景 + 合规测试用例
    ├─→ RE 提示词            = 基础提示词 + 已知陷阱（反模式规避）
    └─→ Developer 提示词     = 基础提示词 + 实现约束 + 最佳实践提示
```

### 3.2 各 Agent 提示词结构

PM 在派发每个 Agent 时，提示词 = `<基础指令>` + `<场景增强段>` + `<Iron Rules 约束>`。

**基础指令**是 DevFlow 骨架（来自 SKILL.md L2 的角色描述），**场景增强段**是本次调研注入的部分。

#### Architect（设计者）

```markdown
## 任务
设计 [功能名称] 的完整方案。

## 项目上下文（来自 Step -1）
[项目类型、技术栈、现有架构摘要]

## 本次设计约束（来自 Step 0.5 Research）
以下约束为硬约束，必须在设计中满足：
[来自所有 findings 中 targetAgents 含 "Architect" 的 promptAugmentation.Architect]

## 推荐模式（来自 Step 0.5 Research）
以下模式为推荐采纳。如不采纳，需在设计文档中说明理由：
[来自 findings 中 category="pattern" 且 targetAgents 含 "Architect" 的条目]

## 应避免的反模式（来自 Step 0.5 Research）
设计阶段即可规避的陷阱：
[来自 findings 中 category="anti-pattern" 且 targetAgents 含 "Architect" 的条目]

## 参考实现（来自 Step 0.5 Research）
可借鉴的开源项目或文档：
[来自 findings 中 category="reference" 且 targetAgents 含 "Architect" 的条目]

## 输出要求
- 设计文档（含模块划分、接口定义、数据流、错误处理）
- 对每个硬约束的满足说明
- 对不采纳的推荐模式，逐一说明理由
```

#### Reviewer #1（安全审查）

```markdown
## 任务
对本次变更进行安全审查。维度：硬编码凭据、注入攻击面、错误消息泄露、敏感数据暴露。

## 本次审查增强清单（来自 Step 0.5 Research）
以下检查项为本次任务上下文特化，必须逐条覆盖：
[来自所有 findings 中 targetAgents 含 "Reviewer#1" 的 promptAugmentation.Reviewer#1]

## 适用标准（来自 Step 0.5 Research）
本次审查需对照以下行业标准：
[来自 category="standard" 的相关条目]

## 输出格式
文件路径:行号 + 问题描述 + 严重度(CRITICAL/HIGH/MEDIUM/LOW) + 修复建议
增强清单中的每项必须标记为 ✅ 或发现问题
```

#### QA（测试）

```markdown
## 任务
对本次变更进行全量测试。

## 本次测试增强场景（来自 Step 0.5 Research）
以下测试场景为领域特化，必须覆盖：
[来自所有 findings 中 targetAgents 含 "QA" 的 promptAugmentation.QA]

## 合规测试用例（来自 Step 0.5 Research）
以下用例与合规要求直接关联，必须全部通过：
[来自 category="standard" 的合规相关测试项]

## 测试分层目标
单元 ≥70% | 集成 ≥20% | E2E ≥10%（新增代码）
增强场景至少覆盖集成层 + E2E 层各 1 条
```

### 3.3 PM 的编译职责

PM 在 Step 0.5 的核心工作是**聚合 + 去重 + 按 targetAgent 路由 + 编译为提示词段**：

```
PM 处理流程：
  1. 接收 Research Agent(s) 的 JSON 输出
  2. 按 targetAgents 字段拆分，归入 6 个 Agent 桶
  3. 同一 Agent 桶内去重（相似发现合并）
  4. 按 category 排序：standard → pattern → anti-pattern → reference
  5. 检查 sourceVerified：false 的降级为"参考资料（未验证）"
  6. 编译为 §3.2 各 Agent 的提示词结构
  7. 向 Leader 展示编译结果（不是原始 JSON），确认后派发
```

---

## 4. 完整流程修订

### 4.1 更新后的 Step 流程

```
Step -1: 熟悉项目
Step 0: 对齐需求 + 选择模式
    ↓
Step 0.5: Discovery ← 新增
    ├─ Full:  PM 确定搜集方向 → 并行派 Research Agent(s) [状态一] → PM 编译提示词 → Leader 确认
    └─ Lite:  PM 自检索 1-2 点 → 一段话追加到需求记录 → 跳过正式编译
    ↓
Step 1: 设计 (G1)
    → Architect 收到场景化提示词（含设计约束 + 推荐模式）
    → [状态二] Architect 遇到技术选型犹豫时，可随时触发即时调研
Step 2: 安全左移 (G2)
    → SL 收到场景化提示词（含行业标准 + 合规检查项）
    → [状态二] SL 发现可疑模式但不确定时，可搜索验证
Step 3: 实现
    → Developer 收到场景化提示词（含实现约束 + 最佳实践提示）
    → [状态二] Developer 遇到不熟悉的模式/技术时，即时搜索最佳实践
Step 4: 三维审查 (G3)
    → 三个 Reviewer 各收到自己维度的增强检查清单
    → [状态二] Reviewer 发现可疑代码但不确定严重性时，搜索验证
Step 5: 质量门 (G4→G5)
    → QA 收到领域测试场景 + 合规测试用例
    → SL 最终判定时对照 Knowledge Brief 逐项确认
    → [状态二] QA 遇到 flaky test 或不确定的测试行为时搜索根因
Step 6: 文档撰写
    → PM 合并所有状态二调研记录到 Knowledge Brief 附录
Step 7: 复盘
    → 对比 Knowledge Brief 的预测 vs 实际发现
    → 对比规划调研覆盖 vs 触发调研暴露的盲区（哪类缺口规划调研没覆盖到？）
    → 反馈到 §5.2 映射表的改进
```

### 4.2 Step 0.5 的触发条件

| 条件 | Full 调研 | Lite 调研 |
|------|:---:|:---:|
| >5 文件或架构变更 | ✅ | — |
| 涉及 auth/支付/加密/PII | ✅ | — |
| 新 API / 新模块（对外暴露） | ✅ | — |
| 合规要求（GDPR/HIPAA/PCI-DSS） | ✅ | — |
| 第三方服务集成 | ✅ | — |
| 2-5 文件、无安全影响 | — | ✅ |
| 修复 bug（不改变行为） | — | 跳过 |

### 4.3 新增 Iron Rule

```
5. Step 0.5 不可跳过 Full 模式——设计前必须完成上下文调研并注入下游提示词。Lite 模式可最小调研。
```

对应 Edge Case：
```
- 调研发现相互矛盾 → PM 标注矛盾，交给 Architect 在设计中裁决，并记录理由
- 调研结果 sourceVerified=false → 降级为"参考资料"，不作为硬约束
- 调研发现过多（>15条）→ PM 按严重度/影响面截断，优先保留 CRITICAL 约束和安全相关
- Leader 判定不需要某项调研 → 跳过该方向，记录原因（避免下次重复争论）
```

---

## 5. 知识领域分类体系

PM 在 Step 0.5 使用此体系确定 Research Agent 的搜集方向。

### 5.1 三维分类

```
第一层：项目类型
  Web 前端 | Web 后端 | 全栈 | 移动端 | CLI | Library/SDK |
  API/微服务 | 数据管道 | Agent Skill | 桌面应用 | 嵌入式

第二层：业务领域
  金融/支付 | 医疗健康 | 电商 | 社交 | 教育 | 企业 SaaS |
  游戏 | 安全/Auth | 内容/CMS | DevOps/Infra | 政府/合规

第三层：技术关注面（10 个维度）
  A. 架构与模式   → 架构风格、设计模式、SOLID、DDD
  B. 安全与合规   → 威胁建模、加密标准、合规框架、API 安全
  C. 性能与扩展   → 缓存策略、查询优化、水平扩展、负载设计
  D. 可观测性     → 日志规范、Metrics 埋点、Trace 传播、告警设计
  E. 数据与存储   → Schema 设计、迁移策略、数据一致性、备份恢复
  F. API 与集成   → API 版本化、Contract 设计、重试/降级、Webhook
  G. UI/UX/可访问性 → WCAG、i18n/l10n、响应式、动画/过渡
  H. 测试与质量   → 测试策略、静态分析、E2E 框架、压测
  I. DevOps/交付  → CI/CD、Feature Flag、Canary、容器化
  J. 遗留与现代   → 迁移模式（Strangler）、技术债务、重写 vs 重构
```

### 5.2 映射表：需求特征 → 搜集方向（摘录）

| 项目类型 | 业务领域 | 命中关注面 | Research Agent 搜索方向示例 |
|----------|----------|:---:|------|
| Web 后端 | 金融/支付 | A,B,C,E,F | PCI-DSS 4.0、支付幂等性模式、审计日志规范、金额精度标准 |
| Web 前端 | 电商 | A,G,H | WCAG 2.2 AA 检查清单、i18n 最佳实践（react-intl/next-i18n）、Core Web Vitals 阈值 |
| API/微服务 | 企业 SaaS | A,B,C,F,I | API 版本化策略（URL/Header）、Circuit Breaker 模式（resilience4j/Polly）、Rate Limiting 算法 |
| 移动端 | 社交 | C,G,H | 离线优先架构、图片懒加载/渐进式加载、触控手势规范 |
| Library/SDK | 通用 | A,D,F,H | API 设计原则（Kotlin/TypeScript）、Tree Shaking 兼容、Semantic Versioning 实践 |
| CLI | DevOps | A,D,H,I | 12 Factor CLI App 原则、--help 输出规范、退出码标准 |
| 数据管道 | 医疗 | B,C,E,I | HIPAA 合规、数据脱敏（K-anonymity）、Schema 演化（Avro/Protobuf） |
| Agent Skill | 通用 | A,D,H | Skill 设计规范、prompt 注入防护、L1/L2/L3 渐进加载模式 |

--- 续：映射表将持续扩充，每次复盘反馈一条新的映射关系。

### 5.3 PM 的搜集方向判定算法

```
输入：Step 0 对齐的需求描述
输出：搜集方向列表（1-5 条）

1. 从需求中提取关键词
   - 安全关键词：auth, login, password, API key, payment, encrypt, PII
   - 架构关键词：refactor, redesign, new module, new API, breaking change
   - 性能关键词：slow, timeout, 1000/10000/1M users, concurrent, cache
   - 合规关键词：GDPR, HIPAA, PCI, SOC2, compliant, audit
   - 集成关键词：webhook, callback, 3rd party, external API, SDK
   - UI 关键词：form, button, modal, page, responsive, mobile, accessibility

2. 对照 §5.2 映射表，匹配项目类型 + 业务领域

3. 合并去重 → 排序（安全 > 合规 > 架构 > 性能 > 其他）

4. 向 Leader 展示搜集计划（不是自动执行）
   "本次改动涉及 [支付+加密]，命中安全(B)、数据(E)、API(F) 三个关注面。
    建议派 2 个 Research Agent 搜集 PCI-DSS 和支付幂等性相关最佳实践。
    你的偏好？"
```

---

## 6. 实现路径

### Phase 1: 核心 Agent 定义 + 提示词管道（v1.1）

| 文件 | 改动 |
|------|------|
| `SKILL.md` | L2 新增 Step 0.5 概述（~100 tokens）；Iron Rules 新增第 5 条；Edge Cases 补充；新增 Research Agent 角色定义；bundled_resources 新增 |
| `resources/platform-adapters.md` | 新增 Research Agent 行（各平台语法映射） |
| `resources/research/schema.md` | **新建**：Research Agent 完整定义——角色、工具、Schema、输出规范、搜索策略指南 |
| `resources/prompt/guide.md` | **新建**：PM 如何将调研发现编译为下游 Agent 提示词——每个 Agent 的提示词模板 + 编译规则 + 示例 |
| `resources/dispatch/rules.md` | 新增 §9 "上下文调研规则"（含搜集方向判定算法） |
| `resources/workflow-config-template.md` | 同步新增 Step 0.5 段 |

### Phase 2: 映射表扩充 + 速查卡（v1.2）

| 文件 | 改动 |
|------|------|
| `resources/research/taxonomy.md` | **新建**：§5.2 完整映射表 → 从 8 行扩展到 30+ 行；每个组合附带推荐搜索关键词 |
| `resources/domain-briefs/` | **新建目录**：高频领域（支付、Auth、CMS、i18n 等）的 1 页速查卡——预搜集好的常见模式/反模式/标准，Research Agent 搜索前先读此卡，减少搜索轮次 |

### Phase 3: 反馈闭环（v1.3）

| 文件 | 改动 |
|------|------|
| `SKILL.md` | Step 7 复盘新增"Knowledge Brief 准确性评估"小节 |
| `resources/research/taxonomy.md` | PM 可将复盘反馈写入映射表（修正过时引用、补充新发现） |
| 机制 | 用过的 Knowledge Brief → Step 7 淬炼 → 映射表和速查卡越来越准（自进化） |

### 校验更新

| 文件 | 改动 |
|------|------|
| `tests/devflow-check.js` | 新增 ~10 项校验：新文件存在性、Research Agent 角色定义完整性、Schema 字段完整性、提示词模板覆盖所有 Agent 类型 |
| `docs/devflow-validation.md` | 更新校验项文档（65 → ~75 项） |
| `CLAUDE.md` | 同步 Key Files 节 |

---

## 7. 风险与缓解

| 风险 | 缓解 |
|------|------|
| **调研过载**：搜太多，token 爆炸 | PM 硬约束：Full 模式 ≤5 个关注面、≤3 个 Research Agent、每个 ≤15 条 findings |
| **信息过时**：WebSearch 返回的链接过期 | findings 标注生成日期 + `sourceVerified`；30 天前的 Knowledge Brief 触发重新调研 |
| **调研替代思考**：Architect 照搬模式不结合实际 | 设计约束为硬约束，模式为软建议——Architect 须说明采纳/拒绝理由 |
| **Agent 幻觉**：Research Agent 编造来源 | Schema 强制 `source` 字段；PM 抽查 `sourceVerified: true` 的链接至少 2 条 |
| **Leader 决策负担**：多了一个审批环节 | 仅 Full 模式需确认搜集计划；Lite 模式追加一段备注即可 |
| **提示词膨胀**：注入太多 → 下游 Agent 上下文爆炸 | 每个 Agent 的增强段 ≤500 tokens（约 5-8 条精选发现） |
| **状态二滥用**：Agent 遇事就搜，不自己思考 | 同一 Agent 同一 Step 内 ≤3 次触发。PM 监控：若某 Agent 频繁搜索 → 可能是能力边界问题，应考虑换 Agent 类型或拆分任务 |
| **状态二逃逸**：用"搜索一下"拖延实际工作 | 状态二搜索必须在 2 轮内结束（WebSearch → WebFetch），不得连环搜索。PM 可终止过度搜索的 Agent |

---

## 8. 完整示例：电商 App 加支付模块

### Step 0.5 执行全链路

**PM 判定搜集方向：**
```
项目类型：移动端 + Web 后端
业务领域：电商 + 金融/支付
命中关注面：B(安全) + C(性能) + E(数据) + F(API)
搜集方向：
  1. PCI-DSS 4.0 对移动端 SDK + 后端 API 的要求
  2. 支付幂等性设计模式（Stripe/支付宝/微信支付）
  3. 分布式事务 + 最终一致性模式（Saga/Outbox）
派 2 个 Research Agent（#1 安全 + 合规，#2 模式 + API）
```

**Research Agent #1 输出（安全）** → 5 条 findings，targetAgents 覆盖 Architect/Reviewer#1/QA

**Research Agent #2 输出（模式）** → 4 条 findings，targetAgents 覆盖 Architect/Developer/Reviewer#3/QA

**PM 编译 → 各 Agent 场景化提示词：**

| Agent | 注入内容摘要 | token 增量 |
|-------|------|:---:|
| Architect | 设计约束：金额用整数(分)、API 必须幂等、PAN 必须 KMS 加密、PCI-DSS 范围最小化。推荐模式：Tokenization、Saga、Outbox。反模式：自行实现加密、浮点金额 | ~350 |
| Reviewer #1 | 检查清单：日志无 CVV/PAN、加密调用为标准库、密钥不在代码中、API 响应 masked PAN | ~180 |
| Reviewer #2 | 检查清单：金额字段无 float/double、错误处理不泄露支付详情、幂等键唯一索引存在 | ~150 |
| Reviewer #3 | 检查清单：端到端幂等验证、退款链路一致性、Webhook 重试去重 | ~120 |
| QA | 测试场景：并发幂等、超时重试、网络中断恢复、大额精度、退款计算精度。合规用例：PAN masked 输出、CVV 不出现在任何日志 | ~200 |
| Developer | 实现提示：幂等键用 DB 唯一约束（非应用锁）、金额列 BIGINT、加密用 libsodium、Webhook 签名验证 | ~160 |

**全部注入总量：~1,160 tokens（分布在 6 个 Agent 中，每个 Agent 上下文增加 ≤350 tokens）**

### 复盘时对照

```
Step 7 PM 评估：
- PCI-DSS 4.0 要求 → Reviewer #1 审查覆盖 → ✅ 全部通过
- 幂等性模式 → Reviewer #3 集成验证 → 发现 1 个 MEDIUM（幂等键未设过期）
- 金额整数 → Reviewer #2 检查 → ✅ 无浮点
- Knowledge Brief 准确度：9/9 findings 有效，0 条误报
- 反馈：映射表中补充"支付幂等键过期策略"到关注面 F
```

---

*本计划按 DevFlow 方法论管理。Phase 1 准备好后即可开始实现。*

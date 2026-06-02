# Research Agent 定义与 Schema

> L3 资源。Research Agent（研究员）是 DevFlow 第 7 个 Agent 类型。
> 只读分析型，从外部（互联网）搜集领域知识，输出结构化发现供下游 Agent 使用。

## 1. 角色定义

```
名称：Research Agent（研究员）
类型：只读分析型（与 Reviewer、SL 同属只读类，永远可并行）
工具：WebSearch, WebFetch
不可用工具：Write, Edit, Bash, Read, Grep, Glob（纯外部研究，不动项目代码）
```

### 与其他 Agent 的关键区别

| 特性 | Reviewer / SL | Research Agent |
|------|:---:|:---:|
| 审什么 | 审**代码/设计**（项目内的东西） | 审**外部知识**（行业标准、最佳实践、竞品） |
| 数据源 | 项目文件（Read/Grep/Glob） | 互联网（WebSearch/WebFetch） |
| 输出 | Bug 发现 + 严重度 + 行号 | 模式/标准/反模式 + promptAugmentation |
| 消费者 | Developer（修 bug） | PM → Architect, Reviewer, QA 等（丰富提示词） |

---

## 2. 三种搜索模式

搜索模式控制**搜索行为的深度参数**。模式与状态正交——状态决定"谁触发、产出流向谁"，模式决定"搜多深"。

| 参数 | 低 | 中 | 高 |
|------|:---:|:---:|:---:|
| **范围** | 一个具体问题 | 一个关注面 | 一至多个关注面 |
| **WebSearch 轮次** | 1-2 轮 | 3-4 轮 | 5-8 轮 |
| **WebFetch 精读** | 1-2 篇 | 3-5 篇 | 6-12 篇 |
| **输出 findings** | 1-3 条 | 4-8 条 | 8-15 条 |
| **Token 预算** | ~500 | ~1500 | ~3000 |
| **预计耗时** | 15-30s | 30-90s | 90-180s |
| **来源交叉验证** | 不要求 | ≥2 个独立来源 | ≥3 个独立来源 |
| **适用场景** | 事实确认、快速查证 | 最佳实践调研、模式对比 | 系统调研、合规审计、多领域覆盖 |

### 模式选择逻辑

PM 或 Agent 按以下优先级自动判定，不增加额外决策负担：

```
选"低"：只需要 yes/no 或一句话答案。搜事实，不搜方法论。
  例："PCI-DSS 要求加密吗？" "Node.js 最新 LTS 版本号？"

选"中"：需要最佳实践、模式、代码示例。需要对比和验证。
  例："支付幂等性的标准实现方式？" "微服务间事务一致性的业界方案？"

选"高"：需要全面覆盖一个领域。系统性调研，多角度交叉验证。
  例：Step 0.5 规划调研、合规审计、技术选型决策

自动降档条件：
  - Leader 在等（对齐中）→ 上限"中"
  - token 预算紧张 → 降一档
  - 搜索结果高度一致（不需额外验证）→ 降一档
  - 搜索结果矛盾或稀疏 → 升一档
```

### 模式与状态的组合

不是所有 3×2=6 种组合都有意义：

| | 状态一（规划调研） | 状态二（触发调研） |
|------|:---:|:---:|
| **高** | ✅ Step 0.5 系统调研 | ❌ 太慢，对齐中等不了 |
| **中** | ✅ 规划调研的单个关注面 | ✅ Step 1-5 遇到陌生模式 |
| **低** | ❌ 太浅，不够系统 | ✅ Step 0 对齐中当场查事实 |

**Step 0.5 标准配置**：高模式为主，每个 Research Agent 负责 1 个关注面时可降为中。

---

## 3. 两种运行状态

### 状态一：规划调研（Planned Research）

> "我们准备做 X，X 涉及哪些领域？需要提前知道什么？"

**定位**：前置性、系统性。PM 驱动，发生在 Step 0.5，设计之前。

| 维度 | 说明 |
|------|------|
| 触发者 | PM（Step 0.5） |
| 触发条件 | Full 模式 + 需求命中至少 1 个关注面 |
| 搜什么 | 对照 `resources/research/taxonomy.md` 分类体系，系统性覆盖所有命中关注面 |
| 默认模式 | **高**（8-15 条 findings，≥3 源交叉验证，~3000 tokens）。单关注面可降为**中** |
| 输出 | 完整 Knowledge Brief（设计约束 + 模式 + 反模式 + 检查清单） |
| Token 预算 | 高 ~3000 / 中 ~1500 |

**PM 派发指令模板**：

```markdown
你是 Research Agent（研究员）。任务：为以下开发任务搜集领域知识。

## 任务背景
[Step 0 对齐的需求摘要]

## 本次搜集方向
- 关注面：[如 B. 安全与合规]
- 具体方向：[如 PCI-DSS 4.0 对支付系统的要求]
- 推荐搜索：[如 "PCI-DSS cardholder data storage requirements 2025"]

## 输出要求
按 §3 Schema 输出结构化 JSON。每条 finding 必须：
- 标明 category（standard/pattern/anti-pattern/reference）
- 标明 targetAgents（哪些下游角色需要这个发现）
- 为每个 targetAgent 写一句 promptAugmentation（可直接拼入提示词）
- 提供 source URL 并标注是否已验证

## 约束
- 只搜索，不动代码
- 每条 finding 的 source 必须真实可访问
- 不确定的信息在 summary 中标注"未确认"
- 搜索结果为空 → 返回空 findings，不编造
```

---

### 状态二：触发调研（Reactive Research）

> "当前上下文出现了 X，X 的最佳实践是什么？有什么坑？"

**定位**：即时性、精准性。任何 Agent 或 PM 检测到知识缺口时触发。**在 Step 0 对齐讨论中也可触发**——PM 与 Leader 讨论需求时，遇到不确定的合规/标准/模式问题，立即搜索当场回答。

| 维度 | 说明 |
|------|------|
| 触发者 | 任何 Agent（Architect/Developer/Reviewer/QA/RE/SL）或 PM |
| 触发时机 | Step 0 对齐讨论中（PM 触发）或 Step 1-5 执行中（任何 Agent 触发） |
| 触发条件 | 见下方"触发条件清单" |
| 搜什么 | 只搜当前缺口——一个具体的模式、错误、问题 |
| 默认模式 | Step 0 对齐中→**低**（当场回答）\| Step 1-5→**中**（最佳实践需要深度） |
| 输出 | 轻量 JSON + 直接注入触发者决策/实现 |
| Token 预算 | 中 ~1500 / 低 ~500 |

**触发条件清单**（Agent 在执行中遇到以下任一情况时触发）：

1. **不熟悉的模式**：代码中出现不认识的设计模式或技术方案
2. **可疑不确定**：发现可能有问题但不确定是否真的是 bug
3. **技术二选一**：两个方案各有利弊，需要业界共识裁决
4. **错误根因不明**：测试失败或运行时错误，原因不明确需要查
5. **缺少标准对照**：知道大概怎么做但不确定业界标准做法
6. **Leader 提问**：Step 0 对齐中 Leader 问了一个 PM 不确定的问题——立即搜，当场回答

**典型触发场景**：

| 触发者 | 时机 | 场景 | 搜索示例 |
|------|------|------|------|
| PM | Step 0 对齐中 | Leader 说"支付模块要合规"，PM 不确定 PCI-DSS 具体要求 | "PCI-DSS 4.0 requirements for mobile payment SDK 2025" |
| PM | Step 0 对齐中 | Leader 问"Stripe 和支付宝接入有什么区别"，PM 需要当场对比 | "Stripe vs Alipay API integration developer experience" |
| PM | Step 0 对齐中 | Leader 问"这个改动需要 GDPR 合规吗"，PM 不确定适用范围 | "GDPR applicability payment data processor vs controller" |
| Developer | Step 3 实现中 | 项目用了 `setTimeout` 做重试，不确定是否正确 | "Node.js retry pattern best practice exponential backoff" |
| Reviewer #1 | Step 4 审查中 | 代码用 `eval()` 但不确定有没有安全的替代方案 | "safe alternative to eval JavaScript dynamic code execution" |
| QA | Step 5 测试中 | flaky test 根因不明，不确定是测试问题还是代码问题 | "flaky test root cause analysis async operation timeout jest" |
| Architect | Step 1 设计中 | 事件驱动和请求-响应之间犹豫 | "event-driven vs request-response tradeoffs order processing system" |

**触发者自行执行模板**（Agent 自检索，不通过 PM 派发）：

```markdown
我需要查一下 [具体问题]。

项目上下文：[当前在做什么，什么语言/框架]
遇到的情况：[简要描述代码/错误/决策困境]
想确认：[具体想确认什么]

搜索后直接给出 1-3 条发现，附来源。应用到当前决策。
```

**约束**：
- ≤2 轮搜索（WebSearch → 精读 1-2 篇）必须结束
- 同 Agent 同 Step 内 ≤3 次触发
- 搜不到 → 用自己的知识继续，不阻塞
- 搜索完成后通知 PM："在 Step X 触发搜索 Y，发现 Z，已应用"

---

## 4. 输出 Schema

### 4.1 规划调研输出（状态一）

```json
{
  "mode": "planned",
  "domain": "B. 安全与合规",
  "taskContext": "电商 App 新增信用卡支付模块，后端 Node.js + PostgreSQL",
  "sourcesSummary": "查阅 PCI-DSS 4.0 官方文档、OWASP 支付安全指南、Stripe API 最佳实践",
  "findings": [
    {
      "id": "<domain>-<序号>",
      "category": "standard",
      "title": "发现标题",
      "summary": "一句话概述",
      "source": "https://...",
      "sourceVerified": true,
      "targetAgents": ["Architect", "Reviewer#1"],
      "promptAugmentation": {
        "Architect": "设计约束：...",
        "Reviewer#1": "审查检查项：...",
        "QA": "测试用例：..."
      }
    }
  ]
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `mode` | `"planned"` | 固定值，标识此输出来自规划调研 |
| `domain` | string | 关注面代码（A-J），见 `resources/research/taxonomy.md` |
| `taskContext` | string | 任务背景，1-2 句 |
| `sourcesSummary` | string | 资料来源概述 |
| `findings[].id` | string | 唯一标识，格式 `<domain>-<3位序号>` |
| `findings[].category` | `"standard"` \| `"pattern"` \| `"anti-pattern"` \| `"reference"` | 发现在知识体系中的类别 |
| `findings[].title` | string | 发现标题，简洁明确 |
| `findings[].summary` | string | 核心内容摘要，≤3 句 |
| `findings[].source` | string | 来源 URL |
| `findings[].sourceVerified` | boolean | Agent 是否成功 Fetch 并阅读了原文内容 |
| `findings[].targetAgents` | string[] | 此发现影响的下游 Agent 列表 |
| `findings[].promptAugmentation` | object | 以 targetAgent 名为 key，值为可直接拼入该 Agent 提示词的文本 |

**category 说明**：

| category | 说明 | 对下游的意义 |
|------|------|------|
| `standard` | 行业标准/合规要求（如 PCI-DSS、GDPR、WCAG） | **硬约束**——Architect 必须满足，Reviewer 必须检查 |
| `pattern` | 推荐的设计模式/最佳实践（如 Idempotency Key、Circuit Breaker） | **软建议**——Architect 推荐采纳，不采纳需说明理由 |
| `anti-pattern` | 应避免的常见陷阱（如浮点金额、自建加密） | **禁止项**——Reviewer 主动扫描，Developer 规避 |
| `reference` | 参考实现/开源项目/文档 | **借鉴**——Architect 可参考，不强制 |

### 4.2 触发调研输出（状态二）

```json
{
  "mode": "reactive",
  "triggeredBy": "Developer#1",
  "triggeredInStep": "Step 3",
  "context": "正在实现支付重试逻辑，用 setTimeout(fn, 1000) 做重试",
  "question": "JavaScript/Node.js 中实现 API 重试的最佳实践是什么？",
  "searchSummary": "搜索 'nodejs api retry pattern best practice' → 精读 2 篇",
  "findings": [
    {
      "title": "Exponential Backoff + Jitter",
      "summary": "重试间隔应指数增长并添加随机抖动，避免惊群效应。使用 promise-retry 或 async-retry 库而非手写。",
      "source": "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/",
      "sourceVerified": true,
      "appliedDecision": "改用 async-retry 库，配置 backoff: { min: 100, max: 10000, factor: 2, jitter: true }"
    }
  ]
}
```

**与状态一 Schema 的区别**：
- 多了 `triggeredBy`、`triggeredInStep`、`context`、`question`——记录触发上下文
- findings 中多了 `appliedDecision`——触发者实际采纳的行动
- 不需要 `promptAugmentation`——触发者自己消费
- 不需要 `targetAgents`——消费者就是触发者或 PM 归档

---

## 5. 搜索策略

搜索优先级、关键词构造、来源可靠性判定、Fetch 要求 → 见 `resources/research/search-strategy.md`。

## 6. 派发规则

派发参数（各状态+模式下的搜索轮次/WebFetch/findings/token 上限）→ 见 `resources/dispatch/research.md`。

## 7. 平台适配

Agent 调用语法 → 见 `resources/platform-adapters.md`。

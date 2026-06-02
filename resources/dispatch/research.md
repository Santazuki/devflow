# 上下文调研规则（Step 0 + Step 0.5）

> 加载时机：Step 0 对齐中、Step 0.5 调研阶段。
> 详细定义见 `resources/research/schema.md`、`resources/prompt/templates.md`、`resources/prompt/compression.md`。

## 调研的两个时机

Step 0 对齐中：讨论暴露知识缺口 → 状态二即时搜索，结果反哺讨论。Step 0.5 对齐后：状态一系统搜索，覆盖所有关注面。

| | Step 0 对齐中 | Step 0.5 对齐后 |
|------|:---:|:---:|
| **状态** | 状态二（触发调研） | 状态一（规划调研） |
| **驱动** | 讨论中的知识缺口 | PM 系统判定搜集方向 |
| **范围** | 窄——回答 Leader 的具体问题 | 宽——覆盖所有命中关注面 |
| **产出** | 口头回答 / 一段话备注 | 完整 Knowledge Brief → 下游提示词 |
| **目的** | 让对齐更准确，不凭猜讨论 | 让设计有据可依，不凭空白猜 |
| **可跳过** | Lite 可跳过 | Full 不可跳过 |

## 搜集方向判定

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

## 规划调研（状态一）派发规则

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

## 触发调研（状态二）规则

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

## 编译与注入（PM 职责）

PM 按 `targetAgent` 路由编译提示词段（详见 `resources/prompt/templates.md` 和 `resources/prompt/compression.md`）。核心约束：standard→硬约束，pattern→软建议，anti-pattern→禁止项，sourceVerified=false→降级，>50%上限→三级压缩。

## Lite 模式调研

Lite 模式下跳过正式规划调研。PM 自行 1-2 次搜索后追加一段上下文备注到需求记录。触发调研仍然可用。

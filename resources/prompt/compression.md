# 注入量控制与压缩策略

> L3 资源。PM 在编译提示词时，按此规则控制注入量并执行压缩。

## 注入量控制

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

## 压缩触发

注入 tokens / 最大注入 tokens > **50%** → 触发压缩。压缩操作交由**轻量 LLM**（haiku/flash/lite）执行，PM 仅准备指令 + 审核输出。

## 三级压缩

压缩按信息保真度从高到低依次尝试，上一级达标则停止。

---

**第一级：键值对压缩** `轻量 LLM`

PM 指令（~50 tokens）：
> "将以下设计约束压缩为 key:value 格式。保留所有数值和条件。格式: '约束主题:值 | 约束主题:值'。原始：[注入内容]"

格式规则：standard → `key:value`（保留数值）\| pattern → `推荐:[方案名]` \| anti-pattern → `禁:[关键词]` \| reference → `参考:[链接]`。来源 URL 保留。

达标：≤50% → 注入。>50% → 第二级。

---

**第二级：优先级截断** `PM 规则`

丢弃顺序（低→高）：reference → anti-pattern → pattern → standard。同 category 内 sourceVerified=false 优先丢弃。每丢一条重新计算。丢弃条目记录到 Knowledge Brief。

达标：≤50% → 注入。>50% → 第三级。

---

**第三级：摘要式压缩** `轻量 LLM`

PM 指令（~100 tokens）：
> "将以下内容压缩至 ≤[目标] tokens。硬约束保留完整语义不得丢数值。软建议可合并仅保留方案名。反模式保留关键词。保留所有 URL。原始：[注入内容]"

达标：≤50% → 注入。失败 → 硬截断。

---

## 压缩决策流程

```
>50%? → 否:注入 | 是→L1[轻量LLM]键值压缩 → 达标:注入 | 失败/仍超标→L2[PM]截断
  → 达标:注入 | 仍超标→L3[轻量LLM]摘要压缩 → 达标:注入 | 失败→硬截断
  → 硬约束丢失+CRITICAL? → 通知Leader | 否则→降级注入(L4)
```

## 故障分级

| 级别 | 场景 | 应对 |
|:---:|------|------|
| **L1** | 轻量 LLM 不可用 | 跳过第一/三级，PM 直接规则截断 |
| **L2** | 压缩导致硬约束语义丢失 | 回退上一级结果，丢弃软建议保硬约束 |
| **L3** | 硬截断后 CRITICAL 约束丢失 | 通知 Leader |
| **L4** | 全流程彻底失败 | **降级注入**：≤100 tokens 最简提示词（仅 standard 标题 + Knowledge Brief 路径），Agent 靠自身知识补位 |

## PM 自检清单

- [ ] 每个 Agent 的增强段 ≤ token 上限？
- [ ] 每个 Agent 的增强段 > 50% 上限时，已执行压缩？
- [ ] 压缩后硬约束完整保留？
- [ ] 压缩失败时已按故障分级逐级降级？
- [ ] L4 降级注入时保留了 Knowledge Brief 文档路径？
- [ ] 所有 source 含 URL？
- [ ] standard 类发现进入 Architect 的硬约束段？
- [ ] sourceVerified=false 的发现已降级标注？
- [ ] 同 Agent 桶内去重完成？
- [ ] 丢弃/截断/降级的条目已记录到 Knowledge Brief？
- [ ] 编译结果已向 Leader 展示？（Full 模式）

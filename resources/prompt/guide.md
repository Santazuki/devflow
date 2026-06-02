# 提示词工程指南（索引）

> PM 在 Step 0.5 将 Research Agent 输出编译为下游 Agent 场景化提示词。
> 先读此索引，按需加载对应模块。

## 模块

| 模块 | 文件 | 加载时机 | 内容 |
|------|------|------|------|
| 编译管道 | 本文件 | 每次编译时 | 路由规则、桶内处理、category 约束映射 |
| 提示词模板 | `templates.md` | Step 1-5 派发 Agent 时 | Architect/SL/Reviewer#1-3/QA/Developer/RE 完整模板 |
| 压缩策略 | `compression.md` | 注入量 >50% 上限时 | 三级压缩 + 故障应对 + PM 自检清单 |

## 编译管道

```
Research Agent(s) JSON → PM 聚合+去重+按 targetAgent 路由 → Agent 提示词
```

### 路由规则

按 `targetAgents` 字段归入 Agent 桶：Architect / SL / Reviewer#1（安全）/ Reviewer#2（质量）/ Reviewer#3（集成）/ QA / Developer / RE。一条 finding 可进多桶。

### 桶内处理

1. 按 category 排序：standard → pattern → anti-pattern → reference
2. 同 category 内 sourceVerified=true 优先
3. 去重：title 相似的合并
4. 截断：每桶 ≤8 条（~500 tokens），超出按 category 优先级截断
5. 编译为模板文本段

### category → 约束级别

| category | 约束级别 | Agent 行为 |
|------|:---:|------|
| `standard` | **硬约束** | 必须满足。Architect 逐一说明，Reviewer 逐条检查，QA 逐条验证 |
| `pattern` | **软建议** | 推荐采纳，不采纳需说明理由 |
| `anti-pattern` | **禁止项** | 不得出现，Reviewer 主动扫描 |
| `reference` | **参考** | 可借鉴，不强制 |

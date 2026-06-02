# Research Agent 搜索策略指南

> L3 资源。Research Agent 执行搜索时的操作规范。

## 搜索优先级

1. 先搜官方文档（标准组织、语言/框架官网）
2. 再搜权威博客（AWS、Google Cloud、Martin Fowler 等）
3. 最后搜社区（Stack Overflow、Reddit、GitHub Issues）
4. 不搜：中文技术公众号、个人博客（无来源验证）、过时文章（>2年）

## 搜索关键词构造

不搜 `[项目名] 怎么实现 [功能]`（太泛），要搜 `[技术栈] [模式名] best practice [年份]`（精确）。
例：`"Stripe API idempotency key pattern best practice 2025"`

## 来源可靠性判定

| 可靠性 | 来源类型 | 示例 |
|:---:|------|------|
| ⭐⭐⭐ | 官方标准/文档 | PCI Security Council, IETF RFC, MDN |
| ⭐⭐⭐ | 知名技术公司工程博客 | AWS Architecture Blog, Google SRE, Stripe Docs |
| ⭐⭐ | 资深个人博客 | Martin Fowler, Dan Abramov |
| ⭐⭐ | 开源项目文档 | Kubernetes docs, React docs |
| ⭐ | Stack Overflow（高票） | 需交叉验证 |
| ❌ | AI 生成内容农场/个人公众号 | 不使用 |

## 搜索后必须 Fetch

Agent 不能只读搜索结果摘要。对每条纳入 findings 的来源，必须 WebFetch 原文确认：
- 来源确实包含引用信息
- 日期有效（标准类 ≤5 年，技术类 ≤2 年）
- 非 AI 生成内容农场

确认无误 → `sourceVerified: true`。无法确认 → `sourceVerified: false`，PM 降级为"参考（未验证）"。

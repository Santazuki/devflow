# DevFlow 知识领域分类体系

> L3 资源。PM 在 Step 0.5 使用此分类体系确定 Research Agent 的搜集方向。
> 此文件持续扩充——每次复盘反馈一条新的映射关系。

## 三层分类

### 第一层：项目类型

```
Web 前端 | Web 后端 | 全栈 | 移动端 | CLI | Library/SDK |
API/微服务 | 数据管道 | Agent Skill | 桌面应用 | 嵌入式
```

### 第二层：业务领域

```
金融/支付 | 医疗健康 | 电商 | 社交 | 教育 | 企业 SaaS |
游戏 | 安全/Auth | 内容/CMS | DevOps/Infra | 政府/合规
```

### 第三层：技术关注面（10 个维度）

| 代码 | 关注面 | 涵盖 |
|------|------|------|
| A | 架构与模式 | 架构风格、设计模式、SOLID、DDD |
| B | 安全与合规 | 威胁建模、加密标准、合规框架、API 安全 |
| C | 性能与扩展 | 缓存策略、查询优化、水平扩展、负载设计 |
| D | 可观测性 | 日志规范、Metrics 埋点、Trace 传播、告警设计 |
| E | 数据与存储 | Schema 设计、迁移策略、数据一致性、备份恢复 |
| F | API 与集成 | API 版本化、Contract 设计、重试/降级、Webhook |
| G | UI/UX/可访问性 | WCAG、i18n/l10n、响应式、动画/过渡 |
| H | 测试与质量 | 测试策略、静态分析、E2E 框架、压测 |
| I | DevOps/交付 | CI/CD、Feature Flag、Canary、容器化 |
| J | 遗留与现代迁移 | 迁移模式（Strangler）、技术债务管理、重写 vs 重构 |

---

## 映射表：需求特征 → 搜集方向

PM 在 Step 0 拿到需求后，对照此表识别搜集方向：

| 项目类型 | 业务领域 | 命中关注面 | Research Agent 搜索方向示例 |
|----------|----------|:---:|------|
| Web 后端 | 金融/支付 | A,B,C,E,F | PCI-DSS 4.0、支付幂等性模式、审计日志规范、金额精度标准 |
| Web 前端 | 电商 | A,G,H | WCAG 2.2 AA 检查清单、i18n 最佳实践（react-intl/next-i18n）、Core Web Vitals 阈值 |
| API/微服务 | 企业 SaaS | A,B,C,F,I | API 版本化策略、Circuit Breaker 模式、Rate Limiting 算法 |
| 移动端 | 社交 | C,G,H | 离线优先架构、图片懒加载/渐进式加载、触控手势规范 |
| Library/SDK | 通用 | A,D,F,H | API 设计原则、Tree Shaking 兼容、Semantic Versioning 实践 |
| CLI | DevOps | A,D,H,I | 12 Factor CLI App、--help 输出规范、退出码标准 |
| 数据管道 | 医疗 | B,C,E,I | HIPAA 合规、数据脱敏（K-anonymity）、Schema 演化 |
| Agent Skill | 通用 | A,D,H | Skill 设计规范、prompt 注入防护、L1/L2/L3 渐进加载模式 |
| Web 全栈 | 电商 | A,B,C,E,F,G,H | 支付安全 + 前端 a11y + API 幂等性 + 数据库事务 |
| 移动端 | 金融 | A,B,C,E,F | 移动端 PCI 合规、密钥链存储、生物认证集成 |

---

## PM 搜集方向判定算法

```
输入：Step 0 对齐的需求描述
输出：搜集方向列表（1-5 条）

1. 从需求中提取关键词
   - 安全：auth, login, password, API key, payment, encrypt, PII, token
   - 架构：refactor, redesign, new module, new API, breaking change, migrate
   - 性能：slow, timeout, concurrent, cache, batch, 高并发
   - 合规：GDPR, HIPAA, PCI, SOC2, compliant, audit, regulatory
   - 集成：webhook, callback, 3rd party, external API, SDK, message queue
   - UI：form, button, modal, page, responsive, mobile, accessibility, a11y
   - 数据：schema, migration, backup, consistency, transaction, index

2. 对照映射表，匹配项目类型 + 业务领域

3. **未命中处理**：若项目类型或业务领域不在映射表中——
   - 仍执行关键词提取（步骤 1 不受映射表影响）
   - 告知 Leader："本次需求组合（[项目类型] + [业务领域]）未命中现有映射表，基于关键词分析命中关注面 [X,Y,Z]。建议以关键词结果为准进行搜集。"
   - 记录未命中组合到 §未命中记录，复盘时评估是否加入映射表
   - 不确定时默认搜集安全(B)和架构(A)两个面（最低保障）

4. 合并去重 → 排序（安全 > 合规 > 架构 > 性能 > API > 数据 > UI > 其他）

5. 向 Leader 展示搜集计划（不是自动执行）
   "本次改动涉及 [关键词]，命中 [关注面]。
    [如有未命中] 项目类型/领域未在映射表中，已基于关键词补充。
    建议搜集 [具体方向]。
```

---

---

## 映射表同步机制

### 同步触发

每次 Step 7 复盘时，PM 检查本次调研的覆盖效果：

1. **未命中评估**：本次是否有未命中映射表的组合？关键词提取的结果是否比映射表更准确？
2. **新增映射**：本次调研中发现了哪些映射表中没有的搜索方向？
3. **修正映射**：映射表中是否有过时或不准确的条目？

### 新增映射规则

| 条件 | 操作 |
|------|------|
| 同一组合（项目类型+业务领域）被触发 ≥2 次 | PM 提议新增映射行，Leader 确认后加入 |
| 发现新的业务领域或项目类型 | PM 先加入"候选"列，经 2 次实战验证后正式加入分类体系 |
| 现有映射行的搜索方向不准确 | PM 修正并记录原因 |
| autoMode 下 | PM 自动新增，Step 7 总结时告知 Leader |

### 映射行格式

```markdown
| [项目类型] | [业务领域] | [命中关注面代码] | [推荐搜索关键词，分号分隔] |
```

---

## 未命中记录

| 日期 | 来源项目 | 未命中组合 | 关键词分析结果 | 是否已加入映射表 |
|------|------|------|------|:---:|
| — | — | — | — | — |

---

## 扩充记录

| 日期 | 来源 | 新增/修正 |
|------|------|------|
| 2026-06-02 | Phase 1 实现 | 初始 10 行映射表 |
| 2026-06-03 | 方法论增强 | 新增未命中处理 + 同步机制 |

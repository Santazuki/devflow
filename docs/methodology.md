# 我在一个 AI Agent 项目里，不小心摸索出一套多 Agent 协作的开发方法

> 核心洞察：让 PM Agent 管住 6 个 Subagent，但 PM 自己不能越权做审查——自己审自己的活，等于没审。

我大三下学期。2026 年 5 月，我独自在做一个叫 [unblind](https://github.com/Santazuki/unblind) 的 Claude Code Skill——给没有视觉能力的纯文本模型装一双眼睛，把图片甩给视觉 API，返回文字描述。

开发到后期，项目膨胀到十几个模块、七个 Provider。每次改东西都要过设计 → 实现 → 安全审查 → 全量测试。在对话里一件事一件事做效率太低，我开始用 Agent 工具把任务派发给 Subagent。

然后问题就来了。

## 问题：有 Agent，但没有管 Agent 的方法

最开始我让一个 Agent 包揽设计、写代码、测试全部。确实比我手写快，但质量很差——设计没想清楚就开写，安全完全没人看，测试覆盖跟纸一样薄。

我把角色分开了。Architect 出设计，Developer 写代码，Reviewer 审代码。看起来合理，但三个新问题暴露出来。

**一、我经常替 Agent 干活。** SL 审设计、QA 跑测试，我（对话里的 Claude）经常顺手就做了。省时间。但问题是我审自己派的活——关口形同虚设。不是工具不支持，是我潜意识觉得"自己干更快"。

**二、不知道该并行还是串行。** 有一次我把三个 Developer 同时派出去，两个都改了 `registry.js`，合并时冲突得一塌糊涂。后来我全串行派——没冲突了，但慢得要死。没有一个规则帮我在派发前判断。

**三、Reviewer 重复劳动。** 三个 Reviewer 都审全部文件，同一段代码读三遍。安全、代码质量、集成兼容——三个维度裹在一起，谁都审不深。

这三个问题的根因是一样的：**缺少一套 PM Agent 的调度规范。**

## 解决：从踩坑里长出来的三个版本

### v1：能派，但管不好

```
我提需求 → PM 理解 → 派一个 Agent 干全部
```

这是最原始的状态。能用，但只适合 50 行内的小改动。

### v2：双 Pipeline 架子

开发 unblind 到 Phase 3 的时候，我慢慢发现开发流程天然分成两段：

**Part 1：开发段。** Architect 出设计 → Developer 实现 → Reviewer 审查。这段里 Developer 可能可以并行（不同文件），但全量测试必须等所有人写完。

**Part 2：质量门。** Security Lead 汇总攻击面 → QA 全量回归 → 有问题 RE 修，修完重测。这段必须严格串行——每步的输入是上步的输出。

还有一点，安全问题不该等代码写出来再查。Architect 出了设计文档之后，SL 就能并行审查——设计阶段修安全问题比代码阶段便宜一个数量级。这一步叫"安全左移"。

v2 的架子在 unblind Phase 3-5 的开发中跑通了。但还有一个根本问题——**PM 还是会犯规。** 审查、测试、安全判定，我时不时越过去自己做。流程是对的，约束力不够。

### v3：管住 PM，补上调度规则

v3 加了三条硬规则，也是这套方法最核心的部分：

**规则一：PM 禁止亲自做审查类工作。**

这四个角色必须通过 Agent 工具派发独立 Agent：

| 角色 | 派发时机 | 为什么不能自己做 |
|------|----------|------|
| Security Lead | G2(审设计) + Part2(最终评估) | 自己审自己派的设计 = 盲区 |
| Reviewer ×3 | G3(代码审查) | 独立视角是审查唯一价值 |
| QA Engineer | Part2(全量测试) | 测试和修 bug 不能同一人 |
| Reliability Engineer | Part2(修复失败) | 同上 |

每关走完，PM 自问一句："这关是独立 Agent 做的，还是我自己做的？"自己做的立刻补派。

**规则二：并行/串行用文件交集判。**

派发 Developer 前只需回答两个问题：

```
问：B 的产出依赖 A 的代码或设计？
   → 是 → 串行，A 先于 B
   → 否 → 继续
问：A 和 B 修改同一个文件？
   → 是 → 串行，避免合并冲突
   → 否 → 并行
```

还有几条补充规则：
- 只读 Agent（Reviewer、SL）永远可以并行——只做 Read/Grep，不和任何人冲突
- Worktree 隔离不是并行通行证——两个 Dev 改同一个基准文件，隔离也不能阻止合并冲突
- Part 2 全程串行——SL → QA → RE 是严格顺序依赖

**规则三：Reviewer 分三个维度。** 不交叉覆盖：

| Reviewer | 维度 | 具体检查项 |
|----------|------|------|
| #1 | 安全 | 硬编码 Key、注入点、错误消息泄露、API Key 流转路径 |
| #2 | 代码质量 | 接口一致性、DRY 原则、overrides 机制有效性、向后兼容 |
| #3 | 集成 | Provider 数据一致性、调用链兼容、开关行为、端到端链路 |

安全、质量、集成三类问题的审查方法完全不同——安全需要 grep 扫描和攻击面推理，质量需要接口比对和逻辑走读，集成需要数据校验和调用链验证。三个人各精一项比三个人全量审同一批代码有效得多。

CRITICAL 发现 → 阻断 Part 2 → 退回 Developer → **同一个 Reviewer 复审查** → CLEAN 才放行。换 Reviewer 要重新理解上下文，浪费 token。

## 跑一遍：unblind Provider v3.0 重构

说再多不如看一次实际执行。这是 unblind 把 Provider 层从模板方法模式重构为协议驱动架构的过程。

**背景：** 删 3 个 Provider 文件，新建 2 个（protocols.js + generic-provider.js），修改 4 个（httpClient/registry/orchestrator/测试）。涉及 9 个文件。

**G1 设计。** PM 跟我对齐需求后，Architect 出了 [Spec](https://github.com/Santazuki/unblind/blob/master/docs/superpowers/specs/2026-05-30-provider-v3-protocol-driven-design.md) + [Plan](https://github.com/Santazuki/unblind/blob/master/docs/superpowers/plans/2026-05-30-provider-v3-protocol-driven.md)，228 + 1613 行。

**G2 安全左移。** 独立 SL Agent 审 spec + plan，输出一条 MEDIUM：协议对象在 `_call` 中以引用传入 override 函数，理论上可被污染。我判定"不要过度设计，override 来自硬编码注册表"，放行。

**Part 1 实施。** PM 列出三个 Developer 的文件清单：

```
Dev #1: 新建 tests/test-protocols.js, scripts/lib/providers/protocols.js
Dev #2: 新建 tests/test-generic-provider.js, scripts/lib/providers/generic-provider.js
Dev #3: 修改 scripts/lib/httpClient.js, scripts/lib/providers/registry.js,
              scripts/lib/orchestrator.js, tests/test-registry.js
```

文件路径无交集 → 全并行派发。三个 Dev 各自在独立 worktree 中工作，使用 `isolation="worktree"`。事后 cherry-pick 合并，仅 Dev #2/#3 创建的桩文件有冲突，用 Dev #1 的正式版本覆盖解决。

**G3 三维审查。** 三个 Reviewer 各审一个维度：

| Reviewer | 发现 |
|----------|------|
| #1 安全 | 2 HIGH — `parsed.message` 透传 API 原始错误消息到用户 |
| #2 代码质量 | 2 HIGH — `execute()` 中 parseError 绕过 `_call()`，override 机制失效；1 MEDIUM |
| #3 集成 | 1 **CRITICAL** — Mimo 在 v3 路径下 baseUrl 为空，请求构造为相对路径必然失败；2 HIGH |

**CRITICAL 触发回退。** 阻断 Part 2，Dev #3 修复 → Reviewer #3 复审查 → 3 项全部确认 FIXED → 放行。

**Part 2 质量门。** SL 汇总攻击面（CLEAN）→ QA 全量测试（163 pass, 0 fail）→ 无需 RE → SL 最终评估 CLEAN。全程一轮过。

**最终数字：**

| 指标 | 重构前 | 重构后 |
|------|:---:|:---:|
| 模块 | 16 | 15 |
| Provider 代码 | ~347 行 (3 子类 + build 函数) | ~290 行 (1 类 + 纯函数) |
| 测试 | 95 | 171 |
| 新增 Provider | 写 build 函数 | 注册表加一行数据 |
| 审查捕获 | — | 1 CRITICAL + 6 HIGH，全部在生产前修复 |

## 这套方法能复用吗？

整理出来之后，我发现它不绑定 unblind，不依赖特定工具。核心就是 **1 个 PM Agent + 6 个 Subagent + 5 个关口 + 3 条硬规则**。

我把这套方法打包成了一个可安装的 Claude Code Skill：[DevFlow](https://github.com/Santazuki/devflow)。里面有完整的 CLAUDE.md 模板和操作指南。

**适用场景：**
- 跨 5 个以上模块的功能开发或重构
- 涉及 API Key、用户输入、外部服务（需要安全左移）
- 多人/多次 Agent 协作

**不适用：**
- 单文件改动、配置修改、文档更新——直接对话更快
- 所有文件紧耦合的项目——Developer 没法并行，Part 1 优势丧失
- 快速原型阶段——这时要速度，不是流程

## 复盘

这套方法不是灵光一现设计出来的。是在 unblind 开发中被现实逼出来的——v1 派 Agent 但管不好，v2 双 Pipeline 但 PM 犯规，v3 管住 PM + 有规则 + 不重复劳动。三个版本，每个都对应一段踩坑经历。

还有一个意外的收获：把流程写下来、整理成规则的过程，强迫我反思了自己在开发中偷过的懒、跳过的步骤。v2 阶段效率低，不是因为工具不够好，是因为我管不住那个想走捷径的自己。PM 硬约束这条规则——"禁止亲自做审查"——本质上是在对抗自己的惰性。

---

*如果这套方法对你有用，或者你发现哪里可以改进，来 [DevFlow](https://github.com/Santazuki/devflow) 提 issue。*

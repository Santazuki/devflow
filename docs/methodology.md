# 我在开发 unblind 时，不小心摸索出一套多 Agent 协作的方法

我今年大三下。五月份的时候在做一个叫 unblind 的 Claude Code skill——给 DeepSeek 这种纯文本模型装一双眼睛，把图片甩给视觉 API 再返回文字描述。

开发到后面，项目膨胀到十几个模块、七个 Provider，每次改东西都要过设计、实现、安全审查、全量测试。在对话里一件事一件事地做效率很低，我试着用 Claude Code 的 Agent 工具把任务派发给 Subagent。

然后问题就来了。

## 刚开始：派 Agent，但管不好

最早我就是简单粗暴地派——"帮我实现这个功能"，一个 Agent 包揽设计、写代码、测试。确实比我自己手写快，但质量很差。设计没想清楚就写代码，安全完全没人看，测试覆盖跟纸一样薄。

我意识到需要把角色分开。Architect 管设计，Developer 写代码，Reviewer 审代码。看起来合理了，但新问题又冒出来——

**我自己在替 Agent 干活。** SL 审查设计、QA 跑测试，我（对话里的 Claude）经常顺手就做了。省时间嘛，派 Agent 还要等。但问题是我审自己派的活，跟没审一样。这不是工具的问题，是我管不住自己。

**不知道什么时候并行派。** 有一次我把三个 Developer 同时派出去，结果两个人都改了 registry.js，cherry-pick 的时候冲突得一塌糊涂。后来学乖了，全串行派——慢得要死。

**Reviewer 也浪费。** 三个 Reviewer 都审全部文件，同样的代码读三遍。不是他们不想分工，是我没告诉他们该审什么。

## 第一次质变：拆成两个阶段

开发 unblind 到 Phase 3 的时候，我慢慢发现开发流程天然分成两段。

**Part 1 是开发段。** Architect 出设计 → Developer 写代码 → Reviewer 审。这段的特点是 Developer 之间可能可以并行，但测试必须等所有人写完。

**Part 2 是质量门。** 代码到位 + 审查通过之后，Security Lead 汇总攻击面 → QA 全量回归 → 有问题就 RE 修，修完重测。这段必须严格串行，因为每一步的输入是上一步的输出。

后来我又发现，安全问题不应该等代码写出来再查。Architect 出了设计文档之后，Security Lead 就可以并行审查设计了——设计阶段的安全问题比代码阶段便宜十倍。我把这一步叫"安全左移"。

双 Pipeline 的架子就这么搭起来了。但还有一个根本问题没解决——

## 第二次质变：管住 PM

v2 的流程是对的，但我（PM）还是会犯规。审查、测试、安全判定，我经常觉得"自己干更快"就越过 Agent 自己做了。

我必须给自己定一条死规则：**SL、Reviewer、QA、RE 这四个角色，PM 不能亲自做。** 必须派独立 Agent。每走完一个关口，我得问自己一句——"这关是独立 Agent 做的还是我自己做的？"如果是我自己做的，立刻补派。

听起来很机械，但就是靠这条规则，v3 才真正把质量门跑起来了。

另外两个改进是后来补的：

**Developer 并行/串行的判定。** 其实就两问——B 的产出依赖 A 的代码吗？A 和 B 改同一个文件吗？都不是就并行。只读的 Agent（Reviewer、SL）永远可以跟任何人并行。Worktree 隔离不能替代文件交集检查——两个 Dev 改同一个基准文件，隔离也没用。

**Reviewer 分三个维度。** 安全、代码质量、集成，三类问题的审查方法完全不一样。安全需要 grep 扫硬编码 Key、推理攻击面；代码质量需要比对接口、走读逻辑；集成需要核对注册表数据、验证调用链。让三个人各精一项，比三个人全量审同一批代码有效得多。CRITICAL 发现要同一个 Reviewer 复审查——发现问题的 Reviewer 最清楚怎么才算修好。

## 流程全貌

实际跑起来是这样的：

```
我提需求
  → PM 跟我对齐（做什么、不做什么、怎么算做完）
    → Architect 出设计文档
      → SL 并行审设计（安全左移）
        → Developer 实现（并行/串行按文件交集判）
          → 3 个 Reviewer 各审一个维度
            → CRITICAL? 回退 Developer，同一 Reviewer 复审查
              → Part 2: SL 汇总 → QA 测试 → RE 修（≤3轮）
                → SL 最终判 → CLEAN 或通知我
```

6 个角色，5 个关口：

| 关口 | 条件 | 不满足 |
|------|------|--------|
| G1 | Architect 出了设计文档 | 等 |
| G2 | 独立 SL Agent 审了设计 | 安全问题回 Architect |
| G3 | 独立 Reviewer Agent 无 CRITICAL | 阻断 Part 2，回 Developer |
| G4 | 独立 QA Agent 全量测试 PASS | 派 RE 修（≤3轮） |
| G5 | 3 轮后独立 SL Agent 判 | 通知我决定 |

角色就六个：
- **Architect**（只读）— 设计
- **Developer**（读写）— TDD 实现
- **Reviewer #1/#2/#3**（只读）— 安全/代码质量/集成
- **Security Lead**（只读）— G2 审设计 + Part 2 攻击面汇总 + 最终评估
- **QA Engineer**（读写测试文件）— 全量回归
- **Reliability Engineer**（读写）— 修失败项

## 在 unblind Provider v3.0 重构上跑了一遍

重构目标是把 Provider 层从模板方法（BaseProvider + 3 子类）改成协议驱动（3 协议族纯函数 + GenericProvider + 纯数据注册表）。

G1 出了 spec + plan。G2 SL 审设计发现一个 MEDIUM——协议对象可能被 override 函数污染。我看了觉得"不要过度设计"，放行。

Part 1 派了三个 Developer，检查文件清单后发现完全无交集（一个新建 protocols.js，一个新建 generic-provider.js，一个改 httpClient/registry/orchestrator），全并行派。各自在独立 worktree 里干，事后 cherry-pick 合并。

G3 三个 Reviewer 各审一个维度——安全发现 2 HIGH，代码质量发现 2 HIGH + 1 MEDIUM，集成发现 1 CRITICAL（Mimo baseUrl 在 v3 路径下为空，请求必崩）。

CRITICAL 触发了回退——阻断 Part 2 → Dev #3 修 → Reviewer #3 复审查 → 确认修好 → 放行。

Part 2 QA 跑完 163 tests 全绿，RE 不用上。SL 最终评估 CLEAN。

| | 重构前 | 重构后 |
|------|------|------|
| 测试数 | 95 | 171 |
| Provider 代码 | ~347 行 (3 子类) | ~290 行 (1 类 + 纯函数) |
| 新增 Provider | 写一个 build 函数 | 加一行数据 |

## 什么时候该用这套方法

**该用的时候：**
- 改的东西跨 5 个以上模块
- 涉及 API Key、用户输入、外部服务（需要安全审查）
- 重构项目核心架构
- 多人/多次 Agent 协作

**不该用的时候：**
- 改个 typo、换个配置、写文档——直接对话一句的事
- 所有文件紧耦合互相依赖——Developer 没法并行，Part 1 的优势就没了
- 快速原型阶段——这时候要的是速度，不是流程

**你需要什么工具：**
- 一个能派独立 Subagent 的 Agent 工具（Claude Code 的 Agent 就行）
- Worktree 或分支隔离（并行 Developer 用）
- 一个严格的 PM Agent（我就是用 CLAUDE.md + 记忆文件约束它不准犯规的）

我把这套方法整理成了一个可安装的 skill，叫 [DevFlow](https://github.com/Santazuki/devflow)。里面有 CLAUDE.md 模板和完整的操作指南。

## 一些复盘

这套方法不是我在某天灵光一现设计出来的。它就是我在 unblind 开发过程中，踩了坑、修了 bug、迭代了三个版本，被现实逼出来的东西。

v1 是"派 Agent 但管不好"，v2 是"双 Pipeline 但 PM 犯规"，v3 是"管住 PM + 并行/串行有规则 + Reviewer 不重复劳动"。

它不是什么"工业级"的东西——我是一个大三学生，不是工程经理。它就是一套实际跑通过、能复用的规则。如果对你也有用，或者你觉得哪里可以改得更好，来提 issue。

---

*这套方法还有一个受益者没提到：**我自己**。把流程写下来、整理成规则的过程，强迫我反思了自己在开发中偷过的懒、跳过的步骤、盲目的自信。写完之后我才意识到，v2 阶段那几个月的开发效率低，不是因为工具不够好，是因为我管不住那个想走捷径的自己。*

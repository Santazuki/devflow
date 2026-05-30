<p align="center">
  <img src="https://img.shields.io/badge/version-1.0-blue" alt="version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
  <img src="https://img.shields.io/badge/agentskills.io-compatible-purple" alt="agentskills.io">
  <img src="https://img.shields.io/badge/Claude%20Code-ready-orange" alt="Claude Code">
</p>

<h1 align="center">DevFlow</h1>
<p align="center">
  <em>双 Pipeline 多 Agent 协作框架。</em>
  <br>
  PM + 6 个 Agent + 5 道关口 = 不会悄无声息挂掉的代码。
</p>

---

## 这是什么

DevFlow 是一个可复用的 **Agent Skill**。它把 Claude Code 变成一个项目经理——当你对它说"多 agent"，它不会盲目派发 Subagent，而是按照一套经过验证的流程推进开发。

这套方法是我在开发 [unblind](https://github.com/Santazuki/unblind) 项目时，踩了三个版本的坑、被现实逼出来的。核心思路很简单：**一个 PM Agent 管 6 个 Subagent，通过 5 道关口控制质量，PM 自己不能越权做审查。**

```
Leader 提需求
  → PM 对齐范围
    → Part 1: Architect 设计 → Developer 实现 → 3 个 Reviewer 审查
    → Part 2: Security Lead → QA 测试 → RE 修复（≤3 轮）
      → CLEAN 或回退
```

## 它解决了什么问题

给 Claude Code 开了 Agent 工具，就像发了一队工人却没有工头。

不用 DevFlow 的时候：
- **PM 替 Agent 干活**——"我自己审更快"→ 关口形同虚设
- **并行派发产生合并冲突**——两个 Developer 改了同一个文件
- **Reviewer 重复劳动**——三人审同一批代码，都审不深
- **没有回退机制**——审查发现严重 bug？接下来该干嘛？

## 核心规则

### PM 硬约束

四个角色 PM **禁止亲自做**，必须派独立 Agent：

| 角色 | 时机 | 为什么 |
|------|------|------|
| Security Lead | 审设计 + 最终评估 | 自己审自己的设计 = 盲区 |
| Reviewer ×3 | 代码审查 | 不同维度需要不同眼睛 |
| QA Engineer | 全量测试 | 测试和修 bug 不能同一人 |
| Reliability Engineer | 修复失败 | 同上 |

每关走完 PM 自问：*"这关是独立 Agent 做的还是我自己做的？"*

### 串行 vs 并行

派发前只需答两问：

```
B 的产出依赖 A 的代码？→ 串行
A 和 B 改同一个文件？→ 串行
都不是 → 并行
```

只读 Agent 永远可并行。Worktree 隔离不是并行通行证。

### Reviewer 三维分工

三个 Reviewer 各审一个维度，不交叉：

| # | 维度 | 检查什么 |
|---|------|------|
| 1 | 安全 | 硬编码 Key、注入、错误消息泄露 |
| 2 | 代码质量 | 接口一致性、DRY、向后兼容 |
| 3 | 集成 | 数据一致性、调用链、端到端链路 |

CRITICAL 发现 → 阻断 Part 2 → 退回 Developer → 同一 Reviewer 复审查。

### 5 道关口

| 关口 | 条件 | 不满足 |
|------|------|--------|
| G1 | Architect 输出设计文档 | 等 |
| G2 | 独立 SL 审设计 | 回 Architect |
| G3 | 独立 Reviewer 无 CRITICAL | 阻断 Part 2，回 Developer |
| G4 | 独立 QA 全量测试 PASS | 派 RE 修（≤3 轮） |
| G5 | 3 轮后 SL 判定 | 通知 Leader |

## 快速开始

### 安装

```bash
# 安装到项目
git clone https://github.com/Santazuki/devflow.git .claude/skills/devflow

# 或全局安装
git clone https://github.com/Santazuki/devflow.git ~/.claude/skills/devflow
```

### 使用

在 Claude Code 中说：

```
"多agent开发这个功能"
"用 devflow"
"哪些任务可以并行"
"派发计划"
```

### 集成到 CLAUDE.md

```bash
cat resources/claude-md-template.md >> CLAUDE.md
```

然后按项目调整角色名和工具名。

## 实战验证

在 unblind Provider v3.0 重构中跑过一轮：

| 指标 | 重构前 | 重构后 |
|------|:---:|:---:|
| 模块 | 16 | 15 |
| 测试 | 95 | 171 |
| Provider 代码 | ~347 行 (3 子类) | ~290 行 (1 类 + 纯函数) |
| 审查捕获 | — | 1 CRITICAL + 6 HIGH |

9 个文件改动，3 个 Developer 并行派发，合并冲突仅发生在两个桩文件上。Part 2 QA 一轮过。

完整案例见 [`docs/methodology.md`](docs/methodology.md)。

## 目录结构

```
devflow/
├── SKILL.md                    # Skill 本体（agentskills.io 规范）
├── README.md                   # 英文 README
├── README_zh.md                # 你正在读的
├── LICENSE                     # MIT
├── resources/
│   └── claude-md-template.md   # 复制到项目的 CLAUDE.md 模板段
└── docs/
    └── methodology.md          # 完整方法论（v0→v3 演进 + 实战案例）
```

## 什么时候用

**该用：**
- 跨 5+ 文件的开发或重构
- 涉及安全敏感代码
- 多人/多次 Agent 协作

**不该用：**
- 改 typo、修配置、写文档
- 紧耦合项目（文件全互相依赖）
- 快速原型（这时要速度不是流程）

## License

MIT © 2026 Santaz

---

<p align="center">
  <sub>用 <a href="https://github.com/Santazuki/unblind">unblind</a> 实战验证。用 Claude Code 开发。意外设计，迭代打磨。</sub>
</p>

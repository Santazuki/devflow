<h1 align="center">DevFlow</h1>
<p align="center"><em>双 Pipeline 多 Agent 协作框架</em></p>
<p align="center">
  PM + 7 个 Agent + 5 道关口 = 不会悄无声息挂掉的代码
</p>
<p align="center">
  <a href="README_en.md">English</a> | 中文
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.1.0-blue" alt="version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
  <img src="https://img.shields.io/badge/agentskills.io-compatible-purple" alt="agentskills.io">
  <img src="https://img.shields.io/badge/universal-Claude%20Code%20%7C%20Copilot%20%7C%20Cursor%20%7C%20Windsurf-lightgrey" alt="universal">
</p>

---

## ✨ 这是什么

DevFlow 是一个可复用的 **Agent Skill**。把 Claude Code 变成一个项目经理——当你说"多 agent"，它不会盲目派发 Subagent，而是按一套验证过的流程推进：

```
Leader 提需求
  → PM 对齐范围 + 实时调研
    → Part 0: Research Agent 上下文调研（Step 0.5）
    → Part 1: Architect 设计 → Developer 实现 → 3×Reviewer 审查
    → Part 2: Security Lead → QA 测试 → RE 修复（≤3 轮）
      → CLEAN → Step 6 Spec 同步 → Step 7 复盘
```

这套方法从 [unblind](https://github.com/Santazuki/unblind) 开发中长出来。三个版本的迭代，被现实逼出来的规则。

## 🎯 解决什么问题

给 Claude Code 开了 Agent 工具，就像发了一队工人却没有工头。

| 没 DevFlow | 有 DevFlow |
|------|------|
| PM 替 Agent 干活——关口形同虚设 | PM 硬约束：4 个角色禁止亲自做 |
| 两个 Dev 改同一个文件——合并冲突 | 派发前检查文件交集，有冲突就串行 |
| 三个 Reviewer 审同一批代码——都审不深 | 安全/质量/集成三维分工，不交叉 |
| 审查发现严重 bug——不知道接下来该干嘛 | CRITICAL 阻断 Part 2 → 回退 → 同一 Reviewer 复审查 |

## ⚙️ 核心规则

**PM 硬约束**：SL、Reviewer、QA、RE 四个角色 PM 禁止亲自做。Research Agent 为只读调研，不在此列。

**串行 vs 并行**：两问决策——B 依赖 A 的产出？改同一文件？都不是就并行。只读 Agent 永远可并行。

**Reviewer 三维分工**：#1 安全（Key 泄露/注入）· #2 代码质量（接口/DRY/兼容）· #3 集成（数据一致性/调用链）

**Step 0.5 上下文调研**：设计前按需搜集行业标准/设计模式/反模式，注入下游 Agent 提示词。

**6 条 Iron Rules**：PM 不越权 · 无测试不合并 · 不跳过对齐 · CRITICAL 复审 · 不问 commit/推进许可 · Step 0.5 不跳过

**5 道关口**：G1 设计出 → G2 SL 审设计 → G3 Reviewer 无 CRITICAL → G4 QA 全绿 → G5 SL 最终判

## 🚀 快速开始

**npm 安装（持久保留在本地）：**

```bash
npm install -g @santazuki/devflow
```

**GitHub 直接下载到 skills 目录：**

```bash
git clone https://github.com/Santazuki/devflow.git .claude/skills/devflow
```

在 Claude Code 中说：`"多agent开发这个功能"`、`"派发计划"`、`"哪些可以并行"`

集成到项目 CLAUDE.md：

```bash
cat resources/workflow-config-template.md >> CLAUDE.md
```

## 🧪 实战验证

在 unblind Provider v3.0 重构中跑过——9 个文件改动，3 个 Developer 并行，1 轮 QA 过：

| 指标 | 前 | 后 |
|------|:---:|:---:|
| 测试 | 95 | 171 |
| Provider 代码 | ~347 行 (3 子类) | ~290 行 (1 类 + 纯函数) |
| 审查捕获 | — | 1 CRITICAL + 6 HIGH |

## 🤝 参与贡献

欢迎提 Issue 和 PR。

### 开发环境

```bash
git clone https://github.com/Santazuki/devflow.git
# 纯 Markdown + YAML，无编译，无依赖
```

### 验证

```bash
# 完整性检验（141 项）
node tests/devflow-check.js
```

详见 [`docs/devflow-validation.md`](docs/devflow-validation.md)

## License

MIT © 2026 Santaz

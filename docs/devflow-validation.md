# DevFlow 完整性检验

> 本地运行 `node tests/devflow-check.js` 验证 SKILL.md 结构完整性。

## 检验项

| 类别 | 项数 | 说明 |
|------|:---:|------|
| SKILL.md 结构 | 17 | 章节完整性、frontmatter、L1/L2/L3 标记 |
| 文件存在性 | 19 | 所有资源文件就位（3 子目录 + 2 根文件） |
| dispatch 模块 | 28 | 索引 + 4 模块（core/interaction/research/lifecycle）跨文件覆盖 |
| platform-adapters.md | 6 | 平台覆盖（含 Research Agent） |
| research/schema.md | 7 | 角色定义、两种状态、Schema、搜索策略、派发规则 |
| prompt 模块 | 12 | guide(索引) + templates + compression 跨文件覆盖 |
| 工作流链路 | 9 | Step -1→0→0.5→1→...→7 无断点 |
| Iron Rules 映射 | 6 | 每条规则对应 Edge Case |
| 资源互引用 | 10+ | 交叉引用有效 |
| 行业引用 | 4 | WHOOP、Google SRE、semver、Trunk-Based |

## 运行

```bash
node tests/devflow-check.js
```

预期：全部 ✅，0 fail。

## 结果（2026-06-02 — v1.1.0）

```
全部 pass
```

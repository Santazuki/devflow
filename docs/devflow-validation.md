# DevFlow 完整性检验

> 本地运行 `node tests/devflow-check.js` 验证 SKILL.md 结构完整性。

## 检验项

| 类别 | 说明 |
|------|------|
| SKILL.md 结构 | 章节完整性、frontmatter、L1/L2/L3 标记 |
| 文件存在性 | 所有资源文件就位（3 子目录 + 2 根文件） |
| dispatch 模块 | 索引 + 4 模块（core/interaction/research/lifecycle）跨文件覆盖 |
| platform-adapters.md | 平台覆盖（含 Research Agent） |
| research/schema.md | 角色定义、三种搜索模式、两种运行状态、Schema、搜索策略 |
| prompt 模块 | guide(索引) + templates + compression 跨文件覆盖 |
| 工作流链路 | Step 0→7 无断点 |
| Iron Rules | 6 条规则 + Edge Cases 映射 |
| 资源互引用 | 交叉引用有效性 |
| 行业引用 | WHOOP、Google SRE、semver、Trunk-Based |

## 运行

```bash
node tests/devflow-check.js
```

预期：全部 ✅，0 fail。

## 结果（2026-06-03 — v1.1.0）

```
全部 pass
```

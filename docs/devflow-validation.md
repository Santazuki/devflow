# DevFlow 完整性检验

> 本地运行 `node tests/devflow-check.js` 验证 SKILL.md 结构完整性。

## 检验项

| 类别 | 项数 | 说明 |
|------|:---:|------|
| SKILL.md 结构 | 15 | 章节完整性、frontmatter、L1/L2/L3 标记 |
| 文件存在性 | 9 | 所有资源文件就位 |
| dispatch-rules.md | 14 | 子章节覆盖 |
| platform-adapters.md | 5 | 平台覆盖 |
| 工作流链路 | 8 | Step 0→7 无断点 |
| Iron Rules 映射 | 4 | 每条规则对应 Edge Case |
| 资源互引用 | 7 | 交叉引用有效 |
| 行业引用 | 4 | WHOOP、Google SRE、semver、Trunk-Based |

## 运行

```bash
node tests/devflow-check.js
```

预期：全部 ✅，0 fail。

## 结果（2026-06-01）

```
65 pass, 0 fail
```

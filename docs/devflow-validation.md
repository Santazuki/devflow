# DevFlow 完整性检验

> 本地运行 `node tests/devflow-check.js` 验证 SKILL.md 结构完整性。

## 检验项

| 类别 | 项数 | 说明 |
|------|:---:|------|
| SKILL.md 结构 | 17 | 章节完整性、frontmatter、L1/L2/L3 标记 |
| 文件存在性 | 12 | 所有资源文件就位（含新增 research-agent-schema、prompt-augmentation-guide） |
| dispatch-rules.md | 17 | 子章节覆盖（含 PM 交互纪律、上下文调研规则、Spec 同步） |
| platform-adapters.md | 6 | 平台覆盖（含 Research Agent） |
| research-agent-schema.md | 7 | 角色定义、两种状态、Schema、搜索策略、派发规则 |
| prompt-augmentation-guide.md | 6 | 编译管道、各 Agent 模板、注入量控制 |
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

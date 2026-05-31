# DevFlow 调度规则参考

> L3 资源，PM 按需读取。L2 中已覆盖核心流程，此处为完整细节。

## 派发前自问 6 条

1. 这个角色我能亲自做？（SL/Reviewer/QA/RE → 不能）
2. 多个 Developer 文件路径有交集？
3. 有人 import 另一个将创建的模块？
4. 这个 Agent 需要前一个 Agent 的产出？
5. 这个 Agent 是只读的？（是 → 自动并行）
6. Part 1 没走完能进 Part 2？（不能）

## 回退规则

| 失败类型 | 谁修 | 回退到 |
|---------|------|--------|
| 配置/环境/测试断言 | RE | 本轮 |
| 代码逻辑 bug | Developer | Part 1 |
| 设计缺陷/接口断裂 | Architect | Part 1 从头 |

## 重构后全量扫描

Part 2 CLEAN 后执行。grep 旧类名/旧文件名/旧模块数/旧测试数 → README/SKILL/CLAUDE/package/memory 逐文件修。

## 文档撰写策略（Step 6）

| 项目类型 | 同步内容 |
|----------|------|
| **Agent Skill** | SKILL.md、README、CLAUDE.md、测试报告、memory/ |
| **npm 包 / SDK** | README、package.json、CHANGELOG、API 文档 |
| **CLI 工具** | README、--help 输出、man page |
| **通用项目** | README、CLAUDE.md、测试报告 |

所有类型必做：测试报告（`docs/test-results/step<N>-<name>.md`）+ CLAUDE.md 模块/测试数同步。

## 记忆口诀

```
只读一定并行，写操作用文件判。
无交无依赖并行，有交有依赖串行。
Part 2 全程串行，CRITICAL 必回退。
PM 不得亲自做，自己审自己是盲区。
```

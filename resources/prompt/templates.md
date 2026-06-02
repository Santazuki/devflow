# Agent 提示词模板

> L3 资源。PM 编译调研发现时，按此模板为每个下游 Agent 组装场景化提示词。
> 提示词 = `<角色基础指令>` + `<场景增强段>` + `<Iron Rules 约束>`。基础指令来自 SKILL.md L2 角色描述。

## Architect（设计者）

```markdown
## 任务
设计 [功能名称] 的完整方案。

## 项目上下文（来自 Step -1）
[项目类型、技术栈、现有架构、关键约束]

## 设计约束 —— 必须满足（来自 Step 0.5 Research）
以下约束为硬约束，必须在设计文档方案中体现。对每条约束，说明满足方式：
[注入 category=standard 的 findings，每条格式：]
- [约束标题]：来源 [source]。满足方式：[Architect 在此说明]

## 推荐模式 —— 建议采纳（来自 Step 0.5 Research）
以下模式为业界推荐做法，请评估是否适用于本次设计。如不采纳，说明理由：
[注入 category=pattern 的 findings，每条格式：]
- [模式标题]：来源 [source]。采纳 是/否，理由：[Architect 在此说明]

## 应避免的反模式（来自 Step 0.5 Research）
在设计阶段即规避以下陷阱：
[注入 category=anti-pattern 的 findings]

## 参考资料（来自 Step 0.5 Research）
可借鉴的实现和文档：
[注入 category=reference 的 findings]

## 输出要求
- 设计文档（含模块划分、接口定义、数据流、错误处理策略）
- 对每个硬约束的满足说明
- 对不采纳的推荐模式，逐一说明理由
```

---

## Security Lead（安全左移 + 最终评估）

**Step 2 安全左移**：

```markdown
## 任务
审查设计文档的安全性。不等实现开始，在设计中找出安全问题。

## 适用标准（来自 Step 0.5 Research）
本次设计需对照以下行业标准：
[注入 category=standard 的 findings]

## 审查维度
1. 敏感数据：设计方案中的加密策略、密钥管理、数据脱敏是否满足上述标准
2. 攻击面：设计方案暴露的 API/接口是否存在注入、越权、信息泄露风险
3. 依赖安全：设计引入的第三方服务/SDK 是否有安全最佳实践
4. 日志与审计：设计方案中敏感数据是否会在日志/错误消息中泄露

## 输出格式
文件路径:行号 + 问题描述 + 严重度(CRITICAL/HIGH/MEDIUM/LOW) + 修复建议
如无问题，输出 "CLEAN"
```

**Step 5 最终评估**：

```markdown
## 任务
对本次变更做最终安全评估。对照 Knowledge Brief 逐条确认。

## 合规逐条确认（来自 Step 0.5 Research）
[注入所有 standard 类 findings，每条格式：]
- [X] [标准标题]：通过 / 不通过 → [证据]

## 攻击面最终确认
[由 SL 汇总 Part 2 中所有安全相关发现]

## 最终判定
CLEAN / NEEDS_FIX / KNOWN_ISSUE
```

---

## Reviewer #1（安全审查）

```markdown
## 任务
对本次代码变更进行安全审查。

## 基础检查项
- 硬编码凭据（API Key、密码、Token）
- 注入攻击面（SQL、XSS、命令注入）
- 错误消息泄露敏感信息
- 敏感数据在日志/响应中暴露

## 本次特化检查项（来自 Step 0.5 Research）
[注入 targetAgents 含 "Reviewer#1" 的 promptAugmentation 文本]
[格式：每条为独立检查项，末尾标注来源]

## 输出格式
文件路径:行号 + 问题描述 + 严重度 + 修复建议
特化检查项中每项必须标记 ✅ 通过 或 ❌ 发现问题
```

---

## Reviewer #2（代码质量审查）

```markdown
## 任务
对本次代码变更进行代码质量审查。

## 基础检查项
- 接口一致性：新增/修改的接口与项目现有风格一致
- DRY 原则：是否存在可抽取的重复逻辑
- 向后兼容：是否破坏现有 API 合约
- 命名与结构：变量/函数/模块命名是否符合项目惯例

## 本次特化检查项（来自 Step 0.5 Research）
[注入 targetAgents 含 "Reviewer#2" 的 promptAugmentation 文本]

## 输出格式
文件路径:行号 + 问题描述 + 严重度 + 改进建议
```

---

## Reviewer #3（集成审查）

```markdown
## 任务
对本次代码变更进行集成兼容性审查。

## 基础检查项
- 数据一致性：跨模块的数据读写是否保证一致性
- 调用链完整：新增/修改的调用是否覆盖所有分支
- 端到端链路：从入口到出口的完整路径是否可追踪
- 错误传播：模块间的错误传递是否正确

## 本次特化检查项（来自 Step 0.5 Research）
[注入 targetAgents 含 "Reviewer#3" 的 promptAugmentation 文本]

## 输出格式
文件路径:行号 + 问题描述 + 严重度 + 修复建议
```

---

## QA（测试）

```markdown
## 任务
对本次变更进行全量测试。

## 测试分层目标
- 单元测试 ≥70%（新增代码）
- 集成测试 ≥20%（新增代码）
- E2E 测试 ≥10%（新增代码）

## 本次领域特化测试场景（来自 Step 0.5 Research）
以下场景为本次领域特化，必须在测试计划中覆盖：
[注入 targetAgents 含 "QA" 的 promptAugmentation 文本]

## 合规验证用例（来自 Step 0.5 Research）
以下用例与合规要求直接关联：
[注入 category=standard 且 targetAgents 含 "QA" 的 findings]

## 输出
- 测试报告（pass/fail/skip + 覆盖率）
- 对领域特化场景逐条标记 ✅ 覆盖 或 ⚠️ 未覆盖
```

---

## Developer（实现者）—— 可选

Developer 的增强提示词相对轻量。约束和模式已通过 Architect 的设计间接传达，此处仅补充**实现层面的最佳实践提示**：

```markdown
## 实现提示（来自 Step 0.5 Research）
以下最佳实践建议在实现时参考：
[注入 category=pattern 或 anti-pattern 且 targetAgents 含 "Developer" 的 findings]

## 注意规避的反模式
[注入 category=anti-pattern 且 targetAgents 含 "Developer" 的 findings]
```

---

## RE（可靠性工程师）—— 可选

```markdown
## 已知陷阱（来自 Step 0.5 Research + QA 测试失败分析）
修复以下失败项时，注意以下已知陷阱：
[注入 category=anti-pattern 的 findings]

## 约束
- 仅修配置/环境/测试断言问题
- 代码逻辑 bug 回 Developer
- 设计缺陷回 Architect
```

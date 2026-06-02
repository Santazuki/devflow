# Changelog

## [1.1.2] - 2026-06-03

### 变更摘要
- 模块：N/A（纯文档项目）
- 测试：141 项
- 新增文件：1 个（scripts/install.js）
- 修改文件：3 个（package.json, README.md, README_en.md）
- 删除文件：0

### 关键变更
- npm 包排除 CLAUDE.md（仅 devflow 自身开发用）
- npx @santazuki/devflow 一键安装（bin 脚本自动复制到 skills 目录）

### 审查捕获
- N/A

---

## [1.1.1] - 2026-06-03

### 变更摘要
- 模块：N/A
- 测试：141 项
- 新增文件：3 个（package.json, scripts/install.js, docs/CHANGELOG.md）
- 修改文件：2 个（README.md, README_en.md）

### 关键变更
- npm 发布 @santazuki/devflow
- bin 安装脚本：npx 一键安装到 .claude/skills/devflow/
- 安装方式三选一：npx / npm install -g / git clone

### 审查捕获
- N/A

---

## [1.1.0] - 2026-06-02/03

### 变更摘要
- 模块：N/A
- 测试：65 → 141 项（+76）
- 新增文件：12 个
- 修改文件：6 个
- 删除文件：0

### 关键变更
- **Step 0.5 Discovery**：上下文调研流程，Research Agent（第 7 个 Agent 类型）
- **三种搜索模式**：低/中/高，两种运行状态：规划调研 + 触发调研
- **Iron Rules 4→6**：#5 PM 交互纪律，#6 Step 0.5 不可跳过
- **PM-Leader Part 级方向同步** + 完全自动化模式
- **提示词工程管道**：6 Agent 场景化模板 + 三级压缩 + L1-L4 故障回退
- **知识领域分类体系**：3 层分类 + 映射表 + 扩展表 + 整理机制 + 未命中处理
- **Step 6 Spec 同步**：设计文档归档 + CHANGELOG delta + README 同步
- **开发流程闭环**：分支 + 提交 + 偏离判定 + Leader 决策门
- **模块化拆分**：dispatch-rules.md → 索引 + 4 模块，prompt → 索引 + 模板 + 压缩
- **resources/ 分子目录**：dispatch/prompt/research
- **resource-index.md**：bundled_resources 16 行 → 1 行外置索引
- **L3 瘦身**：全量 33,360 → 21,414 tok（-36%），Lite -52%，Full -42%
- README + README_en + methodology 同步至 v1.1.0
- CLAUDE.md 重建（面向任意 Agent 开发 DevFlow）

### 审查捕获
- N/A（方法论自身增强，自举中逐步完善）

---

## [1.0.0] - 2026-05-30

### 变更摘要
- 模块：N/A
- 测试：65 项
- 初始版本

### 关键变更
- 双 Pipeline 架构：Part 1（Architect → Developer + Reviewer）+ Part 2（SL → QA → RE）
- 5 道质量关口：G1-G5
- 4 条 Iron Rules
- Full / Lite 双模式
- L1/L2/L3 渐进式加载
- dispatch-rules.md、platform-adapters.md、methodology.md
- unblind Provider v3.0 实战案例

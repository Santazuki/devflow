# Provider 层设计模式参考

> 来自 Pi Agent（badlogic/pi-mono）的架构对比，三条值得引入的设计模式。

## 1. 可穿透抽象（Penetrable Abstraction）

**Pi 的做法**：提供统一接口 `streamSimple`/`completeSimple`，同时允许 `import from "pi-ai/anthropic"` 直接调用厂商原生 API 参数。

**当前 zeshim 的限制**：协议对象是封闭的——用户无法透传 Anthropic 的 `prompt caching` 参数或 Google 的 `safetySettings`。

**建议**：`buildBody` 加一个 `extra?: Record<string, unknown>` 字段，厂商特定参数透传，不被协议约束过滤。

**适用场景**：团队需要在统一协议之上使用某个 Provider 的独家能力（如 Anthropic 的 extended thinking 配置）。

---

## 2. 能力标记（Compat/Capabilities）

**Pi 的做法**：每个 Provider 声明 `compat` 字段，标记该 Provider 支持什么特性。

```typescript
interface OpenAICompletionsCompat {
  supportsStrictMode: boolean;
}
interface AnthropicMessagesCompat {
  supportsEagerToolInputStreaming: boolean;
}
```

**意义**：上游调度器可以根据能力标记选择 Provider。比如"需要流式工具调用 → 跳到有 `supportsToolStreaming` 的 Provider"。

**当前 zeshim 的 REGISTRY** 已有 `limits`（rpm/tpm），可以加一个 `capabilities` 字段：

```typescript
{ name: 'groq',
  capabilities: { streaming: true, thinking: false, toolUse: false } }
```

**不需要现在就实现这些功能——只标记哪些 Provider 能做，上游调度器自己决定要不要用。**

**适用场景**：框架作者（Mastra、BeeAI）在选择 Provider 时不需要逐个查文档，看注册表即可。

---

## 3. 流式支持（Streaming）

**Pi 的做法**：6 种协议全部支持流式，每个协议实现 `StreamFunction` 映射到统一事件类型。

**当前 zeshim**：协议接口是纯同步的，`execute()` 等待完整响应再返回。

**建议**：协议对象加可选方法 `stream?`，GenericProvider 检测：有 `stream` → 用流式；没有 → 降级到 `execute` 后 accumulate 返回。和 Pi 的 `completeSimple` 降级逻辑一致。

```typescript
interface Protocol {
  // 现有 6 个方法
  ...
  // v0.2 新增
  stream?: (url, headers, body, signal) => AsyncIterable<StreamEvent>;
}
```

**适用场景**：聊天类工具需要逐字输出体验，不阻塞 UI。

---

## 对照表

| | Pi | zeshim | 建议 |
|------|------|------|------|
| 可穿透抽象 | ✅ 原生 import | ❌ 协议封闭 | 加 `extra` 透传字段 |
| 能力标记 | ✅ `compat` 系统 | ❌ 仅 `limits` | 加 `capabilities` 字段 |
| 流式支持 | ✅ 全协议 | ❌ 路线图 | `stream?` 可选方法 |
| 协议族数 | 6 | **3** | 够了，不需要跟 |
| 模型目录 | 2000+ 自动生成 | 7 行硬编码 | **不跟**——那是框架层的事 |
| 双通道 | ✅ raw + simple | ❌ | **不跟**——过度抽象，不是基座层职责 |

## 适用指引

- **架构设计时（Step 1）**：PM 参考本文判断当前项目 Provider 层是否需要 `capabilities` 和 `extra` 透传
- **Reviewer #3（集成审查）**：检查 Provider 注册表是否声明了能力标记
- **后期扩展**：流式需求出现时直接查本文对照 Pi 的实现方案

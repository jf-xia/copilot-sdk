# Code CLI 架构设计

## 1. 目标

- 使用 `@github/copilot-sdk` 构建一个可执行的 `code-cli` 应用。
- 尽可能复用 Copilot CLI 的现有能力，避免重复实现会话管理、模型调用、工具调用、无限会话、MCP、技能、hooks 等基础设施。
- 在交互式模式下尽量提供与 Copilot CLI 相同的斜杠命令能力。
- 为命令兼容层提供可测试的模块边界，确保新增命令或修改行为时可以被自动化测试覆盖。

## 2. 约束与设计原则

- SDK 本质上是“通过 JSON-RPC 编程控制 Copilot CLI”的 TypeScript 客户端，因此本项目最优策略不是重写 Copilot CLI，而是构建一个兼容式外壳。
- 项目运行时要求 `Node >= 20`。
- `@github/copilot-sdk` 默认会复用 `@github/copilot` 提供的 CLI 运行时，这意味着我们可以把大部分 AI、工具和会话能力继续交给原生 Copilot CLI。
- 需要兼容的重点是“命令入口和本地状态管理”，而不是重写底层 agent runtime。

## 3. 总体方案

`code-cli` 分为五层：

1. CLI Shell 层
   负责参数解析、REPL 交互、输出渲染、命令帮助、启动和退出流程。
2. Command Router 层
   负责识别输入是否为本地命令、SDK 直连命令、Copilot 透传命令。
3. Application Service 层
   负责会话生命周期、模型切换、权限策略、工作目录、命令目录、使用统计、会话摘要等应用语义。
4. Copilot Gateway 层
   负责封装 `CopilotClient` / `CopilotSession`，屏蔽 SDK 细节，便于测试替身替换。
5. Persistence 层
   负责把本地配置、命令允许规则、最近会话、工作目录、模型偏好落盘。

## 4. 复用策略

### 4.1 直接复用 SDK / Copilot CLI 的能力

- 会话创建、恢复、删除
- 模型列表与模型切换
- 无限会话与上下文压缩
- 自定义工具、权限请求、用户输入请求
- MCP 服务器配置
- 自定义 agent 与技能目录
- 会话事件流与消息历史

### 4.2 本项目新增的最小外壳能力

- 交互式 REPL
- 斜杠命令注册表与别名系统
- 本地状态文件与权限目录管理
- 输出格式化和会话摘要
- 测试替身与命令兼容性测试

### 4.3 透传策略

对 Copilot CLI 已原生理解、但 SDK 没有直接暴露专门 API 的命令，优先采用“把原始斜杠命令透传到当前会话”的方式处理。这样可以最大化复用 Copilot CLI 现有行为，减少本地分叉逻辑。

## 5. 模块拆分

### 5.1 入口与应用骨架

- `src/index.ts`
  进程入口。
- `src/cli.ts`
  命令行参数解析与启动流程。
- `src/app.ts`
  组装各服务并驱动 REPL。

### 5.2 Copilot 适配层

- `src/copilot/copilot-gateway.ts`
  定义对 SDK 的抽象接口。
- `src/copilot/sdk-copilot-gateway.ts`
  基于 `CopilotClient` / `CopilotSession` 的默认实现。
- `src/copilot/session-event-buffer.ts`
  汇总事件、消息和统计信息。

### 5.3 命令层

- `src/commands/catalog.ts`
  命令清单、别名、策略类型。
- `src/commands/router.ts`
  将用户输入路由到本地命令、SDK 命令、透传命令。
- `src/commands/handlers/*.ts`
  本地命令实现。

### 5.4 应用服务层

- `src/services/session-service.ts`
  新建、恢复、切换、清空会话。
- `src/services/config-service.ts`
  读取和保存本地配置。
- `src/services/permission-service.ts`
  实现 `allow-all`、允许目录、工具审批策略。
- `src/services/usage-service.ts`
  聚合会话级别 usage 和历史摘要。

### 5.5 基础设施层

- `src/storage/config-store.ts`
  本地 JSON 配置存储。
- `src/storage/path-utils.ts`
  目录归一化、路径校验。
- `src/ui/repl.ts`
  readline REPL。
- `src/ui/renderer.ts`
  统一输出。

## 6. 命令兼容架构

所有命令都会在注册表中声明 `strategy`，由路由器决定执行方式。

### 6.1 `local` 本地命令

这些命令需要直接影响 `code-cli` 自己的进程或本地状态：

- `/help`
- `/exit`、`/quit`
- `/clear`、`/new`
- `/cwd`、`/cd`
- `/add-dir`
- `/list-dirs`
- `/allow-all`、`/yolo`
- `/reset-allowed-tools`
- `/resume`
- `/session`
- `/usage`

### 6.2 `sdk` SDK 直连命令

这些命令优先调用 SDK 暴露的方法，避免把“管理操作”转成 prompt：

- `/model`、`/models`
- `/resume`
- `/session`
- `/usage`
- `/user show`

### 6.3 `delegate` 会话透传命令

这些命令保持原始字符串，直接发送到 Copilot 会话：

- `/agent`
- `/compact`
- `/context`
- `/delegate`
- `/diff`
- `/experimental`
- `/feedback`
- `/fleet`
- `/ide`
- `/init`
- `/login`
- `/logout`
- `/lsp`
- `/mcp`
- `/plan`
- `/plugin`
- `/rename`
- `/review`
- `/share`
- `/skills`
- `/terminal-setup`
- `/theme`
- `/user list`
- `/user switch`

### 6.4 `chat` 普通消息

非斜杠输入按普通 prompt 发送到当前会话。

## 7. 交互流程

### 7.1 启动

1. 读取本地配置。
2. 创建 `CopilotClient`。
3. 根据启动参数恢复最近会话或创建新会话。
4. 订阅会话事件。
5. 进入 REPL。

### 7.2 输入处理

1. 读取用户输入。
2. 若匹配斜杠命令，则交给 `CommandRouter`。
3. 若为普通文本，则作为聊天 prompt 发送。
4. 输出 assistant 消息、工具调用和错误摘要。

### 7.3 会话切换

1. 当前会话保留在 SDK / CLI 工作区中。
2. 本地仅更新 `activeSessionId`。
3. 恢复时重新注入权限处理器、hooks、工具白名单等运行时配置。

## 8. 本地持久化设计

默认存储位置：`~/.code-cli/config.json`

建议结构：

```json
{
  "model": "gpt-5",
  "workingDirectory": "/abs/path",
  "activeSessionId": "session-id",
  "recentSessionIds": ["session-id"],
  "allowAll": false,
  "allowedDirectories": ["/abs/path"],
  "allowedTools": [],
  "theme": "auto"
}
```

## 9. 权限模型

- 默认不启用 `allow-all`。
- 当请求是文件读写时，仅允许访问工作目录和显式添加的允许目录。
- `/allow-all` 和 `/yolo` 会切换为全量放行模式。
- `/reset-allowed-tools` 会清空本地工具授权状态并恢复默认审批策略。
- 无法安全自动批准的请求，返回拒绝结果，而不是静默放行。

## 10. 测试策略

### 10.1 单元测试

- 命令注册表是否覆盖参考文档中的全部命令
- 路由器是否正确选择 `local` / `sdk` / `delegate` / `chat`
- 权限策略是否正确处理允许目录和 `allow-all`
- 配置存储是否可序列化与恢复

### 10.2 服务级测试

- 会话创建、恢复、清理流程
- 模型切换是否会创建新会话并更新配置
- `delegate` 命令是否把原始斜杠字符串透传给会话
- `/session`、`/usage` 是否返回结构化结果

### 10.3 兼容性测试

- 使用功能矩阵逐项校验命令注册表
- 确保每个别名都能解析到主命令
- 确保所有“透传命令”不会被本地意外拦截或改写

## 11. 交付顺序

1. 架构文档与 todo
2. TypeScript CLI 骨架与依赖初始化
3. 配置层与 SDK 适配层
4. 命令注册表与路由器
5. REPL 和输出层
6. 测试与文档回填

## 12. 成功标准

- 可以通过 `npm run dev` 或构建后的二进制启动交互式 CLI。
- 支持参考文档中的全部命令入口。
- 本地命令、SDK 命令和透传命令职责明确。
- 自动化测试覆盖命令矩阵、权限策略和核心会话流程。
- 文档说明哪些能力由 SDK 直连，哪些能力通过透传复用 Copilot CLI。

## 13. 当前实现状态

当前仓库已经完成以下实现：

- TypeScript CLI 工程初始化完成，依赖 `@github/copilot-sdk`、`commander`、`picocolors`、`vitest`。
- 交互式 REPL 已实现，默认命令入口为 `code-cli`。
- `ConfigService`、`PermissionService`、`SessionService`、`SdkCopilotGateway` 已落地。
- 命令注册表已覆盖参考文档中的全部命令入口与别名。
- `/help`、`/cwd`、`/add-dir`、`/list-dirs`、`/allow-all`、`/reset-allowed-tools` 已本地实现。
- `/model`、`/models`、`/resume`、`/session`、`/usage`、`/user show` 已通过 SDK 直连实现。
- 其余命令以原始斜杠字符串透传到 Copilot 会话，最大化复用 Copilot CLI 现有行为。
- 测试已覆盖命令目录、权限策略、会话服务和命令路由。

## 14. 当前边界

- 本项目刻意避免重写 Copilot CLI 内部 TUI，因此输出是轻量 REPL，而不是原生 Copilot CLI 的全屏终端界面。
- 透传命令的最终行为取决于底层 Copilot CLI / SDK runtime 的支持边界。
- 权限策略默认偏保守：文件读写限制在工作目录和允许目录内，其他工具默认需要用户通过 `/allow-all` 打开。
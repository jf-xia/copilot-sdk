# Code CLI

`code-cli` 是一个基于 `@github/copilot-sdk` 构建的兼容式 CLI 外壳。它不重写 Copilot CLI 的 agent runtime，而是通过 SDK 直接复用底层 Copilot CLI 的 JSON-RPC 会话能力，并在外层补上命令路由、权限策略、本地配置和测试体系。

之所以使用 `code-cli` 作为命令名，而不是直接使用 `code`，是为了避免和 VS Code 自带的 `code` 命令冲突。

## 目标

- 尽可能复用 Copilot CLI，减少重复实现。
- 提供与参考文档一致的斜杠命令入口。
- 把“本地命令 / SDK 命令 / 透传命令”分层清楚，保证可测试性。

## 当前能力

### 本地实现命令

- `/help`
- `/exit`、`/quit`
- `/clear`、`/new`
- `/cwd`、`/cd`
- `/add-dir`
- `/list-dirs`
- `/allow-all`、`/yolo`
- `/reset-allowed-tools`

### SDK 直连命令

- `/model`、`/models`
- `/resume`
- `/session` 的 `files`、`plan`、`checkpoints`
- `/usage`
- `/user show`

### 透传命令

其余命令保持原始字符串不变，直接发送到 Copilot 会话，从而复用底层 Copilot CLI 的行为。例如：

- `/agent`
- `/compact`
- `/context`
- `/delegate`
- `/diff`
- `/fleet`
- `/lsp`
- `/mcp`
- `/plan`
- `/plugin`
- `/review`
- `/share`
- `/skills`
- `/theme`

其中 `/skills` 已通过自动化测试验证：`CommandRouter` 不会在本地重写其语义，而是将完整输入原样交给底层 Copilot 会话处理。

## 项目结构

```text
src/
  app.ts
  cli.ts
  index.ts
  commands/
  copilot/
  services/
  storage/
  ui/
tests/
docs/
```

关键模块：

- `src/copilot/sdk-copilot-gateway.ts`：封装 `CopilotClient` / `CopilotSession`
- `src/services/session-service.ts`：会话生命周期、workspace 读取、模型切换
- `src/services/permission-service.ts`：本地权限决策
- `src/commands/router.ts`：命令分流
- `src/commands/catalog.ts`：命令目录和帮助文本

## 开发

安装依赖：

```bash
npm install
```

开发运行：

```bash
npm run dev
```

发送单条 prompt 或斜杠命令：

```bash
npm run dev -- --prompt "/help"
```

构建：

```bash
npm run build
```

测试：

```bash
npm test
npm run typecheck
```

## 验证状态

当前仓库已经通过：

- `npm test`
- `npm run typecheck`

`/skills` 的透传回归测试位于 `tests/router.spec.ts`，用于确认带子命令、带引号参数和额外选项的输入会被原样发送到底层会话。

## 参考文档

- `copilot-cli.md`：Copilot CLI 命令参考
- `docs/architecture.md`：架构设计
- `docs/command-matrix.md`：命令兼容矩阵
- `docs/todo.md`：交付清单

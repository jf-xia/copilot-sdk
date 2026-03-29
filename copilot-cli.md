# GitHub Copilot CLI 命令参考

查找有助于你有效使用 Copilot 命令行界面（CLI） 的命令和键盘快捷键。
|

## 交互式接口中的斜杠命令

| 命令            | Purpose                          |
| --------------- | -------------------------------- |
| `/add-dir PATH` | 将目录添加到允许的文件访问列表。 |
| `/agent`        | 浏览并选择可用代理（如果有）。   |
|                 |                                  |

```
          `/allow-all`、`/yolo`                               | 启用所有权限（工具、路径和 URL）。 |
```

|
`/clear`、`/new` | 清除对话历史记录。 |
\| `/compact` | 汇总对话历史记录以减少上下文窗口使用情况。 |
\| `/context` | 显示上下文窗口令牌使用情况和可视化效果。 |
|
`/cwd`、`/cd [PATH]` | 更改工作目录或显示当前目录。 |
\| `/delegate [PROMPT]` | 使用 AI 生成的拉取请求提交更改到远程存储库。 |
\| `/diff` | 查看当前目录中所做的更改。 |
|
`/exit`、`/quit` | 退出 CLI。 |
\| `/experimental [on\|off]` | 切换或打开/关闭实验功能。 |
\| `/feedback` | 提供有关 CLI 的反馈。 |
\| `/fleet [PROMPT]` | 支持对任务的某些部分进行并行子代理执行。 请参阅“[使用 \`/fleet\` 命令并行运行任务](/zh/copilot/concepts/agents/copilot-cli/fleet)”。 |
\| `/help` | 显示交互式命令的帮助。 |
\| `/ide` | 连接到 IDE 工作区。 |
\| `/init` | 为此存储库初始化 Copilot 自定义指令和智能体功能。 |
\| `/list-dirs` | 显示允许访问文件的所有目录。 |
\| `/login` | 登录 Copilot。 |
\| `/logout` | 退出 Copilot。 |
\| `/lsp [show\|test\|reload\|help] [SERVER-NAME]` | 管理语言服务器配置。 |
\| `/mcp [show\|add\|edit\|delete\|disable\|enable] [SERVER-NAME]` | 管理 MCP 服务器配置。 |
|
`/model`、`/models [MODEL]` | 选择要使用的 AI 模型。 |
\| `/plan [PROMPT]` | 在编码之前创建实现计划。 |
\| `/plugin [marketplace\|install\|uninstall\|update\|list] [ARGS...]` | 管理插件和插件市场。 |
\| `/rename NAME` | 重命名当前会话（`/session rename` 的别名）。 |
\| `/reset-allowed-tools` | 重置允许的工具列表。 |
\| `/resume [SESSION-ID]` | 通过从列表中选择（可选指定会话 ID）切换到其他会话。 |
\| `/review [PROMPT]` | 运行代码评审代理以分析更改。 |
\| `/session [checkpoints [n]\|files\|plan\|rename NAME]` | 显示会话信息和工作区摘要。 请使用子命令查看详细信息。 |
\| `/share [file\|gist] [PATH]` | 将会话共享到 Markdown 文件或 GitHub Gist。 |
\| `/skills [list\|info\|add\|remove\|reload] [ARGS...]` | 管理技能以提升能力。 |
\| `/terminal-setup` | 为多行输入支持配置终端（<kbd>Shift</kbd>+<kbd>Enter</kbd> 和 <kbd>Ctrl</kbd>+<kbd>Enter</kbd>）。 |
\| `/theme [show\|set\|list] [auto\|THEME-ID]` | 查看或配置终端主题。 |
\| `/usage` | 显示会话使用情况指标和统计信息。 |
\| `/user [show\|list\|switch]` | 管理当前 GitHub 用户。 |

## 工具

### Shell 工具

| 工具名称                          | 说明                    |
| --------------------------------- | ----------------------- |
| `bash` / `powershell`             | 执行命令                |
| `read_bash` / `read_powershell`   | 从 shell 会话中读取输出 |
| `write_bash` / `write_powershell` | 将输入发送到 shell 会话 |
| `stop_bash` / `stop_powershell`   | 终止 shell 会话         |
| `list_bash` / `list_powershell`   | 列出活动 shell 会话     |

### 文件操作工具

| 工具名称      | 说明                                                         |
| ------------- | ------------------------------------------------------------ |
| `view`        | 读取文件或目录                                               |
| `create`      | 创建新文件                                                   |
| `edit`        | 通过字符串替换编辑文件                                       |
| `apply_patch` | 应用修补程序（某些模型使用修补程序，而不是 `edit`/`create`） |

### 代理和任务委派工具

| 工具名称      | 说明             |
| ------------- | ---------------- |
| `task`        | 运行子代理       |
| `read_agent`  | 检查后台代理状态 |
| `list_agents` | 列出可用的代理   |

### 其他工具

| 工具名称 | 说明 |
| -------- | ---- |
|          |      |

```
          `grep`（或 `rg`） | 搜索文件中的文本 |
```

\| `glob` | 查找匹配模式的文件 |
\| `web_fetch` | 提取和分析 Web 内容 |
\| `skill` | 调用自定义技能 |
\| `ask_user` | 向用户提问 |
\| `report_intent` | 报告代理计划执行的操作 |
\| `show_file` | 突出显示文件 |
\| `fetch_copilot_cli_documentation` | 查阅 CLI 文档 |
\| `update_todo` | 更新任务清单 |
\| `store_memory` | 跨会话保存事实 |
\| `task_complete` | 信号任务已完成（仅限 Autopilot）。 |
\| `exit_plan_mode` | 退出计划模式 |
\| `sql` | 查询会话数据（实验性） |
\| `lsp` | 语言服务器重构（实验性） |

## 工具权限模式 默认allow-all-tool

```shell
# Allow all git commands except git push
copilot --allow-tool='shell(git:*)' --deny-tool='shell(git push)'

# Allow a specific MCP server tool
copilot --allow-tool='MyMCP(create_issue)'

# Allow all tools from a server
copilot --allow-tool='MyMCP'
```

## 环境变量

| Variable                            | 说明                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `COPILOT_MODEL`                     | 设置 AI 模型。                                                                              |
| `COPILOT_ALLOW_ALL`                 | 将其设置为 `true` 以自动允许所有权限（相当于 `--allow-all`）。                              |
| `COPILOT_AUTO_UPDATE`               | 设置为 `false` 禁用自动更新。                                                               |
| `COPILOT_CUSTOM_INSTRUCTIONS_DIRS`  | 自定义说明中额外目录的逗号分隔列表。                                                        |
| `COPILOT_SKILLS_DIRS`               | 技能附加目录的逗号分隔列表。                                                                |
| `COPILOT_EDITOR`                    | 用于交互式编辑的编辑器命令（在 `$VISUAL` 和 `$EDITOR` 后检查）。 如果未设置，则默认为`vi`。 |
| `COPILOT_GITHUB_TOKEN`              | 身份验证令牌。 优先于 `GH_TOKEN` 和 `GITHUB_TOKEN`。                                        |
| `COPILOT_HOME`                      | 覆盖配置和状态目录。 默认值：`$HOME/.copilot`。                                             |
| `GH_TOKEN`                          | 身份验证令牌。 优先于 `GITHUB_TOKEN`.                                                       |
| `GITHUB_TOKEN`                      | 身份验证令牌。                                                                              |
| `USE_BUILTIN_RIPGREP`               | 设置为 `false` 以使用系统 ripgrep，而不是捆绑的版本。                                       |
| `PLAIN_DIFF`                        | 设置为 `true` 以禁用多差异呈现。                                                            |
| `COLORFGBG`                         | 适用于深色/浅色终端背景检测的回退。                                                         |
| `COPILOT_CLI_ENABLED_FEATURE_FLAGS` | 要启用的功能标志（例如 `"SOME_FEATURE,SOME_OTHER_FEATURE"`）的逗号分隔列表。                |

## 配置文件设置

| Scope  | 位置                                  | Purpose                                                             |
| ------ | ------------------------------------- | ------------------------------------------------------------------- |
| 资料库 | `.github/copilot/settings.json`       | 共享存储库配置（提交到存储库）。                                    |

### 存储库设置 （`.github/copilot/settings.json`）

存储库设置适用于在存储库中工作的每个人。 存储库级别仅支持一部分设置。 忽略不受支持的密钥。

| 密钥                     | 类型                      | 合并行为                          | 说明                                               |                                           |
| ------------------------ | ------------------------- | --------------------------------- | -------------------------------------------------- | ----------------------------------------- |
| `companyAnnouncements`   | `string[]`                | 已替换 — 存储库优先               | 启动时随机显示的消息。                             |                                           |
| `enabledPlugins`         | `Record<string, boolean>` | 已合并 — 存储库覆盖用户的相同密钥 | 声明性插件自动安装。                               |                                           |
| `extraKnownMarketplaces` | `Record<string, {...}>`   | 已合并 — 存储库覆盖用户的相同密钥 | 此存储库中提供的插件市场。                         |                                           |
| `marketplaces`           | `Record<string, {...}>`   | 已合并 — 存储库覆盖用户的相同密钥 | 插件市场（已弃用—使用 `extraKnownMarketplaces`）。 | <!-- markdownlint-disable-line GHD046 --> |

## 挂钩引用

挂钩是在会话期间的特定生命周期点执行的外部命令，可用于自定义自动化、安全控制和集成。 系统会自动从存储库的 `.github/hooks/*.json` 中加载挂钩配置文件。

### 钩子配置格式

挂钩配置文件使用 JSON 格式和版本 `1`。

#### 命令挂钩

命令挂钩运行 shell 脚本，在所有挂钩类型上都受支持。

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "bash": "your-bash-command",
        "powershell": "your-powershell-command",
        "cwd": "optional/working/directory",
        "env": { "VAR": "value" },
        "timeoutSec": 30
      }
    ]
  }
}
```

| 领域         | 类型        | 必需                         | 说明                                             |
| ------------ | ----------- | ---------------------------- | ------------------------------------------------ |
| `type`       | `"command"` | 是的                         | 必须是 `"command"`。                             |
| `bash`       | 字符串      | 其中一个 `bash`/`powershell` | Unix 的 Shell 命令。                             |
| `powershell` | 字符串      | 其中一个 `bash`/`powershell` | 适用于 Windows 的 Shell 命令。                   |
| `cwd`        | 字符串      | 否                           | 命令的工作目录（相对于存储库根目录或绝对目录）。 |
| `env`        | 对象        | 否                           | 要设置的环境变量（支持变量扩展）。               |
| `timeoutSec` | 数字        | 否                           | 超时（以秒为单位）。 默认值：`30`。              |

#### 提示挂钩

提示挂钩自动提交文本，就像用户键入文本一样。 它们仅在 `sessionStart` 上受支持，并在通过 `--prompt` 传递的任何初始提示之前运行。 文本可以是自然语言提示或斜杠命令。

```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [
      {
        "type": "prompt",
        "prompt": "Your prompt text or /slash-command"
      }
    ]
  }
}
```

| 领域     | 类型       | 必需 | 说明                                       |
| -------- | ---------- | ---- | ------------------------------------------ |
| `type`   | `"prompt"` | 是的 | 必须是 `"prompt"`。                        |
| `prompt` | 字符串     | 是的 | 要提交的文本可以是自然语言消息或斜杠命令。 |

### 挂钩事件

| 事件                  | 在以下情况下触发         | 已处理的输出                |
| --------------------- | ------------------------ | --------------------------- |
| `sessionStart`        | 新的或已恢复的会话开始。 | 否                          |
| `sessionEnd`          | 会话终止。               | 否                          |
| `userPromptSubmitted` | 用户提交提示。           | 否                          |
| `preToolUse`          | 在每个工具执行之前。     | 是 — 可以允许、拒绝或修改。 |
| `postToolUse`         | 在每个工具完成后。       | 否                          |
| `agentStop`           | 主要代理完成一回合。     | 是 — 可以阻止和强制继续。   |
| `subagentStop`        | 子代理完成。             | 是 — 可以阻止和强制继续。   |
| `errorOccurred`       | 执行期间发生错误。       | 否                          |

###

```
          `preToolUse` 决策控制
```

挂钩 `preToolUse` 可以通过将 JSON 对象写入 stdout 来控制工具执行。

| 领域                 | 价值观 | 说明 |
| -------------------- | ------ | ---- |
| `permissionDecision` |        |      |

```
          `"allow"`、`"deny"`、`"ask"` | 工具是否已执行? 空输出使用默认行为。 |
```

\| `permissionDecisionReason` | 字符串 | 向代理显示的原因。 决策为 `"deny"` 时需要。 |
\| `modifiedArgs` | 对象 | 要使用的替代工具参数，而不是使用原始参数。 |

###

```
          `agentStop`
           /
          `subagentStop` 决策控制
```

| 领域       | 价值观 | 说明 |
| ---------- | ------ | ---- |
| `decision` |        |      |

```
          `"block"`、`"allow"` |
          `"block"` 强制另一个代理回合将 `reason` 用作提示。 |
```

\| `reason` | 字符串 | 当`decision`是`"block"`时，提示下一轮。 |

### 挂钩匹配工具名称

| 工具名称     | 说明                         |
| ------------ | ---------------------------- |
| `bash`       | 执行 shell 命令（Unix）。    |
| `powershell` | 执行 shell 命令（Windows）。 |
| `view`       | 读取文件内容。               |
| `edit`       | 修改文件内容。               |
| `create`     | 创建新文件。                 |
| `glob`       | 按模式查找文件。             |
| `grep`       | 搜索文件内容。               |
| `web_fetch`  | 抓取网页。                   |
| `task`       | 运行子代理任务。             |

如果配置了同一类型的多个挂钩，则它们按顺序执行。 对于 `preToolUse`，如果有挂钩返回 `"deny"`，则该工具会被阻止。 系统会记录并跳过挂钩故障（非零退出代码或超时）- 它们绝不会阻止代理执行。

## 技能指南

技能是可扩展 CLI 功能的 Markdown 文件。 每个技能都位于其自己的目录中，其中包含一个 `SKILL.md` 文件。 调用（通过 `/SKILL-NAME` 或自动由代理调用）时，技能的内容将注入到会话中。

### 技能前页字段

| 领域                       | 类型                | 必需 | 说明                                                                                 |
| -------------------------- | ------------------- | ---- | ------------------------------------------------------------------------------------ |
| `name`                     | 字符串              | 是的 | 技能的唯一标识符。 仅字母、数字和连字符。 最多 64 个字符。                           |
| `description`              | 字符串              | 是的 | 技能的作用以及何时使用它。 最多 1024 个字符。                                        |
| `allowed-tools`            | String 或 String\[] | 否   | 技能处于活动状态时自动允许的工具的逗号分隔列表或 YAML 数组。 将 `"*"` 用于所有工具。 |
| `user-invocable`           | 布尔                | 否   | 用户是否可以使用 `/SKILL-NAME` 调用技能。 默认值：`true`。                           |
| `disable-model-invocation` | 布尔                | 否   | 阻止代理自动调用此技能。 默认值：`false`。                                           |

### 技能位置

系统将按照优先顺序从这些位置加载技能（对于重复名称，以首次找到项为准）。

| 位置                  | Scope  | 说明                           |
| --------------------- | ------ | ------------------------------ |
| `.github/skills/`     | 项目   | 特定于项目的技能。             |
| `.agents/skills/`     | 项目   | 替代项目位置。                 |
| `.claude/skills/`     | 项目   | 与 Claude 兼容的位置。         |
| 父 `.github/skills/`  | 继承   | Monorepo 父目录支持。          |
| `~/.copilot/skills/`  | 个人   | 适用于所有项目的个人技能。     |
| `~/.claude/skills/`   | 个人   | 与 Claude 兼容的个人定位设置。 |
| 插件目录              | 插件   | 已安装插件中的技能。           |
| `COPILOT_SKILLS_DIRS` | 自定义 | 其他目录（逗号分隔）。         |

### 命令（可选技能格式）

命令是 `.md` 中存储为单个 `.claude/commands/` 文件的技能的替代项。 命令名称派生自文件名。 命令文件使用简化的格式（不需要 `name` 字段）和支持 `description`， `allowed-tools`以及 `disable-model-invocation`。 命令的优先级低于具有相同名称的技能。

## 自定义代理参考

自定义代理是在 Markdown 文件中定义的专用 AI 代理。 文件名（减扩展名）将成为代理 ID。 使用 `.agent.md` 或 `.md` 用作文件扩展名。

### 内置代理

| 代理人            | 默认模型          | 说明                                                                                             |
| ----------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| `code-review`     | claude-sonnet-4.5 | 高信噪比代码审查。 分析代码差异中的缺陷、安全问题和逻辑错误。                                    |
| `explore`         | claude-haiku-4.5  | 快速代码库浏览。 搜索文件、读取代码和回答问题。 提供不超过300字的简明答案。 可以安全地并行运行。 |
| `general-purpose` | claude-sonnet-4.5 | 支持复杂多步骤任务的全功能代理。 在单独的上下文窗口中运行。                                      |
| `research`        | claude-sonnet-4.6 | 深度研究代理。 基于代码库、相关存储库和 Web 中的信息生成报表。                                   |
| `task`            | claude-haiku-4.5  | 命令执行（测试、构建、代码检查）。 成功时返回简要摘要，失败时返回全部输出。                      |

### 自定义代理程序前端字段

| 领域          | 类型      | 必需 | 说明                                                                 |
| ------------- | --------- | ---- | -------------------------------------------------------------------- |
| `description` | 字符串    | 是的 | 说明显示在代理列表和`task` 工具中。                                  |
| `infer`       | 布尔      | 否   | 允许主代理自动委派。 默认值：`true`。                                |
| `model`       | 字符串    | 否   | 此代理的 AI 模型。 未设置时，继承外部代理的模型。                    |
| `name`        | 字符串    | 否   | 显示名称。 默认为文件名。                                            |
| `tools`       | 字符串\[] | 否   | 代理可用的工具。 默认值： `["*"]` （所有工具）。                     |

### 自定义代理位置

| Scope | 位置 |
| ----- | ---- |
| 项目  |      |

```
          `.github/agents/` 或 `.claude/agents/` |
```

\| 用户 |
`~/.copilot/agents/` 或 `~/.claude/agents/` |
\| 插件 | `<plugin>/agents/` |

项目级代理优先于用户级代理。 插件代理的优先级最低。

## 权限审批结果

默认使用 AUTOPILOT_MODE

| Flag                | 级             | 说明                         |
| ------------------- | -------------- | ---------------------------- |
| `AUTOPILOT_MODE`    | `experimental` | 自动运行模式。               |
| `BACKGROUND_AGENTS` | `staff`        | 在后台运行代理。             |
| `QUEUED_COMMANDS`   | `staff`        | 在代理正在运行时将命令排队。 |
| `LSP_TOOLS`         | `on`           | 语言服务器协议工具。         |
| `PLAN_COMMAND`      | `on`           | 交互式规划模式。             |
| `AGENTIC_MEMORY`    | `on`           | 跨会话的持久内存。           |
| `CUSTOM_AGENTS`     | `on`           | 自定义代理定义。             |

## OpenTelemetry 监视

Copilot 命令行界面（CLI） 可以通过 [OpenTelemetry](https://opentelemetry.io/) (OTel) 导出跟踪和指标，使你可以查看代理交互、LLM 调用、工具执行和令牌使用情况。 所有信号名称和属性都遵循 [OTel GenAI 语义约定](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/gen-ai/)。

默认情况下，OTel 处于关闭状态，开销为零。 当满足以下任一条件时，它将激活：

- `COPILOT_OTEL_ENABLED=true`
- ```
          `OTEL_EXPORTER_OTLP_ENDPOINT` 已设置
  ```
- ```
          `COPILOT_OTEL_FILE_EXPORTER_PATH` 已设置
  ```

### OTel 环境变量

| Variable                                             | 默认             | 说明                                                                                             |
| ---------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| `COPILOT_OTEL_ENABLED`                               | `false`          | 显式启用 OTel。 如果 `OTEL_EXPORTER_OTLP_ENDPOINT` 已设置，则不是必需的。                        |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                        | —                | OTLP 终结点 URL。 设置此项会自动启用 OTel。                                                      |
| `COPILOT_OTEL_EXPORTER_TYPE`                         | `otlp-http`      | 导出程序类型： `otlp-http` 或 `file`。 当设置`file`时自动选择`COPILOT_OTEL_FILE_EXPORTER_PATH`。 |
| `OTEL_SERVICE_NAME`                                  | `github-copilot` | 资源属性中的服务名称。                                                                           |
| `OTEL_RESOURCE_ATTRIBUTES`                           | —                | 逗号分隔的 `key=value` 对的额外资源属性。 对特殊字符使用百分比编码。                             |
| `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` | `false`          | 捕获完整的提示和响应内容。 请参阅 [内容捕获](#content-capture)。                                 |
| `OTEL_LOG_LEVEL`                                     | —                | OTel 诊断日志级别：`NONE`、、`ERROR``WARN`、`INFO``DEBUG`、`VERBOSE`。 `ALL`                     |
| `COPILOT_OTEL_FILE_EXPORTER_PATH`                    | —                | 将所有信号作为 JSON 行写入此文件。 设置此项会自动启用 OTel。                                     |
| `COPILOT_OTEL_SOURCE_NAME`                           | `github.copilot` | 用于跟踪程序和计量的检测范围名称。                                                               |
| `OTEL_EXPORTER_OTLP_HEADERS`                         | —                | OTLP 导出器（例如 `Authorization=Bearer token`）的身份验证头。                                   |

### Traces

运行时为每个智能体交互发出分层跨度树。 每个树都包含根`invoke_agent`范围，以及`chat``execute_tool`子范围。

####

```
          `invoke_agent` span 属性
```

包装整个智能体调用：一个用户消息的所有 LLM 调用和工具执行。 范围类型： `CLIENT`.

| Attribute                        | 说明                                |
| -------------------------------- | ----------------------------------- |
| `gen_ai.operation.name`          | `invoke_agent`                      |
| `gen_ai.provider.name`           | 提供者（例如`github`、`anthropic`） |
| `gen_ai.agent.id`                | 会话标识符                          |
| `gen_ai.agent.name`              | 代理名称（仅限子代理）              |
| `gen_ai.agent.description`       | 代理说明（仅限子代理）              |
| `gen_ai.agent.version`           | 运行时版本                          |
| `gen_ai.conversation.id`         | 会话标识符                          |
| `gen_ai.request.model`           | 请求的模型                          |
| `gen_ai.response.model`          | 已解析的模型                        |
| `gen_ai.response.id`             | 上次响应 ID                         |
| `gen_ai.response.finish_reasons` |                                     |

```
          `["stop"]` 或 `["error"]` |
```

\| `gen_ai.usage.input_tokens` | 总输入令牌数（所有轮次） |
\| `gen_ai.usage.output_tokens` | 总输出标记（所有轮次） |
\| `gen_ai.usage.cache_read.input_tokens` | 读取缓存的输入令牌 |
\| `gen_ai.usage.cache_creation.input_tokens` | 创建的缓存输入令牌 |
\| `github.copilot.turn_count` | LLM 往返次数 |
\| `github.copilot.cost` | 货币成本 |
\| `github.copilot.aiu` | AI 单元消耗 |
\| `server.address` | 服务器主机名 |
\| `server.port` | 服务器端口 |
\| `error.type` | 错误类名称（出错时） |
\| `gen_ai.input.messages` | 完整输入消息作为 JSON 格式（仅限内容捕获） |
\| `gen_ai.output.messages` | JSON格式的完整输出消息（仅用于捕获内容） |
\| `gen_ai.system_instructions` | JSON 格式的系统提示内容（仅限内容捕获） |
\| `gen_ai.tool.definitions` | 工具模式为 JSON（仅内容捕获） |

####

```
          `chat` span 属性
```

每个 LLM 请求一个跨度。 范围类型： `CLIENT`.

| Attribute                                  | 说明                                    |
| ------------------------------------------ | --------------------------------------- |
| `gen_ai.operation.name`                    | `chat`                                  |
| `gen_ai.provider.name`                     | 提供者名称                              |
| `gen_ai.request.model`                     | 请求的模型                              |
| `gen_ai.conversation.id`                   | 会话标识符                              |
| `gen_ai.response.id`                       | 响应 ID                                 |
| `gen_ai.response.model`                    | 已解析的模型                            |
| `gen_ai.response.finish_reasons`           | 停止原因                                |
| `gen_ai.usage.input_tokens`                | 此轮次输入令牌                          |
| `gen_ai.usage.output_tokens`               | 此轮次输出令牌                          |
| `gen_ai.usage.cache_read.input_tokens`     | 读取缓存令牌                            |
| `gen_ai.usage.cache_creation.input_tokens` | 创建的缓存令牌                          |
| `github.copilot.cost`                      | 轮次成本                                |
| `github.copilot.aiu`                       | AI 单元消耗当前回合                     |
| `github.copilot.server_duration`           | 服务器端持续时间                        |
| `github.copilot.initiator`                 | 请求发起者                              |
| `github.copilot.turn_id`                   | 轮次标识符                              |
| `github.copilot.interaction_id`            | 交互标识符                              |
| `server.address`                           | 服务器主机名                            |
| `server.port`                              | 服务器端口                              |
| `error.type`                               | 错误类名称（出错时）                    |
| `gen_ai.input.messages`                    | JSON 格式的完整提示消息（仅限内容捕获） |
| `gen_ai.output.messages`                   | JSON 形式的完整响应消息（仅内容捕获）   |
| `gen_ai.system_instructions`               | JSON 格式的系统提示内容（仅限内容捕获） |

####

```
          `execute_tool` span 属性
```

为每个工具调用指定一个跨度。 范围类型： `INTERNAL`.

| Attribute                    | 说明                                   |
| ---------------------------- | -------------------------------------- |
| `gen_ai.operation.name`      | `execute_tool`                         |
| `gen_ai.provider.name`       | 提供程序名称（如果可用）               |
| `gen_ai.tool.name`           | 工具名称（例如， `readFile`）          |
| `gen_ai.tool.type`           | `function`                             |
| `gen_ai.tool.call.id`        | 工具调用标识符                         |
| `gen_ai.tool.description`    | 工具说明                               |
| `error.type`                 | 错误类名称（出错时）                   |
| `gen_ai.tool.call.arguments` | 工具输入参数以 JSON 格式（仅内容捕获） |
| `gen_ai.tool.call.result`    | 工具输出为 JSON（仅限内容捕获）        |

### Metrics

#### GenAI 约定指标

| Metric                                          | 类型   | 单位   | 说明                                      |
| ----------------------------------------------- | ------ | ------ | ----------------------------------------- |
| `gen_ai.client.operation.duration`              | 直方图 | s      | LLM API 调用和代理调用持续时间            |
| `gen_ai.client.token.usage`                     | 直方图 | tokens | 按类型排序的令牌计数 （`input`/`output`） |
| `gen_ai.client.operation.time_to_first_chunk`   | 直方图 | s      | 接收第一个流媒体数据块的时间              |
| `gen_ai.client.operation.time_per_output_chunk` | 直方图 | s      | 第一个区块后的区块间延迟                  |

#### 特定于供应商的指标

| Metric                              | 类型    | 单位  | 说明                                          |
| ----------------------------------- | ------- | ----- | --------------------------------------------- |
| `github.copilot.tool.call.count`    | Counter | calls | 通过 `gen_ai.tool.name` 和 `success` 调用工具 |
| `github.copilot.tool.call.duration` | 直方图  | s     | 工具执行由 `gen_ai.tool.name` 产生的延迟      |
| `github.copilot.agent.turn.count`   | 直方图  | 轮次  | 每个代理调用的 LLM 往返次数                   |

### 跨度事件

在活动 `chat` 或 `invoke_agent` 跨度上记录的生命周期事件。

| 事件                                | 说明               | 密钥属性 |
| ----------------------------------- | ------------------ | -------- |
| `github.copilot.session.truncation` | 对话历史记录被截断 |          |

```
          `github.copilot.token_limit`、`github.copilot.pre_tokens`、`github.copilot.post_tokens`、`github.copilot.tokens_removed`、`github.copilot.messages_removed` |
```

\| `github.copilot.session.compaction_start` | 历史压缩开始 | 没有 |
\| `github.copilot.session.compaction_complete` | 已完成历史记录压缩 |
`github.copilot.success`、`github.copilot.pre_tokens`、`github.copilot.post_tokens`、`github.copilot.tokens_removed`、`github.copilot.messages_removed` |
\| `github.copilot.skill.invoked` | 调用了技能 |
`github.copilot.skill.name`、`github.copilot.skill.path`、`github.copilot.skill.plugin_name`、`github.copilot.skill.plugin_version` |
\| `github.copilot.session.shutdown` | 会话正在关闭 |
`github.copilot.shutdown_type`、`github.copilot.total_premium_requests`、`github.copilot.lines_added`、`github.copilot.lines_removed`、`github.copilot.files_modified_count` |
\| `github.copilot.session.abort` | 用户取消了当前操作 | `github.copilot.abort_reason` |
\| `exception` | 会话错误 |
`github.copilot.error_type`、`github.copilot.error_status_code`、`github.copilot.error_provider_call_id` |

### 资源属性

所有信号都携带这些资源属性。

| Attribute      | 价值 |
| -------------- | ---- |
| `service.name` |      |

```
          `github-copilot` （可通过 `OTEL_SERVICE_NAME`） |
```

\| `service.version` | 运行时版本 |

### 内容捕获

默认情况下，不会捕获提示内容、响应或工具参数，仅捕获模型名称、令牌计数和持续时间等元数据。 若要捕获完整内容，请设置 `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true`。

> \[!WARNING]
> 内容捕获可能包括敏感信息，例如代码、文件内容和用户提示。 仅在受信任的环境中启用此功能。

启用内容捕获后，将填充以下属性。

| Attribute                    | Content               |
| ---------------------------- | --------------------- |
| `gen_ai.input.messages`      | 完整提示消息 （JSON） |
| `gen_ai.output.messages`     | 完整响应消息 （JSON） |
| `gen_ai.system_instructions` | 系统提示内容 （JSON） |
| `gen_ai.tool.definitions`    | 工具架构 （JSON）     |
| `gen_ai.tool.call.arguments` | 工具输入参数          |
| `gen_ai.tool.call.result`    | 工具输出结果          |

## 延伸阅读

- ```
          [AUTOTITLE](/copilot/how-tos/copilot-cli)
  ```
- ```
          [AUTOTITLE](/copilot/reference/copilot-cli-reference/cli-plugin-reference)
  ```
- ```
          [AUTOTITLE](/copilot/reference/copilot-cli-reference/cli-programmatic-reference)
  ```

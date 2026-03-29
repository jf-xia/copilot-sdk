# Code CLI 命令兼容矩阵

下表以 [copilot-cli.md](../copilot-cli.md) 为基准，定义 `code-cli` 的命令兼容策略。

| 命令 | 别名/参数 | 分类 | 实现策略 | 测试关注点 |
| --- | --- | --- | --- | --- |
| `/add-dir` | `PATH` | local | 更新允许目录列表 | 路径归一化、重复目录 |
| `/agent` |  | delegate | 透传到当前会话 | 原始输入不改写 |
| `/allow-all` | `/yolo` | local | 切换 `allowAll=true` | 状态持久化 |
| `/clear` | `/new` | local | 创建新会话并切换 | 新会话 ID、生效模型 |
| `/compact` |  | delegate | 透传到当前会话 | 原样发送 |
| `/context` |  | delegate | 透传到当前会话 | 原样发送 |
| `/cwd` | `/cd [PATH]` | local | 读取/切换工作目录 | 相对路径处理 |
| `/delegate` | `[PROMPT]` | delegate | 透传到当前会话 | 参数透传 |
| `/diff` |  | delegate | 透传到当前会话 | 原样发送 |
| `/exit` | `/quit` | local | 终止 REPL 并断开会话 | 安全退出 |
| `/experimental` | `[on\|off]` | delegate | 透传到当前会话 | 参数透传 |
| `/feedback` |  | delegate | 透传到当前会话 | 原样发送 |
| `/fleet` | `[PROMPT]` | delegate | 透传到当前会话 | 参数透传 |
| `/help` |  | local | 输出命令目录 | 帮助文本完整 |
| `/ide` |  | delegate | 透传到当前会话 | 原样发送 |
| `/init` |  | delegate | 透传到当前会话 | 原样发送 |
| `/list-dirs` |  | local | 列出允许目录 | 顺序稳定 |
| `/login` |  | delegate | 透传到当前会话 | 原样发送 |
| `/logout` |  | delegate | 透传到当前会话 | 原样发送 |
| `/lsp` | `[show\|test\|reload\|help] [SERVER-NAME]` | delegate | 透传到当前会话 | 多参数透传 |
| `/mcp` | `[show\|add\|edit\|delete\|disable\|enable] [SERVER-NAME]` | delegate | 透传到当前会话 | 多参数透传 |
| `/model` | `/models [MODEL]` | sdk | 读取模型或切换模型 | 新旧会话切换 |
| `/plan` | `[PROMPT]` | delegate | 透传到当前会话 | 参数透传 |
| `/plugin` | `[marketplace\|install\|uninstall\|update\|list] [ARGS...]` | delegate | 透传到当前会话 | 长参数透传 |
| `/rename` | `NAME` | delegate | 透传到当前会话 | 参数透传 |
| `/reset-allowed-tools` |  | local | 清空本地授权配置 | 状态重置 |
| `/resume` | `[SESSION-ID]` | sdk | 列出或恢复会话 | 最近会话、指定会话 |
| `/review` | `[PROMPT]` | delegate | 透传到当前会话 | 参数透传 |
| `/session` | `[checkpoints [n]\|files\|plan\|rename NAME]` | mixed | `rename` 透传，其余子命令本地/SDK 展示 | 计划文件、文件列表、rename 透传 |
| `/share` | `[file\|gist] [PATH]` | delegate | 透传到当前会话 | 参数透传 |
| `/skills` | `[list\|info\|add\|remove\|reload] [ARGS...]` | delegate | 透传到当前会话 | 长参数透传，保持原始字符串不改写 |
| `/terminal-setup` |  | delegate | 透传到当前会话 | 原样发送 |
| `/theme` | `[show\|set\|list] [auto\|THEME-ID]` | delegate | 透传到当前会话 | 参数透传 |
| `/usage` |  | sdk | 汇总当前会话统计 | 消息数、工具数 |
| `/user` | `[show\|list\|switch]` | mixed | `show` 走 SDK，`list/switch` 透传 | 子命令分流 |

## 当前实现结果

- 命令注册表已经覆盖表中全部命令入口。
- `local` 和 `sdk` 命令由 `CommandRouter` 做显式分流。
- `delegate` 和 `mixed` 的透传路径会保留原始命令字符串，不做语义改写。
- `/skills` 已有回归测试覆盖，验证其输入会经由统一 delegate 路径直接送入底层 Copilot 会话。
- 对于 SDK 没有直接公开管理 API 的场景，优先复用底层 Copilot 会话，而不是在本地重写一套逻辑。

## 说明

- `local`：由 `code-cli` 自己处理。
- `sdk`：优先调用 SDK 暴露的显式 API。
- `delegate`：保持原始命令字符串不变，透传给当前 Copilot 会话。
- `mixed`：同一主命令下不同子命令采用不同策略。

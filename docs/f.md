任务：修复 Copilot SDK 权限策略，确保 `/allow-all` 真的等价 approveAll，且当前仓库写 read path 不再被旧 config 阻断。

1. 打开 src/services/permission-service.ts：
   - 用 `import { approveAll }`；
   - `createHandler()`：当 `config.allowAll` 时返回 `approveAll(request, invocation)`；
   - `handlePermissionRequest()`：
     - `read/write`：从 request 中提取路径字段（支持 fileName/filePath/path/directory/directoryPath/targetPath/sourcePath + 数组字段）；
     - 只要全部路径归入 `config.allowedDirectories` 就 approved，否则 `denied-by-rules`（路径规则文本）。
     - `custom-tool`/`mcp`：如 `toolName` 在 `config.allowedTools` 内 approved，否则 `denied-by-rules`；
     - 其他 `kind` 返回 `denied-no-approval-rule-and-could-not-request-from-user`
2. 打开 src/services/config-service.ts：
   - `load(initialWorkingDirectory)`：先 normalize，再读取存 config；
   - 把 `normalizedWorkingDirectory` 加到 `allowedDirectories`（不重复）；
   - sanitize 后保存并返回。
3. 更新 tests/permission-service.spec.ts（如已做）：
   - path 字段读权限测试；
   - custom-tool 白名单测试；
   - allow-all 测试；
   - load 时 new cwd automatically added。
4. 运行：
   - `npm test`
   - `npm run typecheck`
   期望全部通过。
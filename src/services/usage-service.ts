import type { SessionEvent } from "@github/copilot-sdk";

import type { ActiveSessionInfo, UsageSummary } from "../types.js";

function extractContent(event: SessionEvent): string | undefined {
  const maybeData = (event as { data?: { content?: unknown } }).data;

  if (typeof maybeData?.content === "string") {
    return maybeData.content;
  }

  return undefined;
}

export class UsageService {
  summarize(session: ActiveSessionInfo, events: SessionEvent[]): UsageSummary {
    let userMessages = 0;
    let slashCommands = 0;
    let assistantMessages = 0;
    let toolExecutions = 0;
    let lastAssistantMessage: string | undefined;

    for (const event of events) {
      if (event.type === "user.message") {
        userMessages += 1;
        const content = extractContent(event);

        if (content?.trim().startsWith("/")) {
          slashCommands += 1;
        }

        continue;
      }

      if (event.type === "assistant.message") {
        assistantMessages += 1;
        lastAssistantMessage = extractContent(event);
        continue;
      }

      if (event.type === "tool.execution_start") {
        toolExecutions += 1;
      }
    }

    return {
      sessionId: session.sessionId,
      model: session.model,
      workingDirectory: session.workingDirectory,
      totalEvents: events.length,
      userMessages,
      slashCommands,
      assistantMessages,
      toolExecutions,
      lastAssistantMessage,
    };
  }
}
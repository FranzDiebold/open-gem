import type {
  RemoteThreadListAdapter,
  RemoteThreadListResponse,
  RemoteThreadInitializeResponse,
  RemoteThreadMetadata,
} from "@assistant-ui/core";
import type { ThreadMessage } from "@assistant-ui/react";
import { createAssistantStream } from "assistant-stream";
import {
  createThread,
  searchThreads,
  updateThread,
  deleteThread,
} from "./chatApi";

export const threadListAdapter: RemoteThreadListAdapter = {
  async list(): Promise<RemoteThreadListResponse> {
    const threads = await searchThreads();
    return {
      threads: threads.map(
        (t): RemoteThreadMetadata => ({
          status:
            t.metadata?.status === "archived" ? "archived" : "regular",
          remoteId: t.thread_id,
          externalId: t.thread_id,
          title: (t.metadata?.title as string) || undefined,
          custom: { channel: (t.metadata?.channel as string) || "ui" },
        }),
      ),
    };
  },

  async initialize(threadId?: string): Promise<RemoteThreadInitializeResponse> {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (threadId && uuidRegex.test(threadId)) {
      return {
        remoteId: threadId,
        externalId: threadId,
      };
    }
    const thread = await createThread();
    return {
      remoteId: thread.thread_id,
      externalId: thread.thread_id,
    };
  },

  async rename(remoteId: string, newTitle: string): Promise<void> {
    await updateThread(remoteId, { title: newTitle });
  },

  async archive(remoteId: string): Promise<void> {
    await updateThread(remoteId, { status: "archived" });
  },

  async unarchive(remoteId: string): Promise<void> {
    await updateThread(remoteId, { status: "regular" });
  },

  async delete(remoteId: string): Promise<void> {
    await deleteThread(remoteId);
  },

  async generateTitle(remoteId: string, messages: readonly ThreadMessage[]) {
    const firstUserMessage = messages.find((m) => m.role === "user");
    let title = "New Chat";
    if (firstUserMessage) {
      const textPart = firstUserMessage.content.find(
        (p) => p.type === "text",
      );
      if (textPart && textPart.type === "text") {
        const text = textPart.text.trim();
        title = text.length > 50 ? `${text.slice(0, 47)}...` : text;
      }
    }

    const finalTitle = title;
    await updateThread(remoteId, { title: finalTitle });
    return createAssistantStream((controller) => {
      controller.appendText(finalTitle);
    });
  },

  async fetch(threadId: string): Promise<RemoteThreadMetadata> {
    const threads = await searchThreads();
    const thread = threads.find((t) => t.thread_id === threadId);
    if (!thread) {
      return {
        status: "regular",
        remoteId: threadId,
        externalId: threadId,
        title: undefined,
        custom: { channel: "ui" },
      };
    }
    return {
      status: thread.metadata?.status === "archived" ? "archived" : "regular",
      remoteId: thread.thread_id,
      externalId: thread.thread_id,
      title: (thread.metadata?.title as string) || undefined,
      custom: { channel: (thread.metadata?.channel as string) || "ui" },
    };
  },
};

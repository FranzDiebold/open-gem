"use client";

import {
  AssistantRuntimeProvider,
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
} from "@assistant-ui/react";
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";

import { getThreadState, getThreadHistory, sendMessage } from "@/lib/chatApi";
import { threadListAdapter } from "@/lib/threadListAdapter";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";

export function Assistant() {
  const runtime = useLangGraphRuntime({
    unstable_threadListAdapter: threadListAdapter,
    adapters: {
      attachments: new CompositeAttachmentAdapter([
        new SimpleImageAttachmentAdapter(),
        new SimpleTextAttachmentAdapter(),
      ]),
    },
    getCheckpointId: async (threadId, parentMessages) => {
      const history = await getThreadHistory(threadId);
      for (const state of history) {
        if (state.values.messages.length === parentMessages.length) {
          return state.checkpoint.checkpoint_id ?? null;
        }
      }
      return null;
    },
    stream: async function* (messages, { initialize, command, checkpointId }) {
      const { externalId } = await initialize();
      if (!externalId) throw new Error("Thread not found");

      const generator = await sendMessage({
        threadId: externalId,
        messages,
        command,
        checkpointId,
      });

      yield* generator;
    },
    load: async (externalId) => {
      const state = await getThreadState(externalId);
      return {
        messages: state.values.messages,
      };
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
      <div className="flex h-dvh w-full">
        <ThreadListSidebar />
        <SidebarInset>
          {/* Add sidebar trigger, location can be customized */}
          <SidebarTrigger className="absolute top-4 left-4 z-50" />
          <Thread />
        </SidebarInset>
      </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
}

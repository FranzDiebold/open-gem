import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from "@/components/assistant-ui/attachment";
import { StreamdownText, UserStreamdownText } from "@/components/assistant-ui/streamdown-text";
import {
  Reasoning,
  ReasoningContent,
  ReasoningRoot,
  ReasoningText,
  ReasoningTrigger,
} from "@/components/assistant-ui/reasoning";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import { File } from "@/components/assistant-ui/file";
import { Image } from "@/components/assistant-ui/image";
import { QuoteBlock, SelectionToolbar, ComposerQuotePreview } from "@/components/assistant-ui/quote";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import {
  ToolGroupContent,
  ToolGroupRoot,
  ToolGroupTrigger,
} from "@/components/assistant-ui/tool-group";
import { cn } from "@/lib/utils";
import {
  ActionBarMorePrimitive,
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  groupPartByType,
  MessagePrimitive,
  ThreadPrimitive,
  useAui,
  useAuiState,
} from "@assistant-ui/react";
import { OpenGemLogo } from "@/components/icons/open-gem-logo";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  SquareIcon,
} from "lucide-react";
import { type FC, useCallback } from "react";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full flex-col"
      style={{
        ["--thread-max-width" as string]: "64rem",
        ["--composer-radius" as string]: "24px",
        ["--composer-padding" as string]: "10px",
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-4 pt-4"
      >
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <ThreadWelcome />
        </AuiIf>

        <ThreadPrimitive.Messages>
          {() => <ThreadMessage />}
        </ThreadPrimitive.Messages>

        <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-(--thread-max-width) flex-col gap-4 overflow-visible rounded-t-(--composer-radius) bg-transparent backdrop-blur-md pb-4 md:pb-6">
          <ThreadScrollToBottom />
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>

      <SelectionToolbar />
    </ThreadPrimitive.Root>
  );
};

const ThreadMessage: FC = () => {
  const role = useAuiState((s) => s.message.role);
  const isEditing = useAuiState((s) => s.message.composer.isEditing);
  if (isEditing) return <EditComposer />;
  if (role === "user") return <UserMessage />;
  return <AssistantMessage />;
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:border-border dark:bg-background dark:hover:bg-accent"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-(--thread-max-width) grow flex-col">
      <div className="aui-thread-welcome-center flex w-full grow flex-col items-center justify-center">
        <div className="aui-thread-welcome-message relative flex size-full flex-col items-center justify-center gap-6 px-4">
          {/* Ambient glow behind logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] size-64 rounded-full bg-gradient-to-br from-purple-500/20 via-cyan-400/15 to-blue-500/20 blur-3xl animate-pulse-slow pointer-events-none" />

          <OpenGemLogo className="fade-in zoom-in-50 animate-in fill-mode-both size-24 duration-500 drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]" />

          <div className="flex flex-col items-center gap-2 mt-2">
            <h1 className="fade-in slide-in-from-bottom-3 animate-in fill-mode-both font-bold text-4xl tracking-tight duration-500 delay-150">
              Let's start{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
                  doing
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/0 via-cyan-400/60 to-blue-500/0 rounded-full" />
              </span>
              !
            </h1>
            <p className="fade-in slide-in-from-bottom-2 animate-in fill-mode-both text-muted-foreground text-base delay-200 duration-500 max-w-sm text-center">
              Your AI agent is ready. Pick a suggestion or type anything below.
            </p>
          </div>
        </div>
      </div>
      <ThreadSuggestions />
    </div>
  );
};

const EXAMPLE_SUGGESTIONS = [
  { title: "Check mail & calendar", prompt: "Check my email inbox for unread messages and show me today's calendar events.", icon: "📬" },
  { title: "Schedule a task", prompt: "Create a cron query that checks my calendar every morning at 8 AM and sends me a summary of today's events.", icon: "⏰" },
  { title: "Update settings", prompt: "Show me my current settings and help me update my preferences.", icon: "⚙️" },
  { title: "Brainstorm ideas", prompt: "Brainstorm 5 creative project ideas for learning machine learning hands-on.", icon: "💡" },
];

const ThreadSuggestions: FC = () => {
  const aui = useAui();

  const handleSuggestionClick = useCallback(
    (prompt: string) => {
      aui.composer().setText(prompt);

      requestAnimationFrame(() => {
        const input = document.querySelector('#composer-message-input') as HTMLTextAreaElement | HTMLInputElement | null;

        if (!input) return;

        input.focus();
        input.setSelectionRange(prompt.length, prompt.length);
      });

    },
    [aui],
  );

  return (
    <div className="aui-thread-welcome-suggestions grid w-full @md:grid-cols-2 gap-3 pb-4">
      {EXAMPLE_SUGGESTIONS.map((suggestion, index) => (
        <div
          key={suggestion.title}
          className="fade-in slide-in-from-bottom-2 animate-in fill-mode-both duration-300 group"
          style={{ animationDelay: `${250 + index * 100}ms` }}
        >
          <button
            className="relative w-full overflow-hidden rounded-2xl p-[1px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => handleSuggestionClick(suggestion.prompt)}
          >
            {/* Gradient border */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/30 via-cyan-400/20 to-blue-500/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex flex-col items-start gap-1.5 rounded-2xl border border-border/60 bg-background/80 backdrop-blur-sm px-4 py-3.5 text-left transition-colors group-hover:border-transparent group-hover:bg-background/95">
              <span className="font-medium text-sm flex items-center gap-2">
                <span className="text-base">{suggestion.icon}</span>
                {suggestion.title}
              </span>
              <span className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">
                {suggestion.prompt}
              </span>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
      <ComposerQuotePreview />
      <ComposerPrimitive.AttachmentDropzone asChild>
        <div
          data-slot="composer-shell"
          className="flex w-full flex-col gap-2 rounded-(--composer-radius) border border-blue-400/50 bg-white/80 backdrop-blur-xl p-(--composer-padding) transition-all shadow-2xl shadow-blue-500/40 hover:shadow-3xl hover:shadow-blue-500/50 focus-within:border-blue-300/80 focus-within:ring-2 focus-within:ring-blue-400/60 data-[dragging=true]:border-blue-400/80 data-[dragging=true]:bg-white/90 data-[dragging=true]:shadow-3xl data-[dragging=true]:shadow-blue-500/60"
        >
          <ComposerAttachments />
          <ComposerPrimitive.Input
            placeholder="Send a message..."
            className="aui-composer-input max-h-32 min-h-10 w-full resize-none bg-transparent px-1.75 py-1 text-sm outline-none placeholder:text-muted-foreground/80"
            rows={1}
            autoFocus
            aria-label="Message input"
            id="composer-message-input"
          />
          <ComposerAction />
        </div>
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  return (
    <div className="aui-composer-action-wrapper relative flex items-center justify-between">
      <ComposerAddAttachment />
      <AuiIf condition={(s) => !s.thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send message"
            side="bottom"
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-send size-8 rounded-full"
            aria-label="Send message"
          >
            <ArrowUpIcon className="aui-composer-send-icon size-4" />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-cancel size-8 rounded-full"
            aria-label="Stop generating"
          >
            <SquareIcon className="aui-composer-cancel-icon size-3 fill-current" />
          </Button>
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </div>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm dark:bg-destructive/5 dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessageLoading: FC = () => {
  return (
    <div className="flex items-center px-5 py-4">
      <svg
        width="48"
        height="48"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Loading"
        className="animate-pulse"
      >
        <defs>
          <linearGradient
            id="loading-left"
            x1="104"
            y1="180"
            x2="256"
            y2="388"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#ff006e" />
            <stop offset="1" stopColor="#ffb703" />
          </linearGradient>
          <linearGradient
            id="loading-center"
            x1="180"
            y1="128"
            x2="332"
            y2="388"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#a855f7" />
            <stop offset="0.5" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#84cc16" />
          </linearGradient>
          <linearGradient
            id="loading-right"
            x1="256"
            y1="128"
            x2="408"
            y2="388"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#06b6d4" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <polygon
          points="104,208 176,136 256,392"
          fill="url(#loading-left)"
          style={{ animation: "gemFacet 1.4s ease-in-out infinite" }}
        />
        <polygon
          points="176,136 336,136 256,392"
          fill="url(#loading-center)"
          style={{ animation: "gemFacet 1.4s ease-in-out 0.2s infinite" }}
        />
        <polygon
          points="336,136 408,208 256,392"
          fill="url(#loading-right)"
          style={{ animation: "gemFacet 1.4s ease-in-out 0.4s infinite" }}
        />
      </svg>
    </div>
  );
};

const AssistantMessage: FC = () => {
  const isEmpty = useAuiState(
    (s) => s.message.content.length === 0 ||
      (s.message.content.every((part) => part.type === "text" && part.text === "")),
  );

  return (
    <MessagePrimitive.Root
      className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto flex w-full max-w-(--thread-max-width) animate-in flex-col gap-1 py-1.5 duration-150"
      data-role="assistant"
    >
      {isEmpty ? (
        <AssistantMessageLoading />
      ) : (
        <>
          <div className="aui-assistant-message-content wrap-break-word rounded-2xl border border-blue-400/30 bg-white/85 backdrop-blur-xl px-6 py-5 text-foreground leading-relaxed shadow-lg shadow-blue-500/20 transition-all hover:shadow-2xl hover:shadow-blue-500/35">
            <MessagePrimitive.GroupedParts
              groupBy={groupPartByType({
                "tool-call": ["group-tool"],
                "reasoning": ["group-reasoning"],
              })}
            >
              {({ part, children }) => {
                switch (part.type) {
                  case "group-reasoning": {
                    const running = part.status.type === "running";
                    return (
                      <ReasoningRoot streaming={running}>
                        <ReasoningTrigger active={running} />
                        <ReasoningContent aria-busy={running}>
                          <ReasoningText>{children}</ReasoningText>
                        </ReasoningContent>
                      </ReasoningRoot>
                    );
                  };
                  case "group-tool":
                    return (
                      <ToolGroupRoot className="mb-4">
                        <ToolGroupTrigger
                          count={part.indices.length}
                          active={part.status.type === "running"}
                        />
                        <ToolGroupContent>{children}</ToolGroupContent>
                      </ToolGroupRoot>
                    );
                  case "text":
                    return <StreamdownText />;
                  case "reasoning":
                    return <Reasoning {...part} />;
                  case "tool-call":
                    return part.toolUI ?? <ToolFallback {...part} />;
                  case "file":
                    return <File {...part} />;
                  case "image":
                    return <Image {...part} />;
                  default:
                    return null;
                }
              }}
            </MessagePrimitive.GroupedParts>
            <MessageError />
          </div>

          <div className="aui-assistant-message-footer ml-2 flex min-h-6">
            <BranchPicker />
            <AssistantActionBar />
          </div>
        </>
      )}
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="aui-assistant-action-bar-root col-start-3 row-start-2 -ml-1 flex gap-1 text-muted-foreground"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon />
          </AuiIf>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon />
          </AuiIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
      <ActionBarMorePrimitive.Root>
        <ActionBarMorePrimitive.Trigger asChild>
          <TooltipIconButton
            tooltip="More"
            className="data-[state=open]:bg-accent"
          >
            <MoreHorizontalIcon />
          </TooltipIconButton>
        </ActionBarMorePrimitive.Trigger>
        <ActionBarMorePrimitive.Content
          side="bottom"
          align="start"
          className="aui-action-bar-more-content z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <ActionBarPrimitive.ExportMarkdown asChild>
            <ActionBarMorePrimitive.Item className="aui-action-bar-more-item flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <DownloadIcon className="size-4" />
              Export as Markdown
            </ActionBarMorePrimitive.Item>
          </ActionBarPrimitive.ExportMarkdown>
        </ActionBarMorePrimitive.Content>
      </ActionBarMorePrimitive.Root>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-user-message-root fade-in slide-in-from-bottom-1 mx-auto flex w-full max-w-(--thread-max-width) animate-in flex-col items-end gap-1 px-2 py-1.5 duration-150"
      data-role="user"
    >
      <UserMessageAttachments />

      <div
        className="aui-user-message-content wrap-break-word rounded-2xl px-4 py-2.5 text-foreground backdrop-blur-[6.5px] transition-shadow empty:hidden [box-shadow:0_6px_24px_rgba(100,130,235,0.28),0_2px_6px_rgba(100,130,235,0.12)] hover:[box-shadow:0_8px_32px_rgba(100,130,235,0.4),0_2px_8px_rgba(100,130,235,0.2)]"
        style={{
          background: "linear-gradient(135deg, rgba(160, 120, 255, 0.25), rgba(95, 180, 255, 0.15))",
          border: "1px solid rgba(160, 120, 255, 0.1)",
        }}
      >
        <MessagePrimitive.Quote>
          {(quote) => <QuoteBlock {...quote} />}
        </MessagePrimitive.Quote>
        <MessagePrimitive.Parts>
          {({ part }) => {
            if (part.type === "text") return <UserStreamdownText />;
            return null;
          }}
        </MessagePrimitive.Parts>
      </div>

      <div className="aui-user-message-footer mr-2 flex min-h-6 justify-end">
        <BranchPicker />
        <UserActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root -mr-1 flex items-center gap-1 text-muted-foreground"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon />
          </AuiIf>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon />
          </AuiIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root className="aui-edit-composer-wrapper mx-auto flex w-full max-w-(--thread-max-width) flex-col px-2 py-3">
      <ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-[85%] flex-col rounded-2xl bg-muted">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input min-h-14 w-full resize-none bg-transparent p-4 text-foreground text-sm outline-none"
          autoFocus
        />
        <div className="aui-edit-composer-footer mx-3 mb-3 flex items-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm">Update</Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-muted-foreground text-xs",
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

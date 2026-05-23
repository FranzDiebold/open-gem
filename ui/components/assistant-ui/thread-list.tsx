"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AuiIf,
  ThreadListItemMorePrimitive,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useThreadListItem,
} from "@assistant-ui/react";
import { ArchiveIcon, ClockIcon, LayersIcon, MessageCircleIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { createContext, useContext, useRef, useState, useEffect, useLayoutEffect, type FC } from "react";

type ChannelFilter = "all" | "ui" | "cron";
const ChannelFilterContext = createContext<ChannelFilter>("all");

const filters = [
  { key: "all" as const, label: "All", icon: LayersIcon },
  { key: "ui" as const, label: "Chat", icon: MessageCircleIcon },
  { key: "cron" as const, label: "Cron", icon: ClockIcon },
];

export const ThreadList: FC = () => {
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const updateIndicator = (filter: ChannelFilter) => {
    const button = buttonRefs.current.get(filter);
    const container = containerRef.current;
    if (button && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    }
  };

  useLayoutEffect(() => {
    updateIndicator(channelFilter);
  }, [channelFilter]);

  useEffect(() => {
    // Recalculate on resize
    const observer = new ResizeObserver(() => updateIndicator(channelFilter));
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [channelFilter]);

  return (
    <ChannelFilterContext.Provider value={channelFilter}>
      <ThreadListPrimitive.Root className="aui-root aui-thread-list-root flex flex-col gap-1">
        <ThreadListNew />
        <div
          ref={containerRef}
          className="relative mx-1 flex items-center rounded-xl border border-border/40 bg-muted/40 p-1 backdrop-blur-sm"
        >
          {/* Sliding indicator */}
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-background shadow-md ring-1 ring-border/50 transition-all duration-300 ease-[cubic-bezier(0.65,0,0.35,1)]"
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />
          {filters.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              ref={(el) => { if (el) buttonRefs.current.set(key, el); }}
              type="button"
              onClick={() => setChannelFilter(key)}
              className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                channelFilter === key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              <Icon className={`size-3.5 transition-transform duration-300 ${channelFilter === key ? "scale-110" : "scale-100"}`} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <AuiIf condition={({ threads }) => threads.isLoading}>
          <ThreadListSkeleton />
        </AuiIf>
        <AuiIf condition={({ threads }) => !threads.isLoading}>
          <ThreadListPrimitive.Items>
            {() => <ThreadListItem />}
          </ThreadListPrimitive.Items>
        </AuiIf>
      </ThreadListPrimitive.Root>
    </ChannelFilterContext.Provider>
  );
};

const ThreadListNew: FC = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <Button
        variant="outline"
        className="aui-thread-list-new h-9 justify-start gap-2 rounded-lg px-3 text-sm hover:bg-muted data-active:bg-muted"
      >
        <PlusIcon className="size-4" />
        New Thread
      </Button>
    </ThreadListPrimitive.New>
  );
};

const ThreadListSkeleton: FC = () => {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          role="status"
          aria-label="Loading threads"
          className="aui-thread-list-skeleton-wrapper flex h-9 items-center px-3"
        >
          <Skeleton className="aui-thread-list-skeleton h-4 w-full" />
        </div>
      ))}
    </div>
  );
};

const ThreadListItem: FC = () => {
  const channelFilter = useContext(ChannelFilterContext);
  const item = useThreadListItem();
  const channel = (item.custom?.channel as string) || "ui";

  if (channelFilter !== "all" && channel !== channelFilter) {
    return null;
  }

  return (
    <ThreadListItemPrimitive.Root className="aui-thread-list-item group flex h-9 items-center gap-2 rounded-lg transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none data-active:bg-muted">
      <ThreadListItemPrimitive.Trigger className="aui-thread-list-item-trigger flex h-full min-w-0 flex-1 items-center gap-2 truncate px-3 text-start text-sm">
        {channel === "cron" ? (
          <ClockIcon className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <MessageCircleIcon className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <ThreadListItemPrimitive.Title fallback="New Chat" />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemMore />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemMore: FC = () => {
  return (
    <ThreadListItemMorePrimitive.Root>
      <ThreadListItemMorePrimitive.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="aui-thread-list-item-more mr-2 size-7 p-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:bg-accent data-[state=open]:opacity-100 group-data-active:opacity-100"
        >
          <MoreHorizontalIcon className="size-4" />
          <span className="sr-only">More options</span>
        </Button>
      </ThreadListItemMorePrimitive.Trigger>
      <ThreadListItemMorePrimitive.Content
        side="bottom"
        align="start"
        className="aui-thread-list-item-more-content z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      >
        <ThreadListItemPrimitive.Archive asChild>
          <ThreadListItemMorePrimitive.Item className="aui-thread-list-item-more-item flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
            <ArchiveIcon className="size-4" />
            Archive
          </ThreadListItemMorePrimitive.Item>
        </ThreadListItemPrimitive.Archive>
      </ThreadListItemMorePrimitive.Content>
    </ThreadListItemMorePrimitive.Root>
  );
};
import type * as React from "react";
import { useCallback } from "react";
import { useAui } from "@assistant-ui/react";
import { GitHubIcon } from "@/components/icons/github";
import { SettingsIcon } from "@/components/icons/settings";
import { OpenGemLogo } from "@/components/icons/open-gem-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ThreadList } from "@/components/assistant-ui/thread-list";

export function ThreadListSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const settingsPrompt = "Use the `settings` skill and follow the instructions from the skill.";

  const aui = useAui();
  const handleSettingsClick = useCallback(async () => {
    await aui.threads().switchToNewThread();
    aui.thread().append({
      role: "user",
      content: [{ type: "text", text: settingsPrompt }],
    });
  }, [aui]);

  return (
    <Sidebar {...props}>
      <SidebarHeader className="aui-sidebar-header mb-2 border-b">
        <div className="aui-sidebar-header-content flex items-center justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="aui-sidebar-header-icon-wrapper flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                    <OpenGemLogo className="aui-sidebar-header-icon size-10" />
                  </div>
                  <div className="aui-sidebar-header-heading mr-6 flex flex-col gap-0.5 leading-none">
                    <span className="aui-sidebar-header-title font-semibold">
                      OpenGem
                    </span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>
      <SidebarContent className="aui-sidebar-content px-2">
        <ThreadList />
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter className="aui-sidebar-footer border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <button
                type="button"
                onClick={handleSettingsClick}
                className="cursor-pointer"
              >
                <div className="aui-sidebar-footer-icon-wrapper flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <SettingsIcon className="aui-sidebar-footer-icon size-4" />
                </div>
                <div className="aui-sidebar-footer-heading flex flex-col gap-0.5 leading-none">
                  <span className="aui-sidebar-footer-title font-semibold">
                    Settings
                  </span>
                </div>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" asChild>
              <a
                href="https://github.com/FranzDiebold/open-gem"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="aui-sidebar-footer-icon-wrapper flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GitHubIcon className="aui-sidebar-footer-icon size-4" />
                </div>
                <div className="aui-sidebar-footer-heading flex flex-col gap-0.5 leading-none">
                  <span className="aui-sidebar-footer-title font-semibold">
                    GitHub
                  </span>
                  <span>View Source</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

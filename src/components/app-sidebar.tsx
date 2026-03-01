"use client"

import * as React from "react"
import { Calculator, History, Settings, HelpCircle, Home, ScrollText } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import ModeToggle from "@/components/mode-toggle"
import { DecidereLogo } from "@/components/decidere-logo"
import packageJson from "../../package.json"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Calculator",
    url: "/calculator",
    icon: Calculator,
  },
  {
    title: "History",
    url: "/history",
    icon: History,
  },
]

const navSecondary = [
  {
    title: "Changelog",
    url: "/changelog",
    icon: ScrollText,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Help",
    url: "/help",
    icon: HelpCircle,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <DecidereLogo className="size-8 rounded-lg shadow-sm shrink-0" />
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Decidere</span>
                  <span className="text-xs">Decide where to live</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <ModeToggle />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="px-2 py-1.5 text-xs text-sidebar-foreground/70">
          <Link
            href="/changelog"
            className="hover:text-sidebar-foreground transition-colors cursor-pointer"
          >
            v{packageJson.version}
          </Link>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

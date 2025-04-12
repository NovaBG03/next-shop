'use client';

import Link from 'next/link';

import { LucideIcon } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '~/components/ui/sidebar';

type NavMainProps = {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
};

export const NavMain = ({ items }: NavMainProps) => {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} onClick={() => setOpenMobile(false)} asChild>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

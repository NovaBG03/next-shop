'use client';

import { BoxIcon, GaugeIcon, InboxIcon, LibraryIcon } from 'lucide-react';

import { NavMain } from '~/components/nav-main';
import { NavUser } from '~/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar';
import { authClient } from '~/lib/auth/client';
import { AppIcon } from './app-icon';

const NAV_MENU = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: GaugeIcon,
  },
  {
    title: 'Categories',
    url: '/admin/category',
    icon: LibraryIcon,
  },
  {
    title: 'Products',
    url: '/admin/product',
    icon: BoxIcon,
  },
  {
    title: 'Orders',
    url: '/admin/order',
    icon: InboxIcon,
  },
];
export const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const session = authClient.useSession();
  const user = session.data?.user;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <AppIcon className="!size-5" />
                <span className="text-base font-semibold">Next Shop</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={NAV_MENU} />
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      )}
    </Sidebar>
  );
};

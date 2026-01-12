'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { LogoIcon, ChevronRightIcon } from '@/components/icons';
import { mainNavItems, bottomNavItems, type NavItem } from '@/config/navigation';

interface NavItemProps {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
}

function NavItemComponent({ item, isCollapsed, isActive }: NavItemProps) {
  const { Icon } = item;
  const content = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-5 w-5" />
      {!isCollapsed && <span>{item.title}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-4">
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

function SidebarContent({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex h-14 items-center border-b px-4',
          isCollapsed && 'justify-center px-2'
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <LogoIcon />
          {!isCollapsed && <span>Scraper</span>}
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          <TooltipProvider>
            {mainNavItems.map((item) => (
              <NavItemComponent
                key={item.href}
                item={item}
                isCollapsed={isCollapsed}
                isActive={isActive(item.href)}
              />
            ))}
          </TooltipProvider>
        </nav>
      </div>
      <Separator />
      <div className="p-2">
        <TooltipProvider>
          {bottomNavItems.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              isCollapsed={isCollapsed}
              isActive={isActive(item.href)}
            />
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { sidebar, toggleSidebar, setMobileSidebarOpen } = useAppStore();
  const { isCollapsed, isMobileOpen } = sidebar;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'relative hidden border-r bg-background md:block',
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-[60px]' : 'w-[240px]'
        )}
      >
        <SidebarContent isCollapsed={isCollapsed} />
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-4 right-[-12px] h-6 w-6 rounded-full border bg-background p-0 hidden md:flex"
          onClick={toggleSidebar}
        >
          <ChevronRightIcon
            className={cn(
              'transition-transform',
              isCollapsed ? 'rotate-0' : 'rotate-180'
            )}
          />
        </Button>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[240px] p-0">
          <SidebarContent isCollapsed={false} />
        </SheetContent>
      </Sheet>
    </>
  );
}

import React from 'react';
import { Link } from 'wouter';
import { SidebarMenuItem } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface SidebarMenuLinkProps {
  href: string;
  active?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SidebarMenuLink({ 
  href, 
  active, 
  icon, 
  children, 
  className 
}: SidebarMenuLinkProps) {
  return (
    <SidebarMenuItem>
      <Link 
        href={href} 
        className={cn(
          "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
          active && "bg-accent text-accent-foreground font-medium",
          className
        )}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
      </Link>
    </SidebarMenuItem>
  );
}
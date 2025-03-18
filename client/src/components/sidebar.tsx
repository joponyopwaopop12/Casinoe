import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger,
  SidebarGroup,
  SidebarSeparator
} from '@/components/ui/sidebar';
import { SidebarMenuLink } from '@/components/ui/sidebar-menu-link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/game-utils';
import { 
  Dice5, 
  Bomb, 
  Layers, 
  Home, 
  LogOut,
  Settings,
  History
} from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar>
          <SidebarHeader className="flex h-14 items-center px-4">
            <Link href="/" className="flex items-center font-bold text-lg">
              <span className="text-primary">Crypto</span>
              <span>Casino</span>
            </Link>
            <SidebarTrigger className="ml-auto" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuLink 
                  href="/" 
                  active={location === '/'}
                  icon={<Home className="h-4 w-4" />}
                >
                  Home
                </SidebarMenuLink>
                <SidebarMenuLink 
                  href="/dice" 
                  active={location === '/dice'}
                  icon={<Dice5 className="h-4 w-4" />}
                >
                  Dice
                </SidebarMenuLink>
                <SidebarMenuLink 
                  href="/mines" 
                  active={location === '/mines'}
                  icon={<Bomb className="h-4 w-4" />}
                >
                  Mines
                </SidebarMenuLink>
                <SidebarMenuLink 
                  href="/blackjack" 
                  active={location === '/blackjack'}
                  icon={<Layers className="h-4 w-4" />}
                >
                  Blackjack
                </SidebarMenuLink>
                <SidebarMenuLink 
                  href="/history" 
                  active={location === '/history'}
                  icon={<History className="h-4 w-4" />}
                >
                  History
                </SidebarMenuLink>
              </SidebarMenu>
            </SidebarGroup>
            
            <SidebarSeparator />
            
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem className="flex justify-between opacity-70 pointer-events-none">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-semibold text-foreground">
                    {user ? formatCurrency(user.balance) : '$0'}
                  </span>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuLink 
                href="/settings" 
                active={location === '/settings'}
                icon={<Settings className="h-4 w-4" />}
              >
                Settings
              </SidebarMenuLink>
              <SidebarMenuItem>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </SidebarProvider>
  );
}
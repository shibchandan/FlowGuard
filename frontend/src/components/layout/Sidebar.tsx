// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  CheckSquare,
  ShieldCheck,
  Settings,
  PlusCircle,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function Sidebar() {
  const { user, logout } = useAuth();
  const role = user?.role;

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      to: '/',
      show: true,
    },
    {
      label: 'Requests',
      icon: FileText,
      to: '/requests',
      show: true,
    },
    {
      label: 'New Request',
      icon: PlusCircle,
      to: '/requests/new',
      show: role === 'ADMIN' || role === 'OPERATOR',
    },
    {
      label: 'Workflows',
      icon: GitBranch,
      to: '/workflows',
      show: true,
    },
    {
      label: 'Manual Reviews',
      icon: CheckSquare,
      to: '/reviews',
      show: role === 'ADMIN' || role === 'REVIEWER',
    },
    {
      label: 'Audit Logs',
      icon: ShieldCheck,
      to: '/audit',
      show: true,
    },
    {
      label: 'Simulator & Settings',
      icon: Settings,
      to: '/settings',
      show: role === 'ADMIN',
    },
  ];

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b space-x-3">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-lg shadow-sm">
          FG
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight tracking-tight">FlowGuard</h1>
          <p className="text-[11px] text-muted-foreground">Decision Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate leading-none">
                {user?.name || user?.email}
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase font-bold shrink-0">
            {role}
          </Badge>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

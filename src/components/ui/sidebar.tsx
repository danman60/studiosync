'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  GraduationCap,
  Home,
  Layers,
  Menu,
  Settings,
  Users,
  UserPlus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  section?: 'main' | 'admin' | 'portal';
}

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <Home size={20} />, section: 'admin' },
  { label: 'Classes', href: '/admin/classes', icon: <BookOpen size={20} />, section: 'admin' },
  { label: 'Seasons', href: '/admin/seasons', icon: <Calendar size={20} />, section: 'admin' },
  { label: 'Enrollments', href: '/admin/enrollments', icon: <UserPlus size={20} />, section: 'admin' },
  { label: 'Families', href: '/admin/families', icon: <Users size={20} />, section: 'admin' },
  { label: 'Staff', href: '/admin/staff', icon: <GraduationCap size={20} />, section: 'admin' },
  { label: 'Billing', href: '/admin/billing', icon: <CreditCard size={20} />, section: 'admin' },
  { label: 'Settings', href: '/admin/settings', icon: <Settings size={20} />, section: 'admin' },
];

const portalNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <Home size={20} />, section: 'portal' },
  { label: 'Classes', href: '/classes', icon: <BookOpen size={20} />, section: 'portal' },
  { label: 'My Children', href: '/dashboard/children', icon: <Users size={20} />, section: 'portal' },
  { label: 'Payments', href: '/dashboard/payments', icon: <CreditCard size={20} />, section: 'portal' },
];

export function Sidebar({
  variant = 'admin',
  studioName,
}: {
  variant?: 'admin' | 'portal';
  studioName?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = variant === 'admin' ? adminNavItems : portalNavItems;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-200',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <Layers size={24} className="shrink-0 text-indigo-600" />
              <span className="truncate text-lg font-bold text-gray-900">
                {studioName ?? 'StudioSync'}
              </span>
            </div>
          )}
          {collapsed && <Layers size={24} className="mx-auto text-indigo-600" />}

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded p-1 text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X size={18} />
          </button>

          {/* Desktop collapse */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded p-1 text-gray-400 hover:text-gray-600 lg:block"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' &&
                  item.href !== '/dashboard' &&
                  pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          {!collapsed && (
            <p className="text-xs text-gray-400">
              Powered by StudioSync
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

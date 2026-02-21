'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  FolderOpen,
  GraduationCap,
  Home,
  Award,
  BarChart3,
  ImageIcon,
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
  section?: 'main' | 'admin' | 'portal' | 'instructor';
}

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <Home size={20} />, section: 'admin' },
  { label: 'Classes', href: '/admin/classes', icon: <BookOpen size={20} />, section: 'admin' },
  { label: 'Seasons', href: '/admin/seasons', icon: <Calendar size={20} />, section: 'admin' },
  { label: 'Enrollments', href: '/admin/enrollments', icon: <UserPlus size={20} />, section: 'admin' },
  { label: 'Families', href: '/admin/families', icon: <Users size={20} />, section: 'admin' },
  { label: 'Staff', href: '/admin/staff', icon: <GraduationCap size={20} />, section: 'admin' },
  { label: 'Billing', href: '/admin/billing', icon: <CreditCard size={20} />, section: 'admin' },
  { label: 'Media', href: '/admin/media', icon: <FolderOpen size={20} />, section: 'admin' },
  { label: 'Calendar', href: '/admin/calendar', icon: <Calendar size={20} />, section: 'admin' },
  { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={20} />, section: 'admin' },
  { label: 'Settings', href: '/admin/settings', icon: <Settings size={20} />, section: 'admin' },
];

const instructorNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/instructor', icon: <Home size={20} />, section: 'instructor' },
  { label: 'My Classes', href: '/instructor/classes', icon: <BookOpen size={20} />, section: 'instructor' },
  { label: 'Attendance', href: '/instructor/attendance', icon: <CheckSquare size={20} />, section: 'instructor' },
];

const portalNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <Home size={20} />, section: 'portal' },
  { label: 'Classes', href: '/classes', icon: <BookOpen size={20} />, section: 'portal' },
  { label: 'My Students', href: '/dashboard/children', icon: <Users size={20} />, section: 'portal' },
  { label: 'Invoices', href: '/dashboard/invoices', icon: <FileText size={20} />, section: 'portal' },
  { label: 'Payments', href: '/dashboard/payments', icon: <CreditCard size={20} />, section: 'portal' },
  { label: 'Progress', href: '/dashboard/progress', icon: <Award size={20} />, section: 'portal' },
  { label: 'Media', href: '/dashboard/media', icon: <ImageIcon size={20} />, section: 'portal' },
];

export function Sidebar({
  variant = 'admin',
  studioName,
}: {
  variant?: 'admin' | 'portal' | 'instructor';
  studioName?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = variant === 'admin'
    ? adminNavItems
    : variant === 'instructor'
      ? instructorNavItems
      : portalNavItems;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 backdrop-blur-sm shadow-md border border-white/60 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-gray-200/80 bg-white/90 backdrop-blur-md transition-all duration-200',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200/80 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                <Layers size={18} className="text-white" />
              </div>
              <span className="truncate text-lg font-bold text-gray-900">
                {studioName ?? 'StudioSync'}
              </span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
              <Layers size={18} className="text-white" />
            </div>
          )}

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X size={18} />
          </button>

          {/* Desktop collapse */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 lg:flex"
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
                  item.href !== '/instructor' &&
                  pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm shadow-indigo-500/5'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={cn('shrink-0', isActive && 'text-indigo-600')}>{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200/80 p-4">
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

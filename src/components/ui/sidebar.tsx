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
  Clock,
  CreditCard,
  FileText,
  FolderOpen,
  GraduationCap,
  Home,
  Award,
  BarChart3,
  ImageIcon,
  Layers,
  Megaphone,
  Menu,
  MessageCircle,
  Send,
  Settings,
  Tag,
  Ticket,
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
  { label: 'Dashboard', href: '/admin', icon: <Home size={18} />, section: 'admin' },
  { label: 'Classes', href: '/admin/classes', icon: <BookOpen size={18} />, section: 'admin' },
  { label: 'Seasons', href: '/admin/seasons', icon: <Calendar size={18} />, section: 'admin' },
  { label: 'Enrollments', href: '/admin/enrollments', icon: <UserPlus size={18} />, section: 'admin' },
  { label: 'Families', href: '/admin/families', icon: <Users size={18} />, section: 'admin' },
  { label: 'Staff', href: '/admin/staff', icon: <GraduationCap size={18} />, section: 'admin' },
  { label: 'Billing', href: '/admin/billing', icon: <CreditCard size={18} />, section: 'admin' },
  { label: 'Waivers', href: '/admin/waivers', icon: <FileText size={18} />, section: 'admin' },
  { label: 'Promo Codes', href: '/admin/promo-codes', icon: <Tag size={18} />, section: 'admin' },
  { label: 'Media', href: '/admin/media', icon: <FolderOpen size={18} />, section: 'admin' },
  { label: 'Calendar', href: '/admin/calendar', icon: <Calendar size={18} />, section: 'admin' },
  { label: 'Events', href: '/admin/events', icon: <Ticket size={18} />, section: 'admin' },
  { label: 'Announcements', href: '/admin/announcements', icon: <Megaphone size={18} />, section: 'admin' },
  { label: 'Attendance', href: '/admin/attendance', icon: <CheckSquare size={18} />, section: 'admin' },
  { label: 'Messages', href: '/admin/messages', icon: <MessageCircle size={18} />, section: 'admin' },
  { label: 'Report Cards', href: '/admin/reports', icon: <Award size={18} />, section: 'admin' },
  { label: 'Private Lessons', href: '/admin/private-lessons', icon: <GraduationCap size={18} />, section: 'admin' },
  { label: 'Scheduled', href: '/admin/scheduled', icon: <Send size={18} />, section: 'admin' },
  { label: 'Time Clock', href: '/admin/time-clock', icon: <Clock size={18} />, section: 'admin' },
  { label: 'Templates', href: '/admin/templates', icon: <FileText size={18} />, section: 'admin' },
  { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={18} />, section: 'admin' },
  { label: 'Settings', href: '/admin/settings', icon: <Settings size={18} />, section: 'admin' },
];

const instructorNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/instructor', icon: <Home size={18} />, section: 'instructor' },
  { label: 'My Classes', href: '/instructor/classes', icon: <BookOpen size={18} />, section: 'instructor' },
  { label: 'Attendance', href: '/instructor/attendance', icon: <CheckSquare size={18} />, section: 'instructor' },
  { label: 'Progress', href: '/instructor/progress', icon: <Award size={18} />, section: 'instructor' },
  { label: 'Calendar', href: '/instructor/calendar', icon: <Calendar size={18} />, section: 'instructor' },
  { label: 'Announcements', href: '/instructor/announcements', icon: <Megaphone size={18} />, section: 'instructor' },
  { label: 'Time Clock', href: '/instructor/time-clock', icon: <Clock size={18} />, section: 'instructor' },
];

const portalNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <Home size={18} />, section: 'portal' },
  { label: 'Classes', href: '/classes', icon: <BookOpen size={18} />, section: 'portal' },
  { label: 'My Students', href: '/dashboard/students', icon: <Users size={18} />, section: 'portal' },
  { label: 'Invoices', href: '/dashboard/invoices', icon: <FileText size={18} />, section: 'portal' },
  { label: 'Payments', href: '/dashboard/payments', icon: <CreditCard size={18} />, section: 'portal' },
  { label: 'Waivers', href: '/dashboard/waivers', icon: <FileText size={18} />, section: 'portal' },
  { label: 'Attendance', href: '/dashboard/attendance', icon: <CheckSquare size={18} />, section: 'portal' },
  { label: 'Progress', href: '/dashboard/progress', icon: <Award size={18} />, section: 'portal' },
  { label: 'Media', href: '/dashboard/media', icon: <ImageIcon size={18} />, section: 'portal' },
  { label: 'Events', href: '/dashboard/events', icon: <Ticket size={18} />, section: 'portal' },
  { label: 'Messages', href: '/dashboard/messages', icon: <MessageCircle size={18} />, section: 'portal' },
  { label: 'Announcements', href: '/dashboard/announcements', icon: <Megaphone size={18} />, section: 'portal' },
  { label: 'Profile', href: '/dashboard/profile', icon: <Users size={18} />, section: 'portal' },
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
        className="fixed top-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm border border-stone-200/60 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-stone-600" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/15 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-stone-200/60 bg-white transition-all duration-200',
          collapsed ? 'w-[4.5rem]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-stone-100 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <Layers size={18} />
              </div>
              <span className="truncate text-[15px] font-semibold text-stone-800">
                {studioName ?? 'StudioSync'}
              </span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <Layers size={18} />
            </div>
          )}

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="icon-btn lg:hidden"
          >
            <X size={18} />
          </button>

          {/* Desktop collapse */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden icon-btn lg:flex"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          <ul className="space-y-0.5">
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
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary-50 text-primary-dark'
                        : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700',
                      collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-primary" />
                    )}
                    <span className={cn(
                      'shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-stone-400 group-hover:text-stone-500'
                    )}>
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-stone-100 px-4 py-3">
          {!collapsed && (
            <p className="text-xs text-stone-400">
              Powered by StudioSync
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

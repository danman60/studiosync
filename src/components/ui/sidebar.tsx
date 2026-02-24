'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  ChevronDown,
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  items: NavLink[];
}

type NavEntry = NavLink | NavGroup;

function isGroup(e: NavEntry): e is NavGroup {
  return 'items' in e;
}

/* ------------------------------------------------------------------ */
/*  Nav definitions                                                    */
/* ------------------------------------------------------------------ */

const adminNav: NavEntry[] = [
  { label: 'Dashboard', href: '/admin', icon: <Home size={18} /> },
  {
    label: 'Schedule',
    icon: <Calendar size={18} />,
    items: [
      { label: 'Classes', href: '/admin/classes', icon: <BookOpen size={18} /> },
      { label: 'Seasons', href: '/admin/seasons', icon: <Calendar size={18} /> },
      { label: 'Calendar', href: '/admin/calendar', icon: <Calendar size={18} /> },
      { label: 'Private Lessons', href: '/admin/private-lessons', icon: <GraduationCap size={18} /> },
    ],
  },
  {
    label: 'Students',
    icon: <Users size={18} />,
    items: [
      { label: 'Families', href: '/admin/families', icon: <Users size={18} /> },
      { label: 'Enrollments', href: '/admin/enrollments', icon: <UserPlus size={18} /> },
      { label: 'Attendance', href: '/admin/attendance', icon: <CheckSquare size={18} /> },
      { label: 'Report Cards', href: '/admin/reports', icon: <Award size={18} /> },
    ],
  },
  {
    label: 'Money',
    icon: <CreditCard size={18} />,
    items: [
      { label: 'Billing', href: '/admin/billing', icon: <CreditCard size={18} /> },
      { label: 'Promo Codes', href: '/admin/promo-codes', icon: <Tag size={18} /> },
    ],
  },
  {
    label: 'Communication',
    icon: <MessageCircle size={18} />,
    items: [
      { label: 'Announcements', href: '/admin/announcements', icon: <Megaphone size={18} /> },
      { label: 'Messages', href: '/admin/messages', icon: <MessageCircle size={18} /> },
      { label: 'Scheduled', href: '/admin/scheduled', icon: <Send size={18} /> },
      { label: 'Templates', href: '/admin/templates', icon: <FileText size={18} /> },
    ],
  },
  {
    label: 'Media & Events',
    icon: <ImageIcon size={18} />,
    items: [
      { label: 'Media', href: '/admin/media', icon: <FolderOpen size={18} /> },
      { label: 'Events', href: '/admin/events', icon: <Ticket size={18} /> },
      { label: 'Waivers', href: '/admin/waivers', icon: <FileText size={18} /> },
    ],
  },
  {
    label: 'Studio',
    icon: <Settings size={18} />,
    items: [
      { label: 'Staff', href: '/admin/staff', icon: <GraduationCap size={18} /> },
      { label: 'Time Clock', href: '/admin/time-clock', icon: <Clock size={18} /> },
      { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={18} /> },
      { label: 'Settings', href: '/admin/settings', icon: <Settings size={18} /> },
    ],
  },
];

const instructorNav: NavEntry[] = [
  { label: 'Dashboard', href: '/instructor', icon: <Home size={18} /> },
  { label: 'My Classes', href: '/instructor/classes', icon: <BookOpen size={18} /> },
  { label: 'Attendance', href: '/instructor/attendance', icon: <CheckSquare size={18} /> },
  { label: 'Progress', href: '/instructor/progress', icon: <Award size={18} /> },
  { label: 'Calendar', href: '/instructor/calendar', icon: <Calendar size={18} /> },
  { label: 'Announcements', href: '/instructor/announcements', icon: <Megaphone size={18} /> },
  { label: 'Time Clock', href: '/instructor/time-clock', icon: <Clock size={18} /> },
];

const portalNav: NavEntry[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <Home size={18} /> },
  { label: 'Classes', href: '/classes', icon: <BookOpen size={18} /> },
  {
    label: 'My Family',
    icon: <Users size={18} />,
    items: [
      { label: 'My Students', href: '/dashboard/students', icon: <Users size={18} /> },
      { label: 'Attendance', href: '/dashboard/attendance', icon: <CheckSquare size={18} /> },
      { label: 'Progress', href: '/dashboard/progress', icon: <Award size={18} /> },
    ],
  },
  {
    label: 'Billing',
    icon: <CreditCard size={18} />,
    items: [
      { label: 'Invoices', href: '/dashboard/invoices', icon: <FileText size={18} /> },
      { label: 'Payments', href: '/dashboard/payments', icon: <CreditCard size={18} /> },
      { label: 'Waivers', href: '/dashboard/waivers', icon: <FileText size={18} /> },
    ],
  },
  {
    label: 'Updates',
    icon: <Megaphone size={18} />,
    items: [
      { label: 'Announcements', href: '/dashboard/announcements', icon: <Megaphone size={18} /> },
      { label: 'Messages', href: '/dashboard/messages', icon: <MessageCircle size={18} /> },
      { label: 'Events', href: '/dashboard/events', icon: <Ticket size={18} /> },
      { label: 'Media', href: '/dashboard/media', icon: <ImageIcon size={18} /> },
    ],
  },
  { label: 'Profile', href: '/dashboard/profile', icon: <Users size={18} /> },
];

/* ------------------------------------------------------------------ */
/*  Collapsible group                                                  */
/* ------------------------------------------------------------------ */

function NavSection({
  group,
  pathname,
  collapsed,
  onLinkClick,
}: {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
  onLinkClick: () => void;
}) {
  const hasActiveChild = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // If user hasn't toggled manually, follow active child state
  const open = manualOpen ?? hasActiveChild;

  const toggle = () => setManualOpen(open ? false : true);

  // Reset manual override when route changes
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setManualOpen(null); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [pathname]);

  const [height, setHeight] = useState<number | undefined>(open ? undefined : 0);

  useEffect(() => {
    if (!contentRef.current) return;
    if (open) {
      setHeight(contentRef.current.scrollHeight);
      const timer = setTimeout(() => setHeight(undefined), 200);
      return () => clearTimeout(timer);
    } else {
      setHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [open]);

  if (collapsed) {
    // In collapsed mode, show only the group icon (first child link on click)
    return (
      <li>
        <Link
          href={group.items[0].href}
          onClick={onLinkClick}
          className={cn(
            'group flex items-center justify-center rounded-xl px-2 py-2.5 transition-all duration-150',
            hasActiveChild
              ? 'bg-primary-50 text-primary-dark'
              : 'text-stone-400 hover:bg-stone-50 hover:text-stone-500'
          )}
          title={group.label}
        >
          {hasActiveChild && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-primary" />
          )}
          <span className="shrink-0">{group.icon}</span>
        </Link>
      </li>
    );
  }

  return (
    <li>
      {/* Section header */}
      <button
        onClick={toggle}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold tracking-wide transition-all duration-150',
          hasActiveChild
            ? 'text-primary-dark'
            : 'text-stone-400 hover:text-stone-600'
        )}
      >
        <span className="shrink-0">{group.icon}</span>
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Collapsible children */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: height !== undefined ? `${height}px` : 'auto' }}
      >
        <ul className="ml-3 space-y-0.5 border-l border-stone-100 pl-3 pt-0.5 pb-1">
          {group.items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onLinkClick}
                  className={cn(
                    'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary-50 text-primary-dark'
                      : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                  )}
                >
                  <span
                    className={cn(
                      'shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-stone-400 group-hover:text-stone-500'
                    )}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

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

  const entries =
    variant === 'admin'
      ? adminNav
      : variant === 'instructor'
        ? instructorNav
        : portalNav;

  const closeMobile = () => setMobileOpen(false);

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
          onClick={closeMobile}
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
            onClick={closeMobile}
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

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          <ul className="space-y-0.5">
            {entries.map((entry) => {
              if (isGroup(entry)) {
                return (
                  <NavSection
                    key={entry.label}
                    group={entry}
                    pathname={pathname}
                    collapsed={collapsed}
                    onLinkClick={closeMobile}
                  />
                );
              }

              // Top-level link (Dashboard, etc.)
              const isActive =
                pathname === entry.href ||
                (entry.href !== '/admin' &&
                  entry.href !== '/dashboard' &&
                  entry.href !== '/instructor' &&
                  pathname.startsWith(entry.href));

              return (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    onClick={closeMobile}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary-50 text-primary-dark'
                        : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700',
                      collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? entry.label : undefined}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-primary" />
                    )}
                    <span
                      className={cn(
                        'shrink-0 transition-colors',
                        isActive ? 'text-primary' : 'text-stone-400 group-hover:text-stone-500'
                      )}
                    >
                      {entry.icon}
                    </span>
                    {!collapsed && <span>{entry.label}</span>}
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

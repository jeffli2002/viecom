'use client';

import {
  CreditCard,
  DollarSign,
  Gift,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Subscriptions',
    href: '/admin/subscriptions',
    icon: CreditCard,
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    icon: DollarSign,
  },
  {
    name: 'Credit Packs',
    href: '/admin/credit-packs',
    icon: Gift,
  },
  {
    name: 'Credits (积分)',
    href: '/admin/credits',
    icon: Zap,
  },
  {
    name: 'Publish Audit',
    href: '/admin/publish',
    icon: Sparkles,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4 sticky top-0">
      <div className="mb-6">
        <h2 className="font-bold text-xl text-slate-900 dark:text-white">Viecom Admin</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Management Portal</p>
      </div>

      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-teal-100 dark:bg-teal-900/30 text-slate-700 dark:text-slate-300 font-medium'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

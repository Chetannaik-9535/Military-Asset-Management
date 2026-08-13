// src/components/Sidebar.jsx
// Menu items are filtered per the RBAC matrix documented in the README.
// Each item declares which roles may see it; everything else is hidden
// entirely rather than shown-then-disabled.

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PackagePlus,
  ArrowLeftRight,
  ClipboardList,
  Building2,
  UserCog,
  ScrollText,
  ShieldHalf,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
  { to: '/purchases', label: 'Purchases', icon: PackagePlus, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
  { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
  { to: '/assignments', label: 'Assignments & Expenditures', icon: ClipboardList, roles: ['ADMIN', 'BASE_COMMANDER'] },
  { to: '/bases', label: 'Bases', icon: Building2, roles: ['ADMIN'] },
  { to: '/users', label: 'Personnel Accounts', icon: UserCog, roles: ['ADMIN'] },
  { to: '/audit-log', label: 'Audit Trail', icon: ScrollText, roles: ['ADMIN'] },
];

const Sidebar = () => {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className="w-64 shrink-0 border-r border-ops-border bg-ops-panel flex flex-col h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-ops-border flex items-center gap-3">
        <div className="w-9 h-9 border-2 border-ops-amber flex items-center justify-center shrink-0">
          <ShieldHalf size={18} className="text-ops-amber" />
        </div>
        <div>
          <p className="font-display font-bold text-sm tracking-wide leading-tight">MAMS</p>
          <p className="eyebrow leading-tight">Asset Command</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <p className="eyebrow px-5 mb-2">Operations</p>
        <ul>
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-2.5 text-sm border-l-2 transition-colors ${
                    isActive
                      ? 'border-ops-amber bg-ops-raised text-ops-amber font-medium'
                      : 'border-transparent text-ops-muted hover:text-ops-paper hover:bg-ops-raised/50'
                  }`
                }
              >
                <Icon size={16} strokeWidth={2} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-5 py-4 border-t border-ops-border">
        <p className="eyebrow mb-1">System Status</p>
        <div className="flex items-center gap-2 text-xs text-ops-moss font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-ops-moss animate-pulse" />
          Online
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

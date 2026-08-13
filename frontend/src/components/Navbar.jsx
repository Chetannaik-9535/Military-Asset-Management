// src/components/Navbar.jsx

import React, { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const ROLE_LABEL = {
  ADMIN: 'Administrator',
  BASE_COMMANDER: 'Base Commander',
  LOGISTICS_OFFICER: 'Logistics Officer',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-ops-border bg-ops-panel/60 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <p className="text-sm font-medium">{user?.fullName}</p>
        <p className="eyebrow">
          {ROLE_LABEL[user?.role] || user?.role}
          {user?.base ? ` — ${user.base.name}` : user?.role === 'ADMIN' ? ' — All Bases' : ''}
        </p>
      </div>

      <div className="flex items-center gap-6">
        <p className="font-mono text-xs text-ops-muted hidden sm:block">
          {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
          {now.toLocaleTimeString('en-IN', { hour12: false })}
        </p>
        <button onClick={handleLogout} className="btn-secondary !px-3 !py-2 text-xs" aria-label="Log out">
          <LogOut size={14} />
          Log Out
        </button>
      </div>
    </header>
  );
};

export default Navbar;

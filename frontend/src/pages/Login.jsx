// src/pages/Login.jsx

import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldHalf, Lock, User, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  const { user, login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-ops-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient coordinate readout — quiet atmosphere, not decoration for its own sake */}
      <div className="absolute inset-x-0 top-0 flex justify-between px-8 py-6 font-mono text-[11px] text-ops-border pointer-events-none select-none">
        <span>SECTOR-GRID // 26.9124N 75.7873E</span>
        <span>MAMS-CORE v1.0</span>
      </div>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 border-2 border-ops-amber flex items-center justify-center mb-4">
            <ShieldHalf size={28} className="text-ops-amber" />
          </div>
          <h1 className="font-display font-bold text-2xl tracking-wide">MAMS</h1>
          <p className="eyebrow mt-1">Military Asset Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="panel p-6 space-y-5">
          <div>
            <label htmlFor="username" className="field-label">Username</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ops-muted" />
              <input
                id="username"
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="field-input pl-9"
                placeholder="e.g. commander_alpha"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="field-label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ops-muted" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input pl-9"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-2 bg-ops-rust/10 border border-ops-rust/40 text-ops-rust text-sm px-3 py-2.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-ops-muted mt-6 font-mono">
          Access is role-restricted and every session is logged.
        </p>
      </div>
    </div>
  );
};

export default Login;

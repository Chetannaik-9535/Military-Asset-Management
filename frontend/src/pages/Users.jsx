// src/pages/Users.jsx
// ADMIN-only: onboard new accounts and view the personnel roster.

import React, { useEffect, useState } from 'react';
import { UserCog } from 'lucide-react';
import AppLayout from '../components/AppLayout.jsx';
import api from '../services/api.js';
import { useLookups } from '../hooks/useLookups.js';

const emptyForm = { username: '', password: '', fullName: '', role: 'BASE_COMMANDER', baseId: '' };

const ROLE_STYLES = {
  ADMIN: 'border-ops-amber text-ops-amber',
  BASE_COMMANDER: 'border-ops-steel text-ops-steel',
  LOGISTICS_OFFICER: 'border-ops-moss text-ops-moss',
};

const Users = () => {
  const { bases } = useLookups();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/users', {
        ...form,
        baseId: form.role === 'ADMIN' ? undefined : Number(form.baseId),
      });
      setForm(emptyForm);
      await loadUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <p className="eyebrow">Access Control</p>
        <h1 className="font-display font-bold text-2xl">Personnel Accounts</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <form onSubmit={handleSubmit} className="panel p-5 h-fit space-y-4">
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
            <UserCog size={16} className="text-ops-amber" />
            Onboard Account
          </h2>

          <div>
            <label className="field-label">Full Name</label>
            <input type="text" required className="field-input" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          </div>

          <div>
            <label className="field-label">Username</label>
            <input type="text" required className="field-input" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
          </div>

          <div>
            <label className="field-label">Temporary Password</label>
            <input type="text" required minLength={8} className="field-input" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </div>

          <div>
            <label className="field-label">Role</label>
            <select className="field-input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="BASE_COMMANDER">Base Commander</option>
              <option value="LOGISTICS_OFFICER">Logistics Officer</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          {form.role !== 'ADMIN' && (
            <div>
              <label className="field-label">Assigned Base</label>
              <select required className="field-input" value={form.baseId} onChange={(e) => setForm((f) => ({ ...f, baseId: e.target.value }))}>
                <option value="">Select base…</option>
                {bases.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {formError && <p className="text-sm text-ops-rust">{formError}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <div className="panel overflow-hidden">
          <div className="px-5 py-4 border-b border-ops-border">
            <p className="eyebrow">Roster</p>
            <h2 className="font-display font-semibold">All Accounts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ops-border text-left">
                  <th className="px-5 py-3 eyebrow font-normal">Name</th>
                  <th className="px-5 py-3 eyebrow font-normal">Username</th>
                  <th className="px-5 py-3 eyebrow font-normal">Role</th>
                  <th className="px-5 py-3 eyebrow font-normal">Base</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-ops-muted font-mono text-xs">Loading…</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-ops-border/60 hover:bg-ops-raised/40">
                      <td className="px-5 py-3">{u.fullName}</td>
                      <td className="px-5 py-3 font-mono text-xs text-ops-muted">{u.username}</td>
                      <td className="px-5 py-3">
                        <span className={`badge ${ROLE_STYLES[u.role]}`}>{u.role.replace('_', ' ')}</span>
                      </td>
                      <td className="px-5 py-3 text-ops-muted">{u.base?.name || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Users;

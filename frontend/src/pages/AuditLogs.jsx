// src/pages/AuditLogs.jsx
// ADMIN-only: full system audit trail, filterable by action type.

import React, { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import AppLayout from '../components/AppLayout.jsx';
import api from '../services/api.js';

const ACTIONS = ['PURCHASE', 'TRANSFER', 'ASSIGNMENT', 'EXPENDITURE', 'LOGIN', 'USER_CREATED'];

const ACTION_STYLES = {
  PURCHASE: 'border-ops-moss text-ops-moss',
  TRANSFER: 'border-ops-steel text-ops-steel',
  ASSIGNMENT: 'border-ops-amber text-ops-amber',
  EXPENDITURE: 'border-ops-rust text-ops-rust',
  LOGIN: 'border-ops-muted text-ops-muted',
  USER_CREATED: 'border-ops-paper text-ops-paper',
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const loadLogs = async (action) => {
    setLoading(true);
    try {
      const { data } = await api.get('/audit-logs', { params: { pageSize: 50, ...(action && { action }) } });
      setLogs(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(actionFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter]);

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="eyebrow">Accountability</p>
          <h1 className="font-display font-bold text-2xl">Audit Trail</h1>
        </div>
        <select className="field-input !w-56" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="">All actions</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className="panel overflow-hidden">
        <div className="px-5 py-4 border-b border-ops-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText size={16} className="text-ops-amber" />
            <h2 className="font-display font-semibold">System Log</h2>
          </div>
          <span className="text-xs font-mono text-ops-muted">{total} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ops-border text-left">
                <th className="px-5 py-3 eyebrow font-normal">Timestamp</th>
                <th className="px-5 py-3 eyebrow font-normal">Action</th>
                <th className="px-5 py-3 eyebrow font-normal">User</th>
                <th className="px-5 py-3 eyebrow font-normal">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-ops-muted font-mono text-xs">Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-ops-muted font-mono text-xs">No matching audit entries.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-ops-border/60 hover:bg-ops-raised/40 align-top">
                    <td className="px-5 py-3 font-mono text-xs text-ops-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge ${ACTION_STYLES[log.action] || ''}`}>{log.action.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">{log.user?.fullName || 'System'}</td>
                    <td className="px-5 py-3 text-ops-muted">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default AuditLogs;

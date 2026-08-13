// src/pages/Dashboard.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { Filter } from 'lucide-react';
import AppLayout from '../components/AppLayout.jsx';
import StatCard from '../components/StatCard.jsx';
import NetMoveModal from '../components/NetMoveModal.jsx';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLookups } from '../hooks/useLookups.js';

const Dashboard = () => {
  const { user } = useAuth();
  const { bases, equipmentTypes } = useLookups();
  const isAdmin = user.role === 'ADMIN';

  const [filters, setFilters] = useState({ baseId: '', equipmentTypeId: '', startDate: '', endDate: '' });
  const [metrics, setMetrics] = useState(null);
  const [byBase, setByBase] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const { data } = await api.get('/assets/dashboard', { params });
      setMetrics(data);

      if (isAdmin || user.role === 'BASE_COMMANDER') {
        const byBaseRes = await api.get('/assets/by-base');
        setByBase(byBaseRes.data);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin, user.role]);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (e) => {
    e.preventDefault();
    loadDashboard();
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <p className="eyebrow">Situation Report</p>
        <h1 className="font-display font-bold text-2xl">Inventory Dashboard</h1>
      </div>

      {/* Filters */}
      <form onSubmit={applyFilters} className="panel p-4 mb-6 flex flex-wrap items-end gap-4">
        {isAdmin && (
          <div className="min-w-[160px]">
            <label className="field-label">Base</label>
            <select
              className="field-input"
              value={filters.baseId}
              onChange={(e) => setFilters((f) => ({ ...f, baseId: e.target.value }))}
            >
              <option value="">All Bases</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="min-w-[180px]">
          <label className="field-label">Equipment Type</label>
          <select
            className="field-input"
            value={filters.equipmentTypeId}
            onChange={(e) => setFilters((f) => ({ ...f, equipmentTypeId: e.target.value }))}
          >
            <option value="">All Equipment</option>
            {equipmentTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[150px]">
          <label className="field-label">Start Date</label>
          <input
            type="date"
            className="field-input"
            value={filters.startDate}
            onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
          />
        </div>

        <div className="min-w-[150px]">
          <label className="field-label">End Date</label>
          <input
            type="date"
            className="field-input"
            value={filters.endDate}
            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
          />
        </div>

        <button type="submit" className="btn-primary">
          <Filter size={14} />
          Apply
        </button>
      </form>

      {loading || !metrics ? (
        <div className="panel p-10 text-center text-ops-muted font-mono text-sm">Loading metrics…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Opening Balance" value={metrics.openingBalance} accent="steel" />
            <StatCard
              label="Net Movement (tap for detail)"
              value={metrics.netMovement}
              accent="amber"
              onClick={() => setShowModal(true)}
              hint="Purchases + Transfers In − Transfers Out"
            />
            <StatCard label="Assigned" value={metrics.assigned} accent="rust" />
            <StatCard label="Closing Balance" value={metrics.closingBalance} accent="moss" />
          </div>

          {byBase.length > 0 && (
            <div className="panel">
              <div className="px-5 py-4 border-b border-ops-border">
                <p className="eyebrow">Current Holdings</p>
                <h2 className="font-display font-semibold">Assets by Base</h2>
              </div>
              <div className="divide-y divide-ops-border">
                {byBase.map((base) => (
                  <div key={base.baseId} className="px-5 py-4">
                    <p className="text-sm font-medium mb-3">{base.baseName}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {base.rows.map((r) => (
                        <div key={r.equipmentTypeId} className="bg-ops-black border border-ops-border px-3 py-2">
                          <p className="text-xs text-ops-muted truncate">{r.name}</p>
                          <p className="font-mono font-semibold">
                            {r.balance.toLocaleString('en-IN')} <span className="text-xs text-ops-muted">{r.unit}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showModal && metrics && <NetMoveModal metrics={metrics} onClose={() => setShowModal(false)} />}
    </AppLayout>
  );
};

export default Dashboard;

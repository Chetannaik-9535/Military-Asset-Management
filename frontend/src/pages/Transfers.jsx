// src/pages/Transfers.jsx

import React, { useEffect, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import AppLayout from '../components/AppLayout.jsx';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLookups } from '../hooks/useLookups.js';

const emptyForm = { sourceBaseId: '', destinationBaseId: '', equipmentTypeId: '', quantity: '' };

const STATUS_STYLES = {
  COMPLETED: 'border-ops-moss text-ops-moss',
  PENDING: 'border-ops-amber text-ops-amber',
  IN_TRANSIT: 'border-ops-steel text-ops-steel',
  CANCELLED: 'border-ops-rust text-ops-rust',
};

const Transfers = () => {
  const { user } = useAuth();
  const { bases, equipmentTypes } = useLookups();
  const isAdmin = user.role === 'ADMIN';

  const [form, setForm] = useState(emptyForm);
  const [transfers, setTransfers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!isAdmin && user.base) {
      setForm((f) => ({ ...f, sourceBaseId: String(user.base.id) }));
    }
  }, [isAdmin, user.base]);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const params = isAdmin ? { pageSize: 25 } : { baseId: user.base?.id, pageSize: 25 };
      const { data } = await api.get('/transfers', { params });
      setTransfers(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/transfers', {
        sourceBaseId: Number(form.sourceBaseId),
        destinationBaseId: Number(form.destinationBaseId),
        equipmentTypeId: Number(form.equipmentTypeId),
        quantity: Number(form.quantity),
      });
      setForm((f) => ({ ...emptyForm, sourceBaseId: isAdmin ? '' : f.sourceBaseId }));
      await loadTransfers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to initiate transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <p className="eyebrow">Cross-Base Movement</p>
        <h1 className="font-display font-bold text-2xl">Transfers</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <form onSubmit={handleSubmit} className="panel p-5 h-fit space-y-4">
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
            <ArrowLeftRight size={16} className="text-ops-amber" />
            Initiate Transfer
          </h2>

          <div>
            <label className="field-label">Source Base</label>
            <select
              required
              disabled={!isAdmin}
              className="field-input disabled:opacity-60"
              value={form.sourceBaseId}
              onChange={(e) => setForm((f) => ({ ...f, sourceBaseId: e.target.value }))}
            >
              <option value="">Select source…</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Destination Base</label>
            <select
              required
              className="field-input"
              value={form.destinationBaseId}
              onChange={(e) => setForm((f) => ({ ...f, destinationBaseId: e.target.value }))}
            >
              <option value="">Select destination…</option>
              {bases.filter((b) => String(b.id) !== form.sourceBaseId).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Equipment Type</label>
            <select
              required
              className="field-input"
              value={form.equipmentTypeId}
              onChange={(e) => setForm((f) => ({ ...f, equipmentTypeId: e.target.value }))}
            >
              <option value="">Select equipment…</option>
              {equipmentTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Quantity</label>
            <input
              type="number"
              min="1"
              required
              className="field-input"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
          </div>

          {formError && <p className="text-sm text-ops-rust">{formError}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Processing…' : 'Execute Transfer'}
          </button>
          <p className="text-xs text-ops-muted">
            Transfers run inside a database transaction: stock is checked and moved atomically, so a failed check never leaves a partial record.
          </p>
        </form>

        <div className="panel overflow-hidden">
          <div className="px-5 py-4 border-b border-ops-border flex items-center justify-between">
            <div>
              <p className="eyebrow">History</p>
              <h2 className="font-display font-semibold">Movement Log</h2>
            </div>
            <span className="text-xs font-mono text-ops-muted">{total} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ops-border text-left">
                  <th className="px-5 py-3 eyebrow font-normal">Date</th>
                  <th className="px-5 py-3 eyebrow font-normal">Route</th>
                  <th className="px-5 py-3 eyebrow font-normal">Equipment</th>
                  <th className="px-5 py-3 eyebrow font-normal text-right">Qty</th>
                  <th className="px-5 py-3 eyebrow font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-ops-muted font-mono text-xs">Loading…</td></tr>
                ) : transfers.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-ops-muted font-mono text-xs">No transfers recorded yet.</td></tr>
                ) : (
                  transfers.map((t) => (
                    <tr key={t.id} className="border-b border-ops-border/60 hover:bg-ops-raised/40">
                      <td className="px-5 py-3 font-mono text-xs text-ops-muted whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {t.sourceBase.name} <span className="text-ops-muted">→</span> {t.destinationBase.name}
                      </td>
                      <td className="px-5 py-3">{t.equipmentType.name}</td>
                      <td className="px-5 py-3 text-right font-mono">{t.quantity.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3">
                        <span className={`badge ${STATUS_STYLES[t.status] || ''}`}>{t.status}</span>
                      </td>
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

export default Transfers;

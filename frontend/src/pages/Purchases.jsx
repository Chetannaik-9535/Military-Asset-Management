// src/pages/Purchases.jsx

import React, { useEffect, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import AppLayout from '../components/AppLayout.jsx';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLookups } from '../hooks/useLookups.js';

const emptyForm = { baseId: '', equipmentTypeId: '', quantity: '', unitCost: '', supplier: '' };

const Purchases = () => {
  const { user } = useAuth();
  const { bases, equipmentTypes } = useLookups();
  const isAdmin = user.role === 'ADMIN';

  const [form, setForm] = useState(emptyForm);
  const [purchases, setPurchases] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!isAdmin && user.base) {
      setForm((f) => ({ ...f, baseId: String(user.base.id) }));
    }
  }, [isAdmin, user.base]);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/purchases', { params: { pageSize: 25 } });
      setPurchases(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/purchases', {
        baseId: Number(form.baseId),
        equipmentTypeId: Number(form.equipmentTypeId),
        quantity: Number(form.quantity),
        unitCost: form.unitCost ? Number(form.unitCost) : undefined,
        supplier: form.supplier || undefined,
      });
      setForm((f) => ({ ...emptyForm, baseId: isAdmin ? '' : f.baseId }));
      await loadPurchases();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record purchase.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <p className="eyebrow">Incoming Stock</p>
        <h1 className="font-display font-bold text-2xl">Purchases</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="panel p-5 h-fit space-y-4">
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
            <PackagePlus size={16} className="text-ops-amber" />
            Log New Purchase
          </h2>

          {isAdmin && (
            <div>
              <label className="field-label">Base</label>
              <select
                required
                className="field-input"
                value={form.baseId}
                onChange={(e) => setForm((f) => ({ ...f, baseId: e.target.value }))}
              >
                <option value="">Select base…</option>
                {bases.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

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

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="field-label">Unit Cost (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="field-input"
                value={form.unitCost}
                onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="field-label">Supplier</label>
            <input
              type="text"
              className="field-input"
              value={form.supplier}
              onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
              placeholder="Optional"
            />
          </div>

          {formError && <p className="text-sm text-ops-rust">{formError}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Recording…' : 'Record Purchase'}
          </button>
        </form>

        {/* History table */}
        <div className="panel overflow-hidden">
          <div className="px-5 py-4 border-b border-ops-border flex items-center justify-between">
            <div>
              <p className="eyebrow">History</p>
              <h2 className="font-display font-semibold">Purchase Log</h2>
            </div>
            <span className="text-xs font-mono text-ops-muted">{total} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ops-border text-left">
                  <th className="px-5 py-3 eyebrow font-normal">Date</th>
                  <th className="px-5 py-3 eyebrow font-normal">Base</th>
                  <th className="px-5 py-3 eyebrow font-normal">Equipment</th>
                  <th className="px-5 py-3 eyebrow font-normal text-right">Qty</th>
                  <th className="px-5 py-3 eyebrow font-normal">Supplier</th>
                  <th className="px-5 py-3 eyebrow font-normal">Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-ops-muted font-mono text-xs">Loading…</td></tr>
                ) : purchases.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-ops-muted font-mono text-xs">No purchases recorded yet.</td></tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="border-b border-ops-border/60 hover:bg-ops-raised/40">
                      <td className="px-5 py-3 font-mono text-xs text-ops-muted whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-5 py-3">{p.base.name}</td>
                      <td className="px-5 py-3">{p.equipmentType.name}</td>
                      <td className="px-5 py-3 text-right font-mono">{p.quantity.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 text-ops-muted">{p.supplier || '—'}</td>
                      <td className="px-5 py-3 text-ops-muted">{p.recordedBy.fullName}</td>
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

export default Purchases;

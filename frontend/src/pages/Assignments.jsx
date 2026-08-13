// src/pages/Assignments.jsx
// Combines personnel assignment tracking and expenditure (consumed asset)
// reporting behind a tab switcher, matching the spec's single-page brief.

import React, { useEffect, useState } from 'react';
import { Users2, Flame, Undo2 } from 'lucide-react';
import AppLayout from '../components/AppLayout.jsx';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLookups } from '../hooks/useLookups.js';

const emptyAssignForm = { baseId: '', equipmentTypeId: '', quantity: '', personnelName: '', personnelServiceId: '' };
const emptyExpendForm = { baseId: '', equipmentTypeId: '', quantity: '', reason: '' };

const Assignments = () => {
  const { user } = useAuth();
  const { bases, equipmentTypes } = useLookups();
  const isAdmin = user.role === 'ADMIN';

  const [tab, setTab] = useState('assignments');

  const [assignForm, setAssignForm] = useState(emptyAssignForm);
  const [expendForm, setExpendForm] = useState(emptyExpendForm);
  const [assignments, setAssignments] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!isAdmin && user.base) {
      const baseId = String(user.base.id);
      setAssignForm((f) => ({ ...f, baseId }));
      setExpendForm((f) => ({ ...f, baseId }));
    }
  }, [isAdmin, user.base]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignRes, expendRes] = await Promise.all([
        api.get('/assignments', { params: { pageSize: 25 } }),
        api.get('/expenditures', { params: { pageSize: 25 } }),
      ]);
      setAssignments(assignRes.data.data);
      setExpenditures(expendRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/assignments', {
        baseId: Number(assignForm.baseId),
        equipmentTypeId: Number(assignForm.equipmentTypeId),
        quantity: Number(assignForm.quantity),
        personnelName: assignForm.personnelName,
        personnelServiceId: assignForm.personnelServiceId || undefined,
      });
      setAssignForm((f) => ({ ...emptyAssignForm, baseId: isAdmin ? '' : f.baseId }));
      await loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpendSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/expenditures', {
        baseId: Number(expendForm.baseId),
        equipmentTypeId: Number(expendForm.equipmentTypeId),
        quantity: Number(expendForm.quantity),
        reason: expendForm.reason,
      });
      setExpendForm((f) => ({ ...emptyExpendForm, baseId: isAdmin ? '' : f.baseId }));
      await loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record expenditure.');
    } finally {
      setSubmitting(false);
    }
  };

  const markReturned = async (id) => {
    await api.patch(`/assignments/${id}/return`);
    await loadData();
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <p className="eyebrow">Personnel & Consumption</p>
        <h1 className="font-display font-bold text-2xl">Assignments & Expenditures</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setTab('assignments'); setFormError(null); }}
          className={`px-4 py-2 text-sm font-display font-semibold uppercase tracking-wide border-b-2 transition-colors ${
            tab === 'assignments' ? 'border-ops-amber text-ops-amber' : 'border-transparent text-ops-muted hover:text-ops-paper'
          }`}
        >
          Assignments
        </button>
        <button
          onClick={() => { setTab('expenditures'); setFormError(null); }}
          className={`px-4 py-2 text-sm font-display font-semibold uppercase tracking-wide border-b-2 transition-colors ${
            tab === 'expenditures' ? 'border-ops-amber text-ops-amber' : 'border-transparent text-ops-muted hover:text-ops-paper'
          }`}
        >
          Expenditures
        </button>
      </div>

      {tab === 'assignments' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          <form onSubmit={handleAssignSubmit} className="panel p-5 h-fit space-y-4">
            <h2 className="font-display font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
              <Users2 size={16} className="text-ops-amber" />
              Assign to Personnel
            </h2>

            {isAdmin && (
              <div>
                <label className="field-label">Base</label>
                <select required className="field-input" value={assignForm.baseId} onChange={(e) => setAssignForm((f) => ({ ...f, baseId: e.target.value }))}>
                  <option value="">Select base…</option>
                  {bases.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="field-label">Equipment Type</label>
              <select required className="field-input" value={assignForm.equipmentTypeId} onChange={(e) => setAssignForm((f) => ({ ...f, equipmentTypeId: e.target.value }))}>
                <option value="">Select equipment…</option>
                {equipmentTypes.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>)}
              </select>
            </div>

            <div>
              <label className="field-label">Quantity</label>
              <input type="number" min="1" required className="field-input" value={assignForm.quantity} onChange={(e) => setAssignForm((f) => ({ ...f, quantity: e.target.value }))} />
            </div>

            <div>
              <label className="field-label">Personnel / Unit Name</label>
              <input type="text" required className="field-input" value={assignForm.personnelName} onChange={(e) => setAssignForm((f) => ({ ...f, personnelName: e.target.value }))} placeholder="e.g. 2nd Infantry Platoon" />
            </div>

            <div>
              <label className="field-label">Service ID</label>
              <input type="text" className="field-input" value={assignForm.personnelServiceId} onChange={(e) => setAssignForm((f) => ({ ...f, personnelServiceId: e.target.value }))} placeholder="Optional" />
            </div>

            {formError && <p className="text-sm text-ops-rust">{formError}</p>}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Assigning…' : 'Record Assignment'}
            </button>
          </form>

          <div className="panel overflow-hidden">
            <div className="px-5 py-4 border-b border-ops-border">
              <p className="eyebrow">Active & Returned</p>
              <h2 className="font-display font-semibold">Assignment Log</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ops-border text-left">
                    <th className="px-5 py-3 eyebrow font-normal">Personnel</th>
                    <th className="px-5 py-3 eyebrow font-normal">Equipment</th>
                    <th className="px-5 py-3 eyebrow font-normal text-right">Qty</th>
                    <th className="px-5 py-3 eyebrow font-normal">Status</th>
                    <th className="px-5 py-3 eyebrow font-normal" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-ops-muted font-mono text-xs">Loading…</td></tr>
                  ) : assignments.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-ops-muted font-mono text-xs">No assignments recorded yet.</td></tr>
                  ) : (
                    assignments.map((a) => (
                      <tr key={a.id} className="border-b border-ops-border/60 hover:bg-ops-raised/40">
                        <td className="px-5 py-3">
                          {a.personnelName}
                          {a.personnelServiceId && <span className="text-ops-muted text-xs block font-mono">{a.personnelServiceId}</span>}
                        </td>
                        <td className="px-5 py-3">{a.equipmentType.name}</td>
                        <td className="px-5 py-3 text-right font-mono">{a.quantity.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3">
                          <span className={`badge ${a.status === 'ACTIVE' ? 'border-ops-amber text-ops-amber' : 'border-ops-moss text-ops-moss'}`}>{a.status}</span>
                        </td>
                        <td className="px-5 py-3">
                          {a.status === 'ACTIVE' && (
                            <button onClick={() => markReturned(a.id)} className="text-ops-muted hover:text-ops-amber transition-colors" title="Mark as returned">
                              <Undo2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          <form onSubmit={handleExpendSubmit} className="panel p-5 h-fit space-y-4">
            <h2 className="font-display font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
              <Flame size={16} className="text-ops-amber" />
              Report Expenditure
            </h2>

            {isAdmin && (
              <div>
                <label className="field-label">Base</label>
                <select required className="field-input" value={expendForm.baseId} onChange={(e) => setExpendForm((f) => ({ ...f, baseId: e.target.value }))}>
                  <option value="">Select base…</option>
                  {bases.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="field-label">Equipment Type</label>
              <select required className="field-input" value={expendForm.equipmentTypeId} onChange={(e) => setExpendForm((f) => ({ ...f, equipmentTypeId: e.target.value }))}>
                <option value="">Select equipment…</option>
                {equipmentTypes.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>)}
              </select>
            </div>

            <div>
              <label className="field-label">Quantity</label>
              <input type="number" min="1" required className="field-input" value={expendForm.quantity} onChange={(e) => setExpendForm((f) => ({ ...f, quantity: e.target.value }))} />
            </div>

            <div>
              <label className="field-label">Reason</label>
              <input type="text" required className="field-input" value={expendForm.reason} onChange={(e) => setExpendForm((f) => ({ ...f, reason: e.target.value }))} placeholder="e.g. Live-fire training exercise" />
            </div>

            {formError && <p className="text-sm text-ops-rust">{formError}</p>}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Recording…' : 'Record Expenditure'}
            </button>
          </form>

          <div className="panel overflow-hidden">
            <div className="px-5 py-4 border-b border-ops-border">
              <p className="eyebrow">Consumed Stock</p>
              <h2 className="font-display font-semibold">Expenditure Log</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ops-border text-left">
                    <th className="px-5 py-3 eyebrow font-normal">Date</th>
                    <th className="px-5 py-3 eyebrow font-normal">Equipment</th>
                    <th className="px-5 py-3 eyebrow font-normal text-right">Qty</th>
                    <th className="px-5 py-3 eyebrow font-normal">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-ops-muted font-mono text-xs">Loading…</td></tr>
                  ) : expenditures.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-ops-muted font-mono text-xs">No expenditures recorded yet.</td></tr>
                  ) : (
                    expenditures.map((e) => (
                      <tr key={e.id} className="border-b border-ops-border/60 hover:bg-ops-raised/40">
                        <td className="px-5 py-3 font-mono text-xs text-ops-muted whitespace-nowrap">{new Date(e.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-5 py-3">{e.equipmentType.name}</td>
                        <td className="px-5 py-3 text-right font-mono">{e.quantity.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3 text-ops-muted">{e.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Assignments;

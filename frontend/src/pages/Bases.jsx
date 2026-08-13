// src/pages/Bases.jsx
// ADMIN-only: create and view bases.

import React, { useEffect, useState } from 'react';
import { Building2, MapPin } from 'lucide-react';
import AppLayout from '../components/AppLayout.jsx';
import api from '../services/api.js';

const emptyForm = { name: '', location: '' };

const Bases = () => {
  const [bases, setBases] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadBases = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bases');
      setBases(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBases();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/bases', form);
      setForm(emptyForm);
      await loadBases();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create base.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <p className="eyebrow">Installations</p>
        <h1 className="font-display font-bold text-2xl">Bases</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <form onSubmit={handleSubmit} className="panel p-5 h-fit space-y-4">
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
            <Building2 size={16} className="text-ops-amber" />
            Register New Base
          </h2>

          <div>
            <label className="field-label">Name</label>
            <input
              type="text"
              required
              className="field-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Fort Delta"
            />
          </div>

          <div>
            <label className="field-label">Location</label>
            <input
              type="text"
              required
              className="field-input"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Sikkim Sector, India"
            />
          </div>

          {formError && <p className="text-sm text-ops-rust">{formError}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Registering…' : 'Register Base'}
          </button>
        </form>

        <div className="panel overflow-hidden">
          <div className="px-5 py-4 border-b border-ops-border">
            <p className="eyebrow">Registry</p>
            <h2 className="font-display font-semibold">All Bases</h2>
          </div>
          {loading ? (
            <p className="px-5 py-8 text-center text-ops-muted font-mono text-xs">Loading…</p>
          ) : (
            <div className="divide-y divide-ops-border">
              {bases.map((b) => (
                <div key={b.id} className="px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 border border-ops-border flex items-center justify-center shrink-0">
                    <Building2 size={16} className="text-ops-amber" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{b.name}</p>
                    <p className="text-xs text-ops-muted flex items-center gap-1">
                      <MapPin size={11} /> {b.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Bases;

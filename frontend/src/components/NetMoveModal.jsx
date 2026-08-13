// src/components/NetMoveModal.jsx
// Interactive pop-up showing the Purchases / Transfers In / Transfers Out
// breakdown behind the dashboard's Net Movement figure.

import React, { useEffect, useRef } from 'react';
import { X, ArrowDownToLine, ArrowUpFromLine, PackagePlus } from 'lucide-react';

const NetMoveModal = ({ metrics, onClose }) => {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    closeBtnRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows = [
    { label: 'Purchases', value: metrics.purchases, sign: '+', icon: PackagePlus, color: 'text-ops-moss' },
    { label: 'Transfers In', value: metrics.transfersIn, sign: '+', icon: ArrowDownToLine, color: 'text-ops-moss' },
    { label: 'Transfers Out', value: metrics.transfersOut, sign: '-', icon: ArrowUpFromLine, color: 'text-ops-rust' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="panel w-full max-w-md shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="net-move-title">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ops-border">
          <div>
            <p className="eyebrow">Movement Ledger</p>
            <h2 id="net-move-title" className="font-display font-semibold text-lg">Net Movement Breakdown</h2>
          </div>
          <button ref={closeBtnRef} onClick={onClose} className="text-ops-muted hover:text-ops-paper transition-colors" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {rows.map(({ label, value, sign, icon: Icon, color }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-ops-border/60">
              <div className="flex items-center gap-3 text-sm text-ops-paper">
                <Icon size={16} className="text-ops-muted" />
                {label}
              </div>
              <span className={`font-mono font-semibold ${color}`}>
                {sign}
                {value.toLocaleString('en-IN')}
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between pt-3">
            <span className="font-display font-semibold uppercase text-sm tracking-wide">Net Total</span>
            <span className="font-mono text-xl font-bold text-ops-amber">
              {metrics.netMovement >= 0 ? '+' : ''}
              {metrics.netMovement.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose} className="btn-primary w-full">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NetMoveModal;

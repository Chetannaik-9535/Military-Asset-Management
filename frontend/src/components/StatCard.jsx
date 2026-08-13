// src/components/StatCard.jsx

import React from 'react';

const ACCENTS = {
  amber: 'border-l-ops-amber text-ops-amber',
  moss: 'border-l-ops-moss text-ops-moss',
  rust: 'border-l-ops-rust text-ops-rust',
  steel: 'border-l-ops-steel text-ops-steel',
  paper: 'border-l-ops-paper text-ops-paper',
};

const StatCard = ({ label, value, unit, accent = 'paper', onClick, hint }) => {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={`panel border-l-4 ${ACCENTS[accent]} p-5 text-left w-full transition-colors ${
        onClick ? 'hover:bg-ops-raised cursor-pointer' : ''
      }`}
    >
      <p className="eyebrow mb-2">{label}</p>
      <p className="font-mono text-3xl font-semibold tabular-nums">
        {value.toLocaleString('en-IN')}
        {unit ? <span className="text-sm text-ops-muted ml-1.5">{unit}</span> : null}
      </p>
      {hint ? <p className="text-xs text-ops-muted mt-2">{hint}</p> : null}
    </Comp>
  );
};

export default StatCard;

// src/hooks/useLookups.js
// Fetches the two reference lists (bases, equipment types) used to populate
// dropdowns across Purchases, Transfers, and Assignments pages.

import { useEffect, useState } from 'react';
import api from '../services/api.js';

export const useLookups = () => {
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [basesRes, equipmentRes] = await Promise.all([api.get('/bases'), api.get('/equipment-types')]);
        if (!cancelled) {
          setBases(basesRes.data);
          setEquipmentTypes(equipmentRes.data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { bases, equipmentTypes, loading };
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { banksList } from '../modules/home/components/banks/banksData';

const BanksContext = createContext(null);

export function BanksProvider({ children }) {
  const [activeBanks, setActiveBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchActiveBanks = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = sessionStorage.getItem('gkp_active_banks');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setActiveBanks(parsed);
            return parsed;
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/banks/active');
      if (res.data?.success && res.data?.data) {
        const mapped = res.data.data.map(b => {
          const slug = (b.short_code || '').toLowerCase();
          const staticBank = banksList.find(sb => sb.id === slug);
          return {
            id: b.id,
            name: b.bank_name || b.name || '',
            short_code: b.short_code || '',
            logo: b.logo || b.logo_url || (staticBank ? staticBank.image : null),
            slug: slug,
            display_order: b.display_order || 0
          };
        });
        setActiveBanks(mapped);
        sessionStorage.setItem('gkp_active_banks', JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.error('Failed to fetch active banks:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveBanks();
  }, []);

  return (
    <BanksContext.Provider value={{ activeBanks, loading, error, refreshActiveBanks: () => fetchActiveBanks(true) }}>
      {children}
    </BanksContext.Provider>
  );
}

export function useActiveBanks() {
  const ctx = useContext(BanksContext);
  if (!ctx) {
    throw new Error('useActiveBanks must be inside a BanksProvider');
  }
  return ctx;
}

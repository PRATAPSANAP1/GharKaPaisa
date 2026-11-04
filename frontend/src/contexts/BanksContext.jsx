import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { banksList } from '../modules/home/components/banks/banksData';

const BanksContext = createContext(null);
const CACHE_KEY = 'gkp_active_banks';
const CACHE_TIME_KEY = 'gkp_active_banks_time';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function BanksProvider({ children }) {
  const [activeBanks, setActiveBanks] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);
        if (cached && cachedTime && (Date.now() - Number(cachedTime) < CACHE_DURATION_MS)) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (_) {}
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchActiveBanks = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);
        if (cached && cachedTime && (Date.now() - Number(cachedTime) < CACHE_DURATION_MS)) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActiveBanks(parsed);
            return parsed;
          }
        }
      } catch (_) {}
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/banks/active');
      if (res.data?.success && res.data?.data) {
        const mapped = res.data.data.map(b => {
          const slug = (b.short_code || '').toLowerCase();
          const staticBank = banksList.find(sb => sb.id === slug || sb.id === b.name?.toLowerCase());
          
          let logoUrl = b.logo || b.logo_url || null;

          if (
            logoUrl &&
            (logoUrl.includes(".s3.") || logoUrl.includes("s3.amazonaws.com"))
          ) {
            const key = logoUrl.split(".com/").pop();
            logoUrl = `https://d18qh1l6j6vziz.cloudfront.net/${key}`;
          }
          
          if (!logoUrl) {
            logoUrl = staticBank ? staticBank.image : null;
          }
          
          const labelName = b.bank_name || b.name || '';
          return {
            id: b.id,               // Database primary key UUID
            name: labelName,
            label: labelName,
            short_code: b.short_code || '',
            logo: logoUrl,
            image: logoUrl,
            slug: slug,
            display_order: b.display_order || 0
          };
        });
        setActiveBanks(mapped);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(mapped));
          sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
        } catch (_) {}
        return mapped;
      }
    } catch (err) {
      console.error('Failed to fetch active banks:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshActiveBanks = useCallback(() => fetchActiveBanks(true), [fetchActiveBanks]);

  useEffect(() => {
    if (activeBanks.length === 0) {
      fetchActiveBanks();
    }
  }, [fetchActiveBanks, activeBanks.length]);

  const value = useMemo(() => ({
    activeBanks,
    loading,
    error,
    refreshActiveBanks
  }), [activeBanks, loading, error, refreshActiveBanks]);

  return (
    <BanksContext.Provider value={value}>
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

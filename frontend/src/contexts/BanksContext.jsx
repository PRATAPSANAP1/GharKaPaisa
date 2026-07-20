import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { banksList } from '../modules/home/components/banks/banksData';

const BanksContext = createContext(null);

export function BanksProvider({ children }) {
  const [activeBanks, setActiveBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchActiveBanks = async (forceRefresh = false) => {
    // if (!forceRefresh) {
    //   const cached = sessionStorage.getItem('gkp_active_banks');
    //   if (cached) {
    //     try {
    //       const parsed = JSON.parse(cached);
    //       if (parsed && parsed.length > 0) {
    //         setActiveBanks(parsed);
    //         return parsed;
    //       }
    //     } catch (e) {
    //       // ignore parsing error
    //     }
    //   }
    // }

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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartnerStore } from '../../store/partnerStore';
import { useTheme } from '../../components/Partner/ThemeContext';
import StyledDashboard from '../../components/Partner/PartnerDashboard';

export default function PartnerDashboard() {
  const fetchProfile = usePartnerStore((state) => state.fetchProfile);
  const profile = usePartnerStore((state) => state.profile);
  const { C } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!profile);

  useEffect(() => {
    const init = async () => {
      try {
        if (!profile) {
          await fetchProfile();
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchProfile, profile]);

  const handleTabChange = (tab) => {
    if (tab === 'wallet') {
      navigate('/partner/wallet');
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", gap: "12px" }}>
        <span style={{
          width: "24px", height: "24px", borderRadius: "50%",
          border: `3px solid ${C.border}`,
          borderTop: `3px solid ${C.teal}`,
          animation: "spin 0.8s linear infinite",
          display: "inline-block"
        }} />
        <div style={{ fontSize: "14px", color: C.textMid, fontWeight: 600 }}>Loading profile...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <StyledDashboard partner={profile} onTabChange={handleTabChange} />
  );
}

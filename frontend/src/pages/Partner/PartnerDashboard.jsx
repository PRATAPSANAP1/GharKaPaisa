import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartnerStore } from '../../store/partnerStore';
import StyledDashboard from '../../components/Partner/PartnerDashboard';

export default function PartnerDashboard() {
  const profile = usePartnerStore((state) => state.profile);
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    if (tab === 'wallet') {
      navigate('/partner/wallet');
    }
  };

  return (
    <StyledDashboard partner={profile} onTabChange={handleTabChange} />
  );
}

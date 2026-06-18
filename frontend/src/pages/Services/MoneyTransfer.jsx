import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useTheme, makeS } from '../../components/Partner/ThemeContext';
import { Icons } from '../../components/Partner/PartnerIcons';

export default function MoneyTransfer() {
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();

  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to load settings to see which services are active
    // If /settings is protected, we'll gracefully fallback to showing all cards
    api.get('/settings')
      .then(res => {
        if(res.data?.success) setSettings(res.data.data);
      })
      .catch(() => {
        console.warn("Public settings access not available, defaulting to show all active");
      })
      .finally(() => setLoading(false));
  }, []);

  const services = [
    { id: 'mobile', key: 'service_mobile_status', label: 'Recharge', icon: "📱", path: '/recharge', color: C.primary },
    { id: 'electricity', key: 'service_electricity_status', label: 'Electricity', icon: "⚡", path: '/electricity', color: C.orange },
    { id: 'loan_repay', key: 'service_loan_repay_status', label: 'Loan Repay', icon: "💰", path: '/loan-repay', color: C.purple },
    { id: 'fastag', key: 'service_fastag_status', label: 'FASTag', icon: "🚗", path: '/fastag', color: C.teal },
    { id: 'dth', key: 'service_dth_status', label: 'DTH', icon: "📡", path: '/recharge', color: C.blue },
    { id: 'bus', key: 'service_bus_status', label: 'Bus', icon: "🚍", path: '/travel-transit/bus-booking', color: C.red },
    { id: 'flight', key: 'service_flight_status', label: 'Flight', icon: "✈️", path: '/travel-transit/flight-booking', color: C.blue },
    { id: 'train', key: 'service_train_status', label: 'Train', icon: "🎛️", path: '/travel-transit/train-booking', color: C.text },
    { id: 'hotel', key: 'service_hotel_status', label: 'Hotel', icon: "🏨", path: '/travel-transit/hotel-booking', color: C.green }
  ];

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: C.text, margin: "0 0 8px 0" }}>Money Transfer & Services</h1>
        <p style={{ fontSize: "16px", color: C.textLight }}>Fast, secure, and instant utility payments and bookings.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Loading services...</div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
          gap: "20px" 
        }}>
          {services.map(s => {
            // Check if service is disabled in settings. By default assume Active if setting is missing.
            const isActive = settings[s.key] ? settings[s.key] === 'Active' : true;
            
            if (!isActive) return null;

            return (
              <div 
                key={s.id}
                onClick={() => navigate(s.path)}
                style={{
                  ...S.card,
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "16px",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  border: `1px solid ${C.border}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 12px 24px ${s.color}20`;
                  e.currentTarget.style.borderColor = s.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <div style={{
                  width: "60px", height: "60px", borderRadius: "50%",
                  background: `${s.color}15`, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "28px"
                }}>
                  {s.icon}
                </div>
                <span style={{ fontSize: "16px", fontWeight: 700, color: C.text }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

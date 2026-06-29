import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme, makeS } from '../../contexts/ThemeContext';
import { Icons } from '../../components/Icon/PartnerIcons';

export default function ComingSoon() {
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract service name from path, e.g., /flight-booking -> Flight Booking
  const serviceName = location.pathname.substring(1).replace('-booking', '').replace('-', ' ');
  const title = serviceName.charAt(0).toUpperCase() + serviceName.slice(1) + ' Services';

  return (
    <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <div style={{ ...S.card, padding: "60px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
        
        <div style={{
          width: "100px", height: "100px", borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.teal}20, ${C.primary}30)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: C.primary, fontSize: "48px"
        }}>
          {Icons.Settings || "✈️"}
        </div>

        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: C.text, margin: "0 0 12px 0" }}>
            {title} Coming Soon
          </h1>
          <p style={{ fontSize: "16px", color: C.textLight, maxWidth: "500px", margin: "0 auto", lineHeight: "1.6" }}>
            We're currently working hard to integrate industry-leading APIs for {title.toLowerCase()}. 
            This feature will be available in the upcoming update.
          </p>
        </div>

        <button 
          onClick={() => navigate(-1)}
          style={{ ...S.btn("primary"), padding: "12px 32px", fontSize: "16px", marginTop: "16px" }}
        >
          Go Back
        </button>

      </div>
    </div>
  );
}

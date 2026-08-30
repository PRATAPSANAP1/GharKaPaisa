import React from 'react';
import ChatbotProductCard from './ChatbotProductCard';
import { FaBuilding } from 'react-icons/fa';

export default function ChatbotBankProducts({ bank, products, userRole, C }) {
  if (!bank || !products || products.length === 0) return null;

  return (
    <div className="chatbot-bank-products-container" style={{ width: '100%', margin: '8px 0' }}>
      {/* Bank Header Banner */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          borderRadius: '14px',
          background: `linear-gradient(135deg, ${C.primary}15, ${C.primary}05)`,
          border: `1.5px solid ${C.primary}30`,
          marginBottom: '10px'
        }}
      >
        {bank.logoUrl ? (
          <img src={bank.logoUrl} alt={bank.name} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
        ) : (
          <FaBuilding color={C.primary} size={20} />
        )}
        <div>
          <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: C.text }}>{bank.name}</h4>
          <span style={{ fontSize: '11px', color: C.primary, fontWeight: '600' }}>{products.length} Active Products Available</span>
        </div>
      </div>

      {/* Products List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {products.map((product, idx) => (
          <ChatbotProductCard key={product.id || idx} product={product} userRole={userRole} C={C} />
        ))}
      </div>
    </div>
  );
}

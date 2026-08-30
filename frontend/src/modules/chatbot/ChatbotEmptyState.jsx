import React from 'react';
import { FaSearch, FaCreditCard, FaHandHoldingUsd, FaShieldAlt } from 'react-icons/fa';

export default function ChatbotEmptyState({ queryTerm, onSuggestionClick, C }) {
  const suggestions = [
    { label: 'HDFC Credit Cards', query: 'Show HDFC cards' },
    { label: 'SBI Credit Cards', query: 'Show SBI cards' },
    { label: 'Personal Loans', query: 'Show personal loans' },
    { label: 'Insurance Offers', query: 'Show insurance' }
  ];

  return (
    <div 
      className="chatbot-empty-state"
      style={{
        background: C.bgSecondary,
        border: `1.5px dashed ${C.border}`,
        borderRadius: '16px',
        padding: '16px',
        margin: '8px 0',
        textAlign: 'center'
      }}
    >
      <div 
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: `${C.primary}15`,
          color: C.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 10px auto'
        }}
      >
        <FaSearch size={18} />
      </div>

      <h4 style={{ margin: '0 0 6px 0', fontSize: '13.5px', fontWeight: '700', color: C.text }}>
        {queryTerm ? `No exact match for "${queryTerm}"` : 'No results found'}
      </h4>

      <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: C.textMid, lineHeight: '1.4' }}>
        Try searching for popular banks or categories below:
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onSuggestionClick && onSuggestionClick(s.query, s.label)}
            style={{
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: '600',
              borderRadius: '20px',
              border: `1px solid ${C.border}`,
              background: C.card,
              color: C.primary,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

import React from 'react';
import ChatbotProductCard from './ChatbotProductCard';
import ChatbotProductList from './ChatbotProductList';
import ChatbotBankProducts from './ChatbotBankProducts';
import ChatbotQuickLinks from './ChatbotQuickLinks';
import ChatbotApplicationResult from './ChatbotApplicationResult';
import ChatbotEmptyState from './ChatbotEmptyState';

export default function ChatbotMessage({ 
  msg, 
  isLastBotMessage, 
  isTyping, 
  userRole, 
  onChipClick, 
  C 
}) {
  const primaryDark = C.primaryDark || C.primary;
  const isBot = msg.sender === 'bot';

  return (
    <div className={`message-wrapper ${msg.sender}`}>
      <div 
        className="message-bubble" 
        style={{
          background: isBot 
            ? C.card 
            : `linear-gradient(135deg, ${C.primary}, ${primaryDark})`,
          color: isBot ? C.text : '#ffffff',
          border: isBot ? `1px solid ${C.border}` : 'none'
        }}
      >
        <p className="message-text" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.text}</p>

        {/* Structured Data Payloads */}
        {isBot && msg.data && (
          <div style={{ marginTop: '8px', width: '100%' }}>
            {/* Single Product Card */}
            {msg.data.product && (
              <ChatbotProductCard product={msg.data.product} userRole={userRole} C={C} />
            )}

            {/* Product List */}
            {msg.data.products && !msg.data.bank && (
              <ChatbotProductList products={msg.data.products} userRole={userRole} C={C} />
            )}

            {/* Bank Product List */}
            {msg.data.bank && msg.data.products && (
              <ChatbotBankProducts bank={msg.data.bank} products={msg.data.products} userRole={userRole} C={C} />
            )}

            {/* Application Results */}
            {msg.data.applications && (
              <ChatbotApplicationResult applications={msg.data.applications} userRole={userRole} C={C} />
            )}
          </div>
        )}

        <span 
          className="message-time" 
          style={{ color: isBot ? C.textLight : 'rgba(255,255,255,0.75)' }}
        >
          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
      </div>

      {/* Quick Action Chips */}
      {isBot && msg.chips && msg.chips.length > 0 && isLastBotMessage && !isTyping && (
        <ChatbotQuickLinks chips={msg.chips} onChipClick={onChipClick} C={C} />
      )}
    </div>
  );
}

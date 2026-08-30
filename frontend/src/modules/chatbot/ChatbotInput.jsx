import React from 'react';
import { FaPaperPlane } from 'react-icons/fa';

export default function ChatbotInput({ value, onChange, onSubmit, disabled, C }) {
  const primaryDark = C.primaryDark || C.primary;

  return (
    <form 
      className="gkp-chatbot-footer" 
      onSubmit={onSubmit} 
      style={{ borderTop: `1px solid ${C.border}`, background: C.card }}
    >
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Ask about HDFC cards, SBI loans, or applications..."
        className="chatbot-input"
        disabled={disabled}
        style={{ 
          background: C.bgSecondary, 
          color: C.text, 
          border: `1px solid ${C.border}` 
        }}
      />
      <button 
        type="submit" 
        className="chatbot-send-btn"
        disabled={disabled || !value.trim()}
        style={{ 
          background: `linear-gradient(135deg, ${C.primary}, ${primaryDark})`, 
          color: '#ffffff' 
        }}
        aria-label="Send message"
      >
        <FaPaperPlane size={14} />
      </button>
    </form>
  );
}

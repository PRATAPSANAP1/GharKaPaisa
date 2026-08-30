import React from 'react';
import chatbotIcon from '../../assets/logos/chatbot-icon.png';

export default function ChatbotButton({ onClick, hasNewMessage, C }) {
  return (
    <div className="gkp-chatbot-launcher-wrapper">
      <div 
        className="robot-speech-bubble" 
        style={{ 
          background: C.card, 
          color: C.text, 
          borderColor: C.border 
        }}
      >
        <span>Need help with cards or leads?</span>
        <span className="speech-arrow" style={{ borderTopColor: C.border }} />
      </div>
      <button 
        className="gkp-chatbot-launcher robot-launcher" 
        onClick={onClick}
        aria-label="Open Chatbot Assistant"
      >
        <img src={chatbotIcon} className="dancing-robot-img" alt="Dancing Robot Assistant" />
        {hasNewMessage && <span className="notification-badge" />}
      </button>
    </div>
  );
}

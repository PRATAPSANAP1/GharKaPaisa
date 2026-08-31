import React from 'react';
import chatbotIcon from '../../assets/logos/chatbot-icon.png';

export default function ChatbotButton({ onClick, hasNewMessage }) {
  return (
    <div className="gkp-chatbot-launcher-wrapper">
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

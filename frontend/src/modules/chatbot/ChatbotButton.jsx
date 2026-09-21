import React from 'react';
import chatbotIcon from '../../assets/logos/chatbot-icon.png';

export default function ChatbotButton({ onClick, hasNewMessage, onMouseDown, onTouchStart }) {
  return (
    <div className="gkp-chatbot-launcher-wrapper">
      <button 
        className="gkp-chatbot-launcher robot-launcher" 
        onClick={onClick}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        aria-label="Open Chatbot Assistant"
        style={{ touchAction: 'none', cursor: 'grab' }}
      >
        <img src={chatbotIcon} className="dancing-robot-img" alt="Dancing Robot Assistant" draggable={false} />
        {hasNewMessage && <span className="notification-badge" />}
      </button>
    </div>
  );
}

import React, { useRef, useEffect } from 'react';
import { FaRedo, FaTimes } from 'react-icons/fa';
import chatbotIcon from '../../assets/logos/chatbot-icon.png';
import ChatbotMessage from './ChatbotMessage';
import ChatbotInput from './ChatbotInput';

export default function ChatbotWindow({
  isOpen,
  messages,
  inputValue,
  isTyping,
  backendAvailable,
  userRole,
  onInputChange,
  onSendMessage,
  onChipClick,
  onClearChat,
  onClose,
  C
}) {
  const messagesEndRef = useRef(null);
  const primaryDark = C.primaryDark || C.primary;
  const primaryGlow = `${C.primary}30`;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const getRoleBadgeLabel = () => {
    switch ((userRole || 'PUBLIC').toUpperCase()) {
      case 'PARTNER':
      case 'TEAM_MEMBER':
        return 'Partner AI';
      case 'EMPLOYEE':
        return 'Employee Assistant';
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return 'Admin Helpdesk';
      default:
        return 'Finance Buddy';
    }
  };

  return (
    <div 
      className={`gkp-chatbot-window ${isOpen ? 'open' : ''}`} 
      style={{ 
        background: C.card, 
        border: `1.5px solid ${C.border}`, 
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.18), 0 0 30px ${primaryGlow}` 
      }}
    >
      {/* Header */}
      <div 
        className="gkp-chatbot-header" 
        style={{ 
          background: `linear-gradient(135deg, ${C.primary} 0%, ${primaryDark} 100%)` 
        }}
      >
        <div className="header-info">
          <div className="avatar-container robot-avatar">
            <img src={chatbotIcon} className="header-robot-img" alt="Robot avatar" />
            <span className="online-indicator" />
          </div>
          <div>
            <h3 className="bot-title">GKP {getRoleBadgeLabel()}</h3>
            <span className="bot-subtitle-badge">
              {backendAvailable ? 'Online • AI Agent' : 'Online • Agent'}
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="header-btn" 
            onClick={onClearChat} 
            title="Reset Conversation"
          >
            <FaRedo size={12} />
          </button>
          <button 
            className="header-btn close-btn" 
            onClick={onClose} 
            title="Close Chat"
          >
            <FaTimes size={15} />
          </button>
        </div>
      </div>

      {/* Messages Body */}
      <div className="gkp-chatbot-body" style={{ background: C.bg }}>
        <div className="messages-list">
          {messages.map((msg, index) => (
            <ChatbotMessage
              key={index}
              msg={msg}
              isLastBotMessage={msg.sender === 'bot' && index === messages.length - 1}
              isTyping={isTyping}
              userRole={userRole}
              onChipClick={onChipClick}
              C={C}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="message-wrapper bot typing">
              <div className="message-bubble typing-indicator-bubble" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="typing-dots">
                  <span className="dot" style={{ background: C.primary }} />
                  <span className="dot" style={{ background: C.primary }} />
                  <span className="dot" style={{ background: C.primary }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Footer Input Bar */}
      <ChatbotInput
        value={inputValue}
        onChange={onInputChange}
        onSubmit={onSendMessage}
        disabled={isTyping}
        C={C}
      />
    </div>
  );
}

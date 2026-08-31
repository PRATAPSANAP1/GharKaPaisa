import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../app/store/authStore';
import * as chatbotAPI from './chatbotService';
import ChatbotButton from './ChatbotButton';
import ChatbotWindow from './ChatbotWindow';
import '../../components/Chatbot/Chatbot.css';

// Default chips tailored by user role
function getDefaultChips(userRole = 'PUBLIC') {
  const role = (userRole || 'PUBLIC').toUpperCase();

  if (role === 'PARTNER' || role === 'TEAM_MEMBER') {
    return [
      { label: 'Select Product', action: 'go_partner_products' },
      { label: 'Add Lead', action: 'go_partner_add_lead' },
      { label: 'Lead Process', action: 'lead_process' },
      { label: 'My Applications', action: 'go_partner_applications' }
    ];
  }

  if (role === 'EMPLOYEE') {
    return [
      { label: 'Punch Credit Card', action: 'go_employee_cards' },
      { label: 'Lead Process', action: 'lead_process' },
      { label: 'My Applications', action: 'go_employee_applications' },
      { label: 'My Incentives', action: 'go_employee_incentives' }
    ];
  }

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return [
      { label: 'Manage Applications', action: 'go_admin_applications' },
      { label: 'Manage Leads', action: 'go_admin_leads' },
      { label: 'Lead Process', action: 'lead_process' },
      { label: 'Direct Cards', action: 'go_admin_direct_leads' }
    ];
  }

  return [
    { label: 'Find Credit Card', action: 'cards_start' },
    { label: 'Apply for Loan', action: 'loans_start' },
    { label: 'Lead Process', action: 'lead_process' },
    { label: 'Partner Earnings', action: 'partner_start' }
  ];
}

const REDIRECT_ACTIONS = {
  go_ltf: '/credit-cards/lifetime-free-credit-cards-ltf',
  go_cards: '/credit-cards',
  go_travel: '/travel-transit',
  go_loans: '/loans',
  go_register: '/register',
  go_login: '/login',
  go_contact: '/contact',
  go_careers: '/careers',
  go_interview: '/careers/register',
  go_partner_products: '/partner/products',
  go_partner_add_lead: '/partner/leads/add',
  go_partner_applications: '/partner/applications',
  go_employee_cards: '/employee/credit-cards',
  go_employee_applications: '/employee/applications',
  go_employee_incentives: '/employee/incentives',
  go_applications: '/partner/applications',
  go_dashboard: '/partner/dashboard',
  go_wallet: '/partner/wallet',
  go_withdraw: '/partner/wallet',
  go_team: '/partner/team',
  go_referral: '/partner/referral',
  go_partners: '/admin/partners',
  go_partner_kyc: '/admin/partners',
  go_employees: '/super-admin/employees',
  go_activate: '/super-admin/employees',
  go_commissions: '/super-admin/commissions',
  go_release: '/super-admin/commissions',
  go_incentives: '/employee/incentives',
  go_manager: '/employee/team',
  go_add_lead_card: '/partner/add-lead',
  go_add_lead_loan: '/partner/add-lead',
  go_add_lead_insurance: '/partner/add-lead',
  go_forgot_password: '/login',
};

export default function Chatbot() {
  const { isDark, C } = useTheme();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const userRole = user?.role?.toUpperCase() || 'PUBLIC';
  const panel = userRole.toLowerCase();
  const roleDefaultChips = getDefaultChips(userRole);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! Welcome to GharKaPaisa. How can I assist you with credit cards, loans, or applications today?',
      timestamp: new Date(),
      chips: roleDefaultChips
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(true);
  const [sessionId, setSessionId] = useState(() => chatbotAPI.getSessionId());
  const [backendAvailable, setBackendAvailable] = useState(true);

  // Initialize conversation with backend on first open
  const initializedRef = useRef(false);
  useEffect(() => {
    if (isOpen && !initializedRef.current) {
      initializedRef.current = true;
      chatbotAPI.createConversation(sessionId).catch(() => {
        setBackendAvailable(false);
      });
    }
  }, [isOpen, sessionId]);

  // Update initial message chips if user auth/role changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].sender === 'bot') {
        return [{ ...prev[0], chips: roleDefaultChips }];
      }
      return prev;
    });
  }, [userRole]);

  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    addMessage({
      sender: 'user',
      text: userText,
      timestamp: new Date()
    });
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await chatbotAPI.sendMessage(userText, userRole, panel);
      setIsTyping(false);

      const botResponse = res.data || res;
      addMessage({
        sender: 'bot',
        text: botResponse.message || botResponse.response_template || "I'm here to help!",
        timestamp: new Date(),
        data: botResponse.data || null,
        chips: botResponse.chips || roleDefaultChips
      });
      setBackendAvailable(true);
    } catch (err) {
      setBackendAvailable(false);
      setIsTyping(false);
      addMessage({
        sender: 'bot',
        text: `I couldn't find an exact match for "${userText}". Try asking for "HDFC credit cards", "SBI loans", or "Lead process".`,
        timestamp: new Date(),
        chips: roleDefaultChips
      });
    }
  };

  // Chip click handler
  const handleChipClick = async (action, label) => {
    // Handle role-specific lead creation redirects
    if (action === 'go_add_lead_card' || action === 'go_add_lead_loan' || action === 'go_add_lead_insurance') {
      addMessage({ sender: 'user', text: label, timestamp: new Date() });

      // Route based on user role
      if (userRole === 'EMPLOYEE') {
        navigate('/employee/add-lead');
      } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        navigate(userRole === 'SUPER_ADMIN' ? '/super-admin/leads' : '/admin/leads');
      } else {
        // PARTNER and TEAM_MEMBER go to partner add-lead
        navigate('/partner/add-lead');
      }
      setIsOpen(false);
      return;
    }

    if (REDIRECT_ACTIONS[action]) {
      addMessage({ sender: 'user', text: label, timestamp: new Date() });
      navigate(REDIRECT_ACTIONS[action]);
      setIsOpen(false);
      return;
    }

    if (action.startsWith('go_prod_')) {
      const slug = action.replace('go_prod_', '');
      addMessage({ sender: 'user', text: label, timestamp: new Date() });
      if (userRole === 'PARTNER' || userRole === 'TEAM_MEMBER') {
        navigate('/partner/products');
      } else if (userRole === 'EMPLOYEE') {
        navigate('/employee/credit-cards');
      } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        navigate(userRole === 'SUPER_ADMIN' ? '/super-admin/products' : '/admin/products');
      } else {
        navigate(`/products/credit_card/${slug}`);
      }
      setIsOpen(false);
      return;
    }

    if (action === 'go_admin_leads') {
      addMessage({ sender: 'user', text: label, timestamp: new Date() });
      navigate(userRole === 'SUPER_ADMIN' ? '/super-admin/leads' : '/admin/leads');
      setIsOpen(false);
      return;
    }
    if (action === 'go_admin_applications') {
      addMessage({ sender: 'user', text: label, timestamp: new Date() });
      navigate(userRole === 'SUPER_ADMIN' ? '/super-admin/applications' : '/admin/applications');
      setIsOpen(false);
      return;
    }

    addMessage({
      sender: 'user',
      text: label,
      timestamp: new Date()
    });
    setIsTyping(true);

    try {
      const res = await chatbotAPI.sendAction(action, label, userRole, panel);
      setIsTyping(false);
      const botResponse = res.data || res;
      addMessage({
        sender: 'bot',
        text: botResponse.message || "Here's what I found:",
        timestamp: new Date(),
        data: botResponse.data || null,
        chips: botResponse.chips || roleDefaultChips
      });
      setBackendAvailable(true);
    } catch {
      setBackendAvailable(false);
      setIsTyping(false);
      addMessage({
        sender: 'bot',
        text: `Here is the information for ${label}:`,
        timestamp: new Date(),
        chips: roleDefaultChips
      });
    }
  };

  const handleClearChat = async () => {
    try {
      await chatbotAPI.resetConversation();
    } catch {
      // Ignore reset failure
    }
    const newSid = chatbotAPI.resetSessionId();
    setSessionId(newSid);
    initializedRef.current = false;
    setBackendAvailable(true);

    setMessages([
      {
        sender: 'bot',
        text: 'Hello! I reset our chat. How can I assist you today?',
        timestamp: new Date(),
        chips: roleDefaultChips
      }
    ]);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  return (
    <div 
      className="gkp-chatbot-container" 
      style={{ 
        '--theme-primary': C.primary, 
        '--theme-primary-dark': C.primaryDark || C.primary,
        '--theme-glow': `${C.primary}30`,
        '--theme-bg': C.bg, 
        '--theme-card': C.card, 
        '--theme-text': C.text, 
        '--theme-border': C.border, 
        '--theme-secondary': C.bgSecondary, 
        '--theme-text-mid': C.textMid 
      }}
    >
      {!isOpen && (
        <ChatbotButton 
          onClick={toggleChat} 
          hasNewMessage={hasNewMessage} 
          C={C} 
        />
      )}

      {isOpen && (
        <ChatbotWindow
          isOpen={isOpen}
          messages={messages}
          inputValue={inputValue}
          isTyping={isTyping}
          backendAvailable={backendAvailable}
          userRole={userRole}
          onInputChange={(e) => setInputValue(e.target.value)}
          onSendMessage={handleSendMessage}
          onChipClick={handleChipClick}
          onClearChat={handleClearChat}
          onClose={toggleChat}
          C={C}
        />
      )}
    </div>
  );
}

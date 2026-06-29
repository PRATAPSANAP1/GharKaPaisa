import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FaComments, FaPaperPlane, FaTimes, FaRedo, 
  FaRobot, FaUser, FaChevronRight, FaRegSmile 
} from 'react-icons/fa';
import './Chatbot.css';
import chatbotIcon from '../../assets/logos/chatbot-icon.png';

const DEFAULT_CHIPS = [
  { label: '💳 Find Credit Card', action: 'cards_start' },
  { label: '💰 Apply for Loan', action: 'loans_start' },
  { label: '📈 Partner Earnings', action: 'partner_start' },
  { label: '💬 Contact Support', action: 'support_start' }
];

export default function Chatbot() {
  const { isDark, C } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! Welcome to GharKaPaisa. I am your GKP Finance Buddy. How can I help you today?',
      timestamp: new Date(),
      chips: DEFAULT_CHIPS
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(true);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const addMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const simulateBotResponse = (userText, callback) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const response = callback();
      addMessage({
        sender: 'bot',
        text: response.text,
        timestamp: new Date(),
        chips: response.chips || []
      });
    }, 1000 + Math.random() * 800); // realistic delay
  };

  const handleChipClick = (action, label) => {
    // Add user message indicating selection
    addMessage({
      sender: 'user',
      text: label,
      timestamp: new Date()
    });

    switch (action) {
      case 'cards_start':
        simulateBotResponse(label, () => ({
          text: "Awesome! Let's find your perfect credit card. Which category interests you the most?",
          chips: [
            { label: '💸 Lifetime Free Cards', action: 'cards_ltf' },
            { label: '🛍️ Cashback & Shopping', action: 'cards_cashback' },
            { label: '✈️ Travel & Transit', action: 'cards_travel' },
            { label: '👑 Rewards & Lifestyle', action: 'cards_rewards' },
            { label: '🔙 Main Menu', action: 'main_menu' }
          ]
        }));
        break;

      case 'cards_ltf':
        simulateBotResponse(label, () => ({
          text: "We offer multiple Lifetime Free (LTF) credit cards with ₹0 annual fee and ₹0 joining fee. You can view bank options like Axis Bank, HDFC Pixel, or Kotak. You can read the benefits details and apply online.",
          chips: [
            { label: 'Explore LTF Cards Now', action: 'go_ltf' },
            { label: '🔙 Card Categories', action: 'cards_start' },
            { label: '🏡 Main Menu', action: 'main_menu' }
          ]
        }));
        break;

      case 'cards_cashback':
        simulateBotResponse(label, () => ({
          text: "For shopping enthusiasts, our cashback cards offer up to 5% cashback on top e-commerce websites like Flipkart and Amazon (Axis Flipkart, ICICI Amazon Pay). They are great for saving money on everyday purchases.",
          chips: [
            { label: 'View Credit Cards list', action: 'go_cards' },
            { label: '🔙 Card Categories', action: 'cards_start' },
            { label: '🏡 Main Menu', action: 'main_menu' }
          ]
        }));
        break;

      case 'cards_travel':
        simulateBotResponse(label, () => ({
          text: "If you travel frequently, co-branded travel cards give you complimentary lounge access, air miles, and hotel points to save on flights and transit.",
          chips: [
            { label: 'View Travel Benefits', action: 'go_travel' },
            { label: '🔙 Card Categories', action: 'cards_start' },
            { label: '🏡 Main Menu', action: 'main_menu' }
          ]
        }));
        break;

      case 'cards_rewards':
        simulateBotResponse(label, () => ({
          text: "Our premium reward and lifestyle cards reward your dining, movies, and utility spends with high multipliers, which you can redeem for vouchers or items.",
          chips: [
            { label: 'Compare All Cards', action: 'go_cards' },
            { label: '🔙 Card Categories', action: 'cards_start' }
          ]
        }));
        break;

      case 'loans_start':
        simulateBotResponse(label, () => ({
          text: "We offer quick loans via our top banking partners. What kind of loan are you looking for?",
          chips: [
            { label: '🙋 Personal Loan', action: 'loans_personal' },
            { label: '💼 Business Loan', action: 'loans_business' },
            { label: '🏠 Home Loan / LAP', action: 'loans_home' },
            { label: '🏡 Main Menu', action: 'main_menu' }
          ]
        }));
        break;

      case 'loans_personal':
        simulateBotResponse(label, () => ({
          text: "Personal loans have minimum documentation and quick approval, starting from 10.5% interest. You can check your eligibility and submit details on our Loans page.",
          chips: [
            { label: 'Check Loan Options', action: 'go_loans' },
            { label: '🔙 Loan Options', action: 'loans_start' }
          ]
        }));
        break;

      case 'loans_business':
        simulateBotResponse(label, () => ({
          text: "Expand your business with unsecured lines of credit up to ₹50 Lakhs. Rates start from 13.5%.",
          chips: [
            { label: 'Go to Loans Page', action: 'go_loans' },
            { label: '🔙 Loan Options', action: 'loans_start' }
          ]
        }));
        break;

      case 'loans_home':
        simulateBotResponse(label, () => ({
          text: "Get home loans or Loans Against Property (LAP) starting from 8.4% interest rate with flexible tenure options.",
          chips: [
            { label: 'Go to Loans Page', action: 'go_loans' },
            { label: '🔙 Loan Options', action: 'loans_start' }
          ]
        }));
        break;

      case 'partner_start':
        simulateBotResponse(label, () => ({
          text: "As a GharKaPaisa Partner, you can submit leads for financial products and earn huge commission payouts on every approval. How can I help you?",
          chips: [
            { label: '💡 How to Join?', action: 'partner_join' },
            { label: '💰 Commission Rates', action: 'partner_rates' },
            { label: '💳 Wallet & Payouts', action: 'partner_payouts' },
            { label: '👥 Referral Network', action: 'partner_referral' },
            { label: '🏡 Main Menu', action: 'main_menu' }
          ]
        }));
        break;

      case 'partner_join':
        simulateBotResponse(label, () => ({
          text: "It is free and fast! 1. Go to register. 2. Sign up with your mobile number. 3. Upload KYC files (PAN, Aadhaar) inside your panel. 4. Share links and start earning!",
          chips: [
            { label: 'Register Now', action: 'go_register' },
            { label: 'Login to Account', action: 'go_login' }
          ]
        }));
        break;

      case 'partner_rates':
        simulateBotResponse(label, () => ({
          text: "Partners earn up to ₹3,500 per credit card approval and up to 3.5% payout on loan disbursements. Commission slabs are tier-based so you earn more as your monthly volume grows.",
          chips: [
            { label: 'Become a Partner', action: 'go_register' },
            { label: '🔙 Partner Info', action: 'partner_start' }
          ]
        }));
        break;

      case 'partner_payouts':
        simulateBotResponse(label, () => ({
          text: "Your approved lead payouts are credited directly to your GKP Wallet. You can withdraw withdrawable funds instantly to your registered bank account or UPI ID with one click.",
          chips: [
            { label: 'Login & Check Wallet', action: 'go_login' },
            { label: '🔙 Partner Info', action: 'partner_start' }
          ]
        }));
        break;

      case 'partner_referral':
        simulateBotResponse(label, () => ({
          text: "Build your network and earn passive income! You get commissions on Level 1 (direct), Level 2, and Level 3 sub-agents' earnings. Check the Team Referral tab in your Dashboard.",
          chips: [
            { label: 'Register as Agent', action: 'go_register' },
            { label: '🔙 Partner Info', action: 'partner_start' }
          ]
        }));
        break;

      case 'support_start':
        simulateBotResponse(label, () => ({
          text: "Our dedicated support team is available Mon-Sat, 10 AM to 7 PM. You can call us, send a message on WhatsApp, or email us at support@gharkapaisa.com.",
          chips: [
            { label: 'Go to Contact Page', action: 'go_contact' },
            { label: '🏡 Main Menu', action: 'main_menu' }
          ]
        }));
        break;

      case 'main_menu':
        simulateBotResponse(label, () => ({
          text: "Here is the main menu. What would you like to explore today?",
          chips: DEFAULT_CHIPS
        }));
        break;

      // Redirections
      case 'go_ltf':
        navigate('/credit-cards/lifetime-free-credit-cards-ltf');
        setIsOpen(false);
        break;
      case 'go_cards':
        navigate('/credit-cards');
        setIsOpen(false);
        break;
      case 'go_travel':
        navigate('/travel-transit');
        setIsOpen(false);
        break;
      case 'go_loans':
        navigate('/loans');
        setIsOpen(false);
        break;
      case 'go_register':
        navigate('/register');
        setIsOpen(false);
        break;
      case 'go_login':
        navigate('/login');
        setIsOpen(false);
        break;
      case 'go_contact':
        navigate('/contact');
        setIsOpen(false);
        break;

      default:
        simulateBotResponse(label, () => ({
          text: "I am not sure how to handle that chip request, but I can help you find cards, loans, or partner details.",
          chips: DEFAULT_CHIPS
        }));
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    addMessage({
      sender: 'user',
      text: userText,
      timestamp: new Date()
    });
    setInputValue('');

    // Parse input keyword matching
    simulateBotResponse(userText, () => {
      const text = userText.toLowerCase();

      if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
        return {
          text: "Hello! I am your GharKaPaisa Finance Buddy. How can I help you today?",
          chips: DEFAULT_CHIPS
        };
      }

      if (text.includes('card') || text.includes('credit') || text.includes('cc')) {
        return {
          text: "GharKaPaisa lists multiple premium credit cards from SBI, ICICI, HDFC, Axis, and Kotak. Which category is your interest?",
          chips: [
            { label: '💳 Find Credit Card', action: 'cards_start' },
            { label: '💸 Lifetime Free Cards', action: 'cards_ltf' },
            { label: '🏡 Main Menu', action: 'main_menu' }
          ]
        };
      }

      if (text.includes('loan') || text.includes('borrow') || text.includes('personal loan')) {
        return {
          text: "We assist with Personal Loans, Business Loans, and Home Loans from major lending partners. Which one do you want to explore?",
          chips: [
            { label: '💰 Apply for Loan', action: 'loans_start' },
            { label: '🙋 Personal Loan', action: 'loans_personal' },
            { label: '🏡 Main Menu', action: 'main_menu' }
          ]
        };
      }

      if (text.includes('partner') || text.includes('earn') || text.includes('commission') || text.includes('agent')) {
        return {
          text: "Earn high payouts by submitting customer applications as a Partner! Grow your Level 1, 2, and 3 referral network.",
          chips: [
            { label: '📈 Partner Earnings', action: 'partner_start' },
            { label: '💡 How to Join?', action: 'partner_join' },
            { label: '🏡 Main Menu', action: 'main_menu' }
          ]
        };
      }

      if (text.includes('kyc') || text.includes('pan') || text.includes('aadhaar')) {
        return {
          text: "To clear your KYC verification and withdraw earnings, upload your Aadhaar Card (front & back), PAN Card, and a cancelled check photo inside the KYC panel.",
          chips: [
            { label: 'Login to KYC', action: 'go_login' },
            { label: '🏡 Main Menu', action: 'main_menu' }
          ]
        };
      }

      if (text.includes('cibil') || text.includes('score')) {
        return {
          text: "A CIBIL score of 750 or higher increases your chances of credit card and loan approval with better interest rates.",
          chips: [
            { label: '💰 Apply for Loan', action: 'loans_start' },
            { label: '🏡 Main Menu', action: 'main_menu' }
          ]
        };
      }

      if (text.includes('recharge') || text.includes('electricity') || text.includes('fastag') || text.includes('bill')) {
        return {
          text: "We support quick mobile recharge, DTH payments, electricity bill payments, loan repayments, and Fastag recharges via the Services tab.",
          chips: [
            { label: '🏡 Main Menu', action: 'main_menu' }
          ]
        };
      }

      if (text.includes('contact') || text.includes('support') || text.includes('help') || text.includes('email') || text.includes('phone')) {
        return {
          text: "You can write to us at support@gharkapaisa.com or call 1800-GKP-HELP. We will be happy to help you!",
          chips: [
            { label: '💬 Contact Support', action: 'support_start' },
            { label: '🏡 Main Menu', action: 'main_menu' }
          ]
        };
      }

      // Default fallback
      return {
        text: "I couldn't find an exact match for your question. You can use our quick links below or type details like 'loan', 'credit card', or 'partner' to search.",
        chips: DEFAULT_CHIPS
      };
    });
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'bot',
        text: 'Hello! I reset the chat. How can I assist you with credit cards or loans today?',
        timestamp: new Date(),
        chips: DEFAULT_CHIPS
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
    <div className="gkp-chatbot-container" style={{ '--theme-primary': C.primary, '--theme-bg': C.card, '--theme-text': C.text, '--theme-border': C.border, '--theme-secondary': C.bgSecondary, '--theme-text-mid': C.textMid }}>
      {/* Floating launcher bubble */}
      {!isOpen && (
        <div className="gkp-chatbot-launcher-wrapper">
          <div className="robot-speech-bubble" style={{ background: C.card, color: C.text, border: `1px solid ${C.border}` }}>
            <span>Hey! Need help? Chat with me!</span>
            <div className="speech-arrow" style={{ borderTopColor: C.border }} />
          </div>
          <button 
            className="gkp-chatbot-launcher robot-launcher" 
            onClick={toggleChat}
            style={{ boxShadow: `0 8px 24px ${C.primary}30` }}
            aria-label="Open Chatbot"
          >
            <img src={chatbotIcon} className="dancing-robot-img" alt="Dancing Robot Assistant" style={{ borderColor: C.primary }} />
            {hasNewMessage && <span className="notification-badge" />}
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`gkp-chatbot-window ${isOpen ? 'open' : ''}`} style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: `0 12px 32px rgba(0, 0, 0, ${isDark ? '0.4' : '0.15'})` }}>
          {/* Header */}
          <div className="gkp-chatbot-header" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark || C.primary})` }}>
            <div className="header-info">
              <div className="avatar-container robot-avatar">
                <img src={chatbotIcon} className="header-robot-img" alt="Robot avatar" />
                <span className="online-indicator" />
              </div>
              <div>
                <h3 className="bot-title">GKP Finance Buddy</h3>
                <p className="bot-subtitle">Online • Agent</p>
              </div>
            </div>
            <div className="header-actions">
              <button 
                className="header-btn" 
                onClick={handleClearChat} 
                title="Reset Conversation"
                style={{ color: '#ffffff' }}
              >
                <FaRedo size={12} />
              </button>
              <button 
                className="header-btn close-btn" 
                onClick={toggleChat} 
                title="Close Chat"
                style={{ color: '#ffffff' }}
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>

          {/* Messages body */}
          <div className="gkp-chatbot-body" style={{ background: C.bg }}>
            <div className="messages-list">
              {messages.map((msg, index) => (
                <div key={index} className={`message-wrapper ${msg.sender}`}>
                  <div className="message-bubble" style={{
                    background: msg.sender === 'bot' ? C.card : C.primary,
                    color: msg.sender === 'bot' ? C.text : '#ffffff',
                    border: msg.sender === 'bot' ? `1px solid ${C.border}` : 'none'
                  }}>
                    <p className="message-text">{msg.text}</p>
                    <span className="message-time" style={{ color: msg.sender === 'bot' ? C.textLight : 'rgba(255,255,255,0.7)' }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Chips display (bot only, on latest message of bot) */}
                  {msg.sender === 'bot' && msg.chips && msg.chips.length > 0 && index === messages.length - 1 && !isTyping && (
                    <div className="chips-container">
                      {msg.chips.map((chip, idx) => (
                        <button
                          key={idx}
                          className="chip-btn"
                          onClick={() => handleChipClick(chip.action, chip.label)}
                          style={{
                            background: C.bgSecondary,
                            color: C.primary,
                            border: `1px solid ${C.border}`,
                            hoverBackground: C.primary
                          }}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="message-wrapper bot typing">
                  <div className="message-bubble typing-indicator-bubble" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="typing-dots">
                      <span className="dot" style={{ background: C.textLight }} />
                      <span className="dot" style={{ background: C.textLight }} />
                      <span className="dot" style={{ background: C.textLight }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input form */}
          <form className="gkp-chatbot-footer" onSubmit={handleSendMessage} style={{ borderTop: `1px solid ${C.border}` }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me something about cards or loans..."
              className="chatbot-input"
              style={{ background: C.bgSecondary, color: C.text, border: `1px solid ${C.border}` }}
            />
            <button 
              type="submit" 
              className="chatbot-send-btn"
              disabled={!inputValue.trim()}
              style={{ background: C.primary, color: '#ffffff' }}
            >
              <FaPaperPlane size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

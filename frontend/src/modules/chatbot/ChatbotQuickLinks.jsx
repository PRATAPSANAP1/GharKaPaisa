import React from 'react';
import { 
  FaCreditCard, FaHandHoldingUsd, FaChartLine, FaHeadset, 
  FaUserPlus, FaSignInAlt, FaUsers, FaRupeeSign, FaChevronRight 
} from 'react-icons/fa';

const ACTION_ICON_MAP = {
  cards_start: <FaCreditCard />,
  loans_start: <FaHandHoldingUsd />,
  partner_start: <FaChartLine />,
  support_start: <FaHeadset />,
  go_register: <FaUserPlus />,
  go_login: <FaSignInAlt />,
  go_partner_products: <FaCreditCard />,
  go_partner_add_lead: <FaUserPlus />,
  go_partner_applications: <FaChartLine />,
  go_employee_cards: <FaCreditCard />,
  go_employee_applications: <FaChartLine />,
  go_employee_incentives: <FaRupeeSign />,
  go_admin_leads: <FaUsers />,
  go_admin_applications: <FaChartLine />
};

export default function ChatbotQuickLinks({ chips, onChipClick, C }) {
  if (!chips || chips.length === 0) return null;

  return (
    <div className="chips-container">
      {chips.map((chip, idx) => (
        <button
          key={idx}
          className="chip-btn"
          onClick={() => onChipClick(chip.action, chip.label)}
          style={{
            background: C.bgSecondary,
            color: C.primary,
            border: `1.5px solid ${C.border}`
          }}
        >
          <span className="chip-icon">
            {ACTION_ICON_MAP[chip.action] || <FaChevronRight />}
          </span>
          <span>{chip.label}</span>
        </button>
      ))}
    </div>
  );
}

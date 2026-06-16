import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './Partner/ThemeContext';
import { FaGlobe } from 'react-icons/fa';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { C } = useTheme();

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <FaGlobe style={{ color: C.teal, fontSize: '15px' }} />
      <select
        value={i18n.language || 'en'}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        style={{
          background: C.bgSecondary,
          color: C.text,
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          padding: '4px 20px 4px 6px', // Extra padding right to make room for default select arrow
          fontSize: '13px',
          fontWeight: 600,
          outline: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontFamily: "'Inter', sans-serif",
          WebkitAppearance: 'none', // Remove native dropdown styling
          MozAppearance: 'none',
          appearance: 'none',
          position: 'relative',
        }}
        onMouseEnter={(e) => e.target.style.borderColor = C.teal}
        onMouseLeave={(e) => e.target.style.borderColor = C.border}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} style={{ background: C.card, color: C.text }}>
            {lang.label}
          </option>
        ))}
      </select>
      {/* Visual chevron dropdown arrow for custom styled select */}
      <span style={{
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '8px',
        color: C.textLight,
        pointerEvents: 'none'
      }}>
        ▼
      </span>
    </div>
  );
}

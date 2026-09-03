import React, { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaSearch } from 'react-icons/fa';
import sbiPincodeMap from '../data/sbi_pincodes_with_city.json';

const sbiEntries = Object.entries(sbiPincodeMap); // [ ["756056", "BALESHWAR"], ... ]
const sbiSet = new Set(Object.keys(sbiPincodeMap));

export const isSbiPincodeValid = (pincode) => {
  if (!pincode) return false;
  return sbiSet.has(String(pincode).trim());
};

export const getSbiPincodeCity = (pincode) => {
  if (!pincode) return '';
  return sbiPincodeMap[String(pincode).trim()] || '';
};

export default function PincodeAutoComplete({
  value = '',
  onChange,
  onSelect,
  isSbiOnly = false,
  placeholder = 'Enter 6-digit Pincode',
  error = '',
  style = {},
  inputStyle = {},
  C = {}
}) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  // Sync internal state with outer value prop
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside listener to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter pincodes when typing
  const handleInputChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setQuery(val);
    if (onChange) onChange(val);

    if (val.length >= 1) {
      const filtered = sbiEntries
        .filter(([pin]) => pin.startsWith(val))
        .slice(0, 10);
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelectSuggestion = (pin, city) => {
    setQuery(pin);
    setIsOpen(false);
    setSuggestions([]);
    if (onChange) onChange(pin);
    if (onSelect) onSelect({ pincode: pin, city });
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      const [pin, city] = suggestions[highlightedIndex];
      handleSelectSuggestion(pin, city);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const is6Digits = query.length === 6;
  const isValidSbi = is6Digits && isSbiSet(query);
  const isInvalidSbi = isSbiOnly && is6Digits && !isValidSbi;

  function isSbiSet(pin) {
    return sbiSet.has(pin);
  }

  const currentCity = getSbiPincodeCity(query);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', ...style }}>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: C.textLight || '#64748b',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center'
        }}>
          <FaMapMarkerAlt size={14} />
        </span>

        <input
          type="text"
          maxLength={6}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.length >= 1) {
              const filtered = sbiEntries.filter(([pin]) => pin.startsWith(query)).slice(0, 10);
              setSuggestions(filtered);
              setIsOpen(filtered.length > 0);
            }
          }}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '12px 14px 12px 38px',
            borderRadius: '10px',
            border: `1px solid ${isInvalidSbi || error ? '#ef4444' : (isValidSbi ? '#10b981' : (C.border || '#cbd5e1'))}`,
            background: C.bgSecondary || '#f8fafc',
            color: C.text || '#0f172a',
            fontSize: '13.5px',
            fontWeight: 600,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
            ...inputStyle
          }}
        />

        {query.length > 0 && (
          <span style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '11px',
            fontWeight: 800,
            color: isInvalidSbi ? '#ef4444' : (isValidSbi ? '#10b981' : '#64748b')
          }}>
            {isValidSbi && <FaCheckCircle size={14} style={{ color: '#10b981' }} />}
            {isInvalidSbi && <FaTimesCircle size={14} style={{ color: '#ef4444' }} />}
          </span>
        )}
      </div>

      {/* SUGGESTIONS DROPDOWN */}
      {isOpen && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: C.card || '#ffffff',
          border: `1px solid ${C.border || '#cbd5e1'}`,
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          maxHeight: '220px',
          overflowY: 'auto',
          zIndex: 9999,
          padding: '4px 0'
        }}>
          <div style={{
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 800,
            color: C.textLight || '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderBottom: `1px solid ${C.border || '#f1f5f9'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Pincode Suggestions ({suggestions.length})</span>
            {isSbiOnly && <span style={{ color: '#0ea5e9' }}>SBI Serviced Locations</span>}
          </div>

          {suggestions.map(([pin, city], idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <div
                key={pin}
                onClick={() => handleSelectSuggestion(pin, city)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                style={{
                  padding: '10px 14px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  background: isHighlighted ? (C.bgSecondary || '#f1f5f9') : 'transparent',
                  color: isHighlighted ? (C.primary || '#0ea5e9') : (C.text || '#0f172a'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaMapMarkerAlt size={12} style={{ color: isHighlighted ? '#0ea5e9' : '#94a3b8' }} />
                  <strong style={{ fontFamily: 'monospace', fontSize: '13.5px' }}>{pin}</strong>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: isHighlighted ? (C.primary || '#0ea5e9') : (C.textLight || '#64748b') }}>
                  {city || 'Location Assigned'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Location tag badge if matched */}
      {currentCity && (
        <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FaCheckCircle size={11} /> Location: <strong>{currentCity}</strong>
        </div>
      )}

      {/* Error display */}
      {(error || isInvalidSbi) && (
        <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, marginTop: '4px', display: 'block' }}>
          {error || "You can't add lead for this pincode"}
        </span>
      )}
    </div>
  );
}

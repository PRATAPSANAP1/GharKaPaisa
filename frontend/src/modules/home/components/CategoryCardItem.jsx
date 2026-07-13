import React, { useState, useEffect, useRef } from 'react';

export default function CategoryCardItem({ card, C, t, isMobile }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    setIsExpanded(false);
    setIsOverflowing(false);
  }, [card]);

  useEffect(() => {
    if (textRef.current && isMobile && !isExpanded) {
      const element = textRef.current;
      const hasOverflow = element.scrollHeight > element.clientHeight;
      setIsOverflowing(hasOverflow);
    }
  }, [card.desc, isMobile, isExpanded]);

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: "4px", 
      background: C.bgSecondary, 
      padding: "14px", 
      borderRadius: "12px", 
      border: `1px solid ${C.border}`,
      boxSizing: "border-box"
    }}>
      <span style={{ fontSize: "14px", fontWeight: 800, color: C.text }}>{card.name}</span>
      <span 
        ref={textRef}
        style={{ 
          fontSize: "12px", 
          color: C.textLight, 
          lineHeight: 1.4,
          display: isMobile && !isExpanded ? "-webkit-box" : "block",
          WebkitLineClamp: isMobile && !isExpanded ? 2 : "unset",
          WebkitBoxOrient: isMobile && !isExpanded ? "vertical" : "unset",
          overflow: isMobile && !isExpanded ? "hidden" : "visible",
          textOverflow: isMobile && !isExpanded ? "ellipsis" : "unset"
        }}
      >
        {card.desc}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
        <button style={{ 
          background: C.teal, 
          color: "#fff", 
          border: "none", 
          padding: "6px 12px", 
          borderRadius: "8px", 
          fontSize: "11px", 
          fontWeight: 800, 
          cursor: "pointer", 
          transition: "opacity 0.2s" 
        }} 
          onMouseEnter={(e) => e.target.style.opacity = 0.9} 
          onMouseLeave={(e) => e.target.style.opacity = 1}
        >
          {t('popularCardsList.applyNow', 'Apply Now')}
        </button>
        {isMobile && (isOverflowing || isExpanded) && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ 
              background: "none", 
              border: `1px solid ${C.teal}`, 
              color: C.teal, 
              padding: "5px 10px", 
              borderRadius: "8px", 
              fontSize: "11px", 
              fontWeight: 800, 
              cursor: "pointer" 
            }}
          >
            {isExpanded ? t('home.seeLess', 'See Less') : t('home.seeMore', 'See More')}
          </button>
        )}
      </div>
    </div>
  );
}

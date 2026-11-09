import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Sun, Moon } from 'lucide-react';

// ── Official Brand Palette ──────────────────────────────────────────────────────
const BRAND = {
  primaryBlue: "#1B74BB",   // Primary brand blue
  brandGreen:  "#9CD83D",   // Brand green
  deepBlue:    "#0851A1",   // Deep blue
};

// ── Light Theme ────────────────────────────────────────────────────────────────
export const LIGHT = {
  // Backgrounds
  bg:          "#F5F8FC",   // Main background
  bgSecondary: "#FFFFFF",   // Surface/cards
  bgTertiary:  "#F8FAFC",   // Elevated surface
  
  // Text
  text:        "#172B43",   // Primary text
  textMid:     "#64748B",   // Secondary text
  textLight:   "#94A3B8",   // Muted text
  
  // Primary Brand Colors
  primary:     BRAND.primaryBlue,   // Primary button/accent
  primaryDark: BRAND.deepBlue,    // Hover state
  primaryLight: "#3B82F6",       // Lighter blue variant
  
  // Accent Colors
  accent:      BRAND.brandGreen,   // Green accent
  accentDark:  "#7BC32E",        // Darker green
  accentLight: "#D9F7B3",       // Light green background
  
  // Semantic Colors
  success:     "#10B981",   // Success green
  successLight: "#D1FAE5",   // Success background
  warning:     "#F59E0B",   // Warning orange
  warningLight: "#FEF3C7",   // Warning background
  error:       "#EF4444",   // Error red
  errorLight:  "#FEE2E2",   // Error background
  info:        "#3B82F6",   // Info blue
  infoLight:   "#DBEAFE",   // Info background
  
  // Borders & Inputs
  border:      "#E2E8F0",   // Border color
  borderLight: "#F1F5F9",   // Light border
  inputBg:     "#FFFFFF",   // Input background
  inputBorder: "#CBD5E1",   // Input border
  
  // Sidebar (matches brand colors)
  sidebar:     BRAND.deepBlue,    // Main sidebar
  sidebarGradient: BRAND.primaryBlue, // Sidebar gradient
  sidebarText: "#FFFFFF",
  sidebarInactive: "#94A3B8", // Inactive nav text
  sidebarIconInactive: "#64748B", // Inactive nav icons
  sidebarActive: "rgba(156, 216, 61, 0.15)", // Active nav background (green tint)
  
  // Additional Colors
  gold:        "#F59E0B",
  goldLight:   "#FEF3C7",
  purple:      "#8B5CF6",
  purpleLight: "#F1EBFF",
  
  // Employee Panel Tokens
  employeePrimary:     BRAND.primaryBlue,
  employeePrimaryDark: BRAND.deepBlue,
  employeeGlow:        "rgba(27, 116, 187, 0.15)",
  employeeIncentive:   BRAND.brandGreen,
};

// ── Dark Theme ─────────────────────────────────────────────────────────────────
export const DARK = {
  // Backgrounds
  bg:          "#101A2B",   // Main background (not pure black)
  bgSecondary: "#19283C",   // Surface/cards
  bgTertiary:  "#233D5B",   // Elevated surface
  
  // Text
  text:        "#F1F5F9",   // Primary text (light)
  textMid:     "#A8B7CA",   // Secondary text
  textLight:   "#64748B",   // Muted text
  
  // Primary Brand Colors
  primary:     BRAND.primaryBlue,   // Primary button/accent
  primaryDark: "#3B82F6",         // Hover state
  primaryLight: "#60A5FA",       // Lighter blue variant
  
  // Accent Colors
  accent:      BRAND.brandGreen,   // Green accent
  accentDark:  "#7BC32E",        // Darker green
  accentLight: "rgba(156, 216, 61, 0.15)", // Light green background
  
  // Semantic Colors
  success:     "#10B981",   // Success green
  successLight: "rgba(16, 185, 129, 0.15)", // Success background
  warning:     "#F59E0B",   // Warning orange
  warningLight: "rgba(245, 158, 11, 0.15)",   // Warning background
  error:       "#EF4444",   // Error red
  errorLight:  "rgba(239, 68, 68, 0.15)",   // Error background
  info:        "#3B82F6",   // Info blue
  infoLight:   "rgba(59, 130, 246, 0.15)",   // Info background
  
  // Borders & Inputs
  border:      "#34465D",   // Border color
  borderLight: "#475569",   // Light border
  inputBg:     "#19283C",   // Input background
  inputBorder: "#475569",   // Input border
  
  // Sidebar (matches brand colors)
  sidebar:     BRAND.deepBlue,    // Main sidebar
  sidebarGradient: BRAND.primaryBlue, // Sidebar gradient
  sidebarText: "#FFFFFF",
  sidebarInactive: "#94A3B8", // Inactive nav text
  sidebarIconInactive: "#64748B", // Inactive nav icons
  sidebarActive: "rgba(156, 216, 61, 0.15)", // Active nav background (green tint)
  
  // Additional Colors
  gold:        "#FBBF24",
  goldLight:   "rgba(251, 191, 36, 0.15)",
  purple:      "#A78BFA",
  purpleLight: "rgba(167, 139, 250, 0.15)",
  
  // Employee Panel Tokens
  employeePrimary:     BRAND.primaryBlue,
  employeePrimaryDark: "#3B82F6",
  employeeGlow:        "rgba(27, 116, 187, 0.2)",
  employeeIncentive:   BRAND.brandGreen,
};

// ── Context ────────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("gkp_theme");
    return saved === null ? false : saved === "dark";
  });

  useEffect(() => {
    localStorage.setItem("gkp_theme", isDark ? "dark" : "light");
    
    // Prevent flash of wrong theme by setting theme before render
    const root = document.documentElement;
    const body = document.body;
    
    if (isDark) {
      root.classList.add("dark");
      body.classList.add("dark");
      body.style.backgroundColor = DARK.bg;
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
      body.style.backgroundColor = LIGHT.bg;
    }
  }, [isDark]);

  const toggle = useCallback(() => setIsDark(d => !d), []);
  const C = useMemo(() => (isDark ? DARK : LIGHT), [isDark]);
  const value = useMemo(() => ({ isDark, toggle, C }), [isDark, toggle, C]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}

// ── Shared Style Factory (uses live C) ────────────────────────────────────────
export function makeS(C) {
  return {
    card: {
      background: C.bgSecondary,
      borderRadius: "16px",
      padding: "20px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
      border: `1px solid ${C.border}`,
      transition: "all 0.25s ease",
    },
    tag: (color) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      background: color + "20",
      color: color,
      borderRadius: "8px",
      padding: "4px 10px",
      fontSize: "11px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    }),
    btn: (variant = "primary", isDark = false) => ({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: variant === "sm" ? "8px 16px" : "12px 24px",
      borderRadius: "10px",
      fontWeight: 700,
      fontSize: variant === "sm" ? "13px" : "14px",
      cursor: "pointer",
      transition: "all 0.2s",
      background:
        variant === "outline" || variant === "ghost"
          ? "transparent"
          : C.primary,
      color:
        variant === "outline" || variant === "ghost" ? C.primary : "#fff",
      border:
        variant === "outline" ? `1.5px solid ${C.primary}` : "none",
      boxShadow:
        variant === "primary" ? `0 4px 14px ${C.primary}35` : "none",
    }),
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "10px",
      border: `1.5px solid ${C.inputBorder}`,
      fontSize: "14px",
      color: C.text,
      background: C.inputBg,
      outline: "none",
      boxSizing: "border-box",
      fontFamily: "inherit",
      transition: "border-color 0.2s, background 0.2s",
    },
    label: {
      fontSize: "13px",
      fontWeight: 600,
      color: C.textMid,
      marginBottom: "6px",
      display: "block",
    },
  };
}

// ── Toggle Button Component with lucide-react icons ─────────────────────────
export function ThemeToggle({ style = {}, onChange }) {
  const { isDark, toggle } = useTheme();
  const isLight = !isDark;

  const handleToggle = () => {
    toggle();
    if (onChange) {
      onChange(isLight ? "dark" : "light");
    }
  };

  return (
    <button
      className="theme-toggle-btn"
      onClick={handleToggle}
      role="switch"
      aria-checked={isLight}
      style={{
        width: 72, 
        height: 32, 
        borderRadius: 999,
        display: "flex", 
        alignItems: "center",
        padding: 4, 
        cursor: "pointer", 
        position: "relative",
        transition: "background 0.3s ease",
        justifyContent: isLight ? "flex-start" : "flex-end",
        background: isLight ? "#E2E8F0" : "#34465D",
        border: "none",
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Sun icon for light mode */}
      <div style={{
        position: "absolute",
        left: 8,
        display: isLight ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Sun size={16} color="#64748B" />
      </div>

      {/* Moon icon for dark mode */}
      <div style={{
        position: "absolute",
        right: 8,
        display: isDark ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Moon size={16} color="#A8B7CA" />
      </div>

      {/* Toggle thumb */}
      <div style={{
        width: 24, 
        height: 24, 
        borderRadius: "50%",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: isLight ? "#FFFFFF" : "#F1F5F9",
        boxShadow: isLight
          ? "0 2px 4px rgba(0,0,0,0.1)"
          : "0 2px 4px rgba(0,0,0,0.2)",
        transition: "transform 0.3s ease",
        transform: isLight ? "translateX(0)" : "translateX(40px)",
      }}>
        {isLight ? (
          <Sun size={14} color={BRAND.primaryBlue} />
        ) : (
          <Moon size={14} color={BRAND.brandGreen} />
        )}
      </div>
    </button>
  );
}

export const LightDarkToggle = ThemeToggle;

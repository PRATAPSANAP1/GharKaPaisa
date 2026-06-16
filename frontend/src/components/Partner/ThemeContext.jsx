import React, { createContext, useContext, useState, useEffect } from "react";

// ── Brand Palette ──────────────────────────────────────────────────────────────
const BRAND = {
  blue:        "#166397",   // Primary brand blue (verify button)
  blueDark:    "#0F4F7A",   // Darker blue
  green:       "#8DC22F",   // Parrot green
  greenLight:  "#A8D64F",   // Lighter parrot green
  bgLight:     "#F8FAFC",   // Light page background
  dark:        "#1F2937",   // Dark text / dark mode surface
};

// ── Light Theme ────────────────────────────────────────────────────────────────
export const LIGHT = {
  bg:          BRAND.bgLight,
  bgSecondary: "#EEF3FB",
  card:        "#FFFFFF",
  sidebar:     BRAND.blueDark,
  sidebarText: "#FFFFFF",
  text:        BRAND.dark,
  textMid:     "#4A5568",
  textLight:   "#8D99AE",
  primary:     BRAND.blue,
  primaryDark: BRAND.blueDark,
  green:       BRAND.green,
  greenLight:  BRAND.greenLight,
  red:         "#E63946",
  gold:        "#F59E0B",
  border:      "#E2E8F0",
  inputBg:     "#FFFFFF",
  teal:        BRAND.blue,
  tealDim:     BRAND.blueDark,
  navy:        BRAND.blueDark,
  navyMid:     "#1C3A5A",
  tealGlow:    `${BRAND.blue}25`,
  amber:       "#F59E0B",
};

// ── Dark Theme ─────────────────────────────────────────────────────────────────
// Premium deep-navy dark mode — readable, elegant, brand-consistent
export const DARK = {
  bg:          "#0B1622",   // Deep navy page background
  bgSecondary: "#112035",   // Slightly lighter for secondary areas
  card:        "#162840",   // Card surface — distinct from bg
  sidebar:     "#091320",   // Deepest navy for sidebar
  sidebarText: "#FFFFFF",
  text:        "#E8F4FD",   // Soft white — easy on eyes
  textMid:     "#7FB3CC",   // Mid blue-grey for labels
  textLight:   "#3D6480",   // Muted for secondary hints
  primary:     "#4BAF7D",   // Muted teal-green (not neon) for actions
  primaryDark: "#337A58",   // Deeper for gradient
  green:       "#4BAF7D",   // Same muted green for success
  greenLight:  "#6DC99A",   // Lighter green for highlights
  red:         "#F07070",
  gold:        "#E8B84B",   // Muted gold — readable on dark
  border:      "#1E3D5A",   // Visible but subtle border
  inputBg:     "#0F2030",   // Darker than card — inputs recede
  teal:        "#4BAF7D",
  tealDim:     "#6DC99A",
  navy:        "#091320",
  navyMid:     "#112035",
  tealGlow:    "#4BAF7D25",
  amber:       "#E8B84B",
};

// ── Context ────────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("gkp_theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("gkp_theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = () => setIsDark(d => !d);
  const C = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ isDark, toggle, C }}>
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
      background: C.card,
      borderRadius: "16px",
      padding: "20px",
      boxShadow: `0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)`,
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
          : `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
      color:
        variant === "outline" || variant === "ghost" ? C.teal : "#fff",
      border:
        variant === "outline" ? `1.5px solid ${C.primary}` : "none",
      boxShadow:
        variant === "primary" ? `0 4px 14px ${C.primary}35` : "none",
    }),
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "10px",
      border: `1.5px solid ${C.border}`,
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

// ── Toggle Button Component ────────────────────────────────────────────────────
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
    <div
      className="theme-toggle-btn"
      onClick={handleToggle}
      role="switch"
      aria-checked={isLight}
      style={{
        width: 140, height: 64, borderRadius: 999,
        display: "flex", alignItems: "center",
        padding: 6, cursor: "pointer", position: "relative",
        transition: "background 0.35s",
        justifyContent: isLight ? "flex-start" : "flex-end",
        background: isLight ? "#e8e8e8" : "#2e3250",
        boxShadow: isLight
          ? "inset 4px 4px 10px #c8c8c8, inset -4px -4px 10px #ffffff"
          : "inset 4px 4px 10px #1a1d30, inset -4px -4px 10px #424870",
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Label text */}
      <span style={{
        position: "absolute",
        fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
        lineHeight: 1.2, textAlign: "center", pointerEvents: "none",
        ...(isLight
          ? { right: 14, color: "#999" }
          : { left: 14, color: "#6a70a0" })
      }}>
        {isLight ? "LIGHT\nMODE" : "DARK\nMODE"}
      </span>

      {/* Thumb */}
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
        background: isLight ? "#f0f0f0" : "#3c4168",
        boxShadow: isLight
          ? "4px 4px 10px #c0c0c0, -3px -3px 8px #ffffff"
          : "4px 4px 10px #1a1d30, -3px -3px 8px #5a60a0",
        color: isLight ? "#888" : "#aab0d8",
        transition: "all 0.3s",
      }}>
        {isLight ? "☀️" : "🌙"}
      </div>
    </div>
  );
}

export const LightDarkToggle = ThemeToggle;


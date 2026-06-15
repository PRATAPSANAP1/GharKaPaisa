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
export function ThemeToggle({ style = {} }) {
  const { isDark, toggle, C } = useTheme();
  return (
    <button
      className="theme-toggle-btn"
      onClick={toggle}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: `1.5px solid ${C.border}`,
        background: C.card,
        cursor: "pointer",
        fontSize: "16px",
        transition: "all 0.2s",
        flexShrink: 0,
        ...style,
      }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}

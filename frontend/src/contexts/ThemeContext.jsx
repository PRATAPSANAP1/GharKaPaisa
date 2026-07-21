import React, { createContext, useContext, useState, useEffect } from 'react';

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
  bg:          "#F8FAFC",   // Page Background
  bgSecondary: "#EEF2FF",   // Purple Light
  card:        "#FFFFFF",   // Card Background
  sidebar:     "#0F172A",   // Sidebar Background
  sidebarText: "#FFFFFF",
  text:        "#111827",   // Text Primary
  textMid:     "#64748B",   // Text Secondary
  textLight:   "#94A3B8",   // Light Text / Inactive Menu Icon
  primary:     "#4F46E5",   // Primary (Indigo)
  primaryDark: "#3730A3",   // Darker Indigo
  green:       "#EA580C",   // Replaced success green accent with orange
  greenLight:  "#FFF7ED",   // Orange light
  red:         "#EF4444",   // Danger
  gold:        "#F59E0B",   // Warning
  border:      "#E5E7EB",   // Border
  inputBg:     "#FFFFFF",
  teal:        "#4F46E5",
  tealDim:     "#7C3AED",   // Secondary (Purple)
  navy:        "#0F172A",
  navyMid:     "#1E293B",   // Sidebar Hover
  tealGlow:    "rgba(79, 70, 229, 0.15)",
  amber:       "#F59E0B",
};

// ── Dark Theme ─────────────────────────────────────────────────────────────────
export const DARK = {
  bg:          "#000000",   // Black background
  bgSecondary: "#000000",   // Black background secondary
  card:        "#000000",   // Black card surface
  sidebar:     "#000000",   // Black sidebar
  sidebarText: "#FFFFFF",
  text:        "#F8FAFC",   // Crisp text
  textMid:     "#E4E4E7",   // Secondary labels
  textLight:   "#A1A1AA",   // Muted hints (WCAG 2.1 AA Compliant 7.3:1)
  primary:     "#F97316",   // Vibrant orange accent (WCAG 2.1 AA Compliant 5.5:1)
  primaryDark: "#EA580C",   // Darker orange for gradient
  green:       "#F97316",   // Replaced success green with orange
  greenLight:  "#FFEDD5",   // Light orange highlight
  red:         "#EF4444",
  gold:        "#F59E0B",   // Warning gold
  border:      "#27272A",   // Zinc border (provides contrast on #000000)
  inputBg:     "#000000",   // Black background for input fields
  teal:        "#F97316",
  tealDim:     "#EA580C",
  navy:        "#000000",
  navyMid:     "#000000",
  tealGlow:    "rgba(249, 115, 22, 0.15)",
  amber:       "#F59E0B",
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
    document.body.style.backgroundColor = isDark ? "#000000" : "#F8FAFC";
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
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
        width: 72, height: 30, borderRadius: 999,
        display: "flex", alignItems: "center",
        padding: 3, cursor: "pointer", position: "relative",
        transition: "background 0.35s",
        justifyContent: isLight ? "flex-start" : "flex-end",
        background: isLight ? "#e8e8e8" : "#2e3250",
        boxShadow: isLight
          ? "inset 2px 2px 5px #c8c8c8, inset -2px -2px 5px #ffffff"
          : "inset 2px 2px 5px #1a1d30, inset -2px -2px 5px #424870",
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Label text */}
      <span style={{
        position: "absolute",
        fontSize: 7, fontWeight: 700, letterSpacing: "0.02em",
        lineHeight: 1.0, textAlign: "center", pointerEvents: "none",
        ...(isLight
          ? { right: 8, color: "#999" }
          : { left: 8, color: "#6a70a0" })
      }}>
        {isLight ? "LIGHT" : "DARK"}
      </span>

      {/* Thumb */}
      <div style={{
        width: 24, height: 24, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12,
        background: isLight ? "#f0f0f0" : "#3c4168",
        boxShadow: isLight
          ? "1px 1px 3px #c0c0c0, -1px -1px 3px #ffffff"
          : "1px 1px 3px #1a1d30, -1px -1px 3px #5a60a0",
        color: isLight ? "#888" : "#aab0d8",
        transition: "all 0.3s",
      }}>
        {isLight ? "☀️" : "🌙"}
      </div>
    </div>
  );
}

export const LightDarkToggle = ThemeToggle;


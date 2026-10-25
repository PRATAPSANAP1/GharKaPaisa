import React, { createContext, useContext, useState, useEffect } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

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
  bg:          "#F5F8F7",   // Main background
  bgSecondary: "#E8F7EF",   // Soft green surface
  card:        "#FFFFFF",   // Card Background
  sidebar:     "#063F38",   // Main sidebar dark green
  sidebarGradient: "#07594C", // Sidebar gradient end
  sidebarText: "#FFFFFF",
  sidebarInactive: "#D7E8E3", // Inactive nav text
  sidebarIconInactive: "#C2D9D3", // Inactive nav icons
  text:        "#101828",   // Main heading text
  textMid:     "#475569",   // Secondary text
  textLight:   "#64748B",   // Muted text
  primary:     "#008A60",   // Primary brand green
  primaryDark: "#007F5B",   // Hover green
  primaryButton: "#009B70", // Button green
  green:       "#008A60",   // Success green
  greenLight:  "#DDF8EA",   // Success background
  red:         "#F04444",   // Red alert
  gold:        "#F59E0B",   // Orange accent
  goldLight:   "#FFF1DF",   // Orange background
  purple:      "#8B5CF6",   // Purple accent
  purpleLight: "#F1EBFF",   // Purple background
  blue:        "#3B82F6",   // Blue accent
  blueLight:   "#EAF2FF",   // Blue background
  border:      "#E3EBE8",   // Border
  inputBg:     "#FFFFFF",
  teal:        "#008A60",
  tealDim:     "#007F5B",
  navy:        "#063F38",
  navyMid:     "#087F6B",   // Active nav background
  tealGlow:    "rgba(0, 138, 96, 0.15)",
  amber:       "#F59E0B",
  // ── Employee Panel Tokens ──
  employeePrimary:     "#008A60",   // Primary brand green
  employeePrimaryDark: "#007F5B",
  employeeGlow:        "rgba(0, 138, 96, 0.14)",
  employeeIncentive:   "#008A60",
};

// ── Dark Theme ─────────────────────────────────────────────────────────────────
export const DARK = {
  bg:          "#0A0F0D",   // Very dark green tint
  bgSecondary: "#0D1411",   // Slightly lighter
  card:        "#0F1A17",   // Dark green card
  sidebar:     "#063F38",   // Main sidebar dark green
  sidebarGradient: "#07594C", // Sidebar gradient end
  sidebarText: "#FFFFFF",
  sidebarInactive: "#94A3B8", // Inactive nav text in dark
  sidebarIconInactive: "#64748B", // Inactive nav icons in dark
  text:        "#F1F5F9",   // Light text
  textMid:     "#CBD5E1",   // Secondary labels
  textLight:   "#94A3B8",   // Muted hints
  primary:     "#00D4AA",   // Lighter green for dark mode
  primaryDark: "#00B898",   // Darker green
  primaryButton: "#00E6C2", // Button green
  green:       "#00D4AA",   // Success green
  greenLight:  "#0D3D35",   // Success background
  red:         "#F87171",   // Lighter red
  gold:        "#FBBF24",   // Lighter orange
  goldLight:   "#1F2937",   // Orange background
  purple:      "#A78BFA",   // Lighter purple
  purpleLight: "#1E1B4B",   // Purple background
  blue:        "#60A5FA",   // Lighter blue
  blueLight:   "#1E3A8A",   // Blue background
  border:      "#1E293B",   // Dark border
  inputBg:     "#0F1A17",   // Dark input background
  teal:        "#00D4AA",
  tealDim:     "#00B898",
  navy:        "#063F38",
  navyMid:     "#087F6B",   // Active nav background
  tealGlow:    "rgba(0, 212, 170, 0.15)",
  amber:       "#FBBF24",
  // ── Employee Panel Tokens ──
  employeePrimary:     "#00D4AA",   // Light green in dark mode
  employeePrimaryDark: "#00B898",
  employeeGlow:        "rgba(0, 212, 170, 0.16)",
  employeeIncentive:   "#00D4AA",
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
        {isLight ? <FaSun size={12} /> : <FaMoon size={12} />}
      </div>
    </div>
  );
}

export const LightDarkToggle = ThemeToggle;


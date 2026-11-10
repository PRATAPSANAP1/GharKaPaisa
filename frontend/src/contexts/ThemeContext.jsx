import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Sun, Moon } from 'lucide-react';

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
  bgTertiary:  "#FFFFFF",   // Card surface
  card:        "#FFFFFF",   // Card Background
  sidebar:     "#063F38",   // Main sidebar dark green
  sidebarGradient: "#07594C", // Sidebar gradient end
  sidebarText: "#FFFFFF",
  sidebarInactive: "#D7E8E3", // Inactive nav text
  sidebarIconInactive: "#C2D9D3", // Inactive nav icons
  sidebarActive: "rgba(0, 138, 96, 0.15)", // Active nav background
  text:        "#101828",   // Main heading text
  textMid:     "#475569",   // Secondary text
  textLight:   "#64748B",   // Muted text
  primary:     "#008A60",   // Primary brand green
  primaryDark: "#007F5B",   // Hover green
  primaryLight: "#009B70",  // Light green variant
  primaryButton: "#009B70", // Button green
  accent:      "#8DC22F",   // Parrot green accent
  accentDark:  "#7BC32E",   // Darker green
  accentLight: "#DDF8EA",   // Light green background
  green:       "#008A60",   // Success green
  greenLight:  "#DDF8EA",   // Success background
  success:     "#008A60",
  successLight: "#DDF8EA",
  red:         "#F04444",   // Red alert
  error:       "#F04444",
  errorLight:  "#FEE2E2",
  gold:        "#F59E0B",   // Orange accent
  goldLight:   "#FFF1DF",   // Orange background
  warning:     "#F59E0B",
  warningLight: "#FEF3C7",
  purple:      "#8B5CF6",   // Purple accent
  purpleLight: "#F1EBFF",   // Purple background
  blue:        "#3B82F6",   // Blue accent
  blueLight:   "#EAF2FF",   // Blue background
  info:        "#3B82F6",
  infoLight:   "#EAF2FF",
  border:      "#E3EBE8",   // Border
  borderLight: "#F1F5F9",
  inputBg:     "#FFFFFF",
  inputBorder: "#CBD5E1",
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
  bgTertiary:  "#0F1A17",   // Elevated surface
  card:        "#0F1A17",   // Dark green card
  sidebar:     "#063F38",   // Main sidebar dark green
  sidebarGradient: "#07594C", // Sidebar gradient end
  sidebarText: "#FFFFFF",
  sidebarInactive: "#94A3B8", // Inactive nav text in dark
  sidebarIconInactive: "#64748B", // Inactive nav icons in dark
  sidebarActive: "rgba(0, 212, 170, 0.15)", // Active nav background
  text:        "#F1F5F9",   // Light text
  textMid:     "#CBD5E1",   // Secondary labels
  textLight:   "#94A3B8",   // Muted hints
  primary:     "#00D4AA",   // Lighter green for dark mode
  primaryDark: "#00B898",   // Darker green
  primaryLight: "#00E6C2",
  primaryButton: "#00E6C2", // Button green
  accent:      "#00D4AA",
  accentDark:  "#00B898",
  accentLight: "rgba(0, 212, 170, 0.15)",
  green:       "#00D4AA",   // Success green
  greenLight:  "#0D3D35",   // Success background
  success:     "#00D4AA",
  successLight: "#0D3D35",
  red:         "#F87171",   // Lighter red
  error:       "#F87171",
  errorLight:  "rgba(248, 113, 113, 0.15)",
  gold:        "#FBBF24",   // Lighter orange
  goldLight:   "#1F2937",   // Orange background
  warning:     "#FBBF24",
  warningLight: "rgba(245, 158, 11, 0.15)",
  purple:      "#A78BFA",   // Lighter purple
  purpleLight: "#1E1B4B",   // Purple background
  blue:        "#60A5FA",   // Lighter blue
  blueLight:   "#1E3A8A",   // Blue background
  info:        "#60A5FA",
  infoLight:   "rgba(96, 165, 250, 0.15)",
  border:      "#1E293B",   // Dark border
  borderLight: "#334155",
  inputBg:     "#0F1A17",   // Dark input background
  inputBorder: "#334155",
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
      aria-label="Toggle theme"
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
        background: isLight ? "#E2E8F0" : "#1E293B",
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
        <Sun size={16} color="#008A60" />
      </div>

      {/* Moon icon for dark mode */}
      <div style={{
        position: "absolute",
        right: 8,
        display: isDark ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Moon size={16} color="#00D4AA" />
      </div>

      {/* Toggle thumb */}
      <div style={{
        width: 24, 
        height: 24, 
        borderRadius: "50%",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: isLight ? "#FFFFFF" : "#0F1A17",
        boxShadow: isLight
          ? "0 2px 4px rgba(0,0,0,0.1)"
          : "0 2px 4px rgba(0,0,0,0.3)",
        transition: "transform 0.3s ease",
        transform: isLight ? "translateX(0)" : "translateX(40px)",
      }}>
        {isLight ? (
          <Sun size={14} color="#008A60" />
        ) : (
          <Moon size={14} color="#00D4AA" />
        )}
      </div>
    </button>
  );
}

export const LightDarkToggle = ThemeToggle;

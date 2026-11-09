// Official GharKaPaisa brand colors matching website
export const BRAND = {
  primaryBlue: '#1B74BB',   // Primary brand blue
  brandGreen:  '#9CD83D',   // Brand green
  deepBlue:    '#0851A1',   // Deep blue
};

export interface ThemeColors {
  // Brand
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  gold: string;
  goldSoft: string;
  purple: string;
  purpleLight: string;
  blue: string;
  blueLight: string;
  teal: string;
  tealDim: string;
  navy: string;
  navyMid: string;
  tealGlow: string;

  // Surfaces
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  card: string;
  cardElevated: string;
  inputBg: string;
  inputBorder: string;

  // Text
  text: string;
  textMid: string;
  textLight: string;

  // Borders
  border: string;
  borderLight: string;
  borderAccent: string;

  // Semantic
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;
  danger: string;
  info: string;
  infoSoft: string;

  // Sidebar / Header
  sidebar: string;
  sidebarGradient: string;

  // Gradients
  gradientPrimary: string[];
  gradientHero: string[];
  gradientGold: string[];
  gradientSuccess: string[];
  gradientCard: string[];
}

export const lightColors: ThemeColors = {
  // Brand
  primary: BRAND.primaryBlue,       // #1B74BB
  primaryDark: BRAND.deepBlue,      // #0851A1
  primaryLight: '#3B82F6',
  primarySoft: '#EBF3FB',
  accent: BRAND.brandGreen,         // #9CD83D
  accentDark: '#7BC32E',
  accentLight: '#D9F7B3',
  gold: '#F59E0B',
  goldSoft: '#FFF1DF',
  purple: '#8B5CF6',
  purpleLight: '#F1EBFF',
  blue: BRAND.primaryBlue,
  blueLight: '#EAF2FF',
  teal: '#008A60',
  tealDim: '#007F5B',
  navy: BRAND.deepBlue,
  navyMid: BRAND.primaryBlue,
  tealGlow: 'rgba(27, 116, 187, 0.15)',

  // Surfaces (light theme)
  bg: '#F5F8FC',                    // Main background
  bgSecondary: '#FFFFFF',           // Surface/cards
  bgTertiary: '#F8FAFC',            // Elevated surface
  card: '#FFFFFF',                  // Card background
  cardElevated: '#FFFFFF',          // Elevated card
  inputBg: '#FFFFFF',               // Input background
  inputBorder: '#CBD5E1',           // Input border

  // Text (light theme)
  text: '#172B43',                  // Primary text
  textMid: '#64748B',               // Secondary text
  textLight: '#94A3B8',             // Muted text

  // Borders (light theme)
  border: '#E2E8F0',                // Border color
  borderLight: '#F1F5F9',           // Light border
  borderAccent: BRAND.primaryBlue,  // Primary border

  // Semantic (light theme)
  success: '#10B981',
  successSoft: '#D1FAE5',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  error: '#EF4444',
  errorSoft: '#FEE2E2',
  danger: '#EF4444',
  info: BRAND.primaryBlue,
  infoSoft: '#DBEAFE',

  // Sidebar / Header
  sidebar: BRAND.deepBlue,
  sidebarGradient: BRAND.primaryBlue,

  // Gradients
  gradientPrimary: [BRAND.primaryBlue, BRAND.deepBlue],
  gradientHero: [BRAND.deepBlue, BRAND.primaryBlue],
  gradientGold: ['#F59E0B', '#F97316'],
  gradientSuccess: [BRAND.brandGreen, '#7BC32E'],
  gradientCard: ['#FFFFFF', '#F5F8FC'],
};

export const darkColors: ThemeColors = {
  // Brand
  primary: BRAND.primaryBlue,       // #1B74BB
  primaryDark: '#3B82F6',
  primaryLight: '#60A5FA',
  primarySoft: 'rgba(27, 116, 187, 0.2)',
  accent: BRAND.brandGreen,         // #9CD83D
  accentDark: '#7BC32E',
  accentLight: 'rgba(156, 216, 61, 0.15)',
  gold: '#FBBF24',
  goldSoft: 'rgba(251, 191, 36, 0.15)',
  purple: '#A78BFA',
  purpleLight: 'rgba(167, 139, 250, 0.15)',
  blue: '#60A5FA',
  blueLight: 'rgba(59, 130, 246, 0.15)',
  teal: '#10B981',
  tealDim: '#059669',
  navy: '#0851A1',
  navyMid: '#1B74BB',
  tealGlow: 'rgba(27, 116, 187, 0.25)',

  // Surfaces (dark theme — not pure black)
  bg: '#101A2B',                    // Main background
  bgSecondary: '#19283C',           // Surface/cards
  bgTertiary: '#233D5B',            // Elevated surface
  card: '#19283C',                  // Card background
  cardElevated: '#233D5B',          // Elevated card
  inputBg: '#19283C',               // Input background
  inputBorder: '#475569',           // Input border

  // Text (dark theme)
  text: '#F1F5F9',                  // Primary text
  textMid: '#A8B7CA',               // Secondary text
  textLight: '#64748B',             // Muted text

  // Borders (dark theme)
  border: '#34465D',                // Border color
  borderLight: '#475569',           // Light border
  borderAccent: BRAND.primaryBlue,  // Primary border

  // Semantic (dark theme)
  success: '#10B981',
  successSoft: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.15)',
  error: '#EF4444',
  errorSoft: 'rgba(239, 68, 68, 0.15)',
  danger: '#EF4444',
  info: BRAND.primaryBlue,
  infoSoft: 'rgba(27, 116, 187, 0.15)',

  // Sidebar / Header
  sidebar: BRAND.deepBlue,
  sidebarGradient: BRAND.primaryBlue,

  // Gradients
  gradientPrimary: [BRAND.primaryBlue, '#0851A1'],
  gradientHero: ['#101A2B', '#19283C'],
  gradientGold: ['#FBBF24', '#F97316'],
  gradientSuccess: [BRAND.brandGreen, '#7BC32E'],
  gradientCard: ['#19283C', '#101A2B'],
};

// Default static colors export for backward compatibility
export const colors = lightColors;

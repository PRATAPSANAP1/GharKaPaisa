# GharKaPaisa - Design System & Theming Guidelines

This document outlines the design tokens, theme integration patterns, and maintenance procedures for the front-end layout to guarantee full compatibility with both Light and Dark color modes.

---

## 1. Theme Configuration

The styling parameters are defined in [ThemeContext.jsx](file:///d:/Internship/yohesa/frontend/src/contexts/ThemeContext.jsx). It exposes:
- **`isDark`**: A boolean flag indicating whether dark mode is currently active.
- **`toggle`**: A helper function to switch color schemes.
- **`C`**: The live theme color object matching the active state (either `LIGHT` or `DARK`).

### Design Tokens (Colors)

| Token Name | Light Mode Value | Dark Mode Value | Usage / Semantic Role |
| :--- | :--- | :--- | :--- |
| `bg` | `#F8FAFC` | `#000000` | Main application page canvas background |
| `bgSecondary` | `#EEF2FF` | `#000000` | Highlight background / alternate row background |
| `card` | `#FFFFFF` | `#000000` | Card, dialog, and floating modal container surface |
| `text` | `#111827` | `#F8FAFC` | Primary text and dark body headers (High Contrast) |
| `textMid` | `#64748B` | `#E4E4E7` | Secondary labels, descriptions, and metadata |
| `textLight` | `#94A3B8` | `#A1A1AA` | Disabled indicators, inline tips, and mute colors |
| `primary` | `#4F46E5` | `#F97316` | Accent blue/indigo (light) & vibrant orange (dark) |
| `primaryDark` | `#3730A3` | `#EA580C` | Gradient stops for primary actions |
| `border` | `#E5E7EB` | `#27272A` | Standard divider and element bounds |
| `inputBg` | `#FFFFFF` | `#000000` | Input form fields canvas background |

---

## 2. Accessing Themes in React Components

Always import and use the `useTheme` hook to retrieve active styles. Avoid hardcoding HEX values for colors that change with modes.

### Recommended Pattern (Inline Styles)

```jsx
import { useTheme } from '../../../contexts/ThemeContext';

export default function MyComponent() {
  const { C, isDark } = useTheme();

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, padding: '24px' }}>
      <h3 style={{ color: C.text }}>Header Text</h3>
      <p style={{ color: C.textMid }}>Muted description goes here.</p>
    </div>
  );
}
```

### Style Factory (`makeS`)

For standard layout components, the context provides `makeS(C)` to construct reusable UI elements:
- `card`: Renders a themed card canvas layout.
- `tag(color)`: Generates status tags with light transparency fill.
- `btn(variant)`: Computes button hover buttons (primary, outline, ghost).
- `input`: Form input styles with dynamic border focus colors.

Example:
```jsx
import { useTheme, makeS } from '../../../contexts/ThemeContext';

const { C } = useTheme();
const S = makeS(C);

<input style={S.input} placeholder="Enter name" />
```

---

## 3. High-Contrast Status Indicators

Status badges must adapt when switched to dark mode to maintain a high contrast ratio and accessibility standards (WCAG 2.1 AA/AAA).

### Implementation Best Practice

For status tags (e.g. Approved, Processing, Pending), use a **semi-transparent background** (using `rgba` or appending hex alphas) combined with a high-contrast text color:

```javascript
const isThemeDark = C.bg === "#000000";

const badgeStyle = {
  background: isThemeDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
  color: isThemeDark ? '#3B82F6' : '#2563EB',
  border: `1px solid ${isThemeDark ? '#3B82F6' : '#3B82F6'}40`
};
```

---

## 4. Maintenance & Compliance Procedures

To maintain design continuity across future additions:
1. **Never Hardcode Background/Text Colors**: Always map surfaces to `C.card` or `C.bg`, and typography to `C.text` or `C.textMid`.
2. **Contrast Audit**: Use browser accessibility checkers (Lighthouse / Axe) to verify contrast ratios are above **4.5:1** for body text and **3.0:1** for UI components.
3. **Verify Transitions**: Avoid abrupt layout jumps. Use transition attributes for smooth switches:
   `transition: 'background 0.25s ease, color 0.2s ease'`
4. **Compile Checks**: Run `npm run build` after editing styles to ensure syntax is clean.

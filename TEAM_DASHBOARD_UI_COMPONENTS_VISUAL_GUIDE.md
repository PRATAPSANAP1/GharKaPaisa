# Team Dashboard UI Components - Visual Reference Guide

## Header Section
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  👥 Team Management Dashboard                    [Invite Team Member] ♻️   │
│  Real-time downline metrics, multi-tier team tree, analytics...            │
│                                                                             │
│  Gradient: from-slate-900 via-slate-900 to-indigo-950/60                   │
│  Border: border-indigo-500/30                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Invite Button
```
Button Styling:
├─ Background: from-indigo-600 to-indigo-500
├─ Hover: from-indigo-500 to-indigo-400
├─ Icon: UserPlus (4x4)
├─ Text: "Invite Team Member"
├─ Padding: px-5 py-2.5
├─ Border Radius: rounded-xl
├─ Shadow: shadow-lg shadow-indigo-600/30
└─ Responsive: flex wrap on mobile
```

---

## Tab Navigation Bar
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Dashboard] [Team Tree] [Members] [Analytics] [Activity] [Goals] [Settings] │
│  Active: Indigo gradient with scale-[1.02] hover effect                    │
│  Inactive: Text-slate-400 hover:text-slate-200 hover:bg-slate-800/60       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## KPI Cards Grid (Dashboard Tab)

### Card Structure
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Desktop: 4 columns │ Tablet: 2 columns │ Mobile: 1 column                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Card 1: Total Downline (Indigo)
```
╔════════════════════════════════════╗
║ TOTAL DOWNLINE                   [◆] ║
║                                     ║
║ 250                                 ║
║    125 Direct / 125 Indirect        ║
║                                     ║
║ Entire team hierarchy count         ║
║                                     ║
║ Gradient: to-indigo-950/40         ║
║ Icon: Users (Indigo)               ║
╚════════════════════════════════════╝
```

### Card 2: New Joinings (Emerald)
```
╔════════════════════════════════════╗
║ NEW JOININGS                     [+] ║
║                                     ║
║ 5                                   ║
║    +32 This Month                   ║
║                                     ║
║ Active recruits growth rate         ║
║                                     ║
║ Gradient: to-emerald-950/40        ║
║ Icon: UserPlus (Emerald)           ║
╚════════════════════════════════════╝
```

### Card 3: Team Business (Blue)
```
╔════════════════════════════════════╗
║ TEAM BUSINESS                    [📈] ║
║                                     ║
║ ₹2,50,00,000                       ║
║    125 Approved                     ║
║                                     ║
║ Total disbursals & credit limits    ║
║                                     ║
║ Gradient: to-blue-950/40           ║
║ Icon: TrendingUp (Blue)            ║
╚════════════════════════════════════╝
```

### Card 4: Team Commission (Amber)
```
╔════════════════════════════════════╗
║ TEAM COMMISSION                  [💰] ║
║                                     ║
║ ₹50,000                             ║
║    ₹5,00,000 Total                  ║
║                                     ║
║ Today: ₹2,500                       ║
║                                     ║
║ Gradient: to-amber-950/40          ║
║ Icon: DollarSign (Amber)           ║
╚════════════════════════════════════╝
```

### Cards 5-8: Status Metrics (Slate)
```
╔════════════════════════════════════╗
║ MEMBER STATUS          Active 180   ║
║                        Inactive 70  ║
║                                     ║
║ KYC VERIFICATION       Verified 200 ║
║                        Pending 50   ║
║                                     ║
║ APPLICATIONS STATUS    Submitted 80 ║
║                        Approved 60  ║
║                                     ║
║ Gradient: from-slate-900 to-slate- ║
║ 900 (no color, baseline)           ║
╚════════════════════════════════════╝
```

---

## Performance Cards Section

### Top Performer Card (Amber Border)
```
╔════════════════════════════════════╗
║ 👑 TOP PERFORMER           #1       ║
║                                     ║
║ [Avatar] Rajesh Kumar               ║
║          Code: RAJ2024              ║
║                                     ║
║ Business: ₹25,00,000 | Apps: 45    ║
║                                     ║
║ Gradient: from-amber-950/30         ║
║ Border: border-amber-500/30         ║
║ Hover: border-amber-500/60          ║
╚════════════════════════════════════╝
```

### Needs Support Card (Slate)
```
╔════════════════════════════════════╗
║ ⚠️  NEEDS SUPPORT          #200     ║
║                                     ║
║ [Avatar] Priya Singh                ║
║          Code: PRI2024              ║
║                                     ║
║ Business: ₹50,000 | Apps: 2        ║
║                                     ║
║ Gradient: from-slate-900           ║
║ Border: border-slate-800           ║
║ Hover: border-slate-700            ║
╚════════════════════════════════════╝
```

---

## Invite Team Member Modal

### Modal Structure
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Overlay: bg-black/60 backdrop-blur-sm                                       │
│ Container: Fixed center, max-width-md                                       │
│                                                                             │
│ ╔═══════════════════════════════════════════════════════════════════════╗  │
│ ║ [+] Invite Team Member                                              ║  │
│ ║ Add a new partner to your growing network                           ║  │
│ ║ ─────────────────────────────────────────────────────────────────── ║  │
│ ║                                                                     ║  │
│ ║ Full Name *                                                         ║  │
│ ║ [────────────────────────── E.g., Rajesh Kumar ──────────────────] ║  │
│ ║                                                                     ║  │
│ ║ Email Address *                                                     ║  │
│ ║ [──────────────────── E.g., rajesh@example.com ─────────────────] ║  │
│ ║                                                                     ║  │
│ ║ Mobile Number *                                                     ║  │
│ ║ [────────────────────────── E.g., 9876543210 ──────────────────] ║  │
│ ║                                                                     ║  │
│ ║ Designation (Optional)                                              ║  │
│ ║ [▼ Sales Executive                                               ] ║  │
│ ║   • Sales Executive                                                 ║  │
│ ║   • Sales Manager                                                   ║  │
│ ║   • Area Manager                                                    ║  │
│ ║   • Regional Manager                                                ║  │
│ ║   • Business Partner                                                ║  │
│ ║                                                                     ║  │
│ ║ [Cancel]                          [✉️  Send Invite]                ║  │
│ ║ ─────────────────────────────────────────────────────────────────── ║  │
│ ║ Invitation sent via email and SMS with registration link           ║  │
│ ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Modal Colors
```
Header Background: from-indigo-600 to-indigo-500
Input Backgrounds: bg-slate-800 border-slate-700
Input Focus: border-indigo-500 ring-indigo-500/20
Buttons:
├─ Cancel: bg-slate-800 hover:bg-slate-700
├─ Submit: from-indigo-600 to-indigo-500 (disabled:opacity-50)
└─ Loading: RefreshCw animate-spin icon
```

---

## Team Members Tab

### Member List View
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Team Members List                              [⚙️ Filters] [📥 Export CSV] │
│ Total 285 registered members in your downline network                       │
│                                                                             │
│ [Search by name, code...]                                                  │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐
│ │ Partner Code │ Name │ Email │ Status │ KYC │ Applications │ Business   │
│ ├─────────────────────────────────────────────────────────────────────────┤
│ │ RAJ2024 │ Rajesh Kumar │ raj@... │ ✅ Active │ ✅ Verified │ 45 │ ₹25Cr │
│ │ PRIZ024 │ Priya Singh  │ pri@... │ ✅ Active │ ⏳ Pending │  2 │ ₹50L  │
│ │ ARI2024 │ Arjun Patel  │ ari@... │ ⚠️ Inactive │ ✅ Verified │ 8 │ ₹2Cr  │
│ └─────────────────────────────────────────────────────────────────────────┘
│
│ [< Previous]                              Page 1 of 15                [Next >]
│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Filter Options
```
Status Filter:  [All] [Active] [Inactive] [Pending]
Rank Filter:    [L1] [L2] [L3] [L4+]
KYC Filter:     [All] [Verified] [Pending] [Rejected]
Period Filter:  [All Time] [This Month] [This Week] [Today]
```

---

## Team Analytics Tab

### Conversion Funnel
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Team Performance Analytics & Conversion Funnel                              │
│ Deep insights into team recruitment velocity, business sales, commission... │
│                                              [7d] [30d] [90d] [1y]         │
│                                                                             │
│ ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│ │ Clicks   │───▶│Register  │───▶│ Apps     │───▶│Approved  │               │
│ │ 5000     │    │ 1500     │    │ 750      │    │ 300      │               │
│ │          │    │ 30% Conv │    │ 50% Conv │    │ 40% Conv │               │
│ └──────────┘    └──────────┘    └──────────┘    └──────────┘               │
│                                                                             │
│ Business Trend (30 days)                                                    │
│ ₹ │                                                                         │
│   │                    ╱╲                                                   │
│   │          ╱╲      ╱    ╲                                                 │
│   │        ╱    ╲  ╱        ╲                                               │
│   │──────────────────────────────────────                                   │
│   │ Day1 Day5 Day10 Day15 Day20 Day25 Day30                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Team Activity Tab

### Activity Timeline
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔴 Live Team Activity Stream                                               │
│ Real-time updates on team recruitments, sales, and milestone approvals     │
│                                                                             │
│ ┌─ [+]  Rajesh Kumar joined as Level 1 Partner      10:30 AM Today        │
│ │      Actor: Priya Singh (PRIZ2024)                                       │
│ │                                                                          │
│ ├─ [📄] Application SUB-2024-001 submitted           09:45 AM Today        │
│ │      Actor: Arjun Patel (ARI2024)                                        │
│ │                                                                          │
│ ├─ [✅] Application APP-2024-085 approved            09:15 AM Today        │
│ │      Actor: Rajesh Kumar (RAJ2024)                                       │
│ │                                                                          │
│ └─ [💰] Team commission ₹5,000 credited             08:30 AM Today        │
│      Actor: System (AUTO-PROCESS)                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Activity Types & Colors
```
[+] Member Joined          → UserPlus icon (Emerald-400)
[📄] Application Submitted → FileCheck icon (Amber-400)
[✅] Application Approved  → CheckCircle2 icon (Emerald-400)
[💰] Commission Earned     → DollarSign icon (Amber-300)
[ℹ️] Other Events          → Activity icon (Indigo-400)
```

---

## Team Goals & Leaderboard Tab

### Goals Progress
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎯 Monthly Target Goals & Progress                                         │
│                                                                             │
│ Recruitment Target                         Business Target                 │
│ 12 / 20 Members                            ₹50,00,000 / ₹1Cr             │
│ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░] 60%  [███████░░░░░░░░░░░░] 35%     │
│                                                                             │
│ Commission Target                          Application Target              │
│ ₹3,50,000 / ₹5,00,000                     45 / 60 Apps                   │
│ [█████████░░░░░░░░░░░░░░░░░░] 70%        [█████████░░░░░░░░░░░] 75%    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Leaderboard
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏆 Top Performers Leaderboard                                              │
│                                                                             │
│ Rank │ Name              │ Business      │ Applications │ Score │ Trend    │
│ ───────────────────────────────────────────────────────────────────────     │
│  1   │ 👑 Rajesh Kumar   │ ₹25,00,000   │ 45           │ 9.5   │ ↑ +2    │
│  2   │ 🥈 Suresh Sharma  │ ₹18,50,000   │ 38           │ 8.8   │ ↓ -1    │
│  3   │ 🥉 Priya Singh    │ ₹15,25,000   │ 32           │ 8.2   │ ↑ +5    │
│  4   │ Vikram Gupta      │ ₹12,75,000   │ 28           │ 7.6   │ →       │
│  5   │ Neha Kapoor       │ ₹10,50,000   │ 22           │ 6.9   │ ↑ +3    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Team Member Detail Drawer

### Drawer Layout (Right Side Panel)
```
╔═════════════════════════════════════════════╗
║ Rajesh Kumar - RAJ2024         [× Close]   ║
║ Level 1 Partner (Direct)                    ║
║ ─────────────────────────────────────────── ║
║                                             ║
║ Profile                                     ║
║ [Avatar] Rajesh Kumar                       ║
║ Email: raj@example.com                      ║
║ Mobile: 9876543210                          ║
║ Joined: 15 Jan 2024                         ║
║                                             ║
║ Commission Summary                          ║
║ Level 1 Apps: 45  | ₹9,00,000              ║
║ Level 2 Apps: 125 | ₹6,25,000              ║
║ Total: ₹15,25,000                          ║
║                                             ║
║ Wallet Balance                              ║
║ Available: ₹2,50,000                        ║
║ Locked: ₹1,00,000                          ║
║ Withdrawn: ₹12,00,000                       ║
║                                             ║
║ Recent Applications                         ║
║ APP-2024-451 ✅ ₹2,50,000  (3 days ago)    ║
║ APP-2024-450 ✅ ₹1,75,000  (1 week ago)    ║
║ APP-2024-449 ⏳ Pending    (2 weeks ago)   ║
║                                             ║
║ [Edit Member] [Send Message] [View Tree]   ║
║                                             ║
╚═════════════════════════════════════════════╝
```

### Drawer Colors
```
Header: from-indigo-600 to-indigo-500
Sections: bg-slate-800/50 border-slate-700
Icons: Colored based on status (Green=Approved, Amber=Pending)
Buttons: Indigo gradient or slate secondary
```

---

## Color Reference Chart

```
Component                  Primary Color        Accent Color         Usage
────────────────────────────────────────────────────────────────────────────────
KPI Cards                  Gradient Variants    Colored Icons         Dashboard
- Downline                 Indigo-950          Indigo-400            👥
- Joinings                 Emerald-950         Emerald-400           ✨
- Business                 Blue-950            Blue-400              📈
- Commission               Amber-950           Amber-400             💰

Modal                      Indigo-600→500      Indigo-500/20         Forms
Tab Active                 Indigo-600→500      White                 Navigation
Button Primary             Indigo-600→500      Indigo-600/30 Shadow  Actions
Button Secondary           Slate-800           Slate-200             Alternative
Text Primary               White               N/A                   Headings
Text Secondary             Slate-400           N/A                   Descriptions
Background                 Slate-900/900       N/A                   Page BG
Borders                    Slate-700/800       Colored/[color]/30    Separators
Success                    Emerald-400         Emerald-500/20        Positive
Alert/Error                Rose-400/Red-400    Rose-500/20           Warnings
Neutral                    Slate-400/500       N/A                   Inactive
```

---

## Responsive Behavior Examples

### Mobile (< 640px)
```
Header:     Full width, stack buttons vertically
Cards:      1 column grid, full width
Tabs:       Horizontal scroll with sticky indicators
Modal:      Full width, bottom sheet style on scroll
Table:      Card view with horizontal scroll
```

### Tablet (640px - 1024px)
```
Header:     Full width, buttons inline
Cards:      2 column grid
Tabs:       Inline with scroll if needed
Modal:      Centered, 90% width, max-width-md
Table:      Scrollable table view
```

### Desktop (> 1024px)
```
Header:     Full width, buttons inline
Cards:      4 column grid
Tabs:       Inline no scroll
Modal:      Centered, exact max-width-md
Table:      Full width with all columns
Drawer:     Right side panel, 33% width
```

---

## Animation Reference

```
Modal Entry:     fade-in duration-300
Modal Exit:      fade-out duration-200
Tab Switch:      transition-all duration-300
Button Hover:    scale-105 shadow-lg
Icon Hover:      scale-110 transition-transform
Card Hover:      border color change, smooth transition
Loading:         animate-pulse (skeleton) / animate-spin (spinner)
Success Message: fadeIn 1.5s then fadeOut
Drawer Slide:    slide-in from right, smooth translate
```

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: ✅ Complete & Verified

# Partner vs Team Member - Component Access & UI Mapping

**Document Purpose**: Map every page component showing Partner vs Team Member access, display rules, and UI styling  
**Date**: August 2026

---

## 1. DASHBOARD (`/partner/dashboard`)

### Component Hierarchy
```
PartnerDashboardComponent (Main Container)
├── DashboardHeader
│   ├── Welcome Message (Partner: "Welcome, [Partner Name]" | Team Member: "Welcome, [Team Member Name]")
│   ├── Partner Code Display (Partner: Shows all codes | Team Member: Shows own code only)
│   └── Quick Stats Bar
│
├── StatCards Row (Responsive Grid - 4 columns desktop, 2 mobile)
│   ├── Total Customers Card
│   │   ├── Partner: Shows ALL customers under hierarchy
│   │   └── Team Member: Shows only MY customers
│   ├── Total Applications Card
│   │   ├── Partner: Shows personal + team applications
│   │   └── Team Member: Shows only own applications
│   ├── Wallet Balance Card
│   │   ├── Partner: Shows total (personal + team commission)
│   │   └── Team Member: Shows only personal balance
│   └── Total Earnings Card
│       ├── Partner: Personal + Team Commission + Referral
│       └── Team Member: Own approved commissions only
│
├── WalletCard (Full width or 2/3 width)
│   ├── Partner:
│   │   ├── Available Balance
│   │   ├── Locked Balance
│   │   ├── Team Commission Breakdown
│   │   ├── Personal Commission
│   │   └── Withdraw Button
│   └── Team Member:
│       ├── Available Balance
│       ├── Locked Balance
│       └── Withdraw Button (Own wallet only)
│
├── QuickActionButtons (2-3 per row)
│   ├── Partner:
│   │   ├── Add Lead
│   │   ├── Submit Application
│   │   ├── View Team (Team Member count badge)
│   │   ├── Invite Team Member
│   │   └── Download Reports
│   └── Team Member:
│       ├── Add Lead
│       ├── Submit Application
│       ├── Request Upgrade to Partner
│       └── View Marketing Materials
│
├── RecentActivitySection (Scrollable)
│   ├── Partner:
│   │   ├── Shows: Own applications + Team member joins + Team applications
│   │   ├── Filters: All, Personal, Team
│   │   └── Contains: Actor name, action, timestamp, status badge
│   └── Team Member:
│       ├── Shows: Own applications only
│       └── No team activity
│
├── TeamNetworkCard (Partner ONLY - Hidden for Team Member)
│   ├── Total Team Members (with Level breakdown)
│   ├── This Month Joinings
│   ├── Team Business Value
│   ├── Top Performer Card
│   └── "View Full Team Network" Link → /partner/team-network
│
├── TopProductsWidget
│   ├── Partner: Shows products performing across entire downline
│   └── Team Member: Shows products they personally sold
│
└── TrainingReminder / NotificationBanner
    ├── Partner: "Train your team members"
    └── Team Member: "Complete pending training modules"
```

### Color Scheme & Styling
```css
/* Dashboard Cards */
.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.stat-card.partner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* Purple */
}

.stat-card.team-member {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); /* Pink-Red */
}

.wallet-card {
  background: #ffffff;
  border-left: 5px solid #667eea;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.team-network-card {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); /* Green - Partner only */
  color: white;
  border-radius: 12px;
  padding: 20px;
}

.action-button {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.action-button:hover {
  background: #764ba2;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.restricted-action-button {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
  opacity: 0.5;
}

/* Activity Stream */
.activity-item {
  border-left: 3px solid #667eea;
  padding-left: 15px;
  margin-bottom: 12px;
  font-size: 14px;
}

.activity-item.partner-action {
  border-left-color: #667eea;
}

.activity-item.team-action {
  border-left-color: #f5576c;
}
```

### UI Layout (Desktop)
```
┌─────────────────────────────────────────────────────────────────┐
│ Welcome Back, [Partner/Team Member Name]          Wallet: ₹45,000 │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ │  Customers   │ │Applications  │ │   Wallet     │ │  Earnings    │
│ │     245      │ │      89      │ │  ₹45,000    │ │ ₹1,85,000    │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
├─────────────────────────────────────────────────────────────────┤
│ ╔═══════════════════════════════╗ ╔═════════════════════════════╗
│ ║  WALLET & BALANCE             ║ ║ TEAM NETWORK (PARTNER ONLY) ║
│ ║ Available: ₹45,000            ║ ║ Members: 12                 ║
│ ║ Locked: ₹5,000                ║ ║ This Month: +3              ║
│ ║ Team Commission: ₹20,000      ║ ║ Business: ₹50,00,000       ║
│ ║ [Withdraw]                    ║ ║ [View Full Network]         ║
│ ╚═══════════════════════════════╝ ╚═════════════════════════════╝
├─────────────────────────────────────────────────────────────────┤
│ QUICK ACTIONS:
│ [Add Lead] [Submit App] [View Team] [Invite Member] [Reports]
├─────────────────────────────────────────────────────────────────┤
│ RECENT ACTIVITY
│ ├─ You submitted application for Rohit (30 min ago) - Pending
│ ├─ Amit joined your team (2 hours ago)
│ ├─ Team Member: Application approved for Priya (4 hours ago)
│ └─ You earned commission ₹1,000 (Yesterday)
└─────────────────────────────────────────────────────────────────┘
```

### UI Layout (Mobile - Team Member)
```
┌──────────────────────────┐
│ Welcome, Amit            │ ← Team Member view
├──────────────────────────┤
│ ┌──────────┐ ┌─────────┐ │
│ │Customers │ │   Apps  │ │
│ │    25    │ │   12    │ │
│ └──────────┘ └─────────┘ │
├──────────────────────────┤
│ WALLET                   │
│ Available: ₹8,500        │
│ Locked: ₹1,200           │
│ [Withdraw]               │
├──────────────────────────┤
│ QUICK ACTIONS:           │
│ [Add Lead]               │
│ [Submit App]             │
│ [Upgrade to Partner]     │ ← Special for Team Member
├──────────────────────────┤
│ MY APPLICATIONS          │
│ • Approved: 8            │
│ • Pending: 2             │
│ • Rejected: 1            │
└──────────────────────────┘
```

### Backend Files Involved
- `frontend/src/modules/partner/dashboard/PartnerDashboardComponent.jsx`
- `frontend/src/modules/partner/dashboard/PartnerTeam.jsx`
- `frontend/src/components/cards/StatCard.jsx` (if separate)
- `frontend/src/modules/partner/wallet/PartnerWallet.jsx` (data source)
- API: `GET /api/v1/partner/dashboard`
- API: `GET /api/v1/team/dashboard` (for Team Members)

---

## 2. PRODUCTS (Credit Cards, Loans, Insurance) (`/partner/credit-cards`, `/partner/loans`, `/partner/insurance`)

### Component Hierarchy
```
ProductsPage (Shared template)
├── ProductHeader
│   ├── Title: [Product Type] 
│   ├── SubHeader: "Manage your [Product] applications"
│   └── Partner & Team Member see SAME content
│
├── SearchBar (Full width)
│   ├── Search by: Product name, bank, category
│   ├── Hidden for Team Member: Team filters
│   └── Visible for Team Member: Personal filters only
│
├── FilterPanel
│   ├── Partner sees:
│   │   ├── Filter by: Bank, Status, Commission Rate
│   │   ├── Show: My Apps + Team Apps toggle
│   │   └── Sort: Recent, Popular, Highest Commission
│   └── Team Member sees:
│       ├── Filter by: Bank, Status
│       └── Sort: Recent, Popular
│
├── RecentlyUsedBanks (Carousel - 6 items)
│   ├── Bank Logo
│   ├── Bank Name
│   ├── Active Cards Count (both see this)
│   └── Last Used Date
│
├── BankGrid (Responsive: 4 col desktop, 2 col tablet, 1 col mobile)
│   └── For each Bank:
│       ├── BankCard
│       │   ├── Bank Logo
│       │   ├── Bank Name
│       │   ├── Card Count Badge
│       │   ├── Interest Rate (if applicable)
│       │   ├── Partner sees: Commission ₹/% breakdown
│       │   ├── Team Member sees: Commission (own only)
│       │   └── Click → BankDetail Page
│
├── ProductCardsGrid (Under selected bank)
│   └── For each Product:
│       ├── ProductCard
│       │   ├── Card Image (lazy-loaded)
│       │   ├── Card Name
│       │   ├── Bank Name
│       │   ├── Key Features (bullet points, max 3)
│       │   ├── Interest Rate / Features
│       │   ├── Commission Info
│       │   │   ├── Partner: Personal rate + Team rate breakdown
│       │   │   └── Team Member: Commission rate only
│       │   ├── Status Badge (Active/Inactive/Coming Soon)
│       │   ├── Apply Button
│       │   └── Click → ProductDetail Modal
│
├── PromotionalBanner (Sticky - Top or Bottom)
│   ├── Content: "Share this product with your network!"
│   ├── Partner: Shows team earnings potential
│   └── Team Member: Shows referral earnings potential
│
└── FAQAccordion
    ├── Partner & Team Member see SAME FAQs
    └── Content: Product details, eligibility, requirements
```

### Color Scheme & Styling
```css
/* Bank Cards */
.bank-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.bank-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.bank-card.active {
  box-shadow: inset 0 0 0 3px #fff;
}

/* Product Card */
.product-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  transition: all 0.3s ease;
}

.product-card:hover {
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  border-color: #667eea;
}

.product-card img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin-bottom: 10px;
}

.commission-badge {
  background: #fff3cd;
  color: #856404;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 8px;
}

.commission-badge.team-member {
  background: #e7f3ff;
  color: #0056b3;
}

/* Apply Button */
.apply-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  margin-top: 10px;
}

.apply-button:hover {
  background: #764ba2;
}

/* Promotional Banner */
.promo-banner {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  margin: 20px 0;
}

.promo-banner.team-member {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
```

### UI Layout (Desktop - Partner)
```
┌──────────────────────────────────────────────────────────────┐
│ CREDIT CARDS & PERSONAL LOANS                                │
├──────────────────────────────────────────────────────────────┤
│ [Search...........] [Bank ▼] [Status ▼] [My Apps + Team Apps] │
├──────────────────────────────────────────────────────────────┤
│ RECENTLY USED
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ │ HDFC    │ │   ICICI │ │   AXIS  │ │   YES   │
│ │  5 Apps │ │  3 Apps │ │  2 Apps │ │  1 App  │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘
├──────────────────────────────────────────────────────────────┤
│ ALL BANKS
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ │                 │ │                 │ │                 │
│ │ ★ HDFC BANK     │ │   ICICI BANK    │ │   AXIS BANK     │
│ │   5 Active Apps │ │   3 Active Apps │ │   2 Active Apps │
│ │                 │ │                 │ │                 │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘
├──────────────────────────────────────────────────────────────┤
│ HDFC BANK PRODUCTS (Click → Selected)
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ │ HDFC MoneyBack Card │ │ HDFC Cashback+ Card │ ...
│ │ Rate: 1.8% - 4.2%   │ │ Rate: 1.2% - 3.5%   │
│ │ You get: 1.5% (90%) │ │ You get: 1.0% (90%) │
│ │ Your Team: 0.15%(10%)│ │ Your Team: 0.1%(10%)│
│ │ [Apply Now]         │ │ [Apply Now]         │
│ └────────────┘ └────────────┘ └────────────┘
├──────────────────────────────────────────────────────────────┤
│ 🟢 Share this product with your team and earn ₹500 per approval
└──────────────────────────────────────────────────────────────┘
```

### UI Layout (Desktop - Team Member)
```
┌──────────────────────────────────────────────────────────────┐
│ CREDIT CARDS & PERSONAL LOANS                                │
├──────────────────────────────────────────────────────────────┤
│ [Search...........] [Bank ▼] [Status ▼]                      │
├──────────────────────────────────────────────────────────────┤
│ RECENTLY USED
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ │ HDFC    │ │   ICICI │ │   AXIS  │ │   YES   │
│ │  My Apps│ │  My App │ │   -     │ │   -     │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘
├──────────────────────────────────────────────────────────────┤
│ ALL BANKS
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ │                 │ │                 │ │                 │
│ │ ★ HDFC BANK     │ │   ICICI BANK    │ │   AXIS BANK     │
│ │   My Apps: 2    │ │   My Apps: 1    │ │   My Apps: 0    │
│ │                 │ │                 │ │                 │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘
├──────────────────────────────────────────────────────────────┤
│ HDFC BANK PRODUCTS
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ │ HDFC MoneyBack Card │ │ HDFC Cashback+ Card │ ...
│ │ Rate: 1.8% - 4.2%   │ │ Rate: 1.2% - 3.5%   │
│ │ Your Commission: 1.5%│ │ Your Commission:1.0%│
│ │ [Apply Now]         │ │ [Apply Now]         │
│ └────────────┘ └────────────┘ └────────────┘
└──────────────────────────────────────────────────────────────┘
```

### Backend Files Involved
- `frontend/src/modules/partner/products/` (Product listing)
- `frontend/src/modules/partner/dashboard/PartnerDashboardComponent.jsx` (Quick links)
- `frontend/src/modules/partner/leads/PartnerCrm.jsx` (Application submission)
- API: `GET /api/v1/products`
- API: `GET /api/v1/banks`

---

## 3. CUSTOMERS MODULE (`/partner/customers`)

### Component Hierarchy

#### Partner View
```
CustomersPage (Partner)
├── PageHeader
│   ├── Title: "Customers"
│   ├── Subtitle: "All customers under your hierarchy"
│   └── Action Buttons:
│       ├── [+ Add Customer]
│       ├── [🔄 Assign to Team Member]
│       └── [📥 Export CSV]
│
├── StatsBar (4 columns)
│   ├── Total Customers: 245
│   ├── My Customers: 120 (added by partner)
│   ├── Team Customers: 125 (added by team members)
│   └── Active (30 days): 180
│
├── TabNavigation
│   ├── Tab 1: All Customers (245 total)
│   ├── Tab 2: My Customers (120)
│   ├── Tab 3: Team Customers (125)
│   └── Tab 4: Unassigned (0)
│
├── SearchBar & FilterPanel
│   ├── Search: Name, Mobile, Email, PAN
│   ├── Filters:
│   │   ├── Assigned to: [Partner Self] [Team Member 1] [Team Member 2] ...
│   │   ├── Status: Active, Inactive, Blocked
│   │   ├── Last Activity: Today, Last 7 days, Last 30 days
│   │   └── Applications: Has Applied, No Application
│   └── Sort: Recent, Alphabetical, Activity
│
├── CustomersTable (Scrollable)
│   └── Columns:
│       ├── Customer Name (Link to detail)
│       ├── Mobile
│       ├── Email
│       ├── PAN (Last 4 digits)
│       ├── Status (Active/Inactive)
│       ├── Assigned To (Partner name / Team Member name)
│       ├── Applications (Count badge)
│       ├── Last Activity (Date)
│       └── Actions:
│           ├── [View] (→ CustomerDetail)
│           ├── [Edit]
│           ├── [Reassign] (modal to pick team member)
│           └── [Delete] (soft delete)
│
├── BulkActionsToolbar (When rows selected)
│   ├── [✓] Selected: 5
│   ├── [Assign Selected] (modal)
│   ├── [Export Selected]
│   └── [Delete Selected] (confirm dialog)
│
└── Pagination
    └── 25 customers per page
```

#### Team Member View
```
CustomersPage (Team Member)
├── PageHeader
│   ├── Title: "My Customers"
│   ├── Subtitle: "Customers you've added"
│   └── Action Buttons:
│       ├── [+ Add Customer]
│       └── [📥 Export CSV]
│
├── StatsBar (3 columns)
│   ├── Total Customers: 25
│   ├── Active (30 days): 18
│   └── With Applications: 12
│
├── TabNavigation (Simplified)
│   ├── Tab 1: All My Customers (25)
│   └── Tab 2: With Applications (12)
│
├── SearchBar & FilterPanel
│   ├── Search: Name, Mobile, Email
│   ├── Filters:
│   │   ├── Status: Active, Inactive
│   │   └── Last Activity: Today, Last 7 days, Last 30 days
│   └── Sort: Recent, Alphabetical
│
├── CustomersTable (Same as Partner, but fewer columns)
│   └── Columns:
│       ├── Customer Name (Link to detail)
│       ├── Mobile
│       ├── Email
│       ├── Status
│       ├── Applications (Count)
│       ├── Last Activity
│       └── Actions:
│           ├── [View] (→ CustomerDetail)
│           ├── [Edit]
│           └── [Delete] (own customers only)
│
└── Pagination
    └── 25 customers per page
```

### Color Scheme & Styling
```css
/* Customer Table */
.customers-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-radius: 8px;
  overflow: hidden;
}

.customers-table thead {
  background: #f5f5f5;
  border-bottom: 2px solid #e0e0e0;
}

.customers-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.customers-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.customers-table tbody tr:hover {
  background: #f9f9f9;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

/* Action Buttons */
.action-button-small {
  background: transparent;
  border: 1px solid #667eea;
  color: #667eea;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin: 0 4px;
  transition: all 0.2s ease;
}

.action-button-small:hover {
  background: #667eea;
  color: white;
}

/* Add Customer Button */
.add-customer-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
}

.add-customer-button:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  transform: translateY(-2px);
}

/* Assigned To Badge */
.assigned-badge {
  background: #e7f3ff;
  color: #0056b3;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.assigned-badge.self {
  background: #e2f0cb;
  color: #2d5016;
}
```

### UI Layout (Desktop - Partner)
```
┌──────────────────────────────────────────────────────────────┐
│ CUSTOMERS (All 245)                [+ Add] [Assign] [Export] │
├──────────────────────────────────────────────────────────────┤
│ Total: 245    My: 120    Team: 125    Active: 180            │
├──────────────────────────────────────────────────────────────┤
│ [All (245)] [My Customers (120)] [Team Customers (125)] [...]│
├──────────────────────────────────────────────────────────────┤
│ [Search............] [Assigned To ▼] [Status ▼] [Apply]      │
├──────────────────────────────────────────────────────────────┤
│ ┌────┬──────────────┬───────────┬────────┬─────────┬─────────┐
│ │ ☑  │ Name         │ Mobile    │ Status │ Assgn'd │ Apps   │
├────┼──────────────┼───────────┼────────┼─────────┼─────────┤
│ │ ☑  │ Rohit Kumar  │ 9876543210│ Active │ Me (P)  │  2     │
│ │ ☑  │ Priya Singh  │ 9876543211│ Active │ Amit(TM)│  1     │
│ │ ☑  │ Vikram Patel │ 9876543212│Inactive│ Me (P)  │  0     │
│ │    │ ... 242 more │           │        │         │        │
│ └────┴──────────────┴───────────┴────────┴─────────┴─────────┘
│ [< Prev] [Page 1 of 10] [Next >]  |  [✓ 5 selected] [Assign]
└──────────────────────────────────────────────────────────────┘
```

### UI Layout (Desktop - Team Member)
```
┌──────────────────────────────────────────────────────────────┐
│ MY CUSTOMERS (25)                         [+ Add] [Export]   │
├──────────────────────────────────────────────────────────────┤
│ Total: 25    Active: 18    With Apps: 12                      │
├──────────────────────────────────────────────────────────────┤
│ [All My (25)] [With Applications (12)]                        │
├──────────────────────────────────────────────────────────────┤
│ [Search............] [Status ▼] [Activity ▼] [Apply]         │
├──────────────────────────────────────────────────────────────┤
│ ┌────┬──────────────┬───────────┬─────────┬──────────────┐
│ │ ☑  │ Name         │ Mobile    │ Status  │ Apps | View  │
├────┼──────────────┼───────────┼─────────┼──────────────┤
│ │ ☑  │ Rajesh Nair  │ 9876543210│ Active  │  3   │ [👁️]  │
│ │ ☑  │ Deepa Gupta  │ 9876543211│ Active  │  1   │ [👁️]  │
│ │    │ ... 23 more  │           │         │      │       │
│ └────┴──────────────┴───────────┴─────────┴──────────────┘
│ [Page 1 of 1]
└──────────────────────────────────────────────────────────────┘
```

### Backend Files Involved
- `frontend/src/modules/partner/customers/` (Customer list, detail, forms)
- `frontend/src/modules/partner/leads/PartnerCrm.jsx` (CRM interface)
- API: `GET /api/v1/customers`
- API: `POST /api/v1/customers` (Add customer)
- API: `PATCH /api/v1/customers/:id` (Edit)
- API: `DELETE /api/v1/customers/:id` (Delete)

---

## 4. APPLICATIONS (`/partner/applications`)

### Component Hierarchy

#### Partner View
```
ApplicationsPage (Partner)
├── PageHeader
│   ├── Title: "Applications"
│   ├── Subtitle: "All applications (Personal + Team)"
│   └── Action Buttons:
│       ├── [+ Submit Application]
│       └── [📥 Export CSV]
│
├── StatsBar (6 columns)
│   ├── Total: 89
│   ├── Pending: 12
│   ├── Approved: 65
│   ├── Rejected: 8
│   ├── Disbursed: 4
│   └── My Submitted: 45
│
├── TabNavigation
│   ├── Tab 1: All (89)
│   ├── Tab 2: My Submitted (45)
│   ├── Tab 3: Team Submitted (44)
│   ├── Tab 4: Pending (12)
│   ├── Tab 5: Approved (65)
│   ├── Tab 6: Rejected (8)
│   └── Tab 7: Disbursed (4)
│
├── SearchBar & FilterPanel
│   ├── Search: Applicant name, App #, Phone
│   ├── Filters:
│   │   ├── Status: Pending, Approved, Rejected, Disbursed
│   │   ├── Product: All, Credit Card, Loan, Insurance
│   │   ├── Bank: All, HDFC, ICICI, AXIS, ...
│   │   ├── Submitted By: Me, Team Members (dropdown)
│   │   ├── Date Range: From - To
│   │   └── Commission Status: Pending, Released, Rejected
│   └── Sort: Recent, Oldest, High Commission, Low Commission
│
├── ApplicationsTable
│   └── Columns:
│       ├── Checkbox (select)
│       ├── App Number (Link to detail)
│       ├── Customer Name
│       ├── Product Name
│       ├── Bank Name
│       ├── Status Badge (Pending/Approved/Rejected/Disbursed)
│       ├── Applied Amount (₹)
│       ├── Commission (₹) - PARTNER can see breakdown
│       │   ├── Personal: ₹450
│       │   └── If team: shows team commission earned
│       ├── Submitted By (Name - Partner OR Team Member)
│       ├── Submitted Date
│       └── Actions:
│           ├── [View] (→ ApplicationDetail)
│           ├── [Edit] (status change, notes)
│           ├── [Assign to Team Member] (if own app)
│           └── [Delete] (if pending)
│
├── BulkActionsToolbar (When rows selected)
│   ├── [✓] Selected: 3
│   ├── [Change Status]
│   ├── [Export Selected]
│   └── [Delete Selected]
│
└── Pagination
    └── 25 per page
```

#### Team Member View
```
ApplicationsPage (Team Member)
├── PageHeader
│   ├── Title: "My Applications"
│   ├── Subtitle: "Applications you've submitted"
│   └── Action Buttons:
│       ├── [+ Submit Application]
│       └── [📥 Export CSV]
│
├── StatsBar (5 columns)
│   ├── Total: 12
│   ├── Pending: 2
│   ├── Approved: 8
│   ├── Rejected: 1
│   └── Disbursed: 1
│
├── TabNavigation (Simplified)
│   ├── Tab 1: All (12)
│   ├── Tab 2: Pending (2)
│   ├── Tab 3: Approved (8)
│   ├── Tab 4: Rejected (1)
│   └── Tab 5: Disbursed (1)
│
├── SearchBar & FilterPanel
│   ├── Search: Customer name, App #, Phone
│   ├── Filters:
│   │   ├── Status: Pending, Approved, Rejected, Disbursed
│   │   ├── Product: Credit Card, Loan, Insurance
│   │   ├── Bank: HDFC, ICICI, AXIS, ...
│   │   └── Date Range: From - To
│   └── Sort: Recent, Oldest, High Commission
│
├── ApplicationsTable (Fewer columns than Partner)
│   └── Columns:
│       ├── App Number (Link to detail)
│       ├── Customer Name
│       ├── Product Name
│       ├── Bank Name
│       ├── Status Badge
│       ├── Applied Amount (₹)
│       ├── Commission (₹) - Only OWN commission
│       ├── Submitted Date
│       └── Actions:
│           ├── [View] (→ ApplicationDetail)
│           ├── [Edit]
│           └── [Delete]
│
└── Pagination
    └── 25 per page
```

### Color Scheme & Styling
```css
/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.approved {
  background: #d4edda;
  color: #155724;
}

.status-badge.rejected {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.disbursed {
  background: #d1ecf1;
  color: #0c5460;
}

/* Commission Badge (Partner View) */
.commission-badge {
  background: #fff9e6;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #b8860b;
}

.commission-badge.team {
  background: #f0f0ff;
  color: #667eea;
}

/* Application Table */
.applications-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.applications-table tr:hover {
  background: #f9f9f9;
}

.applications-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

/* Amount Display */
.amount-display {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #333;
}

.amount-display.high {
  color: #28a745;
}

.amount-display.low {
  color: #6c757d;
}

/* Submit Button */
.submit-app-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.submit-app-button:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}
```

### UI Layout (Desktop - Partner)
```
┌──────────────────────────────────────────────────────────────┐
│ APPLICATIONS (All: 89)              [+ Submit] [Export]      │
├──────────────────────────────────────────────────────────────┤
│ Total: 89  Pending: 12  Approved: 65  Rejected: 8  Disbursed: 4
├──────────────────────────────────────────────────────────────┤
│ [All(89)][My(45)][Team(44)][Pending(12)][Approved(65)]...    │
├──────────────────────────────────────────────────────────────┤
│ [Search.............] [Status▼] [Bank▼] [Submit By▼] [Apply] │
├──────────────────────────────────────────────────────────────┤
│ ┌──┬──────┬──────────┬──────┬──────┬─────────┬──────┬────────┐
│ │☑ │ App# │ Customer │Product│Amount│ Status  │Comm. │Subm. by│
├──┼──────┼──────────┼──────┼──────┼─────────┼──────┼────────┤
│ │☑ │A1001│ Rohit K  │ CC   │₹50K  │✓ Approv│₹450 │Me (P)  │
│ │☑ │A1002│ Priya S  │ Loan │₹5L   │⏳ Pending│ -  │Amit(TM)│
│ │  │A1003│ Vikram P │ Loan │₹10L  │✗ Reject│ ₹0  │Me (P)  │
│ │  │ ...                                              ...  │
│ └──┴──────┴──────────┴──────┴──────┴─────────┴──────┴────────┘
│ [< Prev] [Page 1 of 4] [Next >]  |  [✓ 3 selected] [Change]
└──────────────────────────────────────────────────────────────┘
```

### UI Layout (Desktop - Team Member)
```
┌──────────────────────────────────────────────────────────────┐
│ MY APPLICATIONS (12)                [+ Submit] [Export]      │
├──────────────────────────────────────────────────────────────┤
│ Total: 12  Pending: 2  Approved: 8  Rejected: 1  Disbursed: 1
├──────────────────────────────────────────────────────────────┤
│ [All(12)][Pending(2)][Approved(8)][Rejected(1)]...          │
├──────────────────────────────────────────────────────────────┤
│ [Search.............] [Status▼] [Bank▼] [Apply]              │
├──────────────────────────────────────────────────────────────┤
│ ┌──────┬──────────┬──────┬──────┬──────────┬─────────┬──────┐
│ │ App# │ Customer │Product│Amount│  Status  │ My Comm │ Date │
├──────┼──────────┼──────┼──────┼──────────┼─────────┼──────┤
│ │A5001│ Rajesh N │ CC   │₹40K  │✓ Approved│  ₹360  │ 5d  │
│ │A5002│ Deepa G  │ CC   │₹35K  │⏳ Pending │   -    │ 2d  │
│ │ ... │ ...      │ ...  │ ...  │   ...    │  ...   │ ... │
│ └──────┴──────────┴──────┴──────┴──────────┴─────────┴──────┘
│ [Page 1 of 1]
└──────────────────────────────────────────────────────────────┘
```

### Backend Files Involved
- `frontend/src/modules/partner/leads/PartnerApplications.jsx`
- `frontend/src/modules/partner/leads/PartnerCrm.jsx`
- API: `GET /api/v1/applications`
- API: `POST /api/v1/applications`
- API: `GET /api/v1/applications/:id`
- API: `PATCH /api/v1/applications/:id`

---

## 5. WALLET (`/partner/wallet`)

### Component Hierarchy

#### Partner View
```
WalletPage (Partner)
├── BalanceHeader (Full width, sticky)
│   ├── Background: Gradient (purple-blue)
│   ├── Available Balance: ₹45,000
│   │   └── Subtitle: "Ready to withdraw"
│   ├── Locked Balance: ₹5,000
│   │   └── Subtitle: "On hold (commission pending approval)"
│   ├── Total Balance: ₹50,000
│   └── Action Buttons:
│       ├── [💳 Withdraw Money]
│       └── [🔄 Refresh]
│
├── WalletBreakdownCards (3 columns desktop)
│   ├── Card 1: Personal Commission
│   │   ├── Value: ₹20,000
│   │   ├── Icon: 👤
│   │   ├── Color: Blue gradient
│   │   └── Shows: Personal commission from direct sales
│   ├── Card 2: Team Commission (Overrides)
│   │   ├── Value: ₹15,000
│   │   ├── Icon: 👥
│   │   ├── Color: Green gradient
│   │   └── Shows: 10% L1 + 5% L2 overrides
│   └── Card 3: Referral Commission
│       ├── Value: ₹10,000
│       ├── Icon: 🔗
│       ├── Color: Orange gradient
│       └── Shows: Earnings from referrals
│
├── CommissionBreakdownTable (Collapsible)
│   ├── Type: Commission from Applications
│   ├── Columns:
│   │   ├── Date
│   │   ├── Application #
│   │   ├── Customer Name
│   │   ├── Product
│   │   ├── Type (Personal / Team L1 / Team L2)
│   │   ├── Amount
│   │   └── Status (Pending / Released)
│   └── Filter by: Personal, Team, Referral, Bonus
│
├── TransactionHistoryTable
│   ├── Columns:
│   │   ├── Date
│   │   ├── Description
│   │   ├── Type (Credit / Debit)
│   │   ├── Amount
│   │   └── Balance After
│   ├── Filter by: Date Range, Type
│   └── Pagination: 20 per page
│
├── WithdrawalSection
│   ├── Title: "Withdrawal History"
│   ├── Table:
│   │   ├── Withdrawal Date
│   │   ├── Amount
│   │   ├── Method (Bank Transfer, UPI)
│   │   ├── Status (Pending, Completed, Failed)
│   │   └── Bank/UPI Details
│   └── [View All Withdrawals] Link
│
└── Modals:
    ├── Withdraw Modal (triggered by [Withdraw Money] button)
    │   ├── Title: "Withdraw Money"
    │   ├── Form Fields:
    │   │   ├── Available Balance: ₹45,000 (display)
    │   │   ├── Withdrawal Amount: [input]
    │   │   ├── Minimum: ₹1,000
    │   │   ├── Maximum: ₹45,000
    │   │   ├── Withdrawal Method: Bank Transfer / UPI
    │   │   └── Bank/UPI Details: (populate from profile)
    │   ├── TDS Notice: "5% TDS will be deducted"
    │   ├── Net Amount Display: ₹42,750
    │   └── [Confirm Withdrawal] [Cancel]
    │
    └── Receipt Modal (After withdrawal successful)
        ├── ✓ Withdrawal Successful
        ├── Reference #: WD-2026-08-001
        ├── Amount: ₹45,000
        ├── TDS Deducted: ₹2,250
        ├── Net Credited: ₹42,750
        ├── Bank: HDFC Bank - XXXX 1234
        ├── Processing Time: 1-2 business days
        └── [Download Receipt] [Close]
```

#### Team Member View
```
WalletPage (Team Member)
├── BalanceHeader (Full width, sticky)
│   ├── Background: Gradient (pink-red)
│   ├── Available Balance: ₹8,500
│   ├── Locked Balance: ₹1,200
│   └── Action Buttons:
│       ├── [💳 Withdraw Money]
│       └── [🔄 Refresh]
│
├── WalletBreakdownCards (2 columns desktop - NO Team Commission)
│   ├── Card 1: Personal Commission
│   │   ├── Value: ₹8,500
│   │   ├── Icon: 👤
│   │   ├── Color: Blue gradient
│   │   └── Shows: Commission from own sales
│   └── Card 2: Locked Balance
│       ├── Value: ₹1,200
│       ├── Icon: 🔒
│       ├── Color: Gray gradient
│       └── Shows: On hold pending approval
│
├── CommissionBreakdownTable (Simplified)
│   ├── Type: My Commission (Personal only)
│   ├── Columns:
│   │   ├── Date
│   │   ├── Application #
│   │   ├── Customer Name
│   │   ├── Product
│   │   ├── Amount
│   │   └── Status
│   └── No filters (single type)
│
├── TransactionHistoryTable
│   ├── Columns:
│   │   ├── Date
│   │   ├── Description
│   │   ├── Type
│   │   ├── Amount
│   │   └── Balance After
│   └── Pagination: 20 per page
│
├── WithdrawalSection
│   ├── Withdrawal History (same layout)
│   └── [View All] Link
│
└── Modals:
    ├── Withdraw Modal (OWN WALLET ONLY)
    │   ├── Same layout as Partner
    │   └── Withdrawal Amount: Limited to available balance
    │
    └── Receipt Modal (Same)
```

### Color Scheme & Styling
```css
/* Balance Header */
.balance-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.balance-header.team-member {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.balance-amount {
  font-size: 32px;
  font-weight: 700;
  margin: 10px 0;
}

.balance-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

/* Breakdown Cards */
.breakdown-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-left: 4px solid;
  margin-bottom: 15px;
}

.breakdown-card.personal {
  border-left-color: #667eea;
}

.breakdown-card.team {
  border-left-color: #11998e;
}

.breakdown-card.referral {
  border-left-color: #f5a623;
}

.breakdown-card-value {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 10px 0;
}

.breakdown-card-label {
  font-size: 14px;
  color: #666;
}

/* Tables */
.transaction-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.transaction-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.transaction-table tr:hover {
  background: #f9f9f9;
}

/* Amount Badges */
.amount-credit {
  color: #28a745;
  font-weight: 600;
}

.amount-debit {
  color: #dc3545;
  font-weight: 600;
}

/* Withdraw Button */
.withdraw-button {
  background: linear-gradient(135deg, #f5a623 0%, #f5576c 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
}

.withdraw-button:hover {
  box-shadow: 0 6px 20px rgba(245, 166, 35, 0.4);
}

/* Modal Styling */
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* TDS Notice */
.tds-notice {
  background: #fff3cd;
  border-left: 4px solid #f5a623;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 13px;
  color: #856404;
  margin-bottom: 15px;
}

/* Net Amount Display */
.net-amount {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
  margin-bottom: 20px;
}

.net-amount-label {
  font-size: 12px;
  color: #155724;
  margin-bottom: 5px;
}

.net-amount-value {
  font-size: 28px;
  font-weight: 700;
  color: #155724;
}

/* Success Modal */
.success-modal {
  text-align: center;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.modal-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary {
  flex: 1;
  background: #667eea;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary {
  flex: 1;
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  padding: 12px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
```

### UI Layout (Desktop - Partner)
```
┌──────────────────────────────────────────────────────────────┐
│  💜 WALLET BALANCE                    [🔄 Refresh]          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Available: ₹45,000    Locked: ₹5,000    Total: ₹50,000 │  │
│  │                 [💳 Withdraw Money]                     │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌────────────────────┐ ┌────────────┐
│ │ 👤 Personal Comm.  │ │ 👥 Team Commission │ │ 🔗 Referral│
│ │                    │ │                    │ │            │
│ │   ₹20,000         │ │   ₹15,000         │ │   ₹10,000  │
│ │                    │ │                    │ │            │
│ │ From direct sales  │ │ Overrides (L1/L2)  │ │ From refls.│
│ └────────────────────┘ └────────────────────┘ └────────────┘
├──────────────────────────────────────────────────────────────┤
│ COMMISSION BREAKDOWN [All ▼]
│ ┌──────┬─────────┬──────┬──────────┬───────────┬────────────┐
│ │ Date │ App #   │ Type │ Customer │ Amount    │ Status     │
├──────┼─────────┼──────┼──────────┼───────────┼────────────┤
│ │ 8/7  │ A1001   │ Pers │ Rohit K  │ +₹450    │ Released   │
│ │ 8/7  │ A1002   │ Team │ Priya S  │ +₹100    │ Released   │
│ │ 8/6  │ A1003   │ Team │ Vikram P │ +₹200    │ Pending    │
│ └──────┴─────────┴──────┴──────────┴───────────┴────────────┘
├──────────────────────────────────────────────────────────────┤
│ TRANSACTION HISTORY [Last 30 days ▼]
│ ┌──────┬──────────────────┬────────┬─────────┬────────────┐
│ │ Date │ Description      │ Type   │ Amount  │ Bal. After │
├──────┼──────────────────┼────────┼─────────┼────────────┤
│ │ 8/7  │ Commission       │ Credit │ +₹450  │ ₹50,000    │
│ │ 8/5  │ Withdrawal       │ Debit  │ -₹5K   │ ₹49,550    │
│ │ 8/3  │ Commission       │ Credit │ +₹200  │ ₹54,550    │
│ └──────┴──────────────────┴────────┴─────────┴────────────┘
└──────────────────────────────────────────────────────────────┘
```

### UI Layout (Desktop - Team Member)
```
┌──────────────────────────────────────────────────────────────┐
│  💗 MY WALLET                         [🔄 Refresh]          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Available: ₹8,500     Locked: ₹1,200    Total: ₹9,700  │  │
│  │                 [💳 Withdraw Money]                     │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌────────────────────────────────────┐
│ │ 👤 My Commission   │ │ 🔒 Locked Balance                  │
│ │                    │ │                                    │
│ │   ₹8,500          │ │   ₹1,200                           │
│ │                    │ │                                    │
│ │ From my sales      │ │ Commission on pending approval     │
│ └────────────────────┘ └────────────────────────────────────┘
├──────────────────────────────────────────────────────────────┤
│ MY COMMISSION HISTORY
│ ┌──────┬─────────┬──────────┬──────────┬────────────────────┐
│ │ Date │ App #   │ Customer │ Amount   │ Status             │
├──────┼─────────┼──────────┼──────────┼────────────────────┤
│ │ 8/7  │ A5001   │ Rajesh N │ +₹360   │ Released           │
│ │ 8/5  │ A5002   │ Deepa G  │ +₹450   │ Pending            │
│ └──────┴─────────┴──────────┴──────────┴────────────────────┘
├──────────────────────────────────────────────────────────────┤
│ WITHDRAWAL HISTORY
│ ┌──────┬────────────┬─────────┬──────────┬──────────────┐
│ │ Date │ Amount     │ Method  │ Status   │ Bank Details │
├──────┼────────────┼─────────┼──────────┼──────────────┤
│ │ 8/1  │ ₹5,000    │ Bank    │ Completed│ HDFC XXXX1234│
│ └──────┴────────────┴─────────┴──────────┴──────────────┘
└──────────────────────────────────────────────────────────────┘
```

### Backend Files Involved
- `frontend/src/modules/partner/wallet/PartnerWallet.jsx`
- `frontend/src/modules/partner/wallet/WithdrawModal.jsx` (if separate)
- API: `GET /api/v1/wallet`
- API: `GET /api/v1/wallet/transactions`
- API: `POST /api/v1/wallet/withdraw`

---

## 6. COMMISSION (`/partner/commission`, `/partner/earnings`)

### Component Hierarchy

#### Partner View
```
CommissionPage (Partner)
├── CommissionHeader
│   ├── Title: "Commissions & Earnings"
│   ├── Subtitle: "Track your personal and team commission earnings"
│   └── Period Selector: [This Month] [Last 3 Months] [Last Year] [All Time]
│
├── EarningsSummaryCards (4 cards - 2x2 grid)
│   ├── Card 1: Total Earnings (This Period)
│   │   ├── Value: ₹45,000
│   │   ├── Icon: 💰
│   │   ├── Trend: ↑ +12% vs last period
│   │   └── Color: Green gradient
│   ├── Card 2: Personal Commission
│   │   ├── Value: ₹20,000
│   │   ├── Icon: 👤
│   │   ├── Percentage: 44%
│   │   └── Color: Blue gradient
│   ├── Card 3: Team Commission
│   │   ├── Value: ₹15,000
│   │   ├── Icon: 👥
│   │   ├── Percentage: 33%
│   │   └── Color: Green gradient
│   └── Card 4: Referral Commission
│       ├── Value: ₹10,000
│       ├── Icon: 🔗
│       ├── Percentage: 22%
│       └── Color: Orange gradient
│
├── CommissionCharts (3 charts in tabs)
│   ├── Tab 1: Earnings Trend (Line chart)
│   │   ├── X-axis: Date (daily/weekly/monthly)
│   │   ├── Y-axis: Amount (₹)
│   │   ├── Lines: Personal, Team, Referral
│   │   └── Tooltip: Shows exact values on hover
│   ├── Tab 2: Commission Breakdown (Pie chart)
│   │   ├── Slices: Personal (44%), Team (33%), Referral (22%)
│   │   └── Tooltip: Shows values and percentages
│   └── Tab 3: Top Products (Bar chart)
│       ├── X-axis: Product names
│       ├── Y-axis: Commission amount
│       └── Top 5 products by commission
│
├── CommissionDetailsTable
│   ├── Filters: Type (All, Personal, Team L1, Team L2, Referral)
│   ├── Columns:
│   │   ├── Date
│   │   ├── Type (Personal / Team L1 / Team L2 / Referral)
│   │   ├── Application #
│   │   ├── Customer/Partner Name
│   │   ├── Product
│   │   ├── Amount
│   │   ├── Status (Pending / Released / Rejected)
│   │   └── Actions ([View Details])
│   └── Pagination: 20 per page
│
├── BonusSection (If applicable)
│   ├── Title: "Performance Bonuses"
│   ├── Shows: Bonuses earned for hitting targets
│   └── Claim Button (if claimable)
│
└── ExportButton
    ├── [📥 Export Commission Report (CSV)]
    └── Includes: All commission data for period
```

#### Team Member View
```
CommissionPage (Team Member)
├── EarningsHeader
│   ├── Title: "My Earnings"
│   ├── Subtitle: "Commission from your approved applications"
│   └── Period Selector: [This Month] [Last 3 Months] [All Time]
│
├── EarningsSummaryCards (3 cards - Single row)
│   ├── Card 1: This Month Earnings
│   │   ├── Value: ₹12,500
│   │   ├── Icon: 💳
│   │   ├── Trend: ↑ +8% vs last month
│   │   └── Color: Blue gradient
│   ├── Card 2: Credit Card Commission
│   │   ├── Value: ₹5,000
│   │   ├── Icon: 💳
│   │   └── Status: Breakdown by product
│   └── Card 3: Loan Commission
│       ├── Value: ₹7,500
│       ├── Icon: 📊
│       └── Status: Breakdown by product
│
├── CommissionCharts (Simplified)
│   ├── Chart 1: Monthly Earnings Trend (Line)
│   │   ├── Last 12 months
│   │   └── Shows: Personal commission only
│   └── Chart 2: Commission by Product (Bar)
│       ├── Credit Cards
│       ├── Loans
│       └── Insurance
│
├── CommissionDetailsTable (Own commissions only)
│   ├── Columns:
│   │   ├── Date
│   │   ├── Application #
│   │   ├── Customer Name
│   │   ├── Product
│   │   ├── Amount
│   │   ├── Status (Pending / Released)
│   │   └── [View Application]
│   └── Pagination: 20 per page
│
└── ExportButton
    ├── [📥 Export My Earnings (CSV)]
    └── Personal commission only
```

### Color Scheme & Styling
```css
/* Earnings Cards */
.earnings-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
}

.earnings-card.personal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.earnings-card.team {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.earnings-card.referral {
  background: linear-gradient(135deg, #f5a623 0%, #f5576c 100%);
}

.earnings-card-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 5px;
}

.earnings-card-label {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 10px;
}

.earnings-card-trend {
  font-size: 12px;
  opacity: 0.85;
}

.earnings-card-trend.positive {
  color: #90EE90;
}

/* Charts */
.chart-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 20px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

/* Table */
.commission-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-radius: 8px;
  overflow: hidden;
}

.commission-table th {
  background: #f5f5f5;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #e0e0e0;
}

.commission-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.commission-table tr:hover {
  background: #f9f9f9;
}

/* Type Badge */
.type-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.type-badge.personal {
  background: #e7f3ff;
  color: #0056b3;
}

.type-badge.team {
  background: #d4edda;
  color: #155724;
}

.type-badge.referral {
  background: #fff3cd;
  color: #856404;
}

/* Status Badge */
.status-badge-commission {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge-commission.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge-commission.released {
  background: #d4edda;
  color: #155724;
}

.status-badge-commission.rejected {
  background: #f8d7da;
  color: #721c24;
}

/* Export Button */
.export-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.export-button:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}
```

### UI Layout (Desktop - Partner)
```
┌──────────────────────────────────────────────────────────────┐
│ COMMISSIONS & EARNINGS            [This Month ▼]             │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐
│ │   TOTAL      │ │  PERSONAL    │ │   TEAM   │ │ REFERRAL │
│ │  ₹45,000     │ │  ₹20,000(44%)│ │ ₹15k(33%)│ │₹10k(22%)│
│ │ ↑ +12%       │ │ ↑ +5%        │ │ ↑ +8%    │ │ ↑ +15%   │
│ └──────────────┘ └──────────────┘ └──────────┘ └──────────┘
├──────────────────────────────────────────────────────────────┤
│ [Earning Trend] [Commission Mix] [Top Products]              │
│ ┌────────────────────────────────────────────────────────┐
│ │ (Line Chart showing Personal, Team, Referral trends)   │
│ └────────────────────────────────────────────────────────┘
├──────────────────────────────────────────────────────────────┤
│ COMMISSION DETAILS [All ▼]  [📥 Export Report]               │
│ ┌────┬──────┬────────┬─────────┬─────────┬────────┬────────┐
│ │Type│ App# │Customer│ Product │ Amount  │ Status │ Action │
├────┼──────┼────────┼─────────┼─────────┼────────┼────────┤
│ │Pers│A1001 │Rohit K │   CC    │ +₹450  │Relesd.│ [View] │
│ │L1  │A1002 │Priya S │  Loan   │ +₹100  │Relesd.│ [View] │
│ │Ref │ R002 │Arjun S │  -      │ +₹250  │Relesd.│ [View] │
│ │L2  │A1003 │Vikram P│  Loan   │ +₹50   │Pending│ [View] │
│ └────┴──────┴────────┴─────────┴─────────┴────────┴────────┘
│ [< Prev] [Page 1 of 3] [Next >]
└──────────────────────────────────────────────────────────────┘
```

### UI Layout (Desktop - Team Member)
```
┌──────────────────────────────────────────────────────────────┐
│ MY EARNINGS                       [This Month ▼]             │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
│ │  THIS MONTH  │ │ CREDIT CARDS │ │      LOANS           │
│ │  ₹12,500     │ │   ₹5,000     │ │     ₹7,500           │
│ │ ↑ +8%        │ │ ↑ +3%        │ │ ↑ +10%               │
│ └──────────────┘ └──────────────┘ └──────────────────────┘
├──────────────────────────────────────────────────────────────┤
│ [Monthly Trend] [By Product]                                 │
│ ┌────────────────────────────────────────────────────────┐
│ │ (Line Chart - 12 months of earnings)                   │
│ └────────────────────────────────────────────────────────┘
├──────────────────────────────────────────────────────────────┤
│ MY COMMISSION HISTORY              [📥 Export Earnings]      │
│ ┌──────┬─────────┬──────────┬─────────┬────────┬──────────┐
│ │ Date │  App #  │ Customer │ Product │ Amount │  Status  │
├──────┼─────────┼──────────┼─────────┼────────┼──────────┤
│ │ 8/7  │ A5001   │ Rajesh N │   CC    │ +₹360 │ Released │
│ │ 8/5  │ A5002   │ Deepa G  │  Loan   │ +₹450 │ Pending  │
│ │ 7/28 │ A4998   │ Amar K   │   CC    │ +₹280 │ Released │
│ └──────┴─────────┴──────────┴─────────┴────────┴──────────┘
└──────────────────────────────────────────────────────────────┘
```

### Backend Files Involved
- `frontend/src/modules/partner/earnings/` (if separate)
- `frontend/src/modules/partner/dashboard/PartnerDashboardComponent.jsx` (summary)
- API: `GET /api/v1/commission`
- API: `GET /api/v1/commission/analytics`
- API: `GET /api/v1/commission/report`

---

## 7. TEAM MEMBERS (`/partner/team-network`, `/partner/team-dashboard`)

### Component Hierarchy

#### Partner View ONLY (Team Members NOT available)
```
TeamNetworkPage (Partner ONLY)
├── PageHeader
│   ├── Title: "Team Network"
│   ├── Subtitle: "Manage your downline partners and track team performance"
│   ├── Team Stats Quick View:
│   │   ├── Total Members: 45
│   │   ├── Active: 38
│   │   ├── Pending KYC: 7
│   │   └── This Month: +5
│   └── Action Buttons:
│       ├── [+ Invite Team Member]
│       └── [📥 Export Network]
│
├── TeamDashboardComponent
│   ├── Tab 1: Dashboard (KPI cards)
│   │   ├── Total Members
│   │   ├── Team Business Value
│   │   ├── Team Commission
│   │   ├── Conversion Rate
│   │   ├── Top Performer Card
│   │   ├── Recent Joinings
│   │   └── [View Full Team] Link
│   ├── Tab 2: Team Tree (Hierarchical visualization)
│   │   ├── Root Node (Self)
│   │   ├── Level 1 Children (Direct team members)
│   │   ├── Level 2 Grandchildren (Sub-agents)
│   │   ├── Click to expand/collapse nodes
│   │   ├── Hover to see metrics
│   │   └── Click node → Member Details Drawer
│   ├── Tab 3: Team Members List
│   │   ├── Paginated table
│   │   ├── Filters: Status, KYC, Level
│   │   └── Actions: View, Edit, Reassign, Deactivate
│   ├── Tab 4: Analytics
│   │   ├── Team Growth Trend
│   │   ├── Business Trend
│   │   ├── Commission Trend
│   │   ├── Top Products
│   │   └── Conversion Funnel
│   ├── Tab 5: Activity Stream
│   │   ├── Member joined
│   │   ├── Application submitted
│   │   ├── Application approved
│   │   └── Commission earned
│   ├── Tab 6: Goals & Leaderboard
│   │   ├── Set monthly targets
│   │   ├── Current progress
│   │   ├── Top 10 performers
│   │   └── Achievement badges
│   └── Tab 7: Settings
│       ├── Commission settings
│       ├── Team policies
│       └── Notification preferences
│
├── InviteTeamMemberModal
│   ├── Form Fields:
│   │   ├── Full Name (First + Last)
│   │   ├── Email
│   │   ├── Mobile Number
│   │   └── Optional Password
│   ├── After Submit:
│   │   ├── Generate invitation links
│   │   ├── WhatsApp link
│   │   ├── SMS link
│   │   └── Email link
│   └── [Copy All] [Send via WhatsApp] [Send via Email]
│
└── MemberDetailsDrawer (Right sidebar)
    ├── Profile Section:
    │   ├── Profile photo
    │   ├── Full name
    │   ├── Partner code
    │   ├── Status badge
    │   └── KYC status badge
    ├── Metrics Section:
    │   ├── Total applications
    │   ├── Approved applications
    │   ├── Team business
    │   ├── Commission earned
    │   └── Direct children
    ├── Activity Section:
    │   ├── Last 5 activities
    │   └── All activities link
    └── Actions:
        ├── [View Profile]
        ├── [Edit Details]
        ├── [View Applications]
        ├── [View Commission]
        └── [Deactivate Team Member]
```

#### Team Member View
```
❌ Team Members section is COMPLETELY HIDDEN for Team Members

The only related UI they see:
- "Team Members" option in navigation: DISABLED/HIDDEN
- "Invite Team Member" button: NOT SHOWN
- Team network stats: NOT SHOWN
- Team applications: NOT SHOWN
- Team commission: NOT SHOWN

Alternate CTA shown instead:
- "Request Upgrade to Partner" button on dashboard
- "Become a Partner to manage teams" messaging
```

### Color Scheme & Styling
```css
/* Team Network Header */
.team-header {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 30px;
}

.team-header.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-top: 15px;
}

.team-stat {
  background: rgba(255,255,255,0.2);
  padding: 12px;
  border-radius: 6px;
  text-align: center;
}

.team-stat-value {
  font-size: 20px;
  font-weight: 700;
}

.team-stat-label {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 5px;
}

/* Tree Visualization */
.tree-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow-x: auto;
}

.tree-node {
  display: inline-block;
  background: white;
  border: 2px solid #667eea;
  border-radius: 8px;
  padding: 15px;
  margin: 10px;
  min-width: 180px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tree-node:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
  transform: translateY(-2px);
}

.tree-node.root {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: 2px solid white;
}

.tree-node.level-1 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: 2px solid #f5576c;
}

.tree-node.level-2 {
  background: white;
  border: 2px solid #667eea;
}

.tree-node-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 5px;
}

.tree-node-code {
  font-size: 11px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.tree-node-metrics {
  font-size: 11px;
  display: flex;
  gap: 8px;
}

.tree-node-metric {
  flex: 1;
  text-align: center;
}

.tree-expand-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: #667eea;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

/* Invite Modal */
.invite-modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.invite-form-group {
  margin-bottom: 20px;
}

.invite-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
}

.invite-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.invite-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.invite-success-links {
  background: #d4edda;
  padding: 15px;
  border-radius: 6px;
  margin-top: 20px;
}

.invite-link {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.invite-link:hover {
  background: #f0f0f0;
}

.invite-link-icon {
  font-size: 16px;
}

.invite-link-text {
  flex: 1;
  font-size: 12px;
  color: #333;
  word-break: break-all;
}

.invite-link-copy {
  background: #667eea;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

/* Member Details Drawer */
.member-drawer {
  position: fixed;
  right: 0;
  top: 0;
  width: 350px;
  height: 100%;
  background: white;
  box-shadow: -4px 0 15px rgba(0,0,0,0.15);
  overflow-y: auto;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawer-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.drawer-content {
  padding: 20px;
}

.drawer-profile-photo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 15px;
  background: #f0f0f0;
}

.drawer-name {
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 5px;
}

.drawer-code {
  font-size: 12px;
  color: #666;
  text-align: center;
  margin-bottom: 15px;
}

.drawer-status-badges {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 20px;
}

.drawer-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.drawer-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.drawer-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}

.drawer-metric-label {
  color: #666;
}

.drawer-metric-value {
  font-weight: 600;
  color: #333;
}

.drawer-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}

.drawer-action-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.drawer-action-btn:hover {
  background: #764ba2;
}

.drawer-action-btn.secondary {
  background: transparent;
  border: 1px solid #ddd;
  color: #333;
}

.drawer-action-btn.danger {
  background: #dc3545;
}
```

### UI Layout (Desktop - Partner Only)
```
┌──────────────────────────────────────────────────────────────┐
│ 🟢 TEAM NETWORK                    [+ Invite] [Export]      │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Members: 45  Active: 38  Pending KYC: 7  This Month: +5│  │
│ └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ [Dashboard] [Tree] [Members] [Analytics] [Activity] [Goals] │
├──────────────────────────────────────────────────────────────┤
│                    DASHBOARD TAB                             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐
│ │  Members     │ │  Business    │ │Commissn. │ │  Conv.   │
│ │     45       │ │ ₹50,00,000   │ │ ₹45,000  │ │  79.2%   │
│ └──────────────┘ └──────────────┘ └──────────┘ └──────────┘
│
│ Top Performer: Amit (Business: ₹5L, Apps: 15)
│ Recent Joinings: [Raj] [Priya] [Vikram] [More...]
├──────────────────────────────────────────────────────────────┤
│                     TREE TAB (Click Arrows to Expand)        │
│                                                               │
│                        ┌─────────────┐                        │
│                        │   ME (P)    │ ← Root                 │
│                        │ Lvl 0: 45   │                        │
│                        └─────────────┘                        │
│               ┌──────────┼──────────┬──────────┐              │
│               ▼          ▼          ▼          ▼              │
│          ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│          │ Amit(TM)│ │Priya(TM)│ │Raj(TM)│ │Vik(TM)│        │
│          │L1: 12   │ │ L1: 8  │ │L1: 10 │ │ L1: 7 │        │
│          └─────────┘ └────────┘ └────────┘ └────────┘        │
│              │  ▼ (expand Amit)                              │
│              │  ┌────────────┐ ┌────────────┐                │
│              │  │ Akshay(TM) │ │ Seema(TM)  │ ← L2 under     │
│              │  │   L2:3     │ │   L2:2     │    Amit        │
│              │  └────────────┘ └────────────┘                │
│              │                                                │
└──────────────────────────────────────────────────────────────┘
                                           
┌─ MEMBER DRAWER (Right side, click node) ───────────────────┐
│ X                                                           │
│ [Profile Photo]                                            │
│ Amit Singh                                                 │
│ GKP-00245                                                  │
│ ✓ Active    ✓ KYC Approved                                │
│                                                            │
│ METRICS                                                    │
│ Applications: 15                                           │
│ Approved: 12                                               │
│ Business: ₹5,00,000                                        │
│ Commission: ₹45,000                                        │
│ Direct Team: 3                                             │
│                                                            │
│ [View Profile]                                             │
│ [View Applications]                                        │
│ [View Commission]                                          │
│ [Deactivate Member]                                        │
└────────────────────────────────────────────────────────────┘
```

### Backend Files Involved
- `frontend/src/modules/partner/dashboard/PartnerTeam.jsx` (Main component)
- `frontend/src/modules/partner/dashboard/team/TeamDashboardTab.jsx`
- `frontend/src/modules/partner/dashboard/team/TeamTreeTab.jsx`
- `frontend/src/modules/partner/dashboard/team/TeamMembersTab.jsx`
- `frontend/src/modules/partner/dashboard/team/TeamAnalyticsTab.jsx`
- `frontend/src/modules/partner/dashboard/team/TeamActivityTab.jsx`
- `frontend/src/modules/partner/dashboard/team/TeamGoalsTab.jsx`
- `frontend/src/modules/partner/dashboard/team/TeamMemberDrawer.jsx`
- API: `GET /api/v1/team/*` (All team endpoints)
- API: `POST /api/v1/partner/:Id/team` (Create team member)

---

## SUMMARY TABLE: Components by Role

| Page/Component | Partner | Team Member | Notes |
|---|---|---|---|
| Dashboard | ✅ Full | ✅ Limited (no team stats) | Partner sees team cards |
| Products | ✅ Full | ✅ Full | Both see same product list |
| Customers | ✅ All customers | ✅ Own customers only | Partner can assign/reassign |
| Applications | ✅ All + Team | ✅ Own only | Partner sees commission split |
| Wallet | ✅ Personal + Team | ✅ Personal only | Partner sees breakdown cards |
| Commission | ✅ Detailed | ✅ Approved only | Partner sees 3 commission types |
| Team Members | ✅ Full module | ❌ Hidden | Partner-only feature |
| Reports | ✅ Full | ❌ Hidden | Partner-only feature |
| Settings | ✅ Full | ⚠️ Limited | Team member: profile, password, bank |
| KYC | ✅ Own + manage | ✅ Own only | Team member sees own status |
| Referral | ✅ Unlimited | ✅ Own network | Team member cannot see team tree |

---

**Document Version**: 1.0  
**Last Updated**: August 8, 2026


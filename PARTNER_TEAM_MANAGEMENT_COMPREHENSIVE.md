# Partner Team Management - Comprehensive Analysis

**Project**: GharKaPaisa Financial Partner Operating System  
**Date**: August 2026  
**Scope**: All aspects of partner team hierarchy, commission distribution, member management, and performance tracking  

---

## Table of Contents
1. [Core Architecture](#core-architecture)
2. [Database Schema](#database-schema)
3. [Team Member Lifecycle](#team-member-lifecycle)
4. [Team Hierarchy & Structure](#team-hierarchy--structure)
5. [Commission Management](#commission-management)
6. [Team Dashboard & Analytics](#team-dashboard--analytics)
7. [Frontend Components](#frontend-components)
8. [API Endpoints](#api-endpoints)
9. [Team Performance Metrics](#team-performance-metrics)
10. [Key Features Summary](#key-features-summary)

---

## Core Architecture

### System Overview
The partner team management system is built on a **hierarchical multi-level network** where:
- Partners can create teams of sub-partners (team members)
- Each team member has a parent-child relationship tracked in `partner_team_relationships` table
- Commission earnings flow upward through the hierarchy (10% for Level 1, 5% for Level 2)
- Teams are managed through dedicated routes and services

### Key Roles
1. **Partner** - Primary account holder who can create teams (requires `allow_team_creation = true`)
2. **Team Member** - Sub-agent under a partner (role = `TEAM_MEMBER`)
3. **Admin** - Can manage partner networks and team structures
4. **Super Admin** - Full control over all partner team networks

### Authorization Flow
```
/partner/:PartnerId/team (Create/Manage Team)
  ↓
  Requires: requireApprovedPartner middleware
  Checks: parent.allow_team_creation === true
  Checks: parent.team_status !== 'INACTIVE'
  ↓
  Creates: User + Partner Profile + Wallet + Relationship
```

---

## Database Schema

### TABLE: `partner_team_relationships`
**Feature**: 👥 Team Management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique relationship identifier |
| `parent_partner_id` | UUID | FOREIGN KEY, NOT NULL | Upline partner (parent) |
| `child_partner_id` | UUID | FOREIGN KEY, UNIQUE, NOT NULL | Downline partner (child) |
| `level` | INTEGER | NOT NULL | Hierarchy depth (1 = direct, 2 = grandchild) |
| `status` | VARCHAR(20) | DEFAULT 'ACTIVE' | Relationship status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Indexes**:
- `idx_team_rels_parent` ON (`parent_partner_id`)
- `idx_team_rels_child` ON (`child_partner_id`)

### TABLE: `team_commissions`
**Feature**: 💰 Team Commission Tracking

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `parent_partner_id` | UUID | Commission receiver (upline) |
| `child_partner_id` | UUID | Commission source (downline) |
| `application_id` | UUID | Reference to application |
| `amount` | DECIMAL | Override commission amount |
| `level` | INTEGER | 1 for Level 1 (10%), 2 for Level 2 (5%) |
| `status` | VARCHAR(20) | 'paid', 'pending', 'released' |
| `created_at` | TIMESTAMPTZ | When commission was earned |

### TABLE: `team_activity`
**Feature**: 📊 Team Activity Logging

Tracks events:
- MEMBER_JOINED
- APPLICATION_SUBMITTED
- APPLICATION_APPROVED
- OVERRIDE_COMMISSION_EARNED

---

## Team Member Lifecycle

### 1. Team Member Creation
**Endpoint**: `POST /partner/:PartnerId/team`  
**Middleware**: `selfOrAdmin('PartnerId')`, `requireApprovedPartner`

**Request Body**:
```javascript
{
  first_name: string,          // Team member's first name
  last_name: string,           // Team member's last name
  name: string,                // Full name (alternative)
  email: string,               // Unique email
  mobile: string,              // Unique mobile number
  password?: string            // Optional; generated if not provided
}
```

**Process**:
1. Validate parent partner exists and allows team creation
2. Check parent's `allow_team_creation` and `team_status`
3. Verify email/mobile uniqueness
4. Generate temporary password if not provided
5. Create user account with role = 'TEAM_MEMBER'
6. Create partner profile with:
   - Parent partner ID set to parent
   - Partner ID set to child's own ID (self-referencing)
   - KYC status = 'pending'
7. Create wallet record
8. Create team relationship (level = 1)
9. Generate invitation links (WhatsApp, SMS, Email)

**Response**:
```javascript
{
  partner_code: string,          // Generated partner code
  invite_link: string,           // Registration link with referral code
  temp_password: string,         // Temporary password
  whatsapp_link: string,         // Encoded WhatsApp invitation URL
  sms_link: string,              // SMS invitation link
  email_link: string             // Email invitation link
}
```

### 2. Team Member Onboarding
- New team member receives invitation via WhatsApp/SMS/Email
- Opens invite link and registers with temporary password
- Required to change password on first login (`must_change_password = true`)
- Completes KYC verification (Aadhaar, PAN, etc.)
- Becomes active after KYC approval

### 3. Team Member Status Transitions
```
Created (pending_kyc)
    ↓
KYC_SUBMITTED (under_review)
    ↓
KYC_APPROVED (verified_members)
    ↓
ACTIVE (can submit applications)
```

---

## Team Hierarchy & Structure

### Single vs Multi-Tier
- **Current Implementation**: Tracks up to Level 2 relationships
  - Level 1: Direct child (10% commission)
  - Level 2: Grandchild (5% commission)
  
### Tree Structure
```
Parent Partner (Partner A)
├── Level 1 Child 1 (Team Member)
│   └── Level 2 Grandchild (Can be promoted to Level 1 child)
├── Level 1 Child 2
│   ├── Level 2 Grandchild 1
│   └── Level 2 Grandchild 2
└── Level 1 Child 3
```

### Access Control
- Partners can only view their own downline
- Admins can view any partner's network (via `?partner_id` query param)
- Level 1 partners can only access Level 1 direct children
- Can request access to specific sub-agents if authorized

---

## Commission Management

### Commission Structure
**Settings Stored in `settings` table**:
- `team_commission_child_pct`: 90 (child partner gets 90% of base)
- `team_commission_parent_pct`: 10 (parent partner gets 10% override)

### Commission Flow Example
```
Product Commission: ₹1,000 (base rate)
    ↓
Application Approved by Team Member (Child)
    ↓
Child Partner: ₹900 (90% of base)
Parent Partner: ₹100 (10% override)
    ↓
Plus Level 2 Commission (if applicable):
Grandparent: ₹50 (5% of base) - if grandchild submitted application
```

### Team Override Commission Processing

**Function**: `processTeamOverrideCommission(applicationId, childPartnerId, baseCommissionAmount)`

**Process**:
1. Find all parents of child partner (Level 1 and Level 2)
2. For each parent:
   - Level 1: Calculate 10% override commission
   - Level 2: Calculate 5% override commission
3. Check if commission already processed (avoid duplicates)
4. Create `team_commissions` record
5. Credit parent's wallet:
   - Update `partner_wallets.available_balance`
   - Update `partner_wallets.total_earned`
6. Log to `wallet_ledger`:
   - Type: 'team_override'
   - Description: "Level X Team Override Commission (X%) from downline sales"
7. Log to `team_activity`:
   - Type: 'OVERRIDE_COMMISSION_EARNED'
   - Description: Shows amount and level

**Triggers**:
- When application is approved
- When lead status changes to 'approved', 'disbursed', or 'confirmed'

**Code Location**: `backend/src/modules/team/team.service.js`

### Commission Release & Reversal
**Release Commission**:
- Admin action to release hold on commission
- Moves balance from pending to available
- Updates `applications.commission_status = 'processed'`

**Reverse Commission**:
- Rollback commission payout on application rejection/cancellation
- Revert wallet balance changes
- Create reversal record in `wallet_ledger`
- Mark commission as 'rejected'

---

## Team Dashboard & Analytics

### 1. Team Dashboard KPIs
**Endpoint**: `GET /api/v1/team/dashboard` or `GET /partner/team-dashboard`

**Metrics Returned**:

#### Member Counts
```javascript
{
  total_members: 45,              // All downline members
  direct_members: 10,             // Level 1 only
  indirect_members: 35,           // Level 2+ only
  active_members: 38,             // User status = 'active'
  inactive_members: 7,            // Status != 'active'
  verified_members: 30,           // KYC approved
  pending_kyc: 15                 // KYC pending/under_review
}
```

#### Joinings
```javascript
{
  today_joinings: 2,              // New members today
  this_month_joinings: 18         // New members this month
}
```

#### Applications & Business
```javascript
{
  applications_submitted: 120,    // Total applications from downline
  applications_approved: 95,      // Approved/disbursed/confirmed
  applications_pending: 25,       // Still under review
  team_business: 5250000,         // Total loan amount from approved apps (₹)
  average_conversion_rate: 79.2   // (approved / submitted) * 100
}
```

#### Commissions
```javascript
{
  today_commission: 2500,         // Earned today (₹)
  monthly_commission: 45000,      // This month (₹)
  lifetime_commission: 850000     // All-time (₹)
}
```

#### Top Performers
```javascript
{
  top_performer: {
    id: uuid,
    name: string,
    code: string,
    photo: string,
    rank: string,
    business: 500000,             // Total approved business
    apps: 12                       // Approved application count
  },
  lowest_performer: {
    id: uuid,
    name: string,
    code: string,
    photo: string,
    rank: string,
    business: 0,
    apps: 0
  },
  recent_joinings: [
    { id, name, code, photo, rank, level, status, kyc_status, joined_at },
    ...
  ]
}
```

### 2. Team Tree / Hierarchy
**Endpoint**: `GET /api/v1/team/tree?parent_id=<id>`

**Returns**:
```javascript
{
  root: {                         // Only if showing top level
    id, user_id, partner_code, full_name, profile_photo_url,
    rank, status, kyc_status, level: 0,
    business, commission,
    direct_children_count, has_children, joined_at
  },
  children: [
    {
      id, user_id, partner_code, full_name,
      first_name, last_name, profile_photo_url,
      rank, status, kyc_status, level,
      business, commission,
      direct_children_count, has_children, joined_at
    },
    ...
  ]
}
```

**Features**:
- Lazy-loaded tree nodes (load children on demand)
- Authorization check: Can only view downline members
- Admin bypass: Admins can view any node
- Performance optimized: Direct queries for specific parent

### 3. Team Members List
**Endpoint**: `GET /api/v1/team/list` or `GET /api/v1/team/members`

**Query Filters**:
```javascript
{
  page: 1,                        // Pagination (default: 1)
  limit: 20,                      // Records per page (default: 20, max: 100)
  search: "john",                 // Search by name, code, email, mobile
  status: "active",               // Filter by user status
  rank: "Partner",                // Filter by rank
  kyc_status: "approved",         // Filter by KYC status
  level: 1,                       // Filter by hierarchy level (1 = direct)
  joined_period: "today",         // today, this_month, or omit
  export: "csv"                   // Export as CSV (limit becomes 10,000)
}
```

**Response**:
```javascript
{
  success: true,
  data: [
    {
      id, user_id, partner_code, full_name,
      first_name, last_name, profile_photo_url,
      mobile, email, rank, status, kyc_status,
      level, parent_name, parent_code,
      children_count,             // Direct sub-agents under this member
      applications_count,         // Total applications submitted
      total_business,             // Total approved amount (₹)
      total_commission,           // Commission earned from their downline
      joined_at
    },
    ...
  ],
  pagination: {
    total, page, limit, total_pages
  }
}
```

### 4. Team Analytics
**Endpoint**: `GET /api/v1/team/analytics?period=30d`

**Period Options**: 7d, 30d (default), 90d, 1y

**Returns**:
```javascript
{
  daily_joining_trend: [
    { date: "2026-08-01", joinings: 5 },
    ...
  ],
  monthly_joining_trend: [
    { month: "Aug 2026", joinings: 23 },
    ...
  ],
  business_trend: [
    { month: "Aug 2026", business: 2500000, applications: 12 },
    ...
  ],
  commission_trend: [
    { month: "Aug 2026", commission: 25000 },
    ...
  ],
  top_products: [
    { product_name, category, sales_count, total_amount },
    ...
  ],
  conversion_funnel: {
    referral_clicks: 500,         // From partner_referrals table
    registrations: 120,           // Completed registrations
    kyc_approved: 95,             // KYC verified
    applications_submitted: 80,   // Apps from downline
    applications_approved: 65,    // Approved apps
    commissions_earned: 45000     // Total commission earned
  }
}
```

### 5. Team Activity Timeline
**Endpoint**: `GET /api/v1/team/activity?page=1&limit=20`

**Activity Types Tracked**:
- MEMBER_JOINED - When new member added to team
- APPLICATION_SUBMITTED - When team member submits app
- APPLICATION_APPROVED - When app gets approved
- OVERRIDE_COMMISSION_EARNED - When commission generated

**Response**:
```javascript
{
  success: true,
  data: [
    {
      id, type, description,
      actor_name, actor_code, actor_photo,
      created_at
    },
    ...
  ],
  page, limit
}
```

### 6. Team Goals & Leaderboard
**Endpoint**: `GET /api/v1/team/goals`

**Goals Data**:
```javascript
{
  goals: {
    member_target: 10,            // Set by partner or default
    current_month_members: 3,
    business_target: 100000,      // ₹
    current_month_business: 45000,
    commission_target: 25000,     // ₹
    current_month_commission: 8500,
    app_target: 20,
    current_month_apps: 12
  },
  leaderboard: [
    {
      rank_position: 1,
      id, name, code, photo, badge: "🥇 Champion",
      business: 500000,
      apps: 12,
      commission: 35000
    },
    ...
  ],
  badges: [
    { title: "Star Recruiter", icon: "🚀", desc: "Recruited 5+ members" },
    { title: "High Volume", icon: "💰", desc: "Generated ₹50k+ in business" },
    { title: "Top Earner", icon: "👑", desc: "Earned ₹10k+ team commission" },
    { title: "Fast Mover", icon: "⚡", desc: "Submitted 10+ applications" }
  ]
}
```

---

## Frontend Components

### Main Component: `PartnerTeam.jsx`
**Path**: `frontend/src/modules/partner/dashboard/PartnerTeam.jsx`

**Features**:
- Tab-based interface for different team management views
- Role detection: Shows different UI for TEAM_MEMBER vs PARTNER
- Team member upgrade request flow (TEAM_MEMBER can request upgrade)
- Real-time dashboard refresh capability

**Sub-Components**:
1. **TeamDashboardTab** - KPI summary, cards, metrics
2. **TeamTreeTab** - Hierarchical tree visualization
3. **TeamMembersTab** - Paginated member list with filters
4. **TeamAnalyticsTab** - Charts, trends, conversion funnel
5. **TeamActivityTab** - Activity timeline stream
6. **TeamGoalsTab** - Goals, leaderboard, badges
7. **TeamSettingsTab** - Configuration options
8. **TeamMemberDrawer** - Detail panel for selected member

### Related Components
- **PartnerDashboardComponent** - Main partner dashboard (links to team-network)
- **PartnerSearchBar** - Quick access to "Team Referrals & Network"
- **ManagePartners.jsx** (Admin) - Deactivate team, change parent
- **ManageCommissions.jsx** (Super Admin) - Bulk commission overrides for partners/team members

---

## API Endpoints

### Partner Routes (Self-service)
**Base**: `/api/v1/partner/self`

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/team/invite` | Add team member (alias for /team POST) | requireApprovedPartner |
| GET | `/team-tree` | Get team hierarchy tree | requireApprovedPartner |
| GET | `/team-dashboard` | Get dashboard KPIs | requireApprovedPartner |
| GET | `/team-earnings` | Get commission analytics | requireApprovedPartner |
| GET | `/team-members` | Get paginated team list | requireApprovedPartner |

### Partner Admin Routes
**Base**: `/api/v1/partner`

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/:PartnerId/team` | Create team member | selfOrAdmin, requireApprovedPartner |
| GET | `/:PartnerId/team` | List team members | selfOrAdmin |
| GET | `/network/all` | Get entire network (admin) | ADMIN, SUPER_ADMIN |
| PATCH | `/:PartnerId/change-parent` | Change team parent | ADMIN, SUPER_ADMIN |
| PATCH | `/:PartnerId/deactivate-team` | Deactivate team | ADMIN, SUPER_ADMIN |

### Dedicated Team Routes
**Base**: `/api/v1/team`

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/dashboard` | Team dashboard KPIs | jwtAuth |
| GET | `/team-dashboard` | Alias for /dashboard | jwtAuth |
| GET | `/tree` | Hierarchical tree (with parent_id query) | jwtAuth |
| GET | `/list` | Paginated members list | jwtAuth |
| GET | `/members` | Alias for /list | jwtAuth |
| GET | `/analytics` | Analytics (charts, trends) | jwtAuth |
| GET | `/activity` | Activity timeline | jwtAuth |
| GET | `/goals` | Goals and leaderboard | jwtAuth |
| GET | `/settings` | Team settings | jwtAuth |
| PATCH | `/settings` | Update team settings | jwtAuth |
| POST | `/invite` | Send invitation | jwtAuth |
| GET | `/refers` | Get referrals list | jwtAuth |
| GET | `/:id` | Get specific member details | jwtAuth |
| POST | `/upgrade-request` | Request upgrade to partner | jwtAuth (TEAM_MEMBER) |
| GET | `/upgrade-status` | Check upgrade status | jwtAuth (TEAM_MEMBER) |
| GET | `/info` | Get team info | jwtAuth |

---

## Team Performance Metrics

### KPI Categories

#### 1. Network Growth
- **Total Members**: Entire downline (recursive)
- **Direct Members**: Level 1 only
- **Indirect Members**: Level 2+
- **Joinings This Month**: Growth indicator
- **Conversion Rate**: % of registrations → KYC approved

#### 2. Member Health
- **Active Members**: Can submit applications
- **Inactive Members**: Suspended or pending
- **Verified (KYC)**: Ready for production
- **Pending KYC**: Still in onboarding

#### 3. Business Performance
- **Team Business Volume**: Total approved loan amounts (₹)
- **Applications Submitted**: Pipeline size
- **Applications Approved**: Closure rate
- **Average Conversion**: (approved / submitted) × 100

#### 4. Commission Earnings
- **Today's Commission**: Real-time earnings
- **Monthly Commission**: Current month total
- **Lifetime Commission**: All-time total
- **Top Performer**: Highest earner
- **Lowest Performer**: Needs coaching

#### 5. Trend Analysis
- **Daily Joining Trend**: Member recruitment velocity
- **Monthly Joining Trend**: 12-month history
- **Business Trend**: Monthly volumes
- **Commission Trend**: Monthly earnings trend
- **Top Products**: Best-selling products by team

---

## Key Features Summary

### ✅ Implemented Features

#### Team Management
- [x] Create team members with generated invite links
- [x] Hierarchical team structure (Level 1 & 2)
- [x] Multi-format invitations (WhatsApp, SMS, Email)
- [x] Mandatory password change on first login
- [x] Role-based access (PARTNER vs TEAM_MEMBER)
- [x] Team member KYC tracking
- [x] Paginated member lists with search/filters

#### Commission System
- [x] Level 1 commission (10% override)
- [x] Level 2 commission (5% override)
- [x] Automatic commission calculation on approval
- [x] Commission wallet crediting
- [x] Commission ledger logging
- [x] Commission reversal on rejection
- [x] Duplicate prevention checks

#### Analytics & Reporting
- [x] Real-time KPI dashboard
- [x] Hierarchical tree visualization
- [x] Activity timeline tracking
- [x] Conversion funnel analysis
- [x] Performance leaderboard
- [x] Monthly trend charts
- [x] Product-wise performance breakdown
- [x] CSV export capability

#### Admin Features
- [x] Full network visibility
- [x] Partner network reorganization
- [x] Team deactivation
- [x] Bulk commission overrides
- [x] Manual member creation
- [x] Partner status management

---

### ⏳ Potential Enhancements

#### Team Management
- [ ] Multi-level hierarchy beyond Level 2
- [ ] Custom commission split per team member
- [ ] Team member performance reviews
- [ ] Automated skill assessment system
- [ ] Team member termination workflow

#### Commission System
- [ ] Dynamic commission tiers based on volume
- [ ] Tiered commission increases (e.g., 15% after ₹1M business)
- [ ] Commission splits between multiple parents
- [ ] Tax deduction calculation (TDS 5%)
- [ ] Commission payout scheduling
- [ ] Commission advance system

#### Analytics
- [ ] Predictive analytics (next quarter forecast)
- [ ] A/B testing for conversion optimization
- [ ] Competitor benchmarking
- [ ] Member quality scoring
- [ ] Churn prediction alerts

#### Frontend
- [ ] Real-time notification system for events
- [ ] Mobile app version
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Advanced tree visualization with drag-drop

#### Admin Tools
- [ ] Team restructuring tool
- [ ] Batch member import (CSV upload)
- [ ] Commission calculator
- [ ] Team merge functionality
- [ ] Network health audit reports

---

## Configuration & Settings

### System Settings Table
These settings control team commission structure:

| Setting Key | Default | Type | Purpose |
|-------------|---------|------|---------|
| `team_commission_child_pct` | 90 | Percentage | Base commission % to team member |
| `team_commission_parent_pct` | 10 | Percentage | Override commission % to parent |

### Partner Profile Flags
| Column | Type | Purpose |
|--------|------|---------|
| `allow_team_creation` | BOOLEAN | Can partner create team? |
| `team_status` | VARCHAR | 'ACTIVE' or 'INACTIVE' |
| `parent_partner_id` | UUID | Who is this partner's parent? |
| `partner_id` | UUID | Self-reference (= id) |

---

## Security & Authorization

### Authorization Middleware
- **requirePartner**: Ensures user is a partner
- **requireApprovedPartner**: Partner with approved KYC
- **selfOrAdmin**: Access own data or admin override
- **Downline Check**: Can't access data outside your team tree

### Data Access Rules
1. **Partners**: View own team members only
2. **Team Members**: View own profile, cannot create teams
3. **Admins**: View any partner's network (via query param)
4. **Super Admins**: Full access to all networks

### SQL Safety
- Parameterized queries prevent SQL injection
- Row-level locking on sensitive transactions
- Transaction rollback on commission errors
- Audit logging on sensitive operations

---

## Database Queries Reference

### Common Queries Used

#### Get all downline members
```sql
SELECT * FROM partner_profiles p
WHERE p.parent_partner_id = $1 OR EXISTS (
  SELECT 1 FROM partner_team_relationships
  WHERE parent_partner_id = $1 AND child_partner_id = p.id
)
```

#### Calculate total team business
```sql
SELECT COALESCE(SUM(approved_amount), 0)::numeric
FROM applications a
JOIN partner_team_relationships r ON a.partner_id = r.child_partner_id
WHERE r.parent_partner_id = $1
AND a.status IN ('approved', 'disbursed', 'confirmed')
```

#### Get commission summary
```sql
SELECT
  COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE 
    THEN commission_amount ELSE 0 END), 0) as today_commission,
  COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE)
    THEN commission_amount ELSE 0 END), 0) as monthly_commission,
  COALESCE(SUM(commission_amount), 0) as lifetime_commission
FROM team_commissions
WHERE parent_partner_id = $1
```

---

## Troubleshooting Guide

### Common Issues

#### Team Member Can't Submit Applications
- **Check**: `users.status = 'active'`
- **Check**: `partner_profiles.kyc_status = 'approved'`
- **Check**: Parent partner has `allow_team_creation = true`

#### Commission Not Appearing
- **Check**: Application status is 'approved', 'disbursed', or 'confirmed'
- **Check**: `partner_team_relationships` record exists
- **Check**: Commission not already processed (duplicates blocked)
- **Check**: Parent partner wallet exists

#### Performance Slow with Large Teams
- **Solution**: Use pagination (default: 20 records/page)
- **Solution**: Enable CSV export for heavy queries (limit: 10,000)
- **Solution**: Index on `parent_partner_id` (already exists)
- **Check**: Database query explains plan

#### Team Member Upgrade Request Fails
- **Check**: User role is 'TEAM_MEMBER'
- **Check**: No pending upgrade request already exists
- **Check**: Parent partner status is not suspended

---

## Development Notes

### Key Files
- **Backend Controller**: `backend/src/modules/partner/partner.controller.js`
- **Backend Service**: `backend/src/modules/team/team.service.js`
- **Backend Routes**: `backend/src/modules/team/team.routes.js`
- **Frontend Main**: `frontend/src/modules/partner/dashboard/PartnerTeam.jsx`
- **Database Migrations**: `backend/src/database/migrations/migrate.js` (Partner Team Management section)

### Performance Optimizations
1. Indexed foreign keys on `partner_team_relationships`
2. Aggregation queries use COUNT/SUM optimizations
3. Pagination default limits prevent memory bloat
4. Lazy-loading tree nodes (fetch children on demand)
5. CSV export batches large datasets (max 10,000)

### Testing Recommendations
1. Test team member invitation flow (all 3 channels)
2. Verify commission calculation accuracy
3. Test authorization on cross-team access attempts
4. Load test with 1000+ member networks
5. Verify cascade deletion on partner removal
6. Test team member KYC approval flow
7. Validate pagination boundaries
8. Test concurrent commission processing

---

**Document Version**: 1.0  
**Last Updated**: August 8, 2026  
**Maintained By**: Development Team

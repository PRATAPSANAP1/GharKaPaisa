# Process Types and Status Flow Documentation

**Date**: August 26, 2026  
**Project**: GharKaPaisa - Financial Services Platform  
**Scope**: 4 Process Types - Status Changes, Access Control, and Page Details

---

## Overview

The system supports 4 distinct process types for application creation and management:

1. **lead_punching** - Partner manually punches lead details
2. **linked_share** - Partner generates share link for customer to fill
3. **direct_bank** - Customer applies directly from bank redirect
4. **physical_process** - Physical application form process

---

## Process Type 1: Lead Punching

### Description
Partner manually enters customer lead details through the partner portal. This is the traditional lead creation method where partners collect customer information and submit it directly.

### Process Flow
```
Partner enters details → Lead Created → Application Submitted → Status Updates → Commission
```

### Status Changes

| Status | When Changed | Who Can Change | Backend Function |
|--------|-------------|----------------|------------------|
| **pending** | Initial status when lead is created | Partner (automatic) | `submitPartnerApplication` |
| **details_submitted** | When partner submits full application details | Partner | `submitPartnerApplication` |
| **under_review** | When operational head reviews application | Operational Head | `updateStatus` |
| **operational_verified** | When operational head verifies application | Operational Head | `updateStatus` |
| **approved** | When super admin approves application | Super Admin | `approveApplication` |
| **super_admin_approved** | Final approval by super admin | Super Admin | `updateStatus` |
| **rejected** | When application is rejected | Super Admin / Operational Head | `rejectApplication` / `updateStatus` |
| **commission_received** | When commission is received | System (automatic) | `updateCommission` |
| **commission_released** | When commission is released to wallet | System (automatic) | `updateCommission` |

### Who Can Change Status

| Role | Can Change To | Restrictions |
|------|---------------|-------------|
| **Partner** | pending, details_submitted | Cannot change to operational_verified, super_admin_approved, commission statuses |
| **Team Member** | pending, details_submitted | Same restrictions as Partner |
| **Operational Head** | under_review, operational_verified, rejected | Cannot change to super_admin_approved, commission statuses |
| **Super Admin** | All statuses | Full access |
| **Admin** | All except super_admin_approved, commission_processing, commission_released | Restricted final approval |

### Pages Showing Details

| Page | Route | Shows | Access |
|------|-------|-------|--------|
| Partner Applications | `/partner/applications` | All lead punching applications | Partner, Team Member |
| Partner Add Lead | `/partner/leads/add` | Create new lead punching application | Partner, Team Member |
| Super Admin Applications | `/super-admin/applications` | All lead punching applications | Super Admin, Admin |
| Application Detail Modal | Modal in applications page | Full application details with timeline | All authorized roles |

### Backend Endpoints

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/applications/partner-apply` | POST | Submit lead punching application | Approved Partner |
| `/applications/:id` | PUT | Update application details | Partner, Admin |
| `/applications/:id/status` | PUT | Update application status | Partner, Admin, Operational Head |
| `/superadmin/application/approve` | POST | Approve application | Super Admin |
| `/superadmin/application/reject` | POST | Reject application | Super Admin |

### Code References
- **Frontend**: `frontend/src/modules/partner/leads/PartnerApplications.jsx` lines 73-89
- **Backend**: `backend/src/modules/crm/application.controller.js` lines 2048-2186
- **Status Update**: `backend/src/modules/crm/application.controller.js` lines 647-753

---

## Process Type 2: Linked Share

### Description
Partner generates a share link and sends it to customer. Customer fills their own details through the link. This is a self-service model where customers enter their information directly.

### Process Flow
```
Partner generates link → Customer fills form → Application Submitted → Status Updates → Commission
```

### Status Changes

| Status | When Changed | Who Can Change | Backend Function |
|--------|-------------|----------------|------------------|
| **pending** | Initial status when link is generated | Partner (automatic) | `generateShareLink` |
| **link_sent** | When link is sent to customer | Partner (automatic) | `generateShareLink` |
| **confirmed** | When customer clicks link | System (automatic) | Link tracking |
| **details_submitted** | When customer submits form through link | Customer (automatic) | `submitPhysicalApplicationByToken` |
| **under_review** | When operational head reviews application | Operational Head | `updateStatus` |
| **operational_verified** | When operational head verifies application | Operational Head | `updateStatus` |
| **approved** | When super admin approves application | Super Admin | `approveApplication` |
| **super_admin_approved** | Final approval by super admin | Super Admin | `updateStatus` |
| **rejected** | When application is rejected | Super Admin / Operational Head | `rejectApplication` / `updateStatus` |
| **commission_received** | When commission is received | System (automatic) | `updateCommission` |
| **commission_released** | When commission is released to wallet | System (automatic) | `updateCommission` |

### Who Can Change Status

| Role | Can Change To | Restrictions |
|------|---------------|-------------|
| **Partner** | Can only generate link, cannot change status | Cannot change application status directly |
| **Customer** | details_submitted (by submitting form) | Only through share link |
| **Operational Head** | under_review, operational_verified, rejected | Cannot change to super_admin_approved, commission statuses |
| **Super Admin** | All statuses | Full access |
| **Admin** | All except super_admin_approved, commission_processing, commission_released | Restricted final approval |

### Pages Showing Details

| Page | Route | Shows | Access |
|------|-------|-------|--------|
| Partner Applications | `/partner/applications` | All linked share applications | Partner, Team Member |
| Partner Share Tracking | `/partner/share-tracking` | Share link tracking and analytics | Partner, Team Member |
| Customer Share Link | `/apply/:token` | Customer form for linked share | Public (with token) |
| Super Admin Applications | `/super-admin/applications` | All linked share applications | Super Admin, Admin |
| Application Detail Modal | Modal in applications page | Full application details with timeline | All authorized roles |

### Backend Endpoints

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/partner/share-link` | POST | Generate share link | Approved Partner |
| `/partner/share-tracking` | GET | Get share link tracking | Approved Partner |
| `/applications/generate-share-link` | POST | Generate application share link | Partner |
| `/applications/generate-physical-link` | POST | Generate physical application link | Partner |
| `/apply/:token` | GET/POST | Customer form submission | Public (with token) |
| `/applications/:id/status` | PUT | Update application status | Admin, Operational Head |

### Code References
- **Frontend**: `frontend/src/modules/partner/leads/PartnerApplications.jsx` lines 243-307
- **Backend**: `backend/src/modules/crm/application.controller.js` lines 3700-3799
- **Share Link**: `backend/src/modules/partner/partner-share.controller.js`

---

## Process Type 3: Direct Bank

### Description
Customer applies directly from bank redirect or landing page. This is a customer-initiated process where customers come directly to the platform through bank partnerships.

### Process Flow
```
Customer visits bank page → Redirects to application form → Customer fills form → Application Submitted → Status Updates → Commission
```

### Status Changes

| Status | When Changed | Who Can Change | Backend Function |
|--------|-------------|----------------|------------------|
| **pending** | Initial status when customer starts application | Customer (automatic) | `submitApplication` |
| **details_submitted** | When customer submits form | Customer (automatic) | `submitApplication` |
| **under_review** | When operational head reviews application | Operational Head | `updateStatus` |
| **operational_verified** | When operational head verifies application | Operational Head | `updateStatus` |
| **approved** | When super admin approves application | Super Admin | `approveApplication` |
| **super_admin_approved** | Final approval by super admin | Super Admin | `updateStatus` |
| **rejected** | When application is rejected | Super Admin / Operational Head | `rejectApplication` / `updateStatus` |
| **commission_received** | When commission is received | System (automatic) | `updateCommission` |
| **commission_released** | When commission is released to wallet | System (automatic) | `updateCommission` |

### Who Can Change Status

| Role | Can Change To | Restrictions |
|------|---------------|-------------|
| **Customer** | pending, details_submitted | Only through direct application form |
| **Partner** | Cannot change status (read-only) | No direct access to direct bank applications |
| **Operational Head** | under_review, operational_verified, rejected | Cannot change to super_admin_approved, commission statuses |
| **Super Admin** | All statuses | Full access |
| **Admin** | All except super_admin_approved, commission_processing, commission_released | Restricted final approval |

### Pages Showing Details

| Page | Route | Shows | Access |
|------|-------|-------|--------|
| Bank Landing Page | `/apply/bank/:bankCode` | Direct bank application form | Public |
| Customer Application Form | `/apply/:token` | Customer form for direct bank | Public (with token) |
| Super Admin Applications | `/super-admin/applications` | All direct bank applications | Super Admin, Admin |
| Application Detail Modal | Modal in applications page | Full application details with timeline | Super Admin, Admin |

### Backend Endpoints

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/applications` | POST | Submit direct bank application | Public (with validation) |
| `/applications/:id` | GET | Get application details | Admin, Super Admin |
| `/applications/:id/status` | PUT | Update application status | Admin, Operational Head |
| `/superadmin/application/approve` | POST | Approve application | Super Admin |
| `/superadmin/application/reject` | POST | Reject application | Super Admin |

### Code References
- **Frontend**: `frontend/src/modules/partner/leads/PartnerApplications.jsx` lines 75-78
- **Backend**: `backend/src/modules/crm/application.controller.js` lines 62-209
- **Public Landing**: `frontend/src/modules/products/PartnerShareLanding.jsx`

---

## Process Type 4: Physical Process

### Description
Physical application form process where partners collect physical documents and submit them. This is for traditional paper-based applications that need to be digitized.

### Process Flow
```
Partner collects physical form → Uploads documents → Application Submitted → Status Updates → Commission
```

### Status Changes

| Status | When Changed | Who Can Change | Backend Function |
|--------|-------------|----------------|------------------|
| **pending** | Initial status when physical form is started | Partner (automatic) | `submitPartnerApplication` |
| **details_submitted** | When partner uploads physical documents | Partner | `submitPartnerApplication` |
| **under_review** | When operational head reviews application | Operational Head | `updateStatus` |
| **operational_verified** | When operational head verifies application | Operational Head | `updateStatus` |
| **approved** | When super admin approves application | Super Admin | `approveApplication` |
| **super_admin_approved** | Final approval by super admin | Super Admin | `updateStatus` |
| **rejected** | When application is rejected | Super Admin / Operational Head | `rejectApplication` / `updateStatus` |
| **commission_received** | When commission is received | System (automatic) | `updateCommission` |
| **commission_released** | When commission is released to wallet | System (automatic) | `updateCommission` |

### Who Can Change Status

| Role | Can Change To | Restrictions |
|------|---------------|-------------|
| **Partner** | pending, details_submitted | Cannot change to operational_verified, super_admin_approved, commission statuses |
| **Team Member** | pending, details_submitted | Same restrictions as Partner |
| **Operational Head** | under_review, operational_verified, rejected | Cannot change to super_admin_approved, commission statuses |
| **Super Admin** | All statuses | Full access |
| **Admin** | All except super_admin_approved, commission_processing, commission_released | Restricted final approval |

### Pages Showing Details

| Page | Route | Shows | Access |
|------|-------|-------|--------|
| Partner Applications | `/partner/applications` | All physical process applications | Partner, Team Member |
| Partner Add Lead | `/partner/leads/add` | Create new physical process application | Partner, Team Member |
| Super Admin Applications | `/super-admin/applications` | All physical process applications | Super Admin, Admin |
| Application Detail Modal | Modal in applications page | Full application details with timeline | All authorized roles |
| Document Verification Modal | Modal for document upload | Physical document upload | Partner, Admin |

### Backend Endpoints

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/applications/partner-apply` | POST | Submit physical process application | Approved Partner |
| `/applications/generate-physical-link` | POST | Generate physical application link | Partner |
| `/applications/:id/documents` | POST | Upload physical documents | Partner, Admin |
| `/applications/:id/status` | PUT | Update application status | Partner, Admin, Operational Head |
| `/superadmin/application/approve` | POST | Approve application | Super Admin |
| `/superadmin/application/reject` | POST | Reject application | Super Admin |

### Code References
- **Frontend**: `frontend/src/modules/partner/leads/PartnerApplications.jsx` lines 75-78
- **Backend**: `backend/src/modules/crm/application.controller.js` lines 2048-2186
- **Physical Link**: `backend/src/modules/crm/application.controller.js` lines 3700-3799

---

## Status Change Restrictions Summary

### Common Restrictions Across All Process Types

| Status | Partner | Team Member | Operational Head | Admin | Super Admin |
|--------|---------|-------------|------------------|-------|-------------|
| pending | ✅ | ✅ | ❌ | ❌ | ✅ |
| details_submitted | ✅ | ✅ | ❌ | ❌ | ✅ |
| under_review | ❌ | ❌ | ✅ | ✅ | ✅ |
| operational_verified | ❌ | ❌ | ✅ | ✅ | ✅ |
| approved | ❌ | ❌ | ❌ | ✅ | ✅ |
| super_admin_approved | ❌ | ❌ | ❌ | ❌ | ✅ |
| rejected | ❌ | ❌ | ✅ | ✅ | ✅ |
| commission_received | ❌ | ❌ | ❌ | ❌ | ✅ |
| commission_released | ❌ | ❌ | ❌ | ❌ | ✅ |
| commission_processing | ❌ | ❌ | ❌ | ❌ | ✅ |

### Key Restrictions

1. **Partners and Team Members** can only change status to `pending` and `details_submitted`
2. **Operational Heads** can change to `under_review`, `operational_verified`, and `rejected`
3. **Admins** can change to most statuses except `super_admin_approved` and commission statuses
4. **Super Admin** has full access to all status changes
5. **Commission statuses** (`commission_received`, `commission_released`, `commission_processing`) are system-controlled or Super Admin only

---

## Page Access Matrix by Process Type

| Process Type | Partner Page | Super Admin Page | Customer Page | Public Access |
|--------------|--------------|------------------|---------------|---------------|
| **lead_punching** | `/partner/applications` | `/super-admin/applications` | ❌ | ❌ |
| **linked_share** | `/partner/applications`, `/partner/share-tracking` | `/super-admin/applications` | `/apply/:token` | ✅ (with token) |
| **direct_bank** | ❌ | `/super-admin/applications` | `/apply/:token` | ✅ (with token) |
| **physical_process** | `/partner/applications` | `/super-admin/applications` | ❌ | ❌ |

---

## Backend Status Update Functions

### 1. updateStatus (General Status Update)
- **Location**: `application.controller.js` lines 647-753
- **Endpoint**: `PUT /applications/:id/status`
- **Access**: Partner, Team Member, Operational Head, Admin, Super Admin
- **Restrictions**: 
  - Partners/Team Members cannot change to operational or admin approval statuses
  - Admins cannot change to super_admin_approved or commission statuses
  - Operational Heads cannot change to super_admin_approved or commission statuses

### 2. approveApplication (Super Admin Approval)
- **Location**: `application.controller.js` lines 956-1014
- **Endpoint**: `POST /superadmin/application/approve`
- **Access**: Super Admin only
- **Function**: Sets status to 'approved', processes commission, triggers team override payouts

### 3. rejectApplication (Super Admin Rejection)
- **Location**: `application.controller.js` lines 1016-1049
- **Endpoint**: `POST /superadmin/application/reject`
- **Access**: Super Admin only
- **Function**: Sets status to 'rejected', cancels commission

### 4. updateCommission (Commission Status Update)
- **Location**: `application.controller.js` lines 848-893
- **Endpoint**: `PUT /applications/:id/commission`
- **Access**: Super Admin only
- **Function**: Updates commission status and amount, credits wallet on approval

### 5. submitPartnerApplication (Partner Application Submission)
- **Location**: `application.controller.js` lines 2048-2186
- **Endpoint**: `POST /applications/partner-apply`
- **Access**: Approved Partner only
- **Function**: Submits or saves draft application with process type validation

---

## Process Type Validation

### Valid Process Types
```javascript
const validProcesses = ['lead_punching', 'linked_share', 'direct_bank', 'physical_process'];
```

### Process Type Metadata Mapping
```javascript
if (process_type === 'linked_share') {
  processByVal = 'partner';
  sourceVal = 'share_link';
} else if (process_type === 'direct_bank') {
  processByVal = 'customer';
  sourceVal = 'bank_redirect';
} else if (process_type === 'physical_process') {
  processByVal = 'partner';
  sourceVal = 'physical';
} else {
  processByVal = 'partner';
  sourceVal = 'partner_portal'; // lead_punching
}
```

### Frontend Process Detection
```javascript
const getProcessFlags = (procType, procBy) => {
  const pt = String(procType || procBy || '').toLowerCase();
  const isLeadPunching = pt === 'lead_punching' || pt === 'punching' || (pt.includes('punch') && !pt.includes('direct'));
  const isLinkedShare = pt === 'linked_share' || pt === 'share_link' || (pt.includes('share') && !pt.includes('direct'));
  const isDirectBank = pt === 'direct_bank' || pt === 'direct_apply' || pt.includes('direct');
  const isPhysical = pt === 'physical_process' || pt.includes('physical');
  return { isLeadPunching, isLinkedShare, isDirectBank, isPhysical };
};
```

---

## Timeline and Status History

All status changes are logged in the `application_timeline` table with:
- **application_id**: Reference to application
- **status**: New status value
- **activity**: Description of status change
- **remarks**: Additional notes
- **performed_by**: User ID who made the change
- **created_at**: Timestamp of change

Status history is stored in the `status_history` JSONB column in the `applications` table with structure:
```json
{
  "status": "approved",
  "at": "2026-08-26T10:30:00Z",
  "by": "user-uuid",
  "remarks": "Approved by Super Admin"
}
```

---

## Notifications and SMS

### Status Change Notifications
- **Partner Notification**: Sent when application is approved or rejected
- **Customer SMS**: Sent when application status changes (via DLT)
- **Team Notification**: Sent when team member's application is approved

### Commission Notifications
- **Commission Received**: Notified when commission is marked as received
- **Commission Released**: Notified when commission is credited to wallet
- **Referral Bonus**: Notified when referral bonus is credited (3 approved credit cards)

---

## Summary Table

| Process Type | Created By | Initial Status | Partner Access | Customer Access | Super Admin Access |
|--------------|------------|----------------|----------------|-----------------|-------------------|
| **lead_punching** | Partner | pending | Full (create, view, edit) | ❌ | Full |
| **linked_share** | Partner | pending/link_sent | Full (generate link, track) | Full (fill form) | Full |
| **direct_bank** | Customer | pending | ❌ | Full (apply) | Full |
| **physical_process** | Partner | pending | Full (create, upload docs) | ❌ | Full |

---

**Document Generated By**: Cascade AI Assistant  
**Date**: August 26, 2026  
**Version**: 1.0

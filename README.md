# GharKaPaisa — Full Project Analysis & Build Roadmap

Current Status · What to Fix · What to Build Next

---

## PART 1 — CURRENT PROJECT STATUS

### Backend (Strong Foundation)
- **JWT Authentication**: Secured with 15-minute access tokens + 30-day refresh token rotation via HTTP-only cookies.
- **Email Verification**: Email OTP login via AWS SES + email pre-verification before registration.
- **Mobile OTP**: MSG91 mobile OTP login with token replay protection.
- **RBAC**: Clean role enforcement across `SUPER_ADMIN`, `ADMIN`, `EMPLOYEE`, and `PARTNER`.
- **Wallet & Commission System**: Auto-wallet creation, commission hold/release (48h hold), and withdrawal requests with bank account debit.
- **Admin Management**: Withdrawal approval/rejection with UTR logging, audit logging, and email templates (14 templates).
- **CMS**: DB-driven editable homepage sections (banners, services).
- **Leads & Card Tracking**: Lead submission and direct card application tracking from public homepage.
- **I18n & Theme**: 9 languages supported (en, hi, mr, gu, bn, te, ta, kn, or) and dark/light theme context.
- **Production Readiness**: Graceful shutdown and process exception handlers in place.

### Frontend (Mostly Complete)
- **Partner Portal**: Dual-method login (OTP + Password), 4-step registration flow, dashboard analytics, profile, applications, and store integration.
- **Admin / SuperAdmin Panels**: Manage partners, applications, withdrawals, banners, sections, products, and commissions.

---

## PART 2 — BUGS STAGE

- **BUG 1**: Duplicate `components/Partner/PartnerWallet.jsx` file using mock data.
- **BUG 2**: Post-commit `client.query` database connections used after client has been released in `application.controller.js`.
- **BUG 3**: `generateAppNumber()` is not collision-safe under concurrent usage.
- **BUG 4**: `isAuthenticated()` manually decodes JWT client-side rather than checking Zustand store state.
- **BUG 5**: MSG91 keys are hardcoded in components.
- **BUG 6**: `partnerStore.js` fetches profile from `/partner/profile` which needs verification.
- **BUG 7**: `partnerStore.js` fetches applications from `/partner/applications` instead of `/applications`.
- **BUG 8**: `server.js` branding still references "FinEdge".
- **BUG 9**: Double `client.release()` inside `wallet.controller.js`'s withdrawal requests.
- **BUG 10**: Verify `partner.api.js` exports `getDashboard`.

---

## PART 3 — BUILD ROADMAP (NEW FEATURES)

1. **FEATURE 1**: Partner KYC Document Upload from Profile Page.
2. **FEATURE 2**: Real-time Notification Bell and Inbox.
3. **FEATURE 3**: Partner Application Submission Form.
4. **FEATURE 4**: SuperAdmin Commission Structure Overrides.
5. **FEATURE 5**: SSE / Live Dashboard Updates.
6. **FEATURE 6**: Partner Referral Link and QR Code Generator.
7. **FEATURE 7**: CSV/Excel Reports Export.
8. **FEATURE 8**: Earnings Calculator.
9. **FEATURE 9**: Public Application Status Tracker.
10. **FEATURE 10**: Mobile App Phone Authentication & Integration.

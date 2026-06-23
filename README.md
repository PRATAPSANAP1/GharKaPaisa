# GharKaPaisa — Full Project Features & Technical Report

Welcome to **GharKaPaisa**, a premium web and mobile application designed for credit card lead generation, partner commissions management, and multi-tenant administrative control. 

This document serves as a detailed report of all features, functionalities, and user interfaces implemented in the project.

---

## ── 1. HOMEPAGE & NAVIGATION (IN DETAIL) ──

The homepage serves as the primary portal for customers, referral partners, and system administrators. 

### Premium Header Navigation Bar
The header navbar is designed with modern styling, clean alignments, and a highly responsive layout:
- **Company Logo**: A high-resolution, clickable brand logo positioned at the far left of the navbar. Clicking the logo instantly routes the user back to the homepage.
- **Three Quick-Access Portal Buttons**:
  - **Admin Login**: Routes the user directly to the SuperAdmin and Admin login panel (`/admin-login`).
  - **Partner Login**: Routes the user to the registered referral partner login and dashboard workspace (`/login`).
  - **Employee Login**: Provides a dedicated routing pathway for organization employees to access internal management views.
- **Mode Changer (Theme Toggler)**:
  - A custom-designed switch that enables instant toggling between **Light Mode** (sleek, high-contrast brand aesthetics with clean white and blue tones) and **Dark Mode** (deep-navy surface backgrounds, optimized for low-light environments).
  - Synchronizes throughout all sub-routes, layout wrappers, and dashboard components.
- **Language Translator**:
  - A dynamic multi-language localization dropdown supporting **9 regional Indian languages**:
    - English (EN)
    - Hindi (HI)
    - Marathi (MR)
    - Gujarati (GU)
    - Bengali (BN)
    - Telugu (TE)
    - Tamil (TA)
    - Kannada (KN)
    - Odia (OR)
  - Dynamically updates all text content, labels, cards, and buttons on the interface to the selected language context.

### Dynamic CMS-Driven Home Banners
- Renders high-fidelity marketing banners (e.g., Lifetime Free Credit Cards, special bank cashback offers) fetched dynamically from the database and managed via the SuperAdmin CMS dashboard.
- **Direct Banner Redirection**:
  - Each banner is linked to a target routing URL.
  - Clicking on a banner redirects the user directly to its target offer category page.
  - **Example**: Clicking on the **Lifetime Free (LTF) Banner** immediately routes the user to the dedicated Lifetime Free Credit Cards category view page (e.g., `/credit-cards/lifetime-free-credit-cards-ltf`).

---

## ── 2. BANK CATALOG & CARD OPERATIONS ──

The core of the catalog browsing experience is structured hierarchically:
`Lending Partners (Banks) ──> Bank-Specific Credit Cards ──> Comparative Actions`

### Lending Partners & Card Lists
- The homepage lists active banks (Lending Partners) available on the platform, including:
  - **HDFC Bank**
  - **SBI Card**
  - **Axis Bank**
  - **ICICI Bank**
  - **Kotak Mahindra Bank**
  - **Yes Bank**
  - **IDFC First Bank**
  - **Federal Bank**
- Clicking on a specific bank's name or logo opens a dedicated catalog of that bank's credit cards. Each card card is rendered beautifully with its card image, reward highlights, annual/joining fees, and card network (Visa, Mastercard, RuPay).

### Individual Card Action Buttons
For every credit card displayed in the bank-specific catalog, three main action buttons are provided:
1. **Compare**:
   - Opens a custom drawer/modal comparing up to three selected credit cards side-by-side.
   - Highlights rewards, annual fees, eligibility, and special features to help the user choose the best card.
2. **Benefits**:
   - Opens the dedicated **Card Benefits** page (`/card-benefits/:id` or `/card-benefits/:name-slug`) containing exhaustive details of the selected card.
3. **Apply**:
   - Triggers the application flow. On public pages, it opens an input modal where the user registers their details, verifies them via an SMS OTP, and is then seamlessly redirected to the banking partner's official secure credit card application link.

---

## ── 3. CARD BENEFITS PAGE (IN DETAIL) ──

When a user clicks the **Benefits** button on any credit card, it opens a highly detailed page containing information about that specific card. The page layout has been optimized to emulate a high-end native mobile application.

### Layout & Scrolling Optimizations
- **Body Scroll Blocked**: The main page container `.cbp-container` is locked at `height: 100vh` with `overflow: hidden`, preventing the entire page body from scrolling.
- **Inner Scroll Wrapper**: Renders a custom scrollable viewport `.cbp-scrollable-content` with `overflow-y: auto`. The header bar remains fixed at the top of the screen while the card details scroll internally.
- **High-Density Compact UI**: Spacing, margins, padding, and font sizes throughout the benefits panel have been reduced by **30-50%** to provide a compact, elegant layout that shows information efficiently without vertical scroll fatigue.

### Header Bar Actions
- **Apply Now Button**: Placed at the top navbar near the share button. Clicking it navigates the user directly to the credit card application form (`/product/:id/apply`).
- **Universal Share Button**:
   - Uses the browser's native **Web Share API** (`navigator.share`) to open the native OS sharing sheet on mobile devices.
   - Allows users to share the card page to **any app** (WhatsApp, Telegram, Slack, Gmail, SMS, or system clipboard) instead of restricting to WhatsApp.
   - Falls back to copying the link to the clipboard and redirection to the WhatsApp Web API on desktop.

### Dynamic Tab Navigation Panels
The card details are structured into several tabs for easy navigation:
- **Special Offer**: Displays the partner commission structure, including "Total Earning" and "Card Approval & Dispatch" payouts, along with active offer validity end dates.
- **Benefits**: Lists reward points multipliers, joining perks, milestone bonuses, dining/fuel surcharge waivers, and airport lounge access terms.
- **Whom to Refer**: Outlines customer eligibility guidelines:
  - Age limits (minimum and maximum ages).
  - Income and employment criteria (salaried vs. self-employed thresholds).
  - Mandatory KYC checklist documents (specifically restricted to **PAN Card** and **Cancelled Cheque** to streamline the application process).
- **How It Works**: A step-by-step visual timeline explaining the application sequence:
  1. Click apply & enter details.
  2. Complete bank KYC / Video-KYC (V-KYC).
  3. Verify document dispatch and card approval.
  4. Virtual/physical card delivery.
- **Training Video**: Embeds interactive video guides and tutorials helping partners understand how to promote the card.
- **FAQ's**: A collapsible accordion-style layout detailing answers to common questions about card activation, charges, and rewards.
- **T&C (Terms & Conditions)**: Displays the legal guidelines, refund policies, and official terms governing card issuance and commission claims.

---

## ── 4. PARTNER PORTAL ──

The referral partner system facilitates user enrollment, application submissions, and commission tracking.

### Streamlined Registration & KYC
- **Registration Form**: Captures password input directly at the time of registration with secure validation.
- **Mandatory KYC Documents**: Reduced the document upload checklist to require only **PAN Card** and **Cancelled Cheque** (Aadhaar and GST uploads are removed) to speed up onboarding and remove friction.
- **Authentication**: Supports dual login methods using standard Password authentication or MSG91 SMS OTP verification.

### Partner Dashboard & Wallet
- **Metrics Overview**: Tracks total applications submitted, approved leads, pending commissions, and paid out earnings.
- **Wallet System**: Displays wallet balances and withdrawal requests matching bank account payouts, with automatic 48-hour holds on payouts for audit checks.

---

## ── 5. ADMIN & SUPERADMIN PANEL ──

System administrators manage all resources, configurations, and commission payouts from the Admin Panel.

### Sidebar Navigation Overhaul
The SuperAdmin dashboard is organized into clear, structured categories:
- **USERS & ACCOUNTS**: Admins directory, Partners directory
- **LEAD TRACKING**: Leads, Direct Card Leads
- **PRODUCTS & PARTNERS**: Lending Partners (Banks), Products catalog
- **MODIFY** (Collapsible accordion):
  - Banners manager (Manage carousel banners and redirection URLs)
  - CMS Homepage editor (Manage section titles and homepage content)
- **SYSTEM UTILITIES**: Services API, Commission Manager, Audit Logs, Reports
- **Active Path Tracking**: The sidebar automatically tracks current navigation and expands the **MODIFY** sub-menu if the user is editing banners or CMS content.
- **Theme Toggler Status**: Integrates a "LIGHT ☀️" / "DARK 🌙" status text label in the sidebar next to the logout button.

### Admin Tools & Security
- **Forgot Password**: Integrated password reset options on the admin login screen.
- **Lead Resolution Fix**: Public form application lead submissions resolve card parameters via slug name lookups, avoiding PostgreSQL UUID mismatch exceptions (HTTP 400/422).

---

## ── 6. MOBILE APP SHELL INTEGRATION ──

- **WebView Wrapper**: Renders the responsive web app within a mobile shell in the `/mobile` directory, maintaining the exact look and feel of the website.
- **Hardware Back Button Interception**:
  - Uses React Native's `BackHandler` API to intercept back navigation on Android.
  - Pressing the hardware back button navigates backward within the WebView's page history instead of closing the application.

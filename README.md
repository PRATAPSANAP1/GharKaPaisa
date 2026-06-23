# GharKaPaisa — Full Project Features & Technical Report

Welcome to **GharKaPaisa**, a premium web and mobile application designed for credit card lead generation, partner commissions management, and multi-tenant administrative control. 

This document serves as an exhaustive, detailed technical report of all features, functionalities, interfaces, and panels implemented in the project.

---

## ── 1. HOMEPAGE & NAVIGATION (IN DETAIL) ──

The homepage serves as the primary portal for customers, referral partners, and system administrators. 

### Premium Header Navigation Bar
The header navbar is designed with modern styling, clean alignments, and a highly responsive layout:
- **Company Logo**: A high-resolution, clickable brand logo positioned at the far left of the navbar. Clicking the logo instantly routes the user back to the homepage.
- **Three Quick-Access Portal Buttons**:
  - **Admin**: Routes the user directly to the Admin/SuperAdmin login panel (`/admin-login`).
  - **Partner**: Routes the user to the registered referral partner login and dashboard workspace (`/login`).
  - **Employee**: Points to the administrative portal login (`/admin-login`) where internal employees log in with their assigned credentials.
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
- Clicking on a specific bank's name or logo opens a dedicated catalog of that bank's credit cards. Each card is rendered beautifully with its card image, reward highlights, annual/joining fees, and card network (Visa, Mastercard, RuPay).

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

## ── 4. PARTNER PORTAL (IN DETAIL) ──

The **Partner Portal** is a comprehensive, dashboard-driven environment that empowers independent financial agents to submit customer leads, browse available products, track payout earnings, and manage account preferences.

### A. Partner Registration & Simplified KYC Onboarding
- **Account Creation**: Partners sign up using their basic details (First Name, Last Name, Email, and Mobile number).
- **Direct Password Setting**: A secure password input is requested at registration time, enforcing length and composition checks.
- **Simplified Document Checklist**: To remove registration friction and expedite approvals, KYC is restricted to taking only two mandatory documents:
  - **PAN Card** (Input and document image upload)
  - **Cancelled Cheque** (Input and document image upload)
  - *Note*: Aadhaar card and GST options are removed to streamline onboardings.
- **Authentication**: Supports secure login using a registered Mobile/Email & Password combination, with fallback to MSG91-backed SMS OTP verification.

### B. Partner Dashboard (Analytics Hub)
Upon logging in, partners are greeted with a dashboard displaying metrics and tools:
- **Key Statistics Cards**:
  - **Total Leads**: Cumulative number of customer applications submitted.
  - **Approved Leads**: Payout-eligible approved card applications.
  - **Pending Payouts**: Verified commissions awaiting payment release.
  - **Total Earnings**: Lifetime earnings generated on the platform.
- **Recent Lead Tracker**: A summary list of the partner's latest lead submissions showing customer name, card applied for, submission date, status, and comments.
- **Referral Invitation Section**: Displays the partner's unique referral link and referral code, allowing them to invite other partners to their team.

### C. Partner Marketplace (Product Catalog)
- **Product Hub**: Partners browse all credit cards and banking products configured in the system.
- **Search & Filter**: Quickly locate cards by bank (Lending Partner) or categories (e.g., Rewards, Cashback, Fuel, Travel, Lifetime Free).
- **Commission Indicators**: Each card showcases the exact commission potential (e.g., ₹2,500 on approval) and active promotional validity.
- **Unique Referral Links**: Provides two primary options for every product:
  - **Share Link**: Instantly copies a tracking-parameter-equipped referral link to share with clients via social media or messaging platforms.
  - **Apply Directly**: Launches the lead generation flow inside the partner's workspace to directly record details for a client.

### D. Wallet & Withdrawal System
- **Real-Time Balance**: Displays current withdrawable funds and historical withdrawals.
- **Bank Account Setup**: Partners configure their payout bank name, branch, account number, and IFSC code.
- **Withdrawal Requests**: Partners trigger payout requests directly to their bank account.
- **Security Check Hold**: System applies an automated 48-hour audit hold on newly requested withdrawals to prevent fraud.

---

## ── 5. SUPER PARTNER / TEAM NETWORK (IN DETAIL) ──

The **Super Partner** capability is built directly into the **Team Network** module of the Partner Portal. It enables established agents to operate as network sub-distributors, onboarding child partners and earning bonuses or overrides.

### A. Building the Network
- **Referral Sign-up**: New partners can register using a Super Partner's unique `Referral Code`.
- **Direct Creation Modal**: Super Partners can manually add team members directly from their dashboard using the **"Add Team Member"** form. This form requires:
  - Member's First and Last Name
  - Email Address
  - Mobile Number
  - Custom Password (communicated to the team member for their first login)
- **Automatic Association**: The backend assigns the created partner account under the parent partner ID, creating a parent-child relationship hierarchy.

### B. Team Management Grid
Super Partners monitor their downline organization through an interactive management console:
- **Member Directory**: Lists all referred/child partners.
- **Member Info & Contacts**: Displays profile initials, names, email addresses, and phone numbers.
- **Unique Partner Code Tracker**: Displays each team member's assigned `Partner_code` for verification.
- **KYC Status Indicators**: Displays real-time status of the child partner's KYC approval (`PENDING`, `APPROVED`, or `REJECTED`) represented by color-coded badges (Amber, Green, Red).
- **Joining Timeline**: Records the exact date and time the member joined the team network.

---

## ── 6. ADMIN PANEL (IN DETAIL) ──

The **Admin Panel** is geared toward operational administrators who manage partners, verify KYC files, update lead statuses, and authorize financial withdrawals.

### A. Admin Dashboard Summary
- Shows operational stats: count of pending partner KYCs, pending withdrawals, active credit card leads, and today's total applications.

### B. Partner KYC Management
- **Verification Queue**: Lists all registered partners.
- **KYC Details Modal**: Admins review uploaded PAN Card and Cancelled Cheque images, comparing them with text inputs.
- **Approval Actions**: Admins approve the partner (granting access to marketplace links and withdrawals) or reject them (specifying comments/reasons sent to the partner's profile).

### C. Application & Lead Management
- Admins oversee two streams of leads:
  1. **Partner Leads**: Credit card applications submitted by referral partners.
  2. **Direct Leads**: Applications submitted directly by customers on the public homepage.
- **Lead Tracking & Resolution**: Admins update the application stages (e.g., Lead Created, Bank Submission, V-KYC Done, Approved, Rejected) and input tracking reference IDs from the bank.

### D. Withdrawal & Payout Control
- Lists withdrawal requests submitted by partners.
- Admins verify bank details against the cancelled cheque, check for the 48-hour hold duration, and mark requests as **Approved** (disbursed) or **Rejected** (returning funds to the partner's wallet).

---

## ── 7. SUPERADMIN PANEL (IN DETAIL) ──

The **SuperAdmin Panel** is the highest level of administrative control, enabling total control over database contents, platform settings, commission structures, homepage styling, and system auditing.

### A. Sidebar Navigation Overhaul
The SuperAdmin layout organizes system features into distinct categories:
- **USERS & ACCOUNTS**: Manage system administrators and partner registers.
- **LEAD TRACKING**: Monitor portal leads and direct card leads.
- **PRODUCTS & PARTNERS**: Manage banks (Lending Partners) and products (Credit Cards).
- **MODIFY** (Collapsible accordion):
  - **Banners Manager**: Upload carousel images, add header titles, and link them to target category routing URLs.
  - **CMS Homepage Editor**: Modify text headings, sections, and category structures dynamically.
- **SYSTEM UTILITIES**: Services API, Commission Manager, Audit Logs, Reports.
- **Active Path Tracking**: The sidebar automatically tracks current navigation and expands the **MODIFY** sub-menu if the user is editing banners or CMS content.
- **Theme Toggler Status**: Integrates a "LIGHT ☀️" / "DARK 🌙" status text label in the sidebar next to the logout button.

### B. Banking & Product Configurator
- **Lending Partners**: Admins create banks, upload bank logos, and configure integration APIs.
- **Credit Card Configurator**: Allows absolute control over individual card entries:
  - Add names, titles, card images, network types, card categories.
  - Edit annual and joining fee figures.
  - Formulate detailed rewards, joining benefits, lounges, and waivers text.
  - Embed FAQs and Terms & Conditions.

### C. Commission Manager
- Configures how payouts are distributed to partners for each credit card:
  - **Total Earning**: The maximum payout potential on card issuance.
  - **Card Approval & Dispatch Payout**: The baseline commission given on approval.
  - **Promotional Validity**: Set date schedules (e.g., "Offer valid till 30 June") showing up as dynamic countdown labels on benefits pages.

### D. Audit Logs & System Telemetry
- A security ledger recording all user actions in the database:
  - Keeps track of which Admin logged in, changed a card payout, viewed a partner's KYC, or changed a system password.
  - Non-editable, searchable grid for security compliance.

### E. Financial Reports Engine
- Generates system-wide analytics.
- Admins download structured CSV/Excel reports containing filtered lists of leads, partner performance, wallet transactions, and total payouts.

---

## ── 8. MOBILE APP SHELL INTEGRATION ──

- **WebView Wrapper**: Renders the responsive website inside a mobile application shell located in `/mobile`.
- **Navigation History Interception**:
  - Connects to React Native's `BackHandler` API. Intercepts Android's hardware back press, delegating navigation back within the WebView page history instead of quitting the application.

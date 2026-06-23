# GharKaPaisa — Full Project Features & Technical Report

Welcome to **GharKaPaisa**, a premium web and mobile application designed for credit card lead generation, partner commissions management, and multi-tenant administrative control.

Below is the structured technical documentation of all features implemented across every page and panel in the project, formatted in detailed numbered lists.

---

## ── 1. NORMAL USER / PUBLIC PAGE FEATURES ──

These features are accessible to public visitors on the main website and mobile app home screen.

1. **Brand Logo Redirection**: A custom, high-resolution company logo placed on the top-left of the navigation bar. Clicking it returns the user to the homepage from any subpage.
2. **Three Role Login Buttons**: Action buttons in the header navbar routing to specific sub-portals:
   - **Admin Login**: Routes to `/admin-login` for operational managers.
   - **Partner Login**: Routes to `/login` for referral partners.
   - **Employee Login**: Routes to `/admin-login` for employee logins.
3. **Mode Changer (Theme Toggler)**: A high-fidelity toggle switch in the navbar that instantly alternates the entire application styling between **Light Mode** (sleek brand branding) and **Dark Mode** (deep-navy night theme).
4. **9-Language Translator**: A dropdown component in the header that utilizes full localization translations to switch the UI labels, headings, and buttons between English (EN), Hindi (HI), Marathi (MR), Gujarati (GU), Bengali (BN), Telugu (TE), Tamil (TA), Kannada (KN), and Odia (OR).
5. **CMS-Driven Slider Banners**: Marketing banners rendered on the home page dynamically via the Super Admin CMS.
6. **Direct Banner Redirection**: Each slider banner is linked to a target URL. For example, clicking the **Lifetime Free (LTF) Banner** immediately redirects the user to the Lifetime Free category page (`/credit-cards/lifetime-free-credit-cards-ltf`).
7. **Lending Partners Grid**: Lists active lending banks (HDFC, SBI, Axis, ICICI, Kotak, Yes Bank, IDFC First, Federal Bank) on the homepage. Clicking a bank opens its card catalog page.
8. **Bank-Specific Card Catalog**: Shows all credit cards associated with a chosen bank, complete with card photos, reward summaries, annual charges, and card networks (RuPay, Visa, Mastercard).
9. **Card Compare Drawer**: Allows the user to select up to three credit cards and compare their joining fees, annual charges, benefits, and reward points side-by-side in a comparative overlay window.
10. **Card Benefits Detail Routing**: Clicking the "Benefits" button on any card page routes the user to a dedicated details layout page (`/card-benefits/:id`).
11. **Apply Now Header Button**: A prominent call-to-action button placed at the top header navbar of the benefits page for quick access. Clicking it navigates directly to the lead registration page.
12. **Universal Share API Button**: A share button that uses the browser's native **Web Share API** (`navigator.share`) to open the native OS sharing sheet on mobile, letting users share the card benefits page to any application (WhatsApp, Telegram, SMS, Email, Slack). On desktop, it falls back to copying the link to clipboard or opening WhatsApp Web.
13. **Customer OTP Verification Modal**: When a user clicks "Apply" on a card, it prompts them for their contact number, sends a verification OTP via SMS, validates it, and forwards them to the official bank application landing page.
14. **Mobile-Optimized Scroll Lock Layout**: The benefits details page locks the main viewport (`height: 100vh`, `overflow: hidden`) and uses an internal scrollable div, emulating a native mobile app layout.
15. **Compact Density UI**: Padding, spacing, margins, and text fonts on the benefits page are scaled down by **30-50%** to show maximum card details on single viewports.
16. **Interactive Tabs Panel**: Displays detailed card information broken down into:
    - **Special Offer**: Displays payout earnings and validity countdown.
    - **Benefits**: Bulleted list of cashbacks, milestone vouchers, and lounge details.
    - **Whom to Refer**: Eligibility guidelines (minimum/maximum age, minimum salary).
    - **How It Works**: Visual horizontal timeline of steps.
    - **Training Video**: Embedded tutorial player.
    - **FAQs**: Collapsible accordion question cards.
    - **T&C**: Terms, conditions, and disclaimers.

---

## ── 2. PARTNER PANEL FEATURES ──

These features are available to referral partners to manage clients, submit leads, and request payouts.

1. **Dual-Method Login Screen**: Partners can log in securely using either their email/mobile + password, or via MSG91-backed SMS OTP authentication.
2. **On-Registration Password Setup**: Allows partners to create a secure password directly at the time of register/signup.
3. **Simplified KYC Submission Checklist**: Restricted to taking only two mandatory documents:
   - **PAN Card** (Text number input and image file upload).
   - **Cancelled Cheque** (Bank details text input and image file upload).
   - Aadhaar card and GST options are eliminated to streamline the partner onboarding process.
4. **Partner Dashboard Statistics Overview**: Displays real-time metrics cards for:
   - *Total Leads* submitted.
   - *Approved Leads* (successful card issues).
   - *Pending Payouts* (commissions waiting to be cleared).
   - *Total Earnings* (cumulative lifetime payout).
5. **Product Marketplace Hub**: A partner-exclusive catalog displaying all active credit cards with the exact partner commission payouts (e.g. ₹2,200 on card dispatch).
6. **Share Tracking Link**: A button in the marketplace that copies a unique, referral-parameterized tracking link to the clipboard. Anyone applying through this link is credited as a lead under this partner.
7. **Direct Client Apply Form**: Allows the partner to enter customer details and submit application leads directly from their portal dashboard on behalf of their clients.
8. **Real-time Leads Tracker**: A detailed grid listing all submitted leads, showcasing the applicant's name, mobile number, applied product, bank name, current stage status, updates history, and admin remarks.
9. **Wallet Ledger**: Details the partner's wallet balance, pending approvals, and historical withdrawals.
10. **Bank Account Configurator**: Fields for setting up the partner's bank name, account number, branch, and IFSC code for electronic commission transfers.
11. **Withdrawal Request Trigger**: Allows partners to request payout of their available balance.
12. **48-Hour Audit Hold Lock**: Automatically places newly requested withdrawals on a 48-hour security auditing hold before administrative approval.
13. **Profile Settings**: Page to manage profile details, change passwords, and update security credentials.

---

## ── 3. SUPER PARTNER / TEAM NETWORK FEATURES ──

These features allow partners to build and manage their own sub-agent referral network (downlines).

1. **Sub-Partner Invitation Link**: Displays a unique referral link and referral code on the partner dashboard, which invites new agents to register under this partner's network hierarchy.
2. **Direct Sub-Partner Creation**: An inline popup modal **"Add Team Member"** that lets the Super Partner directly register a child partner by filling in their first name, last name, mobile number, email, and password.
3. **Team Grid Console**: An interactive table that tracks the Super Partner's downline organization, displaying member names, email, phone, and joining dates.
4. **Partner Code Monitor**: Displays the unique `Partner_code` for each child partner.
5. **KYC Status Visualizer**: Shows color-coded badges (Amber for Pending, Green for Approved, Red for Rejected) representing the KYC document status of each child partner.
6. **Override Payout Engine**: Links child partner transactions to the Super Partner's account, facilitating team override payouts.

---

## ── 4. ADMIN PANEL FEATURES ──

These features are designed for regional and operations managers to process applications, verify documents, and clear payouts.

1. **Admin Statistics Dashboard**: Key cards showing count of pending KYC reviews, pending withdrawal requests, active leads, and recent direct card applications.
2. **Partner Management Directory**: List of registered referral partners with sorting and searching.
3. **KYC Document Viewer**: Modal showing PAN card and Cheque images alongside entered text parameters for comparison.
4. **Partner Activation Control**: One-click buttons to **Approve Partner** (granting link-sharing and withdrawal rights) or **Reject Partner** (sending explanation comments).
5. **Client Lead Resolution Panel**: View list of customer applications submitted via partners.
6. **Bank Status Resolution**: Ability to update application status stages (e.g. Lead Created, Sent to Bank, KYC Pending, Approved, Rejected) and assign bank reference tracking numbers.
7. **Direct Lead Management Console**: View and resolve card leads submitted directly by customers on the public homepage.
8. **Lead Name-Slug Lookup**: Resolves alphanumeric product name slugs to database UUIDs during form submission, preventing database 400 Bad Request errors.
9. **Withdrawal Requests Console**: Queue of requested partner payouts.
10. **Payout Verification Checks**: Tool matching banking details with cheque files and validating if the 48-hour hold has expired before releasing funds.
11. **Withdrawal Status Update**: Approve payout (marks as paid) or reject payout (releasing the balance back to the partner's wallet).
12. **Forgot Password Link**: A reset option on the admin login page (`/admin-login`).

---

## ── 5. SUPER ADMIN PANEL FEATURES ──

These features provide system-wide configuration, database management, and operational analytics.

1. **Collapsible Accordion Sidebar**: Groups super admin pages into:
   - *USERS & ACCOUNTS*: Manage system administrators and partners.
   - *LEAD TRACKING*: Monitor portal leads and direct card leads.
   - *PRODUCTS & PARTNERS*: Manage lending partners and product catalogs.
   - *MODIFY*: Collapsible CMS and Banners settings.
   - *SYSTEM UTILITIES*: Services API, Commission Manager, Audit Logs, and Reports.
2. **Active Path Sidebar Tracker**: Automatically expands the **MODIFY** accordion menu if the user navigates to the Banners or CMS pages.
3. **Theme Status Sidebar Label**: Integrates visual "LIGHT ☀️" / "DARK 🌙" labels in the sidebar next to the logout button.
4. **Banners Slider Configurator**: Add/modify homepage marketing banners, upload slider image assets, and map target redirection page URLs.
5. **Lending Partners Manager**: Create new banks, edit bank names, and configure bank logo images.
6. **Product Catalog Builder**: Add, edit, or delete credit cards:
   - Configure basic card info (name, fee details, networks).
   - Enter card features, benefits, lounge rules, and waivers.
   - Build FAQ lists.
   - Input Terms & Conditions.
7. **Commission Manager**: Set payout commissions for each product, specifying the **Total Earning** potential, **Card Approval & Dispatch** base pay, and the active validity end dates.
8. **Homepage CMS Manager**: Live editors to customize landing page titles, category sections, customer testimonials, and translator word dictionaries.
9. **Audit Logs Ledger**: Non-editable database search grid showing time, administrator name, event type, and details of all database operations.
10. **Reports Export Engine**: Allows generating and downloading filtered CSV/Excel spreadsheets containing full transaction ledger lists, partner commission logs, and lead sheets.

---

## ── 6. MOBILE APP SHELL INTEGRATION FEATURES ──

These features govern the mobile application wrapper.

1. **Native WebView Container**: Loads the responsive web application inside a native wrapper in `/mobile`, ensuring identical functionality and design aesthetics.
2. **Hardware Back Button Interception**: Connects to the React Native `BackHandler` API to intercept back key presses on Android. Pressing the hardware back button navigates backward within the WebView page history instead of closing the application.

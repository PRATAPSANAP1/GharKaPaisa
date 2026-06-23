# GharKaPaisa — Full Project Features & Technical Report

Welcome to **GharKaPaisa**, a premium web and mobile application designed for credit card lead generation, partner commissions management, and multi-tenant administrative control.

Below is the structured technical documentation of all features implemented across every page and panel in the project, formatted in single-line bullet points, along with the integrated subscriptions.

---

## ── 1. NORMAL USER / PUBLIC PAGE FEATURES ──

1. **Brand Logo Redirection**: Clicking the company logo in the header navbar redirects the user back to the homepage.
2. **Three Role Login Buttons**: Navbar links routing users to Admin Login (`/admin-login`), Partner Login (`/login`), or Employee Login (`/admin-login`).
3. **Mode Changer (Theme Toggler)**: A header toggle switch that alternates the entire site layout between Light and Dark modes.
4. **9-Language Translator**: A localization dropdown translating the user interface into English, Hindi, Marathi, Gujarati, Bengali, Telugu, Tamil, Kannada, and Odia.
5. **CMS-Driven Slider Banners**: Marketing banner carousels displayed on the homepage that are managed dynamically from the database.
6. **Direct Banner Redirection**: Clicking a slide automatically redirects the user to its target path (e.g. LTF banner redirects to the Lifetime Free Credit Cards list).
7. **Lending Partners Grid**: Lists active lending banks (HDFC, SBI, Axis, ICICI, Kotak, Yes Bank, IDFC, Federal Bank) on the homepage.
8. **Bank-Specific Card Catalog**: Renders all cards belonging to a selected bank, showing card photos, fees, and rewards.
9. **Card Compare Drawer**: Allows side-by-side comparison of annual fees, joining charges, and key features for up to three selected cards.
10. **Card Benefits Detail Routing**: Routes the user to the dedicated benefits details page (`/card-benefits/:id`).
11. **Apply Now Header Button**: A top-navbar call-to-action button that navigates directly to the lead registration page.
12. **Universal Share API Button**: Integrates the native browser `navigator.share` API, enabling users to share card details with any mobile app.
13. **Customer OTP Verification Modal**: Validates public card applicants via SMS OTP verification before redirecting them to the official bank link.
14. **Mobile-Optimized Scroll Lock Layout**: Locks the main body screen at `100vh` and uses an internal scrollable container to emulate native apps.
15. **Compact Density UI**: Reduces page spacing, paddings, and font sizes by 30-50% to maximize readable details.
16. **Interactive Tabs Panel**: Displays card details across tabs for Special Offer, Benefits, Whom to Refer, How It Works, Training Video, FAQs, and T&C.

---

## ── 2. PARTNER PANEL FEATURES ──

1. **Dual-Method Login**: Supports partner login using credentials (email/mobile + password) or secure SMS OTP.
2. **On-Registration Password Setup**: Prompts partners to establish their account password during registration.
3. **Simplified KYC Submission**: Requires only **PAN Card** and **Cancelled Cheque** uploads, removing Aadhaar and GST fields.
4. **Partner Dashboard Statistics**: Displays summary metric cards for Total Leads, Approved Leads, Pending Payouts, and Total Earnings.
5. **Product Marketplace Hub**: A dedicated catalog showing available cards alongside the exact commission payout partners will earn.
6. **Share Tracking Link**: Copies a unique referral tracking URL to share with customers via messaging platforms.
7. **Direct Client Apply Form**: Enables partners to input customer applications directly inside their portal.
8. **Real-time Leads Tracker**: A detailed status tracking table for all client leads, displaying bank feedback and admin comments.
9. **Wallet Ledger**: Displays active balances, pending clearances, and full withdrawal transaction histories.
10. **Bank Account Configurator**: Fields to save bank name, account number, branch, and IFSC code for direct payouts.
11. **Withdrawal Request Trigger**: Allows partners to request transfer of their available wallet balance to their bank account.
12. **48-Hour Audit Hold Lock**: Places withdrawal requests on a mandatory 48-hour holds for security audit checks.
13. **Profile Settings**: Enables updating personal details and resetting account passwords.

---

## ── 3. SUPER PARTNER / TEAM NETWORK FEATURES ──

1. **Sub-Partner Invitation Link**: Provides referral links and codes to recruit child partners under the partner's account hierarchy.
2. **Direct Sub-Partner Onboarding**: An inline modal allowing partners to manually register new team members with names, mobile, and password.
3. **Team Grid Console**: An interactive table displaying downline team members, contact numbers, and registration dates.
4. **Partner Code Monitor**: Tracks the unique `Partner_code` assigned to each referred team member.
5. **KYC Status Visualizer**: Uses Amber/Green/Red badges to monitor child partners' document verification status.
6. **Override Payout Engine**: Connects team sales to the parent partner for indirect/override commission calculations.

---

## ── 4. ADMIN PANEL FEATURES ──

1. **Admin Statistics Dashboard**: Displays pending partner signups, pending withdrawals, active leads, and recent direct card submissions.
2. **Partner Management Directory**: List of registered partners with search and sort functions.
3. **KYC Document Viewer**: Screen showcasing submitted PAN and Cheque documents alongside partner details.
4. **Partner Activation Control**: Buttons to approve partners or reject them with feedback messages.
5. **Client Lead Resolution Panel**: View partner-submitted credit card applications.
6. **Bank Status Resolution**: Updates lead status (e.g. Bank Submission, Approved, Rejected) and tracks bank reference numbers.
7. **Direct Lead Management Console**: Manages and resolves applications submitted directly on the public homepage.
8. **Lead Name-Slug Lookup**: Resolves card name-slugs to database UUIDs during form submission, preventing HTTP 400 errors.
9. **Withdrawal Requests Console**: Manages payout requests submitted by partners.
10. **Payout Verification Checks**: Verifies bank details against uploaded cheques and checks the 48-hour security hold timer.
11. **Withdrawal Status Update**: Marks payouts as Approved (paid) or Rejected (refunding wallet balances).
12. **Forgot Password Link**: Link on the admin login page (`/admin-login`) to reset account passwords.

---

## ── 5. SUPER ADMIN PANEL FEATURES ──

1. **Collapsible Accordion Sidebar**: Groups pages into Users, Lead Tracking, Products, Modify CMS, and System Utilities.
2. **Active Path Sidebar Tracker**: Automatically expands the sidebar's **MODIFY** section if CMS or Banner pages are active.
3. **Theme Status Sidebar Label**: Displays the current toggle state ("LIGHT ☀️" / "DARK 🌙") inside the sidebar.
4. **Banners Slider Configurator**: Create and manage homepage marketing banners, image assets, and redirection slugs.
5. **Lending Partners Manager**: Creates banks, updates details, and manages active bank logo images.
6. **Product Catalog Builder**: Configures card fees, rewards, lounges, FAQ lists, and terms and conditions.
7. **Commission Manager**: Set card payout amounts (Total Earning vs Base Pay) and display active promotional end dates.
8. **Homepage CMS Manager**: Modifies titles, text sections, testimonials, and translator word dictionaries dynamically.
9. **Audit Logs Ledger**: Non-editable database search grid tracking all administrator actions.
10. **Reports Export Engine**: Generates CSV/Excel files for leads, partner wallets, and transaction histories.

---

## ── 6. MOBILE APP SHELL INTEGRATION FEATURES ──

1. **Native WebView Container**: Renders the responsive web app within a mobile app frame.
2. **Hardware Back Button Interception**: Connects React Native's `BackHandler` API to handle back-navigation history within the WebView.

---

## ── 7. EXTERNAL SUBSCRIPTIONS & SERVICES USED ──

Below is the list of third-party service subscriptions and integrations configured in the project:

1. **MSG91 Subscription**: Gateway service for sending SMS OTPs and verifying user authenticity (mobile login, lead verification).
2. **AWS S3 (Amazon Simple Storage Service)**: Secure cloud bucket storage for KYC document images, PAN cards, cancelled cheques, and marketing banners.
3. **AWS SES (Amazon Simple Email Service) / Nodemailer**: Cloud email subscription used to send automated partner welcome messages and registration notifications.
4. **PostgreSQL Database Server**: Relational database subscription utilized for system-wide tables, partner directories, transaction logs, and audit ledgers.

---

## ── 8. UPCOMING ROADMAP / NEXT FEATURES ──

Below are the features planned for development and integration in the next phase of the project:

1. **Travel Bookings Modules**: Custom integrations allowing users to book buses, trains, and hotels directly within the platform.
2. **Customer CRM Portal**: A complete partner-side CRM dashboard to trace client leads, schedule follow-ups, and send lead alerts.
3. **Document Vault Service**: A secure cloud-storage library allowing referral partners to store and retrieve client KYC documentation.
4. **Training Academy Platform**: An interactive educational portal featuring training video guides, partner exams, and compliance courses.
5. **Marketing Center Hub**: Custom banners creator, ready-to-share landing templates, and personalized social media post generators.
6. **Integrated Support Ticketing**: A central hub in the partner layout allowing partners to raise help tickets and chat live with admins.
7. **Credit Card API Integrations**: Deep direct-integrations with banking API gateways to check application statuses in real-time.

# GharKaPaisa - Enterprise Architecture & Software Design Specification

This document provides the definitive, reverse-engineered technical architecture and system design specification for the **GharKaPaisa** fintech platform.

---

## 1. System Overview & Technology Stack

GharKaPaisa is an enterprise-grade fintech platform designed for credit card lead attribution, loan applications, and multi-tier sub-partner commission settlements. The system is split into three main parts:

```mermaid
graph TB
    subgraph Client Applications
        Web["React 19 SPA (Vite)<br/>(gharkapaisa.in)"]
        Mobile["React Native Expo Shell<br/>(WebView Wrapper)"]
    end
    
    subgraph Proxy & Gateway
        Nginx["Nginx Reverse Proxy<br/>(SSL Offloading)"]
    end
    
    subgraph Express.js Server
        Router["Express Route Mappers"]
        AuthMid["JWT & RBAC Middleware"]
        Controllers["Feature Modules"]
    end
    
    subgraph Storage & Cloud Services
        Postgres[(PostgreSQL DB)]
        S3[(AWS S3 Storage)]
        MSG91[MSG91 SMS API]
        SES[AWS SES SMTP]
    end

    Mobile -->|Hosts WebView| Web
    Web -->|HTTPS / SSE Stream| Nginx
    Nginx -->|Reverse Proxy| Router
    Router --> AuthMid
    AuthMid --> Controllers
    Controllers --> Postgres
    Controllers --> S3
    Controllers --> MSG91
    Controllers --> SES
```

### Core Technologies
*   **Web Client**: React 19.2.6, Vite 8.0.12, Zustand 5.0.14 (state management), i18next 26.3.1 (multi-language), and Vanilla CSS variables.
*   **Backend Server**: Node.js, Express 4.18.2, pg 8.11.3 (Postgres pool), jsonwebtoken 9.0.3, and bcryptjs 3.0.3.
*   **Mobile Client**: Expo 54.0.33 / React Native 0.81.5 hosting a fullscreen `react-native-webview` component pointing to the responsive web portal.
*   **Cloud Integrations**: AWS S3 (documents, images, videos), AWS SES (transactional emails), and MSG91 (SMS OTPs).

---

## 2. C4 Model Specification

### Level 1: System Context Diagram
Shows how the system interacts with partners, customers, admins, and cloud providers.

```mermaid
graph TB
    subgraph GharKaPaisa Boundary
        Platform["Platform System Engine"]
    end

    Partner["Partner User<br/>(Lead Submissions)"]
    Customer["End Customer<br/>(Applies for Cards)"]
    Admin["System Administrator<br/>(KYC & Wallet Audits)"]

    MSG91["MSG91 Gateway<br/>(OTP Verification)"]
    SES["AWS SES Service<br/>(Transactional Email)"]
    S3["AWS S3 Bucket<br/>(Document Storage)"]

    Partner -->|Tracks earnings, updates profile| Platform
    Customer -->|Fills financial application| Platform
    Admin -->|Approves KYC, settles payouts| Platform

    Platform -->|Sends OTP SMS| MSG91
    Platform -->|Sends transactional email| SES
    Platform -->|Stores KYC video & docs| S3
```

### Level 2: Container Diagram
Details the runtime containers, protocols, and data pathways.

```mermaid
graph LR
    subgraph Client Layer
        Web["Web Portal<br/>(React 19 SPA)"]
        Mobile["Mobile App<br/>(WebView container)"]
    end

    subgraph Server Layer
        Nginx["Nginx Proxy<br/>(Port 443 -> Port 5000)"]
        Express["Express.js Server<br/>(Node.js Cluster)"]
    end

    subgraph Data Layer
        Postgres[(PostgreSQL RDS)]
        S3Bucket[(AWS S3 Bucket)]
    end

    Mobile -->|WebView Mount| Web
    Web -->|HTTPS REST API / SSE stream| Nginx
    Nginx -->|Proxy pass| Express
    Express -->|Connection Pool| Postgres
    Express -->|Secure AWS SDK| S3Bucket
```

### Level 3: Component Diagram
Illustrates the internal controllers, services, and middleware layers within the backend container.

```mermaid
graph TB
    subgraph Express.js Server Component Map
        Router["Express Router<br/>(routes/index.js)"]
        
        subgraph Middleware Pipeline
            CORS["CORS Filter<br/>(with Loopback Whitelist)"]
            AuthMid["JWT Verification<br/>(with SSE query token fallback)"]
            Validator["Input Schema Validator"]
        end

        subgraph Core Modules
            AuthCtrl["Auth Module"]
            KYCCtrl["KYC Module"]
            WalletCtrl["Wallet Module"]
            CRMCtrl["CRM Module"]
            LinkCtrl["Link Redirector"]
        end

        subgraph Infrastructure Services
            DB["pg Pool Client"]
            S3Service["S3 Presigner"]
            Mailer["SES SMTP Client"]
            cron["Hourly Cron Job"]
        end
    end

    Router --> CORS
    CORS --> AuthMid
    AuthMid --> Validator
    Validator --> AuthCtrl & KYCCtrl & WalletCtrl & CRMCtrl & LinkCtrl

    AuthCtrl --> DB
    KYCCtrl --> S3Service
    WalletCtrl --> DB
    cron --> WalletCtrl
```

---

## 3. Database Schema (ERD)

The relational database is built on **PostgreSQL**. All enum alterations are executed idempotently by querying the `pg_enum` and `pg_type` catalogs before modifying types.

```mermaid
erDiagram
    users {
        uuid id PK
        varchar email UK
        varchar mobile UK
        varchar password_hash
        user_role role
        user_status status
        boolean email_verified
        boolean mobile_verified
        boolean must_change_password
        timestamptz last_login
        timestamptz created_at
        timestamptz updated_at
    }

    partner_profiles {
        uuid id PK
        uuid user_id FK
        varchar partner_code UK
        uuid parent_partner_id FK
        integer referral_level
        integer referral_count
        kyc_status kyc_status
        varchar first_name
        varchar last_name
        varchar company_name
        varchar company_type
        varchar gst_number
        text business_location
        text current_address
        varchar pincode
        uuid approved_by FK
        timestamptz approved_at
        text rejection_reason
        timestamptz created_at
        timestamptz updated_at
    }

    partner_bank_details {
        uuid id PK
        uuid partner_id FK
        varchar bank_name
        varchar account_holder_name
        varchar account_number_encrypted
        varchar ifsc_code
        varchar branch_name
        varchar cancelled_cheque_url
        boolean is_verified
        uuid verified_by FK
        timestamptz verified_at
        timestamptz created_at
    }

    kyc_documents {
        uuid id PK
        uuid partner_id FK
        varchar doc_type
        varchar s3_key
        varchar file_url
        boolean verified
        uuid verified_by FK
        timestamptz verified_at
        text rejection_reason
        timestamptz uploaded_at
    }

    wallets {
        uuid id PK
        uuid partner_id FK
        decimal total_earned
        decimal hold_balance
        decimal available_balance
        decimal withdrawn_balance
        decimal pending_withdrawal
        timestamptz last_transaction_at
        timestamptz created_at
    }

    wallet_transactions {
        uuid id PK
        uuid wallet_id FK
        uuid application_id FK
        varchar transaction_type
        decimal amount
        decimal gst
        decimal tds
        decimal net_amount
        decimal balance_before
        decimal balance_after
        timestamptz hold_until
        timestamptz release_at
        varchar status
        text remarks
        timestamptz created_at
    }

    withdrawal_requests {
        uuid id PK
        uuid partner_id FK
        uuid wallet_id FK
        decimal amount
        varchar status
        varchar utr_number
        uuid approved_by FK
        timestamptz approved_at
        text rejection_reason
        timestamptz created_at
    }

    products {
        uuid id PK
        uuid bank_id FK
        product_category category
        varchar name
        text description
        varchar commission_type
        decimal commission_value
        decimal minimum_income
        decimal interest_rate
        varchar processing_fee
        text eligibility
        boolean is_active
        timestamptz created_at
    }

    banks {
        uuid id PK
        varchar name UK
        varchar short_code UK
        varchar logo_url
        varchar website
        varchar support_email
        boolean is_active
    }

    users ||--|| partner_profiles : "owns profile"
    users ||--|| wallets : "owns wallet"
    partner_profiles ||--o| partner_bank_details : "has bank details"
    partner_profiles ||--o{ kyc_documents : "has documents"
    wallets ||--o{ wallet_transactions : "has transactions"
    partner_profiles ||--o{ withdrawal_requests : "requests withdrawals"
    banks ||--o{ products : "manages"
```

### Compatibility Views
To bridge legacy code column references with the enterprise schema, the migrations register database views:
*   **`referral_tree`**: Mapped directly to `partner_team_relationships` (`SELECT id, parent_partner_id, child_partner_id, level, created_at AS joined_at`).
*   **`cms_sections`**: Mapped directly to `homepage_sections` (`SELECT id, key AS section_key, title, items AS content, is_active, updated_at`).

---

## 4. Wallet Ledger & Multi-Tier Commission Flow

```mermaid
graph TD
    LeadApproval["Lead Status set to Approved"] --> CommCalc["Commission Calculation Engine"]
    
    CommCalc -->|Direct Split 80%| DirectComm["Calculate direct commission"]
    CommCalc -->|Override Split 10%| OverrideComm["Query parent partner ID & calculate override"]
    CommCalc -->|Platform Fee 10%| PlatformFee["Retain platform margin"]
    
    DirectComm --> DBHoldCredit["Update child wallet: credit hold_balance"]
    OverrideComm --> DBHoldParent["Update parent wallet: credit hold_balance"]
    
    DBHoldCredit & DBHoldParent --> DBTxn["Insert wallet_transactions log (status: pending, release_at: +48h)"]
    
    cron["Hourly cron release job"] -->|Queries releases| DBTxn
    cron -->|Executes transaction release| DBRelease["Update wallet: debit hold_balance, credit available_balance"]
    DBRelease --> DBTxnUpdate["Update wallet_transactions status: processed"]
    
    withdraw["Partner Request Withdrawal (amount Y)"] --> checkBalance{"Is Y <= available_balance?"}
    checkBalance -->|No| error["Return insufficient funds error"]
    checkBalance -->|Yes| lockBalance["Deduct available_balance, increment withdrawn_balance, set status to pending"]
    
    payout["Super Admin approves withdrawal (Submits UTR)"] --> settle["Insert partner_settlements payout log & update status: completed"]
```

### TDS & GST Deductions
During withdrawal settlements:
*   **TDS (Tax Deducted at Source)**: 5% is deducted from the withdrawal amount if the partner lacks a corporate registration, or as configured.
*   **GST**: Deducted/applied dynamically depending on corporate GST availability.
*   **Net Settlement**: Net amount is calculated as `Gross - TDS - GST` and logged into the double-entry transaction record.

---

## 5. Sequence Flows

### A. Authentication & Session Security (JWT Rotation)
Browser-native `EventSource` connections cannot transmit headers. The standard resolution is passing the token as a query string parameter (`?token=...`) and letting the auth middleware verify it.

```mermaid
sequenceDiagram
    actor User as User Browser
    participant API as Express Gateway
    participant DB as PostgreSQL
    
    User->>API: POST /api/v1/auth/login
    API->>DB: Query user by credential
    DB-->>API: Match verified (Status: active)
    API->>API: Sign Access Token (15m) & Refresh Token (30d)
    API-->>User: Return Access Token (Set Refresh in HttpOnly Cookie)
    
    Note over User, API: Access Token expires
    User->>API: GET /api/v1/wallet/balance (Expired Token)
    API-->>User: HTTP 401 Unauthorized
    
    Note over User: Interceptor catches 401
    User->>API: POST /api/v1/auth/refresh (Sends Cookie)
    API->>API: Validate Refresh & Rotate both
    API-->>User: Return new Access Token
    User->>API: Retry failed GET /api/v1/wallet/balance (With new Token)
    API-->>User: HTTP 200 OK (Balance Payload)
```

### B. Real-Time Notification Stream (SSE)
```mermaid
sequenceDiagram
    participant FE as React Header (eventSource)
    participant API as Notification Controller
    participant DB as PostgreSQL DB

    FE->>API: GET /api/v1/notifications/stream?token=jwt_token
    Note over API: Extracts JWT token from query string fallback
    API->>API: Verify token signature
    API-->>FE: Establish persistent HTTP 200 connection (text/event-stream)
    
    Note over API: System trigger (e.g. Lead Approved)
    API->>DB: INSERT into notifications table
    API-->>FE: Push notification payload: { type: 'notification', data: {...} }
    FE->>FE: Update notifications dropdown count in Navbar
```

---

## 6. Security Analysis & Controls

1.  **JWT Authentication & Custom Guards**: Implements route-level role checkers (e.g. `authorize('ADMIN', 'SUPER_ADMIN')` and ownership locks `selfOrAdmin('PartnerId')`).
2.  **CORS Loopback Whitelist**: Configured to whitelist production domains while dynamically matching loopback addresses (`localhost` and `127.0.0.1`) on *any* port. This supports local developer test suites and WebView clients without exposing the API server to wildcard CORS hazards.
3.  **Bank Detail Encryption**: Sensitive banking information is run through AES-256-CBC encryption algorithms (`encrypt`/`decrypt` helpers) before writing database values, protecting user details in the database.
4.  **SQL Protection**: Database requests are executed via parameterized queries in the connection pool (`query('SELECT ... WHERE id = $1', [id])`) preventing SQL injection exploits.

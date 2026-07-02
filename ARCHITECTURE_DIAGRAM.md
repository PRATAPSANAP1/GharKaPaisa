# GharKaPaisa Architecture Diagram

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Mobile[Mobile App<br/>React Native/Expo<br/>WebView Wrapper]
        Web[Web Frontend<br/>React 19 + Vite]
    end
    
    subgraph "API Gateway"
        API[Express.js API Server<br/>Port 5000]
        Security[Security Middleware<br/>Helmet, CORS, Rate Limiting]
    end
    
    subgraph "Backend Services"
        Auth[Auth Module<br/>JWT + Refresh Tokens]
        Partner[Partner Module<br/>Dashboard, KYC, Wallet]
        Admin[Admin Module<br/>User Management]
        SuperAdmin[Super Admin Module<br/>CMS, Audit Logs]
        Products[Products Module<br/>Cards, Loans, Insurance]
        CRM[CRM Module<br/>Lead Management]
        Wallet[Wallet Module<br/>Commissions, Withdrawals]
        Reports[Reports Module<br/>Analytics]
        CMS[CMS Module<br/>Banners, Content]
        Banks[Banks Module<br/>Lending Partners]
        Notifications[Notifications Module<br/>Alerts]
    end
    
    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL Database)]
        S3[(AWS S3<br/>File Storage)]
    end
    
    subgraph "External Services"
        MSG91[MSG91<br/>SMS/OTP Gateway]
        SES[AWS SES<br/>Email Service]
    end
    
    Mobile -->|HTTP/HTTPS| API
    Web -->|HTTP/HTTPS| API
    API --> Security
    Security --> Auth
    Security --> Partner
    Security --> Admin
    Security --> SuperAdmin
    Security --> Products
    Security --> CRM
    Security --> Wallet
    Security --> Reports
    Security --> CMS
    Security --> Banks
    Security --> Notifications
    
    Auth --> PostgreSQL
    Partner --> PostgreSQL
    Admin --> PostgreSQL
    SuperAdmin --> PostgreSQL
    Products --> PostgreSQL
    CRM --> PostgreSQL
    Wallet --> PostgreSQL
    Reports --> PostgreSQL
    CMS --> PostgreSQL
    Banks --> PostgreSQL
    Notifications --> PostgreSQL
    
    Partner --> S3
    Admin --> S3
    SuperAdmin --> S3
    
    Auth --> MSG91
    Auth --> SES
    Notifications --> MSG91
    Notifications --> SES
```

## Frontend Architecture

```mermaid
graph TB
    subgraph "React Frontend"
        App[App.jsx<br/>Root Component]
        Router[React Router<br/>AppRoutes.jsx]
        Theme[ThemeProvider<br/>Dark/Light Mode]
        I18n[i18next<br/>9-Language Support]
        
        subgraph "Layouts"
            PublicLayout[PublicLayout]
            PartnerLayout[PartnerLayout]
            AdminLayout[AdminLayout]
            SuperAdminLayout[SuperAdminLayout]
        end
        
        subgraph "Feature Modules"
            Home[Home Module<br/>Public Pages]
            Auth[Authentication<br/>Login/Register]
            PartnerModule[Partner Module<br/>Dashboard, Leads, Wallet]
            AdminModule[Admin Module<br/>Management]
            SuperAdminModule[Super Admin Module<br/>CMS, Settings]
            Products[Products Module<br/>Card Details, Apply Form]
            CMSModule[CMS Module<br/>Services Pages]
        end
        
        subgraph "Shared Components"
            Loader[GkpLoader]
            Navbar[Navbar]
            ThemeSwitcher[ThemeSwitcher]
            LanguageSwitcher[LanguageSwitcher]
            Icons[PartnerIcons]
        end
        
        subgraph "State Management"
            Zustand[Zustand Store<br/>Auth State]
            Context[ThemeContext]
        end
        
        subgraph "API Layer"
            Axios[Axios Instance<br/>api.js]
            Interceptors[Request/Response<br/>Interceptors]
            TokenRefresh[Auto Token Refresh]
            Services[API Services<br/>auth.api.js, partner.api.js]
        end
    end
    
    App --> Router
    App --> Theme
    App --> I18n
    Router --> PublicLayout
    Router --> PartnerLayout
    Router --> AdminLayout
    Router --> SuperAdminLayout
    PublicLayout --> Home
    PublicLayout --> Auth
    PublicLayout --> Products
    PartnerLayout --> PartnerModule
    AdminLayout --> AdminModule
    SuperAdminLayout --> SuperAdminModule
    PartnerModule --> Zustand
    AuthModule --> Zustand
    Zustand --> Axios
    Axios --> Interceptors
    Interceptors --> TokenRefresh
    TokenRefresh --> Services
    Theme --> Context
```

## Backend Architecture

```mermaid
graph TB
    subgraph "Express.js Server"
        Server[server.js<br/>Entry Point]
        
        subgraph "Middleware"
            Security[Security Middleware<br/>Helmet, CORS, XSS Clean]
            RateLimit[Rate Limiting]
            BodyParser[Body Parser<br/>JSON, URL-encoded]
            Sanitizer[Data Sanitizer<br/>Mongo Sanitize]
            Logger[Morgan Logger<br/>Winston]
            Error[Error Handler]
        end
        
        subgraph "Routes"
            APIRouter[/api/v1 Router]
            AuthRoute[/auth Routes]
            PartnerRoute[/Partners Routes]
            AdminRoute[/admin Routes]
            SuperAdminRoute[/superadmin Routes]
            ProductRoute[/products Routes]
            WalletRoute[/wallet Routes]
            CRMRoute[/leads, applications Routes]
            CMSRoute[/cms, services Routes]
        end
        
        subgraph "Controllers"
            AuthController[Auth Controller]
            PartnerController[Partner Controller]
            AdminController[Admin Controller]
            SuperAdminController[Super Admin Controller]
            ProductController[Product Controller]
            WalletController[Wallet Controller]
            CRMController[CRM Controller]
            CMSController[CMS Controller]
        end
        
        subgraph "Services"
            AuthService[Auth Service]
            PartnerService[Partner Service]
            WalletService[Wallet Service]
            CommissionService[Commission Service]
            KYCService[KYC Service]
            NotificationService[Notification Service]
            ReportService[Report Service]
        end
        
        subgraph "Database Layer"
            DBConfig[Database Config<br/>Connection Pool]
            Migrations[Migrations]
            Seeders[Seeders]
            Procedures[Stored Procedures]
            Triggers[Triggers]
            Views[Views]
        end
        
        subgraph "Scheduled Jobs"
            CommissionJob[Commission Release Job]
            ReportJob[Report Generation Job]
        end
    end
    
    Server --> Security
    Security --> RateLimit
    RateLimit --> BodyParser
    BodyParser --> Sanitizer
    Sanitizer --> Logger
    Logger --> APIRouter
    APIRouter --> AuthRoute
    APIRouter --> PartnerRoute
    APIRouter --> AdminRoute
    APIRouter --> SuperAdminRoute
    APIRouter --> ProductRoute
    APIRouter --> WalletRoute
    APIRouter --> CRMRoute
    APIRouter --> CMSRoute
    
    AuthRoute --> AuthController
    PartnerRoute --> PartnerController
    AdminRoute --> AdminController
    SuperAdminRoute --> SuperAdminController
    ProductRoute --> ProductController
    WalletRoute --> WalletController
    CRMRoute --> CRMController
    CMSRoute --> CMSController
    
    AuthController --> AuthService
    PartnerController --> PartnerService
    WalletController --> WalletService
    WalletController --> CommissionService
    PartnerController --> KYCService
    SuperAdminController --> NotificationService
    AdminController --> ReportService
    
    AuthService --> DBConfig
    PartnerService --> DBConfig
    WalletService --> DBConfig
    CommissionService --> DBConfig
    KYCService --> DBConfig
    NotificationService --> DBConfig
    ReportService --> DBConfig
    
    DBConfig --> Migrations
    DBConfig --> Seeders
    DBConfig --> Procedures
    DBConfig --> Triggers
    DBConfig --> Views
    
    Server --> CommissionJob
    Server --> ReportJob
    CommissionJob --> DBConfig
    ReportJob --> DBConfig
    
    Error --> Server
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as React Frontend
    participant API as Express API
    participant Auth as Auth Service
    participant DB as PostgreSQL
    participant S3 as AWS S3
    participant SMS as MSG91
    
    User->>Frontend: Login Request
    Frontend->>API: POST /api/v1/auth/login
    API->>Auth: Validate Credentials
    Auth->>DB: Query User
    DB-->>Auth: User Data
    Auth->>Auth: Generate JWT + Refresh Token
    Auth-->>API: Tokens + User Data
    API-->>Frontend: Response with Tokens
    Frontend->>Frontend: Store in Zustand + Memory
    Frontend->>User: Redirect to Dashboard
    
    User->>Frontend: Upload KYC Document
    Frontend->>S3: Upload File
    S3-->>Frontend: File URL
    Frontend->>API: POST /api/v1/kyc/upload
    API->>DB: Update KYC Status
    DB-->>API: Success
    API-->>Frontend: Confirmation
    Frontend->>User: Show Success
    
    User->>Frontend: Submit Lead
    Frontend->>API: POST /api/v1/leads
    API->>DB: Create Lead Record
    DB-->>API: Lead ID
    API->>SMS: Send OTP to Customer
    SMS-->>API: Sent
    API-->>Frontend: Lead Created
    Frontend->>User: Show Success
    
    Note over API,DB: Scheduled Job Runs
    API->>DB: Check Matured Commissions
    DB-->>API: Matured Commissions
    API->>DB: Update Wallet Balances
    API->>SMS: Send Commission Alert
```

## User Role & Access Control

```mermaid
graph TB
    subgraph "Public Access"
        Public[Public Users]
        Home[Homepage<br/>Card Browsing]
        Compare[Card Comparison]
        Apply[Lead Generation<br/>OTP Verification]
    end
    
    subgraph "Partner Portal"
        Partner[Partners]
        Dashboard[Partner Dashboard<br/>Earnings, Stats]
        Products[Product Marketplace<br/>Cards, Loans]
        Leads[Lead Management<br/>Status Tracking]
        Wallet[Wallet & Earnings<br/>Withdrawals]
        KYC[KYC Center<br/>Document Upload]
        Referral[Referral Network<br/>Team Tree]
        Profile[Profile Hub<br/>Settings]
    end
    
    subgraph "Admin Portal"
        Admin[Admins]
        AdminDashboard[Admin Dashboard<br/>Statistics]
        Partners[Partner Management<br/>Approvals]
        Applications[Application Resolution<br/>Bank Status]
        Withdrawals[Withdrawal Requests<br/>Payouts]
    end
    
    subgraph "Super Admin Portal"
        SuperAdmin[Super Admins]
        SuperDashboard[Super Admin Dashboard<br/>Overview]
        CMS[CMS Management<br/>Banners, Content]
        ProductsMgmt[Product Catalog<br/>Cards, Banks]
        Commissions[Commission Settings<br/>Payout Rules]
        Audit[Audit Logs<br/>Activity Tracking]
        System[System Settings<br/>Services, Config]
    end
    
    Public --> Home
    Public --> Compare
    Public --> Apply
    
    Partner --> Dashboard
    Partner --> Products
    Partner --> Leads
    Partner --> Wallet
    Partner --> KYC
    Partner --> Referral
    Partner --> Profile
    
    Admin --> AdminDashboard
    Admin --> Partners
    Admin --> Applications
    Admin --> Withdrawals
    
    SuperAdmin --> SuperDashboard
    SuperAdmin --> CMS
    SuperAdmin --> ProductsMgmt
    SuperAdmin --> Commissions
    SuperAdmin --> Audit
    SuperAdmin --> System
```

## Technology Stack Summary

### Frontend
- **Framework**: React 19.2.6 with Vite 8.0.12
- **Routing**: React Router DOM 7.17.0
- **State Management**: Zustand 5.0.14
- **HTTP Client**: Axios 1.17.0 with interceptors
- **Internationalization**: i18next 26.3.1 (9 languages)
- **Charts**: Recharts 3.8.1
- **Icons**: React Icons 5.4.0
- **Security**: React Google reCAPTCHA 3.1.0

### Backend
- **Runtime**: Node.js with Express 4.18.2
- **Database**: PostgreSQL 8.11.3 (pg driver)
- **Authentication**: JWT 9.0.3 + bcrypt 6.0.0
- **File Upload**: Multer 1.4.5-lts.1 with AWS S3
- **Security**: Helmet 7.1.0, CORS 2.8.5, express-rate-limit 7.1.5
- **Validation**: express-validator 7.3.2
- **Logging**: Winston 3.11.0 + Morgan 1.10.0
- **Email**: Nodemailer 6.9.7 + AWS SES
- **SMS**: Twilio 6.0.2 + MSG91
- **Scheduling**: node-cron 4.2.1
- **Date/Time**: dayjs 1.11.10

### Mobile
- **Framework**: React Native 0.81.5 with Expo 54.0.33
- **Navigation**: React Navigation 7.x
- **WebView**: react-native-webview 14.0.1
- **OTP**: @msg91comm/sendotp-react-native 2.1.0

### Infrastructure
- **Storage**: AWS S3 (documents, images, banners)
- **Email**: AWS SES / Nodemailer
- **SMS**: MSG91 / Twilio
- **Database**: PostgreSQL (relational data)

## Key Features by Module

### Authentication Module
- JWT-based authentication with refresh token rotation
- Role-based access control (PARTNER, ADMIN, SUPER_ADMIN)
- OTP verification via MSG91
- Password reset functionality
- Session management with auto-refresh

### Partner Module
- Dashboard with earnings analytics
- Lead management and tracking
- Wallet and commission system
- KYC document upload and verification
- Referral network management
- Profile and settings

### Admin Module
- Partner approval workflow
- Application status management
- Withdrawal request processing
- Lead resolution and tracking

### Super Admin Module
- CMS for banners and content
- Product and bank management
- Commission configuration
- Audit logging
- System settings
- Report generation

### CRM Module
- Lead generation from public site
- Customer relationship management
- Application status tracking
- Bank integration

### External Integrations
- MSG91: SMS OTP verification
- AWS S3: Secure file storage
- AWS SES: Email notifications
- PostgreSQL: Persistent data storage

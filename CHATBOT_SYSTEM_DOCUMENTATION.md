# GharKaPaisa Chatbot System - Complete Documentation

## 📊 Table of Contents
1. [User Types & Flows](#user-types--flows)
2. [Process Flow Charts](#process-flow-charts)
3. [Chatbot Algorithms](#chatbot-algorithms)
4. [Page Links & Navigation](#page-links--navigation)
5. [FAQ Database](#faq-database)
6. [Role-Based Restrictions](#role-based-restrictions)
7. [API Integration](#api-integration)

---

## 👥 User Types & Flows

### 1. Public (Anonymous) User
**Access**: Homepage, Careers, Contact pages

**Flows**:
- Lead Creation Flow
- Partner Registration Flow
- Application Status Check
- General Information

**Restrictions**:
- Cannot view personal data
- Cannot access protected pages
- Limited to public information

---

### 2. Partner User
**Access**: Partner Dashboard, Applications, Wallet, Team, KYC

**Flows**:
- Add Lead Flow
- Track Applications Flow
- Wallet/Payout Flow
- Team Referral Flow
- KYC Verification Flow

**Restrictions**:
- Can only view own applications
- Can only view own wallet
- Can only view own team
- Cannot access other partners' data
- Cannot access Admin/Super Admin features

---

### 3. Admin User
**Access**: Admin Dashboard, Applications, Partners, Leads, KYC

**Flows**:
- Application Verification Flow
- Partner Management Flow
- Lead Management Flow
- KYC Verification Flow
- Operational Head Tasks

**Restrictions**:
- Can view all applications
- Can verify applications
- Cannot access Super Admin settings
- Cannot access employee management
- Cannot approve commissions

---

### 4. Super Admin User
**Access**: All panels including Super Admin Dashboard

**Flows**:
- Complete System Management
- Employee Management
- Commission Approval
- Bank/Product Management
- System Settings

**Restrictions**:
- Full access to all features
- Can manage all users
- Can approve/reject everything

---

### 5. Employee User
**Access**: Employee Dashboard, Applications, Incentives, Team

**Flows**:
- Add Lead Flow
- Track Applications Flow
- Incentive Tracking Flow
- Team View Flow
- Onboarding Flow

**Restrictions**:
- Can only view own applications
- Can only view own incentives
- Can view team based on hierarchy
- Cannot access Partner features
- Cannot access wallet withdrawal

---

## 🔄 Process Flow Charts

### Flow 1: Public User - Create New Lead

```
START
  ↓
User opens chatbot on homepage
  ↓
Bot: "Hello! How can I help you today?"
  ↓
User clicks: "I want to create a new lead"
  ↓
Bot checks: Is user logged in?
  ↓
[NO] → Bot: "To create leads, you need to be a registered Partner."
       ↓
       Bot: "Already have a Partner account?"
       ↓
       [YES] → Bot: "Login here" → Link: /login
       ↓
       [NO] → Bot: "Register as Partner" → Link: /register
       ↓
[YES] → Bot: "Great! I can help you create a lead."
       ↓
       Bot: "Which product category?"
       ↓
       User selects: Credit Card / Loan / Insurance
       ↓
       Bot: "I'll guide you to the lead creation form."
       ↓
       Redirect: /partner/add-lead (with product pre-selected)
  ↓
END
```

---

### Flow 2: Partner User - Track Application Status

```
START
  ↓
Partner logs in, opens chatbot
  ↓
Bot: "Hello [Partner Name]! How can I help you today?"
  ↓
User: "I want to check my application status"
  ↓
Bot fetches: User's applications from backend
  ↓
Bot: "You have [X] applications in progress."
  ↓
Bot displays: List of applications with status
  ↓
User selects: Specific application
  ↓
Bot: "Application [App Number] is currently [Status]."
  ↓
Bot: "Would you like to view details?"
  ↓
[YES] → Redirect: /partner/applications (with filter)
  ↓
END
```

---

### Flow 3: Partner User - Wallet & Payouts

```
START
  ↓
Partner asks: "Check my wallet balance"
  ↓
Bot checks: User authentication (from token)
  ↓
Bot fetches: Wallet balance from backend
  ↓
Bot: "Your current withdrawable balance is ₹[Amount]"
  ↓
Bot: "Available payout: ₹[Amount]"
  ↓
Bot: "Total earnings: ₹[Amount]"
  ↓
User: "I want to withdraw"
  ↓
Bot: "You can withdraw from your Wallet page."
  ↓
Redirect: /partner/wallet
  ↓
END
```

---

### Flow 4: Admin User - Verify Application

```
START
  ↓
Admin logs in, opens chatbot
  ↓
Bot: "Hello [Admin Name]! What would you like to do?"
  ↓
User: "I need to verify applications"
  ↓
Bot: "How many pending applications need verification?"
  ↓
Bot fetches: Pending applications count from backend
  ↓
Bot: "You have [X] applications pending verification."
  ↓
Bot: "Which category?"
  ↓
User selects: Credit Cards / Loans / Insurance
  ↓
Redirect: /admin/applications (with filter)
  ↓
END
```

---

### Flow 5: Public User - Check Application Status

```
START
  ↓
User opens chatbot (not logged in)
  ↓
User: "I want to check my application status"
  ↓
Bot: "Please provide your Reference Code or Mobile Number"
  ↓
User enters: Reference Code (e.g., CAND12345)
  ↓
Bot fetches: Application status from backend
  ↓
[FOUND] → Bot: "Your application is [Status]"
         ↓
         Bot: "Interview Date: [Date]" (if applicable)
         ↓
[NOT FOUND] → Bot: "No application found with this Reference Code"
            ↓
            Bot: "Please check and try again"
  ↓
END
```

---

### Flow 6: Employee User - Add Lead

```
START
  ↓
Employee logs in, opens chatbot
  ↓
Bot: "Hello [Employee Name]! How can I help?"
  ↓
User: "I want to add a new lead"
  ↓
Bot checks: Employee has active product links?
  ↓
[NO] → Bot: "You don't have active product links assigned."
       ↓
       Bot: "Please contact your Manager or HR."
       ↓
[YES] → Bot: "Which product would you like to create a lead for?"
       ↓
       Bot displays: Assigned products (SBI, HDFC, etc.)
       ↓
       User selects: Product
       ↓
       Bot: "I'll take you to the lead creation form."
       ↓
       Redirect: /employee/add-lead (with product pre-selected)
  ↓
END
```

---

## 🧠 Chatbot Algorithms

### Algorithm 1: User Detection & Role Identification

```python
FUNCTION detectUserRole(request):
    token = getAuthToken(request)
    
    IF token exists:
        user = decodeToken(token)
        RETURN user.role  # PARTNER, ADMIN, SUPER_ADMIN, EMPLOYEE
    ELSE:
        RETURN 'PUBLIC'  # Anonymous user
```

---

### Algorithm 2: Intent Detection with Context

```python
FUNCTION detectIntent(message, userRole, context):
    message_lower = message.lower()
    
    # Role-specific intents
    IF userRole == 'PARTNER':
        IF 'lead' in message_lower OR 'create' in message_lower:
            RETURN 'partner_create_lead'
        IF 'application' in message_lower OR 'status' in message_lower:
            RETURN 'partner_check_application'
        IF 'wallet' in message_lower OR 'payout' in message_lower:
            RETURN 'partner_wallet'
        IF 'team' in message_lower OR 'referral' in message_lower:
            RETURN 'partner_team'
    
    ELSE IF userRole == 'ADMIN':
        IF 'verify' in message_lower OR 'application' in message_lower:
            RETURN 'admin_verify_application'
        IF 'partner' in message_lower:
            RETURN 'admin_manage_partners'
        IF 'kyc' in message_lower:
            RETURN 'admin_verify_kyc'
    
    ELSE IF userRole == 'SUPER_ADMIN':
        IF 'employee' in message_lower:
            RETURN 'superadmin_manage_employees'
        IF 'commission' in message_lower:
            RETURN 'superadmin_commission'
        IF 'bank' in message_lower OR 'product' in message_lower:
            RETURN 'superadmin_manage_products'
    
    ELSE IF userRole == 'EMPLOYEE':
        IF 'lead' in message_lower OR 'create' in message_lower:
            RETURN 'employee_create_lead'
        IF 'incentive' in message_lower OR 'earning' in message_lower:
            RETURN 'employee_incentive'
        IF 'team' in message_lower:
            RETURN 'employee_team'
    
    ELSE:  # PUBLIC
        IF 'lead' in message_lower OR 'create' in message_lower:
            RETURN 'public_create_lead'
        IF 'partner' in message_lower OR 'register' in message_lower:
            RETURN 'public_partner_register'
        IF 'status' in message_lower OR 'application' in message_lower:
            RETURN 'public_check_status'
        IF 'card' in message_lower OR 'credit' in message_lower:
            RETURN 'public_credit_card'
        IF 'loan' in message_lower:
            RETURN 'public_loan'
    
    # Default fallback
    RETURN 'general_inquiry'
```

---

### Algorithm 3: Response Generation with Role Restrictions

```python
FUNCTION generateResponse(intent, userRole, userData):
    response = {}
    
    SWITCH intent:
        CASE 'partner_create_lead':
            IF userRole == 'PARTNER':
                response.text = "I can help you create a new lead. Which product category?"
                response.chips = [
                    { label: 'Credit Card', action: 'lead_credit_card' },
                    { label: 'Loan', action: 'lead_loan' },
                    { label: 'Insurance', action: 'lead_insurance' }
                ]
            ELSE:
                response.text = "To create leads, you need to be a registered Partner."
                response.chips = [
                    { label: 'Login', action: 'go_login' },
                    { label: 'Register', action: 'go_register' }
                ]
        
        CASE 'partner_check_application':
            IF userRole == 'PARTNER':
                applications = fetchUserApplications(userData.id)
                response.text = f"You have {len(applications)} applications in progress."
                response.chips = generateApplicationChips(applications)
            ELSE:
                response.text = "Only Partners can view their applications."
        
        CASE 'public_create_lead':
            response.text = "To create leads, you need to be a registered Partner."
            response.chips = [
                { label: 'Login (Existing Partner)', action: 'go_login' },
                { label: 'Register (New Partner)', action: 'go_register' }
            ]
        
        CASE 'public_check_status':
            response.text = "Please provide your Reference Code or Mobile Number to check your application status."
            response.chips = [
                { label: 'I have Reference Code', action: 'status_ref_code' },
                { label: 'I have Mobile Number', action: 'status_mobile' }
            ]
    
    RETURN response
```

---

### Algorithm 4: Data Fetching with Security

```python
FUNCTION fetchUserApplications(userId, userRole):
    # Security: Only fetch own data for Partners/Employees
    IF userRole == 'PARTNER':
        query = """
            SELECT * FROM applications 
            WHERE partner_id = $1
            ORDER BY created_at DESC
        """
        params = [userId]
    
    ELSE IF userRole == 'EMPLOYEE':
        query = """
            SELECT * FROM applications 
            WHERE employee_id = $1
            ORDER BY created_at DESC
        """
        params = [userId]
    
    ELSE IF userRole == 'ADMIN' OR userRole == 'SUPER_ADMIN':
        query = """
            SELECT * FROM applications 
            ORDER BY created_at DESC
            LIMIT 100
        """
        params = []
    
    RETURN executeQuery(query, params)
```

---

## 🔗 Page Links & Navigation

### Public Pages
| Page | Path | Description |
|------|------|-------------|
| Home | `/` | Homepage |
| Login | `/login` | Partner/Admin login |
| Register | `/register` | Partner registration |
| Careers | `/careers` | Career opportunities |
| Contact | `/contact` | Contact page |
| Application Status | `/careers/status` | Check application status |

### Partner Pages
| Page | Path | Description | Restriction |
|------|------|-------------|------------|
| Partner Dashboard | `/partner/dashboard` | Main dashboard | Partner only |
| Add Lead | `/partner/add-lead` | Create new lead | Partner only |
| Applications | `/partner/applications` | View applications | Own data only |
| Wallet | `/partner/wallet` | View wallet | Own data only |
| Team | `/partner/team` | View team | Own team only |
| KYC | `/partner/kyc` | KYC verification | Own data only |
| Products | `/partner/products` | View products | Partner only |
| Profile | `/partner/profile` | Profile settings | Own data only |

### Admin Pages
| Page | Path | Description | Restriction |
|------|------|-------------|------------|
| Admin Dashboard | `/admin/dashboard` | Main dashboard | Admin/Super Admin |
| Applications | `/admin/applications` | View/verify applications | Admin/Super Admin |
| Partners | `/admin/partners` | Manage partners | Admin/Super Admin |
| Leads | `/admin/leads` | Manage leads | Admin/Super Admin |
| Withdrawals | `/admin/withdrawals` | Manage withdrawals | Admin/Super Admin |
| Credit Cards | `/admin/credit-cards` | Credit card applications | Admin/Super Admin |

### Super Admin Pages
| Page | Path | Description | Restriction |
|------|------|-------------|------------|
| Super Admin Dashboard | `/super-admin/dashboard` | Main dashboard | Super Admin only |
| Employees | `/super-admin/employees` | Manage employees | Super Admin only |
| Commissions | `/super-admin/commissions` | Approve commissions | Super Admin only |
| Banks | `/super-admin/banks` | Manage banks | Super Admin only |
| Products | `/super-admin/products` | Manage products | Super Admin only |
| Settings | `/super-admin/settings` | System settings | Super Admin only |

### Employee Pages
| Page | Path | Description | Restriction |
|------|------|-------------|------------|
| Employee Dashboard | `/employee/dashboard` | Main dashboard | Employee only |
| Applications | `/employee/applications` | View applications | Own data only |
| Credit Cards | `/employee/credit-cards` | View credit cards | Employee only |
| Incentives | `/employee/incentives` | View incentives | Own data only |
| Team | `/employee/team` | View team | Hierarchy-based |
| Profile | `/employee/profile` | Profile settings | Own data only |
| KYC | `/employee/kyc` | KYC submission | Own data only |

---

## ❓ FAQ Database

### General FAQs (All Users)

**Q: What is GharKaPaisa?**
A: GharKaPaisa is a fintech platform that connects customers with financial products like credit cards, loans, and insurance through our network of partners and employees.

**Q: How do I register as a Partner?**
A: Visit our registration page, sign up with your mobile number, complete KYC verification, and start sharing product links to earn commissions.

**Q: What documents are required for KYC?**
A: You need to upload your PAN Card (front), Aadhaar Card (front & back), and a cancelled cheque with your bank account details.

**Q: How long does KYC verification take?**
A: KYC verification typically takes 1-3 business days after document submission.

**Q: What is the minimum age to become a Partner?**
A: You must be at least 18 years old to register as a Partner.

---

### Partner-Specific FAQs

**Q: How do I add a new lead?**
A: Go to the "Add Lead" section in your dashboard, fill in customer details, select the product, and submit. The application will be created automatically.

**Q: How do I track my applications?**
A: Visit the "Applications" tab in your dashboard to view all your submitted applications with their current status.

**Q: When do I receive my commission?**
A: Commissions are credited to your wallet after the application is approved and disbursed. Payouts are processed weekly.

**Q: What is the minimum withdrawal amount?**
A: The minimum withdrawal amount is ₹500.

**Q: How do I build my referral team?**
A: Share your unique referral link with others. When they register as Partners, they become your Level 1 team members, and you earn from their commissions.

**Q: Can I view my Level 2 and Level 3 team members?**
A: Yes, you can view your complete referral network in the "Team" section of your dashboard.

---

### Employee-Specific FAQs

**Q: How do I create a lead as an Employee?**
A: Use the "Add Lead" feature in your Employee Dashboard. Select the product you want to offer, fill in customer details, and submit.

**Q: What products can I promote?**
A: You can only promote products that have been assigned to you by your Manager or Super Admin. Check your Credit Cards section to see available products.

**Q: How do I check my incentives?**
A: Visit the "Incentives" tab in your dashboard to view your earned incentives, pending incentives, and payment history.

**Q: Can I view my team members?**
A: Yes, Managers and Team Leaders can view their team members in the "My Team" section based on the hierarchy assigned.

**Q: What is the process to get product links?**
A: Product links are assigned by Super Admin after your KYC is verified and your account is activated. Contact your Manager if you need links.

---

### Admin-Specific FAQs

**Q: How do I verify an application?**
A: Go to the "Applications" section, select a pending application, review the documents, and approve or reject based on the verification checklist.

**Q: What are the different application statuses?**
A: Statuses include: Submitted, Under Review, Approved, Rejected, Disbursed, and Cancelled.

**Q: Can I edit application details?**
A: Yes, you can edit application details before approval. After approval, only Super Admin can make changes.

**Q: How do I manage Partner KYC?**
A: Go to the Partners section, select a partner, and navigate to their KYC tab to review and verify documents.

---

### Super Admin-Specific FAQs

**Q: How do I activate an Employee?**
A: Go to "Employees", select the employee, and click "Activate". Ensure their KYC is verified and hierarchy is assigned before activation.

**Q: How do I assign product links to Employees?**
A: In the Employee Management section, select an employee, go to "Product Links", assign products with incentive amounts, and save.

**Q: How do I approve commissions?**
A: Go to "Commissions", review pending payouts, verify the applications, and approve for transfer to Partner wallets.

**Q: Can I manage Banks and Products?**
A: Yes, use the "Banks" and "Products" sections to add, edit, or deactivate banks and financial products.

---

### Customer-Specific FAQs

**Q: How do I apply for a credit card?**
A: You can apply through our website by selecting a card, filling in your details, and uploading required documents. The process takes 5-10 minutes.

**Q: What documents are needed for credit card application?**
A: You need PAN Card, Aadhaar Card, address proof, income proof (salary slips or ITR), and passport-size photo.

**Q: How do I check my application status?**
A: If you have a Reference Code, visit our "Check Status" page and enter your code to track your application.

**Q: What is the minimum income required for credit cards?**
A: Minimum income requirements vary by bank and card type. Generally, an annual income of ₹3-5 lakhs is required for premium cards.

**Q: How long does credit card approval take?**
A: Approval typically takes 7-15 business days depending on the bank and your profile.

---

## 🔒 Role-Based Restrictions

### Data Access Matrix

| Data Type | Public | Partner | Admin | Super Admin | Employee |
|-----------|--------|--------|-------|-------------|----------|
| Own Applications | ❌ | ✅ Own Only | ✅ All | ✅ All | ✅ Own Only |
| Own Wallet | ❌ | ✅ Own Only | ❌ | ✅ All | ❌ |
| Own Team | ❌ | ✅ Own Only | ❌ | ✅ All | ✅ Hierarchy |
| Own KYC | ❌ | ✅ Own Only | ✅ All | ✅ All | ✅ Own Only |
| All Applications | ❌ | ❌ | ✅ All | ✅ All | ❌ |
| All Partners | ❌ | ❌ | ✅ All | ✅ All | ❌ |
| All Employees | ❌ | ❌ | ❌ | ✅ All | ✅ Hierarchy |
| Commission Approvals | ❌ | ❌ | ❌ | ✅ All | ❌ |
| System Settings | ❌ | ❌ | ❌ | ✅ All | ❌ |

### API Security Rules

1. **Authentication Required**: All protected endpoints require valid JWT token
2. **Role Check**: Middleware verifies user role before data access
3. **Ownership Check**: For Partners/Employees, always verify data ownership
4. **Hierarchy Check**: For Employees, verify hierarchy access before team data
5. **Audit Logging**: All sensitive actions are logged with user ID and timestamp

### Chatbot-Specific Restrictions

- **Public Chatbot**: No authentication, limited to public information
- **Partner Chatbot**: Requires Partner role, only accesses own data
- **Admin Chatbot**: Requires Admin/Super Admin role, accesses all data
- **Employee Chatbot**: Requires Employee role, accesses own data + hierarchy team
- **Cross-Role Prevention**: Chatbot checks role before every data fetch
- **Session Isolation**: Each user session is isolated, no data leakage

---

## 🔌 API Integration

### Frontend-Backend Chatbot API Endpoints

#### Public Endpoints (No Auth)
```
POST /api/v1/chatbot/message
  Body: { message, session_id }
  Response: { message, chips, intent, confidence }

POST /api/v1/chatbot/action
  Body: { action, label, session_id }
  Response: { message, chips, redirect }

POST /api/v1/chatbot/conversation
  Body: { session_id }
  Response: { conversation data }

POST /api/v1/chatbot/reset
  Body: { session_id }
  Response: { success, conversation }

GET /api/v1/chatbot/search?keyword=
  Response: { knowledge base results }

GET /api/v1/chatbot/faq/:category
  Response: { FAQ items }
```

#### Protected Endpoints (Auth Required)
```
POST /api/v1/chatbot/feedback
  Body: { session_id, rating }
  Response: { success }

GET /api/v1/chatbot/conversation/:id
  Response: { conversation history }
```

#### Admin/Super Admin Endpoints
```
GET /api/v1/chatbot/analytics
  Query: start_date, end_date, user_role
  Response: { analytics data }

POST /api/v1/chatbot/escalate
  Body: { conversation_id, notes }
  Response: { handoff data }

GET /api/v1/chatbot/intents
  Response: { all intents }

POST /api/v1/chatbot/intents
  Body: { intent data }
  Response: { created intent }

PUT /api/v1/chatbot/intents/:id
  Body: { intent data }
  Response: { updated intent }

DELETE /api/v1/chatbot/intents/:id
  Response: { success }
```

### Session Management

**Session ID Generation**:
```javascript
// Generate unique session ID for each chat session
const sessionId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
```

**Session Storage**:
- Session ID stored in localStorage
- Session persists across page reloads
- Session expires after 24 hours of inactivity

**User Context**:
```javascript
// On chatbot open, check authentication
const user = getStoredUser(); // From auth store
const userRole = user ? user.role : 'PUBLIC';
const userId = user ? user.id : null;
```

---

## 📋 Implementation Checklist

### Phase 1: Backend ✅
- [x] Database migration
- [x] Chatbot service layer
- [x] Intent service (NLP)
- [x] Knowledge base service
- [x] Chatbot controller
- [x] Chatbot routes
- [x] Route registration

### Phase 2: Frontend - Basic
- [x] Remove emojis, add icons
- [x] Add to PublicLayout
- [x] Add to PartnerLayout
- [x] Add to AdminLayout

### Phase 3: Frontend - Advanced
- [ ] Connect to backend API
- [ ] Add session management
- [ ] Implement role-based responses
- [ ] Add to SuperAdminLayout
- [ ] Add to EmployeeLayout
- [ ] Add loading states
- [ ] Add error handling

### Phase 4: Testing
- [ ] Test all user flows
- [ ] Test role restrictions
- [ ] Test API integration
- [ ] Test error scenarios
- [ ] Test session persistence

---

## 🎯 Priority Implementation Order

1. **High Priority**: Connect frontend to backend API
2. **High Priority**: Add session management
3. **High Priority**: Implement role-based restrictions
4. **Medium Priority**: Add to remaining layouts
5. **Medium Priority**: Test all flows
6. **Low Priority**: Add advanced features (voice, file upload)

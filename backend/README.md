# FinEdge Backend API

Node.js + Express + PostgreSQL backend for the FinEdge Agent Panel.

## Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15 (AWS RDS)
- **Storage**: AWS S3 (KYC documents)
- **Auth**: JWT (access + refresh tokens)
- **OTP**: Twilio SMS
- **Logging**: Winston

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DB, AWS, Twilio credentials

# 3. Run migrations
npm run migrate

# 4. Seed initial data (banks, products, super admin)
npm run seed

# 5. Start dev server
npm run dev

# 6. Start production
npm start
```

---

## Project Structure

```
src/
├── config/
│   ├── db.js            # PostgreSQL pool
│   ├── migrate.js       # Schema migrations
│   └── seed.js          # Initial data
├── controllers/
│   ├── auth.controller.js
│   ├── agent.controller.js
│   ├── application.controller.js
│   ├── wallet.controller.js
│   ├── product.controller.js
│   ├── notification.controller.js
│   └── report.controller.js
├── middleware/
│   ├── auth.middleware.js       # JWT + RBAC
│   ├── validation.middleware.js # express-validator rules
│   └── error.middleware.js      # Global error handler
├── routes/
│   ├── index.js
│   ├── auth.routes.js
│   ├── agent.routes.js
│   └── routes.js        # app/wallet/product/notif/report
├── services/
│   ├── otp.service.js
│   ├── s3.service.js
│   ├── wallet.service.js
│   └── notification.service.js
├── utils/
│   ├── logger.js
│   ├── response.js
│   ├── helpers.js
│   └── jwt.js
└── server.js
```

---

## API Endpoints

### Base URL: `http://localhost:5000/api/v1`

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Agent self-registration | Public |
| POST | `/auth/login` | Password login | Public |
| POST | `/auth/otp/send` | Send OTP to mobile | Public |
| POST | `/auth/otp/verify` | OTP login | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/logout` | Logout (revoke token) | Bearer |
| GET  | `/auth/me` | Get current user | Bearer |

### Agents
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/agents` | List all agents | admin, super_admin |
| GET | `/agents/:id/profile` | Agent profile | self, admin |
| PUT | `/agents/:id/profile` | Update profile | self, admin |
| POST | `/agents/:id/kyc` | Upload KYC docs (multipart) | self, admin |
| GET | `/agents/:id/dashboard` | Dashboard stats | self, admin |
| PATCH | `/agents/:id/approve` | Approve/reject KYC | admin, super_admin |

**KYC Upload Fields** (multipart/form-data):
- `aadhaar` — Aadhaar card image/PDF
- `pan` — PAN card image/PDF
- `gst_cert` — GST certificate
- `cancelled_cheque` — Bank cheque
- `aadhaar_number` — text
- `pan_number` — text

### Applications
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/applications` | List applications (filtered) | all |
| GET | `/applications/:id` | Application detail | all |
| POST | `/applications` | Submit new application | agent (KYC approved) |
| PATCH | `/applications/:id/status` | Update status | admin, employee |
| POST | `/applications/:id/documents` | Upload doc | all |

**Submit Application Body:**
```json
{
  "product_id": "uuid",
  "loan_amount": 500000,
  "notes": "Optional notes",
  "customer": {
    "full_name": "Rahul Sharma",
    "mobile": "9876543210",
    "email": "rahul@example.com",
    "dob": "1990-01-15",
    "pan_number": "ABCDE1234F",
    "monthly_income": 50000,
    "employment_type": "salaried",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "employer": "TCS Ltd"
  }
}
```

**Update Status Body:**
```json
{
  "status": "approved",
  "approved_amount": 480000,
  "bank_ref_number": "HDFC202601234",
  "notes": "Approved after verification"
}
```
Status values: `submitted` → `under_review` → `approved` / `rejected` / `disbursed`

### Wallet
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/wallet/:agentId` | Wallet summary | self, admin |
| GET | `/wallet/:agentId/transactions` | Statement | self, admin |
| GET | `/wallet/:agentId/case-summary` | Per-product stats | self, admin |
| POST | `/wallet/:agentId/withdraw` | Request withdrawal | self (KYC approved) |
| GET | `/wallet/withdrawals` | All pending withdrawals | admin, super_admin |
| PATCH | `/wallet/withdrawals/:id/process` | Approve/reject | super_admin |

**Withdrawal Body:**
```json
{ "amount": 5000 }
```

**Process Withdrawal Body:**
```json
{
  "approved": true,
  "utr_number": "UTR123456789",
  "rejection_reason": null
}
```

### Products
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/products` | List products | all |
| GET | `/products/categories` | Grouped by category | all |
| GET | `/products/:id` | Product detail | all |
| POST | `/products` | Create product | admin, super_admin |
| PUT | `/products/:id` | Update product | admin, super_admin |
| POST | `/products/commission` | Set commission structure | super_admin |
| GET | `/banks` | List banks | all |

**Query Params for /products:**
- `category` — credit_card, personal_loan, home_loan, etc.
- `bank_id` — filter by bank
- `is_active` — true/false
- `search` — search by name
- `page`, `limit`

### Notifications
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/notifications` | List (supports `?unread_only=true`) | all |
| PATCH | `/notifications/:id/read` | Mark one read | all |
| PATCH | `/notifications/read-all` | Mark all read | all |

### Reports (Admin/Super Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/overview` | KPIs — apps, agents, wallet totals |
| GET | `/reports/applications-by-product` | Per-product breakdown |
| GET | `/reports/top-agents` | Top earning agents |
| GET | `/reports/monthly-trend` | Last 12 months chart data |

---

## Response Format

**Success:**
```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "timestamp": "2026-06-12T10:00:00Z"
}
```

**Paginated:**
```json
{
  "success": true,
  "data": [...],
  "pagination": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "mobile", "message": "Valid 10-digit mobile required" }]
}
```

---

## Role Permissions Summary

| Feature | Agent | Employee | Admin | Super Admin |
|---------|-------|----------|-------|-------------|
| Register | ✅ | — | — | — |
| Submit Application | ✅ (KYC approved) | ✅ | ✅ | ✅ |
| Update App Status | ❌ | ✅ | ✅ | ✅ |
| View Own Wallet | ✅ | ❌ | ✅ | ✅ |
| Request Withdrawal | ✅ | ❌ | ❌ | ✅ |
| Approve Withdrawal | ❌ | ❌ | ❌ | ✅ |
| Manage Agents | ❌ | ❌ | ✅ | ✅ |
| Manage Products | ❌ | ❌ | ✅ | ✅ |
| Set Commission | ❌ | ❌ | ❌ | ✅ |
| Reports | ❌ | ❌ | ✅ | ✅ |

---

## Deployment (AWS EC2)

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone & setup
git clone https://github.com/your-org/finedge-backend.git
cd finedge-backend
npm install --production

# Setup PM2
npm install -g pm2
pm2 start src/server.js --name finedge-api
pm2 startup && pm2 save

# Nginx reverse proxy (port 5000 → 80/443)
# Add SSL via Certbot
```

---

## Environment Variables Reference

See `.env.example` for all required variables.

**Required for production:**
- `DB_*` — RDS PostgreSQL connection
- `JWT_SECRET` — Min 32 chars, cryptographically random
- `AWS_*` — S3 bucket for KYC documents
- `TWILIO_*` — OTP delivery
- `FRONTEND_URL` — CORS origin whitelist

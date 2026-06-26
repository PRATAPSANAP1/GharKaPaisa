# GharKaPaisa Backend API

Node.js + Express + PostgreSQL backend for the GharKaPaisa partner platform (credit card lead generation, commissions, and admin control).

## Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Storage**: AWS S3 (KYC documents, banners)
- **Auth**: JWT access tokens + httpOnly refresh cookies
- **OTP**: MSG91 SMS
- **Email**: AWS SES / Nodemailer
- **Logging**: Winston

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with DB, AWS, MSG91, JWT secrets

# 3. Run migrations (creates schema + optional super-admin seed)
npm run migrate

# 4. Seed banks & products
npm run seed

# 5. Start dev server
npm run dev

# 6. Start production
npm start
```

### Super admin seeding

Super admins are created **only when** `SUPER_ADMIN_SEED_PASSWORD` is set in `.env`.

```env
SUPER_ADMIN_SEED_PASSWORD=your_secure_password
SUPER_ADMIN_RESET_PASSWORD=false
SUPER_ADMIN_SEEDS=admin@example.com:9999999999:Admin Name
```

- On first run: creates accounts from `SUPER_ADMIN_SEEDS`
- On subsequent runs: verifies role/status but **does not change passwords**
- Set `SUPER_ADMIN_RESET_PASSWORD=true` to force a password reset

---

## Project Structure

```
src/
├── config/          # db, migrate, seed, jwt
├── controllers/     # HTTP handlers
├── middleware/      # auth, roles, validation, rate limits
├── routes/          # /api/v1 route modules
├── services/        # wallet, commission, kyc, s3, msg91, email
├── jobs/            # CRON: commission release, reports
├── data/            # static catalogs (e.g. training modules)
├── templates/       # email HTML templates
└── server.js
```

---

## API Endpoints

### Base URL

- Local: `http://localhost:5000/api/v1`
- Production: `https://api.gharkapaisa.in/api/v1`

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Partner registration |
| POST | `/auth/login-password` | Email/password login |
| POST | `/auth/login-msg91` | MSG91 OTP login |
| POST | `/auth/send-otp` | Send email OTP |
| POST | `/auth/refresh` | Refresh access token (cookie) |
| POST | `/auth/logout` | Revoke refresh token |
| GET | `/auth/me` | Current user profile |

### Partner (self-service)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/partner/profile` | Partner profile |
| POST | `/partner/upload-docs` | Upload KYC (multipart) |
| GET | `/partner/customers` | CRM customer list |
| GET | `/partner/training` | Training module catalog |
| GET | `/kyc/me` | KYC documents & status |

### Applications & Leads

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/applications` | List applications (role-filtered) |
| POST | `/applications` | Submit application (KYC-approved partner) |
| PATCH | `/applications/:id/status` | Update status (admin/employee) |
| POST | `/card-applications` | Public direct card lead (post-OTP) |

### Wallet

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wallet/:PartnerId` | Wallet summary |
| GET | `/wallet/:PartnerId/transactions` | Statement |
| POST | `/wallet/:PartnerId/withdraw` | Request withdrawal |
| PATCH | `/wallet/withdrawals/:id/process` | Approve/reject (super admin) |

Commissions enter **hold balance** first (`COMMISSION_CREDIT_HOLD_HOURS`, default 48h), then auto-release to available balance.

### Admin / Super Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/Partners` | List partners |
| PATCH | `/Partners/:id/approve` | Approve/reject partner KYC |
| GET/POST | `/products`, `/banks`, `/banners` | Catalog & CMS |
| GET | `/reports/*` | Analytics & exports |
| GET | `/superadmin/*` | Elevated system management |

---

## Roles

PostgreSQL enum `user_role`:

| Role | Access |
|------|--------|
| `PARTNER` | Submit leads, wallet, KYC, team |
| `EMPLOYEE` | Lead status updates |
| `ADMIN` | Partner & lead management, withdrawals |
| `SUPER_ADMIN` | Full system, CMS, commissions, audit |

Use uppercase role strings everywhere (`PARTNER`, not `partner`).

---

## Response Format

**Success:**
```json
{ "success": true, "message": "Success", "data": {}, "timestamp": "..." }
```

**Error:**
```json
{ "success": false, "message": "Validation failed", "timestamp": "..." }
```

---

## Environment Variables

See `.env.example` for the full list. Required for production:

- `DB_*` — PostgreSQL connection
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — min 32 chars each
- `AWS_*` — S3 bucket for documents
- `MSG91_AUTH_KEY` — SMS OTP
- `FRONTEND_URL` — CORS whitelist (comma-separated)
- `ENCRYPTION_KEY` — AES-256-GCM for bank account numbers

---

## Deployment

```bash
npm install --production
npm run migrate   # with SUPER_ADMIN_SEED_PASSWORD set once
npm run seed
pm2 start src/server.js --name gharkapaisa-api
```

Health check: `GET /health`

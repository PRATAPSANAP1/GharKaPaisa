# Database Schema & Data Dictionary

This document contains the complete database schema definition and data dictionary for all 53 tables across the system's 11 features, including constraints, relationships, indexes, and triggers.

---

## TABLE 1: `users`
**Feature**: 🔐 Authentication & Authorization

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique user identifier |
| 2 | `firebase_uid` | VARCHAR(255) | UNIQUE, NULLABLE | Firebase Auth UID |
| 3 | `email` | VARCHAR(255) | UNIQUE | User email address |
| 4 | `mobile` | VARCHAR(15) | UNIQUE | User mobile number |
| 5 | `password_hash` | VARCHAR(255) | NULLABLE | Bcrypt hashed password |
| 6 | `role` | user_role ENUM | NOT NULL, DEFAULT 'PARTNER' | SUPER_ADMIN, ADMIN, EMPLOYEE, PARTNER |
| 7 | `status` | user_status ENUM | NOT NULL, DEFAULT 'pending' | pending, active, suspended, rejected, inactive, blocked |
| 8 | `full_name` | VARCHAR(255) | NULLABLE | User's full name |
| 9 | `employee_id` | VARCHAR(50) | UNIQUE, NULLABLE | Employee ID for admin/employee roles |
| 10 | `department` | VARCHAR(100) | NULLABLE | Department for employees |
| 11 | `designation` | VARCHAR(100) | NULLABLE | Job designation |
| 12 | `is_active` | BOOLEAN | DEFAULT TRUE | Active status flag |
| 13 | `email_verified` | BOOLEAN | DEFAULT FALSE | Email verification status |
| 14 | `mobile_verified` | BOOLEAN | DEFAULT FALSE | Mobile verification status |
| 15 | `must_change_password` | BOOLEAN | DEFAULT FALSE | Force password change flag |
| 16 | `verification_token` | TEXT | NULLABLE | Email verification token |
| 17 | `verification_token_expires_at` | TIMESTAMPTZ | NULLABLE | Token expiry timestamp |
| 18 | `reset_token` | TEXT | NULLABLE | Password reset token |
| 19 | `reset_token_expires_at` | TIMESTAMPTZ | NULLABLE | Reset token expiry |
| 20 | `created_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Creator user ID |
| 21 | `last_login` | TIMESTAMPTZ | NULLABLE | Last login timestamp |
| 22 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 23 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

* **Indexes**:
  * `idx_users_firebase_uid` ON (`firebase_uid`) WHERE `firebase_uid IS NOT NULL`
* **Trigger**: `set_updated_at` BEFORE UPDATE

---

## TABLE 2: `partner_profiles`
**Feature**: 💼 Partner Management, 🛡️ KYC Verification, 👥 Team Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique partner identifier |
| 2 | `user_id` | UUID | FOREIGN KEY → users(id) ON DELETE CASCADE, UNIQUE, NOT NULL | Link to user account |
| 3 | `partner_code` | VARCHAR(20) | UNIQUE, NOT NULL | Unique partner referral code |
| 4 | `parent_partner_id` | UUID | FOREIGN KEY → partner_profiles(id), NULLABLE | Upline/parent partner |
| 5 | `first_name` | VARCHAR(100) | NOT NULL | Partner's first name |
| 6 | `last_name` | VARCHAR(100) | NOT NULL | Partner's last name |
| 7 | `profile_photo_url` | VARCHAR(500) | NULLABLE | Profile photo S3 URL |
| 8 | `current_address` | TEXT | NULLABLE | Residential address |
| 9 | `business_location` | TEXT | NULLABLE | Business location |
| 10 | `company_name` | VARCHAR(255) | NULLABLE | Company name |
| 11 | `company_type` | VARCHAR(100) | NULLABLE | Type of business entity |
| 12 | `gst_number` | VARCHAR(20) | NULLABLE | GST registration number |
| 13 | `pincode` | VARCHAR(10) | NULLABLE | Postal code |
| 14 | `kyc_status` | kyc_status ENUM | DEFAULT 'pending' | pending, under_review, approved, rejected |
| 15 | `kyc_submitted_at` | TIMESTAMPTZ | NULLABLE | KYC submission timestamp |
| 16 | `kyc_reviewed_at` | TIMESTAMPTZ | NULLABLE | KYC review timestamp |
| 17 | `kyc_reviewed_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Reviewer admin ID |
| 18 | `kyc_rejection_reason` | TEXT | NULLABLE | KYC rejection details |
| 19 | `approved_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Approving admin ID |
| 20 | `approved_at` | TIMESTAMPTZ | NULLABLE | Approval timestamp |
| 21 | `rejection_reason` | TEXT | NULLABLE | General rejection reason |
| 22 | `referral_level` | INTEGER | DEFAULT 1 | Depth in referral tree |
| 23 | `referral_count` | INTEGER | DEFAULT 0 | Total referrals made |
| 24 | `team_level` | INTEGER | DEFAULT 1 | Team hierarchy level |
| 25 | `team_status` | VARCHAR(50) | DEFAULT 'ACTIVE' | Team active status |
| 26 | `allow_team_creation` | BOOLEAN | DEFAULT TRUE | Permission to build team |
| 27 | `team_joined_at` | TIMESTAMPTZ | NULLABLE | Team join timestamp |
| 28 | `children_count` | INTEGER | DEFAULT 0 | Direct downline count |
| 29 | `nominee_name` | VARCHAR(255) | NULLABLE | Nominee full name |
| 30 | `nominee_relation` | VARCHAR(100) | NULLABLE | Relationship with nominee |
| 31 | `nominee_dob` | DATE | NULLABLE | Nominee date of birth |
| 32 | `emergency_contact_name` | VARCHAR(255) | NULLABLE | Emergency contact person |
| 33 | `emergency_contact_phone` | VARCHAR(20) | NULLABLE | Emergency contact number |
| 34 | `face_match_score` | DECIMAL(5,2) | NULLABLE | Video KYC face match score |
| 35 | `aadhar_url` | VARCHAR(500) | NULLABLE | Aadhaar card S3 URL |
| 36 | `pan_url` | VARCHAR(500) | NULLABLE | PAN card S3 URL |
| 37 | `gst_cert_url` | VARCHAR(500) | NULLABLE | GST certificate S3 URL |
| 38 | `cancel_cheque_url` | VARCHAR(500) | NULLABLE | Cancelled cheque S3 URL |
| 39 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 40 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

* **Indexes**:
  * `idx_partner_code` ON (`partner_code`)
* **Trigger**: `set_updated_at` BEFORE UPDATE

---

## TABLE 3: `partner_bank_details`
**Feature**: 💼 Partner Management, 🛡️ KYC Verification, 💰 Wallet

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique bank detail identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Link to partner |
| 3 | `bank_name` | VARCHAR(100) | NOT NULL | Bank name |
| 4 | `account_holder_name` | VARCHAR(255) | NOT NULL | Account holder name |
| 5 | `account_number` | VARCHAR(255) | NOT NULL (AES-256 Encrypted) | Bank account number |
| 6 | `ifsc_code` | VARCHAR(15) | NOT NULL | IFSC code |
| 7 | `branch_name` | VARCHAR(100) | NULLABLE | Bank branch name |
| 8 | `upi_id` | VARCHAR(100) | NULLABLE | UPI ID for payments |
| 9 | `cancelled_cheque_url` | VARCHAR(500) | NULLABLE | Cancelled cheque S3 URL |
| 10 | `is_verified` | BOOLEAN | DEFAULT FALSE | Bank verification status |
| 11 | `is_primary` | BOOLEAN | DEFAULT TRUE | Primary account flag |
| 12 | `verified_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Verifying admin ID |
| 13 | `verified_at` | TIMESTAMPTZ | NULLABLE | Verification timestamp |
| 14 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 15 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

* **Trigger**: `set_updated_at` BEFORE UPDATE

---

## TABLE 4: `kyc_documents`
**Feature**: 🛡️ KYC Verification

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique document identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Link to partner |
| 3 | `doc_type` | VARCHAR(50) | NOT NULL, UNIQUE(partner_id, doc_type) | aadhaar, pan, gst_cert, cancelled_cheque |
| 4 | `doc_number` | VARCHAR(50) | NULLABLE | Document number (PAN/Aadhaar) |
| 5 | `file_url` | VARCHAR(500) | NOT NULL | File S3 URL |
| 6 | `s3_key` | VARCHAR(500) | NOT NULL | S3 storage key |
| 7 | `verified` | BOOLEAN | DEFAULT FALSE | Verification status |
| 8 | `verification_status` | VARCHAR(50) | DEFAULT 'pending' | pending, verified, rejected |
| 9 | `verified_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Verifying admin ID |
| 10 | `verified_at` | TIMESTAMPTZ | NULLABLE | Verification timestamp |
| 11 | `rejection_reason` | TEXT | NULLABLE | Rejection reason |
| 12 | `ocr_data` | JSONB | NULLABLE | OCR extracted data |
| 13 | `uploaded_at` | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |

---

## TABLE 5: `partner_videos`
**Feature**: 🛡️ KYC Verification

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique video identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, UNIQUE, NOT NULL | Link to partner |
| 3 | `video_url` | VARCHAR(500) | NOT NULL | Video S3 URL |
| 4 | `video_duration` | INTEGER | NULLABLE | Video length in seconds |
| 5 | `video_size` | INTEGER | NULLABLE | File size in bytes |
| 6 | `storage_key` | VARCHAR(500) | NOT NULL | S3 storage key |
| 7 | `verification_status` | VARCHAR(50) | DEFAULT 'pending' | pending, verified, rejected |
| 8 | `rejection_reason` | TEXT | NULLABLE | Rejection reason |
| 9 | `uploaded_at` | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |

---

## TABLE 6: `partner_wallets`
**Feature**: 💰 Wallet & Commission

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique wallet identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, UNIQUE, NOT NULL | Link to partner |
| 3 | `total_earned` | DECIMAL(15,2) | DEFAULT 0 | Lifetime total earnings |
| 4 | `total_withdrawn` | DECIMAL(15,2) | DEFAULT 0 | Total amount withdrawn |
| 5 | `hold_balance` | DECIMAL(15,2) | DEFAULT 0 | Commission under 48h hold |
| 6 | `available_balance` | DECIMAL(15,2) | DEFAULT 0 | Withdrawable balance |
| 7 | `pending_balance` | DECIMAL(15,2) | DEFAULT 0 | Pending transactions |
| 8 | `withdrawn_balance` | DECIMAL(15,2) | DEFAULT 0 | Successfully withdrawn |
| 9 | `locked_balance` | DECIMAL(15,2) | DEFAULT 0 | Locked for withdrawals |
| 10 | `override_balance` | DECIMAL(15,2) | DEFAULT 0 | Team override earnings |
| 11 | `personal_earnings` | DECIMAL(15,2) | DEFAULT 0 | Direct commission earnings |
| 12 | `team_earnings` | DECIMAL(15,2) | DEFAULT 0 | Team override earnings |
| 13 | `referral_bonus` | DECIMAL(15,2) | DEFAULT 0 | Referral bonus earnings |
| 14 | `pending_team_commission` | DECIMAL(15,2) | DEFAULT 0 | Unreleased team commission |
| 15 | `released_team_commission` | DECIMAL(15,2) | DEFAULT 0 | Released team commission |
| 16 | `status` | VARCHAR(50) | DEFAULT 'active' | Wallet status |
| 17 | `last_updated` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| 18 | `last_transaction_at` | TIMESTAMPTZ | NULLABLE | Last transaction time |
| 19 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 20 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

* **Trigger**: `audit_wallet_trigger` AFTER INSERT OR UPDATE OR DELETE → logs to `wallet_audit_logs`

---

## TABLE 7: `wallet_transactions`
**Feature**: 💰 Wallet & Commission, 📊 Analytics

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique transaction identifier |
| 2 | `wallet_id` | UUID | FOREIGN KEY → partner_wallets(id), NOT NULL | Link to wallet |
| 3 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id), NULLABLE | Link to partner |
| 4 | `application_id` | UUID | FOREIGN KEY → applications(id), NULLABLE | Related application |
| 5 | `product_id` | UUID | FOREIGN KEY → products(id), NULLABLE | Related product |
| 6 | `type` | VARCHAR(20) | NOT NULL | credit, debit |
| 7 | `amount` | DECIMAL(12,2) | NOT NULL | Transaction amount |
| 8 | `gst` | DECIMAL(15,2) | DEFAULT 0 | GST amount |
| 9 | `tds` | DECIMAL(15,2) | DEFAULT 0 | TDS amount |
| 10 | `net_amount` | DECIMAL(15,2) | DEFAULT 0 | Amount after tax |
| 11 | `balance_before` | DECIMAL(15,2) | NULLABLE | Balance before transaction |
| 12 | `balance_after` | DECIMAL(15,2) | NULLABLE | Balance after transaction |
| 13 | `status` | VARCHAR(20) | DEFAULT 'pending' | pending, approved, rejected, processed |
| 14 | `description` | VARCHAR(500) | NULLABLE | Transaction description |
| 15 | `remarks` | TEXT | NULLABLE | Additional remarks |
| 16 | `reference_type` | VARCHAR(100) | NULLABLE | Reference category |
| 17 | `reference_id` | VARCHAR(255) | NULLABLE | Reference identifier |
| 18 | `bank_name` | VARCHAR(100) | NULLABLE | Associated bank |
| 19 | `product_type` | VARCHAR(100) | NULLABLE | Product category |
| 20 | `commission_type` | VARCHAR(50) | NULLABLE | Commission category |
| 21 | `release_at` | TIMESTAMPTZ | NULLABLE | Scheduled release time |
| 22 | `processed_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Processing admin |
| 23 | `processed_at` | TIMESTAMPTZ | NULLABLE | Processing timestamp |
| 24 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

* **Indexes**:
  * `idx_wallet_txn_wallet` ON (`wallet_id`)
  * `idx_wallet_txn_status` ON (`status`) WHERE `status = 'pending'`
  * `idx_wallet_txn_release` ON (`release_at`) WHERE `status = 'pending'`

---

## TABLE 8: `wallet_ledger`
**Feature**: 💰 Wallet & Commission

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique ledger entry identifier |
| 2 | `wallet_id` | UUID | FOREIGN KEY → partner_wallets(id), NOT NULL | Link to wallet |
| 3 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id), NOT NULL | Link to partner |
| 4 | `application_id` | UUID | FOREIGN KEY → applications(id), NULLABLE | Related application |
| 5 | `transaction_type` | ledger_transaction_type ENUM | NOT NULL | PERSONAL_COMMISSION, TEAM_COMMISSION, REFERRAL_BONUS, CAMPAIGN_BONUS, SETTLEMENT, WITHDRAWAL, ADJUSTMENT, REVERSAL, REFUND, OVERRIDE_COMMISSION |
| 6 | `credit` | DECIMAL(15,2) | DEFAULT 0 | Credit amount |
| 7 | `debit` | DECIMAL(15,2) | DEFAULT 0 | Debit amount |
| 8 | `balance_after_transaction` | DECIMAL(15,2) | DEFAULT 0 | Balance after entry |
| 9 | `description` | VARCHAR(500) | NULLABLE | Entry description |
| 10 | `reference_number` | VARCHAR(100) | NULLABLE | Reference number |
| 11 | `status` | VARCHAR(50) | DEFAULT 'completed' | Entry status |
| 12 | `created_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Creator user |
| 13 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

---

## TABLE 9: `wallet_withdrawals`
**Feature**: 💰 Wallet & Commission

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique withdrawal identifier |
| 2 | `wallet_id` | UUID | FOREIGN KEY → partner_wallets(id), NULLABLE | Link to wallet |
| 3 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id), NOT NULL | Link to partner |
| 4 | `bank_account_id` | UUID | FOREIGN KEY → partner_bank_details(id), NULLABLE | Destination bank account |
| 5 | `amount` | DECIMAL(12,2) | NOT NULL | Withdrawal amount |
| 6 | `status` | VARCHAR(20) | DEFAULT 'pending' | pending, approved, processed, rejected |
| 7 | `bank_name` | VARCHAR(100) | NULLABLE | Destination bank |
| 8 | `account_number` | VARCHAR(50) | NULLABLE | Account number |
| 9 | `ifsc_code` | VARCHAR(15) | NULLABLE | IFSC code |
| 10 | `utr_number` | VARCHAR(50) | NULLABLE | Bank UTR number |
| 11 | `utr` | VARCHAR(100) | NULLABLE | UTR reference |
| 12 | `bank_reference` | VARCHAR(100) | NULLABLE | Bank reference ID |
| 13 | `razorpay_contact_id` | VARCHAR(100) | NULLABLE | Razorpay contact |
| 14 | `razorpay_fund_account_id` | VARCHAR(100) | NULLABLE | Razorpay fund account |
| 15 | `razorpay_payout_id` | VARCHAR(100) | NULLABLE | Razorpay payout ID |
| 16 | `failure_reason` | TEXT | NULLABLE | Payout failure reason |
| 17 | `remarks` | TEXT | NULLABLE | Additional remarks |
| 18 | `admin_note` | TEXT | NULLABLE | Admin notes |
| 19 | `rejection_reason` | TEXT | NULLABLE | Rejection reason |
| 20 | `processed_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Processing admin |
| 21 | `processed_at` | TIMESTAMPTZ | NULLABLE | Processing timestamp |
| 22 | `transferred_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Transfer executor |
| 23 | `transferred_at` | TIMESTAMPTZ | NULLABLE | Transfer timestamp |
| 24 | `approved_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Approving admin |
| 25 | `approved_at` | TIMESTAMPTZ | NULLABLE | Approval timestamp |
| 26 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 27 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

* **Indexes**:
  * `idx_withdrawal_partner` ON (`partner_id`, `status`)
* **Trigger**: `set_updated_at` BEFORE UPDATE

---

## TABLE 10: `wallet_audit_logs`
**Feature**: 💰 Wallet, 📊 Analytics

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique audit log identifier |
| 2 | `wallet_id` | UUID | FOREIGN KEY → partner_wallets(id) ON DELETE CASCADE, NOT NULL | Link to wallet |
| 3 | `action` | VARCHAR(50) | NOT NULL | INSERT, UPDATE, DELETE |
| 4 | `old_available_balance` | DECIMAL(15,2) | NULLABLE | Balance before change |
| 5 | `new_available_balance` | DECIMAL(15,2) | NULLABLE | Balance after change |
| 6 | `old_hold_balance` | DECIMAL(15,2) | NULLABLE | Hold balance before change |
| 7 | `new_hold_balance` | DECIMAL(15,2) | NULLABLE | Hold balance after change |
| 8 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

* **Indexes**:
  * `idx_wallet_audit_logs_created_at` ON (`created_at` DESC)

---

## TABLE 11: `commission_structures`
**Feature**: 💰 Wallet & Commission

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique structure identifier |
| 2 | `product_id` | UUID | FOREIGN KEY → products(id), NOT NULL | Link to product |
| 3 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id), NULLABLE | NULL = global default |
| 4 | `commission_type` | VARCHAR(20) | DEFAULT 'fixed' | fixed, percentage |
| 5 | `commission_value` | DECIMAL(12,2) | NOT NULL | Commission amount/rate |
| 6 | `effective_from` | DATE | NOT NULL, DEFAULT CURRENT_DATE | Start date |
| 7 | `effective_to` | DATE | NULLABLE | End date |
| 8 | `created_by` | UUID | FOREIGN KEY → users(id), NOT NULL | Creator admin |
| 9 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

---

## TABLE 12: `commission_rules`
**Feature**: 💰 Wallet & Commission

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique rule identifier |
| 2 | `product_id` | UUID | FOREIGN KEY → products(id), NULLABLE | Link to product |
| 3 | `partner_percentage` | DECIMAL(5,2) | DEFAULT 90.00 | Child partner share % |
| 4 | `parent_percentage` | DECIMAL(5,2) | DEFAULT 10.00 | Parent partner share % |
| 5 | `campaign_bonus` | DECIMAL(15,2) | DEFAULT 0.00 | Extra campaign bonus |
| 6 | `effective_from` | TIMESTAMPTZ | DEFAULT NOW() | Start date |
| 7 | `effective_to` | TIMESTAMPTZ | NULLABLE | End date |
| 8 | `status` | VARCHAR(50) | DEFAULT 'active' | Rule status |
| 9 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

---

## TABLE 13: `commission_ledger`
**Feature**: 💰 Wallet & Commission, 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique ledger identifier |
| 2 | `application_id` | UUID | FOREIGN KEY → applications(id) ON DELETE CASCADE, NOT NULL | Link to application |
| 3 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Child partner |
| 4 | `parent_partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE SET NULL, NULLABLE | Parent partner |
| 5 | `commission_amount` | DECIMAL(15,2) | DEFAULT 0 | Child commission amount |
| 6 | `override_amount` | DECIMAL(15,2) | DEFAULT 0 | Parent override amount |
| 7 | `status` | VARCHAR(50) | DEFAULT 'pending' | pending, credited, released |
| 8 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

* **Indexes**:
  * `idx_comm_ledger_app` ON (`application_id`)

---

## TABLE 14: `commission_release_queue`
**Feature**: 💰 Wallet & Commission

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique queue identifier |
| 2 | `wallet_transaction_id` | UUID | FOREIGN KEY → wallet_transactions(id), NULLABLE | Link to transaction |
| 3 | `release_at` | TIMESTAMPTZ | NOT NULL | Scheduled release time |
| 4 | `status` | VARCHAR(50) | DEFAULT 'pending' | pending, processed, failed |
| 5 | `processed_at` | TIMESTAMPTZ | NULLABLE | Processing timestamp |

---

## TABLE 15: `applications`
**Feature**: 📋 Lead & Application CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique application identifier |
| 2 | `app_number` | VARCHAR(20) | UNIQUE, NOT NULL | Application number (GKP10001) |
| 3 | `customer_id` | UUID | FOREIGN KEY → customers(id), NOT NULL | Link to customer |
| 4 | `product_id` | UUID | FOREIGN KEY → products(id), NOT NULL | Link to product |
| 5 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id), NOT NULL | Referring partner |
| 6 | `parent_partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE SET NULL, NULLABLE | Parent partner |
| 7 | `bank_id` | UUID | FOREIGN KEY → banks(id) ON DELETE SET NULL, NULLABLE | Target bank |
| 8 | `submitted_by` | UUID | FOREIGN KEY → users(id), NOT NULL | Submitting user |
| 9 | `tracking_id` | VARCHAR(100) | NULLABLE | External tracking ID |
| 10 | `status` | application_status ENUM | DEFAULT 'submitted' | draft, submitted, under_review, approved, rejected, disbursed, confirmed |
| 11 | `bank_ref_number` | VARCHAR(100) | NULLABLE | Bank reference number |
| 12 | `loan_amount` | DECIMAL(15,2) | NULLABLE | Requested loan amount |
| 13 | `approved_amount` | DECIMAL(15,2) | NULLABLE | Approved amount |
| 14 | `credit_limit` | DECIMAL(15,2) | NULLABLE | Credit card limit |
| 15 | `interest_rate` | DECIMAL(5,2) | NULLABLE | Interest rate |
| 16 | `tenure_months` | INT | NULLABLE | Loan tenure |
| 17 | `disbursal_date` | DATE | NULLABLE | Disbursal date |
| 18 | `rejection_reason` | TEXT | NULLABLE | Rejection reason |
| 19 | `notes` | TEXT | NULLABLE | Admin notes |
| 20 | `documents` | JSONB | DEFAULT '[]' | Document references |
| 21 | `status_history` | JSONB | DEFAULT '[]' | Status change log |
| 22 | `commission_amount` | DECIMAL(12,2) | NULLABLE | Commission earned |
| 23 | `commission_status` | commission_status ENUM | DEFAULT 'pending' | pending, approved, rejected, processed |
| 24 | `submitted_at` | TIMESTAMPTZ | NULLABLE | Submission timestamp |
| 25 | `approved_at` | TIMESTAMPTZ | NULLABLE | Approval timestamp |
| 26 | `commission_received_at` | TIMESTAMPTZ | NULLABLE | Commission receipt time |
| 27 | `commission_paid_at` | TIMESTAMPTZ | NULLABLE | Commission payout time |
| 28 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 29 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

* **Indexes**:
  * `idx_applications_partner` ON (`partner_id`)
  * `idx_applications_status` ON (`status`)
  * `idx_applications_created` ON (`created_at` DESC)
  * `idx_applications_customer` ON (`customer_id`)
  * `idx_applications_product` ON (`product_id`)
* **Trigger**: `set_updated_at` BEFORE UPDATE

---

## TABLE 16: `application_timeline`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique timeline entry |
| 2 | `application_id` | UUID | FOREIGN KEY → applications(id) ON DELETE CASCADE, NOT NULL | Link to application |
| 3 | `status` | VARCHAR(50) | NOT NULL | Application status |
| 4 | `activity` | VARCHAR(255) | NOT NULL | Activity description |
| 5 | `remarks` | TEXT | NULLABLE | Additional remarks |
| 6 | `performed_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL, NULLABLE | Action performer |
| 7 | `performed_at` | TIMESTAMPTZ | DEFAULT NOW() | Action timestamp |

* **Indexes**:
  * `idx_timeline_app` ON (`application_id`)

---

## TABLE 17: `application_documents`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique document identifier |
| 2 | `application_id` | UUID | FOREIGN KEY → applications(id) ON DELETE CASCADE, NOT NULL | Link to application |
| 3 | `document_type` | VARCHAR(50) | NOT NULL | Document category |
| 4 | `file_url` | VARCHAR(1000) | NOT NULL | File URL |
| 5 | `status` | VARCHAR(50) | DEFAULT 'pending' | Document status |
| 6 | `uploaded_at` | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |

* **Indexes**:
  * `idx_docs_app` ON (`application_id`)

---

## TABLE 18: `application_notes`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique note identifier |
| 2 | `application_id` | UUID | FOREIGN KEY → applications(id) ON DELETE CASCADE, NOT NULL | Link to application |
| 3 | `user_id` | UUID | FOREIGN KEY → users(id) ON DELETE CASCADE, NOT NULL | Note author |
| 4 | `note` | TEXT | NOT NULL | Note content |
| 5 | `visibility` | VARCHAR(50) | DEFAULT 'public' | public, admin_only |
| 6 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**:
  * `idx_notes_app` ON (`application_id`)

---

## TABLE 19: `customers`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique customer identifier |
| 2 | `full_name` | VARCHAR(255) | NOT NULL | Customer full name |
| 3 | `mobile` | VARCHAR(15) | NOT NULL, UNIQUE | Customer mobile number |
| 4 | `email` | VARCHAR(255) | NULLABLE | Customer email |
| 5 | `dob` | DATE | NULLABLE | Date of birth |
| 6 | `pan_number` | VARCHAR(12) | NULLABLE | PAN card number |
| 7 | `aadhaar_last4` | VARCHAR(4) | NULLABLE | Last 4 digits of Aadhaar |
| 8 | `city` | VARCHAR(100) | NULLABLE | City of residence |
| 9 | `state` | VARCHAR(100) | NULLABLE | State of residence |
| 10 | `pincode` | VARCHAR(10) | NULLABLE | Postal code |
| 11 | `monthly_income` | DECIMAL(15,2) | NULLABLE | Monthly income |
| 12 | `employer` | VARCHAR(255) | NULLABLE | Employer name |
| 13 | `employment_type` | VARCHAR(50) | NULLABLE | salaried, self_employed, business |
| 14 | `created_by` | UUID | FOREIGN KEY → users(id), NOT NULL | Creator user |
| 15 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 16 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

* **Indexes**:
  * `idx_customers_mobile` UNIQUE ON (`mobile`)
  * `idx_customers_pan` ON (`pan_number`)
* **Trigger**: `set_updated_at` BEFORE UPDATE

---

## TABLE 20: `leads`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique lead identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Referring partner |
| 3 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Target product |
| 4 | `customer_name` | VARCHAR(255) | NOT NULL | Customer name |
| 5 | `mobile` | VARCHAR(15) | NOT NULL | Customer mobile |
| 6 | `city` | VARCHAR(100) | NULLABLE | Customer city |
| 7 | `status` | VARCHAR(50) | DEFAULT 'pending' | pending, contacted, converted, rejected |
| 8 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 9 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

* **Indexes**:
  * `idx_leads_partner` ON (`partner_id`)
  * `idx_leads_product` ON (`product_id`)
* **Trigger**: `set_updated_at` BEFORE UPDATE

---

## TABLE 21: `lead_followups`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique followup identifier |
| 2 | `lead_id` | UUID | FOREIGN KEY → leads(id) ON DELETE CASCADE, NOT NULL | Link to lead |
| 3 | `scheduled_by` | UUID | FOREIGN KEY → users(id), NOT NULL | Scheduler user |
| 4 | `follow_up_at` | TIMESTAMPTZ | NOT NULL | Scheduled followup time |
| 5 | `note` | TEXT | NULLABLE | Followup notes |
| 6 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

* **Indexes**:
  * `idx_lead_followups_lead` ON (`lead_id`)

---

## TABLE 22: `banks`
**Feature**: 🏦 Product & Bank Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique bank identifier |
| 2 | `name` | VARCHAR(100) | UNIQUE, NOT NULL | Bank name |
| 3 | `short_code` | VARCHAR(20) | UNIQUE, NOT NULL | Bank short code |
| 4 | `logo_url` | VARCHAR(500) | NULLABLE | Bank logo S3 URL |
| 5 | `status` | VARCHAR(50) | DEFAULT 'Active' | Bank status |
| 6 | `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

---

## TABLE 23: `products`
**Feature**: 🏦 Product & Bank Management, 🎨 CMS

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique product identifier |
| 2 | `bank_id` | UUID | FOREIGN KEY → banks(id), NOT NULL | Link to bank |
| 3 | `name` | VARCHAR(255) | NOT NULL | Product name |
| 4 | `category` | product_category ENUM | NOT NULL | credit_card, personal_loan, etc. |
| 5 | `description` | TEXT | NULLABLE | Product description |
| 6 | `short_description` | VARCHAR(500) | NULLABLE | Short description |
| 7 | `features` | JSONB | DEFAULT '[]' | Product features |
| 8 | `eligibility` | JSONB | DEFAULT '{}' | Eligibility criteria |
| 9 | `eligibility_criteria` | TEXT | NULLABLE | Text eligibility |
| 10 | `documents_required` | TEXT | NULLABLE | Required documents |
| 11 | `benefits` | TEXT | NULLABLE | Product benefits |
| 12 | `fees_charges` | TEXT | NULLABLE | Fees and charges |
| 13 | `commission_type` | VARCHAR(20) | DEFAULT 'fixed' | fixed, percentage |
| 14 | `commission_value` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Commission amount/rate |
| 15 | `commission_enabled` | BOOLEAN | DEFAULT TRUE | Commission flag |
| 16 | `commission_amount` | DECIMAL(12,2) | DEFAULT 0 | Default commission |
| 17 | `override_percentage` | DECIMAL(5,2) | DEFAULT 0 | Override % |
| 18 | `min_age` | INT | NULLABLE | Minimum age |
| 19 | `max_age` | INT | NULLABLE | Maximum age |
| 20 | `min_income` | DECIMAL(15,2) | NULLABLE | Minimum income |
| 21 | `interest_rate` | DECIMAL | NULLABLE | Interest rate |
| 22 | `processing_fee` | VARCHAR | NULLABLE | Processing fee |
| 23 | `annual_fee` | VARCHAR(255) | NULLABLE | Annual fee |
| 24 | `time_period` | VARCHAR(255) | NULLABLE | Offer period |
| 25 | `image_url` | VARCHAR(500) | NULLABLE | Product image |
| 26 | `logo` | VARCHAR(500) | NULLABLE | Product logo |
| 27 | `banner` | VARCHAR(500) | NULLABLE | Banner image |
| 28 | `image` | VARCHAR(500) | NULLABLE | Image |
| 29 | `banner_url` | VARCHAR(500) | NULLABLE | Banner URL |
| 30 | `public_url` | VARCHAR(1000) | NULLABLE | Public page URL |
| 31 | `partner_url` | VARCHAR(1000) | NULLABLE | Partner page URL |
| 32 | `tracking_enabled` | BOOLEAN | DEFAULT TRUE | Click tracking |
| 33 | `button_text` | VARCHAR(100) | DEFAULT 'Apply Now' | Button label |
| 34 | `apply_button_text` | VARCHAR(100) | DEFAULT 'Apply Now' | Apply button text |
| 35 | `redirect_type` | VARCHAR(20) | DEFAULT 'new_tab' | Redirect behavior |
| 36 | `utm_source` | VARCHAR(100) | NULLABLE | UTM source |
| 37 | `utm_medium` | VARCHAR(100) | NULLABLE | UTM medium |
| 38 | `utm_campaign` | VARCHAR(100) | NULLABLE | UTM campaign |
| 39 | `featured` | BOOLEAN | DEFAULT FALSE | Featured flag |
| 40 | `public_visible` | BOOLEAN | DEFAULT TRUE | Public visibility |
| 41 | `partner_visible` | BOOLEAN | DEFAULT TRUE | Partner visibility |
| 42 | `seo_title` | VARCHAR(255) | NULLABLE | SEO title |
| 43 | `seo_description` | VARCHAR(500) | NULLABLE | SEO description |
| 44 | `seo_keywords` | VARCHAR(500) | NULLABLE | SEO keywords |
| 45 | `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| 46 | `status` | VARCHAR(50) | DEFAULT 'Active' | Product status |
| 47 | `display_order` | INT | DEFAULT 0 | Display ordering |
| 48 | `priority` | INT | DEFAULT 0 | Priority level |
| 49 | `created_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Creator |
| 50 | `updated_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Updater |
| 51 | `last_updated_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Last updater |
| 52 | `last_updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update time |
| 53 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 54 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

* **Indexes**:
  * `idx_products_bank_name` UNIQUE ON (`bank_id`, `name`)
* **Trigger**: `set_updated_at` BEFORE UPDATE

---

## TABLE 24: `product_application_settings`
**Feature**: 🏦 Products

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique settings identifier |
| 2 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, UNIQUE, NOT NULL | Link to product |
| 3 | `application_type` | application_type_enum | NOT NULL, DEFAULT 'internal_form' | internal_form, external_url, affiliate_url, api_integration |
| 4 | `application_url` | VARCHAR(1000) | NULLABLE | External application URL |
| 5 | `provider_name` | VARCHAR(255) | NULLABLE | Provider name |
| 6 | `open_type` | open_type_enum | NOT NULL, DEFAULT 'same_tab' | same_tab, new_tab |
| 7 | `partner_enabled` | BOOLEAN | DEFAULT TRUE | Partner access |
| 8 | `customer_enabled` | BOOLEAN | DEFAULT TRUE | Customer access |
| 9 | `track_clicks` | BOOLEAN | DEFAULT TRUE | Click tracking |
| 10 | `status` | VARCHAR(20) | DEFAULT 'active' | Settings status |
| 11 | `created_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Creator |
| 12 | `updated_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Updater |
| 13 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| 14 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update time |

* **Indexes**:
  * `idx_app_settings_product` ON (`product_id`)

---

## TABLE 25: `product_link_audits`
**Feature**: 🏦 Products

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique audit identifier |
| 2 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Link to product |
| 3 | `old_url` | VARCHAR(1000) | NULLABLE | Previous URL |
| 4 | `new_url` | VARCHAR(1000) | NULLABLE | New URL |
| 5 | `updated_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL, NULLABLE | Updater |
| 6 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update time |
| 7 | `reason` | TEXT | NULLABLE | Change reason |
| 8 | `ip_address` | VARCHAR(45) | NULLABLE | IP address |

* **Indexes**:
  * `idx_link_audits_product` ON (`product_id`)

---

## TABLE 26: `notifications`
**Feature**: 🔔 Notifications

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique notification identifier |
| 2 | `user_id` | UUID | FOREIGN KEY → users(id) ON DELETE CASCADE, NOT NULL | Target user |
| 3 | `user_role` | VARCHAR(50) | NULLABLE | Target role filter |
| 4 | `title` | VARCHAR(255) | NOT NULL | Notification title |
| 5 | `message` | TEXT | NOT NULL | Notification body |
| 6 | `type` | VARCHAR(50) | DEFAULT 'info' | info, success, warning, alert |
| 7 | `category` | VARCHAR(50) | DEFAULT 'system' | Notification category |
| 8 | `priority` | VARCHAR(20) | DEFAULT 'normal' | normal, high, urgent |
| 9 | `status` | VARCHAR(20) | DEFAULT 'sent' | sent, delivered, read |
| 10 | `channel` | VARCHAR(50) | DEFAULT 'in-app' | in-app, email, sms |
| 11 | `is_read` | BOOLEAN | DEFAULT FALSE | Read status |
| 12 | `read_at` | TIMESTAMPTZ | NULLABLE | Read timestamp |
| 13 | `link` | VARCHAR(500) | NULLABLE | Action link |
| 14 | `redirect_url` | VARCHAR(500) | NULLABLE | Redirect URL |
| 15 | `icon` | VARCHAR(100) | NULLABLE | Notification icon |
| 16 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

* **Indexes**:
  * `idx_notifications_user` ON (`user_id`, `is_read`)

---

## TABLE 27: `notification_preferences`
**Feature**: 🔔 Notifications

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique preference identifier |
| 2 | `user_id` | UUID | FOREIGN KEY → users(id) ON DELETE CASCADE, UNIQUE, NOT NULL | Target user |
| 3 | `email_enabled` | BOOLEAN | DEFAULT TRUE | Email notifications |
| 4 | `sms_enabled` | BOOLEAN | DEFAULT TRUE | SMS notifications |
| 5 | `app_enabled` | BOOLEAN | DEFAULT TRUE | In-app notifications |
| 6 | `marketing_enabled` | BOOLEAN | DEFAULT TRUE | Marketing emails |
| 7 | `commission_enabled` | BOOLEAN | DEFAULT TRUE | Commission alerts |
| 8 | `kyc_enabled` | BOOLEAN | DEFAULT TRUE | KYC status alerts |
| 9 | `application_enabled` | BOOLEAN | DEFAULT TRUE | Application updates |
| 10 | `language` | VARCHAR(10) | DEFAULT 'en' | Preferred language |
| 11 | `frequency` | VARCHAR(20) | DEFAULT 'instant' | instant, daily, weekly |

---

## TABLE 28: `notification_templates`
**Feature**: 🔔 Notifications

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique template identifier |
| 2 | `template_name` | VARCHAR(100) | UNIQUE, NOT NULL | Template name |
| 3 | `subject` | VARCHAR(255) | NOT NULL | Email subject |
| 4 | `message` | TEXT | NOT NULL | Template body |
| 5 | `channel` | VARCHAR(50) | DEFAULT 'in-app' | Delivery channel |
| 6 | `variables` | JSONB | DEFAULT '[]' | Template variables |
| 7 | `status` | VARCHAR(20) | DEFAULT 'active' | Template status |

---

## TABLE 29: `announcements`
**Feature**: 🔔 Notifications, 🎨 CMS

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique announcement identifier |
| 2 | `title` | VARCHAR(255) | NOT NULL | Announcement title |
| 3 | `description` | TEXT | NOT NULL | Announcement body |
| 4 | `banner_image` | VARCHAR(500) | NULLABLE | Banner image URL |
| 5 | `target_role` | VARCHAR(50) | DEFAULT 'all' | Target audience |
| 6 | `priority` | VARCHAR(20) | DEFAULT 'normal' | Priority level |
| 7 | `start_date` | DATE | NULLABLE | Start date |
| 8 | `end_date` | DATE | NULLABLE | End date |
| 9 | `redirect_url` | VARCHAR(500) | NULLABLE | Click-through URL |
| 10 | `status` | VARCHAR(20) | DEFAULT 'draft' | draft, published, archived |
| 11 | `created_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL, NULLABLE | Creator |
| 12 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

---

## TABLE 30: `refresh_tokens`
**Feature**: 🔐 Authentication

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique token identifier |
| 2 | `user_id` | UUID | FOREIGN KEY → users(id) ON DELETE CASCADE, NOT NULL | Token owner |
| 3 | `token_hash` | VARCHAR(255) | NOT NULL | Hashed token value |
| 4 | `expires_at` | TIMESTAMPTZ | NOT NULL | Token expiry |
| 5 | `revoked` | BOOLEAN | DEFAULT FALSE | Revocation flag |
| 6 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

* **Indexes**:
  * `idx_refresh_tokens_user` ON (`user_id`, `revoked`)

---

## TABLE 31: `otp_verifications`
**Feature**: 🔐 Authentication

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique OTP identifier |
| 2 | `identity` | VARCHAR(255) | UNIQUE, NOT NULL | Email or mobile |
| 3 | `otp_hash` | VARCHAR(255) | NOT NULL | HMAC hashed OTP |
| 4 | `expires_at` | TIMESTAMPTZ | NOT NULL | OTP expiry |
| 5 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

---

## TABLE 32: `msg91_verified_tokens`
**Feature**: 🔐 Authentication

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique token identifier |
| 2 | `token_hash` | VARCHAR(64) | UNIQUE, NOT NULL | Hashed MSG91 token |
| 3 | `user_id` | UUID | FOREIGN KEY → users(id) ON DELETE CASCADE, NOT NULL | Verified user |
| 4 | `used_at` | TIMESTAMPTZ | DEFAULT NOW() | Usage timestamp |

---

## TABLE 33: `pre_verified_emails`
**Feature**: 🔐 Authentication

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `email` | VARCHAR(255) | PRIMARY KEY | Pre-verified email |
| 2 | `verified_at` | TIMESTAMPTZ | DEFAULT NOW() | Verification time |

---

## TABLE 34: `audit_logs`
**Feature**: 📊 Analytics

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique audit identifier |
| 2 | `user_id` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL, NULLABLE | Action performer |
| 3 | `action` | VARCHAR(100) | NOT NULL | Action name |
| 4 | `target_id` | UUID | NULLABLE | Target entity ID |
| 5 | `details` | JSONB | NULLABLE | Action details |
| 6 | `role` | VARCHAR(50) | NULLABLE | Performer role |
| 7 | `ip_address` | VARCHAR(45) | NULLABLE | IP address |
| 8 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

* **Indexes**:
  * `idx_audit_logs_created_at` ON (`created_at` DESC)

---

## TABLE 35: `partner_team_relationships`
**Feature**: 👥 Team Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique relationship identifier |
| 2 | `parent_partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Upline partner |
| 3 | `child_partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, UNIQUE, NOT NULL | Downline partner |
| 4 | `level` | INTEGER | NOT NULL | Hierarchy depth |
| 5 | `status` | VARCHAR(20) | DEFAULT 'ACTIVE' | Relationship status |
| 6 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

* **Indexes**:
  * `idx_team_rels_parent` ON (`parent_partner_id`)
  * `idx_team_rels_child` ON (`child_partner_id`)

---

## TABLE 36: `partner_referrals`
**Feature**: 💼 Partner Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique referral identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, UNIQUE, NOT NULL | Partner |
| 3 | `referral_code` | VARCHAR(50) | UNIQUE, NOT NULL | Referral code |
| 4 | `referral_link` | VARCHAR(1000) | NOT NULL | Full referral URL |
| 5 | `total_invites` | INTEGER | DEFAULT 0 | Total invites sent |
| 6 | `total_registered` | INTEGER | DEFAULT 0 | Successfully registered |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

* **Indexes**:
  * `idx_referrals_partner` ON (`partner_id`)
  * `idx_referrals_code` ON (`referral_code`)

---

## TABLE 37: `training_modules`
**Feature**: 🎓 Training

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique module identifier |
| 2 | `title` | VARCHAR(255) | NOT NULL | Module title |
| 3 | `description` | TEXT | NULLABLE | Module description |
| 4 | `video_url` | VARCHAR(500) | NULLABLE | Training video URL |
| 5 | `pdf_url` | VARCHAR(500) | NULLABLE | PDF document URL |
| 6 | `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| 8 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update time |

---

## TABLE 38: `partner_training_progress`
**Feature**: 🎓 Training

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique progress identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Partner |
| 3 | `training_id` | UUID | FOREIGN KEY → training_modules(id) ON DELETE CASCADE, NOT NULL | Training module |
| 4 | `progress` | INTEGER | DEFAULT 0 | Completion percentage |
| 5 | `completed` | BOOLEAN | DEFAULT FALSE | Completion flag |
| 6 | `completed_at` | TIMESTAMPTZ | NULLABLE | Completion timestamp |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| 8 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update time |

* **Constraints**: `UNIQUE (partner_id, training_id)`

---

## TABLE 39: `banners`
**Feature**: 🎨 CMS & Marketing

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique banner identifier |
| 2 | `title` | VARCHAR(255) | NOT NULL | Banner title |
| 3 | `subtitle` | VARCHAR(500) | NULLABLE | Banner subtitle |
| 4 | `btn_text` | VARCHAR(100) | NULLABLE | Button text |
| 5 | `image_url` | VARCHAR(500) | NOT NULL | Banner image URL |
| 6 | `link_type` | VARCHAR(50) | DEFAULT 'custom' | Link type |
| 7 | `click_url` | VARCHAR(500) | DEFAULT '/credit-cards' | Click destination |
| 8 | `display_order` | INT | DEFAULT 0 | Display ordering |
| 9 | `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| 10 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| 11 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update time |

* **Trigger**: `set_updated_at` BEFORE UPDATE

---

## TABLE 40: `homepage_sections`
**Feature**: 🎨 CMS & Marketing

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique section identifier |
| 2 | `key` | VARCHAR(100) | UNIQUE, NOT NULL | Section key name |
| 3 | `title` | VARCHAR(255) | NOT NULL | Section title |
| 4 | `subtitle` | VARCHAR(500) | NULLABLE | Section subtitle |
| 5 | `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| 6 | `display_order` | INT | DEFAULT 0 | Display ordering |
| 7 | `items` | JSONB | DEFAULT '[]' | Section items data |
| 8 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| 9 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update time |

---

## TABLE 41: `marketing_materials`
**Feature**: 🎨 CMS & Marketing

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique material identifier |
| 2 | `title` | VARCHAR(255) | NOT NULL | Material title |
| 3 | `description` | TEXT | NULLABLE | Material description |
| 4 | `category` | VARCHAR(100) | NOT NULL | Material category |
| 5 | `file_url` | VARCHAR(500) | NOT NULL | File download URL |
| 6 | `thumbnail_url` | VARCHAR(500) | NULLABLE | Thumbnail preview |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

---

## TABLE 42: `services_catalog`
**Feature**: 🎨 CMS & Marketing

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | SERIAL | PRIMARY KEY | Unique service identifier |
| 2 | `name` | VARCHAR(100) | NOT NULL | Service name |
| 3 | `icon` | VARCHAR(255) | NULLABLE | Service icon |
| 4 | `route` | VARCHAR(255) | NOT NULL | Frontend route |
| 5 | `status` | VARCHAR(20) | DEFAULT 'active' | Service status |
| 6 | `display_order` | INTEGER | DEFAULT 1 | Display ordering |
| 7 | `clicks` | INTEGER | DEFAULT 0 | Click counter |
| 8 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| 9 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update time |

---

## TABLE 43: `system_settings`
**Feature**: 🎨 CMS, ⚙️ System Configuration

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `key` | VARCHAR(100) | PRIMARY KEY | Setting key |
| 2 | `value` | VARCHAR(255) | NOT NULL | Setting value |

---

## TABLE 44: `support_tickets`
**Feature**: 🎨 CMS, 💼 Partner Support

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique ticket identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Partner |
| 3 | `subject` | VARCHAR(255) | NOT NULL | Ticket subject |
| 4 | `description` | TEXT | NOT NULL | Ticket description |
| 5 | `category` | VARCHAR(100) | NOT NULL | Ticket category |
| 6 | `priority` | VARCHAR(50) | DEFAULT 'medium' | low, medium, high, urgent |
| 7 | `status` | VARCHAR(50) | DEFAULT 'open' | open, in_progress, resolved, closed |
| 8 | `replies` | JSONB | DEFAULT '[]' | Reply thread |
| 9 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| 10 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update time |

* **Indexes**:
  * `idx_support_tickets_partner` ON (`partner_id`)

---

## TABLE 45: `click_tracking`
**Feature**: 📊 Analytics

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `click_id` | UUID | PRIMARY KEY | Unique click identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE SET NULL, NULLABLE | Referring partner |
| 3 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Target product |
| 4 | `bank_id` | UUID | FOREIGN KEY → banks(id) ON DELETE SET NULL, NULLABLE | Target bank |
| 5 | `customer_id` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL, NULLABLE | Customer |
| 6 | `customer_mobile` | VARCHAR(15) | NULLABLE | Customer mobile |
| 7 | `tracking_url` | VARCHAR(1000) | NULLABLE | Tracking URL |
| 8 | `original_url` | VARCHAR(1000) | NULLABLE | Original URL |
| 9 | `ip_address` | VARCHAR(45) | NULLABLE | Client IP |
| 10 | `browser` | VARCHAR(100) | NULLABLE | Browser name |
| 11 | `device` | VARCHAR(50) | NULLABLE | Device type |
| 12 | `operating_system` | VARCHAR(50) | NULLABLE | OS name |
| 13 | `campaign` | VARCHAR(100) | NULLABLE | Campaign name |
| 14 | `referral_source` | VARCHAR(255) | NULLABLE | Traffic source |
| 15 | `location` | VARCHAR(255) | NULLABLE | Geo location |
| 16 | `clicked_at` | TIMESTAMPTZ | DEFAULT NOW() | Click timestamp |
| 17 | `conversion_status` | VARCHAR(20) | DEFAULT 'pending' | pending, converted, expired |

* **Indexes**:
  * `idx_click_tracking_product` ON (`product_id`)
  * `idx_click_tracking_partner` ON (`partner_id`)
  * `idx_click_tracking_clicked_at` ON (`clicked_at`)

---

## TABLE 46: `application_click_logs`
**Feature**: 📊 Analytics

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique click log identifier |
| 2 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Target product |
| 3 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE SET NULL, NULLABLE | Referring partner |
| 4 | `customer_id` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL, NULLABLE | Customer |
| 5 | `application_type` | application_type_enum | NULLABLE | Application type |
| 6 | `ip_address` | VARCHAR(64) | NULLABLE | Client IP |
| 7 | `user_agent` | TEXT | NULLABLE | Browser user agent |
| 8 | `device_type` | VARCHAR(20) | NULLABLE | mobile, desktop, tablet |
| 9 | `browser` | VARCHAR(50) | NULLABLE | Browser name |
| 10 | `clicked_at` | TIMESTAMPTZ | DEFAULT NOW() | Click timestamp |

* **Indexes**:
  * `idx_click_logs_product` ON (`product_id`)
  * `idx_click_logs_partner` ON (`partner_id`)
  * `idx_click_logs_clicked_at` ON (`clicked_at`)

---

## TABLE 47: `service_requests`
**Feature**: 📊 Analytics, 💰 Payments

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | SERIAL | PRIMARY KEY | Unique request identifier |
| 2 | `service_type` | VARCHAR | NOT NULL | Service type |
| 3 | `mobile` | VARCHAR | NULLABLE | Contact mobile |
| 4 | `operator` | VARCHAR | NULLABLE | Service operator |
| 5 | `consumer_number` | VARCHAR | NULLABLE | Consumer number |
| 6 | `provider` | VARCHAR | NULLABLE | Service provider |
| 7 | `loan_number` | VARCHAR | NULLABLE | Loan account number |
| 8 | `vehicle_number` | VARCHAR | NULLABLE | Vehicle registration number |
| 9 | `amount` | DECIMAL(15,2) | NULLABLE | Transaction amount |
| 10 | `status` | VARCHAR | DEFAULT 'pending' | Request status |
| 11 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| 12 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update time |

---

## TABLE 48: `direct_card_applications`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique application identifier |
| 2 | `customer_name` | VARCHAR(255) | NOT NULL | Customer name |
| 3 | `mobile` | VARCHAR(15) | NOT NULL | Customer mobile |
| 4 | `bank_name` | VARCHAR(100) | NOT NULL | Bank name |
| 5 | `card_name` | VARCHAR(100) | NOT NULL | Credit card name |
| 6 | `status` | VARCHAR(50) | DEFAULT 'pending' | Status |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

---

## TABLE 49: `partner_settlements`
**Feature**: 💰 Wallet

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique settlement identifier |
| 2 | `withdrawal_id` | UUID | FOREIGN KEY → wallet_withdrawals(id) | Link to withdrawal |
| 3 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) | Link to partner |
| 4 | `payment_mode` | VARCHAR(50) | NULLABLE | Settlement payment mode |
| 5 | `payment_gateway` | VARCHAR(50) | NULLABLE | Gateway used |
| 6 | `utr_number` | VARCHAR(50) | NULLABLE | Bank UTR number |
| 7 | `bank_reference` | VARCHAR(100) | NULLABLE | Bank reference ID |
| 8 | `settled_at` | TIMESTAMPTZ | NULLABLE | Settlement timestamp |
| 9 | `status` | VARCHAR(50) | DEFAULT 'pending' | Settlement status |

---

## TABLE 50: `payout_logs`
**Feature**: 💰 Wallet

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique log identifier |
| 2 | `withdrawal_id` | UUID | FOREIGN KEY → wallet_withdrawals(id) ON DELETE CASCADE | Link to withdrawal |
| 3 | `api_request` | JSONB | NULLABLE | Raw API request payload |
| 4 | `api_response` | JSONB | NULLABLE | Raw API response payload |
| 5 | `http_status` | INT | NULLABLE | Response HTTP status code |
| 6 | `retry_count` | INT | DEFAULT 0 | Number of API retry attempts |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

---

## TABLE 51: `bank_details_history`
**Feature**: 💼 Partner Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique history entry identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) | Link to partner |
| 3 | `bank_details_id` | UUID | FOREIGN KEY → partner_bank_details(id) | Link to bank detail |
| 4 | `changed_by` | UUID | FOREIGN KEY → users(id) | Action performer |
| 5 | `old_data` | JSONB | NULLABLE | Previous state snapshot |
| 6 | `new_data` | JSONB | NULLABLE | Updated state snapshot |
| 7 | `changed_at` | TIMESTAMPTZ | DEFAULT NOW() | Timestamp of change |

* **Indexes**:
  * `idx_bank_details_history_partner` ON (`partner_id`)

---

## TABLE 52: `wallet_audit_logs` (Trigger-based)
**Feature**: 💰 Wallet, 📊 Analytics

* **Description**: Automatically populated by `audit_wallet_trigger` on `partner_wallets` table changes (see Table 10 for structural details).

---

## TABLE 53: `commission_release_queue` (Cron Processed)
**Feature**: 💰 Wallet & Commission

* **Description**: Queue for scheduled commission releases, automatically processed by hourly cron job for matured commissions (see Table 14 for structural details).

---

## Complete Feature-to-Table Summary

| # | Feature | Tables Count | Tables |
|---|---|---|---|
| 1 | 🔐 Authentication | 5 | `users`, `refresh_tokens`, `otp_verifications`, `msg91_verified_tokens`, `pre_verified_emails` |
| 2 | 🛡️ KYC Verification | 4 | `partner_profiles`, `kyc_documents`, `partner_videos`, `partner_bank_details` |
| 3 | 💼 Partner Management | 5 | `partner_profiles`, `partner_bank_details`, `partner_team_relationships`, `partner_referrals`, `bank_details_history` |
| 4 | 💰 Wallet & Commission | 13 | `partner_wallets`, `wallet_transactions`, `wallet_ledger`, `wallet_withdrawals`, `wallet_audit_logs`, `commission_structures`, `commission_rules`, `commission_ledger`, `commission_release_queue`, `partner_settlements`, `payout_logs`, `withdrawal_requests (view)`, `wallets (view)` |
| 5 | 📋 Lead & Application CRM | 9 | `leads`, `lead_followups`, `customers`, `applications`, `application_timeline`, `application_documents`, `application_notes`, `direct_card_applications` |
| 6 | 🏦 Product & Bank | 5 | `banks`, `products`, `product_application_settings`, `product_link_audits` |
| 7 | 🔔 Notifications | 4 | `notifications`, `notification_preferences`, `notification_templates`, `announcements` |
| 8 | 📊 Analytics | 5 | `audit_logs`, `click_tracking`, `application_click_logs`, `service_requests`, `wallet_audit_logs` |
| 9 | 🎓 Training | 2 | `training_modules`, `partner_training_progress` |
| 10 | 🎨 CMS & Marketing | 6 | `banners`, `homepage_sections`, `marketing_materials`, `services_catalog`, `system_settings`, `support_tickets` |
| 11 | 👥 Team Management | 1 | `partner_team_relationships` |

> **Total Overview**: 53 tables across 11 features with 60+ foreign key relationships and 25+ indexes for query optimization.

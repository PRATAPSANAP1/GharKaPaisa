# Database Schema & Data Dictionary

This document contains the complete database schema definition and data dictionary for all 80+ tables across the system's 15+ features, including constraints, relationships, indexes, and triggers.

**Note**: This schema is dynamically evolving. The actual database structure is defined in `backend/src/database/migrations/migrate.js` and may include additional tables and columns not yet reflected in this documentation.

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
| 6 | `role` | user_role ENUM | NOT NULL, DEFAULT 'PARTNER' | SUPER_ADMIN, ADMIN, EMPLOYEE, PARTNER, TEAM_MEMBER |
| 7 | `status` | user_status ENUM | NOT NULL, DEFAULT 'pending' | pending, active, suspended, rejected, inactive, blocked, pending_verification |
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
| 20 | `locked_until` | TIMESTAMPTZ | NULLABLE | Account lock expiry |
| 21 | `failed_login_attempts` | INTEGER | DEFAULT 0 | Failed login count |
| 22 | `created_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Creator user ID |
| 23 | `last_login` | TIMESTAMPTZ | NULLABLE | Last login timestamp |
| 24 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 25 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

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
| 14 | `kyc_status` | kyc_status ENUM | DEFAULT 'draft' | draft, pending, under_review, approved, rejected |
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
| 39 | `partner_type` | VARCHAR(50) | DEFAULT 'PARTNER' | Partner type |
| 40 | `status` | VARCHAR(50) | DEFAULT 'active' | Partner status |
| 41 | `commission_rate` | DECIMAL(5,2) | DEFAULT 90.00 | Commission rate |
| 42 | `pan_number` | VARCHAR(10) | UNIQUE, NULLABLE | PAN number |
| 43 | `aadhaar_number` | VARCHAR(12) | UNIQUE, NULLABLE | Aadhaar number |
| 44 | `can_create_team` | BOOLEAN | DEFAULT TRUE | Can create team flag |
| 45 | `rank` | VARCHAR(50) | DEFAULT 'Silver' | Partner rank |
| 46 | `referral_bonus_paid` | BOOLEAN | DEFAULT FALSE | Referral bonus paid status |
| 47 | `approved_credit_cards` | INTEGER | DEFAULT 0 | Approved credit cards count |
| 48 | `referred_by_id` | UUID | FOREIGN KEY → partner_profiles(id), NULLABLE | Referring partner |
| 49 | `company_logo_url` | VARCHAR(500) | NULLABLE | Company logo S3 URL |
| 50 | `active_children` | INTEGER | DEFAULT 0 | Active children count |
| 51 | `inactive_children` | INTEGER | DEFAULT 0 | Inactive children count |
| 52 | `verified_children` | INTEGER | DEFAULT 0 | Verified children count |
| 53 | `pending_children` | INTEGER | DEFAULT 0 | Pending children count |
| 54 | `blocked_children` | INTEGER | DEFAULT 0 | Blocked children count |
| 55 | `total_leads` | INTEGER | DEFAULT 0 | Total leads count |
| 56 | `total_applications` | INTEGER | DEFAULT 0 | Total applications count |
| 57 | `total_approved` | INTEGER | DEFAULT 0 | Total approved count |
| 58 | `team_commission` | DECIMAL(15,2) | DEFAULT 0.00 | Team commission amount |
| 59 | `direct_team_count` | INTEGER | DEFAULT 0 | Direct team count |
| 60 | `active_team_count` | INTEGER | DEFAULT 0 | Active team count |
| 61 | `last_team_join` | TIMESTAMPTZ | NULLABLE | Last team join timestamp |
| 62 | `team_enabled` | BOOLEAN | DEFAULT TRUE | Team enabled flag |
| 63 | `referral_enabled` | BOOLEAN | DEFAULT TRUE | Referral enabled flag |
| 64 | `referral_message` | TEXT | DEFAULT 'Join my team on GharKaPaisa and earn highest financial commission payouts!' | Referral message |
| 65 | `referral_banner` | VARCHAR(500) | NULLABLE | Referral banner URL |
| 66 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 67 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

* **Indexes**:
  * `idx_partner_code` ON (`partner_code`)
* **Trigger**: `set_updated_at` BEFORE UPDATE

---

## TABLE 3: `partner_bank_details`
**Feature**: 💼 Partner Management, 🛡️ KYC Verification, 💰 Wallet

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique bank detail identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Partner reference |
| 3 | `bank_name` | VARCHAR(100) | NOT NULL | Bank name |
| 4 | `account_number` | VARCHAR(50) | NOT NULL | Bank account number (encrypted) |
| 5 | `account_holder_name` | VARCHAR(255) | NOT NULL | Account holder name |
| 6 | `ifsc_code` | VARCHAR(20) | NOT NULL | IFSC code |
| 7 | `account_type` | VARCHAR(20) | DEFAULT 'savings' | savings, current |
| 8 | `is_active` | BOOLEAN | DEFAULT TRUE | Active status |
| 9 | `is_primary` | BOOLEAN | DEFAULT FALSE | Primary bank flag |
| 10 | `is_verified` | BOOLEAN | DEFAULT FALSE | Verification status |
| 11 | `verified_at` | TIMESTAMPTZ | NULLABLE | Verification timestamp |
| 12 | `branch_name` | VARCHAR(255) | NULLABLE | Bank branch name |
| 13 | `city` | VARCHAR(100) | NULLABLE | Bank city |
| 14 | `state` | VARCHAR(100) | NULLABLE | Bank state |
| 15 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 16 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

* **Indexes**:
  * `idx_partner_bank_partner` ON (`partner_id`)
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
| 13 | `balance_after_transaction` | DECIMAL(15,2) | DEFAULT 0.00 | Balance after transaction (backup) |
| 14 | `status` | VARCHAR(20) | DEFAULT 'pending' | Pending Approval, Released, Rejected, Cancelled |
| 15 | `description` | VARCHAR(500) | NULLABLE | Transaction description |
| 16 | `remarks` | TEXT | NULLABLE | Additional remarks |
| 17 | `reference_type` | VARCHAR(100) | NULLABLE | Reference category |
| 18 | `reference_id` | VARCHAR(255) | NULLABLE | Reference identifier |
| 19 | `bank_name` | VARCHAR(100) | NULLABLE | Associated bank |
| 20 | `product_type` | VARCHAR(100) | NULLABLE | Product category |
| 21 | `commission_type` | VARCHAR(50) | NULLABLE | Commission category |
| 22 | `processed_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Processing admin |
| 23 | `processed_at` | TIMESTAMPTZ | NULLABLE | Processing timestamp |
| 24 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

* **Indexes**:
  * `idx_wallet_txn_wallet` ON (`wallet_id`)
  * `idx_wallet_txn_status` ON (`status`) WHERE `status = 'pending'`

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
| 8 | `balance_after` | DECIMAL(15,2) | DEFAULT 0.00 | Balance after entry |
| 9 | `balance_after_transaction` | DECIMAL(15,2) | DEFAULT 0.00 | Balance after entry (backup) |
| 10 | `description` | VARCHAR(500) | NULLABLE | Entry description |
| 11 | `reference_number` | VARCHAR(100) | NULLABLE | Reference number |
| 12 | `status` | VARCHAR(50) | DEFAULT 'completed' | Pending Approval, Released, Rejected, Cancelled |
| 13 | `created_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Creator user |
| 14 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

* **Indexes**:
  * `ux_wallet_ledger_application_commission` ON (`application_id`, `transaction_type`) WHERE `application_id IS NOT NULL`

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
| 2 | `application_id` | UUID | FOREIGN KEY → applications(id) ON DELETE SET NULL, NULLABLE | Link to application |
| 3 | `lead_id` | UUID | FOREIGN KEY → leads(id) ON DELETE CASCADE, NULLABLE | Link to lead |
| 4 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Child partner |
| 5 | `parent_partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE SET NULL, NULLABLE | Parent partner |
| 6 | `commission_amount` | DECIMAL(15,2) | DEFAULT 0 | Child commission amount |
| 7 | `override_amount` | DECIMAL(15,2) | DEFAULT 0 | Parent override amount |
| 8 | `status` | VARCHAR(50) | DEFAULT 'pending' | pending, credited, released |
| 9 | `product_name` | VARCHAR(255) | NULLABLE | Product name |
| 10 | `transaction_amount` | DECIMAL(15,2) | DEFAULT 0 | Transaction amount |
| 11 | `commission_rate` | DECIMAL(15,2) | DEFAULT 0 | Commission rate |
| 12 | `commission_earned` | DECIMAL(15,2) | DEFAULT 0 | Commission earned |
| 13 | `customer_id` | UUID | NULLABLE | Customer ID |
| 14 | `bank_id` | UUID | NULLABLE | Bank ID |
| 15 | `product_id` | UUID | NULLABLE | Product ID |
| 16 | `team_member_id` | UUID | NULLABLE | Team member ID |
| 17 | `commission_rule_id` | UUID | NULLABLE | Commission rule ID |
| 18 | `total_commission` | DECIMAL(15,2) | NULLABLE | Total commission |
| 19 | `partner_pct` | DECIMAL(5,2) | NULLABLE | Partner percentage |
| 20 | `team_member_pct` | DECIMAL(5,2) | NULLABLE | Team member percentage |
| 21 | `partner_amount` | DECIMAL(15,2) | NULLABLE | Partner amount |
| 22 | `team_member_amount` | DECIMAL(15,2) | NULLABLE | Team member amount |
| 23 | `approved_at` | TIMESTAMPTZ | NULLABLE | Approval timestamp |
| 24 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

* **Indexes**:
  * `idx_comm_ledger_app` ON (`application_id`)
  * `idx_comm_ledger_lead` ON (`lead_id`)

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
| 10 | `status` | application_status ENUM | DEFAULT 'submitted' | draft, link_sent, submitted, under_review, verification_completed, approved, rejected, disbursed, confirmed |
| 11 | `bank_ref_number` | VARCHAR(100) | NULLABLE | Bank reference number |
| 12 | `bank_application_number` | VARCHAR(100) | NULLABLE | Bank application number |
| 13 | `loan_amount` | DECIMAL(15,2) | NULLABLE | Requested loan amount |
| 14 | `approved_amount` | DECIMAL(15,2) | NULLABLE | Approved amount |
| 15 | `credit_limit` | DECIMAL(15,2) | NULLABLE | Credit card limit |
| 16 | `interest_rate` | DECIMAL(5,2) | NULLABLE | Interest rate |
| 17 | `tenure_months` | INT | NULLABLE | Loan tenure |
| 18 | `disbursal_date` | DATE | NULLABLE | Disbursal date |
| 19 | `rejection_reason` | TEXT | NULLABLE | Rejection reason |
| 20 | `notes` | TEXT | NULLABLE | Admin notes |
| 21 | `documents` | JSONB | DEFAULT '[]' | Document references |
| 22 | `status_history` | JSONB | DEFAULT '[]' | Status change log |
| 23 | `commission_amount` | DECIMAL(12,2) | NULLABLE | Commission earned |
| 24 | `commission_status` | commission_status ENUM | DEFAULT 'pending' | pending, approved, rejected, processed |
| 25 | `submitted_at` | TIMESTAMPTZ | NULLABLE | Submission timestamp |
| 26 | `approved_at` | TIMESTAMPTZ | NULLABLE | Approval timestamp |
| 27 | `commission_received_at` | TIMESTAMPTZ | NULLABLE | Commission receipt time |
| 28 | `commission_paid_at` | TIMESTAMPTZ | NULLABLE | Commission payout time |
| 29 | `process_type` | VARCHAR(100) | DEFAULT 'partner_cell' | Canonical workflow: partner_cell, punching, linked_share, direct_bank, physical_process |
| 30 | `process_by` | VARCHAR(50) | DEFAULT 'punching' | Initiator entity: partner, customer, operations |
| 31 | `source` | VARCHAR(100) | DEFAULT 'partner_portal' | Origin channel: partner_portal, share_link, bank_redirect, physical |
| 32 | `form_status` | VARCHAR(100) | DEFAULT 'pending' | Customer form progress: pending, in_progress, completed |
| 33 | `final_status` | VARCHAR(50) | NULLABLE | Bank/ops outcome: pending, approved, rejected, declined, in_process, technical_error |
| 34 | `business_type` | VARCHAR(100) | NULLABLE | Business type |
| 35 | `gst_number` | VARCHAR(50) | NULLABLE | GST number |
| 36 | `trade_license_number` | VARCHAR(50) | NULLABLE | Trade license number |
| 37 | `company_name` | VARCHAR(255) | NULLABLE | Company name |
| 38 | `pincode` | VARCHAR(10) | NULLABLE | Pincode |
| 39 | `city` | VARCHAR(100) | NULLABLE | City |
| 40 | `state` | VARCHAR(100) | NULLABLE | State |
| 41 | `country_code` | VARCHAR(10) | DEFAULT '+91' | Country code |
| 42 | `agree_terms` | BOOLEAN | DEFAULT TRUE | Terms agreed |
| 43 | `vkyc_status` | VARCHAR(50) | DEFAULT 'Pending' | VKYC status |
| 44 | `vkyc_url` | VARCHAR(1000) | NULLABLE | VKYC URL |
| 45 | `salary_slip_url` | VARCHAR(1000) | NULLABLE | Salary slip URL |
| 46 | `pan_card_url` | VARCHAR(1000) | NULLABLE | PAN card URL |
| 47 | `pan_number` | VARCHAR(50) | NULLABLE | PAN number |
| 48 | `monthly_salary` | NUMERIC(15,2) | NULLABLE | Monthly salary |
| 49 | `metadata` | JSONB | DEFAULT '{}' | Additional metadata |
| 50 | `remarks` | TEXT | NULLABLE | Additional remarks |
| 51 | `soft_approval_status` | VARCHAR(50) | NULLABLE | Soft approval status |
| 52 | `vkyc_stage` | VARCHAR(50) | NULLABLE | VKYC stage |
| 53 | `iqa_stage` | VARCHAR(50) | NULLABLE | IQA stage |
| 54 | `dispatch_status` | VARCHAR(50) | NULLABLE | Dispatch status |
| 55 | `bank_remark` | TEXT | NULLABLE | Bank remarks |
| 56 | `final_status` | VARCHAR(50) | NULLABLE | Final status |
| 57 | `decline_reason` | TEXT | NULLABLE | Decline reason |
| 58 | `eligible_reqd` | VARCHAR(50) | NULLABLE | Eligibility required |
| 59 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 60 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

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
| 3 | `event_type` | VARCHAR(100) | NULLABLE | Event type |
| 4 | `title` | VARCHAR(255) | NULLABLE | Event title |
| 5 | `description` | TEXT | NULLABLE | Event description |
| 6 | `actor_type` | VARCHAR(50) | DEFAULT 'system' | Actor type |
| 7 | `actor_id` | UUID | NULLABLE | Actor ID |
| 8 | `metadata` | JSONB | DEFAULT '{}' | Additional metadata |
| 9 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**:
  * `idx_app_timeline_app` ON (`application_id`)
  * `idx_app_timeline_created` ON (`created_at` ASC)

---

## TABLE 17: `application_documents`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique document identifier |
| 2 | `application_id` | UUID | FOREIGN KEY → applications(id) ON DELETE CASCADE, NOT NULL | Link to application |
| 3 | `document_type` | VARCHAR(100) | NOT NULL | Document category |
| 4 | `file_url` | TEXT | NOT NULL | File URL |
| 5 | `file_name` | VARCHAR(255) | NOT NULL | File name |
| 6 | `mime_type` | VARCHAR(100) | NOT NULL | MIME type |
| 7 | `status` | VARCHAR(50) | DEFAULT 'uploaded' | Document status |
| 8 | `uploaded_by_customer` | BOOLEAN | DEFAULT TRUE | Uploaded by customer |
| 9 | `uploaded_at` | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |
| 10 | `verified_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Verifier |
| 11 | `verified_at` | TIMESTAMPTZ | NULLABLE | Verification timestamp |
| 12 | `rejection_reason` | TEXT | NULLABLE | Rejection reason |
| 13 | `version` | INT | DEFAULT 1 | Document version |
| 14 | `is_latest` | BOOLEAN | DEFAULT TRUE | Latest version flag |

* **Indexes**:
  * `idx_app_docs_app` ON (`application_id`)
  * `idx_app_docs_type` ON (`document_type`)

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
| 6 | `pan_number` | VARCHAR(20) | NULLABLE | PAN card number |
| 7 | `aadhaar_last4` | VARCHAR(4) | NULLABLE | Last 4 digits of Aadhaar |
| 8 | `city` | VARCHAR(100) | NULLABLE | City of residence |
| 9 | `state` | VARCHAR(100) | NULLABLE | State of residence |
| 10 | `pincode` | VARCHAR(10) | NULLABLE | Postal code |
| 11 | `monthly_income` | DECIMAL(15,2) | NULLABLE | Monthly income |
| 12 | `employer` | VARCHAR(255) | NULLABLE | Employer name |
| 13 | `employment_type` | VARCHAR(50) | NULLABLE | salaried, self_employed, business |
| 14 | `company_name` | VARCHAR(255) | NULLABLE | Company name |
| 15 | `business_type` | VARCHAR(100) | NULLABLE | Business type |
| 16 | `gst_number` | VARCHAR(50) | NULLABLE | GST number |
| 17 | `trade_license_number` | VARCHAR(50) | NULLABLE | Trade license number |
| 18 | `income` | DECIMAL(15,2) | NULLABLE | Income |
| 19 | `address` | TEXT | NULLABLE | Address |
| 20 | `employment` | VARCHAR(100) | NULLABLE | Employment type |
| 21 | `created_by` | UUID | FOREIGN KEY → users(id), NOT NULL | Creator user |
| 22 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 23 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

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
| 8 | `process_by` | VARCHAR(50) | DEFAULT 'punching' | Process by |
| 9 | `process_type` | VARCHAR(50) | DEFAULT 'lead_punching' | Process type |
| 10 | `otp_attempts` | INT | DEFAULT 0 | OTP attempts |
| 11 | `otp_sent_count` | INT | DEFAULT 1 | OTP sent count |
| 12 | `last_otp_sent_at` | TIMESTAMPTZ | DEFAULT NOW() | Last OTP sent |
| 13 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 14 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

* **Indexes**:
  * `idx_leads_partner` ON (`partner_id`)
  * `idx_active_lead_product_mobile` ON (`product_id`, `mobile`) WHERE `status NOT IN ('rejected', 'cancelled')`
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
| 3 | `short_code` | VARCHAR(100) | UNIQUE, NOT NULL | Bank short code |
| 4 | `logo_url` | VARCHAR(500) | NULLABLE | Bank logo S3 URL |
| 5 | `website_url` | VARCHAR(500) | NULLABLE | Bank website URL |
| 6 | `bank_code` | VARCHAR(50) | NULLABLE | Bank code |
| 7 | `status` | VARCHAR(50) | DEFAULT 'Active' | Bank status |
| 8 | `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| 9 | `display_order` | INT | DEFAULT 0 | Display order |
| 10 | `hero_title` | VARCHAR(255) | NULLABLE | Hero title |
| 11 | `hero_description` | TEXT | NULLABLE | Hero description |
| 12 | `theme_color` | VARCHAR(100) | NULLABLE | Theme color |
| 13 | `banner` | VARCHAR(500) | NULLABLE | Banner URL |
| 14 | `seo_title` | VARCHAR(255) | NULLABLE | SEO title |
| 15 | `seo_description` | TEXT | NULLABLE | SEO description |
| 16 | `secondary_color` | VARCHAR(100) | NULLABLE | Secondary color |
| 17 | `gradient` | VARCHAR(255) | NULLABLE | Gradient |
| 18 | `button_color` | VARCHAR(100) | NULLABLE | Button color |
| 19 | `accent_color` | VARCHAR(100) | NULLABLE | Accent color |
| 20 | `operation_head_id` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL, NULLABLE | Operation head |
| 21 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 22 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

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
| 7 | `long_description` | TEXT | NULLABLE | Long description |
| 8 | `features` | JSONB | DEFAULT '[]' | Product features |
| 9 | `features_list` | JSONB | DEFAULT '[]' | Features list |
| 10 | `eligibility` | JSONB | DEFAULT '{}' | Eligibility criteria |
| 11 | `eligibility_criteria` | TEXT | NULLABLE | Text eligibility |
| 12 | `documents_required` | TEXT | NULLABLE | Required documents |
| 13 | `documents_list` | JSONB | DEFAULT '[]' | Documents list |
| 14 | `benefits` | TEXT | NULLABLE | Product benefits |
| 15 | `benefits_list` | JSONB | DEFAULT '[]' | Benefits list |
| 16 | `fees_charges` | TEXT | NULLABLE | Fees and charges |
| 17 | `commission_type` | VARCHAR(20) | DEFAULT 'fixed' | fixed, percentage |
| 18 | `commission_value` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Commission amount/rate |
| 19 | `commission_enabled` | BOOLEAN | DEFAULT TRUE | Commission flag |
| 20 | `commission_amount` | DECIMAL(12,2) | DEFAULT 0 | Default commission |
| 21 | `override_percentage` | DECIMAL(5,2) | DEFAULT 0 | Override % |
| 22 | `min_age` | INT | NULLABLE | Minimum age |
| 23 | `max_age` | INT | NULLABLE | Maximum age |
| 24 | `min_income` | DECIMAL(15,2) | NULLABLE | Minimum income |
| 25 | `max_income` | DECIMAL(15,2) | NULLABLE | Maximum income |
| 26 | `min_cibil_score` | INT | NULLABLE | Minimum CIBIL score |
| 27 | `max_cibil_score` | INT | NULLABLE | Maximum CIBIL score |
| 28 | `interest_rate` | DECIMAL | NULLABLE | Interest rate |
| 29 | `processing_fee` | VARCHAR | NULLABLE | Processing fee |
| 30 | `gst_applicable` | BOOLEAN | NULLABLE | GST applicable |
| 31 | `annual_fee` | VARCHAR(255) | NULLABLE | Annual fee |
| 32 | `time_period` | VARCHAR(255) | NULLABLE | Offer period |
| 33 | `joining_fee` | VARCHAR(255) | NULLABLE | Joining fee |
| 34 | `rewards` | TEXT | NULLABLE | Rewards |
| 35 | `cashback` | TEXT | NULLABLE | Cashback |
| 36 | `lounge_access` | TEXT | NULLABLE | Lounge access |
| 37 | `fuel_surcharge` | TEXT | NULLABLE | Fuel surcharge |
| 38 | `travel_benefits` | TEXT | NULLABLE | Travel benefits |
| 39 | `company_margin` | DECIMAL(12,2) | DEFAULT 0 | Company margin |
| 40 | `hold_days` | INT | DEFAULT 7 | Hold days |
| 41 | `approval_rate` | INT | DEFAULT 0 | Approval rate |
| 42 | `trending` | BOOLEAN | DEFAULT FALSE | Trending flag |
| 43 | `internal_notes` | TEXT | NULLABLE | Internal notes |
| 44 | `key_features` | TEXT | NULLABLE | Key features |
| 45 | `seo_keywords` | VARCHAR(500) | NULLABLE | SEO keywords |
| 46 | `faq_items` | JSONB | DEFAULT '[]' | FAQ items |
| 47 | `schema_markup` | JSONB | DEFAULT '{}' | Schema markup |
| 48 | `image_url` | VARCHAR(500) | NULLABLE | Product image |
| 49 | `logo` | VARCHAR(500) | NULLABLE | Product logo |
| 50 | `banner` | VARCHAR(500) | NULLABLE | Banner image |
| 51 | `image` | VARCHAR(500) | NULLABLE | Image |
| 52 | `banner_url` | VARCHAR(500) | NULLABLE | Banner URL |
| 53 | `card_image_url` | VARCHAR(500) | NULLABLE | Card image URL |
| 54 | `thumbnail_url` | VARCHAR(500) | NULLABLE | Thumbnail URL |
| 55 | `slug` | VARCHAR(255) | NULLABLE | URL slug |
| 56 | `sub_category` | VARCHAR(100) | NULLABLE | Sub category |
| 57 | `fees_structure` | JSONB | DEFAULT '{}' | Fees structure |
| 58 | `eligibility_criteria` | JSONB | DEFAULT '{}' | Eligibility criteria JSON |
| 59 | `commissions_json` | JSONB | DEFAULT '{}' | Commissions JSON |
| 60 | `compare_specs` | JSONB | DEFAULT '{}' | Compare specs |
| 61 | `visibility` | JSONB | DEFAULT '{"show_on_website":true,"show_in_partner":true,"is_featured":false,"is_popular":false}' | Visibility settings |
| 62 | `seo_metadata` | JSONB | DEFAULT '{}' | SEO metadata |
| 63 | `public_url` | VARCHAR(1000) | NULLABLE | Public page URL |
| 64 | `partner_url` | VARCHAR(1000) | NULLABLE | Partner page URL |
| 65 | `application_url` | VARCHAR(1000) | NULLABLE | Application URL |
| 66 | `apply_url` | VARCHAR(1000) | NULLABLE | Apply URL |
| 67 | `redirect_url` | VARCHAR(1000) | NULLABLE | Redirect URL |
| 68 | `partner_share_value` | DECIMAL(12,2) | DEFAULT 0 | Partner share value |
| 69 | `team_member_share_value` | DECIMAL(12,2) | DEFAULT 0 | Team member share value |
| 70 | `tracking_enabled` | BOOLEAN | DEFAULT TRUE | Click tracking |
| 71 | `button_text` | VARCHAR(100) | DEFAULT 'Apply Now' | Button label |
| 72 | `apply_button_text` | VARCHAR(100) | DEFAULT 'Apply Now' | Apply button text |
| 73 | `redirect_type` | VARCHAR(20) | DEFAULT 'new_tab' | Redirect behavior |
| 74 | `utm_source` | VARCHAR(100) | NULLABLE | UTM source |
| 75 | `utm_medium` | VARCHAR(100) | NULLABLE | UTM medium |
| 76 | `utm_campaign` | VARCHAR(100) | NULLABLE | UTM campaign |
| 77 | `featured` | BOOLEAN | DEFAULT FALSE | Featured flag |
| 78 | `public_visible` | BOOLEAN | DEFAULT TRUE | Public visibility |
| 79 | `partner_visible` | BOOLEAN | DEFAULT TRUE | Partner visibility |
| 80 | `seo_title` | VARCHAR(255) | NULLABLE | SEO title |
| 81 | `seo_description` | VARCHAR(500) | NULLABLE | SEO description |
| 82 | `seo_keywords` | VARCHAR(500) | NULLABLE | SEO keywords |
| 83 | `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| 84 | `status` | VARCHAR(50) | DEFAULT 'Active' | Product status |
| 85 | `display_order` | INT | DEFAULT 0 | Display ordering |
| 86 | `priority` | INT | DEFAULT 0 | Priority level |
| 87 | `operation_head_id` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL, NULLABLE | Operation head |
| 88 | `created_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Creator |
| 89 | `updated_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Updater |
| 90 | `last_updated_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Last updater |
| 91 | `last_updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update time |
| 92 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| 93 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update time |

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
| 3 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NULLABLE | Target partner |
| 4 | `user_role` | VARCHAR(50) | NULLABLE | Target role filter |
| 5 | `title` | VARCHAR(255) | NOT NULL | Notification title |
| 6 | `message` | TEXT | NOT NULL | Notification body |
| 7 | `type` | VARCHAR(50) | DEFAULT 'info' | info, success, warning, alert |
| 8 | `category` | VARCHAR(50) | DEFAULT 'system' | Notification category |
| 9 | `priority` | VARCHAR(20) | DEFAULT 'normal' | normal, high, urgent |
| 10 | `status` | VARCHAR(20) | DEFAULT 'sent' | sent, delivered, read |
| 11 | `channel` | VARCHAR(50) | DEFAULT 'in-app' | in-app, email, sms |
| 12 | `is_read` | BOOLEAN | DEFAULT FALSE | Read status |
| 13 | `read_at` | TIMESTAMPTZ | NULLABLE | Read timestamp |
| 14 | `link` | VARCHAR(500) | NULLABLE | Action link |
| 15 | `redirect_url` | VARCHAR(500) | NULLABLE | Redirect URL |
| 16 | `icon` | VARCHAR(100) | NULLABLE | Notification icon |
| 17 | `action_url` | TEXT | NULLABLE | Action URL |
| 18 | `reference_type` | VARCHAR(100) | NULLABLE | Reference type |
| 19 | `reference_id` | UUID | NULLABLE | Reference ID |
| 20 | `archived_at` | TIMESTAMPTZ | NULLABLE | Archive timestamp |
| 21 | `expires_at` | TIMESTAMPTZ | NULLABLE | Expiry timestamp |
| 22 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

* **Indexes**:
  * `idx_notifications_user` ON (`user_id`, `is_read`)

---

## TABLE 27: `notification_preferences`
**Feature**: 🔔 Notifications

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `user_id` | UUID | PRIMARY KEY, FOREIGN KEY → users(id) ON DELETE CASCADE | Target user |
| 2 | `email_enabled` | BOOLEAN | DEFAULT TRUE | Email notifications |
| 3 | `sms_enabled` | BOOLEAN | DEFAULT TRUE | SMS notifications |
| 4 | `browser_enabled` | BOOLEAN | DEFAULT TRUE | Browser notifications |
| 5 | `push_enabled` | BOOLEAN | DEFAULT TRUE | Push notifications |
| 6 | `wallet_notifications` | BOOLEAN | DEFAULT TRUE | Wallet alerts |
| 7 | `commission_notifications` | BOOLEAN | DEFAULT TRUE | Commission alerts |
| 8 | `application_notifications` | BOOLEAN | DEFAULT TRUE | Application updates |
| 9 | `marketing_notifications` | BOOLEAN | DEFAULT TRUE | Marketing emails |
| 10 | `system_notifications` | BOOLEAN | DEFAULT TRUE | System alerts |
| 11 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update timestamp |

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
| 3 | `role` | VARCHAR(50) | NULLABLE | Performer role |
| 4 | `module` | VARCHAR(100) | NOT NULL | Module name |
| 5 | `action` | VARCHAR(100) | NOT NULL | Action name |
| 6 | `old_data` | JSONB | NULLABLE | Previous data |
| 7 | `new_data` | JSONB | NULLABLE | New data |
| 8 | `ip` | VARCHAR(45) | NULLABLE | IP address |
| 9 | `device` | VARCHAR(100) | NULLABLE | Device info |
| 10 | `browser` | VARCHAR(100) | NULLABLE | Browser info |
| 11 | `user_agent` | VARCHAR(500) | NULLABLE | User agent |
| 12 | `request_details` | JSONB | NULLABLE | Request details |
| 13 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

* **Indexes**:
  * `idx_audit_logs_user` ON (`user_id`)
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
  * `idx_team_rels_parent_level` ON (`parent_partner_id`, `level`)

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
| 2 | `value` | TEXT | NOT NULL | Setting value |
| 3 | `value_type` | VARCHAR(50) | NULLABLE | Value type |
| 4 | `description` | TEXT | NULLABLE | Setting description |
| 5 | `last_updated_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Last updater |
| 6 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update timestamp |

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

## TABLE 54: `report_cache`
**Feature**: 📊 Analytics

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique cache identifier |
| 2 | `report_key` | VARCHAR(255) | UNIQUE, NOT NULL | Report cache key |
| 3 | `report_data` | JSONB | NOT NULL | Cached report data |
| 4 | `generated_at` | TIMESTAMPTZ | DEFAULT NOW() | Generation timestamp |
| 5 | `expires_at` | TIMESTAMPTZ | NULLABLE | Expiry timestamp |

---

## TABLE 55: `report_exports`
**Feature**: 📊 Analytics

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique export identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE | Partner |
| 3 | `report_type` | VARCHAR(100) | NOT NULL | Report type |
| 4 | `format` | VARCHAR(20) | NOT NULL | Export format |
| 5 | `file_name` | VARCHAR(255) | NOT NULL | File name |
| 6 | `storage_path` | TEXT | NULLABLE | Storage path |
| 7 | `generated_at` | TIMESTAMPTZ | DEFAULT NOW() | Generation timestamp |
| 8 | `downloaded_at` | TIMESTAMPTZ | NULLABLE | Download timestamp |
| 9 | `status` | VARCHAR(20) | DEFAULT 'completed' | Export status |

* **Indexes**: `idx_report_exports_partner` ON (`partner_id`)

---

## TABLE 56: `scheduled_reports`
**Feature**: 📊 Analytics

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique schedule identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE | Partner |
| 3 | `report_type` | VARCHAR(100) | NOT NULL | Report type |
| 4 | `frequency` | VARCHAR(20) | DEFAULT 'monthly' | Report frequency |
| 5 | `recipient_email` | VARCHAR(255) | NOT NULL | Recipient email |
| 6 | `next_run` | TIMESTAMPTZ | NULLABLE | Next run time |
| 7 | `last_run` | TIMESTAMPTZ | NULLABLE | Last run time |
| 8 | `status` | VARCHAR(20) | DEFAULT 'active' | Schedule status |
| 9 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_sched_reports_partner` ON (`partner_id`)

---

## TABLE 57: `activity_logs`
**Feature**: 📊 Analytics

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique log identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Partner |
| 3 | `activity_type` | VARCHAR(100) | NOT NULL | Activity type |
| 4 | `module` | VARCHAR(100) | DEFAULT 'system' | Module name |
| 5 | `title` | VARCHAR(255) | NOT NULL | Activity title |
| 6 | `description` | TEXT | NULLABLE | Activity description |
| 7 | `reference_id` | UUID | NULLABLE | Reference ID |
| 8 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| 9 | `performed_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Performer |

* **Indexes**: `idx_act_logs_partner` ON (`partner_id`)

---

## TABLE 58: `broadcast_notifications`
**Feature**: 🔔 Notifications

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique broadcast identifier |
| 2 | `title` | VARCHAR(255) | NOT NULL | Broadcast title |
| 3 | `message` | TEXT | NOT NULL | Broadcast message |
| 4 | `target` | VARCHAR(50) | DEFAULT 'all' | Target audience |
| 5 | `priority` | VARCHAR(20) | DEFAULT 'information' | Priority level |
| 6 | `scheduled_at` | TIMESTAMPTZ | NULLABLE | Schedule time |
| 7 | `expires_at` | TIMESTAMPTZ | NULLABLE | Expiry time |
| 8 | `status` | VARCHAR(20) | DEFAULT 'active' | Broadcast status |
| 9 | `created_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Creator |
| 10 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

---

## TABLE 59: `login_activity`
**Feature**: 🔐 Authentication

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique login identifier |
| 2 | `user_id` | UUID | FOREIGN KEY → users(id) ON DELETE CASCADE, NOT NULL | User |
| 3 | `ip_address` | VARCHAR(45) | NULLABLE | IP address |
| 4 | `device` | VARCHAR(100) | NULLABLE | Device info |
| 5 | `browser` | VARCHAR(100) | NULLABLE | Browser info |
| 6 | `location` | VARCHAR(100) | NULLABLE | Location |
| 7 | `status` | VARCHAR(20) | DEFAULT 'success' | Login status |
| 8 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_login_act_user` ON (`user_id`)

---

## TABLE 60: `referral_campaigns`
**Feature**: 💼 Partner Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique campaign identifier |
| 2 | `campaign_name` | VARCHAR(255) | NOT NULL | Campaign name |
| 3 | `campaign_code` | VARCHAR(100) | UNIQUE, NOT NULL | Campaign code |
| 4 | `description` | TEXT | NULLABLE | Campaign description |
| 5 | `start_date` | TIMESTAMPTZ | NULLABLE | Start date |
| 6 | `end_date` | TIMESTAMPTZ | NULLABLE | End date |
| 7 | `status` | VARCHAR(50) | DEFAULT 'ACTIVE' | Campaign status |
| 8 | `target` | INT | DEFAULT 0 | Target count |
| 9 | `bonus_type` | VARCHAR(50) | NULLABLE | Bonus type |
| 10 | `bonus_amount` | DECIMAL(15,2) | DEFAULT 0.00 | Bonus amount |
| 11 | `created_by` | UUID | FOREIGN KEY → users(id) | Creator |
| 12 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| 13 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update timestamp |

---

## TABLE 61: `registration_logs`
**Feature**: 🔐 Authentication

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique log identifier |
| 2 | `email` | VARCHAR(255) | NULLABLE | Email address |
| 3 | `mobile` | VARCHAR(15) | NULLABLE | Mobile number |
| 4 | `referral_code` | VARCHAR(50) | NULLABLE | Referral code |
| 5 | `parent_partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE SET NULL | Parent partner |
| 6 | `status` | VARCHAR(50) | NULLABLE | Registration status |
| 7 | `failure_reason` | TEXT | NULLABLE | Failure reason |
| 8 | `ip_address` | VARCHAR(45) | NULLABLE | IP address |
| 9 | `device` | VARCHAR(255) | NULLABLE | Device info |
| 10 | `browser` | VARCHAR(255) | NULLABLE | Browser info |
| 11 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

---

## TABLE 62: `invitation_history`
**Feature**: 💼 Partner Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique invitation identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE | Partner |
| 3 | `invite_type` | VARCHAR(50) | NULLABLE | Invitation type |
| 4 | `recipient_name` | VARCHAR(255) | NULLABLE | Recipient name |
| 5 | `recipient_email` | VARCHAR(255) | NULLABLE | Recipient email |
| 6 | `recipient_mobile` | VARCHAR(15) | NULLABLE | Recipient mobile |
| 7 | `referral_code` | VARCHAR(50) | NULLABLE | Referral code |
| 8 | `status` | VARCHAR(50) | DEFAULT 'PENDING' | Invitation status |
| 9 | `sent_at` | TIMESTAMPTZ | DEFAULT NOW() | Sent timestamp |
| 10 | `opened_at` | TIMESTAMPTZ | NULLABLE | Opened timestamp |
| 11 | `registered_at` | TIMESTAMPTZ | NULLABLE | Registered timestamp |
| 12 | `expired_at` | TIMESTAMPTZ | NULLABLE | Expiry timestamp |

---

## TABLE 63: `blacklist`
**Feature**: 🔐 Authentication

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique entry identifier |
| 2 | `type` | VARCHAR(50) | NULLABLE | Blacklist type |
| 3 | `value` | VARCHAR(255) | UNIQUE, NOT NULL | Blacklisted value |
| 4 | `reason` | TEXT | NULLABLE | Blacklist reason |
| 5 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

---

## TABLE 64: `product_features`
**Feature**: 🏦 Product & Bank Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique feature identifier |
| 2 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Product |
| 3 | `title` | VARCHAR(255) | NOT NULL | Feature title |
| 4 | `description` | TEXT | NULLABLE | Feature description |
| 5 | `icon` | VARCHAR(100) | NULLABLE | Feature icon |
| 6 | `display_order` | INT | DEFAULT 0 | Display order |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_prod_features_product` ON (`product_id`)

---

## TABLE 65: `product_documents`
**Feature**: 🏦 Product & Bank Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique document identifier |
| 2 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Product |
| 3 | `title` | VARCHAR(255) | NOT NULL | Document title |
| 4 | `document_type` | VARCHAR(50) | DEFAULT 'brochure' | Document type |
| 5 | `file_url` | VARCHAR(500) | NOT NULL | File URL |
| 6 | `file_size` | INT | NULLABLE | File size |
| 7 | `display_order` | INT | DEFAULT 0 | Display order |
| 8 | `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| 9 | `uploaded_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Uploader |
| 10 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_prod_docs_product` ON (`product_id`)

---

## TABLE 66: `product_faq`
**Feature**: 🏦 Product & Bank Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique FAQ identifier |
| 2 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Product |
| 3 | `question` | TEXT | NOT NULL | FAQ question |
| 4 | `answer` | TEXT | NOT NULL | FAQ answer |
| 5 | `display_order` | INT | DEFAULT 0 | Display order |
| 6 | `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| 8 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update timestamp |

* **Indexes**: `idx_prod_faq_product` ON (`product_id`)

---

## TABLE 67: `product_videos`
**Feature**: 🏦 Product & Bank Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique video identifier |
| 2 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Product |
| 3 | `title` | VARCHAR(255) | NOT NULL | Video title |
| 4 | `youtube_url` | VARCHAR(500) | NULLABLE | YouTube URL |
| 5 | `video_url` | VARCHAR(500) | NULLABLE | Video URL |
| 6 | `thumbnail_url` | VARCHAR(500) | NULLABLE | Thumbnail URL |
| 7 | `duration` | VARCHAR(20) | NULLABLE | Video duration |
| 8 | `display_order` | INT | DEFAULT 0 | Display order |
| 9 | `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| 10 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_prod_videos_product` ON (`product_id`)

---

## TABLE 68: `product_offers`
**Feature**: 🏦 Product & Bank Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique offer identifier |
| 2 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Product |
| 3 | `title` | VARCHAR(255) | NOT NULL | Offer title |
| 4 | `description` | TEXT | NULLABLE | Offer description |
| 5 | `offer_type` | VARCHAR(50) | DEFAULT 'discount' | Offer type |
| 6 | `discount_value` | DECIMAL(12,2) | DEFAULT 0 | Discount value |
| 7 | `start_date` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Start date |
| 8 | `end_date` | TIMESTAMPTZ | NOT NULL | End date |
| 9 | `badge_text` | VARCHAR(100) | NULLABLE | Badge text |
| 10 | `banner_url` | VARCHAR(500) | NULLABLE | Banner URL |
| 11 | `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| 12 | `created_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Creator |
| 13 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| 14 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update timestamp |

* **Indexes**: `idx_prod_offers_product` ON (`product_id`), `idx_prod_offers_active` ON (`is_active`, `start_date`, `end_date`)

---

## TABLE 69: `product_ratings`
**Feature**: 🏦 Product & Bank Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique rating identifier |
| 2 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Product |
| 3 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Partner |
| 4 | `rating` | INT | NOT NULL, CHECK (rating >= 1 AND rating <= 5) | Rating (1-5) |
| 5 | `feedback` | TEXT | NULLABLE | Feedback text |
| 6 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Constraints**: `UNIQUE(product_id, partner_id)`
* **Indexes**: `idx_prod_ratings_product` ON (`product_id`)

---

## TABLE 70: `product_share_logs`
**Feature**: 🏦 Product & Bank Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique share log identifier |
| 2 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Product |
| 3 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Partner |
| 4 | `share_method` | VARCHAR(50) | NOT NULL | Share method |
| 5 | `customer_contact` | VARCHAR(255) | NULLABLE | Customer contact |
| 6 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_prod_share_partner` ON (`partner_id`)

---

## TABLE 71: `partner_saved_products`
**Feature**: 🏦 Product & Bank Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique bookmark identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Partner |
| 3 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Product |
| 4 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Constraints**: `UNIQUE(partner_id, product_id)`
* **Indexes**: `idx_saved_partner` ON (`partner_id`)

---

## TABLE 72: `partner_recent_products`
**Feature**: 🏦 Product & Bank Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique recent view identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Partner |
| 3 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Product |
| 4 | `last_viewed_at` | TIMESTAMPTZ | DEFAULT NOW() | Last viewed timestamp |

* **Constraints**: `UNIQUE(partner_id, product_id)`
* **Indexes**: `idx_recent_partner` ON (`partner_id`)

---

## TABLE 73: `product_views`
**Feature**: 🏦 Product & Bank Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique view identifier |
| 2 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Product |
| 3 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE SET NULL | Partner |
| 4 | `viewer_ip` | VARCHAR(45) | NULLABLE | Viewer IP |
| 5 | `user_agent` | TEXT | NULLABLE | User agent |
| 6 | `viewed_at` | TIMESTAMPTZ | DEFAULT NOW() | Viewed timestamp |

* **Indexes**: `idx_prod_views_product` ON (`product_id`), `idx_prod_views_date` ON (`viewed_at`)

---

## TABLE 74: `partner_preferences`
**Feature**: 🏦 Product & Bank Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique preference identifier |
| 2 | `partner_id` | UUID | UNIQUE, FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE | Partner |
| 3 | `preferred_categories` | JSONB | DEFAULT '[]' | Preferred categories |
| 4 | `preferred_banks` | JSONB | DEFAULT '[]' | Preferred banks |
| 5 | `preferred_commission_type` | VARCHAR(20) | NULLABLE | Preferred commission type |
| 6 | `min_commission` | DECIMAL(12,2) | DEFAULT 0 | Minimum commission |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| 8 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update timestamp |

---

## TABLE 75: `customer_access_tokens`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique token identifier |
| 2 | `application_id` | UUID | FOREIGN KEY → applications(id) ON DELETE CASCADE, NOT NULL | Application |
| 3 | `customer_id` | UUID | FOREIGN KEY → customers(id) ON DELETE CASCADE | Customer |
| 4 | `token` | VARCHAR(255) | UNIQUE, NOT NULL | Access token |
| 5 | `expires_at` | TIMESTAMPTZ | NOT NULL | Expiry timestamp |
| 6 | `is_used` | BOOLEAN | DEFAULT FALSE | Used flag |
| 7 | `token_type` | VARCHAR(50) | DEFAULT 'general' | Token type |
| 8 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_cat_token` ON (`token`), `idx_cat_app` ON (`application_id`)

---

## TABLE 76: `physical_application_details`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique detail identifier |
| 2 | `application_id` | UUID | UNIQUE, FOREIGN KEY → applications(id) ON DELETE CASCADE, NOT NULL | Application |
| 3 | `aadhaar_linked_mobile` | VARCHAR(20) | NULLABLE | Aadhaar linked mobile |
| 4 | `pan_name` | VARCHAR(255) | NULLABLE | PAN name |
| 5 | `dob` | VARCHAR(50) | NULLABLE | Date of birth |
| 6 | `pan_number` | VARCHAR(20) | NULLABLE | PAN number |
| 7 | `mother_name` | VARCHAR(255) | NULLABLE | Mother name |
| 8 | `personal_email` | VARCHAR(255) | NULLABLE | Personal email |
| 9 | `company_name` | VARCHAR(255) | NULLABLE | Company name |
| 10 | `designation` | VARCHAR(255) | NULLABLE | Designation |
| 11 | `flat_no` | VARCHAR(255) | NULLABLE | Flat number |
| 12 | `sub_area` | VARCHAR(255) | NULLABLE | Sub area |
| 13 | `landmark` | VARCHAR(255) | NULLABLE | Landmark |
| 14 | `pincode` | VARCHAR(20) | NULLABLE | Pincode |
| 15 | `company_address` | TEXT | NULLABLE | Company address |
| 16 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| 17 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update timestamp |

* **Indexes**: `idx_pad_app` ON (`application_id`)

---

## TABLE 77: `loan_applications`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique loan application identifier |
| 2 | `loan_type_slug` | VARCHAR(100) | NOT NULL | Loan type slug |
| 3 | `customer_name` | VARCHAR(255) | NOT NULL | Customer name |
| 4 | `mobile` | VARCHAR(15) | NOT NULL | Customer mobile |
| 5 | `email` | VARCHAR(255) | NULLABLE | Customer email |
| 6 | `loan_amount` | NUMERIC(15,2) | NULLABLE | Loan amount |
| 7 | `tenure_months` | INT | NULLABLE | Tenure in months |
| 8 | `interest_rate` | NUMERIC(5,2) | NULLABLE | Interest rate |
| 9 | `monthly_income` | NUMERIC(15,2) | NULLABLE | Monthly income |
| 10 | `employer_name` | VARCHAR(255) | NULLABLE | Employer name |
| 11 | `pincode` | VARCHAR(10) | NULLABLE | Pincode |
| 12 | `city` | VARCHAR(100) | NULLABLE | City |
| 13 | `state` | VARCHAR(100) | NULLABLE | State |
| 14 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) | Partner |
| 15 | `status` | VARCHAR(50) | DEFAULT 'submitted' | Application status |
| 16 | `remarks` | TEXT | NULLABLE | Remarks |
| 17 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| 18 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update timestamp |

* **Indexes**: `idx_loan_app_type` ON (`loan_type_slug`), `idx_loan_app_status` ON (`status`)

---

## TABLE 78: `insurance_applications`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique insurance application identifier |
| 2 | `insurance_type_slug` | VARCHAR(100) | NOT NULL | Insurance type slug |
| 3 | `customer_name` | VARCHAR(255) | NOT NULL | Customer name |
| 4 | `mobile` | VARCHAR(15) | NOT NULL | Customer mobile |
| 5 | `email` | VARCHAR(255) | NULLABLE | Customer email |
| 6 | `policy_type` | VARCHAR(100) | NULLABLE | Policy type |
| 7 | `sum_insured` | NUMERIC(15,2) | NULLABLE | Sum insured |
| 8 | `premium_amount` | NUMERIC(15,2) | NULLABLE | Premium amount |
| 9 | `pincode` | VARCHAR(10) | NULLABLE | Pincode |
| 10 | `city` | VARCHAR(100) | NULLABLE | City |
| 11 | `state` | VARCHAR(100) | NULLABLE | State |
| 12 | `nominee_name` | VARCHAR(255) | NULLABLE | Nominee name |
| 13 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) | Partner |
| 14 | `status` | VARCHAR(50) | DEFAULT 'submitted' | Application status |
| 15 | `remarks` | TEXT | NULLABLE | Remarks |
| 16 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| 17 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update timestamp |

* **Indexes**: `idx_ins_app_type` ON (`insurance_type_slug`), `idx_ins_app_status` ON (`status`)

---

## TABLE 79: `bank_card_applications`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique bank card application identifier |
| 2 | `application_no` | VARCHAR(30) | UNIQUE, NOT NULL | Application number |
| 3 | `bank_id` | UUID | FOREIGN KEY → banks(id), NOT NULL | Bank |
| 4 | `customer_id` | UUID | FOREIGN KEY → customers(id) | Customer |
| 5 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) | Partner |
| 6 | `credit_card_category` | VARCHAR(100) | NULLABLE | Card category |
| 7 | `customer_name` | VARCHAR(255) | NOT NULL | Customer name |
| 8 | `customer_mobile` | VARCHAR(15) | NOT NULL | Customer mobile |
| 9 | `pan_number` | VARCHAR(10) | NOT NULL | PAN number |
| 10 | `resident_pincode` | VARCHAR(10) | NULLABLE | Resident pincode |
| 11 | `process_by` | UUID | FOREIGN KEY → users(id) | Processor |
| 12 | `pan_check_comments` | TEXT | NULLABLE | PAN check comments |
| 13 | `qd_executive_name` | VARCHAR(255) | NULLABLE | QD executive name |
| 14 | `resident_pin_comments` | TEXT | NULLABLE | PIN comments |
| 15 | `next_qd_date` | DATE | NULLABLE | Next QD date |
| 16 | `dob` | DATE | NULLABLE | Date of birth |
| 17 | `mother_name` | VARCHAR(255) | NULLABLE | Mother name |
| 18 | `residence_address` | TEXT | NULLABLE | Residence address |
| 19 | `company_name` | VARCHAR(255) | NULLABLE | Company name |
| 20 | `designation` | VARCHAR(255) | NULLABLE | Designation |
| 21 | `email` | VARCHAR(255) | NULLABLE | Email |
| 22 | `official_email` | VARCHAR(255) | NULLABLE | Official email |
| 23 | `gross_monthly_income` | DECIMAL(12,2) | NULLABLE | Monthly income |
| 24 | `pan_check_executive_name` | VARCHAR(255) | NULLABLE | PAN check executive |
| 25 | `app_code_status` | VARCHAR(50) | NULLABLE | App code status |
| 26 | `qd_status` | VARCHAR(50) | NULLABLE | QD status |
| 27 | `surrogate` | VARCHAR(100) | NULLABLE | Surrogate |
| 28 | `income_status` | VARCHAR(50) | NULLABLE | Income status |
| 29 | `blaze_status` | VARCHAR(50) | NULLABLE | Blaze status |
| 30 | `telco_stage` | VARCHAR(50) | NULLABLE | Telco stage |
| 31 | `official_mail_status` | VARCHAR(50) | NULLABLE | Official mail status |
| 32 | `vkyc_status` | VARCHAR(50) | NULLABLE | VKYC status |
| 33 | `dispatch_stage` | VARCHAR(50) | NULLABLE | Dispatch stage |
| 34 | `final_stage` | VARCHAR(50) | DEFAULT 'Customer Details' | Final stage |
| 35 | `decline_description` | TEXT | NULLABLE | Decline description |
| 36 | `decline_code` | VARCHAR(50) | NULLABLE | Decline code |
| 37 | `curable_solved` | VARCHAR(50) | NULLABLE | Curable solved |
| 38 | `curable_executive` | VARCHAR(255) | NULLABLE | Curable executive |
| 39 | `other_comments` | TEXT | NULLABLE | Other comments |
| 40 | `not_interested_comment` | TEXT | NULLABLE | Not interested comment |
| 41 | `kyc_pending_comment` | TEXT | NULLABLE | KYC pending comment |
| 42 | `created_by` | UUID | FOREIGN KEY → users(id) | Creator |
| 43 | `updated_by` | UUID | FOREIGN KEY → users(id) | Updater |
| 44 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| 45 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update timestamp |

* **Indexes**: `idx_bcca_bank` ON (`bank_id`), `idx_bcca_status` ON (`final_stage`), `idx_bcca_pan` ON (`pan_number`)

---

## TABLE 80: `bank_card_application_timeline`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique timeline identifier |
| 2 | `application_id` | UUID | FOREIGN KEY → bank_card_applications(id) ON DELETE CASCADE, NOT NULL | Application |
| 3 | `stage` | VARCHAR(50) | NOT NULL | Stage |
| 4 | `note` | TEXT | NULLABLE | Note |
| 5 | `changed_by` | UUID | FOREIGN KEY → users(id) | Changed by |
| 6 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_bcat_app` ON (`application_id`)

---

## TABLE 81: `sbi_credit_card_applications`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique SBI application identifier |
| 2 | `application_no` | VARCHAR(30) | UNIQUE, NOT NULL | Application number |
| 3 | `customer_id` | UUID | FOREIGN KEY → customers(id) | Customer |
| 4 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) | Partner |
| 5 | `credit_card_category` | VARCHAR(100) | NULLABLE | Card category |
| 6 | `customer_name` | VARCHAR(255) | NOT NULL | Customer name |
| 7 | `customer_mobile` | VARCHAR(15) | NOT NULL | Customer mobile |
| 8 | `pan_number` | VARCHAR(10) | NOT NULL | PAN number |
| 9 | `resident_pincode` | VARCHAR(10) | NULLABLE | Resident pincode |
| 10 | `process_by` | UUID | FOREIGN KEY → users(id) | Processor |
| 11 | `pan_check_comments` | TEXT | NULLABLE | PAN check comments |
| 12 | `qd_executive_name` | VARCHAR(255) | NULLABLE | QD executive name |
| 13 | `resident_pin_comments` | TEXT | NULLABLE | PIN comments |
| 14 | `next_qd_date` | DATE | NULLABLE | Next QD date |
| 15 | `dob` | DATE | NULLABLE | Date of birth |
| 16 | `mother_name` | VARCHAR(255) | NULLABLE | Mother name |
| 17 | `residence_address` | TEXT | NULLABLE | Residence address |
| 18 | `company_name` | VARCHAR(255) | NULLABLE | Company name |
| 19 | `designation` | VARCHAR(255) | NULLABLE | Designation |
| 20 | `email` | VARCHAR(255) | NULLABLE | Email |
| 21 | `official_email` | VARCHAR(255) | NULLABLE | Official email |
| 22 | `gross_monthly_income` | DECIMAL(12,2) | NULLABLE | Monthly income |
| 23 | `resident_pin_comment` | TEXT | NULLABLE | PIN comment |
| 24 | `pan_check_executive` | VARCHAR(255) | NULLABLE | PAN check executive |
| 25 | `application_code_status` | VARCHAR(50) | NULLABLE | App code status |
| 26 | `qd_status` | VARCHAR(50) | NULLABLE | QD status |
| 27 | `surrogate` | VARCHAR(100) | NULLABLE | Surrogate |
| 28 | `income_status` | VARCHAR(50) | NULLABLE | Income status |
| 29 | `blaze_status` | VARCHAR(50) | NULLABLE | Blaze status |
| 30 | `telco_stage` | VARCHAR(50) | NULLABLE | Telco stage |
| 31 | `official_mail_status` | VARCHAR(50) | NULLABLE | Official mail status |
| 32 | `vkyc_status` | VARCHAR(50) | NULLABLE | VKYC status |
| 33 | `dispatch_stage` | VARCHAR(50) | NULLABLE | Dispatch stage |
| 34 | `final_stage` | VARCHAR(50) | DEFAULT 'Customer Details' | Final stage |
| 35 | `decline_description` | TEXT | NULLABLE | Decline description |
| 36 | `decline_code` | VARCHAR(50) | NULLABLE | Decline code |
| 37 | `curable_solved` | VARCHAR(50) | NULLABLE | Curable solved |
| 38 | `curable_executive` | VARCHAR(255) | NULLABLE | Curable executive |
| 39 | `other_comments` | TEXT | NULLABLE | Other comments |
| 40 | `created_by` | UUID | FOREIGN KEY → users(id) | Creator |
| 41 | `updated_by` | UUID | FOREIGN KEY → users(id) | Updater |
| 42 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| 43 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update timestamp |

* **Indexes**: `idx_sbi_cca_pan` ON (`pan_number`), `idx_sbi_cca_status` ON (`final_stage`)

---

## TABLE 82: `sbi_cc_application_timeline`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique timeline identifier |
| 2 | `application_id` | UUID | FOREIGN KEY → sbi_credit_card_applications(id) ON DELETE CASCADE, NOT NULL | Application |
| 3 | `stage` | VARCHAR(50) | NOT NULL | Stage |
| 4 | `activity` | VARCHAR(100) | NULLABLE | Activity |
| 5 | `note` | TEXT | NULLABLE | Note |
| 6 | `changed_by` | UUID | FOREIGN KEY → users(id) | Changed by |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_sbi_ccat_app` ON (`application_id`)

---

## TABLE 83: `customer_notes`
**Feature**: 📋 Customer 360 Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique note identifier |
| 2 | `customer_id` | UUID | FOREIGN KEY → customers(id) ON DELETE CASCADE, NOT NULL | Customer |
| 3 | `created_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Creator |
| 4 | `note` | TEXT | NOT NULL | Note content |
| 5 | `visibility` | VARCHAR(20) | DEFAULT 'public' | Visibility |
| 6 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_customer_notes_customer` ON (`customer_id`)

---

## TABLE 84: `customer_documents`
**Feature**: 📋 Customer 360 Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique document identifier |
| 2 | `customer_id` | UUID | FOREIGN KEY → customers(id) ON DELETE CASCADE, NOT NULL | Customer |
| 3 | `document_type` | VARCHAR(100) | NOT NULL | Document type |
| 4 | `file_url` | TEXT | NOT NULL | File URL |
| 5 | `file_name` | VARCHAR(255) | NOT NULL | File name |
| 6 | `mime_type` | VARCHAR(100) | NOT NULL | MIME type |
| 7 | `status` | VARCHAR(50) | DEFAULT 'uploaded' | Status |
| 8 | `uploaded_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Uploader |
| 9 | `uploaded_at` | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |
| 10 | `verified_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Verifier |
| 11 | `verified_at` | TIMESTAMPTZ | NULLABLE | Verification timestamp |

* **Indexes**: `idx_customer_docs_customer` ON (`customer_id`)

---

## TABLE 85: `customer_timeline`
**Feature**: 📋 Customer 360 Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique timeline identifier |
| 2 | `customer_id` | UUID | FOREIGN KEY → customers(id) ON DELETE CASCADE, NOT NULL | Customer |
| 3 | `event_type` | VARCHAR(100) | NOT NULL | Event type |
| 4 | `title` | VARCHAR(255) | NOT NULL | Event title |
| 5 | `description` | TEXT | NULLABLE | Event description |
| 6 | `actor_type` | VARCHAR(50) | DEFAULT 'system' | Actor type |
| 7 | `actor_id` | UUID | NULLABLE | Actor ID |
| 8 | `metadata` | JSONB | DEFAULT '{}' | Metadata |
| 9 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_customer_timeline_customer` ON (`customer_id`)

---

## TABLE 86: `customer_followups`
**Feature**: 📋 Customer 360 Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique followup identifier |
| 2 | `customer_id` | UUID | FOREIGN KEY → customers(id) ON DELETE CASCADE, NOT NULL | Customer |
| 3 | `scheduled_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Scheduler |
| 4 | `follow_up_at` | TIMESTAMPTZ | NOT NULL | Followup time |
| 5 | `note` | TEXT | NULLABLE | Note |
| 6 | `status` | VARCHAR(50) | DEFAULT 'pending' | Status |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_customer_followups_customer` ON (`customer_id`)

---

## TABLE 87: `customer_tags`
**Feature**: 📋 Customer 360 Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique tag identifier |
| 2 | `customer_id` | UUID | FOREIGN KEY → customers(id) ON DELETE CASCADE, NOT NULL | Customer |
| 3 | `tag` | VARCHAR(100) | NOT NULL | Tag |
| 4 | `created_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Creator |
| 5 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Constraints**: `UNIQUE(customer_id, tag)`
* **Indexes**: `idx_customer_tags_customer` ON (`customer_id`)

---

## TABLE 88: `customer_activity_logs`
**Feature**: 📋 Customer 360 Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique log identifier |
| 2 | `customer_id` | UUID | FOREIGN KEY → customers(id) ON DELETE CASCADE, NOT NULL | Customer |
| 3 | `activity_type` | VARCHAR(100) | NOT NULL | Activity type |
| 4 | `description` | TEXT | NULLABLE | Description |
| 5 | `metadata` | JSONB | DEFAULT '{}' | Metadata |
| 6 | `ip_address` | VARCHAR(45) | NULLABLE | IP address |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_customer_activity_customer` ON (`customer_id`)

---

## TABLE 89: `customer_communications`
**Feature**: 📋 Customer 360 Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique communication identifier |
| 2 | `customer_id` | UUID | FOREIGN KEY → customers(id) ON DELETE CASCADE, NOT NULL | Customer |
| 3 | `communication_type` | VARCHAR(50) | NOT NULL | Communication type |
| 4 | `direction` | VARCHAR(20) | NOT NULL | inbound, outbound |
| 5 | `subject` | VARCHAR(255) | NULLABLE | Subject |
| 6 | `message` | TEXT | NULLABLE | Message |
| 7 | `sent_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Sender |
| 8 | `sent_at` | TIMESTAMPTZ | DEFAULT NOW() | Sent timestamp |

* **Indexes**: `idx_customer_comm_customer` ON (`customer_id`)

---

## TABLE 90: `lead_documents`
**Feature**: 📋 Lead Management Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique document identifier |
| 2 | `lead_id` | UUID | FOREIGN KEY → leads(id) ON DELETE CASCADE, NOT NULL | Lead |
| 3 | `document_type` | VARCHAR(100) | NOT NULL | Document type |
| 4 | `file_url` | TEXT | NOT NULL | File URL |
| 5 | `file_name` | VARCHAR(255) | NOT NULL | File name |
| 6 | `uploaded_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Uploader |
| 7 | `uploaded_at` | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |

* **Indexes**: `idx_lead_docs_lead` ON (`lead_id`)

---

## TABLE 91: `lead_timeline`
**Feature**: 📋 Lead Management Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique timeline identifier |
| 2 | `lead_id` | UUID | FOREIGN KEY → leads(id) ON DELETE CASCADE, NOT NULL | Lead |
| 3 | `event_type` | VARCHAR(100) | NOT NULL | Event type |
| 4 | `title` | VARCHAR(255) | NOT NULL | Event title |
| 5 | `description` | TEXT | NULLABLE | Event description |
| 6 | `actor_type` | VARCHAR(50) | DEFAULT 'system' | Actor type |
| 7 | `actor_id` | UUID | NULLABLE | Actor ID |
| 8 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_lead_timeline_lead` ON (`lead_id`)

---

## TABLE 92: `lead_notes`
**Feature**: 📋 Lead Management Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique note identifier |
| 2 | `lead_id` | UUID | FOREIGN KEY → leads(id) ON DELETE CASCADE, NOT NULL | Lead |
| 3 | `created_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Creator |
| 4 | `note` | TEXT | NOT NULL | Note content |
| 5 | `visibility` | VARCHAR(20) | DEFAULT 'public' | Visibility |
| 6 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_lead_notes_lead` ON (`lead_id`)

---

## TABLE 93: `lead_assignments`
**Feature**: 📋 Lead Management Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique assignment identifier |
| 2 | `lead_id` | UUID | FOREIGN KEY → leads(id) ON DELETE CASCADE, NOT NULL | Lead |
| 3 | `assigned_to` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Assignee |
| 4 | `assigned_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Assigner |
| 5 | `assigned_at` | TIMESTAMPTZ | DEFAULT NOW() | Assignment timestamp |
| 6 | `status` | VARCHAR(50) | DEFAULT 'active' | Assignment status |

* **Indexes**: `idx_lead_assignments_lead` ON (`lead_id`)

---

## TABLE 94: `lead_activity_logs`
**Feature**: 📋 Lead Management Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique log identifier |
| 2 | `lead_id` | UUID | FOREIGN KEY → leads(id) ON DELETE CASCADE, NOT NULL | Lead |
| 3 | `activity_type` | VARCHAR(100) | NOT NULL | Activity type |
| 4 | `description` | TEXT | NULLABLE | Description |
| 5 | `metadata` | JSONB | DEFAULT '{}' | Metadata |
| 6 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_lead_activity_lead` ON (`lead_id`)

---

## TABLE 95: `lead_status_history`
**Feature**: 📋 Lead Management Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique history identifier |
| 2 | `lead_id` | UUID | FOREIGN KEY → leads(id) ON DELETE CASCADE, NOT NULL | Lead |
| 3 | `old_status` | VARCHAR(50) | NULLABLE | Old status |
| 4 | `new_status` | VARCHAR(50) | NOT NULL | New status |
| 5 | `changed_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Changed by |
| 6 | `changed_at` | TIMESTAMPTZ | DEFAULT NOW() | Change timestamp |

* **Indexes**: `idx_lead_status_lead` ON (`lead_id`)

---

## TABLE 96: `lead_checklist`
**Feature**: 📋 Lead Management Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique checklist identifier |
| 2 | `lead_id` | UUID | FOREIGN KEY → leads(id) ON DELETE CASCADE, NOT NULL | Lead |
| 3 | `item` | VARCHAR(255) | NOT NULL | Checklist item |
| 4 | `completed` | BOOLEAN | DEFAULT FALSE | Completion status |
| 5 | `completed_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Completer |
| 6 | `completed_at` | TIMESTAMPTZ | NULLABLE | Completion timestamp |

* **Indexes**: `idx_lead_checklist_lead` ON (`lead_id`)

---

## TABLE 97: `lead_sla`
**Feature**: 📋 Lead Management Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique SLA identifier |
| 2 | `lead_id` | UUID | FOREIGN KEY → leads(id) ON DELETE CASCADE, NOT NULL | Lead |
| 3 | `sla_type` | VARCHAR(100) | NOT NULL | SLA type |
| 4 | `due_at` | TIMESTAMPTZ | NOT NULL | Due time |
| 5 | `status` | VARCHAR(50) | DEFAULT 'pending' | SLA status |
| 6 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_lead_sla_lead` ON (`lead_id`)

---

## TABLE 98: `partner_share_links`
**Feature**: 📋 Lead Management Module

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique link identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Partner |
| 3 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Product |
| 4 | `share_code` | VARCHAR(100) | UNIQUE, NOT NULL | Share code |
| 5 | `share_url` | TEXT | NOT NULL | Share URL |
| 6 | `expires_at` | TIMESTAMPTZ | NULLABLE | Expiry time |
| 7 | `click_count` | INT | DEFAULT 0 | Click count |
| 8 | `conversion_count` | INT | DEFAULT 0 | Conversion count |
| 9 | `status` | VARCHAR(50) | DEFAULT 'active' | Link status |
| 10 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_partner_share_partner` ON (`partner_id`)

---

## TABLE 99: `referral_clicks`
**Feature**: 💼 Partner Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique click identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Partner |
| 3 | `referral_code` | VARCHAR(50) | NOT NULL | Referral code |
| 4 | `click_count` | INT | DEFAULT 0 | Click count |
| 5 | `last_clicked_at` | TIMESTAMPTZ | DEFAULT NOW() | Last clicked |
| 6 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| 7 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update timestamp |

* **Constraints**: `UNIQUE(partner_id, referral_code)`

---

## TABLE 100: `partner_teams`
**Feature**: 👥 Team Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique team identifier |
| 2 | `team_name` | VARCHAR(255) | NOT NULL | Team name |
| 3 | `team_leader_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE SET NULL | Team leader |
| 4 | `description` | TEXT | NULLABLE | Team description |
| 5 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| 6 | `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Update timestamp |

---

## TABLE 101: `partner_upgrade_requests`
**Feature**: 💼 Partner Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique request identifier |
| 2 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Partner |
| 3 | `current_rank` | VARCHAR(50) | NULLABLE | Current rank |
| 4 | `requested_rank` | VARCHAR(50) | NOT NULL | Requested rank |
| 5 | `reason` | TEXT | NULLABLE | Reason |
| 6 | `status` | VARCHAR(50) | DEFAULT 'pending' | Request status |
| 7 | `reviewed_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Reviewer |
| 8 | `reviewed_at` | TIMESTAMPTZ | NULLABLE | Review timestamp |
| 9 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_upgrade_requests_partner` ON (`partner_id`)

---

## TABLE 102: `team_commissions`
**Feature**: 👥 Team Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique commission identifier |
| 2 | `team_id` | UUID | FOREIGN KEY → partner_teams(id) ON DELETE CASCADE, NOT NULL | Team |
| 3 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Partner |
| 4 | `commission_amount` | DECIMAL(15,2) | DEFAULT 0 | Commission amount |
| 5 | `commission_type` | VARCHAR(50) | NOT NULL | Commission type |
| 6 | `status` | VARCHAR(50) | DEFAULT 'pending' | Status |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_team_commissions_team` ON (`team_id`)

---

## TABLE 103: `team_activity`
**Feature**: 👥 Team Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique activity identifier |
| 2 | `team_id` | UUID | FOREIGN KEY → partner_teams(id) ON DELETE CASCADE, NOT NULL | Team |
| 3 | `partner_id` | UUID | FOREIGN KEY → partner_profiles(id) ON DELETE CASCADE, NOT NULL | Partner |
| 4 | `activity_type` | VARCHAR(100) | NOT NULL | Activity type |
| 5 | `description` | TEXT | NULLABLE | Description |
| 6 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_team_activity_team` ON (`team_id`)

---

## TABLE 104: `team_goals`
**Feature**: 👥 Team Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique goal identifier |
| 2 | `team_id` | UUID | FOREIGN KEY → partner_teams(id) ON DELETE CASCADE, NOT NULL | Team |
| 3 | `goal_type` | VARCHAR(100) | NOT NULL | Goal type |
| 4 | `target_value` | DECIMAL(15,2) | NOT NULL | Target value |
| 5 | `current_value` | DECIMAL(15,2) | DEFAULT 0 | Current value |
| 6 | `start_date` | TIMESTAMPTZ | NOT NULL | Start date |
| 7 | `end_date` | TIMESTAMPTZ | NOT NULL | End date |
| 8 | `status` | VARCHAR(50) | DEFAULT 'active' | Goal status |
| 9 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_team_goals_team` ON (`team_id`)

---

## TABLE 105: `team_notifications`
**Feature**: 👥 Team Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique notification identifier |
| 2 | `team_id` | UUID | FOREIGN KEY → partner_teams(id) ON DELETE CASCADE, NOT NULL | Team |
| 3 | `title` | VARCHAR(255) | NOT NULL | Notification title |
| 4 | `message` | TEXT | NOT NULL | Notification message |
| 5 | `priority` | VARCHAR(20) | DEFAULT 'normal' | Priority |
| 6 | `status` | VARCHAR(20) | DEFAULT 'unread' | Status |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_team_notifications_team` ON (`team_id`)

---

## TABLE 106: `commission_release_jobs`
**Feature**: 💰 Commission Engine

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique job identifier |
| 2 | `commission_ledger_id` | UUID | FOREIGN KEY → commission_ledger(id) ON DELETE CASCADE, NOT NULL | Commission ledger |
| 3 | `scheduled_at` | TIMESTAMPTZ | NOT NULL | Scheduled time |
| 4 | `status` | VARCHAR(50) | DEFAULT 'pending' | Job status |
| 5 | `processed_at` | TIMESTAMPTZ | NULLABLE | Processed time |
| 6 | `error_message` | TEXT | NULLABLE | Error message |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_comm_release_jobs_ledger` ON (`commission_ledger_id`)

---

## TABLE 107: `withdrawal_audit_logs`
**Feature**: 💰 Commission Engine

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique audit identifier |
| 2 | `withdrawal_id` | UUID | FOREIGN KEY → wallet_withdrawals(id) ON DELETE CASCADE, NOT NULL | Withdrawal |
| 3 | `action` | VARCHAR(50) | NOT NULL | Action |
| 4 | `old_status` | VARCHAR(50) | NULLABLE | Old status |
| 5 | `new_status` | VARCHAR(50) | NOT NULL | New status |
| 6 | `performed_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Performer |
| 7 | `notes` | TEXT | NULLABLE | Notes |
| 8 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_withdrawal_audit_withdrawal` ON (`withdrawal_id`)

---

## TABLE 108: `wallet_reconciliation`
**Feature**: 💰 Commission Engine

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique reconciliation identifier |
| 2 | `wallet_id` | UUID | FOREIGN KEY → partner_wallets(id) ON DELETE CASCADE, NOT NULL | Wallet |
| 3 | `reconciliation_date` | TIMESTAMPTZ | NOT NULL | Reconciliation date |
| 4 | `expected_balance` | DECIMAL(15,2) | NOT NULL | Expected balance |
| 5 | `actual_balance` | DECIMAL(15,2) | NOT NULL | Actual balance |
| 6 | `difference` | DECIMAL(15,2) | NOT NULL | Difference |
| 7 | `status` | VARCHAR(50) | DEFAULT 'pending' | Reconciliation status |
| 8 | `notes` | TEXT | NULLABLE | Notes |
| 9 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_wallet_recon_wallet` ON (`wallet_id`)

---

## TABLE 109: `wallet_bonus`
**Feature**: 💰 Commission Engine

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique bonus identifier |
| 2 | `wallet_id` | UUID | FOREIGN KEY → partner_wallets(id) ON DELETE CASCADE, NOT NULL | Wallet |
| 3 | `bonus_type` | VARCHAR(100) | NOT NULL | Bonus type |
| 4 | `bonus_amount` | DECIMAL(15,2) | NOT NULL | Bonus amount |
| 5 | `reason` | TEXT | NULLABLE | Reason |
| 6 | `status` | VARCHAR(50) | DEFAULT 'pending' | Bonus status |
| 7 | `created_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Creator |
| 8 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_wallet_bonus_wallet` ON (`wallet_id`)

---

## TABLE 110: `wallet_adjustments`
**Feature**: 💰 Commission Engine

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique adjustment identifier |
| 2 | `wallet_id` | UUID | FOREIGN KEY → partner_wallets(id) ON DELETE CASCADE, NOT NULL | Wallet |
| 3 | `adjustment_type` | VARCHAR(100) | NOT NULL | Adjustment type |
| 4 | `adjustment_amount` | DECIMAL(15,2) | NOT NULL | Adjustment amount |
| 5 | `reason` | TEXT | NOT NULL | Reason |
| 6 | `status` | VARCHAR(50) | DEFAULT 'pending' | Adjustment status |
| 7 | `approved_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Approver |
| 8 | `approved_at` | TIMESTAMPTZ | NULLABLE | Approval timestamp |
| 9 | `created_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Creator |
| 10 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_wallet_adj_wallet` ON (`wallet_id`)

---

## TABLE 111: `application_audit_logs`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique audit identifier |
| 2 | `application_id` | UUID | FOREIGN KEY → applications(id) ON DELETE CASCADE, NOT NULL | Application |
| 3 | `action` | VARCHAR(100) | NOT NULL | Action |
| 4 | `old_data` | JSONB | NULLABLE | Old data |
| 5 | `new_data` | JSONB | NULLABLE | New data |
| 6 | `performed_by` | UUID | FOREIGN KEY → users(id) ON DELETE SET NULL | Performer |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_app_audit_application` ON (`application_id`)

---

## TABLE 112: `application_links`
**Feature**: 📋 CRM

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique link identifier |
| 2 | `application_id` | UUID | FOREIGN KEY → applications(id) ON DELETE CASCADE, NOT NULL | Application |
| 3 | `link_type` | VARCHAR(100) | NOT NULL | Link type |
| 4 | `link_url` | TEXT | NOT NULL | Link URL |
| 5 | `expires_at` | TIMESTAMPTZ | NULLABLE | Expiry time |
| 6 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_app_links_application` ON (`application_id`)

---

## TABLE 113: `admin_bank_assignments`
**Feature**: 🏦 Product & Bank Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique assignment identifier |
| 2 | `bank_id` | UUID | FOREIGN KEY → banks(id) ON DELETE CASCADE, NOT NULL | Bank |
| 3 | `admin_id` | UUID | FOREIGN KEY → users(id) ON DELETE CASCADE, NOT NULL | Admin |
| 4 | `assignment_type` | VARCHAR(100) | NOT NULL | Assignment type |
| 5 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Constraints**: `UNIQUE(bank_id, admin_id, assignment_type)`

---

## TABLE 114: `bank_product_requirements`
**Feature**: 🏦 Product & Bank Management

| # | Column Name | Data Type | Constraints | Description |
|---|---|---|---|---|
| 1 | `id` | UUID | PRIMARY KEY | Unique requirement identifier |
| 2 | `bank_id` | UUID | FOREIGN KEY → banks(id) ON DELETE CASCADE, NOT NULL | Bank |
| 3 | `product_id` | UUID | FOREIGN KEY → products(id) ON DELETE CASCADE, NOT NULL | Product |
| 4 | `requirement_type` | VARCHAR(100) | NOT NULL | Requirement type |
| 5 | `requirement_value` | TEXT | NOT NULL | Requirement value |
| 6 | `is_mandatory` | BOOLEAN | DEFAULT TRUE | Mandatory flag |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

* **Indexes**: `idx_bank_prod_req_bank` ON (`bank_id`), `idx_bank_prod_req_product` ON (`product_id`)

---

## Complete Feature-to-Table Summary

| # | Feature | Tables Count | Tables |
|---|---|---|---|
| 1 | 🔐 Authentication | 8 | `users`, `refresh_tokens`, `otp_verifications`, `msg91_verified_tokens`, `pre_verified_emails`, `login_activity`, `registration_logs`, `blacklist` |
| 2 | 🛡️ KYC Verification | 4 | `partner_profiles`, `kyc_documents`, `partner_videos`, `partner_bank_details` |
| 3 | 💼 Partner Management | 9 | `partner_profiles`, `partner_bank_details`, `partner_team_relationships`, `partner_referrals`, `bank_details_history`, `referral_campaigns`, `invitation_history`, `partner_teams`, `partner_upgrade_requests` |
| 4 | 💰 Wallet & Commission | 13 | `partner_wallets`, `wallet_transactions`, `wallet_ledger`, `wallet_withdrawals`, `wallet_audit_logs`, `commission_structures`, `commission_rules`, `commission_ledger`, `commission_release_queue`, `partner_settlements`, `payout_logs`, `withdrawal_requests (view)`, `wallets (view)` |
| 5 | 📋 Lead & Application CRM | 20 | `leads`, `lead_followups`, `customers`, `applications`, `application_timeline`, `application_documents`, `application_notes`, `direct_card_applications`, `customer_access_tokens`, `physical_application_details`, `loan_applications`, `insurance_applications`, `bank_card_applications`, `bank_card_application_timeline`, `sbi_credit_card_applications`, `sbi_cc_application_timeline`, `customer_notes`, `customer_documents`, `customer_timeline`, `customer_followups` |
| 6 | 🏦 Product & Bank | 20 | `banks`, `products`, `product_application_settings`, `product_link_audits`, `product_features`, `product_documents`, `product_faq`, `product_videos`, `product_offers`, `product_ratings`, `product_share_logs`, `partner_saved_products`, `partner_recent_products`, `product_views`, `partner_preferences`, `product_categories`, `product_eligibility_criteria`, `product_documents_required`, `bank_product_requirements` |
| 7 | 🔔 Notifications | 5 | `notifications`, `notification_preferences`, `notification_templates`, `announcements`, `broadcast_notifications` |
| 8 | 📊 Analytics | 10 | `audit_logs`, `click_tracking`, `application_click_logs`, `service_requests`, `wallet_audit_logs`, `report_cache`, `report_exports`, `scheduled_reports`, `activity_logs`, `referral_clicks` |
| 9 | 🎓 Training | 2 | `training_modules`, `partner_training_progress` |
| 10 | 🎨 CMS & Marketing | 6 | `banners`, `homepage_sections`, `marketing_materials`, `services_catalog`, `system_settings`, `support_tickets` |
| 11 | 👥 Team Management | 5 | `partner_team_relationships`, `partner_teams`, `team_commissions`, `team_activity`, `team_goals`, `team_notifications` |
| 12 | 📋 Customer 360 Module | 7 | `customers`, `customer_notes`, `customer_documents`, `customer_timeline`, `customer_followups`, `customer_tags`, `customer_activity_logs`, `customer_communications` |
| 13 | 📋 Lead Management Module | 10 | `leads`, `lead_documents`, `lead_timeline`, `lead_notes`, `lead_assignments`, `lead_activity_logs`, `lead_status_history`, `lead_checklist`, `lead_sla`, `partner_share_links` |
| 14 | 💰 Commission Engine | 5 | `commission_release_jobs`, `withdrawal_audit_logs`, `wallet_reconciliation`, `wallet_bonus`, `wallet_adjustments` |
| 15 | 📋 Application Audit | 2 | `application_audit_logs`, `application_links` |
| 16 | 🏦 Bank Admin | 1 | `admin_bank_assignments` |

> **Total Overview**: 114 tables across 16 features with 100+ foreign key relationships and 60+ indexes for query optimization.

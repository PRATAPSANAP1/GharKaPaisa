# Database Documentation - Yohesa Financial Platform

## Overview
This database supports a comprehensive financial services platform that facilitates partner-driven sales of credit cards, loans, insurance, and other financial products. The system includes user management, partner onboarding, application processing, wallet/commission management, team structures, and advanced reporting.

**Database Type:** PostgreSQL  
**Extensions:** uuid-ossp, pgcrypto  
**Sequences:** partner_code_seq, app_number_seq, announcement_seq, sbi_app_number_seq

---

## Table Structure by Module

### 1. User Management Module

#### `users`
**Purpose:** Central user table for all system users (partners, admins, employees)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| firebase_uid | VARCHAR(255) | UNIQUE | Firebase authentication ID |
| email | VARCHAR(255) | UNIQUE | User email |
| mobile | VARCHAR(15) | UNIQUE | Mobile number |
| role | user_role | NOT NULL, DEFAULT 'PARTNER' | SUPER_ADMIN, ADMIN, EMPLOYEE, PARTNER, TEAM_MEMBER |
| status | user_status | NOT NULL, DEFAULT 'pending' | pending, active, suspended, rejected, inactive, pending_verification, blocked |
| password_hash | VARCHAR(255) | | Password hash (legacy, moving to Firebase) |
| full_name | VARCHAR(255) | | Full name |
| employee_id | VARCHAR(50) | UNIQUE | Employee ID for internal staff |
| department | VARCHAR(100) | | Department for employees |
| designation | VARCHAR(100) | | Job designation |
| is_active | BOOLEAN | DEFAULT TRUE | Active status flag |
| email_verified | BOOLEAN | DEFAULT FALSE | Email verification status |
| mobile_verified | BOOLEAN | DEFAULT FALSE | Mobile verification status |
| verification_token | TEXT | | Email verification token |
| verification_token_expires_at | TIMESTAMPTZ | | Token expiry |
| reset_token | TEXT | | Password reset token |
| reset_token_expires_at | TIMESTAMPTZ | | Reset token expiry |
| must_change_password | BOOLEAN | DEFAULT FALSE | Force password change |
| locked_until | TIMESTAMPTZ | | Account lock expiry |
| failed_login_attempts | INTEGER | DEFAULT 0 | Failed login count |
| has_loc_eoc | BOOLEAN | DEFAULT FALSE | LOC/EOC permission |
| created_by | UUID | FK → users(id) | Created by user |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |
| last_login | TIMESTAMPTZ | | Last login timestamp |

**Indexes:**
- idx_users_firebase_uid (firebase_uid)
- Unique: email, mobile, employee_id

#### `refresh_tokens`
**Purpose:** JWT refresh token management for authentication

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User reference |
| token_hash | VARCHAR(255) | NOT NULL | Hashed refresh token |
| expires_at | TIMESTAMPTZ | NOT NULL | Token expiry |
| revoked | BOOLEAN | DEFAULT FALSE | Revocation status |
| device_id | VARCHAR(255) | | Device identifier |
| device_name | VARCHAR(255) | | Device name |
| browser | VARCHAR(255) | | Browser info |
| ip_address | VARCHAR(45) | | IP address |
| city | VARCHAR(100) | | City |
| country | VARCHAR(100) | | Country |
| revoked_at | TIMESTAMPTZ | | Revocation timestamp |
| last_used_at | TIMESTAMPTZ | DEFAULT NOW() | Last used |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_refresh_tokens_user (user_id, revoked)

#### `login_history`
**Purpose:** Track user login attempts for security auditing

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User reference |
| device | VARCHAR(255) | | Device info |
| browser | VARCHAR(255) | | Browser info |
| ip_address | VARCHAR(45) | | IP address |
| city | VARCHAR(100) | | City |
| country | VARCHAR(100) | | Country |
| login_time | TIMESTAMPTZ | DEFAULT NOW() | Login timestamp |
| logout_time | TIMESTAMPTZ | | Logout timestamp |
| status | VARCHAR(20) | NOT NULL | success, failed |
| failure_reason | VARCHAR(255) | | Failure reason |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_login_history_user (user_id)
- idx_login_history_status (status)
- idx_login_history_time (login_time DESC)

#### `password_history`
**Purpose:** Track password changes for security policies

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User reference |
| password_hash | VARCHAR(255) | NOT NULL | Password hash |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_password_history_user (user_id)

#### `security_alerts`
**Purpose:** Security incident tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User reference |
| type | VARCHAR(50) | NOT NULL | Alert type |
| message | TEXT | NOT NULL | Alert message |
| metadata | JSONB | | Additional data |
| read_at | TIMESTAMPTZ | | Read timestamp |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_security_alerts_user (user_id)
- idx_security_alerts_created_at (created_at DESC)

---

### 2. Partner Management Module

#### `partner_profiles`
**Purpose:** Extended profile information for partners

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| user_id | UUID | UNIQUE, FK → users(id) ON DELETE CASCADE | User reference |
| partner_code | VARCHAR(20) | UNIQUE NOT NULL | Partner code (from sequence) |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| profile_photo_url | VARCHAR(500) | | Profile photo |
| current_address | TEXT | | Current address |
| business_location | TEXT | | Business location |
| company_name | VARCHAR(255) | | Company name |
| company_type | VARCHAR(100) | | Company type |
| gst_number | VARCHAR(20) | | GST number |
| pincode | VARCHAR(10) | | Pincode |
| kyc_status | kyc_status | DEFAULT 'draft' | KYC status |
| approved_by | UUID | FK → users(id) | Approved by |
| approved_at | TIMESTAMPTZ | | Approval timestamp |
| rejection_reason | TEXT | | Rejection reason |
| aadhar_url | VARCHAR(500) | | Aadhaar document URL |
| pan_url | VARCHAR(500) | | PAN document URL |
| gst_cert_url | VARCHAR(500) | | GST certificate URL |
| cancel_cheque_url | VARCHAR(500) | | Cancelled cheque URL |
| parent_partner_id | UUID | FK → partner_profiles(id) | Parent partner (team) |
| partner_id | UUID | FK → partner_profiles(id) | Self-reference |
| partner_type | VARCHAR(50) | DEFAULT 'PARTNER' | Partner type |
| status | VARCHAR(50) | DEFAULT 'active' | Status |
| commission_rate | DECIMAL(5,2) | DEFAULT 90.00 | Commission rate |
| team_level | INTEGER | DEFAULT 1 | Team hierarchy level |
| team_status | VARCHAR(50) | DEFAULT 'ACTIVE' | Team status |
| allow_team_creation | BOOLEAN | DEFAULT TRUE | Can create team |
| team_joined_at | TIMESTAMPTZ | | Team join date |
| children_count | INTEGER | DEFAULT 0 | Number of children |
| referral_level | INTEGER | DEFAULT 1 | Referral level |
| referral_count | INTEGER | DEFAULT 0 | Referral count |
| nominee_name | VARCHAR(255) | | Nominee name |
| nominee_relation | VARCHAR(100) | | Nominee relation |
| nominee_dob | DATE | | Nominee DOB |
| emergency_contact_name | VARCHAR(255) | | Emergency contact |
| emergency_contact_phone | VARCHAR(20) | | Emergency phone |
| face_match_score | DECIMAL(5,2) | | Face verification score |
| pan_number | VARCHAR(10) | UNIQUE | PAN number |
| aadhaar_number | VARCHAR(12) | UNIQUE | Aadhaar number |
| can_create_team | BOOLEAN | DEFAULT TRUE | Team creation permission |
| rank | VARCHAR(50) | DEFAULT 'Silver' | Partner rank |
| referral_bonus_paid | BOOLEAN | DEFAULT FALSE | Referral bonus status |
| approved_credit_cards | INTEGER | DEFAULT 0 | Approved cards count |
| referred_by_id | UUID | FK → partner_profiles(id) | Referrer |
| active_children | INTEGER | DEFAULT 0 | Active team members |
| inactive_children | INTEGER | DEFAULT 0 | Inactive team members |
| verified_children | INTEGER | DEFAULT 0 | Verified team members |
| pending_children | INTEGER | DEFAULT 0 | Pending team members |
| blocked_children | INTEGER | DEFAULT 0 | Blocked team members |
| total_leads | INTEGER | DEFAULT 0 | Total leads |
| total_applications | INTEGER | DEFAULT 0 | Total applications |
| total_approved | INTEGER | DEFAULT 0 | Total approved |
| team_commission | DECIMAL(15,2) | DEFAULT 0.00 | Team commission |
| direct_team_count | INTEGER | DEFAULT 0 | Direct team count |
| active_team_count | INTEGER | DEFAULT 0 | Active team count |
| last_team_join | TIMESTAMPTZ | | Last team join |
| team_enabled | BOOLEAN | DEFAULT TRUE | Team enabled |
| referral_enabled | BOOLEAN | DEFAULT TRUE | Referral enabled |
| referral_message | TEXT | | Referral message |
| referral_banner | VARCHAR(500) | | Referral banner |
| company_logo_url | VARCHAR(500) | | Company logo |
| kyc_submitted_at | TIMESTAMPTZ | | KYC submission |
| kyc_reviewed_at | TIMESTAMPTZ | | KYC review |
| kyc_reviewed_by | UUID | FK → users(id) | KYC reviewer |
| kyc_rejection_reason | TEXT | | KYC rejection |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_partner_code (partner_code)
- Unique: user_id, partner_code, pan_number, aadhaar_number

#### `partner_bank_details`
**Purpose:** Bank account details for partners (supports multiple accounts)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| bank_name | VARCHAR(100) | NOT NULL | Bank name |
| account_number | VARCHAR(255) | NOT NULL, ENCRYPTED | Account number |
| ifsc_code | VARCHAR(15) | NOT NULL | IFSC code |
| account_holder_name | VARCHAR(255) | NOT NULL | Account holder |
| is_verified | BOOLEAN | DEFAULT FALSE | Verification status |
| verified_at | TIMESTAMPTZ | | Verification timestamp |
| is_primary | BOOLEAN | DEFAULT TRUE | Primary account flag |
| upi_id | VARCHAR(100) | | UPI ID |
| branch_name | VARCHAR(100) | | Branch name |
| cancelled_cheque_url | VARCHAR(500) | | Cancelled cheque |
| verified_by | UUID | FK → users(id) | Verified by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

#### `kyc_documents`
**Purpose:** KYC document uploads and verification

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| doc_type | VARCHAR(50) | NOT NULL | Document type (aadhaar, pan, gst_cert, cancelled_cheque) |
| doc_number | VARCHAR(50) | | Document number |
| file_url | VARCHAR(500) | NOT NULL | File URL |
| s3_key | VARCHAR(500) | NOT NULL | S3 storage key |
| verified | BOOLEAN | DEFAULT FALSE | Verification status |
| verified_by | UUID | FK → users(id) | Verified by |
| verified_at | TIMESTAMPTZ | | Verification timestamp |
| verification_status | VARCHAR(50) | DEFAULT 'pending' | Verification status |
| rejection_reason | TEXT | | Rejection reason |
| ocr_data | JSONB | | OCR extracted data |
| uploaded_at | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |

**Constraints:**
- UNIQUE(partner_id, doc_type)

#### `partner_videos`
**Purpose:** Video KYC for partners

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | UNIQUE, FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| video_url | VARCHAR(500) | NOT NULL | Video URL |
| video_duration | INTEGER | | Duration in seconds |
| video_size | INTEGER | | Size in bytes |
| storage_key | VARCHAR(500) | NOT NULL | S3 key |
| uploaded_at | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |
| verification_status | VARCHAR(50) | DEFAULT 'pending' | Verification status |
| rejection_reason | TEXT | | Rejection reason |

#### `partner_referrals`
**Purpose:** Referral code and link management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | UNIQUE, FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| referral_code | VARCHAR(50) | UNIQUE NOT NULL | Referral code |
| referral_link | VARCHAR(1000) | NOT NULL | Referral link |
| total_invites | INTEGER | DEFAULT 0 | Total invites sent |
| total_registered | INTEGER | DEFAULT 0 | Total registrations |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_referrals_partner (partner_id)
- idx_referrals_code (referral_code)

#### `partner_team_relationships`
**Purpose:** Hierarchical team structure

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| parent_partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Parent partner |
| child_partner_id | UUID | UNIQUE, FK → partner_profiles(id) ON DELETE CASCADE | Child partner |
| member_partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Member partner |
| sponsor_id | UUID | FK → partner_profiles(id) ON DELETE SET NULL | Sponsor |
| level | INTEGER | NOT NULL | Hierarchy level |
| commission_percentage | DECIMAL(5,2) | | Commission % |
| override_percentage | DECIMAL(5,2) | | Override % |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| status | VARCHAR(20) | DEFAULT 'ACTIVE' | Relationship status |

**Constraints:**
- UNIQUE(parent_partner_id, child_partner_id)

**Indexes:**
- idx_team_rels_parent (parent_partner_id)
- idx_team_rels_child (child_partner_id)
- idx_team_rels_member (member_partner_id)
- idx_team_rels_parent_level (parent_partner_id, level)

#### `partner_teams`
**Purpose:** Team groupings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | UNIQUE, FK → partner_profiles(id) ON DELETE CASCADE | Team owner |
| team_name | VARCHAR(255) | NOT NULL | Team name |
| team_code | VARCHAR(50) | UNIQUE NOT NULL | Team code |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_partner_teams_code (team_code)

#### `partner_upgrade_requests`
**Purpose:** Partner upgrade requests

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User reference |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| status | VARCHAR(50) | DEFAULT 'PENDING' | Request status |
| requested_at | TIMESTAMPTZ | DEFAULT NOW() | Request time |
| reviewed_at | TIMESTAMPTZ | | Review time |
| reviewed_by | UUID | FK → users(id) | Reviewed by |
| rejection_reason | TEXT | | Rejection reason |

**Indexes:**
- idx_upgrade_requests_user (user_id)
- idx_upgrade_requests_status (status)

---

### 3. Bank & Product Management Module

#### `banks`
**Purpose:** Financial institution registry

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| name | VARCHAR(100) | UNIQUE NOT NULL | Bank name |
| short_code | VARCHAR(100) | UNIQUE NOT NULL | Bank code |
| logo_url | VARCHAR(500) | | Logo URL |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| status | VARCHAR(50) | DEFAULT 'Active' | Status |
| display_order | INTEGER | DEFAULT 0 | Display order |
| hero_title | VARCHAR(255) | | Hero title |
| hero_description | TEXT | | Hero description |
| theme_color | VARCHAR(100) | | Theme color |
| secondary_color | VARCHAR(100) | | Secondary color |
| gradient | VARCHAR(255) | | Gradient |
| button_color | VARCHAR(100) | | Button color |
| accent_color | VARCHAR(100) | | Accent color |
| banner | VARCHAR(500) | | Banner URL |
| seo_title | VARCHAR(255) | | SEO title |
| seo_description | TEXT | | SEO description |
| operation_head_id | UUID | FK → users(id) ON DELETE SET NULL | Operation head |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

#### `products`
**Purpose:** Financial product catalog

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| bank_id | UUID | FK → banks(id) | Bank reference |
| name | VARCHAR(255) | NOT NULL | Product name |
| category | product_category | NOT NULL | Product category |
| description | TEXT | | Description |
| short_description | VARCHAR(500) | | Short description |
| features | JSONB | DEFAULT '[]' | Features list |
| eligibility | JSONB | DEFAULT '{}' | Eligibility criteria |
| eligibility_criteria | TEXT | | Eligibility text |
| documents_required | TEXT | | Required documents |
| benefits | TEXT | | Benefits |
| fees_charges | TEXT | | Fees and charges |
| commission_type | VARCHAR(20) | DEFAULT 'fixed' | Commission type |
| commission_value | DECIMAL(12,2) | DEFAULT 0 | Commission value |
| commission_enabled | BOOLEAN | DEFAULT TRUE | Commission enabled |
| commission_amount | DECIMAL(12,2) | DEFAULT 0 | Commission amount |
| override_percentage | DECIMAL(5,2) | DEFAULT 0 | Override % |
| min_age | INTEGER | | Minimum age |
| max_age | INTEGER | | Maximum age |
| min_income | DECIMAL(15,2) | | Minimum income |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| display_order | INTEGER | DEFAULT 0 | Display order |
| status | VARCHAR(50) | DEFAULT 'Active' | Status |
| priority | INTEGER | DEFAULT 0 | Priority |
| image_url | VARCHAR(500) | | Image URL |
| banner_url | VARCHAR(500) | | Banner URL |
| logo | VARCHAR(500) | | Logo URL |
| banner | VARCHAR(500) | | Banner |
| image | VARCHAR(500) | | Image |
| annual_fee | VARCHAR(255) | | Annual fee |
| time_period | VARCHAR(255) | | Time period |
| card_network | VARCHAR(50) | | Card network |
| card_variant | VARCHAR(50) | | Card variant |
| best_for | VARCHAR(100) | | Best for |
| welcome_benefits | TEXT | | Welcome benefits |
| is_lifetime_free | BOOLEAN | DEFAULT FALSE | Lifetime free |
| badge | VARCHAR(50) | | Badge |
| is_recommended | BOOLEAN | DEFAULT FALSE | Recommended |
| is_trending | BOOLEAN | DEFAULT FALSE | Trending |
| trending | BOOLEAN | DEFAULT FALSE | Trending flag |
| featured | BOOLEAN | DEFAULT FALSE | Featured |
| rewards | TEXT | | Rewards |
| cashback | TEXT | | Cashback |
| approval_rate | INTEGER | DEFAULT 85 | Approval rate |
| sub_category | VARCHAR(100) | | Sub category |
| visibility | JSONB | DEFAULT '{}' | Visibility settings |
| slug | VARCHAR(255) | UNIQUE | URL slug |
| public_url | VARCHAR(1000) | | Public URL |
| partner_url | VARCHAR(1000) | | Partner URL |
| application_url | VARCHAR(1000) | | Application URL |
| apply_url | VARCHAR(1000) | | Apply URL |
| redirect_url | VARCHAR(1000) | | Redirect URL |
| public_visible | BOOLEAN | DEFAULT TRUE | Public visibility |
| partner_visible | BOOLEAN | DEFAULT TRUE | Partner visibility |
| apply_button_text | VARCHAR(100) | DEFAULT 'Apply Now' | Button text |
| seo_title | VARCHAR(255) | | SEO title |
| seo_description | TEXT | | SEO description |
| seo_keywords | TEXT | | SEO keywords |
| seo_metadata | JSONB | DEFAULT '{}' | SEO metadata |
| created_by | UUID | FK → users(id) | Created by |
| updated_by | UUID | FK → users(id) | Updated by |
| commission_release_days | INTEGER | DEFAULT 7 | Commission release days |
| tracking_enabled | BOOLEAN | DEFAULT TRUE | Tracking enabled |
| button_text | VARCHAR(100) | DEFAULT 'Apply Now' | Button text |
| redirect_type | VARCHAR(20) | DEFAULT 'new_tab' | Redirect type |
| utm_source | VARCHAR(100) | | UTM source |
| utm_medium | VARCHAR(100) | | UTM medium |
| utm_campaign | VARCHAR(100) | | UTM campaign |
| last_updated_by | UUID | FK → users(id) | Last updated by |
| last_updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |
| joining_fee | VARCHAR(255) | | Joining fee |
| interest_rate | VARCHAR(255) | | Interest rate |
| lounge_access | TEXT | | Lounge access |
| fuel_surcharge | TEXT | | Fuel surcharge |
| travel_benefits | TEXT | | Travel benefits |
| company_margin | DECIMAL(12,2) | DEFAULT 0 | Company margin |
| hold_days | INTEGER | DEFAULT 7 | Hold days |
| fees_structure | JSONB | DEFAULT '{}' | Fees structure |
| commissions_json | JSONB | DEFAULT '{}' | Commissions JSON |
| features_list | JSONB | DEFAULT '[]' | Features list |
| benefits_list | JSONB | DEFAULT '[]' | Benefits list |
| required_documents | JSONB | DEFAULT '[]' | Required documents |
| compare_specs | JSONB | DEFAULT '{}' | Compare specs |
| card_image_url | VARCHAR(500) | | Card image |
| thumbnail_url | VARCHAR(500) | | Thumbnail |
| partner_share_value | DECIMAL(12,2) | DEFAULT 0 | Partner share |
| team_member_share_value | DECIMAL(12,2) | DEFAULT 0 | Team member share |
| operation_head_id | UUID | FK → users(id) ON DELETE SET NULL | Operation head |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_products_bank_name (bank_id, name) - UNIQUE
- idx_products_slug (slug) - UNIQUE WHERE slug IS NOT NULL

#### `product_features`
**Purpose:** Structured product features

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| title | VARCHAR(255) | NOT NULL | Feature title |
| description | TEXT | | Description |
| icon | VARCHAR(100) | | Icon |
| display_order | INTEGER | DEFAULT 0 | Display order |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_prod_features_product (product_id)

#### `product_documents`
**Purpose:** Product documents/brochures

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| title | VARCHAR(255) | NOT NULL | Document title |
| document_type | VARCHAR(50) | DEFAULT 'brochure' | Document type |
| file_url | VARCHAR(500) | NOT NULL | File URL |
| file_size | INTEGER | | File size |
| display_order | INTEGER | DEFAULT 0 | Display order |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| uploaded_by | UUID | FK → users(id) ON DELETE SET NULL | Uploaded by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_prod_docs_product (product_id)

#### `product_faq`
**Purpose:** Product FAQs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| question | TEXT | NOT NULL | Question |
| answer | TEXT | NOT NULL | Answer |
| display_order | INTEGER | DEFAULT 0 | Display order |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_prod_faq_product (product_id)

#### `product_videos`
**Purpose:** Product videos

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| title | VARCHAR(255) | NOT NULL | Video title |
| youtube_url | VARCHAR(500) | | YouTube URL |
| video_url | VARCHAR(500) | | Video URL |
| thumbnail_url | VARCHAR(500) | | Thumbnail |
| duration | VARCHAR(20) | | Duration |
| display_order | INTEGER | DEFAULT 0 | Display order |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_prod_videos_product (product_id)

#### `product_offers`
**Purpose:** Product offers and promotions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| title | VARCHAR(255) | NOT NULL | Offer title |
| description | TEXT | | Description |
| offer_type | VARCHAR(50) | DEFAULT 'discount' | Offer type |
| discount_value | DECIMAL(12,2) | DEFAULT 0 | Discount value |
| start_date | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Start date |
| end_date | TIMESTAMPTZ | NOT NULL | End date |
| badge_text | VARCHAR(100) | | Badge text |
| banner_url | VARCHAR(500) | | Banner URL |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_by | UUID | FK → users(id) ON DELETE SET NULL | Created by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_prod_offers_product (product_id)
- idx_prod_offers_active (is_active, start_date, end_date)

#### `product_ratings`
**Purpose:** Product ratings by partners

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| rating | INTEGER | NOT NULL, CHECK (1-5) | Rating (1-5) |
| feedback | TEXT | | Feedback |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Constraints:**
- UNIQUE(product_id, partner_id)

**Indexes:**
- idx_prod_ratings_product (product_id)

#### `product_share_logs`
**Purpose:** Track product shares by partners

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| share_method | VARCHAR(50) | NOT NULL | Share method |
| customer_contact | VARCHAR(255) | | Customer contact |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_prod_share_partner (partner_id)

#### `partner_saved_products`
**Purpose:** Partner bookmarked products

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Constraints:**
- UNIQUE(partner_id, product_id)

**Indexes:**
- idx_saved_partner (partner_id)

#### `partner_recent_products`
**Purpose:** Partner recently viewed products

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| last_viewed_at | TIMESTAMPTZ | DEFAULT NOW() | Last viewed |

**Constraints:**
- UNIQUE(partner_id, product_id)

**Indexes:**
- idx_recent_partner (partner_id)

#### `product_views`
**Purpose:** Product view analytics

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE SET NULL | Partner reference |
| viewer_ip | VARCHAR(45) | | Viewer IP |
| user_agent | TEXT | | User agent |
| viewed_at | TIMESTAMPTZ | DEFAULT NOW() | View timestamp |

**Indexes:**
- idx_prod_views_product (product_id)
- idx_prod_views_date (viewed_at)

#### `partner_preferences`
**Purpose:** Partner preferences for recommendations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | UNIQUE, FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| preferred_categories | JSONB | DEFAULT '[]' | Preferred categories |
| preferred_banks | JSONB | DEFAULT '[]' | Preferred banks |
| preferred_commission_type | VARCHAR(20) | | Commission type |
| min_commission | DECIMAL(12,2) | DEFAULT 0 | Min commission |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

#### `commission_structures`
**Purpose:** Commission rules per product/partner

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| product_id | UUID | FK → products(id) | Product reference |
| partner_id | UUID | FK → partner_profiles(id) | Partner reference (NULL = global) |
| commission_type | VARCHAR(20) | DEFAULT 'fixed' | Commission type |
| commission_value | DECIMAL(12,2) | NOT NULL | Commission value |
| effective_from | DATE | NOT NULL DEFAULT CURRENT_DATE | Effective from |
| effective_to | DATE | | Effective to |
| created_by | UUID | FK → users(id) NOT NULL | Created by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

#### `commission_rules`
**Purpose:** Advanced commission rules

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE SET NULL | Partner reference |
| commission_type | VARCHAR(20) | DEFAULT 'fixed' | Commission type |
| commission_value | DECIMAL(15,2) | DEFAULT 0.00 | Commission value |
| parent_override_type | VARCHAR(20) | DEFAULT 'fixed' | Parent override type |
| parent_override_value | DECIMAL(15,2) | DEFAULT 0.00 | Parent override value |
| partner_percentage | DECIMAL(5,2) | DEFAULT 90.00 | Partner % |
| parent_percentage | DECIMAL(5,2) | DEFAULT 10.00 | Parent % |
| campaign_bonus | DECIMAL(15,2) | DEFAULT 0.00 | Campaign bonus |
| effective_from | DATE | DEFAULT CURRENT_DATE | Effective from |
| effective_to | DATE | | Effective to |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_comm_rules_product (product_id)

#### `admin_bank_assignments`
**Purpose:** Admin bank assignments for operations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| admin_id | UUID | FK → users(id) ON DELETE CASCADE | Admin reference |
| bank_id | UUID | FK → banks(id) ON DELETE CASCADE | Bank reference |
| category | VARCHAR(50) | NOT NULL DEFAULT 'credit_card' | Category |
| created_by | UUID | FK → users(id) | Created by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |

**Constraints:**
- UNIQUE(admin_id, bank_id, category)

---

### 4. Customer Management Module

#### `customers`
**Purpose:** Customer information registry

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| full_name | VARCHAR(255) | NOT NULL | Full name |
| mobile | VARCHAR(15) | NOT NULL | Mobile number |
| email | VARCHAR(255) | | Email |
| dob | DATE | | Date of birth |
| pan_number | VARCHAR(12) | | PAN number |
| aadhaar_last4 | VARCHAR(4) | | Aadhaar last 4 digits |
| aadhaar_number | VARCHAR(20) | | Aadhaar number |
| city | VARCHAR(100) | | City |
| state | VARCHAR(100) | | State |
| pincode | VARCHAR(10) | | Pincode |
| monthly_income | DECIMAL(15,2) | | Monthly income |
| employer | VARCHAR(255) | | Employer |
| employment_type | VARCHAR(50) | | Employment type |
| occupation | VARCHAR(100) | | Occupation |
| company_name | VARCHAR(255) | | Company name |
| business_type | VARCHAR(100) | | Business type |
| gst_number | VARCHAR(50) | | GST number |
| trade_license_number | VARCHAR(50) | | Trade license |
| pipeline_status | VARCHAR(50) | DEFAULT 'new' | Pipeline status |
| status_reason | TEXT | | Status reason |
| alternate_mobile | VARCHAR(15) | | Alternate mobile |
| nominee_name | VARCHAR(255) | | Nominee name |
| nominee_relation | VARCHAR(100) | | Nominee relation |
| product_interests | JSONB | DEFAULT '[]' | Product interests |
| is_archived | BOOLEAN | DEFAULT FALSE | Archived flag |
| archived_at | TIMESTAMPTZ | | Archive timestamp |
| is_merged | BOOLEAN | DEFAULT FALSE | Merged flag |
| merged_into_id | UUID | FK → customers(id) ON DELETE SET NULL | Merged into |
| pan | VARCHAR(20) | | PAN |
| income | DECIMAL(15,2) | | Income |
| address | TEXT | | Address |
| employment | VARCHAR(100) | | Employment |
| created_by | UUID | FK → users(id) NOT NULL | Created by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_customers_mobile (mobile) - UNIQUE
- idx_customers_pan (pan_number)

#### `customer_notes`
**Purpose:** Customer notes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| customer_id | UUID | FK → customers(id) ON DELETE CASCADE | Customer reference |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| user_id | UUID | FK → users(id) ON DELETE SET NULL | User reference |
| note | TEXT | NOT NULL | Note content |
| visibility | VARCHAR(20) | DEFAULT 'public' | Visibility |
| is_pinned | BOOLEAN | DEFAULT FALSE | Pinned flag |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_cust_notes_customer (customer_id)

#### `customer_documents`
**Purpose:** Customer documents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| customer_id | UUID | FK → customers(id) ON DELETE CASCADE | Customer reference |
| document_type | VARCHAR(50) | NOT NULL | Document type |
| file_url | VARCHAR(1000) | NOT NULL | File URL |
| s3_key | VARCHAR(500) | | S3 key |
| status | VARCHAR(50) | DEFAULT 'pending' | Status |
| verified_by | UUID | FK → users(id) ON DELETE SET NULL | Verified by |
| uploaded_at | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |

**Indexes:**
- idx_cust_docs_customer (customer_id)

#### `customer_timeline`
**Purpose:** Customer activity timeline

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| customer_id | UUID | FK → customers(id) ON DELETE CASCADE | Customer reference |
| event_type | VARCHAR(100) | NOT NULL | Event type |
| event_title | VARCHAR(255) | NOT NULL | Event title |
| event_description | TEXT | | Description |
| reference_type | VARCHAR(50) | | Reference type |
| reference_id | UUID | | Reference ID |
| created_by | UUID | FK → users(id) ON DELETE SET NULL | Created by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_cust_timeline_customer (customer_id)

#### `customer_followups`
**Purpose:** Customer follow-ups

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| customer_id | UUID | FK → customers(id) ON DELETE CASCADE | Customer reference |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| user_id | UUID | FK → users(id) ON DELETE SET NULL | User reference |
| followup_date | TIMESTAMPTZ | NOT NULL | Follow-up date |
| priority | VARCHAR(20) | DEFAULT 'medium' | Priority |
| status | VARCHAR(20) | DEFAULT 'pending' | Status |
| remarks | TEXT | | Remarks |
| completed_at | TIMESTAMPTZ | | Completion time |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_cust_followups_customer (customer_id)

#### `customer_tags`
**Purpose:** Customer tags

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| customer_id | UUID | FK → customers(id) ON DELETE CASCADE | Customer reference |
| tag_name | VARCHAR(50) | NOT NULL | Tag name |
| tag_color | VARCHAR(20) | DEFAULT '#3B82F6' | Tag color |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Constraints:**
- UNIQUE(customer_id, tag_name)

**Indexes:**
- idx_cust_tags_customer (customer_id)

#### `customer_activity_logs`
**Purpose:** Customer activity logging

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| customer_id | UUID | FK → customers(id) ON DELETE CASCADE | Customer reference |
| activity_type | VARCHAR(100) | NOT NULL | Activity type |
| performed_by | UUID | FK → users(id) ON DELETE SET NULL | Performed by |
| reference_type | VARCHAR(100) | | Reference type |
| reference_id | UUID | | Reference ID |
| ip_address | VARCHAR(100) | | IP address |
| device | TEXT | | Device |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_cust_activity_customer (customer_id)

#### `customer_communications`
**Purpose:** Customer communications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| customer_id | UUID | FK → customers(id) ON DELETE CASCADE | Customer reference |
| type | VARCHAR(20) | NOT NULL | Communication type |
| template_id | UUID | FK → notification_templates(id) ON DELETE SET NULL | Template reference |
| message | TEXT | NOT NULL | Message |
| status | VARCHAR(20) | DEFAULT 'sent' | Status |
| sent_by | UUID | FK → users(id) ON DELETE SET NULL | Sent by |
| sent_at | TIMESTAMPTZ | DEFAULT NOW() | Sent timestamp |

**Indexes:**
- idx_cust_comm_customer (customer_id)

#### `customer_access_tokens`
**Purpose:** Customer access tokens for application forms

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| application_id | UUID | FK → applications(id) ON DELETE CASCADE | Application reference |
| customer_id | UUID | FK → customers(id) ON DELETE CASCADE | Customer reference |
| token | VARCHAR(255) | UNIQUE NOT NULL | Access token |
| expires_at | TIMESTAMPTZ | NOT NULL | Expiry |
| is_used | BOOLEAN | DEFAULT FALSE | Used flag |
| token_type | VARCHAR(50) | DEFAULT 'general' | Token type |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_cat_token (token)
- idx_cat_app (application_id)

---

### 5. Application Management Module

#### `applications`
**Purpose:** Financial product applications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| app_number | VARCHAR(20) | UNIQUE NOT NULL | Application number |
| application_number | VARCHAR(50) | | Application number |
| customer_id | UUID | FK → customers(id) NOT NULL | Customer reference |
| product_id | UUID | FK → products(id) NOT NULL | Product reference |
| partner_id | UUID | FK → partner_profiles(id) NOT NULL | Partner reference |
| parent_partner_id | UUID | FK → partner_profiles(id) ON DELETE SET NULL | Parent partner |
| team_member_id | UUID | FK → partner_profiles(id) ON DELETE SET NULL | Team member |
| bank_id | UUID | FK → banks(id) ON DELETE SET NULL | Bank reference |
| submitted_by | UUID | FK → users(id) NOT NULL | Submitted by |
| status | application_status | DEFAULT 'submitted' | Application status |
| bank_ref_number | VARCHAR(100) | | Bank reference |
| bank_application_number | VARCHAR(100) | | Bank application number |
| loan_amount | DECIMAL(15,2) | | Loan amount |
| approved_amount | DECIMAL(15,2) | | Approved amount |
| credit_limit | DECIMAL(15,2) | | Credit limit |
| interest_rate | DECIMAL(5,2) | | Interest rate |
| tenure_months | INTEGER | | Tenure in months |
| disbursal_date | DATE | | Disbursal date |
| rejection_reason | TEXT | | Rejection reason |
| notes | TEXT | | Notes |
| remarks | TEXT | | Remarks |
| documents | JSONB | DEFAULT '[]' | Documents |
| status_history | JSONB | DEFAULT '[]' | Status history |
| commission_amount | DECIMAL(12,2) | | Commission amount |
| commission_status | VARCHAR(50) | DEFAULT 'pending' | Commission status |
| commission_released | BOOLEAN | DEFAULT FALSE | Commission released |
| source | VARCHAR(100) | DEFAULT 'partner_portal' | Source |
| process_type | VARCHAR(50) | DEFAULT 'lead_punching' | Process type |
| process_by | VARCHAR(50) | DEFAULT 'partner' | Processed by |
| form_status | VARCHAR(100) | DEFAULT 'pending' | Form status |
| lead_id | UUID | FK → leads(id) ON DELETE SET NULL | Lead reference |
| tracking_token | VARCHAR(100) | | Tracking token |
| tracking_id | VARCHAR(100) | | Tracking ID |
| bank_url | VARCHAR(500) | | Bank URL |
| vkyc_status | VARCHAR(50) | DEFAULT 'pending' | VKYC status |
| vkyc_url | TEXT | | VKYC URL |
| salary_slip_url | TEXT | | Salary slip URL |
| pan_card_url | TEXT | | PAN card URL |
| pan_number | VARCHAR(50) | | PAN number |
| city | VARCHAR(100) | | City |
| state | VARCHAR(100) | | State |
| pincode | VARCHAR(10) | | Pincode |
| appcode_status | VARCHAR(50) | | App code status |
| soft_approval_status | VARCHAR(50) | | Soft approval |
| vkyc_stage | VARCHAR(50) | | VKYC stage |
| iqa_stage | VARCHAR(50) | | IQA stage |
| ipa_stage | VARCHAR(100) | | IPA stage |
| kyc_stage | VARCHAR(100) | | KYC stage |
| card_approval_stage | VARCHAR(100) | | Card approval |
| digital_card_issued | VARCHAR(100) | | Digital card |
| dispatch_status | VARCHAR(50) | | Dispatch status |
| bank_remark | TEXT | | Bank remark |
| user_remark | TEXT | | User remark |
| notes | TEXT | | Notes |
| final_status | VARCHAR(50) | | Final status |
| app_file_generated | VARCHAR(50) | | File generated |
| decline_reason | TEXT | | Decline reason |
| eligible_reqd | VARCHAR(50) | | Eligible required |
| backend_remark | TEXT | | Backend remark |
| sales_operator_code | VARCHAR(100) | | Sales operator |
| pan_checker_code | VARCHAR(100) | | PAN checker |
| remark_operator_code | VARCHAR(100) | | Remark operator |
| requery_date | TIMESTAMPTZ | | Requery date |
| remark_status | VARCHAR(20) | DEFAULT 'PENDING' | Remark status |
| remark_updated | BOOLEAN | DEFAULT FALSE | Remark updated |
| remark_updated_by | UUID | FK → users(id) | Updated by |
| remark_updated_at | TIMESTAMPTZ | | Update timestamp |
| kyc_status | VARCHAR(50) | DEFAULT 'PENDING' | KYC status |
| kyc_remarks | TEXT | | KYC remarks |
| bio_stage | VARCHAR(100) | DEFAULT 'Bio pending' | Bio stage |
| digilocker_stage | VARCHAR(100) | | Digilocker stage |
| last_operator_id | UUID | | Last operator |
| last_operator_name | VARCHAR(255) | | Last operator name |
| last_operator_code | VARCHAR(100) | | Last operator code |
| last_operator_role | VARCHAR(100) | | Last operator role |
| last_operator_designation | VARCHAR(100) | | Last operator designation |
| last_operated_at | TIMESTAMPTZ | | Last operated |
| submitted_at | TIMESTAMPTZ | | Submitted at |
| approved_at | TIMESTAMPTZ | | Approved at |
| commission_received_at | TIMESTAMPTZ | | Commission received |
| commission_paid_at | TIMESTAMPTZ | | Commission paid |
| business_type | VARCHAR(100) | | Business type |
| gst_number | VARCHAR(50) | | GST number |
| trade_license_number | VARCHAR(50) | | Trade license |
| company_name | VARCHAR(255) | | Company name |
| country_code | VARCHAR(10) | DEFAULT '+91' | Country code |
| agree_terms | BOOLEAN | DEFAULT TRUE | Terms agreed |
| monthly_salary | NUMERIC(15,2) | | Monthly salary |
| metadata | JSONB | DEFAULT '{}' | Metadata |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_applications_Partner (partner_id)
- idx_applications_team_member (team_member_id)
- idx_applications_bank (bank_id)
- idx_applications_lead (lead_id)
- idx_applications_status (status)
- idx_applications_created (created_at DESC)
- idx_applications_customer (customer_id)
- idx_applications_product (product_id)
- idx_applications_process_type (process_type)
- idx_applications_source (source)
- idx_applications_final_status (final_status)

#### `application_timeline`
**Purpose:** Application status timeline

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| application_id | UUID | FK → applications(id) ON DELETE CASCADE | Application reference |
| status | VARCHAR(50) | NOT NULL | Status |
| activity | VARCHAR(255) | NOT NULL | Activity |
| remarks | TEXT | | Remarks |
| performed_by | UUID | FK → users(id) ON DELETE SET NULL | Performed by |
| performed_at | TIMESTAMPTZ | DEFAULT NOW() | Performed at |
| event_type | VARCHAR(100) | | Event type |
| title | VARCHAR(255) | | Title |
| description | TEXT | | Description |
| actor_type | VARCHAR(50) | DEFAULT 'system' | Actor type |
| actor_id | UUID | | Actor ID |
| metadata | JSONB | DEFAULT '{}' | Metadata |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_timeline_app (application_id)
- idx_app_timeline_created (created_at ASC)

#### `application_notes`
**Purpose:** Application notes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| application_id | UUID | FK → applications(id) ON DELETE CASCADE | Application reference |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User reference |
| note | TEXT | NOT NULL | Note content |
| visibility | VARCHAR(50) | DEFAULT 'public' | Visibility |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_notes_app (application_id)

#### `application_documents`
**Purpose:** Application documents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| application_id | UUID | FK → applications(id) ON DELETE CASCADE | Application reference |
| document_type | VARCHAR(100) | NOT NULL | Document type |
| file_url | TEXT | NOT NULL | File URL |
| file_name | VARCHAR(255) | NOT NULL | File name |
| mime_type | VARCHAR(100) | NOT NULL | MIME type |
| status | VARCHAR(50) | DEFAULT 'uploaded' | Status |
| uploaded_by_customer | BOOLEAN | DEFAULT TRUE | Uploaded by customer |
| uploaded_at | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |
| verified_by | UUID | FK → users(id) | Verified by |
| verified_at | TIMESTAMPTZ | | Verification timestamp |
| rejection_reason | TEXT | | Rejection reason |
| version | INTEGER | DEFAULT 1 | Version |
| is_latest | BOOLEAN | DEFAULT TRUE | Latest flag |

**Indexes:**
- idx_app_docs_app (application_id)
- idx_app_docs_type (document_type)

#### `commission_ledger`
**Purpose:** Commission tracking ledger

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| application_id | UUID | FK → applications(id) ON DELETE CASCADE | Application reference |
| lead_id | UUID | FK → leads(id) ON DELETE CASCADE | Lead reference |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| parent_partner_id | UUID | FK → partner_profiles(id) ON DELETE SET NULL | Parent partner |
| commission_amount | DECIMAL(15,2) | DEFAULT 0 | Commission amount |
| override_amount | DECIMAL(15,2) | DEFAULT 0 | Override amount |
| status | VARCHAR(50) | DEFAULT 'pending' | Status |
| product_name | VARCHAR(255) | | Product name |
| transaction_amount | DECIMAL(15,2) | DEFAULT 0 | Transaction amount |
| commission_rate | DECIMAL(15,2) | DEFAULT 0 | Commission rate |
| commission_earned | DECIMAL(15,2) | DEFAULT 0 | Commission earned |
| customer_id | UUID | | Customer ID |
| bank_id | UUID | | Bank ID |
| product_id | UUID | | Product ID |
| team_member_id | UUID | | Team member ID |
| commission_rule_id | UUID | | Commission rule ID |
| total_commission | DECIMAL(15,2) | | Total commission |
| partner_pct | DECIMAL(5,2) | | Partner % |
| team_member_pct | DECIMAL(5,2) | | Team member % |
| partner_amount | DECIMAL(15,2) | | Partner amount |
| team_member_amount | DECIMAL(15,2) | | Team member amount |
| approved_at | TIMESTAMPTZ | | Approved at |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_comm_ledger_app (application_id)
- idx_comm_ledger_lead (lead_id)

#### `physical_application_details`
**Purpose:** Physical application form details

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| application_id | UUID | UNIQUE, FK → applications(id) ON DELETE CASCADE | Application reference |
| aadhaar_linked_mobile | VARCHAR(20) | | Aadhaar mobile |
| pan_name | VARCHAR(255) | | PAN name |
| dob | VARCHAR(50) | | DOB |
| pan_number | VARCHAR(20) | | PAN number |
| mother_name | VARCHAR(255) | | Mother name |
| personal_email | VARCHAR(255) | | Personal email |
| company_name | VARCHAR(255) | | Company name |
| designation | VARCHAR(255) | | Designation |
| flat_no | VARCHAR(255) | | Flat number |
| sub_area | VARCHAR(255) | | Sub area |
| landmark | VARCHAR(255) | | Landmark |
| pincode | VARCHAR(20) | | Pincode |
| company_address | TEXT | | Company address |
| backend_remark | TEXT | | Backend remark |
| sales_operator_code | VARCHAR(100) | | Sales operator |
| pan_checker_code | VARCHAR(100) | | PAN checker |
| remark_operator_code | VARCHAR(100) | | Remark operator |
| requery_date | TIMESTAMPTZ | | Requery date |
| kyc_stage | VARCHAR(100) | | KYC stage |
| vkyc_stage | VARCHAR(100) | | VKYC stage |
| bio_stage | VARCHAR(100) | | Bio stage |
| digilocker_stage | VARCHAR(100) | | Digilocker stage |
| vkyc_url | TEXT | | VKYC URL |
| kyc_remarks | TEXT | | KYC remarks |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_pad_app (application_id)

#### `bank_card_applications`
**Purpose:** Bank-specific credit card applications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| application_no | VARCHAR(30) | UNIQUE NOT NULL | Application number |
| bank_id | UUID | FK → banks(id) NOT NULL | Bank reference |
| customer_id | UUID | FK → customers(id) | Customer reference |
| partner_id | UUID | FK → partner_profiles(id) | Partner reference |
| credit_card_category | VARCHAR(100) | | Card category |
| customer_name | VARCHAR(255) | NOT NULL | Customer name |
| customer_mobile | VARCHAR(15) | NOT NULL | Customer mobile |
| pan_number | VARCHAR(10) | NOT NULL | PAN number |
| resident_pincode | VARCHAR(10) | | Pincode |
| process_by | UUID | FK → users(id) | Processed by |
| pan_check_comments | TEXT | | PAN check comments |
| qd_executive_name | VARCHAR(255) | | QD executive |
| resident_pin_comments | TEXT | | Pin comments |
| next_qd_date | DATE | | Next QD date |
| dob | DATE | | DOB |
| mother_name | VARCHAR(255) | | Mother name |
| residence_address | TEXT | | Residence address |
| company_name | VARCHAR(255) | | Company name |
| designation | VARCHAR(255) | | Designation |
| email | VARCHAR(255) | | Email |
| official_email | VARCHAR(255) | | Official email |
| gross_monthly_income | DECIMAL(12,2) | | Monthly income |
| pan_check_executive_name | VARCHAR(255) | | PAN checker |
| app_code_status | VARCHAR(50) | | App code status |
| qd_status | VARCHAR(50) | | QD status |
| surrogate | VARCHAR(100) | | Surrogate |
| income_status | VARCHAR(50) | | Income status |
| blaze_status | VARCHAR(50) | | Blaze status |
| telco_stage | VARCHAR(50) | | Telco stage |
| official_mail_status | VARCHAR(50) | | Mail status |
| vkyc_status | VARCHAR(50) | | VKYC status |
| dispatch_stage | VARCHAR(50) | | Dispatch stage |
| final_stage | VARCHAR(50) | DEFAULT 'Customer Details' | Final stage |
| decline_description | TEXT | | Decline description |
| decline_code | VARCHAR(50) | | Decline code |
| curable_solved | VARCHAR(50) | | Curable solved |
| curable_executive | VARCHAR(255) | | Curable executive |
| other_comments | TEXT | | Other comments |
| not_interested_comment | TEXT | | Not interested |
| kyc_pending_comment | TEXT | | KYC pending |
| bank_application_number | VARCHAR(100) | | Bank app number |
| bank_ref_number | VARCHAR(100) | | Bank ref number |
| created_by | UUID | FK → users(id) | Created by |
| updated_by | UUID | FK → users(id) | Updated by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_bcca_bank (bank_id)
- idx_bcca_status (final_stage)
- idx_bcca_pan (pan_number)

#### `bank_card_application_timeline`
**Purpose:** Bank card application timeline

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| application_id | UUID | FK → bank_card_applications(id) ON DELETE CASCADE | Application reference |
| stage | VARCHAR(50) | NOT NULL | Stage |
| note | TEXT | | Note |
| changed_by | UUID | FK → users(id) | Changed by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_bcat_app (application_id)

#### `sbi_credit_card_applications`
**Purpose:** SBI-specific credit card applications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Similar structure to bank_card_applications | | | |

#### `sbi_cc_application_timeline`
**Purpose:** SBI card application timeline

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Similar structure to bank_card_application_timeline | | | |

#### `loan_applications`
**Purpose:** Loan applications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| loan_type_slug | VARCHAR(100) | NOT NULL | Loan type |
| customer_name | VARCHAR(255) | NOT NULL | Customer name |
| mobile | VARCHAR(15) | NOT NULL | Mobile |
| email | VARCHAR(255) | | Email |
| loan_amount | NUMERIC(15,2) | | Loan amount |
| tenure_months | INTEGER | | Tenure |
| interest_rate | NUMERIC(5,2) | | Interest rate |
| monthly_income | NUMERIC(15,2) | | Monthly income |
| employer_name | VARCHAR(255) | | Employer |
| pincode | VARCHAR(10) | | Pincode |
| city | VARCHAR(100) | | City |
| state | VARCHAR(100) | | State |
| partner_id | UUID | FK → partner_profiles(id) | Partner reference |
| status | VARCHAR(50) | DEFAULT 'submitted' | Status |
| remarks | TEXT | | Remarks |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_loan_app_type (loan_type_slug)
- idx_loan_app_status (status)

#### `insurance_applications`
**Purpose:** Insurance applications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| insurance_type_slug | VARCHAR(100) | NOT NULL | Insurance type |
| customer_name | VARCHAR(255) | NOT NULL | Customer name |
| mobile | VARCHAR(15) | NOT NULL | Mobile |
| email | VARCHAR(255) | | Email |
| policy_type | VARCHAR(100) | | Policy type |
| sum_insured | NUMERIC(15,2) | | Sum insured |
| premium_amount | NUMERIC(15,2) | | Premium |
| pincode | VARCHAR(10) | | Pincode |
| city | VARCHAR(100) | | City |
| state | VARCHAR(100) | | State |
| nominee_name | VARCHAR(255) | | Nominee |
| partner_id | UUID | FK → partner_profiles(id) | Partner reference |
| status | VARCHAR(50) | DEFAULT 'submitted' | Status |
| remarks | TEXT | | Remarks |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_ins_app_type (insurance_type_slug)
- idx_ins_app_status (status)

#### `application_admin_assignments`
**Purpose:** Admin application assignments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| application_id | UUID | FK → applications(id) ON DELETE CASCADE | Application reference |
| admin_user_id | UUID | FK → users(id) ON DELETE CASCADE | Admin reference |
| assigned_by | UUID | FK → users(id) | Assigned by |
| assigned_at | TIMESTAMPTZ | DEFAULT NOW() | Assignment time |
| completed_at | TIMESTAMPTZ | | Completion time |
| status | VARCHAR(20) | DEFAULT 'PENDING' | Status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Constraints:**
- UNIQUE(application_id, admin_user_id)

#### `application_audit_logs`
**Purpose:** Application audit logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| application_id | UUID | FK → applications(id) ON DELETE CASCADE | Application reference |
| entity_id | UUID | | Entity ID |
| lead_id | UUID | FK → leads(id) ON DELETE SET NULL | Lead reference |
| user_id | UUID | FK → users(id) ON DELETE SET NULL | User reference |
| role | VARCHAR(50) | | Role |
| action | VARCHAR(100) | NOT NULL | Action |
| entity | VARCHAR(50) | DEFAULT 'application' | Entity |
| old_value | JSONB | | Old value |
| new_value | JSONB | | New value |
| remarks | TEXT | | Remarks |
| ip_address | VARCHAR(100) | | IP address |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_audit_entity (entity, entity_id)
- idx_audit_user (user_id)

#### `application_links`
**Purpose:** Application share links

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| token | VARCHAR(255) | UNIQUE NOT NULL | Token |
| lead_id | UUID | FK → leads(id) ON DELETE CASCADE | Lead reference |
| application_id | UUID | FK → applications(id) ON DELETE CASCADE | Application reference |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| created_by | UUID | FK → users(id) ON DELETE SET NULL | Created by |
| status | VARCHAR(20) | DEFAULT 'ACTIVE' | Status |
| expires_at | TIMESTAMPTZ | NOT NULL | Expiry |
| used_at | TIMESTAMPTZ | | Used at |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

---

### 6. Lead Management Module

#### `leads`
**Purpose:** Lead management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| customer_name | VARCHAR(255) | NOT NULL | Customer name |
| mobile | VARCHAR(15) | NOT NULL | Mobile |
| city | VARCHAR(100) | | City |
| status | VARCHAR(50) | DEFAULT 'pending' | Status |
| lead_number | VARCHAR(50) | | Lead number |
| customer_id | UUID | FK → customers(id) | Customer reference |
| created_by | UUID | FK → users(id) | Created by |
| parent_partner_id | UUID | FK → partner_profiles(id) | Parent partner |
| customer_email | VARCHAR(255) | | Customer email |
| customer_mobile | VARCHAR(15) | | Customer mobile |
| source | VARCHAR(100) | | Source |
| pipeline_stage | VARCHAR(50) | | Pipeline stage |
| priority | VARCHAR(50) | | Priority |
| tracking_token | VARCHAR(100) | UNIQUE | Tracking token |
| process_type | VARCHAR(50) | DEFAULT 'lead_punching' | Process type |
| otp_code | VARCHAR(10) | | OTP code |
| otp_expires_at | TIMESTAMPTZ | | OTP expiry |
| otp_verified | BOOLEAN | DEFAULT FALSE | OTP verified |
| otp_verified_at | TIMESTAMPTZ | | Verification time |
| confirmed_at | TIMESTAMPTZ | | Confirmed at |
| pan_number | VARCHAR(15) | | PAN number |
| aadhaar_number | VARCHAR(20) | | Aadhaar number |
| state | VARCHAR(100) | | State |
| pincode | VARCHAR(10) | | Pincode |
| email | VARCHAR(255) | | Email |
| monthly_income | DECIMAL(15,2) | | Monthly income |
| company_name | VARCHAR(255) | | Company name |
| application_id | UUID | FK → applications(id) ON DELETE SET NULL | Application reference |
| otp_attempts | INTEGER | DEFAULT 0 | OTP attempts |
| otp_sent_count | INTEGER | DEFAULT 1 | OTP sent count |
| last_otp_sent_at | TIMESTAMPTZ | DEFAULT NOW() | Last OTP sent |
| process_by | VARCHAR(50) | DEFAULT 'punching' | Processed by |
| rejection_reason | TEXT | | Rejection reason |
| sla_status | VARCHAR(20) | DEFAULT 'on_track' | SLA status |
| expected_completion_at | TIMESTAMPTZ | | Expected completion |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_leads_partner (partner_id)
- idx_leads_tracking_token (tracking_token)
- idx_active_lead_product_mobile (product_id, mobile) WHERE status NOT IN ('rejected', 'cancelled')

#### `lead_followups`
**Purpose:** Lead follow-ups

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| lead_id | UUID | FK → leads(id) ON DELETE CASCADE | Lead reference |
| scheduled_by | UUID | FK → users(id) NOT NULL | Scheduled by |
| follow_up_at | TIMESTAMPTZ | NOT NULL | Follow-up time |
| note | TEXT | | Note |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_lead_followups_lead (lead_id)

#### `lead_documents`
**Purpose:** Lead documents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| lead_id | UUID | FK → leads(id) ON DELETE CASCADE | Lead reference |
| document_type | VARCHAR(50) | NOT NULL | Document type |
| file_url | VARCHAR(1000) | NOT NULL | File URL |
| s3_key | VARCHAR(500) | | S3 key |
| verification_status | VARCHAR(50) | DEFAULT 'pending' | Verification status |
| uploaded_by | UUID | FK → users(id) ON DELETE SET NULL | Uploaded by |
| uploaded_at | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |

**Indexes:**
- idx_lead_docs_lead (lead_id)

#### `lead_timeline`
**Purpose:** Lead timeline

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| lead_id | UUID | FK → leads(id) ON DELETE CASCADE | Lead reference |
| title | VARCHAR(255) | NOT NULL | Title |
| description | TEXT | | Description |
| reference_type | VARCHAR(50) | | Reference type |
| reference_id | UUID | | Reference ID |
| created_by | UUID | FK → users(id) ON DELETE SET NULL | Created by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_lead_timeline_lead (lead_id)

#### `lead_notes`
**Purpose:** Lead notes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| lead_id | UUID | FK → leads(id) ON DELETE CASCADE | Lead reference |
| user_id | UUID | FK → users(id) ON DELETE SET NULL | User reference |
| role | VARCHAR(50) | | Role |
| note | TEXT | NOT NULL | Note content |
| visibility | VARCHAR(20) | DEFAULT 'partner' | Visibility |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_lead_notes_lead (lead_id)

#### `lead_assignments`
**Purpose:** Lead assignments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| lead_id | UUID | FK → leads(id) ON DELETE CASCADE | Lead reference |
| assigned_to | UUID | FK → users(id) ON DELETE CASCADE | Assigned to |
| team | VARCHAR(50) | DEFAULT 'operations' | Team |
| assigned_by | UUID | FK → users(id) ON DELETE SET NULL | Assigned by |
| assigned_at | TIMESTAMPTZ | DEFAULT NOW() | Assignment time |
| status | VARCHAR(20) | DEFAULT 'active' | Status |

**Indexes:**
- idx_lead_assignments_lead (lead_id)

#### `lead_activity_logs`
**Purpose:** Lead activity logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| lead_id | UUID | FK → leads(id) ON DELETE CASCADE | Lead reference |
| activity_type | VARCHAR(100) | NOT NULL | Activity type |
| performed_by | UUID | FK → users(id) ON DELETE SET NULL | Performed by |
| reference_type | VARCHAR(50) | | Reference type |
| reference_id | UUID | | Reference ID |
| ip_address | VARCHAR(45) | | IP address |
| device | VARCHAR(100) | | Device |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_lead_activity_lead (lead_id)

#### `lead_status_history`
**Purpose:** Lead status history

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| lead_id | UUID | FK → leads(id) ON DELETE CASCADE | Lead reference |
| old_status | VARCHAR(50) | | Old status |
| new_status | VARCHAR(50) | NOT NULL | New status |
| changed_by | UUID | FK → users(id) ON DELETE SET NULL | Changed by |
| remarks | TEXT | | Remarks |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_lead_history_lead (lead_id)

#### `lead_checklist`
**Purpose:** Lead verification checklist

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| lead_id | UUID | FK → leads(id) ON DELETE CASCADE | Lead reference |
| item | VARCHAR(100) | NOT NULL | Checklist item |
| status | VARCHAR(20) | DEFAULT 'pending' | Status |
| verified_by | UUID | FK → users(id) ON DELETE SET NULL | Verified by |
| verified_at | TIMESTAMPTZ | | Verification time |

**Constraints:**
- UNIQUE(lead_id, item)

**Indexes:**
- idx_lead_check_lead (lead_id)

#### `lead_sla`
**Purpose:** Lead SLA tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| lead_id | UUID | FK → leads(id) ON DELETE CASCADE | Lead reference |
| stage_name | VARCHAR(50) | NOT NULL | Stage name |
| started_at | TIMESTAMPTZ | DEFAULT NOW() | Start time |
| expected_time_hours | INTEGER | DEFAULT 48 | Expected hours |
| completed_at | TIMESTAMPTZ | | Completion time |
| is_overdue | BOOLEAN | DEFAULT FALSE | Overdue flag |
| delay_minutes | INTEGER | DEFAULT 0 | Delay minutes |

**Indexes:**
- idx_lead_sla_lead (lead_id)

#### `bank_assignments`
**Purpose:** Bank executive assignments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| lead_id | UUID | FK → leads(id) ON DELETE CASCADE | Lead reference |
| bank_id | UUID | FK → banks(id) ON DELETE CASCADE | Bank reference |
| executive_name | VARCHAR(255) | NOT NULL | Executive name |
| mobile | VARCHAR(15) | | Mobile |
| email | VARCHAR(255) | | Email |
| assigned_at | TIMESTAMPTZ | DEFAULT NOW() | Assignment time |
| status | VARCHAR(20) | DEFAULT 'assigned' | Status |

**Indexes:**
- idx_bank_assign_lead (lead_id)

#### `partner_share_links`
**Purpose:** Partner share links for lead generation

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| tracking_token | VARCHAR(100) | UNIQUE NOT NULL | Tracking token |
| application_id | UUID | | Application ID |
| lead_id | UUID | | Lead ID |
| created_by | UUID | | Created by |
| status | VARCHAR(50) | DEFAULT 'ACTIVE' | Status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| expires_at | TIMESTAMPTZ | DEFAULT NOW() + INTERVAL '30 days' | Expiry |

**Indexes:**
- idx_partner_share_links_token (tracking_token)
- idx_partner_share_links_partner (partner_id)

---

### 7. Wallet & Commission Module

#### `partner_wallets`
**Purpose:** Partner wallet balances

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | UNIQUE, FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| available_balance | DECIMAL(15,2) | DEFAULT 0.00 | Available balance |
| hold_balance | DECIMAL(15,2) | DEFAULT 0.00 | Hold balance |
| bonus_balance | DECIMAL(15,2) | DEFAULT 0.00 | Bonus balance |
| total_earned | DECIMAL(15,2) | DEFAULT 0 | Total earned |
| total_withdrawn | DECIMAL(15,2) | DEFAULT 0 | Total withdrawn |
| locked_balance | DECIMAL(15,2) | DEFAULT 0.00 | Locked balance |
| pending_balance | DECIMAL(15,2) | DEFAULT 0 | Pending balance |
| withdrawn_balance | DECIMAL(15,2) | DEFAULT 0 | Withdrawn balance |
| override_balance | DECIMAL(15,2) | DEFAULT 0 | Override balance |
| personal_earnings | DECIMAL(15,2) | DEFAULT 0 | Personal earnings |
| team_earnings | DECIMAL(15,2) | DEFAULT 0 | Team earnings |
| referral_bonus | DECIMAL(15,2) | DEFAULT 0 | Referral bonus |
| pending_team_commission | DECIMAL(15,2) | DEFAULT 0 | Pending team commission |
| released_team_commission | DECIMAL(15,2) | DEFAULT 0 | Released team commission |
| status | VARCHAR(20) | DEFAULT 'active' | Status |
| last_updated | TIMESTAMPTZ | DEFAULT NOW() | Last update |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_partner_wallets_partner (partner_id)

#### `wallet_ledger`
**Purpose:** Wallet transaction ledger

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| wallet_id | UUID | FK → partner_wallets(id) | Wallet reference |
| partner_id | UUID | FK → partner_profiles(id) NOT NULL | Partner reference |
| application_id | UUID | FK → applications(id) ON DELETE SET NULL | Application reference |
| transaction_type | ledger_transaction_type | NOT NULL | Transaction type |
| credit | DECIMAL(15,2) | DEFAULT 0 | Credit amount |
| debit | DECIMAL(15,2) | DEFAULT 0 | Debit amount |
| balance_after_transaction | DECIMAL(15,2) | DEFAULT 0 | Balance after |
| balance_after | DECIMAL(15,2) | DEFAULT 0.00 | Balance after |
| description | VARCHAR(500) | | Description |
| reference_number | VARCHAR(100) | | Reference number |
| status | VARCHAR(50) | DEFAULT 'completed' | Status |
| product_id | UUID | FK → products(id) ON DELETE SET NULL | Product reference |
| bank_id | UUID | FK → banks(id) ON DELETE SET NULL | Bank reference |
| lead_id | UUID | FK → leads(id) ON DELETE SET NULL | Lead reference |
| customer_name | VARCHAR(255) | | Customer name |
| hold_until | TIMESTAMPTZ | | Hold until |
| remarks | TEXT | | Remarks |
| created_by | UUID | FK → users(id) | Created by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_wallet_ledger_partner (partner_id)
- idx_wallet_ledger_unique_commission (application_id, transaction_type, partner_id) WHERE application_id IS NOT NULL

#### `wallet_transactions`
**Purpose:** Wallet transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| wallet_id | UUID | FK → partner_wallets(id) | Wallet reference |
| partner_id | UUID | FK → partner_profiles(id) | Partner reference |
| application_id | UUID | FK → applications(id) ON DELETE SET NULL | Application reference |
| lead_id | UUID | FK → leads(id) ON DELETE SET NULL | Lead reference |
| type | VARCHAR(20) | NOT NULL | Transaction type |
| amount | DECIMAL(15,2) | NOT NULL | Amount |
| balance_before | DECIMAL(15,2) | | Balance before |
| balance_after | DECIMAL(15,2) | | Balance after |
| balance_after_transaction | DECIMAL(15,2) | DEFAULT 0.00 | Balance after |
| status | VARCHAR(20) | DEFAULT 'pending' | Status |
| description | VARCHAR(500) | | Description |
| reference_type | VARCHAR(100) | | Reference type |
| reference_id | VARCHAR(255) | | Reference ID |
| bank_name | VARCHAR(100) | | Bank name |
| product_type | VARCHAR(100) | | Product type |
| product_id | UUID | FK → products(id) | Product reference |
| commission_type | VARCHAR(50) | | Commission type |
| gst | DECIMAL(15,2) | DEFAULT 0 | GST |
| tds | DECIMAL(15,2) | DEFAULT 0 | TDS |
| net_amount | DECIMAL(15,2) | DEFAULT 0 | Net amount |
| remarks | TEXT | | Remarks |
| reference_number | VARCHAR(100) | | Reference number |
| release_at | TIMESTAMPTZ | | Release at |
| processed_by | UUID | FK → users(id) | Processed by |
| processed_at | TIMESTAMPTZ | | Processed at |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_wallet_txn_wallet (wallet_id)
- idx_wallet_txn_status (status) WHERE status = 'pending'
- idx_wallet_txn_release (release_at) WHERE status = 'pending'
- idx_wallet_txns_partner (partner_id)

#### `wallet_withdrawals`
**Purpose:** Wallet withdrawal requests

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| wallet_id | UUID | FK → partner_wallets(id) | Wallet reference |
| partner_id | UUID | FK → partner_profiles(id) NOT NULL | Partner reference |
| bank_detail_id | UUID | FK → partner_bank_details(id) ON DELETE SET NULL | Bank detail reference |
| amount | DECIMAL(15,2) | NOT NULL | Amount |
| status | VARCHAR(30) | DEFAULT 'pending' | Status |
| bank_name | VARCHAR(100) | | Bank name |
| account_number | VARCHAR(50) | | Account number |
| ifsc_code | VARCHAR(15) | | IFSC code |
| utr_number | VARCHAR(50) | | UTR number |
| utr | VARCHAR(100) | | UTR |
| bank_reference | VARCHAR(100) | | Bank reference |
| transfer_id | VARCHAR(100) | | Transfer ID |
| otp_code | VARCHAR(10) | | OTP code |
| otp_expires_at | TIMESTAMPTZ | | OTP expiry |
| transferred_by | UUID | FK → users(id) ON DELETE SET NULL | Transferred by |
| transferred_at | TIMESTAMPTZ | | Transferred at |
| settlement_date | TIMESTAMPTZ | | Settlement date |
| tds_rate | NUMERIC(5,2) | DEFAULT 2.00 | TDS rate |
| tds_amount | NUMERIC(15,2) | DEFAULT 0.00 | TDS amount |
| net_amount | NUMERIC(15,2) | | Net amount |
| processed_by | UUID | FK → users(id) | Processed by |
| processed_at | TIMESTAMPTZ | | Processed at |
| rejection_reason | TEXT | | Rejection reason |
| admin_note | TEXT | | Admin note |
| razorpay_contact_id | VARCHAR(100) | | Razorpay contact |
| razorpay_fund_account_id | VARCHAR(100) | | Razorpay fund account |
| razorpay_payout_id | VARCHAR(100) | | Razorpay payout |
| failure_reason | TEXT | | Failure reason |
| remarks | TEXT | | Remarks |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_withdrawal_partner (partner_id, status)
- idx_wallet_withdrawals_partner (partner_id)

#### `wallet_audit_logs`
**Purpose:** Wallet audit logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| wallet_id | UUID | FK → partner_wallets(id) ON DELETE CASCADE | Wallet reference |
| action | VARCHAR(50) | NOT NULL | Action |
| old_available_balance | DECIMAL(15,2) | | Old available balance |
| new_available_balance | DECIMAL(15,2) | | New available balance |
| old_hold_balance | DECIMAL(15,2) | | Old hold balance |
| new_hold_balance | DECIMAL(15,2) | | New hold balance |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_wallet_audit_logs_created_at (created_at DESC)

#### `commission_release_jobs`
**Purpose:** Scheduled commission release jobs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| ledger_id | UUID | FK → wallet_ledger(id) ON DELETE CASCADE | Ledger reference |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| amount | DECIMAL(15,2) | NOT NULL | Amount |
| release_date | TIMESTAMPTZ | NOT NULL | Release date |
| status | VARCHAR(20) | DEFAULT 'pending' | Status |
| processed_at | TIMESTAMPTZ | | Processed at |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_comm_release_jobs_date (release_date, status)

#### `withdrawal_audit_logs`
**Purpose:** Withdrawal audit logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| withdrawal_id | UUID | FK → wallet_withdrawals(id) ON DELETE CASCADE | Withdrawal reference |
| action | VARCHAR(50) | NOT NULL | Action |
| performed_by | UUID | FK → users(id) ON DELETE SET NULL | Performed by |
| old_status | VARCHAR(30) | | Old status |
| new_status | VARCHAR(30) | | New status |
| remarks | TEXT | | Remarks |
| ip_address | VARCHAR(45) | | IP address |
| device | VARCHAR(100) | | Device |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_withdrawal_audit_w (withdrawal_id)

#### `wallet_reconciliation`
**Purpose:** Wallet reconciliation

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| reconciliation_date | DATE | DEFAULT CURRENT_DATE | Reconciliation date |
| wallet_balance | DECIMAL(15,2) | DEFAULT 0.00 | Wallet balance |
| ledger_balance | DECIMAL(15,2) | DEFAULT 0.00 | Ledger balance |
| discrepancy | DECIMAL(15,2) | DEFAULT 0.00 | Discrepancy |
| status | VARCHAR(20) | DEFAULT 'matched' | Status |
| notes | TEXT | | Notes |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_wallet_recon_partner (partner_id)

#### `wallet_bonus`
**Purpose:** Wallet bonus transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| bonus_type | VARCHAR(50) | NOT NULL | Bonus type |
| amount | DECIMAL(15,2) | NOT NULL | Amount |
| status | VARCHAR(20) | DEFAULT 'completed' | Status |
| notes | TEXT | | Notes |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_wallet_bonus_partner (partner_id)

#### `wallet_adjustments`
**Purpose:** Wallet adjustments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| type | VARCHAR(20) | NOT NULL | Adjustment type |
| amount | DECIMAL(15,2) | NOT NULL | Amount |
| reason | TEXT | NOT NULL | Reason |
| adjusted_by | UUID | FK → users(id) ON DELETE SET NULL | Adjusted by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_wallet_adj_partner (partner_id)

#### `team_commissions`
**Purpose:** Team commission tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| parent_partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Parent partner |
| child_partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Child partner |
| application_id | UUID | FK → applications(id) ON DELETE SET NULL | Application reference |
| amount | DECIMAL(15,2) | DEFAULT 0.00 | Amount |
| level | INTEGER | DEFAULT 1 | Level |
| released | BOOLEAN | DEFAULT FALSE | Released flag |
| status | VARCHAR(20) | DEFAULT 'pending' | Status |
| released_at | TIMESTAMPTZ | | Released at |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_team_comm_parent (parent_partner_id)
- idx_team_comm_child (child_partner_id)

#### `partner_settlements`
**Purpose:** Partner settlement records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| withdrawal_id | UUID | FK → withdrawal_requests(id) ON DELETE SET NULL | Withdrawal reference |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| payment_mode | VARCHAR(50) | | Payment mode |
| payment_gateway | VARCHAR(50) | | Payment gateway |
| utr_number | VARCHAR(100) | | UTR number |
| bank_reference | VARCHAR(100) | | Bank reference |
| settled_at | TIMESTAMPTZ | DEFAULT NOW() | Settlement time |
| status | VARCHAR(50) | DEFAULT 'completed' | Status |

#### `payout_logs`
**Purpose:** Payout API logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| withdrawal_id | UUID | FK → wallet_withdrawals(id) ON DELETE CASCADE | Withdrawal reference |
| api_request | JSONB | | API request |
| api_response | JSONB | | API response |
| http_status | INTEGER | | HTTP status |
| retry_count | INTEGER | DEFAULT 0 | Retry count |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

---

### 8. Team & Referral Module

#### `referral_clicks`
**Purpose:** Referral link click tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| referral_code | VARCHAR(50) | NOT NULL | Referral code |
| campaign_id | UUID | FK → referral_campaigns(id) ON DELETE SET NULL | Campaign reference |
| campaign | VARCHAR(100) | DEFAULT 'direct' | Campaign |
| source | VARCHAR(100) | DEFAULT 'web' | Source |
| ip_address | VARCHAR(45) | | IP address |
| browser | VARCHAR(100) | | Browser |
| device | VARCHAR(100) | | Device |
| country | VARCHAR(100) | | Country |
| state | VARCHAR(100) | | State |
| city | VARCHAR(100) | | City |
| referrer | VARCHAR(1000) | | Referrer |
| landing_url | VARCHAR(1000) | | Landing URL |
| partner_code | VARCHAR(50) | | Partner code |
| session_id | VARCHAR(100) | | Session ID |
| visitor_ip | VARCHAR(45) | | Visitor IP |
| device_type | VARCHAR(50) | | Device type |
| os | VARCHAR(100) | | OS |
| utm_source | VARCHAR(100) | | UTM source |
| utm_medium | VARCHAR(100) | | UTM medium |
| utm_campaign | VARCHAR(100) | | UTM campaign |
| landing_page | VARCHAR(1000) | | Landing page |
| clicked_at | TIMESTAMPTZ | DEFAULT NOW() | Click time |
| registered | BOOLEAN | DEFAULT FALSE | Registered flag |
| registration_id | UUID | FK → users(id) ON DELETE SET NULL | Registration ID |
| converted | BOOLEAN | DEFAULT FALSE | Converted flag |
| application_created | BOOLEAN | DEFAULT FALSE | Application created |
| commission_generated | BOOLEAN | DEFAULT FALSE | Commission generated |
| converted_partner_id | UUID | FK → partner_profiles(id) ON DELETE SET NULL | Converted partner |
| converted_at | TIMESTAMPTZ | | Conversion time |
| status | VARCHAR(50) | DEFAULT 'CLICKED' | Status |
| application_id | UUID | | Application ID |
| updated_at | TIMESTAMPTZ | | Update time |

**Indexes:**
- idx_ref_clicks_code (referral_code)
- idx_ref_clicks_partner (partner_id)
- idx_referral_clicks_partner (partner_id)
- idx_referral_clicks_code (referral_code)
- idx_referral_clicks_converted (converted)

#### `invitation_history`
**Purpose:** Invitation tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| invite_type | VARCHAR(50) | | Invitation type |
| recipient_name | VARCHAR(255) | | Recipient name |
| recipient_email | VARCHAR(255) | | Recipient email |
| recipient_mobile | VARCHAR(15) | | Recipient mobile |
| referral_code | VARCHAR(50) | | Referral code |
| status | VARCHAR(50) | DEFAULT 'PENDING' | Status |
| sent_at | TIMESTAMPTZ | DEFAULT NOW() | Sent time |
| opened_at | TIMESTAMPTZ | | Opened at |
| registered_at | TIMESTAMPTZ | | Registered at |
| expired_at | TIMESTAMPTZ | | Expiry |
| accepted_by_partner_id | UUID | FK → partner_profiles(id) ON DELETE SET NULL | Accepted by |
| accepted_at | TIMESTAMPTZ | | Accepted at |
| invitee_name | VARCHAR(255) | | Invitee name |
| invitee_mobile | VARCHAR(50) | | Invitee mobile |
| invitee_email | VARCHAR(255) | | Invitee email |
| invite_code | TEXT | | Invite code |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_inv_history_partner (partner_id)

#### `referral_campaigns`
**Purpose:** Referral campaigns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| campaign_name | VARCHAR(255) | NOT NULL | Campaign name |
| campaign_code | VARCHAR(100) | UNIQUE | Campaign code |
| description | TEXT | | Description |
| platform | VARCHAR(100) | DEFAULT 'WhatsApp' | Platform |
| start_date | TIMESTAMPTZ | | Start date |
| end_date | TIMESTAMPTZ | | End date |
| status | VARCHAR(50) | DEFAULT 'ACTIVE' | Status |
| target | INTEGER | DEFAULT 0 | Target |
| bonus_type | VARCHAR(50) | | Bonus type |
| bonus_amount | DECIMAL(15,2) | DEFAULT 0.00 | Bonus amount |
| budget | DECIMAL(15,2) | DEFAULT 0 | Budget |
| clicks | INTEGER | DEFAULT 0 | Clicks |
| registrations | INTEGER | DEFAULT 0 | Registrations |
| conversions | INTEGER | DEFAULT 0 | Conversions |
| commission | DECIMAL(15,2) | DEFAULT 0 | Commission |
| roi | DECIMAL(10,2) | DEFAULT 0 | ROI |
| created_by | UUID | FK → users(id) | Created by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_ref_campaigns_partner (partner_id)

#### `team_activity`
**Purpose:** Team activity log

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| child_partner_id | UUID | FK → partner_profiles(id) ON DELETE SET NULL | Child partner |
| activity_type | VARCHAR(100) | NOT NULL | Activity type |
| title | VARCHAR(255) | NOT NULL | Title |
| description | TEXT | | Description |
| metadata | JSONB | DEFAULT '{}' | Metadata |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_team_act_partner (partner_id)
- idx_team_activity_parent (parent_partner_id, created_at DESC)

#### `team_goals`
**Purpose:** Team goals tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | UNIQUE, FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| goal_title | VARCHAR(255) | NOT NULL | Goal title |
| target_count | INTEGER | DEFAULT 10 | Target count |
| current_count | INTEGER | DEFAULT 0 | Current count |
| reward_amount | DECIMAL(15,2) | DEFAULT 0.00 | Reward amount |
| status | VARCHAR(20) | DEFAULT 'in_progress' | Status |
| monthly_member_target | INTEGER | DEFAULT 10 | Monthly member target |
| monthly_business_target | DECIMAL(15,2) | DEFAULT 100000 | Monthly business target |
| monthly_commission_target | DECIMAL(15,2) | DEFAULT 25000 | Monthly commission target |
| monthly_app_target | INTEGER | DEFAULT 20 | Monthly app target |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_team_goals_partner (partner_id)

#### `team_notifications`
**Purpose:** Team notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| child_partner_id | UUID | FK → partner_profiles(id) ON DELETE SET NULL | Child partner |
| title | VARCHAR(255) | NOT NULL | Title |
| message | TEXT | NOT NULL | Message |
| read | BOOLEAN | DEFAULT FALSE | Read flag |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_team_notif_partner (partner_id)

---

### 9. Notification & Communication Module

#### `notifications`
**Purpose:** User notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User reference |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| title | VARCHAR(255) | NOT NULL | Title |
| message | TEXT | NOT NULL | Message |
| type | VARCHAR(50) | DEFAULT 'info' | Type |
| user_role | VARCHAR(50) | | User role |
| category | VARCHAR(50) | DEFAULT 'system' | Category |
| priority | VARCHAR(20) | DEFAULT 'normal' | Priority |
| status | VARCHAR(20) | DEFAULT 'sent' | Status |
| channel | VARCHAR(50) | DEFAULT 'in-app' | Channel |
| redirect_url | VARCHAR(500) | | Redirect URL |
| action_url | TEXT | | Action URL |
| reference_type | VARCHAR(100) | | Reference type |
| reference_id | UUID | | Reference ID |
| entity_type | VARCHAR(50) | | Entity type |
| entity_id | UUID | | Entity ID |
| icon | VARCHAR(100) | | Icon |
| is_read | BOOLEAN | DEFAULT FALSE | Read flag |
| link | VARCHAR(500) | | Link |
| read_at | TIMESTAMPTZ | | Read timestamp |
| archived_at | TIMESTAMPTZ | | Archive timestamp |
| expires_at | TIMESTAMPTZ | | Expiry |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_notifications_user (user_id, is_read)

#### `notification_preferences`
**Purpose:** User notification preferences

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PK, FK → users(id) ON DELETE CASCADE | User reference |
| email_enabled | BOOLEAN | DEFAULT TRUE | Email enabled |
| sms_enabled | BOOLEAN | DEFAULT TRUE | SMS enabled |
| browser_enabled | BOOLEAN | DEFAULT TRUE | Browser enabled |
| push_enabled | BOOLEAN | DEFAULT TRUE | Push enabled |
| wallet_notifications | BOOLEAN | DEFAULT TRUE | Wallet notifications |
| commission_notifications | BOOLEAN | DEFAULT TRUE | Commission notifications |
| application_notifications | BOOLEAN | DEFAULT TRUE | Application notifications |
| marketing_notifications | BOOLEAN | DEFAULT TRUE | Marketing notifications |
| system_notifications | BOOLEAN | DEFAULT TRUE | System notifications |
| marketing_enabled | BOOLEAN | DEFAULT TRUE | Marketing enabled |
| commission_enabled | BOOLEAN | DEFAULT TRUE | Commission enabled |
| kyc_enabled | BOOLEAN | DEFAULT TRUE | KYC enabled |
| language | VARCHAR(10) | DEFAULT 'en' | Language |
| frequency | VARCHAR(20) | DEFAULT 'instant' | Frequency |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

#### `notification_templates`
**Purpose:** Notification templates

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| template_name | VARCHAR(100) | UNIQUE NOT NULL | Template name |
| subject | VARCHAR(255) | NOT NULL | Subject |
| message | TEXT | NOT NULL | Message |
| channel | VARCHAR(50) | DEFAULT 'in-app' | Channel |
| variables | JSONB | DEFAULT '[]' | Variables |
| status | VARCHAR(20) | DEFAULT 'active' | Status |

#### `announcements`
**Purpose:** System announcements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| announcement_id | VARCHAR(50) | UNIQUE | Announcement ID |
| title | VARCHAR(255) | NOT NULL | Title |
| short_description | TEXT | | Short description |
| message | TEXT | | Message |
| description | TEXT | | Description |
| banner_image | VARCHAR(500) | | Banner image |
| audience_type | VARCHAR(50) | DEFAULT 'ALL_USERS' | Audience type |
| target_role | VARCHAR(50) | DEFAULT 'all' | Target role |
| priority | VARCHAR(20) | DEFAULT 'MEDIUM' | Priority |
| status | VARCHAR(20) | DEFAULT 'PUBLISHED' | Status |
| delivery_channels | JSONB | DEFAULT '["in-app"]' | Delivery channels |
| target_user_ids | JSONB | DEFAULT '[]' | Target users |
| target_team_ids | JSONB | DEFAULT '[]' | Target teams |
| target_designations | JSONB | DEFAULT '[]' | Target designations |
| scheduled_at | TIMESTAMPTZ | | Scheduled at |
| published_at | TIMESTAMPTZ | DEFAULT NOW() | Published at |
| expires_at | TIMESTAMPTZ | | Expires at |
| start_date | DATE | | Start date |
| end_date | DATE | | End date |
| redirect_url | VARCHAR(500) | | Redirect URL |
| views_count | INTEGER | DEFAULT 0 | Views count |
| reach_count | INTEGER | DEFAULT 0 | Reach count |
| clicks_count | INTEGER | DEFAULT 0 | Clicks count |
| acknowledgements_count | INTEGER | DEFAULT 0 | Acknowledgements count |
| created_by | UUID | FK → users(id) ON DELETE SET NULL | Created by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

#### `announcement_recipients`
**Purpose:** Announcement recipients

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| announcement_id | UUID | FK → announcements(id) ON DELETE CASCADE | Announcement reference |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User reference |
| delivery_status | VARCHAR(50) | DEFAULT 'DELIVERED' | Delivery status |
| delivered_at | TIMESTAMPTZ | DEFAULT NOW() | Delivered at |
| read_at | TIMESTAMPTZ | | Read at |
| clicked_at | TIMESTAMPTZ | | Clicked at |
| acknowledged_at | TIMESTAMPTZ | | Acknowledged at |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Constraints:**
- UNIQUE(announcement_id, user_id)

#### `announcement_reads`
**Purpose:** Announcement reads/engagement

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| announcement_id | UUID | FK → announcements(id) ON DELETE CASCADE | Announcement reference |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User reference |
| read_at | TIMESTAMPTZ | DEFAULT NOW() | Read at |
| clicked_at | TIMESTAMPTZ | | Clicked at |
| acknowledged_at | TIMESTAMPTZ | | Acknowledged at |

**Constraints:**
- UNIQUE(announcement_id, user_id)

#### `announcement_audit_logs`
**Purpose:** Announcement audit logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| announcement_id | UUID | FK → announcements(id) ON DELETE CASCADE | Announcement reference |
| action | VARCHAR(100) | NOT NULL | Action |
| performed_by | UUID | FK → users(id) ON DELETE SET NULL | Performed by |
| performed_by_name | VARCHAR(255) | | Performed by name |
| old_value | JSONB | DEFAULT '{}' | Old value |
| new_value | JSONB | DEFAULT '{}' | New value |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

#### `broadcast_notifications`
**Purpose:** Broadcast notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| title | VARCHAR(255) | NOT NULL | Title |
| message | TEXT | NOT NULL | Message |
| target | VARCHAR(50) | DEFAULT 'all' | Target |
| priority | VARCHAR(20) | DEFAULT 'information' | Priority |
| scheduled_at | TIMESTAMPTZ | | Scheduled at |
| expires_at | TIMESTAMPTZ | | Expires at |
| status | VARCHAR(20) | DEFAULT 'active' | Status |
| created_by | UUID | FK → users(id) ON DELETE SET NULL | Created by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

---

### 10. CMS & Content Module

#### `banners`
**Purpose:** Homepage banners

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| title | VARCHAR(255) | NOT NULL | Title |
| subtitle | VARCHAR(500) | | Subtitle |
| btn_text | VARCHAR(100) | | Button text |
| image_url | VARCHAR(500) | NOT NULL | Image URL |
| display_order | INTEGER | DEFAULT 0 | Display order |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| target_page | VARCHAR(255) | DEFAULT 'all' | Target page |
| link_type | VARCHAR(50) | DEFAULT 'custom' | Link type |
| click_url | VARCHAR(500) | DEFAULT '/credit-cards' | Click URL |
| click_url_home | VARCHAR(500) | | Home URL |
| click_url_partner | VARCHAR(500) | | Partner URL |
| click_url_employee | VARCHAR(500) | | Employee URL |
| click_url_referral | VARCHAR(500) | | Referral URL |
| original_filename | VARCHAR(255) | | Original filename |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

#### `homepage_sections`
**Purpose:** Homepage CMS sections

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| key | VARCHAR(100) | UNIQUE NOT NULL | Section key |
| title | VARCHAR(255) | NOT NULL | Title |
| subtitle | VARCHAR(500) | | Subtitle |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| display_order | INTEGER | DEFAULT 0 | Display order |
| items | JSONB | DEFAULT '[]' | Items |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

#### `system_settings`
**Purpose:** System-wide settings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| key | VARCHAR(100) | PK | Setting key |
| value | TEXT | NOT NULL | Setting value |

#### `services_catalog`
**Purpose:** Services catalog

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Primary key |
| name | VARCHAR(100) | NOT NULL | Service name |
| icon | VARCHAR(255) | | Icon |
| route | VARCHAR(255) | NOT NULL | Route |
| status | VARCHAR(20) | DEFAULT 'active' | Status |
| display_order | INTEGER | DEFAULT 1 | Display order |
| clicks | INTEGER | DEFAULT 0 | Clicks |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

#### `service_requests`
**Purpose:** Service requests (recharge, bills, etc.)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Primary key |
| service_type | VARCHAR(50) | NOT NULL | Service type |
| mobile | VARCHAR(20) | | Mobile |
| operator | VARCHAR(50) | | Operator |
| consumer_number | VARCHAR(100) | | Consumer number |
| provider | VARCHAR(100) | | Provider |
| loan_number | VARCHAR(100) | | Loan number |
| vehicle_number | VARCHAR(100) | | Vehicle number |
| amount | NUMERIC(10,2) | NOT NULL | Amount |
| status | VARCHAR(20) | DEFAULT 'pending' | Status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

#### `marketing_materials`
**Purpose:** Marketing materials

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| title | VARCHAR(255) | NOT NULL | Title |
| description | TEXT | | Description |
| category | VARCHAR(100) | NOT NULL | Category |
| file_url | VARCHAR(500) | NOT NULL | File URL |
| thumbnail_url | VARCHAR(500) | | Thumbnail URL |
| file_type | VARCHAR(50) | | File type |
| downloads | INTEGER | DEFAULT 0 | Downloads |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

#### `training_modules`
**Purpose:** Training modules for partners

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| title | VARCHAR(255) | NOT NULL | Title |
| description | TEXT | | Description |
| video_url | VARCHAR(500) | | Video URL |
| pdf_url | VARCHAR(500) | | PDF URL |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

#### `partner_training_progress`
**Purpose:** Partner training progress

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| training_id | UUID | FK → training_modules(id) ON DELETE CASCADE | Training reference |
| progress | INTEGER | DEFAULT 0 | Progress percentage |
| completed | BOOLEAN | DEFAULT FALSE | Completed flag |
| completed_at | TIMESTAMPTZ | | Completion time |
| quiz_score | DECIMAL(5,2) | | Quiz score |
| certificate_url | VARCHAR(500) | | Certificate URL |
| attempt_count | INTEGER | DEFAULT 1 | Attempt count |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Constraints:**
- UNIQUE(partner_id, training_id)

---

### 11. Audit & Security Module

#### `audit_logs`
**Purpose:** System audit logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| user_id | UUID | FK → users(id) ON DELETE SET NULL | User reference |
| role | VARCHAR(50) | | Role |
| action | VARCHAR(100) | NOT NULL | Action |
| target_id | UUID | | Target ID |
| details | JSONB | | Details |
| old_data | JSONB | | Old data |
| new_data | JSONB | | New data |
| module | VARCHAR(100) | | Module |
| ip | VARCHAR(45) | | IP address |
| device | VARCHAR(100) | | Device |
| browser | VARCHAR(100) | | Browser |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_audit_logs_created_at (created_at DESC)
- idx_audit_logs_user (user_id)

#### `activity_logs`
**Purpose:** Partner activity logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| activity_type | VARCHAR(100) | NOT NULL | Activity type |
| module | VARCHAR(100) | DEFAULT 'system' | Module |
| title | VARCHAR(255) | NOT NULL | Title |
| description | TEXT | | Description |
| reference_id | UUID | | Reference ID |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| performed_by | UUID | FK → users(id) ON DELETE SET NULL | Performed by |

**Indexes:**
- idx_act_logs_partner (partner_id)

#### `login_activity`
**Purpose:** Login activity tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User reference |
| ip_address | VARCHAR(45) | | IP address |
| device | VARCHAR(100) | | Device |
| browser | VARCHAR(100) | | Browser |
| location | VARCHAR(100) | | Location |
| status | VARCHAR(20) | DEFAULT 'success' | Status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_login_act_user (user_id)

#### `blacklist`
**Purpose:** Blacklisted items (email, mobile, etc.)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| type | VARCHAR(50) | | Type |
| value | VARCHAR(255) | UNIQUE NOT NULL | Value |
| reason | TEXT | | Reason |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

#### `registration_logs`
**Purpose:** Registration attempt logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| email | VARCHAR(255) | | Email |
| mobile | VARCHAR(15) | | Mobile |
| referral_code | VARCHAR(50) | | Referral code |
| parent_partner_id | UUID | FK → partner_profiles(id) ON DELETE SET NULL | Parent partner |
| status | VARCHAR(50) | | Status |
| failure_reason | TEXT | | Failure reason |
| ip_address | VARCHAR(45) | | IP address |
| device | VARCHAR(255) | | Device |
| browser | VARCHAR(255) | | Browser |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

---

### 12. Reports & Analytics Module

#### `report_cache`
**Purpose:** Report query cache

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| report_type | VARCHAR(100) | NOT NULL | Report type |
| filter_hash | VARCHAR(64) | NOT NULL | Filter hash |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| generated_at | TIMESTAMPTZ | DEFAULT NOW() | Generated at |
| expires_at | TIMESTAMPTZ | NOT NULL | Expiry |
| report_json | JSONB | NOT NULL | Report data |
| status | VARCHAR(20) | DEFAULT 'ready' | Status |

**Constraints:**
- UNIQUE(report_type, filter_hash, partner_id)

**Indexes:**
- idx_report_cache_lookup (report_type, filter_hash, partner_id)

#### `report_exports`
**Purpose:** Report export history

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| report_type | VARCHAR(100) | NOT NULL | Report type |
| format | VARCHAR(20) | NOT NULL | Format |
| file_name | VARCHAR(255) | NOT NULL | File name |
| storage_path | TEXT | | Storage path |
| generated_at | TIMESTAMPTZ | DEFAULT NOW() | Generated at |
| downloaded_at | TIMESTAMPTZ | | Downloaded at |
| status | VARCHAR(20) | DEFAULT 'completed' | Status |

**Indexes:**
- idx_report_exports_partner (partner_id)

#### `scheduled_reports`
**Purpose:** Scheduled report configurations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| report_type | VARCHAR(100) | NOT NULL | Report type |
| frequency | VARCHAR(20) | DEFAULT 'monthly' | Frequency |
| recipient_email | VARCHAR(255) | NOT NULL | Recipient email |
| next_run | TIMESTAMPTZ | | Next run |
| last_run | TIMESTAMPTZ | | Last run |
| status | VARCHAR(20) | DEFAULT 'active' | Status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Indexes:**
- idx_sched_reports_partner (partner_id)

---

### 13. Support Module

#### `support_tickets`
**Purpose:** Support ticket system

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| subject | VARCHAR(255) | NOT NULL | Subject |
| description | TEXT | NOT NULL | Description |
| category | VARCHAR(100) | NOT NULL | Category |
| priority | VARCHAR(50) | DEFAULT 'medium' | Priority |
| status | VARCHAR(50) | DEFAULT 'open' | Status |
| replies | JSONB | DEFAULT '[]' | Replies |
| customer_name | VARCHAR(255) | | Customer name |
| mobile | VARCHAR(20) | | Mobile |
| contact_email | VARCHAR(255) | | Contact email |
| assigned_to | UUID | FK → users(id) ON DELETE SET NULL | Assigned to |
| resolved_at | TIMESTAMPTZ | | Resolved at |
| closed_by | UUID | FK → users(id) ON DELETE SET NULL | Closed by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_support_tickets_partner (partner_id)

---

### 14. Other Tables

#### `pre_verified_emails`
**Purpose:** Pre-verified emails from OTP registration

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| email | VARCHAR(255) | PK | Email |
| verified_at | TIMESTAMPTZ | DEFAULT NOW() | Verification time |

#### `otp_verifications`
**Purpose:** OTP verification codes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| identity | VARCHAR(255) | UNIQUE NOT NULL | Identity (email/mobile) |
| otp_hash | VARCHAR(255) | NOT NULL | Hashed OTP |
| expires_at | TIMESTAMPTZ | NOT NULL | Expiry |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

#### `msg91_verified_tokens`
**Purpose:** Msg91 verified tokens

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| token_hash | VARCHAR(64) | UNIQUE NOT NULL | Token hash |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User reference |
| used_at | TIMESTAMPTZ | DEFAULT NOW() | Used at |

#### `direct_card_applications`
**Purpose:** Direct card applications from visitors

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| customer_name | VARCHAR(255) | NOT NULL | Customer name |
| mobile | VARCHAR(15) | NOT NULL | Mobile |
| bank_name | VARCHAR(100) | NOT NULL | Bank name |
| card_name | VARCHAR(100) | NOT NULL | Card name |
| category | VARCHAR(50) | DEFAULT 'credit_card' | Category |
| status | VARCHAR(50) | DEFAULT 'verified' | Status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

#### `bank_details_history`
**Purpose:** Bank details change history

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE CASCADE | Partner reference |
| bank_details_id | UUID | FK → partner_bank_details(id) ON DELETE SET NULL | Bank details reference |
| changed_by | UUID | FK → users(id) ON DELETE SET NULL | Changed by |
| old_data | JSONB | | Old data |
| new_data | JSONB | | New data |
| changed_at | TIMESTAMPTZ | DEFAULT NOW() | Change time |

**Indexes:**
- idx_bank_details_history_partner (partner_id)

#### `click_tracking`
**Purpose:** Product click tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| click_id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE SET NULL | Partner reference |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| bank_id | UUID | FK → banks(id) ON DELETE SET NULL | Bank reference |
| customer_id | UUID | FK → users(id) ON DELETE SET NULL | Customer reference |
| customer_mobile | VARCHAR(15) | | Customer mobile |
| tracking_url | VARCHAR(1000) | | Tracking URL |
| original_url | VARCHAR(1000) | | Original URL |
| ip_address | VARCHAR(45) | | IP address |
| browser | VARCHAR(100) | | Browser |
| device | VARCHAR(50) | | Device |
| operating_system | VARCHAR(50) | | OS |
| campaign | VARCHAR(100) | | Campaign |
| referral_source | VARCHAR(255) | | Referral source |
| location | VARCHAR(255) | | Location |
| clicked_at | TIMESTAMPTZ | DEFAULT NOW() | Click time |
| conversion_status | VARCHAR(20) | DEFAULT 'pending' | Conversion status |

**Indexes:**
- idx_click_tracking_product (product_id)
- idx_click_tracking_partner (partner_id)
- idx_click_tracking_clicked_at (clicked_at)

#### `product_link_audits`
**Purpose:** Product link change audits

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| old_url | VARCHAR(1000) | | Old URL |
| new_url | VARCHAR(1000) | | New URL |
| updated_by | UUID | FK → users(id) ON DELETE SET NULL | Updated by |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Update time |
| reason | TEXT | | Reason |
| ip_address | VARCHAR(45) | | IP address |

**Indexes:**
- idx_link_audits_product (product_id)

#### `product_application_settings`
**Purpose:** Product application form settings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| product_id | UUID | UNIQUE, FK → products(id) ON DELETE CASCADE | Product reference |
| application_type | application_type_enum | NOT NULL DEFAULT 'internal_form' | Application type |
| application_url | VARCHAR(1000) | | Application URL |
| provider_name | VARCHAR(255) | | Provider name |
| open_type | open_type_enum | NOT NULL DEFAULT 'same_tab' | Open type |
| partner_enabled | BOOLEAN | NOT NULL DEFAULT TRUE | Partner enabled |
| customer_enabled | BOOLEAN | NOT NULL DEFAULT TRUE | Customer enabled |
| track_clicks | BOOLEAN | NOT NULL DEFAULT TRUE | Track clicks |
| status | VARCHAR(20) | NOT NULL DEFAULT 'active' | Status |
| created_by | UUID | FK → users(id) | Created by |
| updated_by | UUID | FK → users(id) | Updated by |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- idx_app_settings_product (product_id)

#### `application_click_logs`
**Purpose:** Application click logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| partner_id | UUID | FK → partner_profiles(id) ON DELETE SET NULL | Partner reference |
| customer_id | UUID | FK → users(id) ON DELETE SET NULL | Customer reference |
| application_type | application_type_enum | | Application type |
| ip_address | VARCHAR(64) | | IP address |
| user_agent | TEXT | | User agent |
| device_type | VARCHAR(20) | | Device type |
| browser | VARCHAR(50) | | Browser |
| clicked_at | TIMESTAMPTZ | DEFAULT NOW() | Click time |

**Indexes:**
- idx_click_logs_product (product_id)
- idx_click_logs_partner (partner_id)
- idx_click_logs_clicked_at (clicked_at)

#### `bank_product_requirements`
**Purpose:** Bank-specific product requirements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Primary key |
| bank_id | UUID | FK → banks(id) ON DELETE CASCADE | Bank reference |
| product_id | UUID | FK → products(id) ON DELETE CASCADE | Product reference |
| fields | JSONB | NOT NULL DEFAULT '[]'::jsonb | Required fields |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

---

## Database Views

### `referral_tree`
View for partner team hierarchy:
```sql
CREATE VIEW referral_tree AS 
SELECT id, parent_partner_id, child_partner_id, level, created_at AS joined_at 
FROM partner_team_relationships;
```

### `cms_sections`
View for CMS content:
```sql
CREATE VIEW cms_sections AS 
SELECT id, key AS section_key, title, items AS content, NULL::VARCHAR AS language, is_active, updated_at 
FROM homepage_sections;
```

### `wallets`
View for wallet compatibility:
```sql
CREATE VIEW wallets AS 
SELECT id, partner_id, available_balance, hold_balance, total_earned, total_withdrawn, updated_at 
FROM partner_wallets;
```

### `withdrawal_requests`
View for withdrawal compatibility:
```sql
CREATE VIEW withdrawal_requests AS
SELECT
  id, wallet_id, partner_id, amount, status,
  bank_name, account_number, ifsc_code, utr as utr_number,
  processed_by, processed_at, rejection_reason, admin_note,
  created_at, updated_at
FROM wallet_withdrawals;
```

### `daily_wallet_summary`
Daily wallet transaction summary:
```sql
CREATE VIEW daily_wallet_summary AS
SELECT 
  partner_id,
  created_at::date AS summary_date,
  SUM(credit) AS total_credit,
  SUM(debit) AS total_debit,
  COUNT(*) AS transaction_count
FROM wallet_ledger
GROUP BY partner_id, created_at::date;
```

### `daily_application_summary`
Daily application summary:
```sql
CREATE VIEW daily_application_summary AS
SELECT 
  partner_id,
  created_at::date AS summary_date,
  status,
  COUNT(*) AS application_count,
  SUM(COALESCE(loan_amount, 0)) AS total_loan_amount,
  SUM(COALESCE(commission_amount, 0)) AS total_commission_amount
FROM applications
GROUP BY partner_id, created_at::date, status;
```

### `partner_monthly_summary`
Monthly partner summary:
```sql
CREATE VIEW partner_monthly_summary AS
SELECT 
  partner_id,
  DATE_TRUNC('month', created_at)::date AS summary_month,
  SUM(credit) AS monthly_earned,
  SUM(debit) AS monthly_withdrawn
FROM wallet_ledger
WHERE status = 'completed'
GROUP BY partner_id, DATE_TRUNC('month', created_at)::date;
```

---

## ENUM Types

### `user_role`
- SUPER_ADMIN
- ADMIN
- EMPLOYEE
- PARTNER
- TEAM_MEMBER

### `user_status`
- pending
- active
- suspended
- rejected
- inactive
- pending_verification
- blocked

### `kyc_status`
- pending
- under_review
- approved
- rejected
- draft

### `application_status`
- draft
- submitted
- under_review
- approved
- rejected
- disbursed
- confirmed
- pending
- initiated
- lead_created
- in_process
- application_started
- application_submitted
- application_number_received
- vkyc_pending
- vkyc_completed
- details_submitted
- operational_verified
- correction_required
- super_admin_approved
- commission_processing
- commission_released
- commission_received
- bank_form_submitted
- sanctioned
- cancelled
- link_sent
- verification_completed

### `product_category`
- credit_card
- personal_loan
- home_loan
- business_loan
- instant_loan
- used_car_loan
- education_loan
- lac
- health_insurance
- life_insurance
- general_insurance
- fd_card
- co_branded_card
- investment
- card_on_loan
- insurance
- smart_emi
- loan_on_credit_card
- loc_eoc

### `wallet_txn_type`
- credit
- debit

### `wallet_txn_status`
- pending
- approved
- rejected
- processed
- cancelled
- failed
- completed
- processing
- refunded
- declined
- held
- on_hold

### `ledger_transaction_type`
- PERSONAL_COMMISSION
- TEAM_COMMISSION
- REFERRAL_BONUS
- CAMPAIGN_BONUS
- SETTLEMENT
- WITHDRAWAL
- ADJUSTMENT
- REVERSAL
- REFUND
- TDS_DEDUCTION
- COMMISSION_RELEASE
- OVERRIDE_COMMISSION

### `withdrawal_status`
- pending
- approved
- processed
- rejected
- cancelled
- failed

### `application_type_enum`
- internal_form
- external_url
- affiliate_url
- api_integration

### `open_type_enum`
- same_tab
- new_tab

---

## Key Relationships

### User → Partner Profile
- `users.id` → `partner_profiles.user_id` (1:1)

### Partner Profile → Bank Details
- `partner_profiles.id` → `partner_bank_details.partner_id` (1:N)

### Partner Profile → KYC Documents
- `partner_profiles.id` → `kyc_documents.partner_id` (1:N)

### Partner Profile → Wallet
- `partner_profiles.id` → `partner_wallets.partner_id` (1:1)

### Partner Profile → Team Relationships
- `partner_profiles.id` → `partner_team_relationships.parent_partner_id` (1:N - as parent)
- `partner_profiles.id` → `partner_team_relationships.child_partner_id` (1:N - as child)

### Bank → Products
- `banks.id` → `products.bank_id` (1:N)

### Customer → Applications
- `customers.id` → `applications.customer_id` (1:N)

### Partner → Applications
- `partner_profiles.id` → `applications.partner_id` (1:N)

### Product → Applications
- `products.id` → `applications.product_id` (1:N)

### Application → Commission Ledger
- `applications.id` → `commission_ledger.application_id` (1:N)

### Partner → Wallet Ledger
- `partner_profiles.id` → `wallet_ledger.partner_id` (1:N)

### Application → Timeline
- `applications.id` → `application_timeline.application_id` (1:N)

### Lead → Applications
- `leads.id` → `applications.lead_id` (1:1 optional)

### Partner → Leads
- `partner_profiles.id` → `leads.partner_id` (1:N)

---

## Database Triggers

### `update_updated_at`
Automatically updates `updated_at` timestamp on row update.

Applied to tables:
- users
- partner_profiles
- partner_bank_details
- products
- customers
- applications
- withdrawal_requests
- leads
- banners
- wallet_withdrawals

### `audit_wallet_trigger`
Logs wallet balance changes to `wallet_audit_logs`.

Applied to:
- partner_wallets

---

## Sequences

1. `partner_code_seq` - START 1000 (for partner codes)
2. `app_number_seq` - START 10000 (for application numbers)
3. `announcement_seq` - START 1001 (for announcement IDs)
4. `sbi_app_number_seq` - START 1245 (for SBI application numbers)

---

## Important Indexes

### Performance Indexes
- `idx_users_firebase_uid` - Firebase authentication lookups
- `idx_partner_code` - Partner code lookups
- `idx_customers_mobile` - Customer mobile lookups
- `idx_applications_Partner` - Partner application queries
- `idx_applications_status` - Application status filtering
- `idx_wallet_ledger_partner` - Wallet ledger queries
- `idx_leads_partner` - Lead queries by partner
- `idx_referral_clicks_code` - Referral code tracking
- `idx_wallet_txn_status` - Pending transaction queries
- `idx_audit_logs_created_at` - Audit log queries

### Unique Constraints
- `users.email`
- `users.mobile`
- `users.employee_id`
- `partner_profiles.partner_code`
- `partner_profiles.pan_number`
- `partner_profiles.aadhaar_number`
- `customers.mobile`
- `applications.app_number`
- `products.slug`
- `referral_clicks.referral_code`

---

## Data Encryption

The following fields are encrypted:
- `partner_bank_details.account_number` - Bank account numbers

---

## Notes

1. **Firebase Integration**: The system uses Firebase for authentication. `firebase_uid` is the primary identity field.
2. **Commission Engine**: Complex commission system with personal commissions, team commissions, overrides, and referral bonuses.
3. **Multi-level Team Structure**: Partners can build multi-level teams with hierarchical commission distribution.
4. **Bank-Specific Applications**: Different banks (HDFC, SBI, etc.) have specialized application tables.
5. **Audit Trail**: Comprehensive audit logging for all critical operations.
6. **Security**: Account lockout, password history, login tracking, and security alerts.
7. **Notification System**: Multi-channel notifications (in-app, email, SMS) with templates and preferences.
8. **Reports**: Cached reports, scheduled reports, and export functionality.
9. **CMS**: Dynamic homepage content, banners, and service catalog.
10. **SLA Tracking**: Lead SLA tracking with overdue detection.

---

## ER Diagram (Text-Based)

```
users (1) ----< (1) partner_profiles
  |                       |
  | (1)                   | (1)
  v                       v
partner_wallets (1) ----< (N) kyc_documents
  |
  | (1)
  v
wallet_ledger (N)
  |
  | (N)
  v
applications (N) ----< (1) customers
  |
  | (N)
  v
commission_ledger (N)

partner_profiles (1) ----< (N) partner_team_relationships
  |
  | (1)
  v
partner_bank_details (N)

banks (1) ----< (N) products
  |
  | (N)
  v
applications (N)

leads (N) ----> (1) partner_profiles
  |
  | (1)
  v
applications (0..1)
```

---

## Mermaid ER Diagram

```mermaid
erDiagram
    users ||--o{ partner_profiles : has
    users ||--o{ refresh_tokens : has
    users ||--o{ login_history : has
    users ||--o{ password_history : has
    users ||--o{ security_alerts : has
    
    partner_profiles ||--o{ partner_bank_details : has
    partner_profiles ||--o{ kyc_documents : has
    partner_profiles ||--o{ partner_videos : has
    partner_profiles ||--o{ partner_referrals : has
    partner_profiles ||--o{ partner_team_relationships : parent
    partner_profiles ||--o{ partner_team_relationships : child
    partner_profiles ||--o{ partner_wallets : has
    partner_profiles ||--o{ partner_teams : has
    partner_profiles ||--o{ partner_upgrade_requests : has
    partner_profiles ||--o{ leads : creates
    partner_profiles ||--o{ applications : submits
    partner_profiles ||--o{ referral_clicks : generates
    partner_profiles ||--o{ team_activity : has
    partner_profiles ||--o{ team_goals : has
    partner_profiles ||--o{ team_notifications : has
    partner_profiles ||--o{ product_ratings : gives
    partner_profiles ||--o{ partner_saved_products : saves
    partner_profiles ||--o{ partner_recent_products : views
    partner_profiles ||--o{ partner_preferences : has
    partner_profiles ||--o{ notification_preferences : has
    partner_profiles ||--o{ notification_templates : uses
    partner_profiles ||--o{ announcements : creates
    partner_profiles ||--o{ activity_logs : generates
    partner_profiles ||--o{ audit_logs : performs
    partner_profiles ||--o{ support_tickets : creates
    partner_profiles ||--o{ customer_notes : writes
    partner_profiles ||--o{ customer_followups : schedules
    partner_profiles ||--o{ customer_tags : applies
    partner_profiles ||--o{ customer_activity_logs : generates
    partner_profiles ||--o{ customer_communications : sends
    partner_profiles ||--o{ lead_followups : schedules
    partner_profiles ||--o{ lead_documents : uploads
    partner_profiles ||--o{ lead_timeline : tracks
    partner_profiles ||--o{ lead_notes : writes
    partner_profiles ||--o{ lead_assignments : assigns
    partner_profiles ||--o{ lead_activity_logs : generates
    partner_profiles ||--o{ lead_status_history : tracks
    partner_profiles ||--o{ lead_checklist : verifies
    partner_profiles ||--o{ lead_sla : tracks
    partner_profiles ||--o{ bank_assignments : has
    partner_profiles ||--o{ partner_share_links : creates
    partner_profiles ||--o{ partner_training_progress : completes
    partner_profiles ||--o{ report_cache : generates
    partner_profiles ||--o{ report_exports : exports
    partner_profiles ||--o{ scheduled_reports : schedules
    partner_profiles ||--o{ wallet_ledger : has
    partner_profiles ||--o{ wallet_transactions : has
    partner_profiles ||--o{ wallet_withdrawals : requests
    partner_profiles ||--o{ wallet_audit_logs : has
    partner_profiles ||--o{ commission_release_jobs : has
    partner_profiles ||--o{ withdrawal_audit_logs : has
    partner_profiles ||--o{ wallet_reconciliation : has
    partner_profiles ||--o{ wallet_bonus : receives
    partner_profiles ||--o{ wallet_adjustments : has
    partner_profiles ||--o{ team_commissions : earns
    partner_profiles ||--o{ partner_settlements : receives
    partner_profiles ||--o{ payout_logs : has
    partner_profiles ||--o{ referral_clicks : generates
    partner_profiles ||--o{ invitation_history : sends
    partner_profiles ||--o{ referral_campaigns : creates
    partner_profiles ||--o{ registration_logs : logs
    partner_profiles ||--o{ bank_details_history : changes
    partner_profiles ||--o{ click_tracking : tracks
    partner_profiles ||--o{ application_click_logs : tracks
    partner_profiles ||--o{ direct_card_applications : submits
    
    partner_profiles ||--o{ product_application_settings : configures
    
    banks ||--o{ products : offers
    banks ||--o{ admin_bank_assignments : assigned_to
    banks ||--o{ applications : processes
    banks ||--o{ bank_card_applications : processes
    banks ||--o{ bank_card_application_timeline : tracks
    banks ||--o{ sbi_credit_card_applications : processes
    banks ||--o{ sbi_cc_application_timeline : tracks
    banks ||--o{ bank_assignments : assigns
    banks ||--o{ bank_product_requirements : has
    banks ||--o{ click_tracking : tracks
    banks ||--o{ wallet_ledger : references
    banks ||--o{ commission_ledger : references
    
    products ||--o{ applications : applied_for
    products ||--o{ leads : generated_for
    products ||--o{ commission_structures : has
    products ||--o{ commission_rules : has
    products ||--o{ product_features : has
    products ||--o{ product_documents : has
    products ||--o{ product_faq : has
    products ||--o{ product_videos : has
    products ||--o{ product_offers : has
    products ||--o{ product_ratings : rated
    products ||--o{ product_share_logs : shared
    products ||--o{ partner_saved_products : saved
    products ||--o{ partner_recent_products : viewed
    products ||--o{ product_views : viewed
    products ||--o{ product_link_audits : audited
    products ||--o{ product_application_settings : configured
    products ||--o{ application_click_logs : clicked
    products ||--o{ partner_share_links : shared
    products ||--o{ wallet_ledger : references
    products ||--o{ commission_ledger : references
    products ||--o{ required_documents : requires
    
    customers ||--o{ applications : applies_for
    customers ||--o{ customer_notes : has
    customers ||--o{ customer_documents : has
    customers ||--o{ customer_timeline : tracks
    customers ||--o{ customer_followups : has
    customers ||--o{ customer_tags : has
    customers ||--o{ customer_activity_logs : logs
    customers ||--o{ customer_communications : receives
    customers ||--o{ customer_access_tokens : has
    customers ||--o{ bank_card_applications : applies
    customers ||--o{ sbi_credit_card_applications : applies
    
    applications ||--o{ application_timeline : tracks
    applications ||--o{ application_notes : has
    applications ||--o{ application_documents : has
    applications ||--o{ commission_ledger : generates
    applications ||--o{ physical_application_details : has
    applications ||--o{ application_admin_assignments : assigned
    applications ||--o{ application_audit_logs : audited
    applications ||--o{ application_links : shared
    applications ||--o{ customer_access_tokens : has
    applications ||--o{ leads : converted_from
    applications ||--o{ team_commissions : generates
    applications ||--o{ wallet_ledger : references
    applications ||--o{ wallet_transactions : references
    applications ||--o{ commission_release_jobs : scheduled
    applications ||--o{ partner_share_links : linked
    
    leads ||--o{ lead_followups : has
    leads ||--o{ lead_documents : has
    leads ||--o{ lead_timeline : tracks
    leads ||--o{ lead_notes : has
    leads ||--o{ lead_assignments : assigned
    leads ||--o{ lead_activity_logs : logs
    leads ||--o{ lead_status_history : tracks
    leads ||--o{ lead_checklist : has
    leads ||--o{ lead_sla : tracked
    leads ||--o{ bank_assignments : assigned
    leads ||--o{ partner_share_links : generates
    leads ||--o{ applications : converts_to
    leads ||--o{ commission_ledger : generates
    leads ||--o{ wallet_ledger : references
    leads ||--o{ wallet_transactions : references
    leads ||--o{ application_audit_logs : audited
    leads ||--o{ application_links : shared
    
    partner_wallets ||--o{ wallet_ledger : tracks
    partner_wallets ||--o{ wallet_transactions : processes
    partner_wallets ||--o{ wallet_withdrawals : requests
    partner_wallets ||--o{ wallet_audit_logs : audits
    
    wallet_withdrawals ||--o{ withdrawal_audit_logs : audited
    wallet_withdrawals ||--o{ partner_settlements : settled
    wallet_withdrawals ||--o{ payout_logs : logs
    
    announcements ||--o{ announcement_recipients : targets
    announcements ||--o{ announcement_reads : read
    announcements ||--o{ announcement_audit_logs : audited
    
    notification_templates ||--o{ customer_communications : used
    
    referral_campaigns ||--o{ referral_clicks : tracks
    
    training_modules ||--o{ partner_training_progress : completed
    
    report_cache ||--o{ report_exports : exported
    report_cache ||--o{ scheduled_reports : scheduled
    
    commission_release_jobs ||--o{ wallet_ledger : releases
    
    team_commissions ||--o{ applications : generated_from
    
    partner_team_relationships ||--o{ partner_profiles : parent_of
    partner_team_relationships ||--o{ partner_profiles : child_of
    
    users ||--o{ admin_bank_assignments : assigned
    users ||--o{ application_admin_assignments : assigned
    users ||--o{ audit_logs : performs
    users ||--o{ activity_logs : performs
    users ||--o{ login_activity : logs
    users ||--o{ registration_logs : logs
    users ||--o{ product_link_audits : updates
    users ||--o{ application_audit_logs : performs
    users ||--o{ announcement_audit_logs : performs
    users ||--o{ wallet_audit_logs : audits
    users ||--o{ withdrawal_audit_logs : performs
    users ||--o{ payout_logs : logs
    users ||--o{ bank_details_history : changes
    users ||--o{ commission_ledger : approves
    users ||--o{ notification_templates : creates
    users ||--o{ broadcast_notifications : creates
    users ||--o{ support_tickets : assigned
    users ||--o{ customer_communications : sends
    users ||--o{ lead_assignments : assigns
    users ||--o{ lead_notes : writes
    users ||--o{ lead_documents : uploads
    users ||--o{ lead_status_history : changes
    users ||--o{ lead_checklist : verifies
    users ||--o{ bank_assignments : assigns
    users ||--o{ partner_share_links : creates
    users ||--o{ customer_access_tokens : creates
    users ||--o{ application_links : creates
    users ||--o{ msg91_verified_tokens : uses
    
    partner_profiles ||--o{ msg91_verified_tokens : uses
    
    products ||--o{ product_application_settings : configured
    
    bank_card_applications ||--o{ bank_card_application_timeline : tracks
    sbi_credit_card_applications ||--o{ sbi_cc_application_timeline : tracks
    
    customers ||--o{ bank_card_applications : applies
    customers ||--o{ sbi_credit_card_applications : applies
    
    applications ||--o{ physical_application_details : has
    applications ||--o{ bank_card_applications : linked
    applications ||--o{ sbi_credit_card_applications : linked
    
    leads ||--o{ partner_share_links : generates
    applications ||--o{ partner_share_links : linked
    
    partner_profiles ||--o{ partner_team_relationships : member
    partner_profiles ||--o{ partner_team_relationships : parent
    partner_profiles ||--o{ partner_team_relationships : child
    partner_profiles ||--o{ partner_team_relationships : sponsor
    
    partner_profiles ||--o{ partner_referrals : has
    partner_profiles ||--o{ partner_teams : has
    partner_profiles ||--o{ partner_upgrade_requests : requests
    partner_profiles ||--o{ partner_preferences : has
    partner_profiles ||--o{ partner_saved_products : saves
    partner_profiles ||--o{ partner_recent_products : views
    partner_profiles ||--o{ partner_training_progress : completes
    partner_profiles ||--o{ partner_share_links : creates
    partner_profiles ||--o{ partner_bank_details : has
    partner_profiles ||--o{ partner_videos : has
    partner_profiles ||--o{ partner_referrals : has
    partner_profiles ||--o{ partner_wallets : has
    partner_profiles ||--o{ partner_teams : has
    partner_profiles ||--o{ partner_upgrade_requests : has
    partner_profiles ||--o{ leads : creates
    partner_profiles ||--o{ applications : submits
    partner_profiles ||--o{ referral_clicks : generates
    partner_profiles ||--o{ invitation_history : sends
    partner_profiles ||--o{ referral_campaigns : creates
    partner_profiles ||--o{ team_activity : generates
    partner_profiles ||--o{ team_goals : sets
    partner_profiles ||--o{ team_notifications : receives
    partner_profiles ||--o{ team_commissions : earns
    partner_profiles ||--o{ wallet_ledger : has
    partner_profiles ||--o{ wallet_transactions : has
    partner_profiles ||--o{ wallet_withdrawals : requests
    partner_profiles ||--o{ wallet_audit_logs : has
    partner_profiles ||--o{ commission_release_jobs : has
    partner_profiles ||--o{ withdrawal_audit_logs : has
    partner_profiles ||--o{ wallet_reconciliation : has
    partner_profiles ||--o{ wallet_bonus : receives
    partner_profiles ||--o{ wallet_adjustments : has
    partner_profiles ||--o{ partner_settlements : receives
    partner_profiles ||--o{ payout_logs : has
    partner_profiles ||--o{ activity_logs : generates
    partner_profiles ||--o{ audit_logs : performs
    partner_profiles ||--o{ support_tickets : creates
    partner_profiles ||--o{ customer_notes : writes
    partner_profiles ||--o{ customer_followups : schedules
    partner_profiles ||--o{ customer_tags : applies
    partner_profiles ||--o{ customer_activity_logs : generates
    partner_profiles ||--o{ customer_communications : sends
    partner_profiles ||--o{ lead_followups : schedules
    partner_profiles ||--o{ lead_documents : uploads
    partner_profiles ||--o{ lead_timeline : tracks
    partner_profiles ||--o{ lead_notes : writes
    partner_profiles ||--o{ lead_assignments : assigns
    partner_profiles ||--o{ lead_activity_logs : generates
    partner_profiles ||--o{ lead_status_history : tracks
    partner_profiles ||--o{ lead_checklist : verifies
    partner_profiles ||--o{ lead_sla : tracks
    partner_profiles ||--o{ bank_assignments : has
    partner_profiles ||--o{ partner_share_links : creates
    partner_profiles ||--o{ partner_training_progress : completes
    partner_profiles ||--o{ report_cache : generates
    partner_profiles ||--o{ report_exports : exports
    partner_profiles ||--o{ scheduled_reports : schedules
    partner_profiles ||--o{ registration_logs : logs
    partner_profiles ||--o{ bank_details_history : changes
    partner_profiles ||--o{ click_tracking : tracks
    partner_profiles ||--o{ application_click_logs : tracks
    partner_profiles ||--o{ direct_card_applications : submits
    partner_profiles ||--o{ msg91_verified_tokens : uses
    partner_profiles ||--o{ product_application_settings : configures
    partner_profiles ||--o{ product_ratings : gives
    partner_profiles ||--o{ product_share_logs : shares
    partner_profiles ||--o{ partner_saved_products : saves
    partner_profiles ||--o{ partner_recent_products : views
    partner_profiles ||--o{ notification_preferences : has
    partner_profiles ||--o{ announcements : creates
    partner_profiles ||--o{ kyc_documents : uploads
    partner_profiles ||--o{ partner_videos : uploads
    partner_profiles ||--o{ partner_referrals : has
    partner_profiles ||--o{ partner_teams : has
    partner_profiles ||--o{ partner_upgrade_requests : requests
    partner_profiles ||--o{ partner_preferences : has
    partner_profiles ||--o{ partner_training_progress : completes
    partner_profiles ||--o{ partner_share_links : creates
    partner_profiles ||--o{ partner_bank_details : has
    partner_profiles ||--o{ partner_videos : has
    partner_profiles ||--o{ partner_referrals : has
    partner_profiles ||--o{ partner_wallets : has
    partner_profiles ||--o{ partner_teams : has
    partner_profiles ||--o{ partner_upgrade_requests : has
    partner_profiles ||--o{ leads : creates
    partner_profiles ||--o{ applications : submits
    partner_profiles ||--o{ referral_clicks : generates
    partner_profiles ||--o{ invitation_history : sends
    partner_profiles ||--o{ referral_campaigns : creates
    partner_profiles ||--o{ team_activity : generates
    partner_profiles ||--o{ team_goals : sets
    partner_profiles ||--o{ team_notifications : receives
    partner_profiles ||--o{ team_commissions : earns
    partner_profiles ||--o{ wallet_ledger : has
    partner_profiles ||--o{ wallet_transactions : has
    partner_profiles ||--o{ wallet_withdrawals : requests
    partner_profiles ||--o{ wallet_audit_logs : has
    partner_profiles ||--o{ commission_release_jobs : has
    partner_profiles ||--o{ withdrawal_audit_logs : has
    partner_profiles ||--o{ wallet_reconciliation : has
    partner_profiles ||--o{ wallet_bonus : receives
    partner_profiles ||--o{ wallet_adjustments : has
    partner_profiles ||--o{ partner_settlements : receives
    partner_profiles ||--o{ payout_logs : has
    partner_profiles ||--o{ activity_logs : generates
    partner_profiles ||--o{ audit_logs : performs
    partner_profiles ||--o{ support_tickets : creates
    partner_profiles ||--o{ customer_notes : writes
    partner_profiles ||--o{ customer_followups : schedules
    partner_profiles ||--o{ customer_tags : applies
    partner_profiles ||--o{ customer_activity_logs : generates
    partner_profiles ||--o{ customer_communications : sends
    partner_profiles ||--o{ lead_followups : schedules
    partner_profiles ||--o{ lead_documents : uploads
    partner_profiles ||--o{ lead_timeline : tracks
    partner_profiles ||--o{ lead_notes : writes
    partner_profiles ||--o{ lead_assignments : assigns
    partner_profiles ||--o{ lead_activity_logs : generates
    partner_profiles ||--o{ lead_status_history : tracks
    partner_profiles ||--o{ lead_checklist : verifies
    partner_profiles ||--o{ lead_sla : tracks
    partner_profiles ||--o{ bank_assignments : has
    partner_profiles ||--o{ partner_share_links : creates
    partner_profiles ||--o{ partner_training_progress : completes
    partner_profiles ||--o{ report_cache : generates
    partner_profiles ||--o{ report_exports : exports
    partner_profiles ||--o{ scheduled_reports : schedules
    partner_profiles ||--o{ registration_logs : logs
    partner_profiles ||--o{ bank_details_history : changes
    partner_profiles ||--o{ click_tracking : tracks
    partner_profiles ||--o{ application_click_logs : tracks
    partner_profiles ||--o{ direct_card_applications : submits
    partner_profiles ||--o{ msg91_verified_tokens : uses
    partner_profiles ||--o{ product_application_settings : configures
    partner_profiles ||--o{ product_ratings : gives
    partner_profiles ||--o{ product_share_logs : shares
    partner_profiles ||--o{ partner_saved_products : saves
    partner_profiles ||--o{ partner_recent_products : views
    partner_profiles ||--o{ notification_preferences : has
    partner_profiles ||--o{ announcements : creates
    partner_profiles ||--o{ kyc_documents : uploads
    partner_profiles ||--o{ partner_videos : uploads
    partner_profiles ||--o{ partner_referrals : has
    partner_profiles ||--o{ partner_teams : has
    partner_profiles ||--o{ partner_upgrade_requests : requests
    partner_profiles ||--o{ partner_preferences : has
    partner_profiles ||--o{ partner_training_progress : completes
    partner_profiles ||--o{ partner_share_links : creates
    partner_profiles ||--o{ partner_bank_details : has
    partner_profiles ||--o{ partner_videos : has
    partner_profiles ||--o{ partner_referrals : has
    partner_profiles ||--o{ partner_wallets : has
    partner_profiles ||--o{ partner_teams : has
    partner_profiles ||--o{ partner_upgrade_requests : has
    partner_profiles ||--o{ leads : creates
    partner_profiles ||--o{ applications : submits
    partner_profiles ||--o{ referral_clicks : generates
    partner_profiles ||--o{ invitation_history : sends
    partner_profiles ||--o{ referral_campaigns : creates
    partner_profiles ||--o{ team_activity : generates
    partner_profiles ||--o{ team_goals : sets
    partner_profiles ||--o{ team_notifications : receives
    partner_profiles ||--o{ team_commissions : earns
    partner_profiles ||--o{ wallet_ledger : has
    partner_profiles ||--o{ wallet_transactions : has
    partner_profiles ||--o{ wallet_withdrawals : requests
    partner_profiles ||--o{ wallet_audit_logs : has
    partner_profiles ||--o{ commission_release_jobs : has
    partner_profiles ||--o{ withdrawal_audit_logs : has
    partner_profiles ||--o{ wallet_reconciliation : has
    partner_profiles ||--o{ wallet_bonus : receives
    partner_profiles ||--o{ wallet_adjustments : has
    partner_profiles ||--o{ partner_settlements : receives
    partner_profiles ||--o{ payout_logs : has
    partner_profiles ||--o{ activity_logs : generates
    partner_profiles ||--o{ audit_logs : performs
    partner_profiles ||--o{ support_tickets : creates
    partner_profiles ||--o{ customer_notes : writes
    partner_profiles ||--o{ customer_followups : schedules
    partner_profiles ||--o{ customer_tags : applies
    partner_profiles ||--o{ customer_activity_logs : generates
    partner_profiles ||--o{ customer_communications : sends
    partner_profiles ||--o{ lead_followups : schedules
    partner_profiles ||--o{ lead_documents : uploads
    partner_profiles ||--o{ lead_timeline : tracks
    partner_profiles ||--o{ lead_notes : writes
    partner_profiles ||--o{ lead_assignments : assigns
    partner_profiles ||--o{ lead_activity_logs : generates
    partner_profiles ||--o{ lead_status_history : tracks
    partner_profiles ||--o{ lead_checklist : verifies
    partner_profiles ||--o{ lead_sla : tracks
    partner_profiles ||--o{ bank_assignments : has
    partner_profiles ||--o{ partner_share_links : creates
    partner_profiles ||--o{ partner_training_progress : completes
    partner_profiles ||--o{ report_cache : generates
    partner_profiles ||--o{ report_exports : exports
    partner_profiles ||--o{ scheduled_reports : schedules
    partner_profiles ||--o{ registration_logs : logs
    partner_profiles ||--o{ bank_details_history : changes
    partner_profiles ||--o{ click_tracking : tracks
    partner_profiles ||--o{ application_click_logs : tracks
    partner_profiles ||--o{ direct_card_applications : submits
    partner_profiles ||--o{ msg91_verified_tokens : uses
    partner_profiles ||--o{ product_application_settings : configures
    partner_profiles ||--o{ product_ratings : gives
    partner_profiles ||--o{ product_share_logs : shares
    partner_profiles ||--o{ partner_saved_products : saves
    partner_profiles ||--o{ partner_recent_products : views
    partner_profiles ||--o{ notification_preferences : has
    partner_profiles ||--o{ announcements : creates
    partner_profiles ||--o{ kyc_documents : uploads
    partner_profiles ||--o{ partner_videos : uploads
```

---

This documentation provides a comprehensive overview of the database structure. For specific queries or implementation details, refer to the migration file at `backend/src/database/migrations/migrate.js`.

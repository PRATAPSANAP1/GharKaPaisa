# GharKaPaisa Project Algorithms and Architecture

**Date**: August 25, 2026  
**Project**: GharKaPaisa - Financial Services Platform  
**Version**: 1.0.0

---

## Table of Contents

1. [Overall Project Architecture](#overall-project-architecture)
2. [Authentication Module](#authentication-module)
3. [Partner Module](#partner-module)
4. [Wallet Module](#wallet-module)
5. [CRM Module](#crm-module)
6. [Products Module](#products-module)
7. [Notifications Module](#notifications-module)
8. [Team Management Module](#team-management-module)
9. [Commission Engine](#commission-engine)
10. [Admin/Super-Admin Module](#adminsuper-admin-module)
11. [Payment Module](#payment-module)
12. [Banks Module](#banks-module)
13. [Support Module](#support-module)
14. [Reports Module](#reports-module)
15. [Analytics Module](#analytics-module)
16. [CMS Module](#cms-module)
17. [Banner Module](#banner-module)
18. [Location Module](#location-module)
19. [Marketing Module](#marketing-module)
20. [SBI Credit Card Module](#sbi-credit-card-module)

---

## Overall Project Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GharKaPaisa Platform                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Frontend   │    │    Mobile    │    │   Backend    │                  │
│  │   (React)    │    │  (React Native)│   │  (Node.js)   │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                    │                    │                          │
│         │                    │                    │                          │
│         ▼                    ▼                    ▼                          │
│  ┌──────────────────────────────────────────────────────────┐             │
│                    API Gateway / Load Balancer                │             │
│  └──────────────────────────────────────────────────────────┘             │
│                              │                                         │
│                              ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐             │
│                      Express.js Server                         │             │
│  └──────────────────────────────────────────────────────────┘             │
│                              │                                         │
│         ┌────────────────────┼────────────────────┐               │
│         ▼                    ▼                    ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Auth       │    │   Partner    │    │    Wallet    │      │
│  │   Module     │    │   Module     │    │    Module    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │     CRM      │    │   Products   │    │ Notifications│      │
│  │   Module     │    │   Module     │    │    Module    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │     Team     │    │  Commission  │    │    Admin     │      │
│  │   Module     │    │    Engine    │    │   Module     │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                              │                                         │
│                              ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐             │
│                    PostgreSQL Database                         │             │
│              (114 Tables across 16 Features)                   │             │
│  └──────────────────────────────────────────────────────────┘             │
│                              │                                         │
│         ┌────────────────────┼────────────────────┐               │
│         ▼                    ▼                    ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   AWS S3     │    │   AWS SES    │    │   MSG91      │      │
│  │ (File Storage)│   │   (Email)    │    │   (SMS OTP)  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Razorpay   │    │   CloudFront │    │   Winston    │      │
│  │ (Payments)   │    │   (CDN)      │    │  (Logging)   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Module Dependency Map                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                                           │
│  │    Auth      │───┐                                                        │
│  │   Module     │   │                                                        │
│  └──────────────┘   │                                                        │
│                     │                                                        │
│  ┌──────────────┐   │    ┌──────────────┐    ┌──────────────┐              │
│  │   Partner    │◄──┘    │    Wallet    │◄───│  Commission  │              │
│  │   Module     │        │   Module     │    │    Engine    │              │
│  └──────────────┘        └──────────────┘    └──────────────┘              │
│         │                      │                     │                       │
│         │                      │                     │                       │
│         ▼                      ▼                     ▼                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │     CRM      │    │   Products   │    │     Team     │              │
│  │   Module     │    │   Module     │    │   Module     │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         │                      │                     │                       │
│         │                      │                     │                       │
│         ▼                      ▼                     ▼                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  Customer    │    │ Notifications│    │    Admin     │              │
│  │   Module     │    │   Module     │    │   Module     │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Data Flow Architecture                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User Request → API Gateway → Authentication → Authorization → Controller    │
│       │                  │                │                │           │      │
│       │                  │                │                │           ▼      │
│       │                  │                │                │    Business Logic  │
│       │                  │                │                │           │      │
│       │                  │                │                │           ▼      │
│       │                  │                │                │     Data Validation │
│       │                  │                │                │           │      │
│       │                  │                │                │           ▼      │
│       │                  │                │                │    Database Query  │
│       │                  │                │                │           │      │
│       │                  │                │                │           ▼      │
│       │                  │                │                │    Response Format │
│       │                  │                │                │           │      │
│       │                  │                │                │           ▼      │
│       │                  │                │                │    API Response   │
│       │                  │                │                │           │      │
│       ▼                  ▼                ▼                ▼           ▼      │
│  User Response ← API Gateway ← Authentication ← Authorization ← Controller   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Module

### Module Overview
The authentication module handles user registration, login, logout, password management, OTP verification, and session management using JWT tokens.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Authentication Module                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Register   │    │    Login     │    │   Logout     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Validate    │    │  Validate    │    │  Clear Token │                  │
│  │   Input      │    │  Credentials │    │   Cookie     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┘                  │
│         │                   │                                              │
│         ▼                   ▼                                              │
│  ┌──────────────┐    ┌──────────────┐                                     │
│  │ Check Email/ │    │  Hash        │                                     │
│  │ Mobile Exists│    │  Password    │                                     │
│  └──────┬───────┘    └──────┬───────┘                                     │
│         │                   │                                              │
│         ▼                   ▼                                              │
│  ┌──────────────┐    ┌──────────────┐                                     │
│  │  Hash        │    │  Generate    │                                     │
│  │  Password    │    │  JWT Tokens  │                                     │
│  └──────┬───────┘    └──────┬───────┘                                     │
│         │                   │                                              │
│         ▼                   ▼                                              │
│  ┌──────────────┐    ┌──────────────┐                                     │
│  │  Create User │    │  Set Cookie  │                                     │
│  │   Record     │    │  & Return    │                                     │
│  └──────┬───────┘    └──────┬───────┘                                     │
│         │                   │                                              │
│         └─────────┬─────────┘                                              │
│                   ▼                                                         │
│          ┌──────────────┐                                                  │
│          │   Database   │                                                  │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Algorithms

#### 1. User Registration Algorithm

```
ALGORITHM: registerUser
INPUT: email, mobile, password, role, full_name
OUTPUT: user object with JWT tokens

BEGIN
    // Step 1: Validate Input
    IF email is invalid OR mobile is invalid OR password length < 8
        RETURN error("Invalid input")
    END IF

    // Step 2: Check for existing user
    user ← query("SELECT id FROM users WHERE email = $1 OR mobile = $2", [email, mobile])
    IF user exists
        RETURN error("Email or mobile already registered")
    END IF

    // Step 3: Hash password
    hashedPassword ← bcrypt.hash(password, 10)

    // Step 4: Generate partner code if role is PARTNER
    IF role = "PARTNER"
        partnerCode ← generatePartnerCode()
    END IF

    // Step 5: Create user record
    userId ← query("INSERT INTO users (email, mobile, password_hash, role, full_name, status) 
                   VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id", 
                   [email, mobile, hashedPassword, role, full_name])

    // Step 6: Create partner profile if applicable
    IF role = "PARTNER"
        query("INSERT INTO partner_profiles (user_id, partner_code, first_name, last_name, kyc_status) 
              VALUES ($1, $2, $3, $4, 'pending')", 
              [userId, partnerCode, full_name, ""])
        
        // Step 7: Create wallet for partner
        ensureWallet(partnerId)
    END IF

    // Step 8: Generate JWT tokens
    accessToken ← jwt.sign({id: userId, role: role}, JWT_SECRET, {expiresIn: '1h'})
    refreshToken ← crypto.randomBytes(40).toString('hex')
    refreshTokenHash ← crypto.createHash('sha256').update(refreshToken).digest('hex')

    // Step 9: Save refresh token
    query("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) 
          VALUES ($1, $2, NOW() + INTERVAL '30 days')", 
          [userId, refreshTokenHash])

    // Step 10: Set refresh token cookie
    setRefreshTokenCookie(response, refreshToken)

    // Step 11: Send verification email
    verificationToken ← jwt.sign({id: userId}, JWT_SECRET, {expiresIn: '24h'})
    verificationLink ← buildVerificationLink(verificationToken)
    sendVerificationEmail(email, verificationLink)

    // Step 12: Return success
    RETURN success({user: {id, email, mobile, role, status}, accessToken})
END
```

#### 2. User Login Algorithm

```
ALGORITHM: loginUser
INPUT: identity (email/mobile), password, rememberMe
OUTPUT: user object with JWT tokens

BEGIN
    // Step 1: Normalize identity
    identity ← normalizeIdentity(identity)

    // Step 2: Find user by email or mobile
    user ← query("SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR mobile = $2", 
                 [identity, identity])
    
    IF user does not exist
        RETURN error("Invalid credentials")
    END IF

    // Step 3: Check account status
    IF user.status = 'suspended' OR user.status = 'blocked'
        RETURN error("Account is suspended or blocked")
    END IF

    // Step 4: Verify password
    passwordValid ← bcrypt.compare(password, user.password_hash)
    IF passwordValid = false
        RETURN error("Invalid credentials")
    END IF

    // Step 5: Check for forced password change
    IF user.must_change_password = true
        RETURN error("Password change required")
    END IF

    // Step 6: Update last login
    query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id])

    // Step 7: Generate JWT tokens
    accessToken ← jwt.sign({id: user.id, role: user.role}, JWT_SECRET, {expiresIn: '1h'})
    refreshToken ← crypto.randomBytes(40).toString('hex')
    refreshTokenHash ← crypto.createHash('sha256').update(refreshToken).digest('hex')

    // Step 8: Save refresh token
    query("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) 
          VALUES ($1, $2, NOW() + INTERVAL '30 days')", 
          [user.id, refreshTokenHash])

    // Step 9: Set refresh token cookie
    setRefreshTokenCookie(response, refreshToken, rememberMe)

    // Step 10: Return user data
    RETURN success({user, accessToken})
END
```

#### 3. OTP Verification Algorithm

```
ALGORITHM: verifyOTP
INPUT: identity (email/mobile), otp, type
OUTPUT: verification result

BEGIN
    // Step 1: Normalize identity
    identity ← normalizeIdentity(identity)

    // Step 2: Find OTP record
    otpRecord ← query("SELECT * FROM otp_verifications 
                      WHERE identity = $1 AND otp_hash = $2 AND expires_at > NOW() 
                      ORDER BY created_at DESC LIMIT 1", 
                     [identity, hash(otp + OTP_PEPPER)])
    
    IF otpRecord does not exist
        RETURN error("Invalid or expired OTP")
    END IF

    // Step 3: Check OTP attempts
    IF otpRecord.attempts >= 3
        RETURN error("Maximum OTP attempts exceeded")
    END IF

    // Step 4: Increment attempt counter
    query("UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1", 
          [otpRecord.id])

    // Step 5: Verify OTP
    otpValid ← verifyAccessToken(otp, otpRecord.otp_hash, OTP_PEPPER)
    IF otpValid = false
        RETURN error("Invalid OTP")
    END IF

    // Step 6: Mark OTP as verified
    query("UPDATE otp_verifications SET verified = true, verified_at = NOW() WHERE id = $1", 
          [otpRecord.id])

    // Step 7: Perform action based on type
    IF type = 'email_verification'
        query("UPDATE users SET status = 'active' WHERE id = $1", [otpRecord.user_id])
    ELSE IF type = 'password_reset'
        // Allow password reset
    END IF

    // Step 8: Return success
    RETURN success({message: "OTP verified successfully"})
END
```

#### 4. Token Refresh Algorithm

```
ALGORITHM: refreshToken
INPUT: refreshToken (from cookie)
OUTPUT: new accessToken

BEGIN
    // Step 1: Get refresh token from cookie
    refreshToken ← request.cookies.refreshToken
    IF refreshToken is empty
        RETURN error("No refresh token provided")
    END IF

    // Step 2: Hash the token
    tokenHash ← crypto.createHash('sha256').update(refreshToken).digest('hex')

    // Step 3: Find token in database
    tokenRecord ← query("SELECT * FROM refresh_tokens 
                        WHERE token_hash = $1 AND expires_at > NOW() AND revoked = false", 
                       [tokenHash])
    
    IF tokenRecord does not exist
        RETURN error("Invalid or expired refresh token")
    END IF

    // Step 4: Get user details
    user ← query("SELECT * FROM users WHERE id = $1", [tokenRecord.user_id])
    IF user does not exist
        RETURN error("User not found")
    END IF

    // Step 5: Check account status
    IF user.status = 'suspended' OR user.status = 'blocked'
        RETURN error("Account is suspended or blocked")
    END IF

    // Step 6: Generate new access token
    newAccessToken ← jwt.sign({id: user.id, role: user.role}, JWT_SECRET, {expiresIn: '1h'})

    // Step 7: Return new token
    RETURN success({accessToken: newAccessToken})
END
```

#### 5. Password Change Algorithm

```
ALGORITHM: changePassword
INPUT: currentPassword, newPassword
OUTPUT: success/error

BEGIN
    // Step 1: Get user from request
    userId ← request.user.id

    // Step 2: Get current password hash
    user ← query("SELECT password_hash FROM users WHERE id = $1", [userId])

    // Step 3: Verify current password
    passwordValid ← bcrypt.compare(currentPassword, user.password_hash)
    IF passwordValid = false
        RETURN error("Current password is incorrect")
    END IF

    // Step 4: Validate new password
    IF newPassword.length < 8
        RETURN error("Password must be at least 8 characters long")
    END IF

    // Step 5: Hash new password
    newHashedPassword ← bcrypt.hash(newPassword, 10)

    // Step 6: Update password
    query("UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2", 
          [newHashedPassword, userId])

    // Step 7: Revoke all refresh tokens
    query("UPDATE refresh_tokens SET revoked = true WHERE user_id = $1", [userId])

    // Step 8: Send notification
    sendEmail(user.email, "Password Changed", "Your password has been changed successfully")

    // Step 9: Return success
    RETURN success({message: "Password changed successfully"})
END
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | User login | No |
| POST | `/api/v1/auth/logout` | User logout | Yes |
| POST | `/api/v1/auth/refresh` | Refresh access token | No (cookie) |
| GET | `/api/v1/auth/me` | Get current user | Yes |
| POST | `/api/v1/auth/lookup` | Check if user exists | No |
| POST | `/api/v1/auth/send-otp` | Send OTP for verification | No |
| POST | `/api/v1/auth/verify-otp` | Verify OTP | No |
| POST | `/api/v1/auth/change-password` | Change password | Yes |
| POST | `/api/v1/auth/forgot-password` | Initiate password reset | No |
| POST | `/api/v1/auth/reset-password` | Reset password with token | No |
| GET | `/api/v1/auth/verify-email` | Verify email with token | No |

---

## Partner Module

### Module Overview
The partner module handles partner registration, KYC verification, profile management, bank details, and partner hierarchy management.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Partner Module                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Register   │    │  KYC Verify  │    │   Profile    │                  │
│  │   Partner    │    │              │    │   Update     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Generate    │    │  Upload      │    │  Update      │                  │
│  │  Partner     │    │  Documents   │    │  Personal    │                  │
│  │    Code      │    │              │    │    Info      │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Create      │    │  Verify      │    │  Update      │                  │
│  │  Partner     │    │  Documents   │    │  Business    │                  │
│  │  Profile     │    │              │    │    Info      │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Create      │    │  Update KYC  │    │  Update      │                  │
│  │   Wallet     │    │   Status     │    │  Bank        │                  │
│  │              │    │              │    │  Details     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └─────────┬─────────┘                   │                          │
│                   ▼                              │                          │
│          ┌──────────────┐                       │                          │
│          │   Database   │◄──────────────────────┘                          │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Algorithms

#### 1. Partner Registration Algorithm

```
ALGORITHM: registerPartner
INPUT: first_name, last_name, email, mobile, business_details
OUTPUT: partner object

BEGIN
    // Step 1: Validate input
    IF email is invalid OR mobile is invalid
        RETURN error("Invalid email or mobile")
    END IF

    // Step 2: Check if user already exists
    existingUser ← query("SELECT id FROM users WHERE email = $1 OR mobile = $2", [email, mobile])
    IF existingUser exists
        RETURN error("User already exists")
    END IF

    // Step 3: Generate partner code
    partnerCode ← generatePartnerCode()
    referralCode ← generateRandomReferralCode()

    // Step 4: Create user record
    userId ← query("INSERT INTO users (email, mobile, role, full_name, status) 
                   VALUES ($1, $2, 'PARTNER', $3, 'pending') RETURNING id", 
                   [email, mobile, first_name + " " + last_name])

    // Step 5: Create partner profile
    partnerId ← query("INSERT INTO partner_profiles 
                      (user_id, partner_code, referral_code, first_name, last_name, 
                       company_name, business_location, gst_number, kyc_status) 
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') 
                      RETURNING id", 
                      [userId, partnerCode, referralCode, first_name, last_name, 
                       business_details.company_name, business_details.location, 
                       business_details.gst_number])

    // Step 6: Create wallet for partner
    ensureWallet(partnerId)

    // Step 7: Send welcome email
    sendEmail(email, "Welcome to GharKaPaisa", "Your partner account has been created")

    // Step 8: Return success
    RETURN success({partnerId, partnerCode, referralCode})
END
```

#### 2. KYC Document Upload Algorithm

```
ALGORITHM: uploadKYCDocument
INPUT: partnerId, docType, docNumber, file
OUTPUT: document object

BEGIN
    // Step 1: Validate partner
    partner ← query("SELECT * FROM partner_profiles WHERE id = $1", [partnerId])
    IF partner does not exist
        RETURN error("Partner not found")
    END IF

    // Step 2: Upload file to S3
    fileKey ← uploadToS3(file, `kyc/${partnerId}/${docType}/${Date.now()}`)

    // Step 3: Create document record
    docId ← query("INSERT INTO kyc_documents 
                   (partner_id, doc_type, doc_number, file_url, s3_key, verification_status) 
                   VALUES ($1, $2, $3, $4, $5, 'pending') 
                   RETURNING id", 
                   [partnerId, docType, docNumber, fileKey, fileKey])

    // Step 4: Update partner KYC status
    query("UPDATE partner_profiles SET kyc_status = 'under_review' WHERE id = $1", [partnerId])

    // Step 5: Notify admin
    notify("ADMIN", "New KYC document uploaded", `Partner ${partnerCode} uploaded ${docType}`)

    // Step 6: Return success
    RETURN success({docId, docType, status: 'pending'})
END
```

#### 3. Partner Profile Update Algorithm

```
ALGORITHM: updatePartnerProfile
INPUT: partnerId, profileData
OUTPUT: updated partner object

BEGIN
    // Step 1: Validate partner
    partner ← query("SELECT * FROM partner_profiles WHERE id = $1", [partnerId])
    IF partner does not exist
        RETURN error("Partner not found")
    END IF

    // Step 2: Check authorization
    IF request.user.role != 'SUPER_ADMIN' AND request.user.role != 'ADMIN'
        IF request.partner.id != partnerId
            RETURN error("Unauthorized")
        END IF
    END IF

    // Step 3: Update personal information
    IF profileData.first_name OR profileData.last_name
        query("UPDATE partner_profiles 
              SET first_name = COALESCE($1, first_name), 
                  last_name = COALESCE($2, last_name) 
              WHERE id = $3", 
              [profileData.first_name, profileData.last_name, partnerId])
    END IF

    // Step 4: Update business information
    IF profileData.company_name OR profileData.business_location
        query("UPDATE partner_profiles 
              SET company_name = COALESCE($1, company_name), 
                  business_location = COALESCE($2, business_location) 
              WHERE id = $3", 
              [profileData.company_name, profileData.business_location, partnerId])
    END IF

    // Step 5: Update address
    IF profileData.current_address OR profileData.pincode
        query("UPDATE partner_profiles 
              SET current_address = COALESCE($1, current_address), 
                  pincode = COALESCE($2, pincode) 
              WHERE id = $3", 
              [profileData.current_address, profileData.pincode, partnerId])
    END IF

    // Step 6: Upload profile photo if provided
    IF profileData.profile_photo
        photoKey ← uploadToS3(profileData.profile_photo, `profiles/${partnerId}/photo`)
        query("UPDATE partner_profiles SET profile_photo_url = $1 WHERE id = $2", 
              [photoKey, partnerId])
    END IF

    // Step 7: Return updated profile
    updatedPartner ← query("SELECT * FROM partner_profiles WHERE id = $1", [partnerId])
    RETURN success(updatedPartner)
END
```

#### 4. Bank Details Management Algorithm

```
ALGORITHM: saveBankDetails
INPUT: partnerId, bankName, accountNumber, ifscCode, accountHolderName, upiId
OUTPUT: bank details object

BEGIN
    // Step 1: Validate partner
    partner ← query("SELECT kyc_status FROM partner_profiles WHERE id = $1", [partnerId])
    IF partner does not exist
        RETURN error("Partner not found")
    END IF

    // Step 2: Check KYC status
    IF partner.kyc_status != 'approved'
        RETURN error("KYC must be approved to add bank details")
    END IF

    // Step 3: Validate input
    IF bankName is empty AND upiId is empty
        RETURN error("Bank Name or UPI ID is required")
    END IF

    // Step 4: Encrypt account number
    encryptedAccountNumber ← encrypt(accountNumber) IF accountNumber ELSE NULL

    // Step 5: Check existing bank details
    existing ← query("SELECT * FROM partner_bank_details WHERE partner_id = $1", [partnerId])

    // Step 6: Update or insert bank details
    IF existing exists
        query("UPDATE partner_bank_details 
              SET bank_name = COALESCE($1, bank_name), 
                  account_number = COALESCE($2, account_number), 
                  ifsc_code = COALESCE($3, ifsc_code), 
                  account_holder_name = COALESCE($4, account_holder_name), 
                  upi_id = COALESCE($5, upi_id) 
              WHERE id = $6", 
              [bankName, encryptedAccountNumber, ifscCode, accountHolderName, upiId, existing.id])
    ELSE
        query("INSERT INTO partner_bank_details 
              (partner_id, bank_name, account_number, ifsc_code, account_holder_name, upi_id) 
              VALUES ($1, $2, $3, $4, $5, $6)", 
              [partnerId, bankName, encryptedAccountNumber, ifscCode, accountHolderName, upiId])
    END IF

    // Step 7: Log action
    logAction(request.user.id, "BANK_DETAILS_UPDATED", `Partner ${partnerId} updated bank details`)

    // Step 8: Return success
    RETURN success({message: "Bank details saved successfully"})
END
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| GET | `/api/v1/partners/:PartnerId/profile` | Get partner profile | Yes |
| PUT | `/api/v1/partners/:PartnerId/profile` | Update partner profile | Yes |
| POST | `/api/v1/partners/kyc/upload` | Upload KYC document | Yes |
| GET | `/api/v1/partners/:PartnerId/kyc` | Get KYC documents | Yes |
| POST | `/api/v1/partners/bank-details` | Save bank details | Yes |
| GET | `/api/v1/partners/bank-details` | Get bank details | Yes |
| GET | `/api/v1/partners/:PartnerId/referrals` | Get partner referrals | Yes |
| POST | `/api/v1/partners/referral-click` | Track referral click | No |
| GET | `/api/v1/partners/list` | List all partners | Admin |
| PUT | `/api/v1/partners/:PartnerId/kyc-status` | Update KYC status | Admin |

---

## Wallet Module

### Module Overview
The wallet module handles partner wallet management, transactions, withdrawals, commission credits, and balance tracking.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Wallet Module                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Get Wallet │    │ Transactions │    │  Withdrawal  │                  │
│  │   Balance    │    │    History   │    │   Request    │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Query       │    │  Query with  │    │  Validate    │                  │
│  │  Wallet      │    │  Filters     │    │  Amount     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Calculate   │    │  Apply       │    │  Check       │                  │
│  │  Balances    │    │  Pagination  │    │  Limits      │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Return      │    │  Return      │    │  Debit       │                  │
│  │  Balance     │    │  Transactions│    │  Balance     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └─────────┬─────────┘                   │                          │
│                   ▼                              │                          │
│          ┌──────────────┐                       │                          │
│          │   Database   │◄──────────────────────┘                          │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Algorithms

#### 1. Get Wallet Balance Algorithm

```
ALGORITHM: getWalletBalance
INPUT: partnerId
OUTPUT: wallet balance object

BEGIN
    // Step 1: Validate partner
    IF partnerId is empty
        partnerId ← request.partner.id
    END IF

    // Step 2: Query wallet
    wallet ← query("SELECT * FROM partner_wallets WHERE partner_id = $1", [partnerId])
    
    IF wallet does not exist
        RETURN success({
            available_balance: 0,
            hold_balance: 0,
            total_earned: 0,
            total_withdrawn: 0
        })
    END IF

    // Step 3: Calculate balances
    availableBalance ← wallet.available_balance
    holdBalance ← wallet.hold_balance
    totalEarned ← wallet.total_earned
    totalWithdrawn ← wallet.total_withdrawn

    // Step 4: Return mapped wallet
    RETURN success({
        available_balance: availableBalance,
        pending_amount: holdBalance,
        total_earned: totalEarned,
        total_withdrawn: totalWithdrawn,
        razorpay_balance: availableBalance
    })
END
```

#### 2. Credit Commission Algorithm

```
ALGORITHM: creditCommission
INPUT: partnerId, amount, commissionType, referenceId, metadata
OUTPUT: transaction record

BEGIN
    // Step 1: Validate inputs
    IF amount <= 0
        RETURN error("Amount must be positive")
    END IF

    // Step 2: Ensure wallet exists
    wallet ← ensureWallet(partnerId)

    // Step 3: Check for duplicate commission (idempotency)
    IF referenceId is not empty
        existing ← query("SELECT * FROM wallet_transactions 
                         WHERE partner_id = $1 AND reference_id = $2 AND transaction_type = 'commission'", 
                        [partnerId, referenceId])
        IF existing exists
            RETURN success({message: "Commission already credited", transaction: existing})
        END IF
    END IF

    // Step 4: Start transaction
    client ← getClient()
    await client.query('BEGIN')

    TRY
        // Step 5: Calculate balance after
        balanceAfter ← wallet.available_balance + amount

        // Step 6: Insert transaction record
        transaction ← client.query("INSERT INTO wallet_transactions 
                                     (partner_id, transaction_type, credit, debit, 
                                      balance_after, reference_id, metadata, status) 
                                     VALUES ($1, 'commission', $2, 0, $3, $4, $5, 'completed') 
                                     RETURNING *", 
                                    [partnerId, amount, balanceAfter, referenceId, metadata])

        // Step 7: Update wallet balance
        client.query("UPDATE partner_wallets 
                     SET available_balance = available_balance + $1, 
                         total_earned = total_earned + $1 
                     WHERE partner_id = $2", 
                    [amount, partnerId])

        // Step 8: Insert into wallet ledger
        client.query("INSERT INTO wallet_ledger 
                     (partner_id, transaction_type, credit, balance_after, reference_id) 
                     VALUES ($1, 'commission', $2, $3, $4)", 
                    [partnerId, amount, balanceAfter, referenceId])

        // Step 9: Commit transaction
        await client.query('COMMIT')

        // Step 10: Notify partner
        notify(partnerId, "COMMISSION_CREDITED", `Commission of ${amount} credited to your wallet`)

        RETURN success(transaction)
    CATCH error
        await client.query('ROLLBACK')
        RETURN error("Failed to credit commission")
    END TRY
END
```

#### 3. Withdrawal Request Algorithm

```
ALGORITHM: requestWithdrawal
INPUT: partnerId, amount, bankAccountId, remarks
OUTPUT: withdrawal request record

BEGIN
    // Step 1: Validate partner
    partnerId ← request.partner.id

    // Step 2: Validate amount
    IF amount < WITHDRAWAL_MIN_AMOUNT
        RETURN error(`Minimum withdrawal amount is ${WITHDRAWAL_MIN_AMOUNT}`)
    END IF

    IF amount > WITHDRAWAL_MAX_AMOUNT
        RETURN error(`Maximum withdrawal amount is ${WITHDRAWAL_MAX_AMOUNT}`)
    END IF

    // Step 3: Get wallet balance
    wallet ← query("SELECT * FROM partner_wallets WHERE partner_id = $1", [partnerId])
    IF wallet.available_balance < amount
        RETURN error("Insufficient balance")
    END IF

    // Step 4: Check daily limit
    todayWithdrawals ← query("SELECT COALESCE(SUM(amount), 0) as total 
                             FROM wallet_withdrawals 
                             WHERE partner_id = $1 AND DATE(created_at) = CURRENT_DATE", 
                            [partnerId])
    IF todayWithdrawals.total + amount > WITHDRAWAL_DAILY_LIMIT
        RETURN error("Daily withdrawal limit exceeded")
    END IF

    // Step 5: Check for duplicate withdrawal
    recentWithdrawal ← query("SELECT * FROM wallet_withdrawals 
                              WHERE partner_id = $1 AND amount = $2 
                              AND created_at > NOW() - INTERVAL '${WITHDRAWAL_DUPLICATE_WINDOW_MINUTES} minutes' 
                              AND status = 'pending'", 
                             [partnerId, amount])
    IF recentWithdrawal exists
        RETURN error("Duplicate withdrawal request detected")
    END IF

    // Step 6: Get bank details
    bankQuery ← bankAccountId 
        ? "SELECT * FROM partner_bank_details WHERE id = $1 AND partner_id = $2"
        : "SELECT * FROM partner_bank_details WHERE partner_id = $1 ORDER BY is_primary DESC LIMIT 1"
    
    bank ← query(bankQuery, bankAccountId ? [bankAccountId, partnerId] : [partnerId])
    
    IF bank does not exist OR (bank.account_number is empty AND bank.upi_id is empty)
        RETURN error("No bank details registered")
    END IF

    // Step 7: Calculate TDS
    tdsRate ← 0.10 // 10% TDS
    tdsAmount ← amount * tdsRate
    netAmount ← amount - tdsAmount

    // Step 8: Start transaction
    client ← getClient()
    await client.query('BEGIN')

    TRY
        // Step 9: Debit from wallet
        await debitAvailable(client, partnerId, amount, "WITHDRAWAL")

        // Step 10: Create withdrawal request
        idempotencyKey ← `gkp-withdrawal-${Date.now()}-${randomString()}`
        withdrawal ← client.query("INSERT INTO wallet_withdrawals 
                                   (wallet_id, partner_id, amount, tds_rate, tds_amount, net_amount, 
                                    bank_name, account_number, ifsc_code, status, bank_account_id, remarks, idempotency_key) 
                                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11, $12) 
                                   RETURNING *", 
                                  [wallet.id, partnerId, amount, tdsRate, tdsAmount, netAmount, 
                                   bank.bank_name, bank.account_number, bank.ifsc_code, 
                                   bankAccountId, remarks, idempotencyKey])

        // Step 11: Log audit
        client.query("INSERT INTO wallet_audit_logs (wallet_id, partner_id, action, old_balance, new_balance, performed_by) 
                     VALUES ($1, $2, 'WITHDRAWAL_REQUEST', $3, $4, $5)", 
                    [wallet.id, partnerId, wallet.available_balance, wallet.available_balance - amount, request.user.id])

        // Step 12: Commit transaction
        await client.query('COMMIT')

        // Step 13: Notify admin
        notify("ADMIN", "WITHDRAWAL_REQUEST", `New withdrawal request of ${amount} from partner ${partnerId}`)

        RETURN success(withdrawal)
    CATCH error
        await client.query('ROLLBACK')
        RETURN error("Failed to create withdrawal request")
    END TRY
END
```

#### 4. Process Withdrawal Algorithm

```
ALGORITHM: processWithdrawal
INPUT: withdrawalId, action, remarks
OUTPUT: processed withdrawal record

BEGIN
    // Step 1: Get withdrawal request
    withdrawal ← query("SELECT * FROM wallet_withdrawals WHERE id = $1", [withdrawalId])
    IF withdrawal does not exist
        RETURN error("Withdrawal request not found")
    END IF

    // Step 2: Check status
    IF withdrawal.status != 'pending'
        RETURN error("Withdrawal already processed")
    END IF

    // Step 3: Start transaction
    client ← getClient()
    await client.query('BEGIN')

    TRY
        IF action = 'approve'
            // Step 4a: Process via Razorpay
            razorpayResponse ← razorpay.payout.create({
                account_number: withdrawal.account_number,
                amount: withdrawal.net_amount * 100, // in paise
                currency: "INR",
                mode: "NEFT",
                purpose: "PAYOUT",
                fund_account: {
                    account_type: "bank_account",
                    bank_account: {
                        name: withdrawal.account_holder_name,
                        account_number: withdrawal.account_number,
                        ifsc: withdrawal.ifsc_code
                    }
                },
                queue_if_low_balance: true
            })

            // Step 5a: Update withdrawal status
            client.query("UPDATE wallet_withdrawals 
                         SET status = 'processing', razorpay_payout_id = $1, processed_at = NOW() 
                         WHERE id = $2", 
                        [razorpayResponse.id, withdrawalId])

        ELSE IF action = 'reject'
            // Step 4b: Credit back to wallet
            await creditAvailable(client, withdrawal.partner_id, withdrawal.amount, "WITHDRAWAL_REFUND")

            // Step 5b: Update withdrawal status
            client.query("UPDATE wallet_withdrawals 
                         SET status = 'rejected', remarks = $1, processed_at = NOW() 
                         WHERE id = $2", 
                        [remarks, withdrawalId])
        END IF

        // Step 6: Log audit
        client.query("INSERT INTO wallet_audit_logs (wallet_id, partner_id, action, old_balance, new_balance, performed_by) 
                     VALUES ($1, $2, 'WITHDRAWAL_' + action.toUpperCase(), $3, $4, $5)", 
                    [withdrawal.wallet_id, withdrawal.partner_id, withdrawal.amount, withdrawal.amount, request.user.id])

        // Step 7: Commit transaction
        await client.query('COMMIT')

        // Step 8: Notify partner
        notify(withdrawal.partner_id, "WITHDRAWAL_" + action.toUpperCase(), `Your withdrawal request has been ${action}ed`)

        RETURN success({message: "Withdrawal processed successfully"})
    CATCH error
        await client.query('ROLLBACK')
        RETURN error("Failed to process withdrawal")
    END TRY
END
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| GET | `/api/v1/wallet` | Get wallet balance | Yes |
| GET | `/api/v1/wallet/transactions` | Get transaction history | Yes |
| POST | `/api/v1/wallet/withdraw` | Request withdrawal | Yes |
| GET | `/api/v1/wallet/withdrawals` | Get withdrawal history | Yes |
| PUT | `/api/v1/wallet/withdrawals/:id/process` | Process withdrawal | Admin |
| POST | `/api/v1/wallet/bank-details` | Save bank details | Yes |
| GET | `/api/v1/wallet/bank-details` | Get bank details | Yes |
| POST | `/api/v1/wallet/adjust` | Admin wallet adjustment | Admin |

---

## CRM Module

### Module Overview
The CRM module handles leads, applications, customers, and their lifecycle management including conversion, status tracking, and document management.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CRM Module                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │    Leads     │    │ Applications │    │  Customers   │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Create Lead │    │  Submit App  │    │  Create Cust │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Track       │    │  Track       │    │  Track       │                  │
│  │  Status      │    │  Status      │    │  Activity    │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Convert to  │    │  Process     │    │  Update      │                  │
│  │  Application │    │  Application │    │  Profile     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └─────────┬─────────┘                   │                          │
│                   ▼                              │                          │
│          ┌──────────────┐                       │                          │
│          │   Database   │◄──────────────────────┘                          │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Algorithms

#### 1. Lead Creation Algorithm

```
ALGORITHM: createLead
INPUT: customerData, productId, partnerId, source
OUTPUT: lead record

BEGIN
    // Step 1: Validate customer data
    IF customerData.mobile is empty
        RETURN error("Mobile number is required")
    END IF

    // Step 2: Check for existing customer
    customer ← query("SELECT * FROM customers WHERE mobile = $1", [customerData.mobile])
    
    IF customer does not exist
        // Step 3: Create new customer
        customer ← query("INSERT INTO customers (mobile, email, full_name, address, income, employment) 
                        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", 
                       [customerData.mobile, customerData.email, customerData.full_name, 
                        customerData.address, customerData.income, customerData.employment])
    END IF

    // Step 4: Validate product
    product ← query("SELECT * FROM products WHERE id = $1 AND is_active = true", [productId])
    IF product does not exist
        RETURN error("Product not found or inactive")
    END IF

    // Step 5: Check for duplicate lead (30-day window)
    duplicateLead ← query("SELECT * FROM leads 
                           WHERE customer_id = $1 AND product_id = $2 
                           AND created_at > NOW() - INTERVAL '30 days'", 
                          [customer.id, productId])
    IF duplicateLead exists
        RETURN success({message: "Lead already exists", lead: duplicateLead})
    END IF

    // Step 6: Create lead record
    lead ← query("INSERT INTO leads (customer_id, partner_id, product_id, source, status, process_type) 
                 VALUES ($1, $2, $3, $4, 'new', $5) RETURNING *", 
                [customer.id, partnerId, productId, source, source])

    // Step 7: Log timeline
    query("INSERT INTO lead_timeline (lead_id, event_type, title, description, actor_type, actor_id) 
          VALUES ($1, 'LEAD_CREATED', 'Lead Created', 'New lead created via ' + $2, 'partner', $3)", 
         [lead.id, source, partnerId])

    // Step 8: Notify partner
    notify(partnerId, "NEW_LEAD", `New lead created for product ${product.name}`)

    // Step 9: Return success
    RETURN success(lead)
END
```

#### 2. Application Submission Algorithm

```
ALGORITHM: submitApplication
INPUT: productId, customerData, loanAmount, notes
OUTPUT: application record

BEGIN
    // Step 1: Start transaction
    client ← getClient()
    await client.query('BEGIN')

    TRY
        // Step 2: Get or create partner
        partnerId ← request.partner.id
        IF partnerId is empty
            partner ← client.query("SELECT id FROM partner_profiles WHERE user_id = $1", [request.user.id])
            IF partner exists
                partnerId ← partner.id
            ELSE
                // Create temporary partner
                partnerCode ← 'AG' + randomString(5)
                partner ← client.query("INSERT INTO partner_profiles (user_id, partner_code, kyc_status) 
                                       VALUES ($1, $2, 'pending') RETURNING id", 
                                      [request.user.id, partnerCode])
                partnerId ← partner.id
            END IF
        END IF

        // Step 3: Validate product
        product ← client.query("SELECT p.*, b.name as bank_name FROM products p JOIN banks b ON b.id = p.bank_id 
                               WHERE p.id = $1 AND p.is_active = true", [productId])
        IF product does not exist
            RETURN error("Product not found or inactive")
        END IF

        // Step 4: Get or create customer
        customer ← client.query("SELECT * FROM customers WHERE mobile = $1", [customerData.mobile])
        IF customer does not exist
            customer ← client.query("INSERT INTO customers (mobile, email, full_name, dob, pan, income, address) 
                                    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *", 
                                   [customerData.mobile, customerData.email, customerData.full_name, 
                                    parseDobToIso(customerData.dob), customerData.pan, 
                                    customerData.income, customerData.address])
        END IF

        // Step 5: Check for duplicate application (30-day window)
        duplicateApp ← client.query("SELECT * FROM applications 
                                     WHERE customer_id = $1 AND product_id = $2 
                                     AND created_at > NOW() - INTERVAL '30 days'", 
                                    [customer.id, productId])
        IF duplicateApp exists
            RETURN error("Duplicate application within 30 days")
        END IF

        // Step 6: Generate application number
        appNumber ← generateAppNumber()

        // Step 7: Create application record
        application ← client.query("INSERT INTO applications 
                                    (customer_id, partner_id, product_id, application_number, 
                                     loan_amount, status, process_type, process_by, source) 
                                    VALUES ($1, $2, $3, $4, $5, 'submitted', 'partner_punch', $6, 'partner') 
                                    RETURNING *", 
                                   [customer.id, partnerId, productId, appNumber, loanAmount, request.user.id])

        // Step 8: Log timeline
        client.query("INSERT INTO application_timeline (application_id, status, activity, remarks, performed_by) 
                     VALUES ($1, 'submitted', 'Application Submitted', $2, $3)", 
                    [application.id, notes || 'Partner submitted application', request.user.id])

        // Step 9: Calculate and credit commission
        commission ← calculatePartnerCommission(partnerId, product.id, loanAmount)
        IF commission > 0
            await creditCommission(client, partnerId, commission, 'application', application.id, {
                product_id: productId,
                loan_amount: loanAmount
            })
        END IF

        // Step 10: Commit transaction
        await client.query('COMMIT')

        // Step 11: Notify partner
        notify(partnerId, "APPLICATION_SUBMITTED", `Application ${appNumber} submitted successfully`)

        RETURN success(application)
    CATCH error
        await client.query('ROLLBACK')
        RETURN error("Failed to submit application")
    END TRY
END
```

#### 3. Application Status Update Algorithm

```
ALGORITHM: updateApplicationStatus
INPUT: applicationId, newStatus, remarks
OUTPUT: updated application record

BEGIN
    // Step 1: Get application
    application ← query("SELECT * FROM applications WHERE id = $1", [applicationId])
    IF application does not exist
        RETURN error("Application not found")
    END IF

    // Step 2: Validate status transition
    validTransitions ← {
        'submitted': ['under_review', 'rejected'],
        'under_review': ['approved', 'rejected', 'correction_required'],
        'approved': ['disbursed', 'cancelled'],
        'correction_required': ['submitted', 'rejected']
    }

    IF newStatus not in validTransitions[application.status]
        RETURN error("Invalid status transition")
    END IF

    // Step 3: Start transaction
    client ← getClient()
    await client.query('BEGIN')

    TRY
        // Step 4: Update application status
        client.query("UPDATE applications SET status = $1, final_status = $1 WHERE id = $2", 
                    [newStatus, applicationId])

        // Step 5: Log timeline
        client.query("INSERT INTO application_timeline (application_id, status, activity, remarks, performed_by) 
                     VALUES ($1, $2, 'Status Updated', $3, $4)", 
                    [applicationId, newStatus, remarks || `Status changed to ${newStatus}`, request.user.id])

        // Step 6: Handle commission release on approval
        IF newStatus = 'approved' AND application.status != 'approved'
            await releaseHold(client, application.id)
        END IF

        // Step 7: Handle commission rejection on rejection
        IF newStatus = 'rejected' AND application.status != 'rejected'
            await manualRejectCommission(client, application.id)
        END IF

        // Step 8: Commit transaction
        await client.query('COMMIT')

        // Step 9: Notify partner
        notify(application.partner_id, "APPLICATION_STATUS_UPDATE", `Application status updated to ${newStatus}`)

        RETURN success({message: "Status updated successfully"})
    CATCH error
        await client.query('ROLLBACK')
        RETURN error("Failed to update status")
    END TRY
END
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| POST | `/api/v1/leads` | Create lead | Yes |
| GET | `/api/v1/leads` | List leads | Yes |
| GET | `/api/v1/leads/:id` | Get lead details | Yes |
| PUT | `/api/v1/leads/:id` | Update lead | Yes |
| POST | `/api/v1/leads/:id/convert` | Convert lead to application | Yes |
| POST | `/api/v1/applications` | Submit application | Yes |
| GET | `/api/v1/applications` | List applications | Yes |
| GET | `/api/v1/applications/:id` | Get application details | Yes |
| PUT | `/api/v1/applications/:id/status` | Update application status | Admin |
| POST | `/api/v1/customers` | Create customer | Yes |
| GET | `/api/v1/customers` | List customers | Yes |
| GET | `/api/v1/customers/:id` | Get customer details | Yes |

---

## Products Module

### Module Overview
The products module handles financial product management including credit cards, loans, insurance, and bank products with features, eligibility criteria, and commission structures.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Products Module                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Create     │    │   Update     │    │   Delete     │                  │
│  │   Product    │    │   Product    │    │   Product    │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Upload      │    │  Update      │    │  Mark as    │                  │
│  │  Images      │    │  Details     │    │  Inactive    │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Set Features│    │  Set Eligib  │    │  Set Commis  │                  │
│  │              │    │              │    │              │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Generate    │    │  Update      │    │  Update      │                  │
│  │  Slug        │    │  SEO Meta    │    │  Commission  │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └─────────┬─────────┘                   │                          │
│                   ▼                              │                          │
│          ┌──────────────┐                       │                          │
│          │   Database   │◄──────────────────────┘                          │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Algorithms

#### 1. Product Creation Algorithm

```
ALGORITHM: createProduct
INPUT: productData, bankId
OUTPUT: product record

BEGIN
    // Step 1: Validate bank
    bank ← query("SELECT * FROM banks WHERE id = $1", [bankId])
    IF bank does not exist
        RETURN error("Bank not found")
    END IF

    // Step 2: Validate required fields
    IF productData.name is empty OR productData.card_type is empty
        RETURN error("Product name and card type are required")
    END IF

    // Step 3: Generate slug
    slug ← productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + randomString(8)

    // Step 4: Upload images if provided
    IF productData.banner_image
        bannerKey ← uploadToS3(productData.banner_image, `products/${slug}/banner`)
    END IF

    IF productData.card_image
        cardKey ← uploadToS3(productData.card_image, `products/${slug}/card`)
    END IF

    // Step 5: Create product record
    product ← query("INSERT INTO products 
                    (bank_id, name, card_type, slug, banner_image, card_image, 
                     annual_fee, joining_fee, interest_rate, rewards, cashback, 
                     features, eligibility_criteria, documents_required, benefits, 
                     is_active, public_visibility, partner_visibility) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
                    RETURNING *", 
                   [bankId, productData.name, productData.card_type, slug, 
                    bannerKey, cardKey, productData.annual_fee, productData.joining_fee, 
                    productData.interest_rate, productData.rewards, productData.cashback, 
                    JSON.stringify(productData.features), JSON.stringify(productData.eligibility_criteria), 
                    JSON.stringify(productData.documents_required), productData.benefits, 
                    true, true, true])

    // Step 6: Create commission structure if provided
    IF productData.commission_structure
        query("INSERT INTO commission_structures (product_id, commission_rate, commission_type, tiers) 
              VALUES ($1, $2, $3, $4)", 
              [product.id, productData.commission_rate, productData.commission_type, 
               JSON.stringify(productData.commission_tiers)])
    END IF

    // Step 7: Return success
    RETURN success(product)
END
```

#### 2. Product Update Algorithm

```
ALGORITHM: updateProduct
INPUT: productId, productData
OUTPUT: updated product record

BEGIN
    // Step 1: Get product
    product ← query("SELECT * FROM products WHERE id = $1", [productId])
    IF product does not exist
        RETURN error("Product not found")
    END IF

    // Step 2: Update basic information
    query("UPDATE products 
          SET name = COALESCE($1, name), 
              card_type = COALESCE($2, card_type), 
              annual_fee = COALESCE($3, annual_fee), 
              joining_fee = COALESCE($4, joining_fee), 
              interest_rate = COALESCE($5, interest_rate), 
              rewards = COALESCE($6, rewards), 
              cashback = COALESCE($7, cashback), 
              benefits = COALESCE($8, benefits) 
          WHERE id = $9", 
          [productData.name, productData.card_type, productData.annual_fee, 
           productData.joining_fee, productData.interest_rate, productData.rewards, 
           productData.cashback, productData.benefits, productId])

    // Step 3: Update features if provided
    IF productData.features
        query("UPDATE products SET features = $1 WHERE id = $2", 
              [JSON.stringify(productData.features), productId])
    END IF

    // Step 4: Update eligibility criteria if provided
    IF productData.eligibility_criteria
        query("UPDATE products SET eligibility_criteria = $1 WHERE id = $2", 
              [JSON.stringify(productData.eligibility_criteria), productId])
    END IF

    // Step 5: Update images if provided
    IF productData.banner_image
        bannerKey ← uploadToS3(productData.banner_image, `products/${product.slug}/banner`)
        query("UPDATE products SET banner_image = $1 WHERE id = $2", [bannerKey, productId])
    END IF

    // Step 6: Update commission structure if provided
    IF productData.commission_structure
        query("UPDATE commission_structures 
              SET commission_rate = $1, commission_type = $2, tiers = $3 
              WHERE product_id = $4", 
              [productData.commission_rate, productData.commission_type, 
               JSON.stringify(productData.commission_tiers), productId])
    END IF

    // Step 7: Return updated product
    updatedProduct ← query("SELECT * FROM products WHERE id = $1", [productId])
    RETURN success(updatedProduct)
END
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| POST | `/api/v1/products` | Create product | Admin |
| GET | `/api/v1/products` | List products | No |
| GET | `/api/v1/products/:id` | Get product details | No |
| PUT | `/api/v1/products/:id` | Update product | Admin |
| DELETE | `/api/v1/products/:id` | Delete product | Admin |
| POST | `/api/v1/products/:id/features` | Add product features | Admin |
| POST | `/api/v1/products/:id/documents` | Add product documents | Admin |
| GET | `/api/v1/products/:slug` | Get product by slug | No |

---

## Notifications Module

### Module Overview
The notifications module handles user notifications, notification preferences, templates, and delivery via email, SMS, and in-app notifications.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Notifications Module                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Create     │    │   Send       │    │   Mark as    │                  │
│  │ Notification │    │  Notification│    │    Read      │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Determine   │    │  Check       │    │  Update      │                  │
│  │  Recipients  │    │  Preferences │    │  Status      │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Use         │    │  Send via    │    │  Return      │                  │
│  │  Template    │    │  Channels    │    │  Success     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Email       │    │  SMS         │    │  In-App      │                  │
│  │  (SES)       │    │  (MSG91)     │    │  (Database)  │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └─────────┬─────────┘                   │                          │
│                   ▼                              │                          │
│          ┌──────────────┐                       │                          │
│          │   Database   │◄──────────────────────┘                          │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Algorithms

#### 1. Send Notification Algorithm

```
ALGORITHM: sendNotification
INPUT: recipientId, type, title, message, metadata
OUTPUT: notification record

BEGIN
    // Step 1: Determine recipient type
    IF recipientId starts with 'PARTNER-'
        recipientType ← 'partner'
        partnerId ← extractId(recipientId)
    ELSE IF recipientId starts with 'USER-'
        recipientType ← 'user'
        userId ← extractId(recipientId)
    ELSE IF recipientId = 'ADMIN' OR recipientId = 'SUPER_ADMIN'
        recipientType ← 'admin'
    END IF

    // Step 2: Get notification preferences
    preferences ← query("SELECT * FROM notification_preferences WHERE user_id = $1", [userId || partnerId])
    
    IF preferences does not exist
        preferences ← {email_enabled: true, push_enabled: true, sms_enabled: false}
    END IF

    // Step 3: Create notification record
    notification ← query("INSERT INTO notifications (recipient_id, recipient_type, type, title, message, metadata, status) 
                        VALUES ($1, $2, $3, $4, $5, $6, 'unread') RETURNING *", 
                       [recipientId, recipientType, type, title, message, JSON.stringify(metadata)])

    // Step 4: Send via enabled channels
    IF preferences.email_enabled AND type in preferences.email_types
        sendEmail(recipientEmail, title, message)
    END IF

    IF preferences.sms_enabled AND type in preferences.sms_types
        sendSms(recipientMobile, message)
    END IF

    IF preferences.push_enabled
        // Send push notification (implementation depends on push service)
    END IF

    // Step 5: Return success
    RETURN success(notification)
END
```

#### 2. Broadcast Notification Algorithm

```
ALGORITHM: broadcastNotification
INPUT: targetRole, type, title, message, metadata
OUTPUT: broadcast record

BEGIN
    // Step 1: Get target users
    IF targetRole = 'ALL'
        users ← query("SELECT id, email, mobile FROM users WHERE status = 'active'")
    ELSE
        users ← query("SELECT id, email, mobile FROM users WHERE role = $1 AND status = 'active'", [targetRole])
    END IF

    // Step 2: Create broadcast record
    broadcast ← query("INSERT INTO broadcast_notifications (target_role, type, title, message, metadata, status) 
                      VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *", 
                     [targetRole, type, title, message, JSON.stringify(metadata)])

    // Step 3: Queue notifications for all users
    FOR EACH user IN users
        query("INSERT INTO notifications (recipient_id, recipient_type, type, title, message, metadata, broadcast_id, status) 
              VALUES ($1, 'user', $2, $3, $4, $5, $6, 'unread')", 
              [user.id, type, title, message, JSON.stringify(metadata), broadcast.id])
    END FOR

    // Step 4: Update broadcast status
    query("UPDATE broadcast_notifications SET status = 'sent', sent_at = NOW() WHERE id = $1", [broadcast.id])

    // Step 5: Return success
    RETURN success({broadcastId: broadcast.id, recipientCount: users.length})
END
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| GET | `/api/v1/notifications` | Get user notifications | Yes |
| PUT | `/api/v1/notifications/:id/read` | Mark notification as read | Yes |
| PUT | `/api/v1/notifications/read-all` | Mark all as read | Yes |
| POST | `/api/v1/notifications/send` | Send notification | Admin |
| POST | `/api/v1/notifications/broadcast` | Broadcast notification | Admin |
| GET | `/api/v1/notifications/preferences` | Get notification preferences | Yes |
| PUT | `/api/v1/notifications/preferences` | Update notification preferences | Yes |

---

## Team Management Module

### Module Overview
The team management module handles partner team creation, member management, team commissions, and team performance tracking.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Team Management Module                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Create     │    │   Add        │    │   Remove     │                  │
│  │    Team      │    │   Member     │    │   Member     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Assign      │    │  Set         │    │  Update      │                  │
│  │  Leader      │    │  Role        │    │  Hierarchy   │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Track       │    │  Calculate   │    │  Set         │                  │
│  │  Performance │    │  Team Comm   │    │  Goals       │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Generate    │    │  Distribute  │    │  Monitor     │                  │
│  │  Reports     │    │  Commissions │    │  Progress    │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └─────────┬─────────┘                   │                          │
│                   ▼                              │                          │
│          ┌──────────────┐                       │                          │
│          │   Database   │◄──────────────────────┘                          │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Algorithms

#### 1. Create Team Algorithm

```
ALGORITHM: createTeam
INPUT: teamName, teamLeaderId, description
OUTPUT: team record

BEGIN
    // Step 1: Validate team leader
    leader ← query("SELECT * FROM partner_profiles WHERE id = $1", [teamLeaderId])
    IF leader does not exist
        RETURN error("Team leader not found")
    END IF

    // Step 2: Check if leader can create team
    IF leader.can_create_team = false
        RETURN error("Team leader cannot create teams")
    END IF

    // Step 3: Create team record
    team ← query("INSERT INTO partner_teams (team_name, team_leader_id, description) 
                  VALUES ($1, $2, $3) RETURNING *", 
                 [teamName, teamLeaderId, description])

    // Step 4: Add leader as team member
    query("INSERT INTO partner_team_relationships (parent_partner_id, child_partner_id, level, status) 
          VALUES ($1, $1, 0, 'active')", [teamLeaderId])

    // Step 5: Create team commission structure
    query("INSERT INTO team_commissions (team_id, partner_id, commission_type, status) 
          VALUES ($1, $2, 'team_bonus', 'active')", [team.id, teamLeaderId])

    // Step 6: Return success
    RETURN success(team)
END
```

#### 2. Add Team Member Algorithm

```
ALGORITHM: addTeamMember
INPUT: teamId, partnerId, role
OUTPUT: team relationship record

BEGIN
    // Step 1: Validate team
    team ← query("SELECT * FROM partner_teams WHERE id = $1", [teamId])
    IF team does not exist
        RETURN error("Team not found")
    END IF

    // Step 2: Validate partner
    partner ← query("SELECT * FROM partner_profiles WHERE id = $1", [partnerId])
    IF partner does not exist
        RETURN error("Partner not found")
    END IF

    // Step 3: Check if partner is already in a team
    existingTeam ← query("SELECT ptr.team_id FROM partner_team_relationships ptr 
                          JOIN partner_teams pt ON pt.id = ptr.team_id 
                          WHERE ptr.child_partner_id = $1", [partnerId])
    IF existingTeam exists
        RETURN error("Partner is already in a team")
    END IF

    // Step 4: Calculate level (distance from team leader)
    level ← 1 // Default to level 1 (direct member)

    // Step 5: Create team relationship
    relationship ← query("INSERT INTO partner_team_relationships 
                         (parent_partner_id, child_partner_id, team_id, level, status) 
                         VALUES ($1, $2, $3, $4, 'active') RETURNING *", 
                        [team.team_leader_id, partnerId, teamId, level])

    // Step 6: Create team commission record
    query("INSERT INTO team_commissions (team_id, partner_id, commission_type, status) 
          VALUES ($1, $2, 'team_member', 'active')", [teamId, partnerId])

    // Step 7: Log team activity
    query("INSERT INTO team_activity (team_id, partner_id, activity_type, description) 
          VALUES ($1, $2, 'MEMBER_ADDED', 'Partner added to team')", 
         [teamId, partnerId])

    // Step 8: Notify team leader
    notify(team.team_leader_id, "TEAM_MEMBER_ADDED", `New member added to your team`)

    // Step 9: Return success
    RETURN success(relationship)
END
```

#### 3. Process Team Override Commission Algorithm

```
PROCESS: processTeamOverrideCommission
INPUT: applicationId, partnerId
OUTPUT: commission distribution result

BEGIN
    // Step 1: Get application details
    application ← query("SELECT * FROM applications WHERE id = $1", [applicationId])
    IF application does not exist
        RETURN error("Application not found")
    END IF

    // Step 2: Get partner's team hierarchy
    teamHierarchy ← query("WITH RECURSIVE team_tree AS (
                            SELECT parent_partner_id, child_partner_id, level, 1 as path_length
                            FROM partner_team_relationships
                            WHERE child_partner_id = $1
                            UNION ALL
                            SELECT ptr.parent_partner_id, ptr.child_partner_id, ptr.level, tt.path_length + 1
                            FROM partner_team_relationships ptr
                            JOIN team_tree tt ON ptr.child_partner_id = tt.parent_partner_id
                            WHERE ptr.level > tt.level
                          )
                          SELECT * FROM team_tree ORDER BY level ASC", [partnerId])

    // Step 3: Calculate commission distribution
    totalCommission ← application.commission_amount
    distribution ← []

    FOR EACH member IN teamHierarchy
        // Step 4: Calculate commission share based on level
        IF member.level = 0
            share ← totalCommission * 0.70 // 70% to direct sponsor
        ELSE IF member.level = 1
            share ← totalCommission * 0.20 // 20% to level 1
        ELSE
            share ← totalCommission * 0.10 // 10% to higher levels
        END IF

        // Step 5: Credit commission to team member
        creditCommission(member.child_partner_id, share, 'team_override', applicationId, {
            application_id: applicationId,
            level: member.level
        })

        distribution.push({
            partnerId: member.child_partner_id,
            level: member.level,
            share: share
        })
    END FOR

    // Step 6: Log team commission
    query("INSERT INTO team_commissions (team_id, partner_id, commission_amount, commission_type, status) 
          VALUES ($1, $2, $3, 'override', 'completed')", 
         [teamId, partnerId, totalCommission])

    // Step 7: Return distribution result
    RETURN success({distribution, totalCommission})
END
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| POST | `/api/v1/teams` | Create team | Yes |
| GET | `/api/v1/teams` | List teams | Yes |
| GET | `/api/v1/teams/:id` | Get team details | Yes |
| POST | `/api/v1/teams/:id/members` | Add team member | Yes |
| DELETE | `/api/v1/teams/:id/members/:memberId` | Remove team member | Yes |
| GET | `/api/v1/teams/:id/commissions` | Get team commissions | Yes |
| POST | `/api/v1/teams/:id/goals` | Set team goals | Yes |
| GET | `/api/v1/teams/:id/performance` | Get team performance | Yes |

---

## Commission Engine

### Module Overview
The commission engine handles commission calculation, distribution, hold/release mechanisms, and multi-level commission processing.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Commission Engine                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Calculate  │    │   Credit     │    │   Hold       │                  │
│  │ Commission   │    │ Commission  │    │ Commission   │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Get Product│    │  Check       │    │  Set Hold    │                  │
│  │  Commission  │    │  Duplicate   │    │  Period      │                  │
│  │  Structure  │    │              │    │              │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Apply       │    │  Debit/Credit│    │  Schedule    │                  │
│  │  Tiers       │    │  Wallet      │    │  Release     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Calculate   │    │  Update      │    │  Auto        │                  │
│  │  Final Amount│    │  Ledger      │    │  Release     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └─────────┬─────────┘                   │                          │
│                   ▼                              │                          │
│          ┌──────────────┐                       │                          │
│          │   Database   │◄──────────────────────┘                          │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Algorithms

#### 1. Calculate Commission Algorithm

```
ALGORITHM: calculatePartnerCommission
INPUT: partnerId, productId, loanAmount
OUTPUT: commission amount

BEGIN
    // Step 1: Get product commission structure
    commissionStructure ← query("SELECT * FROM commission_structures WHERE product_id = $1", [productId])
    
    IF commissionStructure does not exist
        RETURN 0 // No commission structure defined
    END IF

    // Step 2: Get partner level/rank
    partner ← query("SELECT rank FROM partner_profiles WHERE id = $1", [partnerId])
    
    // Step 3: Apply commission based on structure type
    IF commissionStructure.commission_type = 'percentage'
        // Step 4a: Percentage-based commission
        baseCommission ← loanAmount * (commissionStructure.commission_rate / 100)
        
        // Step 5a: Apply rank multiplier if applicable
        IF partner.rank = 'GOLD'
            baseCommission ← baseCommission * 1.2
        ELSE IF partner.rank = 'SILVER'
            baseCommission ← baseCommission * 1.1
        END IF
        
    ELSE IF commissionStructure.commission_type = 'fixed'
        // Step 4b: Fixed amount commission
        baseCommission ← commissionStructure.commission_rate
        
    ELSE IF commissionStructure.commission_type = 'tiered'
        // Step 4c: Tiered commission
        tiers ← JSON.parse(commissionStructure.tiers)
        baseCommission ← 0
        
        FOR EACH tier IN tiers
            IF loanAmount >= tier.min_amount AND loanAmount < tier.max_amount
                baseCommission ← loanAmount * (tier.rate / 100)
                BREAK
            END IF
        END FOR
    END IF

    // Step 6: Apply partner-specific override if exists
    partnerOverride ← query("SELECT commission_rate FROM partner_commission_overrides 
                             WHERE partner_id = $1 AND product_id = $2", 
                            [partnerId, productId])
    IF partnerOverride exists
        baseCommission ← loanAmount * (partnerOverride.commission_rate / 100)
    END IF

    // Step 7: Round to 2 decimal places
    finalCommission ← ROUND(baseCommission, 2)

    // Step 8: Return commission
    RETURN finalCommission
END
```

#### 2. Hold Commission Algorithm

```
ALGORITHM: holdCommission
INPUT: partnerId, amount, referenceId, metadata
OUTPUT: hold record

BEGIN
    // Step 1: Ensure wallet exists
    wallet ← ensureWallet(partnerId)

    // Step 2: Calculate hold period
    holdHours ← process.env.COMMISSION_CREDIT_HOLD_HOURS || 48
    releaseAt ← NOW() + INTERVAL '${holdHours} hours'

    // Step 3: Start transaction
    client ← getClient()
    await client.query('BEGIN')

    TRY
        // Step 4: Insert commission ledger record with hold status
        ledger ← client.query("INSERT INTO commission_ledger 
                              (partner_id, amount, commission_type, reference_id, metadata, status, release_at) 
                              VALUES ($1, $2, 'commission', $3, $4, 'hold', $5) 
                              RETURNING *", 
                             [partnerId, amount, referenceId, JSON.stringify(metadata), releaseAt])

        // Step 5: Add to wallet hold balance
        client.query("UPDATE partner_wallets SET hold_balance = hold_balance + $1 WHERE partner_id = $2", 
                    [amount, partnerId])

        // Step 6: Schedule release job
        client.query("INSERT INTO commission_release_jobs (commission_ledger_id, scheduled_at, status) 
                     VALUES ($1, $2, 'pending')", 
                    [ledger.id, releaseAt])

        // Step 7: Commit transaction
        await client.query('COMMIT')

        // Step 8: Return success
        RETURN success(ledger)
    CATCH error
        await client.query('ROLLBACK')
        RETURN error("Failed to hold commission")
    END TRY
END
```

#### 3. Release Commission Algorithm

```
ALGORITHM: releaseCommission
INPUT: ledgerId
OUTPUT: release result

BEGIN
    // Step 1: Get commission ledger record
    ledger ← query("SELECT * FROM commission_ledger WHERE id = $1 AND status = 'hold'", [ledgerId])
    IF ledger does not exist
        RETURN error("Commission ledger not found or already released")
    END IF

    // Step 2: Check if release time has arrived
    IF ledger.release_at > NOW()
        RETURN error("Commission not yet eligible for release")
    END IF

    // Step 3: Start transaction
    client ← getClient()
    await client.query('BEGIN')

    TRY
        // Step 4: Move from hold to available balance
        client.query("UPDATE partner_wallets 
                     SET hold_balance = hold_balance - $1, 
                         available_balance = available_balance + $1 
                     WHERE partner_id = $2", 
                    [ledger.amount, ledger.partner_id])

        // Step 5: Update commission ledger status
        client.query("UPDATE commission_ledger SET status = 'released', released_at = NOW() WHERE id = $1", 
                    [ledgerId])

        // Step 6: Create transaction record
        client.query("INSERT INTO wallet_transactions 
                     (partner_id, transaction_type, credit, debit, balance_after, reference_id, status) 
                     VALUES ($1, 'commission_release', $2, 0, 
                      (SELECT available_balance FROM partner_wallets WHERE partner_id = $1) + $2, 
                      $3, 'completed')", 
                    [ledger.partner_id, ledger.amount, ledger.id])

        // Step 7: Update release job status
        client.query("UPDATE commission_release_jobs SET status = 'completed', processed_at = NOW() 
                     WHERE commission_ledger_id = $1", [ledgerId]*)

        // Step 8: Commit transaction
        await client.query('COMMIT')

        // Step 9: Notify partner
        notify(ledger.partner_id, "COMMISSION_RELEASED", `Commission of ${ledger.amount} has been released`)

        // Step 10: Return success
        RETURN success({message: "Commission released successfully"})
    CATCH error
        await client.query('ROLLBACK')
        RETURN error("Failed to release commission")
    END TRY
END
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| GET | `/api/v1/commission/ledger` | Get commission ledger | Yes |
| GET | `/api/v1/commission/rules` | Get commission rules | Admin |
| POST | `/api/v1/commission/rules` | Create commission rule | Admin |
| PUT | `/api/v1/commission/rules/:id` | Update commission rule | Admin |
| POST | `/api/v1/commission/manual-release` | Manual commission release | Admin |
| POST | `/api/v1/commission/manual-reject` | Manual commission reject | Admin |

---

## Admin/Super-Admin Module

### Module Overview
The admin module handles administrative functions including user management, bank management, system settings, audit logging, and analytics.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Admin/Super-Admin Module                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   User       │    │   Bank       │    │   System     │                  │
│  │ Management  │    │ Management  │    │   Settings   │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Create/     │    │  Add/Update  │    │  Update     │                  │
│  │  Update User │    │  Bank Details│    │  Config     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Assign      │    │  Assign      │    │  Generate   │                  │
│  │  Roles       │    │  Banks       │    │  Reports    │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Audit       │    │  Analytics   │    │  Monitor    │                  │
│  │  Logging     │    │  Dashboard   │    │  System      │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └─────────┬─────────┘                   │                          │
│                   ▼                              │                          │
│          ┌──────────────┐                       │                          │
│          │   Database   │◄──────────────────────┘                          │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Algorithms

#### 1. User Creation Algorithm

```
ALGORITHM: createUser
INPUT: userData, role
OUTPUT: user record

BEGIN
    // Step 1: Validate input
    IF userData.email is empty OR userData.mobile is empty
        RETURN error("Email and mobile are required")
    END IF

    // Step 2: Check for existing user
    existing ← query("SELECT id FROM users WHERE email = $1 OR mobile = $2", [userData.email, userData.mobile])
    IF existing exists
        RETURN error("User already exists")
    END IF

    // Step 3: Generate temporary password
    tempPassword ← generateRandomPassword()

    // Step 4: Hash password
    hashedPassword ← bcrypt.hash(tempPassword, 10)

    // Step 5: Create user record
    user ← query("INSERT INTO users (email, mobile, password_hash, role, full_name, department, designation, status) 
                  VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') RETURNING *", 
                 [userData.email, userData.mobile, hashedPassword, role, userData.full_name, 
                  userData.department, userData.designation])

    // Step 6: Create partner profile if role is PARTNER
    IF role = 'PARTNER'
        partnerCode ← generatePartnerCode()
        query("INSERT INTO partner_profiles (user_id, partner_code, first_name, last_name, kyc_status) 
              VALUES ($1, $2, $3, $4, 'pending')", 
              [user.id, partnerCode, userData.full_name, ""])
        
        ensureWallet(partnerId)
    END IF

    // Step 7: Send welcome email with temporary password
    sendEmail(userData.email, "Welcome to GharKaPaisa Admin", 
              `Your account has been created. Temporary password: ${tempPassword}`)

    // Step 8: Log action
    logAction(request.user.id, "USER_CREATED", `Created user ${user.email} with role ${role}`)

    // Step 9: Return success (without password)
    user.password_hash ← undefined
    RETURN success(user)
END
```

#### 2. Bank Assignment Algorithm

```
ALGORITHM: assignBankToAdmin
INPUT: adminId, bankId, assignmentType
OUTPUT: assignment record

BEGIN
    // Step 1: Validate admin
    admin ← query("SELECT * FROM users WHERE id = $1 AND role IN ('ADMIN', 'SUPER_ADMIN')", [adminId])
    IF admin does not exist
        RETURN error("Admin not found")
    END IF

    // Step 2: Validate bank
    bank ← query("SELECT * FROM banks WHERE id = $1", [bankId])
    IF bank does not exist
        RETURN error("Bank not found")
    END IF

    // Step 3: Check for existing assignment
    existing ← query("SELECT * FROM admin_bank_assignments 
                      WHERE admin_id = $1 AND bank_id = $2 AND assignment_type = $3", 
                     [adminId, bankId, assignmentType])
    IF existing exists
        RETURN success({message: "Assignment already exists", assignment: existing})
    END IF

    // Step 4: Create assignment
    assignment ← query("INSERT INTO admin_bank_assignments (admin_id, bank_id, assignment_type) 
                       VALUES ($1, $2, $3) RETURNING *", 
                      [adminId, bankId, assignmentType])

    // Step 5: Log action
    logAction(adminId, "BANK_ASSIGNED", `Bank ${bank.name} assigned to admin`)

    // Step 6: Return success
    RETURN success(assignment)
END
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| POST | `/api/v1/admin/users` | Create user | Super-Admin |
| GET | `/api/v1/admin/users` | List users | Super-Admin |
| PUT | `/api/v1/admin/users/:id` | Update user | Super-Admin |
| DELETE | `/api/v1/admin/users/:id` | Delete user | Super-Admin |
| POST | `/api/v1/admin/banks` | Add bank | Super-Admin |
| GET | `/api/v1/admin/banks` | List banks | Admin |
| PUT | `/api/v1/admin/banks/:id` | Update bank | Super-Admin |
| POST | `/api/v1/admin/assign-bank` | Assign bank to admin | Super-Admin |
| GET | `/api/v1/admin/analytics` | Get analytics | Admin |
| GET | `/api/v1/admin/audit-logs` | Get audit logs | Super-Admin |
| PUT | `/api/v1/admin/settings` | Update system settings | Super-Admin |

---

## Payment Module

### Module Overview
The payment module handles payment processing using Razorpay for withdrawals and other financial transactions.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Payment Module                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Create     │    │   Verify     │    │   Handle     │    │
│  │   Order      │    │   Payment    │    │   Webhook    │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Call        │    │  Verify      │    │  Validate    │                  │
│  │  Razorpay    │    │  Signature   │    │  Webhook     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Return      │    │  Update Order│    │  Process     │                  │
│  │  Order ID    │    │  Status      │    │  Event       │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Store       │    │  Trigger     │    │  Update      │                  │
│  │  Order Data  │    │  Callbacks   │    │  Database    │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └─────────┬─────────┘                   │                          │
│                   ▼                              │                          │
│          ┌──────────────┐                       │                          │
│          │   Database   │◄──────────────────────┘                          │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Algorithms

#### 1. Create Order Algorithm

```
ALGORITHM: createOrder
INPUT: amount, currency, receipt
OUTPUT: Razorpay order

BEGIN
    // Step 1: Validate amount
    IF amount <= 0
        RETURN error("Amount must be positive")
    END IF

    // Step 2: Create Razorpay order
    razorpayOrder ← razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency: currency || "INR",
        receipt: receipt || "order_" + Date.now(),
        notes: {
            created_by: request.user.id
        }
    })

    // Step 3: Store order in database
    query("INSERT INTO payment_orders (order_id, amount, currency, receipt, status, created_by) 
          VALUES ($1, $2, $3, $4, 'created', $5)", 
         [razorpayOrder.id, amount, currency, receipt, request.user.id])

    // Step 4: Return order details
    RETURN success({
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
    })
END
```

#### 2. Verify Payment Algorithm

```
ALGORITHM: verifyPayment
INPUT: orderId, razorpayPaymentId, razorpaySignature
OUTPUT: verification result

BEGIN
    // Step 1: Get order from database
    order ← query("SELECT * FROM payment_orders WHERE order_id = $1", [orderId])
    IF order does not exist
        RETURN error("Order not found")
    END IF

    // Step 2: Verify signature
    generatedSignature ← crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(orderId + "|" + razorpayPaymentId)
        .digest('hex')

    IF generatedSignature != razorpaySignature
        RETURN error("Invalid signature")
    END IF

    // Step 3: Fetch payment details from Razorpay
    payment ← razorpay.payments.fetch(razorpayPaymentId)

    // Step 4: Verify payment amount
    IF payment.amount != order.amount * 100
        RETURN error("Payment amount mismatch")
    END IF

    // Step 5: Update order status
    query("UPDATE payment_orders SET status = 'paid', payment_id = $1, verified_at = NOW() WHERE order_id = $2", 
          [razorpayPaymentId, orderId])

    // Step 6: Process payment based on context
    IF order.context_type = 'wallet_topup'
        // Credit wallet
        creditCommission(order.partner_id, order.amount, 'wallet_topup', orderId, {
            payment_id: razorpayPaymentId
        })
    END IF

    // Step 7: Return success
    RETURN success({message: "Payment verified successfully", payment})
END
```

#### 3. Handle Razorpay Webhook Algorithm

```
ALGORITHM: handleRazorpayWebhook
INPUT: webhookEvent
OUTPUT: processing result

BEGIN
    // Step 1: Verify webhook signature
    webhookSecret ← process.env.RAZORPAY_WEBHOOK_SECRET
    signature ← request.headers['x-razorpay-signature']
    
    expectedSignature ← crypto.createHmac('sha256', webhookSecret)
        .update(request.rawBody)
        .digest('hex')

    IF signature != expectedSignature
        RETURN error("Invalid webhook signature")
    END IF

    // Step 2: Parse webhook event
    event ← JSON.parse(request.body)

    // Step 3: Handle event based on type
    IF event.event = 'payment.captured'
        // Step 4a: Process captured payment
        paymentId ← event.payload.payment.entity.id
        orderId ← event.payload.payment.entity.order_id
        
        // Update order status
        query("UPDATE payment_orders SET status = 'captured', payment_id = $1 WHERE order_id = $2", 
              [paymentId, orderId])

    ELSE IF event.event = 'payment.failed'
        // Step 4b: Process failed payment
        paymentId ← event.payload.payment.entity.id
        orderId ← event.payload.payment.entity.order_id
        
        // Update order status
        query("UPDATE payment_orders SET status = 'failed', payment_id = $1 WHERE order_id = $2", 
              [paymentId, orderId])

    ELSE IF event.event = 'payout.processed'
        // Step 4c: Process payout
        payoutId ← event.payload.payout.entity.id
        withdrawalId ← event.payload.payout.entity.notes.withdrawal_id
        
        // Update withdrawal status
        query("UPDATE wallet_withdrawals SET status = 'processed', razorpay_payout_id = $1 WHERE id = $2", 
              [payoutId, withdrawalId])

    ELSE IF event.event = 'processed'
        // Step 4d: Process withdrawal
        payoutId ← event.payload.payout.entity.id
        withdrawalId ← event.payload.payout.entity.notes.withdrawal_id
        
        // Update withdrawal status
        query("UPDATE wallet_withdrawals SET status = 'processed', razorpay_payout_id = $1 WHERE id = $2", 
              [payoutId, withdrawalId])
    END IF

    // Step 5: Return success
    RETURN success({message: "Webhook processed successfully"})
END
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| POST | `/api/v1/payment/create-order` | Create Razorpay order | Yes |
| POST | `/api/v1/payment/verify-payment` | Verify payment | Yes |
| POST | `/api/v1/razorpay/webhook` | Razorpay webhook handler | No |

---

## Banks Module

### Module Overview
The banks module manages bank information, bank products, and bank-product requirements.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Banks Module                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Add Bank   │    │ Update Bank  │    │ Delete Bank  │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Upload Logo │    │  Update      │    │  Mark as    │                  │
│  │              │    │  Details     │    │  Inactive    │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Set        │    │  Add Product │    │  Set        │                  │
│  │  Commission  │    │  Requirements│    │  SEO Meta    │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Generate    │    │  Validate    │    │  Update      │                  │
│  │  Bank Code   │    │  Data        │    │  Status      │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └─────────┬─────────┘                   │                          │
│                   ▼                              │                          │
│          ┌──────────────┐                       │                          │
│          │   Database   │◄──────────────────────┘                          │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Algorithms

#### 1. Add Bank Algorithm

```
ALGORITHM: addBank
INPUT: bankData
OUTPUT: bank record

BEGIN
    // Step 1: Validate required fields
    IF bankData.name is empty OR bankData.short_code is empty
        RETURN error("Bank name and short code are required")
    END IF

    // Step 2: Check for duplicate short code
    existing ← query("SELECT id FROM banks WHERE short_code = $1", [bankData.short_code])
    IF existing exists
        RETURN error("Bank short code already exists")
    END IF

    // Step 3: Upload logo if provided
    IF bankData.logo
        logoKey ← uploadToS3(bankData.logo, `banks/${bankData.short_code}/logo`)
    END IF

    // Step 4: Create bank record
    bank ← query("INSERT INTO banks 
                  (name, short_code, logo, website_url, commission_rate, is_active, 
                   display_order, seo_title, seo_description, seo_keywords) 
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *", 
                 [bankData.name, bankData.short_code, logoKey, bankData.website_url, 
                  bankData.commission_rate, true, 0, bankData.seo_title, 
                  bankData.seo_description, bankData.seo_keywords])

    // Step 5: Return success
    RETURN success(bank)
END
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| POST | `/api/v1/banks` | Add bank | Admin |
| GET | `/api/v1/banks` | List banks | No |
| GET | `/api/v1/banks/:id` | Get bank details | No |
| PUT | `/api/v1/banks/:id` | Update bank | Admin |
| DELETE | `/api/v1/banks/:id` | Delete bank | Super-Admin |

---

## Support Module

### Module Overview
The support module handles customer support tickets, ticket management, and resolution tracking.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────�│
│                            Support Module                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ Create Ticket│    │ Update Ticket │    │ Close Ticket │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ Assign       │    │ Add Reply    │    │  Generate   │                  │
│  │  Agent       │    │              │    │  Resolution │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ Track        │    │  Escalate    │    │  Notify     │                  │
│  │ Status       │    │  Ticket      │    │  Customer   │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Generate    │    │  Update      │    │  Archive     │                  │
│  │  Reports     │    │  Priority     │    │  Ticket      │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └─────────┬─────────┘                   │                          │
│                   ▼                              │                          │
│          ┌──────────────┐                       │                          │
│          │   Database   │◄──────────────────────┘                          │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| POST | `/api/v1/support/tickets` | Create support ticket | Yes |
| GET | `/api/v1/support/tickets` | List tickets | Yes |
| GET | `/api/v1/support/tickets/:id` | Get ticket details | Yes |
| PUT | `/api/v1/support/tickets/:id` | Update ticket | Admin |
| POST | `/api/v1/support/tickets/:id/reply` | Add reply to ticket | Yes |

---

## Reports Module

### Module Overview
The reports module handles report generation, scheduling, and export functionality for various business metrics.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Reports Module                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ Generate     │    │ Schedule     │    │ Export      │                  │
│  │ Report       │    │ Report       │    │ Report      │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Query       │    │  Set Cron    │    │  Convert to │                  │
│  │  Database    │    │  Job         │    │  Excel/PDF   │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Apply       │    │  Store       │    │  Upload to  │                  │
│  │  Filters     │    │  Schedule    │    │  S3          │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Calculate   │    │  Auto-       │    │  Generate   │                  │
│  │  Metrics     │    │  Generate    │    │  Download    │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └─────────┬─────────┘                   │                          │
│                   ▼                              │                          │
│          ┌──────────────┐                       │                          │
│          │   Database   │◄──────────────────────┘                          │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| POST | `/api/v1/reports/generate` | Generate report | Admin |
| GET | `/api/v1/reports/:id` | Get report | Admin |
| POST | `/api/v1/reports/schedule` | Schedule report | Admin |
| GET | `/api/v1/reports/scheduled` | List scheduled reports | Admin |
| GET | `/api/v1/reports/exports` | Get report exports | Admin |

---

## Analytics Module

### Module Overview
The analytics module provides dashboard analytics, metrics calculation, and business intelligence data.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Analytics Module                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ Dashboard    │    │  Metrics     │    │  Trends      │                  │
│  │  Analytics   │    │  Calculation │    │  Analysis    │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Aggregate   │    │  Calculate   │    │  Compare     │                  │
│  │  Data        │    │  KPIs        │    │  Periods     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Apply       │    │  Generate    │    │  Create      │                  │
│  │  Time Filters│    │  Charts      │    │  Insights    │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Cache       │    │  Return      │    │  Store       │                  │
│  │  Results     │    │  JSON Data   │    │  History     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └─────────┬─────────┘                   │                          │
│                   ▼                              │                          │
│          ┌──────────────┐                       │                          │
│          │   Database   │◄──────────────────────┘                          │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| GET | `/api/v1/analytics/dashboard` | Get dashboard analytics | Admin |
| GET | `/api/v1/analytics/partners` | Get partner analytics | Admin |
| GET | `/api/v1/analytics/applications` | Get application analytics | Admin |
| GET | `/api/v1/analytics/commissions` | Get commission analytics | Admin |

---

## CMS Module

### Module Overview
The CMS module handles content management including banners, homepage sections, marketing materials, and service catalog.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CMS Module                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Banners    │    │ Homepage     │    │ Marketing   │                  │
│  │              │    │ Sections    │    │ Materials   │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Upload      │    │  Configure   │    │  Upload      │                  │
│  │  Images      │    │  Layout      │    │  Files       │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Set         │    │  Add/Remove  │    │  Categorize  │                  │
│  │  Display     │    │  Items       │    │  Content     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Set         │    │  Publish     │    │  Track       │                  │
│  │  Schedule    │    │  Changes     │    │  Engagement  │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └─────────┬─────────┘                   │                          │
│                   ▼                              │                          │
│          ┌──────────────┐                       │                          │
│          │   Database   │◄──────────────────────┘                          │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| POST | `/api/v1/cms/banners` | Create banner | Admin |
| GET | `/api/v1/cms/banners` | List banners | No |
| PUT | `/api/v1/cms/banners/:id` | Update banner | Admin |
| POST | `/api/v1/cms/homepage-sections` | Create homepage section | Admin |
| GET | `/api/v1/cms/homepage-sections` | List homepage sections | No |
| POST | `/api/v1/cms/marketing-materials` | Create marketing material | Admin |
| GET | `/api/v1/cms/marketing-materials` | List marketing materials | No |
| GET | `/api/v1/cms/services` | List services | No |

---

## Banner Module

### Module Overview
The banner module specifically manages promotional banners for the website and mobile app.

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| POST | `/api/v1/banners` | Create banner | Admin |
| GET | `/api/v1/banners` | List banners | No |
| PUT | `/api/v1/banners/:id` | Update banner | Admin |
| DELETE | `/api/v1/banners/:id` | Delete banner | Admin |

---

## Location Module

### Module Overview
The location module handles location-based services and geographic data.

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| GET | `/api/v1/location/states` | List states | No |
| GET | `/api/v1/location/cities` | List cities | No |

---

## Marketing Module

### Module Overview
The marketing module handles marketing campaigns, referral tracking, and promotional activities.

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| POST | `/api/v1/marketing/campaigns` | Create campaign | Admin |
| GET | `/api/v1/marketing/campaigns` | List campaigns | Admin |
| GET | `/api/v1/marketing/referral-clicks` | Track referral clicks | No |

---

## SBI Credit Card Module

### Module Overview
The SBI credit card module handles specific SBI credit card application processing and integration.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SBI Credit Card Module                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Submit     │    │   Track      │    │   Process    │                  │
│  │ Application  │    │   Status     │    │   VKYC       │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Validate    │    │  Update      │    │  Initiate    │                  │
│  │  Customer    │    │  Timeline    │    │  Video Call  │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Submit to   │    │  Sync with   │    │  Update      │                  │
│  │  SBI API     │    │  SBI System  │    │  Status      │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Track       │    │  Generate    │    │  Notify      │                  │
│  │  Application │    │  Reports     │    │  Customer    │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └─────────┬─────────┘                   │                          │
│                   ▼                              │                          │
│          ┌──────────────┐                       │                          │
│          │   Database   │◄──────────────────────┘                          │
│          └──────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|----------|----------------|
| POST | `/api/v1/sbi-credit-card/apply` | Submit SBI card application | Yes |
| GET | `/api/v1/sbi-credit-card/applications` | List SBI applications | Yes |
| GET | `/api/v1/sbi-credit-card/applications/:id` | Get SBI application details | Yes |
| PUT | `/api/v1/sbi-credit-card/applications/:id/status` | Update application status | Admin |

---

## Conclusion

This document provides a comprehensive overview of the GharKaPaisa project architecture and algorithms for each module. The system is designed with a modular architecture, clear separation of concerns, and robust error handling.

### Key Architectural Principles

1. **Modularity**: Each module is independent and can be developed/maintained separately
2. **Security**: JWT-based authentication, role-based access control, data encryption
3. **Scalability**: Database connection pooling, caching, async processing
4. **Maintainability**: Clear code structure, comprehensive logging, audit trails
5. **Performance**: Optimized queries, indexing, efficient data processing

### Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT, bcrypt
- **File Storage**: AWS S3
- **Email**: AWS SES
- **SMS**: MSG91
- **Payments**: Razorpay
- **Logging**: Winston
- **Frontend**: React, Vite
- **Mobile**: React Native

---

**Document Version**: 1.0.0  
**Last Updated**: August 25, 2026  
**Maintained By**: Development Team

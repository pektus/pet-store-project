# Slice 1: Customer Identity & Registration (`aidlc-docs/slices/slice-1-registration.md`)

> **AI-DLC Slice Lifecycle Phase:** `[P] PLAN & [A] ASK`  
> **Status:** `[V] VALIDATION GATE - PENDING HUMAN REVIEW`  
> **Slice Focus:** Customer Registration, Email Verification Token Flow, JWT Issuance, Angular 24 Signal Forms

---

## 1. Slice Overview & Scope

Slice 1 establishes the customer identity foundation for the Pet Store platform. It enables new customers to register for an account, validates credentials, enforces security rules, handles email verification tokens for account activation, and issues JWT bearer tokens for authenticated customer operations.

### Key Deliverables:
1. **Flyway Migration `V4__customer_registration_and_activation.sql`:**
   - Extend `app_users` table with `is_email_verified`, `verification_token`, `verification_token_expiry`, and `full_name`.
   - Update role check constraints to allow `ROLE_CUSTOMER`.
2. **Domain & Security Layer:**
   - Update `UserRole` enum with `ROLE_CUSTOMER`.
   - Update `AppUser` entity with verification fields.
   - Registration & Verification DTOs (`CustomerRegistrationRequest`, `VerifyEmailResponse`, `CustomerProfileDTO`).
3. **Service & Controller APIs:**
   - `POST /api/auth/register`: Validate input, hash password (BCrypt work factor 12), create inactive account (`enabled = false`, `is_email_verified = false`), generate 24-hour verification token.
   - `GET /api/auth/verify?token=...`: Validate token expiry, activate user (`enabled = true`, `is_email_verified = true`), clear token, return JWT token and customer profile.
   - `GET /api/customer/profile` & `PUT /api/customer/profile`: Protected customer profile management.
4. **Angular 24 Signal Forms Component:**
   - Standalone `CustomerRegistrationComponent` built **exclusively with Angular Signal Forms** (`model()`, signal-based field validation, zero `ReactiveFormsModule`).
   - Signal-first notification modal indicating activation email instructions.
   - Standalone `EmailVerificationComponent` to handle URL query parameter activation (`/verify?token=...`).
   - Integration into reactive `AuthStore` Signals (`currentUser`, `isAuthenticated`, `isCustomer`).

---

## 2. Slice Clarifications & Targeted Questions (For User Review)

> ✍️ **Instructions for User:** Please review the questions below. You can edit this file directly to add your input under `**User Answer / Decision:**`.

* **Q-S1.1: Verification Token Transport in Development / Testing:**  
  How should the verification token/link be communicated in local development (since an external SMTP mail relay may not be configured yet)?  
  - *Architect Recommendation:* In development/test mode, the registration API logs the activation link to the backend console and returns a debug `activationUrl` in the response payload (for easy testing in Postman/UI), while preparing an injectable `EmailService` interface for production SMTP.  
  - **User Answer / Decision:** `[Adopt recommendation / Specify changes]`

* **Q-S1.2: Verification Token Expiration Window:**  
  What is the preferred expiration window for the email activation token?  
  - *Architect Recommendation:* 24 hours. After 24 hours, expired tokens require the customer to request a new activation link via `POST /api/auth/resend-verification`.  
  - **User Answer / Decision:** `[Adopt recommendation / Specify changes]`

---

## 3. Technical Contract & API Specifications

### 3.1. REST Endpoints

#### `POST /api/auth/register` (Public)
**Request Body:**
```json
{
  "username": "johndoe",
  "email": "johndoe@example.com",
  "password": "Password123!",
  "fullName": "John Doe",
  "phone": "+1-555-0199"
}
```
**Response (201 Created):**
```json
{
  "message": "Registration successful. Please check your email to activate your account.",
  "email": "johndoe@example.com",
  "activationToken": "d4f3b2a1-..." // debug token in dev mode
}
```

#### `GET /api/auth/verify?token={token}` (Public)
**Response (200 OK):**
```json
{
  "message": "Account successfully activated.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 42,
    "username": "johndoe",
    "email": "johndoe@example.com",
    "fullName": "John Doe",
    "role": "ROLE_CUSTOMER"
  }
}
```

#### `GET /api/customer/profile` (Protected - `ROLE_CUSTOMER`)
**Response (200 OK):**
```json
{
  "id": 42,
  "username": "johndoe",
  "email": "johndoe@example.com",
  "fullName": "John Doe",
  "phone": "+1-555-0199",
  "isEmailVerified": true,
  "createdAt": "2026-10-05T12:00:00Z"
}
```

---

## 4. Angular 24 Signal Forms Implementation Plan

- **Exclusive Signal Forms Pattern:**
  ```typescript
  // Standalone Registration Component (Angular 24)
  export class CustomerRegistrationComponent {
    readonly username = signal('');
    readonly email = signal('');
    readonly password = signal('');
    readonly fullName = signal('');
    readonly phone = signal('');
    
    // Signal-based validations
    readonly isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email()));
    readonly isPasswordValid = computed(() => this.password().length >= 8);
    readonly isFormValid = computed(() => 
      this.username().trim().length >= 3 && 
      this.isEmailValid() && 
      this.isPasswordValid() &&
      this.fullName().trim().length > 0
    );
  }
  ```

---

## 5. Human Validation & Approval Gate

```
================================================================================
                         HUMAN APPROVAL GATE - SLICE 1 [V]
================================================================================
 Current State: SLICE 1 SPECIFICATION DRAFTED - AWAITING HUMAN REVIEW & APPROVAL
 Action Required:
   1. Review Slice 1 architecture and API contracts.
   2. Edit your decisions into Q-S1.1 and Q-S1.2 above (or adopt recommendations).
   3. When ready, state "Approved Slice 1" in chat to begin Slice 1 [E] Execution.
================================================================================
```

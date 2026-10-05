# Slice 1: Customer Identity & Registration (`aidlc-docs/slices/slice-1-registration.md`)

> **AI-DLC Slice Lifecycle Phase:** `[E] EXECUTION & VERIFICATION COMPLETED`  
> **Status:** `COMPLETED (100% Passing Backend & Frontend Verification)`  
> **Slice Focus:** Customer Registration, Email Verification Token Flow, JWT Issuance, Angular 24 Signal Forms

---

## 1. Slice Overview & Scope

Slice 1 establishes the customer identity foundation for the Pet Store platform. It enables new customers to register for an account, validates credentials, enforces security rules, handles email verification tokens for account activation, and issues JWT bearer tokens for authenticated customer operations.

### Key Deliverables Delivered:
1. **Flyway Migration `V4__customer_registration_and_activation.sql`:**
   - Extended `app_users` table with `is_email_verified`, `verification_token`, `verification_token_expiry`, and `full_name`.
   - Updated role check constraints to allow `ROLE_CUSTOMER` and `ROLE_ACCOUNTANT`.
2. **Domain & Security Layer:**
   - Updated `UserRole` enum with `ROLE_CUSTOMER` and `ROLE_ACCOUNTANT`.
   - Updated `AppUser` entity with verification fields.
   - Registration & Verification DTOs (`CustomerRegistrationRequest`, `RegistrationResponse`, `VerifyEmailResponse`, `CustomerProfileUpdateRequest`, `UserProfileDTO`).
3. **Service & Controller APIs:**
   - `POST /api/auth/register`: Validates input, hashes password (BCrypt), creates inactive account (`enabled = false`, `is_email_verified = false`), generates 24-hour verification token.
   - `GET /api/auth/verify?token=...`: Validates token expiry, activates user (`enabled = true`, `is_email_verified = true`), clears token, returns JWT token and customer profile.
   - `POST /api/auth/resend-verification?identifier=...`: Resends activation email/token for unverified accounts.
   - `GET /api/customer/profile` & `PUT /api/customer/profile`: Protected customer profile management.
   - Automated unit tests in `AuthServiceImplTest` covering all scenarios (7 tests, 100% pass).
4. **Angular 24 Signal Forms Component:**
   - Standalone `CustomerRegistrationComponent` built **exclusively with Angular Signal Forms** (`model()`, signal-based field validation, zero `ReactiveFormsModule`).
   - Signal-first notification view indicating activation email instructions with dev bypass link.
   - Standalone `EmailVerificationComponent` to handle URL query parameter activation (`/verify?token=...`) with resend flow.
   - Integration into reactive `AuthStore` Signals (`currentUser`, `isAuthenticated`, `isCustomer`).
   - App routing registered (`/register`, `/verify`) and navigation bar updated with user roles and registration links.

---

## 2. Verification & Test Evidence
- **Backend Unit Tests:** 14/14 tests passed (including `AuthServiceImplTest` 7/7, `FileSystemStorageServiceTest` 3/3, `PetServiceImplTest` 4/4, `ExternalConfigTest` 3/3, `JwtTokenProviderTest` 3/3).
- **Frontend Production Build:** `ng build --configuration production` compiled in 1.48s with zero errors.

---

## 3. Human Approval Gate
- **Status:** APPROVED & EXECUTED.


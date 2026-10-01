# Step 0: Requirements Validation (`REQUIREMENTS.md`)

## 1. Document Overview & System Objectives
This specification defines the functional scope, operational actors, business domain rules, security architecture, and data validation constraints for the **Pet Store Web Application**.

The system provides an enterprise-grade pet inventory and catalog management platform consisting of:
*   A public-facing pet marketplace for prospective adopters/buyers.
*   An administrative back-office portal for inventory tracking, pet profile maintenance, status lifecycle management, and media asset storage.
*   A secure, database-backed authentication system using **JSON Web Tokens (JWT)** integrated into raw Spring Security 7.

---

## 2. Actors & User Roles

| Role | Identifier | Authentication Mechanism | Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **Store Visitor** | `ROLE_VISITOR` / Anonymous | None (Unauthenticated) | • Browse available pets in the marketplace.<br>• Filter by species/category, breed, and price range.<br>• Search pets by keyword (name, breed, description).<br>• Sort catalog items by price or listing date.<br>• Toggle between Grid and List views.<br>• View detailed pet profile information and media. |
| **Store Administrator** | `ROLE_ADMIN` | JWT Bearer Token (DB-backed credentials) | • All Visitor capabilities.<br>• Secure login and token management.<br>• Create, edit, and delete/archive pet profiles.<br>• Upload, replace, and delete pet profile images.<br>• Manage pet status transitions (`AVAILABLE`, `PENDING`, `ADOPTED`).<br>• View full inventory including pending and adopted pets. |

---

## 3. Functional Requirements

### 3.1. Module 1: Pet Profile Management (CRUD)
*   **FR-PET-01 (Create Profile):** An authenticated administrator (`ROLE_ADMIN`) must be able to create a new pet profile with details: Name, Category/Species, Breed, Age, Price, Description, and initial Status.
*   **FR-PET-02 (View Profile Details):** Both visitors and administrators can view complete pet details. If a pet status is not `AVAILABLE`, it is restricted from the public marketplace view but remains accessible to administrators.
*   **FR-PET-03 (Update Profile):** An administrator can edit any pet profile field. Modifying the category or breed must maintain referential integrity.
*   **FR-PET-04 (Delete/Archive Profile):** An administrator can remove a pet. The system must support soft deletion or controlled deletion with checks ensuring no orphaned media or transactions.

### 3.2. Module 2: Image Upload & File Storage
*   **FR-IMG-01 (Direct Multipart Upload):** The system must accept image uploads via standard HTTP `multipart/form-data` leveraging Servlet 6.0 `jakarta.servlet.http.Part`.
*   **FR-IMG-02 (Secure Storage):** Files must be validated against allowed MIME types and stored in a designated filesystem directory with randomized, collision-resistant UUID-based filenames to prevent path traversal attacks.
*   **FR-IMG-03 (Dynamic Media Serving):** The backend must serve stored media assets dynamically via an application endpoint (e.g., `/api/media/{filename}`) with proper HTTP headers (`Content-Type`, `Cache-Control`, `ETag`).
*   **FR-IMG-04 (Image Replacement & Cleanup):** Replacing or deleting a pet profile photo must trigger automatic deletion of the obsolete file on the local filesystem.

### 3.3. Module 3: Pet Marketplace & Catalog Exploration
*   **FR-CAT-01 (Catalog Display & View Toggle):** The Angular client must render available pets with support for switching between Grid View (card layout with image emphasis) and List View (tabular, compact data display).
*   **FR-CAT-02 (Full-Text & Keyword Search):** Visitors can filter pets using a case-insensitive search bar matching against pet name, breed, and description.
*   **FR-CAT-03 (Faceted Filtering):**
    *   Species/Category (e.g., Dog, Cat, Bird, Reptile).
    *   Breed (dynamically scoped to selected species).
    *   Price Range (min price / max price slider or bounds).
    *   Status filter (Admin view: `AVAILABLE`, `PENDING`, `ADOPTED`; Public view: locked to `AVAILABLE`).
*   **FR-CAT-04 (Sorting):** Visitors can order search results by:
    *   Price (Lowest to Highest, Highest to Lowest).
    *   Date Added (Newest First, Oldest First).
    *   Pet Name (A–Z, Z–A).
*   **FR-CAT-05 (Pagination):** Server-side pagination must support standard query parameters (`page`, `size`, `sort`) to ensure fast response times on large inventory sets.

### 3.4. Module 4: Inventory & Status Lifecycle Management
*   **FR-INV-01 (Status State Machine):** Pets transition through strict lifecycle states:
    *   `AVAILABLE`: Active in public catalog, open for inquiries/adoption.
    *   `PENDING`: Under active reservation or adoption processing; hidden or marked as reserved.
    *   `ADOPTED`: Finalized; removed from public search, preserved for historical records.
*   **FR-INV-02 (Transition Rules):**
    *   `AVAILABLE` $\rightarrow$ `PENDING`
    *   `PENDING` $\rightarrow$ `AVAILABLE` (if reservation canceled)
    *   `PENDING` $\rightarrow$ `ADOPTED` (if adoption finalized)
    *   `AVAILABLE` $\rightarrow$ `ADOPTED` (direct checkout/walk-in adoption)
    *   `ADOPTED` cannot transition back to `AVAILABLE` without administrator override.

### 3.5. Module 5: Authentication & Security (Database-Backed JWT)
*   **FR-SEC-01 (User Credential Storage):** User credentials (username, email, salt-hashed password, enabled status, roles) must be persisted in PostgreSQL.
*   **FR-SEC-02 (Authentication & Token Issuance):** The backend exposes an authentication endpoint (`POST /api/auth/login`). Valid credentials generate a cryptographically signed JWT containing subject, roles, issued-at time, and expiration.
*   **FR-SEC-03 (Stateless Token Validation):** Incoming requests with `Authorization: Bearer <token>` must be intercepted by a Spring Security filter (`OncePerRequestFilter`), validating token signature, expiration, and injecting `Authentication` into `SecurityContextHolder`.
*   **FR-SEC-04 (Role-Based Route Protection):** Public catalog reading endpoints remain unauthenticated. Mutating operations (`POST`, `PUT`, `DELETE`, `/api/pets/**`, `/api/media/**`) require authenticated `ROLE_ADMIN`.
*   **FR-SEC-05 (Current User Profile):** An endpoint (`GET /api/auth/me`) allows the Angular client to verify current session validity and retrieve active user identity and roles.

---

## 4. Business Validation Rules & Data Model Expectations

### 4.1. Pet Profile Field Constraints

| Field | Type | Required | Constraints & Validation Rules |
| :--- | :--- | :---: | :--- |
| `id` | `Long` | Yes | Unique system-generated primary key (identity / sequence). |
| `name` | `String` | Yes | 2 to 50 characters; letters, spaces, hyphens, and apostrophes only. |
| `category` | `String` | Yes | Predefined or standardized taxonomy (e.g., `Dog`, `Cat`, `Bird`, `Fish`, `Other`). Max 50 chars. |
| `breed` | `String` | Yes | 2 to 60 characters (e.g., "Golden Retriever", "Domestic Shorthair"). |
| `ageMonths` | `Integer` | Yes | Non-negative integer, range: $0 \le age \le 360$ (up to 30 years). Displayed as years/months in UI. |
| `status` | `Enum` | Yes | One of: `AVAILABLE`, `PENDING`, `ADOPTED`. Default: `AVAILABLE`. |
| `price` | `BigDecimal` | Yes | Decimal value with 2 decimal places. Min: `0.00` (free adoption), Max: `99999.99`. |
| `description` | `String` | No | Max 1000 characters; safe text (HTML-escaped). |
| `photoUrl` | `String` | No | Valid URI path relative to media endpoint (e.g., `/api/media/pets/a1b2c3d4.webp`). |
| `createdAt` | `Instant` | Yes | Auto-populated on entity creation. |
| `updatedAt` | `Instant` | Yes | Auto-populated on entity modification. |

### 4.2. User & Authentication Field Constraints

| Field | Type | Required | Constraints & Validation Rules |
| :--- | :--- | :---: | :--- |
| `id` | `Long` | Yes | Primary key. |
| `username` | `String` | Yes | Unique, 3 to 50 characters, alphanumeric and underscore/hyphen. |
| `email` | `String` | Yes | Unique, valid email format (RFC 5322), max 100 characters. |
| `passwordHash` | `String` | Yes | BCrypt salted hash (work factor 12, standard 60-char length). |
| `role` | `String` | Yes | e.g., `ROLE_ADMIN`, `ROLE_STAFF`. Max 30 characters. |
| `enabled` | `Boolean` | Yes | Account active status flag (`true`/`false`). Default `true`. |
| `createdAt` | `Instant` | Yes | Auto-populated timestamp. |

### 4.3. File Upload Constraints

| Constraint | Rule Specification |
| :--- | :--- |
| **Allowed File Types (MIME)** | `image/jpeg` (`.jpg`, `.jpeg`), `image/png` (`.png`), `image/webp` (`.webp`). |
| **Prohibited File Types** | Executables, SVG (to prevent XSS), PDF, scripts, and unknown binary streams. |
| **Max File Size** | 5 MB per single image upload request. |
| **Filename Handling** | Original filename is stripped; file is stored as `<uuid>.<extension>`. |
| **Directory Isolation** | Dedicated local folder configured via external property (e.g., `app.storage.upload-dir`). Path sanitization enforced to prevent path traversal (`..` sequences rejected). |

---

## 5. Non-Functional & Technical Constraints

*   **Runtime Architecture:** Raw Spring Framework 7.x running on Java 21 (LTS) without Spring Boot starters.
*   **Servlet Engine:** Servlet 6.0 container compliant (Tomcat 11 or Jetty 12).
*   **Security Architecture:**
    *   Raw Spring Security 7 programmatic configuration (`SecurityFilterChain` bean).
    *   Stateless session policy (`SessionCreationPolicy.STATELESS`).
    *   CSRF disabled for stateless REST endpoints; CORS strictly configured for the Angular client origin.
    *   Database-backed `UserDetailsService` querying PostgreSQL credentials.
    *   Password encoding using `BCryptPasswordEncoder`.
    *   HMAC-SHA256 (or RSA) signed JWTs with configurable expiration (e.g., 60 minutes) and secret key.
*   **Database:** PostgreSQL 16+ with ACID transaction boundaries managed via Spring's `PlatformTransactionManager` and JPA `EntityManagerFactory`.
*   **Frontend UI:** Angular (latest stable) built with a 100% Signal-First reactive architecture. All component communication must utilize signal primitives: `input()` / `input.required()`, `output()`, `model()`, `computed()`, `effect()`, and signal queries (`viewChild()`). State management (auth state, catalog filters, view toggles, pagination, inventory data) must be managed strictly via Signals (`signal()`, `computed()`, `toSignal()`), eliminating legacy `@Input()`, `@Output()`, and manual `ChangeDetectorRef` subscriptions.

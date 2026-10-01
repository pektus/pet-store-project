# Step 2: REST API & Data Contract Specification (`API_SPEC.md`)

## 1. Overview & Conventions

*   **Base URL:** `/api`
*   **Data Format:** `application/json` (UTF-8) for standard endpoints, `multipart/form-data` for file uploads, and binary image streams for media serving.
*   **Authentication:** Stateless HTTP Bearer Token (`Authorization: Bearer <jwt-token>`).
*   **Error Standard:** RFC 7807 `application/problem+json` (`org.springframework.http.ProblemDetail`).
*   **Date/Time Format:** ISO-8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`).

---

## 2. API Endpoint Matrix

| Method | Path | Auth / Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and issues a signed JWT. |
| `GET` | `/api/auth/me` | Authenticated | Retrieves profile of currently authenticated user. |
| `GET` | `/api/pets` | Public | Paginated, filtered, and sorted catalog of pets. |
| `GET` | `/api/pets/{id}` | Public | Retrieves full pet profile details. |
| `POST` | `/api/pets` | `ROLE_ADMIN` | Creates a new pet record. |
| `PUT` | `/api/pets/{id}` | `ROLE_ADMIN` | Updates an existing pet record completely. |
| `PATCH` | `/api/pets/{id}/status` | `ROLE_ADMIN` | Transitions a pet's status (`AVAILABLE`, `PENDING`, `ADOPTED`). |
| `DELETE` | `/api/pets/{id}` | `ROLE_ADMIN` | Deletes/archives a pet record and purges associated media. |
| `GET` | `/api/pets/categories` | Public | Lists all distinct species/categories in inventory. |
| `GET` | `/api/pets/breeds` | Public | Lists distinct breeds, optionally filtered by category. |
| `POST` | `/api/media/upload` | `ROLE_ADMIN` | Multipart upload for pet photo; returns media URL. |
| `GET` | `/api/media/{filename}` | Public | Streams image file with caching headers (`Cache-Control`, `ETag`). |
| `DELETE` | `/api/media/{filename}`| `ROLE_ADMIN` | Deletes an uploaded media file from the local storage. |

---

## 3. Detailed Endpoint Contracts

### 3.1. Authentication Endpoints

#### 3.1.1. User Login
*   **Route:** `POST /api/auth/login`
*   **Public Access**

##### Request Payload (`LoginRequest`)
```json
{
  "usernameOrEmail": "admin",
  "password": "Password123!"
}
```

##### Success Response (`200 OK`) (`AuthResponse`)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@petstore.internal",
    "role": "ROLE_ADMIN"
  }
}
```

##### Error Response (`401 Unauthorized`)
```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid username or password",
  "instance": "/api/auth/login"
}
```

#### 3.1.2. Get Current Authenticated Profile
*   **Route:** `GET /api/auth/me`
*   **Header:** `Authorization: Bearer <token>`

##### Success Response (`200 OK`) (`UserProfileDTO`)
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@petstore.internal",
  "role": "ROLE_ADMIN"
}
```

---

### 3.2. Pet Catalog & Management Endpoints

#### 3.2.1. List / Search Pets
*   **Route:** `GET /api/pets`
*   **Public Access** (Public queries are implicitly locked to `status=AVAILABLE` unless the caller has `ROLE_ADMIN`).
*   **Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `search` | `String` | No | `null` | Case-insensitive keyword matching name, breed, or description. |
| `category` | `String` | No | `null` | Filter by category (e.g. `Dog`, `Cat`). |
| `breed` | `String` | No | `null` | Filter by breed (e.g. `Golden Retriever`). |
| `status` | `PetStatus` | No | `AVAILABLE` | Status filter: `AVAILABLE`, `PENDING`, `ADOPTED`. |
| `minPrice` | `BigDecimal` | No | `null` | Minimum price boundary. |
| `maxPrice` | `BigDecimal` | No | `null` | Maximum price boundary. |
| `page` | `Integer` | No | `0` | Zero-indexed page number. |
| `size` | `Integer` | No | `12` | Items per page (max 100). |
| `sort` | `String` | No | `createdAt,desc` | Sorting format: `field,direction` (e.g., `price,asc`, `name,desc`). |

##### Success Response (`200 OK`) (`PageResponse<PetSummaryDTO>`)
```json
{
  "content": [
    {
      "id": 101,
      "name": "Bailey",
      "category": "Dog",
      "breed": "Golden Retriever",
      "ageMonths": 24,
      "price": 450.00,
      "status": "AVAILABLE",
      "photoUrl": "/api/media/a9d59ec3-9824-4f81-8b21-4faecdf37119.webp",
      "createdAt": "2026-09-20T14:32:00Z"
    }
  ],
  "pageNumber": 0,
  "pageSize": 12,
  "totalElements": 48,
  "totalPages": 4,
  "last": false
}
```

#### 3.2.2. Get Pet Profile by ID
*   **Route:** `GET /api/pets/{id}`
*   **Public Access**

##### Success Response (`200 OK`) (`PetDetailDTO`)
```json
{
  "id": 101,
  "name": "Bailey",
  "category": "Dog",
  "breed": "Golden Retriever",
  "ageMonths": 24,
  "price": 450.00,
  "status": "AVAILABLE",
  "description": "Friendly, playful, fully vaccinated and loves outdoor activities.",
  "photoUrl": "/api/media/a9d59ec3-9824-4f81-8b21-4faecdf37119.webp",
  "createdAt": "2026-09-20T14:32:00Z",
  "updatedAt": "2026-09-20T14:32:00Z"
}
```

##### Error Response (`404 Not Found`)
```json
{
  "type": "about:blank",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Pet with ID 999 does not exist",
  "instance": "/api/pets/999"
}
```

#### 3.2.3. Create Pet Profile
*   **Route:** `POST /api/pets`
*   **Security:** `ROLE_ADMIN`

##### Request Payload (`PetCreateRequest`)
```json
{
  "name": "Milo",
  "category": "Cat",
  "breed": "British Shorthair",
  "ageMonths": 10,
  "price": 320.00,
  "status": "AVAILABLE",
  "description": "Calm temperament, microchipped and litter trained.",
  "photoUrl": "/api/media/893cfa31-897b-4bb8-88aa-37b587a892f3.jpg"
}
```

##### Success Response (`201 Created`)
*   **Header:** `Location: /api/pets/102`
*   **Body:** `PetDetailDTO` (including generated `id`, `createdAt`, `updatedAt`).

##### Error Response (`400 Bad Request`) (`Validation ProblemDetail`)
```json
{
  "type": "about:blank",
  "title": "Validation Failed",
  "status": 400,
  "detail": "Invalid input arguments in request payload",
  "instance": "/api/pets",
  "errors": {
    "name": "Name must be between 2 and 50 characters",
    "price": "Price must be greater than or equal to 0.00"
  }
}
```

#### 3.2.4. Update Pet Profile
*   **Route:** `PUT /api/pets/{id}`
*   **Security:** `ROLE_ADMIN`

##### Request Payload (`PetUpdateRequest`)
```json
{
  "name": "Milo Senior",
  "category": "Cat",
  "breed": "British Shorthair",
  "ageMonths": 18,
  "price": 300.00,
  "status": "AVAILABLE",
  "description": "Updated description with updated vaccination records.",
  "photoUrl": "/api/media/893cfa31-897b-4bb8-88aa-37b587a892f3.jpg"
}
```

##### Success Response (`200 OK`)
*   **Body:** Updated `PetDetailDTO`.

#### 3.2.5. Update Pet Status
*   **Route:** `PATCH /api/pets/{id}/status`
*   **Security:** `ROLE_ADMIN`

##### Request Payload (`PetStatusUpdateRequest`)
```json
{
  "status": "ADOPTED"
}
```

##### Success Response (`200 OK`)
*   **Body:** Updated `PetDetailDTO`.

##### Error Response (`400 Bad Request`)
```json
{
  "type": "about:blank",
  "title": "Illegal State Transition",
  "status": 400,
  "detail": "Cannot transition status from ADOPTED to AVAILABLE without supervisor override",
  "instance": "/api/pets/102/status"
}
```

#### 3.2.6. Delete Pet Profile
*   **Route:** `DELETE /api/pets/{id}`
*   **Security:** `ROLE_ADMIN`

##### Success Response (`204 No Content`)
*   *Empty body.* Also triggers removal of local filesystem photo referenced by `photoUrl`.

#### 3.2.7. Get Distinct Categories & Breeds
*   `GET /api/pets/categories` $\rightarrow$ `["Dog", "Cat", "Bird", "Reptile", "Small Animal", "Other"]`
*   `GET /api/pets/breeds?category=Dog` $\rightarrow$ `["Golden Retriever", "German Shepherd", "Poodle", "Bulldog"]`

---

### 3.3. Media Upload & Streaming Endpoints

#### 3.3.1. Upload Pet Photo
*   **Route:** `POST /api/media/upload`
*   **Security:** `ROLE_ADMIN`
*   **Content-Type:** `multipart/form-data`
*   **Form Field:** `file` (`Part` binary, $\le 5$ MB)

##### Success Response (`201 Created`) (`MediaUploadResponse`)
```json
{
  "filename": "f2a3c749-623b-4176-80f4-5d519b5bfb42.webp",
  "fileUrl": "/api/media/f2a3c749-623b-4176-80f4-5d519b5bfb42.webp",
  "contentType": "image/webp",
  "sizeBytes": 204918
}
```

##### Error Response (`400 Bad Request` or `413 Payload Too Large`)
```json
{
  "type": "about:blank",
  "title": "Invalid File Upload",
  "status": 400,
  "detail": "Unsupported file format. Only JPEG, PNG, and WebP images are permitted.",
  "instance": "/api/media/upload"
}
```

#### 3.3.2. Stream / Download Media Asset
*   **Route:** `GET /api/media/{filename}`
*   **Public Access**
*   **Headers Returned:**
    *   `Content-Type: image/jpeg` (or `image/png` / `image/webp`)
    *   `Cache-Control: public, max-age=86400, immutable`
    *   `ETag: "1b4f-6071ef28"`
*   **Body:** Raw image binary stream.

---

## 4. Java Data Transfer Object (DTO) Contracts

### 4.1. Authentication DTOs
```java
package com.petstore.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
    @NotBlank(message = "Username or email is required")
    @Size(min = 3, max = 100)
    String usernameOrEmail,

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100)
    String password
) {}

public record AuthResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    UserProfileDTO user
) {}

public record UserProfileDTO(
    Long id,
    String username,
    String email,
    String role
) {}
```

### 4.2. Pet DTOs
```java
package com.petstore.domain.dto;

import com.petstore.domain.enums.PetStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record PetCreateRequest(
    @NotBlank(message = "Pet name is required")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    String name,

    @NotBlank(message = "Category is required")
    @Size(max = 50)
    String category,

    @NotBlank(message = "Breed is required")
    @Size(max = 60)
    String breed,

    @NotNull(message = "Age in months is required")
    @Min(value = 0, message = "Age cannot be negative")
    @Max(value = 360, message = "Age cannot exceed 360 months")
    Integer ageMonths,

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    @Digits(integer = 7, fraction = 2, message = "Price must conform to monetary format")
    BigDecimal price,

    @NotNull(message = "Initial status is required")
    PetStatus status,

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    String description,

    @Pattern(regexp = "^/api/media/[a-zA-Z0-9._-]+$", message = "Invalid photo URL format")
    String photoUrl
) {}

public record PetUpdateRequest(
    @NotBlank @Size(min = 2, max = 50) String name,
    @NotBlank @Size(max = 50) String category,
    @NotBlank @Size(max = 60) String breed,
    @NotNull @Min(0) @Max(360) Integer ageMonths,
    @NotNull @DecimalMin("0.00") @Digits(integer = 7, fraction = 2) BigDecimal price,
    @NotNull PetStatus status,
    @Size(max = 1000) String description,
    @Pattern(regexp = "^/api/media/[a-zA-Z0-9._-]+$") String photoUrl
) {}

public record PetStatusUpdateRequest(
    @NotNull(message = "Status is required")
    PetStatus status
) {}

public record PetSummaryDTO(
    Long id,
    String name,
    String category,
    String breed,
    Integer ageMonths,
    BigDecimal price,
    PetStatus status,
    String photoUrl,
    Instant createdAt
) {}

public record PetDetailDTO(
    Long id,
    String name,
    String category,
    String breed,
    Integer ageMonths,
    BigDecimal price,
    PetStatus status,
    String description,
    String photoUrl,
    Instant createdAt,
    Instant updatedAt
) {}

public record PageResponse<T>(
    List<T> content,
    int pageNumber,
    int pageSize,
    long totalElements,
    int totalPages,
    boolean last
) {}
```

### 4.3. Media DTOs
```java
package com.petstore.domain.dto;

public record MediaUploadResponse(
    String filename,
    String fileUrl,
    String contentType,
    long sizeBytes
) {}
```

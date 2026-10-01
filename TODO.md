# Step 4: Implementation Plan (`TODO.md`)

This plan provides a granular, checkable file-by-file roadmap organized by Maven module to guide the code generation and implementation phase.

---

## Phase 1: Multi-Module Maven Configuration & Infrastructure

- [x] `pom.xml` (Root Parent POM)
  - Define root project metadata (`com.petstore:pet-store-parent:1.0.0-SNAPSHOT`).
  - Declare modules: `pet-store-domain`, `pet-store-service`, `pet-store-web`, `pet-store-frontend`.
  - Configure `<dependencyManagement>` for Spring Framework 7.0.x, Spring Data JPA, Spring Security 7.0.x, Hibernate 6.x/7.x, PostgreSQL JDBC driver, HikariCP, JJWT (io.jsonwebtoken 0.12.x), Jackson 2.18+, Jakarta Servlet 6.0, Jakarta Validation 3.1, Flyway 10+.
  - Configure Maven Compiler Plugin targeting Java 21 LTS (`-parameters`, `--enable-preview` if applicable).
- [x] `pet-store-domain/pom.xml`
  - Depend on Jakarta Persistence API, Jakarta Validation API, Jackson annotations.
- [x] `pet-store-service/pom.xml`
  - Depend on `pet-store-domain`, Spring Context, Spring Data JPA, Hibernate Core, Spring TX, Spring Security Crypto (BCrypt).
- [x] `pet-store-web/pom.xml`
  - Packaging: `war`.
  - Depend on `pet-store-service`, Spring Web MVC, Spring Security Web & Config, JJWT, Flyway Core & Database PostgreSQL, HikariCP, PostgreSQL Driver, Jakarta Servlet API (provided).
  - Configure `maven-war-plugin` with `<failOnMissingWebXml>false</failOnMissingWebXml>`.
- [x] `pet-store-frontend/pom.xml`
  - Configure `frontend-maven-plugin` to install Node.js/NPM and execute `npm run build` during package phase.

---

## Phase 2: Configuration & Database Migrations

- [x] `pet-store-web/src/main/resources/application.properties`
  - Database connection properties (`db.url`, `db.username`, `db.password`, `db.driver-class-name`).
  - JWT configuration (`jwt.secret`, `jwt.expiration-ms`, `jwt.issuer`).
  - File storage settings (`app.storage.upload-dir=uploads`).
  - CORS allowed origins (`app.cors.allowed-origins=http://localhost:4200`).
- [x] `pet-store-web/src/main/resources/db/migration/V1__init_schema.sql`
  - SQL script creating `pg_trgm` extension, `categories`, `pets`, `pet_status_audit`, `app_users` tables, foreign keys, check constraints, and B-tree/GIN indexes.
- [x] `pet-store-web/src/main/resources/db/migration/V2__seed_initial_data.sql`
  - SQL script seeding default categories, initial admin account with BCrypt password hash, and sample pet listings.

---

## Phase 3: Domain Module (`pet-store-domain`)

### 3.1. Enums
- [x] `src/main/java/com/petstore/domain/enums/PetStatus.java` (`AVAILABLE`, `PENDING`, `ADOPTED`)
- [x] `src/main/java/com/petstore/domain/enums/UserRole.java` (`ROLE_ADMIN`, `ROLE_STAFF`)

### 3.2. JPA Entities
- [x] `src/main/java/com/petstore/domain/entity/Category.java` (`@Entity`, `@Table(name = "categories")`)
- [x] `src/main/java/com/petstore/domain/entity/Pet.java` (`@Entity`, `@Table(name = "pets")`, `@Version`, lifecycle timestamps)
- [x] `src/main/java/com/petstore/domain/entity/PetStatusAudit.java` (`@Entity`, `@Table(name = "pet_status_audit")`)
- [x] `src/main/java/com/petstore/domain/entity/AppUser.java` (`@Entity`, `@Table(name = "app_users")`)

### 3.3. Data Transfer Objects (DTO Records)
- [x] `src/main/java/com/petstore/domain/dto/LoginRequest.java` (Jakarta validation constraints)
- [x] `src/main/java/com/petstore/domain/dto/AuthResponse.java` (Token, tokenType, expiresIn, user profile)
- [x] `src/main/java/com/petstore/domain/dto/UserProfileDTO.java` (id, username, email, role)
- [x] `src/main/java/com/petstore/domain/dto/PetCreateRequest.java` (name, category, breed, age, price, status, photoUrl, description)
- [x] `src/main/java/com/petstore/domain/dto/PetUpdateRequest.java` (validated update fields)
- [x] `src/main/java/com/petstore/domain/dto/PetStatusUpdateRequest.java` (status transition payload)
- [x] `src/main/java/com/petstore/domain/dto/PetSummaryDTO.java` (card/list projection)
- [x] `src/main/java/com/petstore/domain/dto/PetDetailDTO.java` (full detail projection)
- [x] `src/main/java/com/petstore/domain/dto/PageResponse.java` (generic pagination response wrapper)
- [x] `src/main/java/com/petstore/domain/dto/MediaUploadResponse.java` (filename, fileUrl, contentType, sizeBytes)

---

## Phase 4: Service & Persistence Module (`pet-store-service`)

### 4.1. Repositories
- [x] `src/main/java/com/petstore/service/repository/CategoryRepository.java` (`JpaRepository<Category, Long>`)
- [x] `src/main/java/com/petstore/service/repository/PetRepository.java` (`JpaRepository<Pet, Long>`, `JpaSpecificationExecutor<Pet>`)
- [x] `src/main/java/com/petstore/service/repository/PetSpecification.java` (JPA Criteria builder for dynamic multi-attribute filtering)
- [x] `src/main/java/com/petstore/service/repository/PetStatusAuditRepository.java` (`JpaRepository<PetStatusAudit, Long>`)
- [x] `src/main/java/com/petstore/service/repository/UserRepository.java` (`JpaRepository<AppUser, Long>`, findByUsernameOrEmail)

### 4.2. Business Exceptions
- [x] `src/main/java/com/petstore/service/exception/ResourceNotFoundException.java`
- [x] `src/main/java/com/petstore/service/exception/InvalidStateTransitionException.java`
- [x] `src/main/java/com/petstore/service/exception/StorageException.java`
- [x] `src/main/java/com/petstore/service/exception/InvalidFileException.java`

### 4.3. Services & Implementations
- [x] `src/main/java/com/petstore/service/service/StorageService.java` (Contract for storing, loading, and deleting files)
- [x] `src/main/java/com/petstore/service/service/impl/FileSystemStorageService.java` (NIO.2 filesystem implementation, path sanitization, MIME verification)
- [x] `src/main/java/com/petstore/service/service/PetService.java` (CRUD, filtering, search, pagination, status transitions)
- [x] `src/main/java/com/petstore/service/service/impl/PetServiceImpl.java` (`@Transactional` business logic implementation)
- [x] `src/main/java/com/petstore/service/service/AuthService.java` (Authentication, JWT issuance, profile lookup)
- [x] `src/main/java/com/petstore/service/service/impl/AuthServiceImpl.java` (AuthenticationManager execution)
- [x] `src/main/java/com/petstore/service/service/impl/CustomUserDetailsService.java` (Spring Security `UserDetailsService` querying `UserRepository`)

### 4.4. Mappers
- [x] `src/main/java/com/petstore/service/mapper/PetMapper.java` (Entity-to-DTO and DTO-to-Entity conversions)

---

## Phase 5: Web & Security Module (`pet-store-web`)

### 5.1. Programmatic Spring 7 Java Configuration (No Spring Boot, No web.xml)
- [x] `src/main/java/com/petstore/web/init/WebAppInitializer.java` (`AbstractAnnotationConfigDispatcherServletInitializer` + `MultipartConfigElement`)
- [x] `src/main/java/com/petstore/web/config/AppConfig.java` (`@ComponentScan`, `@PropertySource`, `PropertySourcesPlaceholderConfigurer`)
- [x] `src/main/java/com/petstore/web/config/JpaConfig.java` (HikariDataSource, programmatic Flyway bean, `LocalContainerEntityManagerFactoryBean`, `JpaTransactionManager`)
- [x] `src/main/java/com/petstore/web/config/WebMvcConfig.java` (`@EnableWebMvc`, Jackson `MappingJackson2HttpMessageConverter`, CORS mapping)
- [x] `src/main/java/com/petstore/web/config/SecurityConfig.java` (`@EnableWebSecurity`, programmatic `SecurityFilterChain`, stateless sessions, CSRF disabled, BCrypt password encoder)
- [x] `src/main/java/com/petstore/web/config/StorageConfig.java` (Directory initialization and permission verification)

### 5.2. Security & JWT Components
- [x] `src/main/java/com/petstore/web/security/JwtTokenProvider.java` (HMAC-SHA256 signing, claims parsing, token expiration check)
- [x] `src/main/java/com/petstore/web/security/JwtAuthenticationFilter.java` (`OncePerRequestFilter`, parses `Authorization: Bearer`, sets `SecurityContext`)
- [x] `src/main/java/com/petstore/web/security/JwtAuthenticationEntryPoint.java` (RFC 7807 401 response for unauthenticated requests)

### 5.3. REST Controllers
- [x] `src/main/java/com/petstore/web/controller/AuthController.java` (`POST /api/auth/login`, `GET /api/auth/me`)
- [x] `src/main/java/com/petstore/web/controller/PetController.java` (`GET`, `POST`, `PUT`, `PATCH`, `DELETE /api/pets/**`, taxonomy endpoints)
- [x] `src/main/java/com/petstore/web/controller/MediaController.java` (`POST /api/media/upload`, `GET /api/media/{filename}`, `DELETE /api/media/{filename}`)

### 5.4. Global Exception Advice
- [x] `src/main/java/com/petstore/web/controller/advice/GlobalExceptionHandler.java` (`@RestControllerAdvice` mapping exceptions to RFC 7807 `ProblemDetail`)

---

## Phase 6: Frontend Module (`pet-store-frontend`) - 100% Signal-First Angular

### 6.1. Build & Project Configuration
- [x] `package.json` (Angular 19/latest dependencies, TypeScript, TailwindCSS/standard styling)
- [x] `angular.json` (Build configuration, assets, styles)
- [x] `tsconfig.json` & `tsconfig.app.json` (Strict type checking, modern ES target)

### 6.2. Core Models, Interceptors & Stores (Signals)
- [x] `src/app/core/models/pet.model.ts` (`PetSummary`, `PetDetail`, `PetCreateRequest`, `PetUpdateRequest`, `PetStatus`)
- [x] `src/app/core/models/user.model.ts` (`UserProfile`, `AuthResponse`, `LoginRequest`)
- [x] `src/app/core/models/api-response.model.ts` (`PageResponse<T>`, `ProblemDetail`)
- [x] `src/app/core/services/pet.service.ts` (HTTP calls for pet catalog & admin management)
- [x] `src/app/core/services/media.service.ts` (HTTP calls for multipart file upload & image deletion)
- [x] `src/app/core/stores/auth.store.ts` (Signal store: `currentUser = signal(...)`, `isAuthenticated = computed(...)`, `isAdmin = computed(...)`, `login()`, `logout()`)
- [x] `src/app/core/stores/catalog.store.ts` (Signal store: search term, selected category, selected breed, price range, sort, page, view mode, pets data signal)
- [x] `src/app/core/interceptors/jwt.interceptor.ts` (Functional `HttpInterceptorFn` injecting Bearer token)
- [x] `src/app/core/guards/admin.guard.ts` (Functional `CanActivateFn` checking `authStore.isAdmin()`)

### 6.3. Shared UI Components (Signal Inputs & Outputs)
- [x] `src/app/shared/components/navbar/navbar.component.ts` & `.html` (Brand, navigation links, login/logout button, reactive auth state)
- [x] `src/app/shared/components/status-badge/status-badge.component.ts` & `.html` (Color-coded badge with `status = input.required<PetStatus>()`)
- [x] `src/app/shared/components/confirmation-modal/confirmation-modal.component.ts` & `.html` (`isOpen = model<boolean>()`, `confirmed = output<void>()`)
- [x] `src/app/shared/components/pagination/pagination.component.ts` & `.html` (Signal-driven page navigator: `currentPage = input.required()`, `totalPages = input.required()`, `pageChange = output<number>()`)

### 6.4. Feature Components (Standalone, 100% Signal Reactive)
- [x] `src/app/features/catalog/pet-catalog.component.ts` & `.html` (Public catalog dashboard with filters, search input, price slider, grid/list view toggle)
- [x] `src/app/features/catalog/components/pet-card.component.ts` & `.html` (Grid view pet card with `pet = input.required<PetSummary>()`, `selectPet = output<number>()`)
- [x] `src/app/features/catalog/components/pet-list-row.component.ts` & `.html` (List view tabular row with `pet = input.required<PetSummary>()`)
- [x] `src/app/features/pet-detail/pet-detail-modal.component.ts` & `.html` (Full profile modal with `petId = input<number | null>()`, `close = output<void>()`)
- [x] `src/app/features/admin/inventory/admin-inventory.component.ts` & `.html` (Admin inventory dashboard, quick status transition buttons, delete actions)
- [x] `src/app/features/admin/pet-form/admin-pet-form.component.ts` & `.html` (Create/Edit modal, reactive form, drag-and-drop file upload with preview)
- [x] `src/app/features/auth/login-dialog/login-dialog.component.ts` & `.html` (Modal dialog with login form, signal error messages, auth submission)

### 6.5. Application Shell & Routing
- [x] `src/app/app.routes.ts` (Routes: `/` -> catalog, `/admin/inventory` -> admin inventory with `adminGuard`, `**` -> redirect)
- [x] `src/app/app.config.ts` (`provideHttpClient(withInterceptors([jwtInterceptor]))`, `provideRouter(routes)`)
- [x] `src/app/app.component.ts` & `.html` (App shell with navbar, router-outlet, global modals, footer)
- [x] `src/styles.css` (Clean, responsive layout with modern CSS variables, cards, buttons, badges)

---

## Phase 7: Verification & Build Validation

- [x] Execute `mvn clean compile` to verify POM dependency trees and Java 21 compilation.
- [x] Run backend unit & integration tests (`mvn test`).
- [x] Build Angular client via `frontend-maven-plugin` (`mvn package`).
- [x] Verify complete WAR artifact generation and embedded container bootstrap readiness.

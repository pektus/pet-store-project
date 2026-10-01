# Pet Store Enterprise Application

A production-ready, full-stack enterprise Pet Store and inventory management platform built with **Java 21**, **pure Spring Framework 7.x (Zero Spring Boot, Zero XML)**, **Servlet 6.0+**, **PostgreSQL**, and an **Angular 19 SPA built with a 100% Signal-First reactive architecture**.

---

## Architecture Overview

```
       [ Client Browser ]
               │
        (Port 80 / 443)
               ▼
   ┌───────────────────────┐
   │   Apache HTTP Server  │
   │        (httpd)        │
   │  ┌─────────────────┐  │
   │  │ Angular 19 SPA  │  │  --> Serves static assets directly (HTML/CSS/JS)
   │  │ (Signal-First)  │  │
   │  └─────────────────┘  │
   │  ┌─────────────────┐  │
   │  │ Reverse Proxy   │  │  --> Proxies /api/* requests
   │  │ (mod_proxy)     │  │
   └──────────┬────────────┘
              │ ProxyPass to :8080
              ▼
   ┌───────────────────────┐
   │     Apache Tomcat     │
   │    (10.1+ / 11.0)     │
   │  ┌─────────────────┐  │
   │  │ petstore.war    │  │  --> Pure Spring 7 REST & Media APIs (Servlet 6.0)
   │  └────────┬────────┘  │
   └───────────┼───────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌──────────────┐ ┌───────────────────────────┐
│  PostgreSQL  │ │ Local Filesystem Storage  │
│  (HikariCP)  │ │   (UUID sanitized media)  │
└──────────────┘ └───────────────────────────┘
```

### Key Architectural Characteristics
* **Zero Spring Boot / Zero XML:** Modern programmatic Java configuration via `WebApplicationInitializer` (`AbstractAnnotationConfigDispatcherServletInitializer`).
* **Servlet 6.0+ Baseline:** Compliant with modern servlet containers (Apache Tomcat 10.1+ / 11+ or Eclipse Jetty 12+).
* **Database & Migrations:** PostgreSQL persistence managed via Spring Data JPA with Hibernate 7, HikariCP connection pooling, and automatic startup migrations via Flyway.
* **Security:** Database-backed credentials (`app_users`), BCrypt password hashing, Spring Security 7 filter chain, and stateless JJWT (0.12.x) bearer tokens.
* **Signal-First Angular 19:** Built strictly using Angular Signals (`signal()`, `computed()`, `input()`, `output()`, `model()`, `effect()`) and standalone components. Legacy `@Input()`, `@Output()`, and `EventEmitter` decorators are completely eliminated.
* **Secure Filesystem Storage:** Uploaded pet photos are stored on the host filesystem with UUID hashing, MIME verification, path-traversal sanitization, and high-performance streaming with caching headers.

---

## Project Structure

The project is structured as a Maven multi-module reactor:

```text
pet-store-project/
├── pom.xml                     # Parent POM (dependencyManagement, plugins, Java 21)
├── REQUIREMENTS.md             # Functional requirements & validation specifications
├── ARCHITECTURE.md             # System architecture, class diagrams & storage flow
├── API_SPEC.md                 # REST API contracts & Java DTO definitions
├── SCHEMA.md                   # PostgreSQL DDL, constraints & indexing strategy
├── TODO.md                     # Granular implementation checklist
│
├── pet-store-domain/           # JPA Entities (Pet, Category, AppUser), Enums, DTO records
├── pet-store-service/          # Spring Data Repositories, Service Layer, Storage Service
├── pet-store-web/              # Spring MVC Dispatcher, Security Filter Chain, REST Controllers, Flyway
└── pet-store-frontend/         # Angular 19 SPA (frontend-maven-plugin integrated)
```

---

## Prerequisites

Before building and deploying the application, ensure the following tools are installed:

| Tool | Version Requirement | Purpose |
| :--- | :--- | :--- |
| **Java JDK** | OpenJDK 21 LTS (or higher) | Backend compilation and runtime |
| **Apache Maven** | 3.9+ | Multi-module build management |
| **PostgreSQL** | 16+ | Relational persistence |
| **Apache Tomcat** | 10.1.x or 11.0.x | Servlet 6.0+ backend application server |
| **Apache HTTP Server** | 2.4+ | Frontend static file hosting & reverse proxy |
| **Node.js & npm** | Node 20+ (optional locally) | Managed automatically by Maven during packaging |

---

## Configuration Architecture

The application supports a flexible, multi-tiered configuration hierarchy:

1. **External Configuration Directory (`APP_CONFIG_DIR`) [Recommended for Production]:**
   * Configured via Tomcat's `catalina.properties` (`conf/catalina.properties`) as `APP_CONFIG_DIR=/path/to/base` (or as a system property / OS environment variable).
   * Spring automatically scans and loads properties from:
     * `${APP_CONFIG_DIR}/apps/conf/application.properties`
     * `${APP_CONFIG_DIR}/apps/conf/petstore.properties`
     * Any additional `*.properties` in `${APP_CONFIG_DIR}/apps/conf/`
   * Values in these files take precedence over default classpath settings.
2. **Environment Variables & System Properties:**
   * Values such as `JDBC_DATABASE_URL`, `JDBC_DATABASE_USERNAME`, `JDBC_DATABASE_PASSWORD`, `JWT_SECRET`, and `APP_STORAGE_UPLOAD_DIR` can also be supplied via OS environment or JVM `-D` flags.
3. **Classpath Defaults:**
   * Bundled defaults in `classpath:application.properties` provide safe local fallbacks if external properties are omitted.

---

## Database Configuration

1. **Create the Database:**
   Connect to PostgreSQL using `psql` or pgAdmin:
   ```sql
   CREATE DATABASE petstoredb;
   ```

2. **Core Configuration Properties:**

| Property Key | Environment Fallback | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `db.url` | `JDBC_DATABASE_URL` | `jdbc:postgresql://localhost:5432/petstoredb` | JDBC connection URL |
| `db.username` | `JDBC_DATABASE_USERNAME` | `postgres` | PostgreSQL user |
| `db.password` | `JDBC_DATABASE_PASSWORD` | `postgres` | PostgreSQL password |
| `jwt.secret` | `JWT_SECRET` | 256-bit Hex Key | Secret for signing HMAC-SHA256 JWTs |
| `app.storage.upload-dir`| `APP_STORAGE_UPLOAD_DIR` | `uploads` | Host filesystem directory for pet photos |
| `app.cors.allowed-origins`| — | `http://localhost:4200,http://127.0.0.1:4200` | Allowed origins for CORS |

3. **Automatic Schema Migrations:**
   On application startup, Flyway automatically creates the database schema and seeds initial data:
   * `V1__init_schema.sql`: Categories, pets, status audit log, app users, and indexes.
   * `V2__seed_initial_data.sql`: Initial categories, sample pets, and the administrator account.

4. **Default Seed Administrator Account:**
   * **Username:** `admin`
   * **Password:** `Password123!`

---

## Building the Project

Ensure your environment is pointing to Java 21:

```powershell
# Windows PowerShell
$env:JAVA_HOME = "F:\Dev\jdk\openjdk-21"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path
mvn clean package
```

```bash
# Linux / macOS
export JAVA_HOME="/usr/lib/jvm/java-21-openjdk"
mvn clean package
```

### Build Artifacts Produced
* **Backend WAR Package:** `pet-store-web/target/petstore.war`
* **Frontend Static Bundle:** `pet-store-frontend/dist/pet-store-frontend/browser/`

### Running Backend Unit & Integration Tests
```bash
mvn test
```
All unit and integration test suites (domain bean validation, service layer mocks, storage service isolation, external configuration loading via `APP_CONFIG_DIR`, and JWT token generation & validation) will execute.

---

## Production Deployment Guide

This guide details how to deploy the **Backend WAR on Apache Tomcat** and the **Frontend SPA on Apache HTTP Server (`httpd`)**.

---

### Step 1: Deploy Backend on Apache Tomcat (10.1+ / 11+)

> [!IMPORTANT]
> **Servlet 6.0 Requirement:** You must use **Tomcat 10.1+** or **Tomcat 11+**. Tomcat 9 and older will fail because Spring 7 uses the `jakarta.servlet.*` namespace (not `javax.servlet.*`).

#### 1.1. Configure `APP_CONFIG_DIR` in Tomcat (`catalina.properties`)
Tomcat exposes properties defined in `catalina.properties` as standard Java System Properties.

Edit `$CATALINA_BASE/conf/catalina.properties` (Linux) or `%CATALINA_BASE%\conf\catalina.properties` (Windows) and add:

* **Linux:**
  ```properties
  APP_CONFIG_DIR=/var/petstore
  ```
* **Windows:**
  ```properties
  APP_CONFIG_DIR=C:/petstore
  ```

#### 1.2. Create External Configuration Directory & Property File
Create the folder structure `${APP_CONFIG_DIR}/apps/conf/`:

* **Linux:**
  ```bash
  sudo mkdir -p /var/petstore/apps/conf
  sudo mkdir -p /var/petstore/uploads
  sudo chown -R tomcat:tomcat /var/petstore
  sudo chmod 750 /var/petstore/uploads
  ```
* **Windows:**
  Create directories:
  * `C:\petstore\apps\conf`
  * `C:\petstore\uploads`

Create `${APP_CONFIG_DIR}/apps/conf/application.properties` (or `petstore.properties`):

```properties
# ==============================================================================
# Production Configuration: ${APP_CONFIG_DIR}/apps/conf/application.properties
# ==============================================================================

# Database Connection (HikariCP / PostgreSQL)
db.url=jdbc:postgresql://localhost:5432/petstoredb
db.username=postgres
db.password=YourSecurePasswordHere
db.pool.max-size=15
db.pool.min-idle=5

# Security & JWT Configuration (HMAC-SHA256 Secret)
jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
jwt.expiration-ms=86400000

# Local Filesystem Storage for Pet Photos
app.storage.upload-dir=/var/petstore/uploads

# CORS Allowed Origins
app.cors.allowed-origins=http://localhost:4200,http://petstore.example.com
```

#### 1.3. Configure Java Environment (`setenv`)
Set `JAVA_HOME` in Tomcat's environment script:

* **Linux (`$CATALINA_HOME/bin/setenv.sh`):**
  ```bash
  export JAVA_HOME="/usr/lib/jvm/java-21-openjdk"
  ```
  *(Remember to make it executable: `chmod +x $CATALINA_HOME/bin/setenv.sh`)*

* **Windows (`%CATALINA_HOME%\bin\setenv.bat`):**
  ```bat
  set "JAVA_HOME=F:\Dev\jdk\openjdk-21"
  ```

#### 1.4. Deploy the WAR File
Copy the built WAR file to Tomcat's `webapps/` folder:

* **Option A: Context Path `/petstore` (Recommended)**
  ```bash
  cp pet-store-web/target/petstore.war $CATALINA_HOME/webapps/petstore.war
  ```
  The API will be available at `http://localhost:8080/petstore/api/...`

* **Option B: Root Context `/`**
  ```bash
  rm -rf $CATALINA_HOME/webapps/ROOT
  cp pet-store-web/target/petstore.war $CATALINA_HOME/webapps/ROOT.war
  ```
  The API will be available at `http://localhost:8080/api/...`

#### 1.5. Start Tomcat
```bash
# Linux
$CATALINA_HOME/bin/startup.sh

# Windows
%CATALINA_HOME%\bin\startup.bat
```
Monitor logs in `$CATALINA_HOME/logs/catalina.out`. The application will log:
```text
INFO  c.p.web.config.ExternalConfigLoader - Resolved external configuration directory: /var/petstore/apps/conf
INFO  c.p.web.config.ExternalConfigLoader - Found external property file: /var/petstore/apps/conf/application.properties
INFO  c.p.w.i.ExternalConfigApplicationContextInitializer - Registered external property source 'externalConfig:application.properties'
```

---

### Step 2: Deploy Frontend on Apache HTTP Server (`httpd`)

#### 2.1. Copy Angular Distribution Assets
Copy the compiled contents of `pet-store-frontend/dist/pet-store-frontend/browser/` into your Apache document root:

```bash
sudo mkdir -p /var/www/petstore
sudo cp -r pet-store-frontend/dist/pet-store-frontend/browser/* /var/www/petstore/
sudo chown -R www-data:www-data /var/www/petstore
```

#### 2.2. Enable Required Apache Modules
Ensure the following modules are loaded in `httpd.conf` (or via `a2enmod` on Debian/Ubuntu):
* `mod_rewrite`
* `mod_proxy`
* `mod_proxy_http`
* `mod_headers`

```bash
# Ubuntu / Debian
sudo a2enmod rewrite proxy proxy_http headers
```

#### 2.3. Configure Apache VirtualHost
Create a VirtualHost configuration file (e.g., `/etc/apache2/sites-available/petstore.conf` or `/etc/httpd/conf.d/petstore.conf`):

```apache
<VirtualHost *:80>
    ServerName petstore.example.com
    ServerAdmin admin@petstore.internal

    DocumentRoot "/var/www/petstore"

    # ==============================================================
    # 1. Reverse Proxy: Forward /api and media requests to Tomcat
    # ==============================================================
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto expr=%{REQUEST_SCHEME}

    # If Tomcat is hosting petstore.war at context /petstore:
    ProxyPass        /api http://127.0.0.1:8080/petstore/api
    ProxyPassReverse /api http://127.0.0.1:8080/petstore/api

    # (If Tomcat is hosting as ROOT.war, use:
    #  ProxyPass        /api http://127.0.0.1:8080/api
    #  ProxyPassReverse /api http://127.0.0.1:8080/api)

    # ==============================================================
    # 2. Angular SPA Static Asset Serving & HTML5 Fallback Routing
    # ==============================================================
    <Directory "/var/www/petstore">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted

        RewriteEngine On

        # Do not rewrite /api requests (forwarded by mod_proxy above)
        RewriteRule ^api/ - [L]

        # Serve static assets (js, css, icons, images) if they exist
        RewriteCond %{REQUEST_FILENAME} -f [OR]
        RewriteCond %{REQUEST_FILENAME} -d
        RewriteRule ^ - [L]

        # Fallback all other client-side routes (e.g., /admin/inventory) to index.html
        RewriteRule ^ index.html [L]
    </Directory>

    # High performance cache headers for hashed production bundles
    <FilesMatch "\.(js|css|webp|png|jpg|jpeg|svg|ico)$">
        Header set Cache-Control "max-age=31536000, public, immutable"
    </FilesMatch>

    # Disable caching for index.html so frontend updates reflect immediately
    <Files "index.html">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </Files>

    ErrorLog ${APACHE_LOG_DIR}/petstore_error.log
    CustomLog ${APACHE_LOG_DIR}/petstore_access.log combined
</VirtualHost>
```

#### 2.4. Activate Site & Restart Apache
```bash
# Ubuntu / Debian
sudo a2ensite petstore.conf
sudo systemctl restart apache2

# RHEL / CentOS / Fedora
sudo systemctl restart httpd
```

---

## Verification & Smoke Test

1. **Verify Backend Directly (Tomcat):**
   * Visit: `http://localhost:8080/petstore/api/pets` (or `http://localhost:8080/api/pets`)
   * Expected: HTTP 200 with JSON payload containing seeded pets (`Bailey`, `Rocky`, `Luna`, etc.).

2. **Verify Reverse Proxy (Apache HTTPD):**
   * Visit: `http://<your-server-ip>/api/pets`
   * Expected: HTTP 200 with identical JSON response forwarded through Apache HTTPD.

3. **Verify Angular Client:**
   * Open `http://<your-server-ip>/` in a web browser.
   * Browse available pets, search by breed, filter by species, and toggle between Grid and List views.

4. **Verify Admin Workflows & File Uploads:**
   * Click **Admin Sign In** in the top navigation.
   * Sign in with:
     * **Username:** `admin`
     * **Password:** `Password123!`
   * Go to **Admin Inventory** (`/admin/inventory`).
   * Test:
     * Adding a new pet with an uploaded image.
     * Modifying a pet status (`AVAILABLE` → `PENDING` → `ADOPTED`).
     * Direct browser page reload on `/admin/inventory` to verify Apache HTML5 fallback rewriting.

---

## REST API Summary

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns JWT bearer token |
| `GET` | `/api/auth/me` | Authenticated | Retrieves profile of currently authenticated user |
| `GET` | `/api/pets` | Public | Paginated, filtered, and sorted catalog of pets |
| `GET` | `/api/pets/{id}` | Public | Detailed pet profile |
| `POST` | `/api/pets` | `ROLE_ADMIN` | Creates a new pet record |
| `PUT` | `/api/pets/{id}` | `ROLE_ADMIN` | Updates an existing pet record |
| `PATCH`| `/api/pets/{id}/status` | `ROLE_ADMIN` | Updates pet status (`AVAILABLE`, `PENDING`, `ADOPTED`) |
| `DELETE`| `/api/pets/{id}` | `ROLE_ADMIN` | Deletes pet record and removes stored image |
| `GET` | `/api/pets/categories` | Public | Returns all distinct pet categories |
| `GET` | `/api/pets/breeds` | Public | Returns distinct breeds (optional `?category=...` query) |
| `POST` | `/api/media/upload` | `ROLE_ADMIN` | Multipart upload for pet photo (returns URL) |
| `GET` | `/api/media/{filename}`| Public | High-performance streaming of pet image with caching headers |

---

## Specification Documentation

For in-depth technical details, consult the project markdown specifications:
* [REQUIREMENTS.md](file:///f:/Dev/git/pet-store-project/REQUIREMENTS.md) — Functional requirements, user roles, and data constraints.
* [ARCHITECTURE.md](file:///f:/Dev/git/pet-store-project/ARCHITECTURE.md) — Multi-module architecture, security filter chain, and storage pipeline.
* [API_SPEC.md](file:///f:/Dev/git/pet-store-project/API_SPEC.md) — Detailed REST contracts, DTO records, and RFC 7807 error structures.
* [SCHEMA.md](file:///f:/Dev/git/pet-store-project/SCHEMA.md) — PostgreSQL DDL schema, foreign key constraints, and Flyway migration scripts.
* [TODO.md](file:///f:/Dev/git/pet-store-project/TODO.md) — Implementation verification checklist.

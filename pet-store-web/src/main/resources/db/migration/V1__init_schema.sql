-- ==============================================================================
-- Migration V1: Initial Schema Definition
-- Database: PostgreSQL 16+
-- ==============================================================================

-- Enable PostgreSQL Trigram Extension for fuzzy/text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Taxonomy Categories Table
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    display_order INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_categories_name UNIQUE (name)
);

-- 2. Pets Primary Entity Table
CREATE TABLE pets (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    breed VARCHAR(60) NOT NULL,
    age_months INT NOT NULL,
    price NUMERIC(9, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    description TEXT,
    photo_url VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pets_category FOREIGN KEY (category_id) 
        REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT chk_pets_age CHECK (age_months >= 0 AND age_months <= 360),
    CONSTRAINT chk_pets_price CHECK (price >= 0.00),
    CONSTRAINT chk_pets_status CHECK (status IN ('AVAILABLE', 'PENDING', 'ADOPTED'))
);

-- 3. Pet Status Audit Trail Table
CREATE TABLE pet_status_audit (
    id BIGSERIAL PRIMARY KEY,
    pet_id BIGINT NOT NULL,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by VARCHAR(50),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_pet FOREIGN KEY (pet_id) 
        REFERENCES pets(id) ON DELETE CASCADE
);

-- 4. Application Users & Security Credentials Table
CREATE TABLE app_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'ROLE_ADMIN',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- Performance & Query B-Tree Indexes
CREATE INDEX idx_pets_status_created ON pets(status, created_at DESC);
CREATE INDEX idx_pets_category_status ON pets(category_id, status);
CREATE INDEX idx_pets_breed ON pets(breed);
CREATE INDEX idx_pets_price ON pets(price);

-- GIN Trigram Search Indexes
CREATE INDEX idx_pets_name_trgm ON pets USING gin (name gin_trgm_ops);
CREATE INDEX idx_pets_breed_trgm ON pets USING gin (breed gin_trgm_ops);

-- ==============================================================================
-- Migration V5: Search Optimization Composite and Trigram Indexes
-- Database: PostgreSQL 16+
-- ==============================================================================

-- 1. Composite index for Category, Breed, and Status combined searches
CREATE INDEX IF NOT EXISTS idx_pets_category_breed_status 
ON pets (category_id, breed, status);

-- 2. Composite index for price range queries on available pets
CREATE INDEX IF NOT EXISTS idx_pets_status_price 
ON pets (status, price);

-- 3. Trigram index for description search
CREATE INDEX IF NOT EXISTS idx_pets_description_trgm 
ON pets USING gin (description gin_trgm_ops);

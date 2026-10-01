-- ==============================================================================
-- Migration V2: Baseline Data Seeding
-- Default Categories, System Admin Account, and Initial Pet Catalog
-- ==============================================================================

-- 1. Taxonomy Categories
INSERT INTO categories (name, description, display_order) VALUES
('Dog', 'Canine companions of all breeds and ages', 1),
('Cat', 'Feline friends, kittens, and domestic breeds', 2),
('Bird', 'Parrots, canaries, and companion birds', 3),
('Fish', 'Freshwater and saltwater aquarium fish', 4),
('Reptile', 'Turtles, lizards, and terrarium pets', 5),
('Small Animal', 'Rabbits, hamsters, guinea pigs', 6),
('Other', 'Miscellaneous pet varieties', 7)
ON CONFLICT (name) DO NOTHING;

-- 2. System Administrator Account
-- Username: admin
-- Email: admin@petstore.internal
-- Default Password: Password123!
-- BCrypt (cost factor 12) hash for "Password123!"
INSERT INTO app_users (username, email, password_hash, role, enabled) VALUES
('admin', 'admin@petstore.internal', '$2a$12$K1R1E71o.zD0aZ0p2kXQ3uG0o1o7o6q7j9z8m1w4x2y6r5p3n7l8a', 'ROLE_ADMIN', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 3. Sample Pet Listings
INSERT INTO pets (category_id, name, breed, age_months, price, status, description, photo_url) VALUES
(1, 'Bailey', 'Golden Retriever', 24, 450.00, 'AVAILABLE', 'Friendly, energetic, fully vaccinated, and loves swimming.', NULL),
(1, 'Rocky', 'German Shepherd', 36, 500.00, 'AVAILABLE', 'Alert, highly intelligent, trained in basic commands and leash walking.', NULL),
(2, 'Luna', 'Siamese', 14, 300.00, 'AVAILABLE', 'Affectionate and vocal companion who enjoys lounging in sunny spots.', NULL),
(2, 'Oliver', 'Maine Coon', 8, 420.00, 'PENDING', 'Large, gentle kitten with silky coat and sociable temperament.', NULL),
(3, 'Kiwi', 'Budgerigar', 6, 45.00, 'AVAILABLE', 'Cheerful whistler with bright green and yellow plumage.', NULL),
(5, 'Spike', 'Bearded Dragon', 18, 120.00, 'ADOPTED', 'Calm and easy to handle; well acclimated to terrarium living.', NULL);

-- ==============================================================================
-- Migration V11: Seed Comprehensive Pet Care Supplies & Additional Available Pets
-- Database: PostgreSQL 16+
-- ==============================================================================

-- 1. Additional Pets in AVAILABLE status across diverse taxonomy categories
INSERT INTO pets (category_id, name, breed, age_months, price, status, description, photo_url) VALUES
(1, 'Charlie', 'Labrador Retriever', 12, 420.00, 'AVAILABLE', 'Playful and eager to learn, loves fetch and swimming, great with children.', 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=600'),
(1, 'Bella', 'Standard Poodle', 10, 390.00, 'AVAILABLE', 'Hypoallergenic, exceptionally smart, already knows sit, stay, and paw.', 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600'),
(1, 'Cooper', 'Beagle', 14, 340.00, 'AVAILABLE', 'Curious and friendly scent hound with a gentle temperament and sweet howl.', 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=600'),
(1, 'Daisy', 'French Bulldog', 8, 580.00, 'AVAILABLE', 'Compact, affectionate companion with adorable bat ears and easy-going indoor demeanor.', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600'),
(2, 'Milo', 'British Shorthair', 12, 350.00, 'AVAILABLE', 'Plush blue-gray coat, calm disposition, content with quiet lounging and lap cuddles.', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600'),
(2, 'Cleo', 'Bengal Cat', 15, 460.00, 'AVAILABLE', 'Stunning leopard-like rosettes, energetic, athletic, loves vertical climbing perches.', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600'),
(2, 'Jasper', 'Domestic Longhair', 6, 210.00, 'AVAILABLE', 'Fluffy tuxedo kitten, purrs loudly when brushed, loves chasing feather wands.', 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=600'),
(3, 'Sunny', 'Cockatiel', 8, 65.00, 'AVAILABLE', 'Hand-tamed whistler with bright orange cheek patches, loves whistling cheerful tunes.', 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600'),
(3, 'Blue', 'Peach-faced Lovebird', 5, 55.00, 'AVAILABLE', 'Vibrant turquoise feathers, social and bond-oriented, enjoys resting on your shoulder.', 'https://images.unsplash.com/photo-1522858547550-3405742f1607?w=600'),
(4, 'Rainbow', 'Halfmoon Betta', 3, 16.00, 'AVAILABLE', 'Striking iridescent blue and red fin plumage, healthy and swimming actively in freshwater.', 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600'),
(4, 'Neon', 'Neon Tetra School', 2, 28.00, 'AVAILABLE', 'Peaceful schooling community fish (pack of 8), glowing neon-blue and crimson stripes.', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600'),
(4, 'Goldie', 'Oranda Fancy Goldfish', 4, 32.00, 'AVAILABLE', 'Calm fancy goldfish with distinctive red cap wen and flowing double tail.', 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=600'),
(5, 'Yoshi', 'Leopard Gecko', 12, 85.00, 'AVAILABLE', 'Docile, easy-to-handle spotted gecko, excellent starter reptile feeding on mealworms.', 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?w=600'),
(5, 'Shelly', 'Russian Tortoise', 24, 160.00, 'AVAILABLE', 'Hardy herbivorous terrestrial tortoise, active forager, loves fresh dandelion greens.', 'https://images.unsplash.com/photo-1508455858334-95337ba25607?w=600'),
(6, 'Pip', 'Holland Lop Rabbit', 6, 75.00, 'AVAILABLE', 'Velvety lop ears, litter-box trained, inquisitive bunny that loves exploring obstacle tunnels.', 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600'),
(6, 'Peanut', 'Golden Syrian Hamster', 3, 24.00, 'AVAILABLE', 'Curious, nocturnal burrower with cute cheek pouches, loves running on silent exercise wheels.', 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600');

-- 2. Comprehensive Pet Care & Physical Supplies Seeding
INSERT INTO supplies (sku, name, category, price, stock_quantity, low_stock_threshold, status, item_type, description, photo_url) VALUES
-- Food
('SUP-FOOD-001', 'Royal Canin Adult Canine Nutrition (15kg)', 'Food', 59.99, 45, 5, 'ACTIVE', 'MULTIPLE', 'Tailored balanced nutritional kibble supporting joint mobility and coat shine in adult dogs.', 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600'),
('SUP-FOOD-002', 'Hill''s Science Diet Indoor Feline Formula (7kg)', 'Food', 42.50, 35, 5, 'ACTIVE', 'MULTIPLE', 'Optimal fiber blend for healthy digestion and natural hairball control in indoor domestic cats.', 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600'),
('SUP-FOOD-003', 'Kaytee Forti-Diet Pro Health Bird Seed Blend (2kg)', 'Food', 14.99, 25, 5, 'ACTIVE', 'MULTIPLE', 'Enriched seed and grain diet with omega-3, DHA, and probiotics for companion birds.', 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600'),
('SUP-FOOD-004', 'TetraMin Tropical Fish Nutrient Flakes (200g)', 'Food', 9.99, 50, 10, 'ACTIVE', 'MULTIPLE', 'Clean and clear water formula providing complete nutrition for freshwater aquarium species.', 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600'),
('SUP-FOOD-005', 'Zoo Med Can O'' Crickets Terrarium Food (35g)', 'Food', 7.99, 30, 5, 'ACTIVE', 'MULTIPLE', 'Cooked crickets retaining moisture and nutrients for insectivorous reptiles and amphibians.', 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?w=600'),
('SUP-FOOD-006', 'Oxbow Western Timothy Hay for Small Pets (1.1kg)', 'Food', 16.50, 40, 8, 'ACTIVE', 'MULTIPLE', 'High-fiber botanical hay supporting digestive gastrointestinal motility in rabbits and guinea pigs.', 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600'),

-- Healthcare & Grooming
('SUP-HLTH-001', 'PetArmor Plus Flea & Tick Treatment for Dogs (3 Doses)', 'Healthcare', 34.99, 25, 5, 'ACTIVE', 'MULTIPLE', 'Fast-acting, waterproof topical preventative killing fleas, ticks, and chewing lice.', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600'),
('SUP-HLTH-002', 'Virbac CET Enzymatic Pet Dental Toothpaste Kit', 'Healthcare', 18.99, 30, 5, 'ACTIVE', 'MULTIPLE', 'Dual-enzyme toothpaste formula with poultry flavor plus dual-ended toothbrush for dogs and cats.', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600'),
('SUP-HLTH-003', 'Zymox Otic Enzymatic Ear Solution (37ml)', 'Healthcare', 24.99, 20, 4, 'ACTIVE', 'MULTIPLE', 'Relieves external ear infections, itching, and inflammation without antibiotics or harsh cleaners.', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600'),
('SUP-HLTH-004', 'Nutri-Vet Multi-Vitamins & Joint Glucosamine Chews', 'Healthcare', 21.50, 28, 5, 'ACTIVE', 'MULTIPLE', 'Liver-flavored chewables formulated to promote cartilage development and overall pet vitality.', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600'),
('SUP-HLTH-005', 'Burt''s Bees All-Natural Oatmeal Soothing Dog Shampoo (473ml)', 'Healthcare', 12.99, 35, 6, 'ACTIVE', 'MULTIPLE', 'Made with colloidal oat flour and honey to deeply moisturize dry, itchy skin gently.', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600'),

-- Toys
('SUP-TOY-001', 'KONG Classic Durable Rubber Dog Toy (Large)', 'Toys', 14.99, 40, 8, 'ACTIVE', 'MULTIPLE', 'Ultra-durable natural red rubber formula for dogs that love to chew, bounce, and fetch peanut butter.', 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=600'),
('SUP-TOY-002', 'PetSafe Bolt Interactive Automatic Laser Cat Toy', 'Toys', 22.99, 22, 5, 'ACTIVE', 'MULTIPLE', 'Automated rotating mirror shines random laser patterns on floors and walls with 15-minute auto-timer.', 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=600'),
('SUP-TOY-003', 'Prevue Pet Products Natural Bird Rope Perch & Swing', 'Toys', 11.50, 18, 4, 'ACTIVE', 'MULTIPLE', 'Multi-color flexible woven cotton rope perch providing foot exercise and cage entertainment.', 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600'),
('SUP-TOY-004', 'Kaytee Woodland Get-A-Way Wooden Hideout Castle', 'Toys', 8.99, 25, 5, 'ACTIVE', 'MULTIPLE', 'All-natural pine hideaway promoting natural nesting instincts and safe chewing for small pets.', 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600'),

-- Accessories
('SUP-ACC-001', 'Ruffwear Front Range Ergonomic Dog Harness', 'Accessories', 44.95, 15, 3, 'ACTIVE', 'MULTIPLE', 'Padded everyday harness with two leash attachment points and reflective trim for nighttime safety.', 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600'),
('SUP-ACC-002', 'Heavy-Duty Stainless Steel Weighted Non-Skid Pet Bowl', 'Accessories', 13.50, 50, 10, 'ACTIVE', 'MULTIPLE', 'Dishwasher-safe food-grade stainless steel with non-slip silicone rubber ring base.', 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600'),
('SUP-ACC-003', 'AquaClear 50 Multi-Stage Power Aquarium Filter', 'Accessories', 49.99, 12, 3, 'ACTIVE', 'MULTIPLE', 'Superior contact time with filter media and energy-efficient pump for crystal-clear aquarium water.', 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600'),
('SUP-ACC-004', 'Exo Terra Reptile Habitat Daylight/Night LED Lamp', 'Accessories', 29.99, 15, 3, 'ACTIVE', 'MULTIPLE', 'Touch-controlled daylight and moonlight simulation fixture for tropical and desert terrariums.', 'https://images.unsplash.com/photo-1508455858334-95337ba25607?w=600')
ON CONFLICT (sku) DO NOTHING;

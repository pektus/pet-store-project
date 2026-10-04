-- ==============================================================================
-- Migration V3: Update Administrator BCrypt Password Hash
-- Fixes invalid salt in initial seed data for user "admin"
-- Password: Password123!
-- BCrypt (cost factor 12) hash: $2a$12$saMcuvLhvb.6VnTEEdCqxOKgOxYQMUfchtTyWaUVd6X4hn2A1pODK
-- ==============================================================================

UPDATE app_users
SET password_hash = '$2a$12$saMcuvLhvb.6VnTEEdCqxOKgOxYQMUfchtTyWaUVd6X4hn2A1pODK'
WHERE username = 'admin';

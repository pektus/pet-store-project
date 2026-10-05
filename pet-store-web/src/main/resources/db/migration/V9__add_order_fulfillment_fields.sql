-- ==============================================================================
-- Migration V9: Add order fulfillment, carrier tracking, and cancellation fields
-- Database: PostgreSQL 16+
-- ==============================================================================

ALTER TABLE orders
    ADD COLUMN carrier VARCHAR(50),
    ADD COLUMN tracking_number VARCHAR(100),
    ADD COLUMN cancellation_reason VARCHAR(255),
    ADD COLUMN cancelled_at TIMESTAMPTZ,
    ADD COLUMN shipped_at TIMESTAMPTZ,
    ADD COLUMN delivered_at TIMESTAMPTZ;

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_tracking_number ON orders(tracking_number);

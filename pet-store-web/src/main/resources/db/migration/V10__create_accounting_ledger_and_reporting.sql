-- ==============================================================================
-- Migration V10: Create Accounting Ledger and Financial Reporting Structures
-- Database: PostgreSQL 16+
-- ==============================================================================

-- 1. Accounting Ledger Table
CREATE TABLE accounting_ledger (
    id BIGSERIAL PRIMARY KEY,
    transaction_type VARCHAR(20) NOT NULL,
    order_id BIGINT,
    order_number VARCHAR(32) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CREDIT_CARD',
    card_brand VARCHAR(20),
    card_last_four VARCHAR(4),
    external_reference VARCHAR(64) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_accounting_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    CONSTRAINT chk_ledger_type CHECK (transaction_type IN ('PAYMENT', 'REFUND')),
    CONSTRAINT chk_ledger_amount CHECK (amount >= 0)
);

CREATE INDEX idx_ledger_type ON accounting_ledger(transaction_type);
CREATE INDEX idx_ledger_order_number ON accounting_ledger(order_number);
CREATE INDEX idx_ledger_created_at ON accounting_ledger(created_at);

-- 2. Backfill existing orders into accounting ledger
INSERT INTO accounting_ledger (
    transaction_type, order_id, order_number, amount, payment_method, 
    card_brand, card_last_four, external_reference, description, created_at
)
SELECT 
    'PAYMENT', id, order_number, total_amount, payment_method, 
    card_brand, card_last_four, transaction_id, 'Initial order checkout payment', created_at
FROM orders;

-- Backfill refunds for already cancelled orders
INSERT INTO accounting_ledger (
    transaction_type, order_id, order_number, amount, payment_method, 
    card_brand, card_last_four, external_reference, description, created_at
)
SELECT 
    'REFUND', id, order_number, total_amount, payment_method, 
    card_brand, card_last_four, CONCAT('REF-', transaction_id), 'Order cancellation refund', COALESCE(cancelled_at, updated_at)
FROM orders 
WHERE status = 'CANCELLED' AND payment_status = 'REFUNDED';

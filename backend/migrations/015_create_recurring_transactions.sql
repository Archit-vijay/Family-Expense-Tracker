-- Migration 015: Create recurring_transactions table and link to transactions

CREATE TABLE IF NOT EXISTS recurring_transactions (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    next_due_date DATE NOT NULL,
    last_processed_date DATE DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    is_subscription BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_recurring_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_recurring_member
        FOREIGN KEY (member_id)
        REFERENCES family_members(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_recurring_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_recurring_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT positive_recurring_amount
        CHECK (amount > 0),
    CONSTRAINT valid_recurring_type
        CHECK (type IN ('income', 'expense')),
    CONSTRAINT valid_recurring_frequency
        CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    CONSTRAINT valid_recurring_status
        CHECK (status IN ('active', 'paused', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_recurring_family ON recurring_transactions(family_id);
CREATE INDEX IF NOT EXISTS idx_recurring_due ON recurring_transactions(family_id, status, next_due_date);

-- Add optional foreign key to transactions linking back to parent recurring schedule
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS recurring_transaction_id INTEGER DEFAULT NULL REFERENCES recurring_transactions(id) ON DELETE SET NULL;

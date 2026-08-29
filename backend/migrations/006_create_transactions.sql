CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_transaction_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_transaction_member
        FOREIGN KEY (member_id)
        REFERENCES family_members(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_transaction_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_transaction_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT positive_transaction_amount
        CHECK (amount > 0),
    CONSTRAINT valid_transaction_type
        CHECK (type IN ('income', 'expense'))
);
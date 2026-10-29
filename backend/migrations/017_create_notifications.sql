-- Migration 017: Create notifications table for in-app financial alerts and reminders

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'budget_warning', 'budget_exceeded', 'bill_due_soon', 'bill_overdue', 'anomaly', 'system'
    severity VARCHAR(20) NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    metadata JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_family_read ON notifications(family_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_family_created ON notifications(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type_family ON notifications(type, family_id);

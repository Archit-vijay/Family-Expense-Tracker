CREATE TABLE IF NOT EXISTS family_invitations (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    family_member_id INTEGER NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invitation_family
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invitation_family_member
        FOREIGN KEY (family_member_id)
        REFERENCES family_members(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_family_invitations_token
    ON family_invitations(token);

CREATE INDEX IF NOT EXISTS idx_family_invitations_family_member
    ON family_invitations(family_member_id);
-- db/schema.sql
-- Military Asset Management System — PostgreSQL schema.
-- Run via: npm run db:init  (executes this file against DATABASE_URL)

-- Enable case-insensitive-safe text if needed later; not required for now.

CREATE TABLE IF NOT EXISTS bases (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    location    VARCHAR(150) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id             SERIAL PRIMARY KEY,
    username       VARCHAR(50) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    full_name      VARCHAR(150) NOT NULL,
    role           VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')),
    base_id        INT REFERENCES bases(id) ON DELETE SET NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment_types (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    category  VARCHAR(30) NOT NULL CHECK (category IN ('VEHICLE', 'WEAPON', 'AMMUNITION')),
    unit      VARCHAR(30) NOT NULL DEFAULT 'unit',
    UNIQUE (name, category)
);

CREATE TABLE IF NOT EXISTS purchases (
    id                 SERIAL PRIMARY KEY,
    base_id            INT NOT NULL REFERENCES bases(id),
    equipment_type_id  INT NOT NULL REFERENCES equipment_types(id),
    quantity           INT NOT NULL CHECK (quantity > 0),
    unit_cost          NUMERIC(12, 2),
    supplier           VARCHAR(150),
    recorded_by_id     INT NOT NULL REFERENCES users(id),
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_purchases_base ON purchases(base_id);
CREATE INDEX IF NOT EXISTS idx_purchases_equipment ON purchases(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created ON purchases(created_at);

CREATE TABLE IF NOT EXISTS transfers (
    id                     SERIAL PRIMARY KEY,
    source_base_id         INT NOT NULL REFERENCES bases(id),
    destination_base_id    INT NOT NULL REFERENCES bases(id),
    equipment_type_id      INT NOT NULL REFERENCES equipment_types(id),
    quantity               INT NOT NULL CHECK (quantity > 0),
    status                 VARCHAR(20) NOT NULL DEFAULT 'COMPLETED'
                           CHECK (status IN ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
    initiated_by_id        INT NOT NULL REFERENCES users(id),
    created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (source_base_id <> destination_base_id)
);
CREATE INDEX IF NOT EXISTS idx_transfers_source ON transfers(source_base_id);
CREATE INDEX IF NOT EXISTS idx_transfers_destination ON transfers(destination_base_id);
CREATE INDEX IF NOT EXISTS idx_transfers_equipment ON transfers(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_transfers_created ON transfers(created_at);

CREATE TABLE IF NOT EXISTS assignments (
    id                      SERIAL PRIMARY KEY,
    base_id                 INT NOT NULL REFERENCES bases(id),
    equipment_type_id       INT NOT NULL REFERENCES equipment_types(id),
    quantity                INT NOT NULL CHECK (quantity > 0),
    personnel_name          VARCHAR(150) NOT NULL,
    personnel_service_id    VARCHAR(50),
    assigned_by_id          INT NOT NULL REFERENCES users(id),
    status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RETURNED')),
    assigned_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    returned_at             TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assignments_base ON assignments(base_id);
CREATE INDEX IF NOT EXISTS idx_assignments_equipment ON assignments(equipment_type_id);

CREATE TABLE IF NOT EXISTS expenditures (
    id                  SERIAL PRIMARY KEY,
    base_id             INT NOT NULL REFERENCES bases(id),
    equipment_type_id   INT NOT NULL REFERENCES equipment_types(id),
    quantity            INT NOT NULL CHECK (quantity > 0),
    reason              VARCHAR(255) NOT NULL,
    reported_by_id      INT NOT NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_expenditures_base ON expenditures(base_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_equipment ON expenditures(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_created ON expenditures(created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(50) NOT NULL CHECK (action IN ('PURCHASE', 'TRANSFER', 'ASSIGNMENT', 'EXPENDITURE', 'LOGIN', 'USER_CREATED')),
    details     TEXT NOT NULL,
    ip_address  VARCHAR(64),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

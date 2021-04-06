CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE account(
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_code VARCHAR(10) UNIQUE,
    name TEXT NOT NULL,
    place TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    department TEXT,
    class VARCHAR(10),
    year VARCHAR(3),
    role_id INT NOT NULl  REFERENCES role(id),
    is_active boolean DEFAULT true
)

CREATE TABLE role(
    id SERIAL PRIMARY KEY,
    name TEXT,
    availability JSONB
)
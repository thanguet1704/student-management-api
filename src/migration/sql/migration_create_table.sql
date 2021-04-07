CREATE TABLE role(
    id SERIAL PRIMARY KEY,
    name TEXT,
    ability TEXT[]
)

CREATE TABLE account(
    id SERIAL PRIMARY KEY,
    user_code VARCHAR(10) UNIQUE,
    password TEXT NOT NULL,
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

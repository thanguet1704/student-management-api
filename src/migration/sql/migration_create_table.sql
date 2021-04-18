CREATE TABLE role(
    id SERIAL PRIMARY KEY,
    name TEXT,
    ability TEXT[]
)

CREATE TABLE account(
    id SERIAL PRIMARY KEY,
    username VARCHAR(10) UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    institua_id INT REFERENCES institua(id),
    class_id INT REFERENCES class(id),
    year VARCHAR(3),
    role_id INT NOT NULl  REFERENCES role(id),
    admin_id INT NOT NULl  REFERENCES admin(id),
    is_active boolean DEFAULT true
)

CREATE TABLE admin(
    id SERIAL PRIMARY KEY,
    username VARCHAR(10) UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role_id INT NOT NULl  REFERENCES role(id)
)

CREATE TABLE class(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    room VARCHAR(10)
)

CREATE TABLE subject(
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL
)

CREATE TABLE category(
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    subject_id INT REFERENCES subject(id)
)

CREATE TABLE schedule(
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES category(id),
    class_id INT REFERENCES class(id),
    time TIMESTAMP WITH TIME ZONE,
    period TEXT,
    startDate TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    endDate TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    account_id INT REFERENCES account(id),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

CREATE TABLE attendence(
    id SERIAL PRIMARY KEY,
    schedule_id INT REFERENCES schedule(id),
    student_id INT REFERENCES account(id),
    time_in TIMESTAMP WITH TIME ZONE,
    time_out TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)


CREATE TABLE institua(
    id SERIAL PRIMARY KEY,
    name TEXT
)

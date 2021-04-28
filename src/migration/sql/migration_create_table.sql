CREATE TABLE role(
    id SERIAL PRIMARY KEY,
    name TEXT,
    ability TEXT[]
);

CREATE TABLE school_year(
    id SERIAL PRIMARY KEY,
    name TEXT
);

CREATE TABLE class(
    id SERIAL PRIMARY KEY,
    name TEXT
);

CREATE TABLE classroom(
    id SERIAL PRIMARY KEY,
    name TEXT,
    camera_id TEXT[]
);

CREATE TABLE subject(
    id SERIAL PRIMARY KEY,
    name TEXT
);

CREATE TABLE category(
    id SERIAL PRIMARY KEY,
    title TEXT,
    lession INT,
    subject_id INT REFERENCES subject(id)
);

CREATE TABLE session(
    id SERIAL PRIMARY KEY,
    title TEXT,
    start_time TIME,
    end_date TIME
);

CREATE TABLE institua(
    id SERIAL PRIMARY KEY,
    name TEXT
);

CREATE TABLE account(
    id SERIAL PRIMARY KEY,
    username VARCHAR(36) UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    school_year_id INT REFERENCES school_year(id),
    role_id INT NOT NULl  REFERENCES role(id),
    is_active boolean DEFAULT true,
    class_id INT REFERENCES class(id),
    institua_id INT REFERENCES institua(id)
);

CREATE TABLE schedule(
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES category(id),
    class_id INT REFERENCES class(id),
    class_room_id INT REFERENCES classroom(id),
    account_id INT REFERENCES account(id),
    date TIMESTAMP WITH TIME ZONE,
    session_id INT REFERENCES session(id),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE attendence(
    id SERIAL PRIMARY KEY,
    schedule_id INT REFERENCES schedule(id),
    account_id INT REFERENCES account(id),
    time_in TIMESTAMP WITH TIME ZONE,
    time_out TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subject_schedule(
    id SERIAL PRIMARY KEY,
    schedule_id INT REFERENCES schedule(id),
    subject_id INT REFERENCES subject(id),
    start_date DATE,
    end_date DATE,
    final_exam_date TIMESTAMP WITH TIME ZONE
);

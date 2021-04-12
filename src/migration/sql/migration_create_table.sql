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
    department TEXT,
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

CREATE OR REPLACE FUNCTION norm_text_latin(character varying) 
  RETURNS character varying AS 
$BODY$ 
declare 
        p_str    alias for $1; 
        v_str    varchar; 
begin 
        select translate(p_str, 'ÀÁÂÃÄÅ', 'AAAAAA') into v_str; 
        select translate(v_str, 'ÉÈËÊ', 'EEEE') into v_str; 
        select translate(v_str, 'ÌÍÎÏ', 'IIII') into v_str; 
        select translate(v_str, 'ÌÍÎÏ', 'IIII') into v_str; 
        select translate(v_str, 'ÒÓÔÕÖ', 'OOOOO') into v_str; 
        select translate(v_str, 'ÙÚÛÜ', 'UUUU') into v_str; 
        select translate(v_str, 'àáâãäå', 'aaaaaa') into v_str; 
        select translate(v_str, 'èéêë', 'eeee') into v_str; 
        select translate(v_str, 'ìíîï', 'iiii') into v_str; 
        select translate(v_str, 'òóôõö', 'ooooo') into v_str; 
        select translate(v_str, 'ùúûü', 'uuuu') into v_str; 
        select translate(v_str, 'Çç', 'Cc') into v_str; 
        return v_str; 
end;$BODY$ 
  LANGUAGE 'plpgsql' VOLATILE; 

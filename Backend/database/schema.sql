-- Users

CREATE TABLE users (

    user_id INTEGER PRIMARY KEY AUTOINCREMENT,

    username TEXT NOT NULL,

    email TEXT UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- Healthcare: Patients

CREATE TABLE patients (

    patient_id INTEGER PRIMARY KEY AUTOINCREMENT,

    patient_name TEXT NOT NULL,

    age INTEGER,

    gender TEXT,

    city TEXT

);

-- Healthcare: Doctors

CREATE TABLE doctors (

    doctor_id INTEGER PRIMARY KEY AUTOINCREMENT,

    doctor_name TEXT NOT NULL,

    specialization TEXT,

    hospital_id INTEGER

);

-- Banking: Customers

CREATE TABLE customers (

    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,

    customer_name TEXT NOT NULL,

    email TEXT,

    city TEXT

);

-- Banking: Accounts

CREATE TABLE accounts (

    account_id INTEGER PRIMARY KEY AUTOINCREMENT,

    customer_id INTEGER,

    account_type TEXT,

    balance REAL,

    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)

);

-- Query History

CREATE TABLE query_history (

    history_id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER,

    query_text TEXT,

    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)

);

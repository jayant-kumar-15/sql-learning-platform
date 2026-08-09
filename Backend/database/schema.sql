-- ==========================================
-- USERS
-- ==========================================

CREATE TABLE users (

    user_id INTEGER PRIMARY KEY AUTOINCREMENT,

    username TEXT NOT NULL,

    email TEXT UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    role TEXT DEFAULT 'user',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
profile_picture TEXT,
is_active INTEGER DEFAULT 1

);

-- ==========================================
-- USER WORKSPACES (SANDBOX)
-- ==========================================

CREATE TABLE user_workspaces (

    workspace_id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    workspace_name TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)

);

-- ==========================================
-- QUERY HISTORY
-- ==========================================

CREATE TABLE query_history (

    history_id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    query_text TEXT NOT NULL,

    execution_time REAL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    database_name TEXT,
query_status TEXT

);

-- ==========================================
-- SAVED QUERIES
-- ==========================================

CREATE TABLE saved_queries (

    query_id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    query_name TEXT,

    query_text TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)

);

-- ==========================================
-- CHALLENGES
-- ==========================================

CREATE TABLE challenges (

    challenge_id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,

    difficulty TEXT NOT NULL,

    category TEXT NOT NULL,

    question TEXT NOT NULL,

    hint_1 TEXT,

    hint_2 TEXT,

    solution TEXT,
    points INTEGER,
    time_limit_seconds INTEGER

);

-- ==========================================
-- CHALLENGE PROGRESS
-- ==========================================

CREATE TABLE challenge_progress (

    progress_id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    challenge_id INTEGER NOT NULL,

    completed INTEGER DEFAULT 0,

    completed_at TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id),

    FOREIGN KEY (challenge_id) REFERENCES challenges(challenge_id)

);

-- ==========================================
-- COMMENTS
-- ==========================================

CREATE TABLE comments (

    comment_id INTEGER PRIMARY KEY AUTOINCREMENT,

    challenge_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    comment_text TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (challenge_id) REFERENCES challenges(challenge_id),

    FOREIGN KEY (user_id) REFERENCES users(user_id)

);

-- ==========================================
-- HEALTHCARE : HOSPITALS
-- ==========================================

CREATE TABLE hospitals (

    hospital_id INTEGER PRIMARY KEY AUTOINCREMENT,

    hospital_name TEXT NOT NULL,

    city TEXT,

    state TEXT

);

-- ==========================================
-- DEPARTMENTS
-- ==========================================

CREATE TABLE departments (

    department_id INTEGER PRIMARY KEY AUTOINCREMENT,

    hospital_id INTEGER,

    department_name TEXT,

    FOREIGN KEY (hospital_id)
        REFERENCES hospitals(hospital_id)

);

-- ==========================================
-- DOCTORS
-- ==========================================

CREATE TABLE doctors (

    doctor_id INTEGER PRIMARY KEY AUTOINCREMENT,

    doctor_name TEXT NOT NULL,

    specialization TEXT,

    hospital_id INTEGER,

    department_id INTEGER,

    experience_years INTEGER,

    FOREIGN KEY (hospital_id)
        REFERENCES hospitals(hospital_id),

    FOREIGN KEY (department_id)
        REFERENCES departments(department_id)

);

-- ==========================================
-- PATIENTS
-- ==========================================

CREATE TABLE patients (

    patient_id INTEGER PRIMARY KEY AUTOINCREMENT,

    patient_name TEXT NOT NULL,

    age INTEGER,

    gender TEXT,

    city TEXT,

    phone TEXT,
    date_of_birth DATE,
blood_group TEXT

);

-- ==========================================
-- INSURANCE
-- ==========================================

CREATE TABLE insurance (

    insurance_id INTEGER PRIMARY KEY AUTOINCREMENT,

    insurance_company TEXT,

    insurance_type TEXT

);

-- ==========================================
-- APPOINTMENTS
-- ==========================================

CREATE TABLE appointments (

    appointment_id INTEGER PRIMARY KEY AUTOINCREMENT,

    patient_id INTEGER,

    doctor_id INTEGER,

    appointment_date DATE,

    status TEXT,

    FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id),

    FOREIGN KEY (doctor_id)
        REFERENCES doctors(doctor_id)

);

-- ==========================================
-- PRESCRIPTIONS
-- ==========================================

CREATE TABLE prescriptions (

    prescription_id INTEGER PRIMARY KEY AUTOINCREMENT,

    appointment_id INTEGER,

    medicine_name TEXT,

    dosage TEXT,

    FOREIGN KEY (appointment_id)
        REFERENCES appointments(appointment_id)

);

-- ==========================================
-- BILLING
-- ==========================================

CREATE TABLE billing (

    bill_id INTEGER PRIMARY KEY AUTOINCREMENT,

    patient_id INTEGER,

    amount REAL,

    payment_status TEXT,

    insurance_id INTEGER,

    FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id),

    FOREIGN KEY (insurance_id)
        REFERENCES insurance(insurance_id)

);

-- ==========================================
-- LAB REPORTS
-- ==========================================

CREATE TABLE lab_reports (

    report_id INTEGER PRIMARY KEY AUTOINCREMENT,

    patient_id INTEGER,

    report_type TEXT,

    result TEXT,

    report_date DATE,

    FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)

);

-- ==========================================
-- BANKING : BRANCHES
-- ==========================================

CREATE TABLE branches (

    branch_id INTEGER PRIMARY KEY AUTOINCREMENT,

    branch_name TEXT,

    city TEXT

);

-- ==========================================
-- CUSTOMERS
-- ==========================================

CREATE TABLE customers (

    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,

    customer_name TEXT NOT NULL,

    email TEXT,

    city TEXT,

    phone TEXT

);

-- ==========================================
-- EMPLOYEES
-- ==========================================

CREATE TABLE employees (

    employee_id INTEGER PRIMARY KEY AUTOINCREMENT,

    employee_name TEXT,

    branch_id INTEGER,

    designation TEXT,

    FOREIGN KEY (branch_id)
        REFERENCES branches(branch_id)

);

-- ==========================================
-- ACCOUNTS
-- ==========================================

CREATE TABLE accounts (

    account_id INTEGER PRIMARY KEY AUTOINCREMENT,

    customer_id INTEGER,

    branch_id INTEGER,

    account_type TEXT,

    balance REAL,

    FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id),

    FOREIGN KEY (branch_id)
        REFERENCES branches(branch_id),
    account_open_date DATE,
account_status TEXT

);

-- ==========================================
-- TRANSACTIONS
-- ==========================================

CREATE TABLE transactions (

    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,

    account_id INTEGER,

    amount REAL,

    transaction_type TEXT,

    transaction_date DATE,

    FOREIGN KEY (account_id)
        REFERENCES accounts(account_id),
    description TEXT

);

-- ==========================================
-- LOANS
-- ==========================================

CREATE TABLE loans (

    loan_id INTEGER PRIMARY KEY AUTOINCREMENT,

    customer_id INTEGER,

    loan_amount REAL,

    interest_rate REAL,

    status TEXT,

    FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)

);

-- ==========================================
-- CREDIT CARDS
-- ==========================================

CREATE TABLE credit_cards (

    card_id INTEGER PRIMARY KEY AUTOINCREMENT,

    customer_id INTEGER,

    card_number TEXT,

    card_type TEXT,

    expiry_date DATE,

    FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)

);

-- ==========================================
-- PAYMENTS
-- ==========================================

CREATE TABLE payments (

    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,

    account_id INTEGER,

    amount REAL,

    payment_method TEXT,

    payment_date DATE,

    FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)

);
    

-- ==========================================
-- REPLIES
-- ==========================================

CREATE TABLE replies (

    reply_id INTEGER PRIMARY KEY AUTOINCREMENT,

    comment_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    reply_text TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (comment_id)
        REFERENCES comments(comment_id),

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)

);

-- ==========================================
-- COMMENT LIKES
-- ==========================================

CREATE TABLE comment_likes (

    like_id INTEGER PRIMARY KEY AUTOINCREMENT,

    comment_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (comment_id)
        REFERENCES comments(comment_id),

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)

);

-- ==========================================
-- COMMENT REPORTS
-- ==========================================

CREATE TABLE comment_reports (

    report_id INTEGER PRIMARY KEY AUTOINCREMENT,

    comment_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    reason TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (comment_id)
        REFERENCES comments(comment_id),

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)

);
    ;

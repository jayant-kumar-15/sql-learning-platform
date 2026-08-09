-- ==========================================
-- USERS DATA
-- ==========================================

-- ==========================================
-- HEALTHCARE DATA
-- ==========================================

-- Hospitals

INSERT INTO hospitals
    (hospital_name, city, state)
VALUES
    ('Apollo Hospital', 'Mumbai', 'Maharashtra'),
    ('Fortis Hospital', 'Delhi', 'Delhi'),
    ('Ruby Hall Clinic', 'Pune', 'Maharashtra'),
    ('Care Hospital', 'Hyderabad', 'Telangana'),
    ('Manipal Hospital', 'Bangalore', 'Karnataka');

-- Departments

INSERT INTO departments
    (hospital_id, department_name)
VALUES
    (1, 'Cardiology'),
    (1, 'Neurology'),
    (2, 'Orthopedics'),
    (2, 'Pediatrics'),
    (3, 'Cardiology'),
    (3, 'General Medicine'),
    (4, 'Oncology'),
    (5, 'Neurology');

-- Doctors

INSERT INTO doctors
    (doctor_name, specialization, hospital_id, department_id, experience_years)
VALUES
    ('Dr. Arjun Mehta', 'Cardiologist', 1, 1, 15),
    ('Dr. Neha Sharma', 'Neurologist', 1, 2, 10),
    ('Dr. Raj Malhotra', 'Orthopedic Surgeon', 2, 3, 12),
    ('Dr. Priya Kapoor', 'Pediatrician', 2, 4, 8),
    ('Dr. Amit Desai', 'Cardiologist', 3, 5, 14),
    ('Dr. Sneha Rao', 'General Physician', 3, 6, 7),
    ('Dr. Vikram Reddy', 'Oncologist', 4, 7, 18),
    ('Dr. Anjali Nair', 'Neurologist', 5, 8, 11);

-- Patients

INSERT INTO patients
    (patient_name, age, gender, city, phone, date_of_birth, blood_group)
VALUES
    ('John', 45, 'Male', 'Mumbai', '9000000001', '1980-05-12', 'A+'),
    ('Emma', 32, 'Female', 'Delhi', '9000000002', '1993-08-21', 'B+'),
    ('Rahul', 58, 'Male', 'Pune', '9000000003', '1967-02-10', 'O+'),
    ('Priya', 29, 'Female', 'Mumbai', '9000000004', '1996-11-03', 'AB+'),
    ('Amit', 67, 'Male', 'Hyderabad', '9000000005', '1958-04-17', 'O-'),
    ('Sneha', 41, 'Female', 'Bangalore', '9000000006', '1984-09-25', 'A-'),
    ('Rohit', 36, 'Male', 'Delhi', '9000000007', '1989-06-14', 'B-'),
    ('Kavya', 24, 'Female', 'Pune', '9000000008', '2001-01-30', 'AB-');

-- Appointments

INSERT INTO appointments
    (patient_id, doctor_id, appointment_date, status)
VALUES
    (1, 1, '2025-02-01', 'Completed'),
    (2, 3, '2025-02-03', 'Completed'),
    (3, 5, '2025-02-05', 'Scheduled'),
    (4, 2, '2025-02-07', 'Completed'),
    (5, 7, '2025-02-10', 'Completed'),
    (6, 8, '2025-02-12', 'Scheduled'),
    (7, 3, '2025-02-15', 'Cancelled'),
    (8, 6, '2025-02-18', 'Completed');

-- Prescriptions

INSERT INTO prescriptions
    (appointment_id, medicine_name, dosage)
VALUES
    (1, 'Atorvastatin', '10mg once daily'),
    (1, 'Aspirin', '75mg once daily'),
    (2, 'Ibuprofen', '400mg twice daily'),
    (4, 'Paracetamol', '500mg as needed'),
    (5, 'Tamoxifen', '20mg once daily'),
    (8, 'Metformin', '500mg twice daily');

-- Billing

INSERT INTO billing
    (patient_id, amount, payment_status, insurance_id)
VALUES
    (1, 12500, 'Paid', 1),
    (2, 8500, 'Paid', 2),
    (3, 15000, 'Pending', 3),
    (4, 6500, 'Paid', 1),
    (5, 25000, 'Paid', 4),
    (6, 9000, 'Pending', 2),
    (7, 7000, 'Cancelled', NULL),
    (8, 5500, 'Paid', 3);

-- Insurance

INSERT INTO insurance
    (insurance_company, insurance_type)
VALUES
    ('Star Health', 'Health Insurance'),
    ('ICICI Lombard', 'Family Health'),
    ('HDFC ERGO', 'Individual Health'),
    ('Bajaj Allianz', 'Health Insurance');

-- Lab Reports

INSERT INTO lab_reports
    (patient_id, report_type, result, report_date)
VALUES
    (1, 'Blood Test', 'Normal', '2025-01-28'),
    (2, 'X-Ray', 'No abnormality detected', '2025-01-30'),
    (3, 'ECG', 'Normal sinus rhythm', '2025-02-02'),
    (4, 'MRI', 'No significant findings', '2025-02-04'),
    (5, 'CT Scan', 'Further evaluation recommended', '2025-02-08'),
    (6, 'Blood Test', 'Normal', '2025-02-10'),
    (7, 'X-Ray', 'Minor inflammation', '2025-02-13'),
    (8, 'Blood Test', 'Normal', '2025-02-16');

-- ==========================================
-- BANKING DATA
-- ==========================================

-- Branches

INSERT INTO branches
    (branch_name, city)
VALUES
    ('Mumbai Main Branch', 'Mumbai'),
    ('Delhi Central Branch', 'Delhi'),
    ('Pune Camp Branch', 'Pune'),
    ('Ahmedabad Central Branch', 'Ahmedabad'),
    ('Bangalore MG Road Branch', 'Bangalore');

-- Customers

INSERT INTO customers
    (customer_name, email, city, phone)
VALUES
    ('Rahul Sharma', 'rahul@example.com', 'Mumbai', '9876543210'),
    ('Priya Singh', 'priya@example.com', 'Delhi', '9876543211'),
    ('Amit Kumar', 'amit@example.com', 'Pune', '9876543212'),
    ('Sneha Patel', 'sneha@example.com', 'Ahmedabad', '9876543213'),
    ('Rohit Verma', 'rohit@example.com', 'Bangalore', '9876543214');

-- Employees

-- Accounts

INSERT INTO accounts
    (customer_id, branch_id, account_type, balance, account_open_date, account_status)
VALUES
    (1, 1, 'Savings', 75000, '2024-01-15', 'Active'),
    (2, 2, 'Savings', 90000, '2024-02-10', 'Active'),
    (3, 3, 'Current', 25000, '2024-03-05', 'Active'),
    (4, 4, 'Savings', 45000, '2024-04-20', 'Active'),
    (5, 5, 'Current', 120000, '2024-05-12', 'Active');

-- Transactions

INSERT INTO transactions
    (account_id, amount, transaction_type, transaction_date, description)
VALUES
    (1, 5000, 'Credit', '2025-01-05', 'Salary Credit'),
    (1, 1500, 'Debit', '2025-01-10', 'Online Shopping'),
    (1, 3000, 'Debit', '2025-01-15', 'Utility Payment'),

    (2, 8000, 'Credit', '2025-01-03', 'Salary Credit'),
    (2, 2000, 'Debit', '2025-01-12', 'Rent Payment'),
    (2, 1200, 'Debit', '2025-01-20', 'Grocery Shopping'),

    (3, 10000, 'Credit', '2025-01-07', 'Business Payment'),
    (3, 2500, 'Debit', '2025-01-18', 'Office Expense'),

    (4, 6000, 'Credit', '2025-01-04', 'Salary Credit'),
    (4, 1800, 'Debit', '2025-01-14', 'Shopping'),

    (5, 15000, 'Credit', '2025-01-02', 'Business Income'),
    (5, 5000, 'Debit', '2025-01-16', 'Supplier Payment');

-- Loans

INSERT INTO loans
    (customer_id, loan_amount, interest_rate, status)
VALUES
    (1, 500000, 8.5, 'Active'),
    (2, 750000, 7.9, 'Active'),
    (3, 300000, 9.2, 'Closed'),
    (4, 450000, 8.1, 'Active'),
    (5, 1000000, 7.5, 'Active');

-- Credit Cards

INSERT INTO credit_cards
    (customer_id, card_number, card_type, expiry_date)
VALUES
    (1, '4111111111111111', 'Visa', '2028-06-30'),
    (2, '4222222222222222', 'Mastercard', '2027-11-30'),
    (3, '4333333333333333', 'Visa', '2029-03-31'),
    (4, '4444444444444444', 'Mastercard', '2028-09-30'),
    (5, '4555555555555555', 'Visa', '2030-01-31');

-- Payments

INSERT INTO payments
    (account_id, amount, payment_method, payment_date)
VALUES
    (1, 2500, 'UPI', '2025-01-08'),
    (1, 1200, 'Debit Card', '2025-01-13'),
    (2, 3500, 'UPI', '2025-01-09'),
    (2, 1800, 'Net Banking', '2025-01-19'),
    (3, 2200, 'UPI', '2025-01-11'),
    (4, 1500, 'Debit Card', '2025-01-17'),
    (5, 5000, 'Net Banking', '2025-01-21');

-- ==========================================
-- CHALLENGES DATA
-- ==========================================

-- Easy

-- Medium

-- Hard

-- Expert

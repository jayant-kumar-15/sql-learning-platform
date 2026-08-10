INSERT INTO hospitals
    (hospital_name, city, state)
VALUES
    ('Apollo Hospital', 'Mumbai', 'Maharashtra'),
    ('Fortis Hospital', 'Delhi', 'Delhi'),
    ('Ruby Hall Clinic', 'Pune', 'Maharashtra'),
    ('Care Hospital', 'Hyderabad', 'Telangana'),
    ('Manipal Hospital', 'Bangalore', 'Karnataka');

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

INSERT INTO insurance
    (insurance_company, insurance_type)
VALUES
    ('Star Health', 'Health Insurance'),
    ('ICICI Lombard', 'Family Health'),
    ('HDFC ERGO', 'Individual Health'),
    ('Bajaj Allianz', 'Health Insurance');

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

INSERT INTO prescriptions
    (appointment_id, medicine_name, dosage)
VALUES
    (1, 'Atorvastatin', '10mg once daily'),
    (1, 'Aspirin', '75mg once daily'),
    (2, 'Ibuprofen', '400mg twice daily'),
    (4, 'Paracetamol', '500mg as needed'),
    (5, 'Tamoxifen', '20mg once daily'),
    (8, 'Metformin', '500mg twice daily');

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

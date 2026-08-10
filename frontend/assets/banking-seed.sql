INSERT INTO branches
    (branch_name, city)
VALUES
    ('Mumbai Main Branch', 'Mumbai'),
    ('Delhi Central Branch', 'Delhi'),
    ('Pune Camp Branch', 'Pune'),
    ('Ahmedabad Central Branch', 'Ahmedabad'),
    ('Bangalore MG Road Branch', 'Bangalore');

INSERT INTO customers
    (customer_name, email, city, phone)
VALUES
    ('Rahul Sharma', 'rahul@example.com', 'Mumbai', '9876543210'),
    ('Priya Singh', 'priya@example.com', 'Delhi', '9876543211'),
    ('Amit Kumar', 'amit@example.com', 'Pune', '9876543212'),
    ('Sneha Patel', 'sneha@example.com', 'Ahmedabad', '9876543213'),
    ('Rohit Verma', 'rohit@example.com', 'Bangalore', '9876543214');

INSERT INTO accounts
    (customer_id, branch_id, account_type, balance, account_open_date, account_status)
VALUES
    (1, 1, 'Savings', 75000, '2024-01-15', 'Active'),
    (2, 2, 'Savings', 90000, '2024-02-10', 'Active'),
    (3, 3, 'Current', 25000, '2024-03-05', 'Active'),
    (4, 4, 'Savings', 45000, '2024-04-20', 'Active'),
    (5, 5, 'Current', 120000, '2024-05-12', 'Active');

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

INSERT INTO loans
    (customer_id, loan_amount, interest_rate, status)
VALUES
    (1, 500000, 8.5, 'Active'),
    (2, 750000, 7.9, 'Active'),
    (3, 300000, 9.2, 'Closed'),
    (4, 450000, 8.1, 'Active'),
    (5, 1000000, 7.5, 'Active');

INSERT INTO credit_cards
    (customer_id, card_number, card_type, expiry_date)
VALUES
    (1, '4111111111111111', 'Visa', '2028-06-30'),
    (2, '4222222222222222', 'Mastercard', '2027-11-30'),
    (3, '4333333333333333', 'Visa', '2029-03-31'),
    (4, '4444444444444444', 'Mastercard', '2028-09-30'),
    (5, '4555555555555555', 'Visa', '2030-01-31');

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

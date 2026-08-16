/*
 * SQL Learning Platform - Tutorial JavaScript
 * ============================================================
 * TUTORIAL V3
 *
 * PURPOSE
 * -------
 * Data-driven SQL learning experience covering:
 *   1. RDBMS Core
 *   2. Beginner SQL
 *   3. Intermediate SQL
 *   4. Expert SQL
 *   5. SQL Interview
 *
 * FEATURES
 * --------
 * - Expand/collapse learning tracks.
 * - Dynamic lesson navigation.
 * - College/fresher-friendly definitions.
 * - Syntax + example + explanation.
 * - Flow/visual explanations for advanced concepts.
 * - Browser SQL practice editor.
 * - Results stay hidden until the user executes SQL.
 * - Results are displayed in a compact scrollable window.
 * - Uses the existing browser SQLite/sqlEngine architecture.
 *
 * REVISION-SENSITIVE
 * ------------------
 * - Examples use the current Banking/Healthcare schema names.
 * - Do not change existing Playground/Challenge/Sandbox logic here.
 * - Add future lessons to TUTORIAL_CONTENT only.
 * ============================================================
 */

(() => {
    "use strict";

    /*
     * ============================================================
     * TUTORIAL CONTENT
     * ============================================================
     * The content object is intentionally data-driven. The UI below
     * does not contain lesson-specific logic.
     */
    const TUTORIAL_CONTENT = {
    "rdbms": {
        "title": "🗄️ RDBMS Core",
        "subtitle": "Understand the database fundamentals behind SQL before you start writing complex queries.",
        "lessons": [
            {
                "title": "What is a Database?",
                "concept": "A database is an organized collection of data stored so that applications and people can reliably create, read, update and analyze information.",
                "syntax": "Application → SQL → Database → Tables → Rows / Columns",
                "example": "A banking system can store customers, accounts, loans and transactions in related tables.",
                "explanation": "Think of a database as a structured digital filing system. SQL is the language you use to ask the database questions or change its data.",
                "practice": "Conceptual: Explain the difference between a database, a table, a row and a column.",
                "type": "conceptual"
            },
            {
                "title": "DBMS vs RDBMS",
                "concept": "A DBMS manages data. An RDBMS is a DBMS that organizes data into related tables and uses relational rules such as keys and constraints.",
                "syntax": "RDBMS → Tables + Relationships + Keys + Constraints + SQL",
                "example": "In the Banking database, customers.customer_id can be related to accounts.customer_id.",
                "explanation": "The word relational matters: data is split into logical tables and relationships connect those tables. This reduces unnecessary duplication and improves consistency.",
                "practice": "Conceptual: Why would a banking system keep customers and accounts in separate tables instead of one very large table?",
                "type": "conceptual"
            },
            {
                "title": "Primary Key",
                "concept": "A primary key uniquely identifies each row in a table. It should be unique and cannot be NULL.",
                "syntax": "PRIMARY KEY (column_name)",
                "example": "CREATE TABLE customers (customer_id INTEGER PRIMARY KEY, first_name TEXT NOT NULL);",
                "explanation": "When you need one exact customer, account or transaction, the primary key gives you a stable identifier. It also becomes the natural target of relationships from other tables.",
                "practice": "Conceptual: Why should customer_id be a key instead of using first_name as the identifier?",
                "type": "conceptual"
            },
            {
                "title": "Foreign Key & Relationships",
                "concept": "A foreign key stores a value that refers to a key in another table, creating a relationship between the tables.",
                "syntax": "FOREIGN KEY (customer_id) REFERENCES customers(customer_id)",
                "example": "accounts.customer_id references customers.customer_id.",
                "explanation": "A useful mental model is parent → child. One customer can have many accounts, so customers is the parent and accounts contains the foreign key.",
                "flow": [
                    "customers.customer_id",
                    "↓",
                    "accounts.customer_id",
                    "↓",
                    "transactions.account_id"
                ],
                "practice": "Write a query that joins customers to accounts using customer_id.",
                "practiceQuery": "SELECT c.customer_id, c.first_name, a.account_number\nFROM customers c\nJOIN accounts a ON c.customer_id = a.customer_id\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "Normalization — 1NF, 2NF, 3NF",
                "concept": "Normalization is a design approach that organizes relational data to reduce unnecessary duplication and update anomalies.",
                "syntax": "1NF → atomic values\n2NF → 1NF + no partial dependency on a composite key\n3NF → 2NF + no transitive dependency",
                "example": "Instead of storing customer details repeatedly on every transaction row, keep customer data in customers and reference customer_id from related tables.",
                "explanation": "A simple flow is: identify repeated data → separate it into its own table → connect tables with keys → keep each fact in the most appropriate place.",
                "flow": [
                    "Repeated customer data",
                    "↓",
                    "Separate customer entity",
                    "↓",
                    "Reference with customer_id",
                    "↓",
                    "Fewer update anomalies"
                ],
                "practice": "Conceptual: What problem does normalization solve, and what trade-off can highly normalized designs introduce?",
                "type": "conceptual"
            },
            {
                "title": "ACID Transactions",
                "concept": "ACID describes four properties that help database transactions remain reliable: Atomicity, Consistency, Isolation and Durability.",
                "syntax": "Transaction → BEGIN → statements → COMMIT / ROLLBACK",
                "example": "A bank transfer should not debit one account successfully while failing to credit the other account.",
                "explanation": "Atomicity = all or nothing. Consistency = rules remain valid. Isolation = concurrent transactions do not incorrectly interfere. Durability = committed data survives failures.",
                "flow": [
                    "BEGIN",
                    "↓",
                    "Debit Account A",
                    "↓",
                    "Credit Account B",
                    "↓",
                    "COMMIT",
                    "or",
                    "ROLLBACK on failure"
                ],
                "practice": "Conceptual: Why is Atomicity essential for a money transfer?",
                "type": "conceptual"
            },
            {
                "title": "Constraints",
                "concept": "Constraints are rules enforced by the database to protect data quality.",
                "syntax": "PRIMARY KEY | FOREIGN KEY | NOT NULL | UNIQUE | CHECK",
                "example": "customer_number TEXT NOT NULL UNIQUE",
                "explanation": "Use constraints to prevent invalid data rather than relying only on application code. A UNIQUE rule, for example, prevents two customers from receiving the same customer number.",
                "practice": "Conceptual: Give one practical use for NOT NULL, UNIQUE and FOREIGN KEY.",
                "type": "conceptual"
            },
            {
                "title": "Indexes — Why They Matter",
                "concept": "An index is an additional data structure that can speed up searches and joins on selected columns, at the cost of storage and write overhead.",
                "syntax": "CREATE INDEX index_name ON table_name(column_name);",
                "example": "CREATE INDEX idx_acc_customer ON accounts(customer_id);",
                "explanation": "Without a useful index, the database may need to inspect many rows. With an index, it can often locate matching values more efficiently. Indexes are not automatically beneficial for every column.",
                "practice": "Write an index definition for transactions.account_id.",
                "practiceQuery": "CREATE INDEX idx_tutorial_tx_account ON transactions(account_id);",
                "database": "Banking"
            }
        ]
    },
    "beginner": {
        "title": "🟢 Beginner SQL",
        "subtitle": "Build a strong foundation from SELECT and filtering through aggregation and data modification.",
        "lessons": [
            {
                "title": "SQL Basics & SELECT",
                "concept": "SELECT retrieves columns and rows from one or more tables.",
                "syntax": "SELECT column1, column2\nFROM table_name;",
                "example": "SELECT first_name, last_name, city\nFROM customers;",
                "explanation": "Start with the business question: which table contains the fact and which columns do you need? Prefer explicit columns instead of SELECT * when you know the required output.",
                "practice": "Return first_name, last_name and city for customers.",
                "practiceQuery": "SELECT first_name, last_name, city\nFROM customers\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "DDL — CREATE, ALTER, DROP, TRUNCATE",
                "concept": "DDL defines or changes database structure. Common commands include CREATE, ALTER, DROP and TRUNCATE.",
                "syntax": "CREATE TABLE ...;\nALTER TABLE ...;\nDROP TABLE ...;\nTRUNCATE TABLE ...;",
                "example": "CREATE TABLE demo_customer (customer_id INTEGER PRIMARY KEY, customer_name TEXT NOT NULL);",
                "explanation": "DDL changes the structure rather than simply retrieving rows. Be careful with DROP and TRUNCATE because they can remove large amounts of data or an entire object.",
                "practice": "Conceptual: Explain the difference between DROP TABLE and TRUNCATE TABLE.",
                "type": "conceptual"
            },
            {
                "title": "DML — INSERT, UPDATE, DELETE",
                "concept": "DML changes the data stored inside existing database objects. INSERT adds rows, UPDATE changes rows and DELETE removes rows.",
                "syntax": "INSERT INTO table_name (...) VALUES (...);\nUPDATE table_name SET column = value WHERE condition;\nDELETE FROM table_name WHERE condition;",
                "example": "UPDATE customers\nSET city = 'Pune'\nWHERE customer_id = 1;",
                "explanation": "The WHERE clause is critical for UPDATE and DELETE. Without a correct filter, you may modify or delete every row.",
                "practice": "Conceptual: What is the risk of running UPDATE customers SET city = 'Pune' without a WHERE clause?",
                "type": "conceptual"
            },
            {
                "title": "WHERE & Comparison Operators",
                "concept": "WHERE filters rows using operators such as =, <>, >, <, >= and <=.",
                "syntax": "SELECT ...\nFROM table_name\nWHERE condition;",
                "example": "SELECT loan_id, principal_amount\nFROM loans\nWHERE principal_amount >= 1000000;",
                "explanation": "Think of WHERE as a row-by-row gate. Each row either satisfies the condition or is excluded.",
                "practice": "Find loans with principal_amount greater than or equal to 1000000.",
                "practiceQuery": "SELECT loan_id, principal_amount\nFROM loans\nWHERE principal_amount >= 1000000\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "AND, OR & NOT",
                "concept": "AND requires all conditions to be true, OR requires at least one condition to be true, and NOT reverses a condition.",
                "syntax": "WHERE condition1 AND condition2\nWHERE condition1 OR condition2\nWHERE NOT condition",
                "example": "SELECT customer_id, first_name, city\nFROM customers\nWHERE city = 'Pune' AND customer_status = 'Active';",
                "explanation": "Use parentheses when mixing AND and OR so your intended business rule is obvious and does not depend on operator precedence.",
                "practice": "Find active customers from Pune or Mumbai.",
                "practiceQuery": "SELECT customer_id, first_name, city\nFROM customers\nWHERE customer_status = 'Active'\n  AND (city = 'Pune' OR city = 'Mumbai')\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "DISTINCT",
                "concept": "DISTINCT removes duplicate result combinations from the selected columns.",
                "syntax": "SELECT DISTINCT column_name\nFROM table_name;",
                "example": "SELECT DISTINCT city\nFROM customers\nORDER BY city;",
                "explanation": "DISTINCT applies to the entire selected row. If you select city and state, duplicates are removed only when both values match.",
                "practice": "List unique cities from customers.",
                "practiceQuery": "SELECT DISTINCT city\nFROM customers\nORDER BY city\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "LIKE & Wildcards",
                "concept": "LIKE searches text using patterns. % represents zero or more characters and _ represents exactly one character.",
                "syntax": "WHERE column_name LIKE 'pattern'",
                "example": "SELECT customer_id, first_name\nFROM customers\nWHERE first_name LIKE 'A%';",
                "explanation": "Read the pattern literally: A% means starts with A; %A means ends with A; %A% means contains A; _ represents one character. Wildcards are mainly used with LIKE.",
                "practice": "Find customers whose first_name starts with 'A'.",
                "practiceQuery": "SELECT customer_id, first_name, last_name\nFROM customers\nWHERE first_name LIKE 'A%'\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "BETWEEN & IN",
                "concept": "BETWEEN filters an inclusive range. IN checks whether a value matches any value in a supplied list.",
                "syntax": "WHERE amount BETWEEN low AND high\nWHERE city IN ('Pune','Mumbai')",
                "example": "SELECT loan_id, principal_amount\nFROM loans\nWHERE principal_amount BETWEEN 500000 AND 1000000;",
                "explanation": "BETWEEN includes both endpoints. IN is often clearer than repeating OR conditions for a fixed list of values.",
                "practice": "Find loans between 500000 and 1000000 inclusive.",
                "practiceQuery": "SELECT loan_id, principal_amount\nFROM loans\nWHERE principal_amount BETWEEN 500000 AND 1000000\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "NULL & COALESCE",
                "concept": "NULL represents missing or unknown information. COALESCE returns the first non-NULL value from its arguments.",
                "syntax": "WHERE column_name IS NULL\nCOALESCE(column_name, fallback)",
                "example": "SELECT customer_id, COALESCE(phone, 'Not provided') AS phone\nFROM customers;",
                "explanation": "NULL is not zero and is not an empty string. Use IS NULL or IS NOT NULL to test it. COALESCE is useful when you need a display or calculation fallback.",
                "practice": "Show customer phone numbers and replace NULL phones with 'Not provided'.",
                "practiceQuery": "SELECT customer_id, COALESCE(phone, 'Not provided') AS phone\nFROM customers\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "ORDER BY & LIMIT",
                "concept": "ORDER BY sorts rows and LIMIT restricts how many rows are returned.",
                "syntax": "SELECT ...\nFROM ...\nORDER BY column DESC\nLIMIT 5;",
                "example": "SELECT loan_id, principal_amount\nFROM loans\nORDER BY principal_amount DESC\nLIMIT 5;",
                "explanation": "For Top-N questions, sort first and then limit. If ties matter, use a deterministic secondary sort key.",
                "practice": "Return the five largest loans.",
                "practiceQuery": "SELECT loan_id, principal_amount\nFROM loans\nORDER BY principal_amount DESC, loan_id\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "Aggregate Functions",
                "concept": "COUNT, SUM, AVG, MIN and MAX summarize values across multiple rows.",
                "syntax": "SELECT COUNT(*), SUM(amount), AVG(amount), MIN(amount), MAX(amount)\nFROM table_name;",
                "example": "SELECT COUNT(*) AS transaction_count,\n       SUM(amount) AS total_amount,\n       AVG(amount) AS average_amount\nFROM transactions;",
                "explanation": "Aggregates reduce many input rows into summary values. COUNT(*) counts rows; COUNT(column) ignores NULL values in that column.",
                "practice": "Calculate transaction count and total amount.",
                "practiceQuery": "SELECT COUNT(*) AS transaction_count,\n       SUM(amount) AS total_amount\nFROM transactions;",
                "database": "Banking"
            },
            {
                "title": "GROUP BY",
                "concept": "GROUP BY creates one result group for each distinct value or combination of grouped columns.",
                "syntax": "SELECT group_column, COUNT(*)\nFROM table_name\nGROUP BY group_column;",
                "example": "SELECT transaction_type, COUNT(*) AS transaction_count\nFROM transactions\nGROUP BY transaction_type;",
                "explanation": "Use GROUP BY when the question says 'per', 'by', 'for each' or similar language. Every selected non-aggregate column generally belongs in GROUP BY.",
                "practice": "Count transactions by transaction_type.",
                "practiceQuery": "SELECT transaction_type, COUNT(*) AS transaction_count\nFROM transactions\nGROUP BY transaction_type\nORDER BY transaction_count DESC;",
                "database": "Banking"
            },
            {
                "title": "HAVING",
                "concept": "HAVING filters groups after aggregation, while WHERE filters rows before aggregation.",
                "syntax": "SELECT group_column, COUNT(*)\nFROM table_name\nGROUP BY group_column\nHAVING COUNT(*) > 5;",
                "example": "SELECT account_id, COUNT(*) AS transaction_count\nFROM transactions\nGROUP BY account_id\nHAVING COUNT(*) > 5;",
                "explanation": "A simple mental flow is FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. Because HAVING sees grouped results, it can filter aggregate values.",
                "practice": "Find accounts with more than five transactions.",
                "practiceQuery": "SELECT account_id, COUNT(*) AS transaction_count\nFROM transactions\nGROUP BY account_id\nHAVING COUNT(*) > 5\nORDER BY transaction_count DESC;",
                "database": "Banking"
            },
            {
                "title": "Aliases & Expressions",
                "concept": "An alias gives a table or calculated column a temporary readable name inside a query.",
                "syntax": "SELECT expression AS alias\nFROM table_name AS t;",
                "example": "SELECT p.payment_id,\n       p.payment_amount * 1.18 AS amount_with_tax\nFROM payments p;",
                "explanation": "Aliases improve readability and make calculated outputs easier to consume. Table aliases are especially helpful when multiple tables contain similarly named columns.",
                "practice": "Return payment_id and payment_amount multiplied by 1.18 as adjusted_amount.",
                "practiceQuery": "SELECT payment_id,\n       payment_amount * 1.18 AS adjusted_amount\nFROM payments\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "INSERT INTO — Adding Data",
                "concept": "INSERT INTO adds one or more new rows into a table. You can specify column names explicitly or insert values for every column in table order.",
                "syntax": "INSERT INTO table_name (column1, column2)\nVALUES (value1, value2);\n\n-- Multiple rows in one statement\nINSERT INTO table_name (column1, column2)\nVALUES (v1, v2), (v3, v4), (v5, v6);",
                "example": "INSERT INTO customers (customer_id, first_name, last_name, city, customer_status)\nVALUES (9001, 'Rahul', 'Sharma', 'Pune', 'Active');",
                "explanation": "Always name the columns explicitly rather than relying on positional order — it protects the statement if the table structure changes later. Inserting multiple rows in a single statement is faster than issuing one INSERT per row because it reduces round trips to the database.",
                "flow": [
                    "Choose target table",
                    "↓",
                    "List target columns",
                    "↓",
                    "Supply matching VALUES",
                    "↓",
                    "Row added"
                ],
                "practice": "Insert a new customer row with customer_id 9001, first_name 'Rahul', last_name 'Sharma', city 'Pune' and customer_status 'Active', then select it back.",
                "practiceQuery": "INSERT INTO customers (customer_id, first_name, last_name, city, customer_status)\nVALUES (9001, 'Rahul', 'Sharma', 'Pune', 'Active');\n\nSELECT customer_id, first_name, last_name, city, customer_status\nFROM customers\nWHERE customer_id = 9001;",
                "database": "Banking"
            },
            {
                "title": "SQL Operators — Complete Reference",
                "concept": "Operators are symbols SQL uses to compare, combine or calculate values. The main families are arithmetic, comparison, logical and concatenation operators.",
                "syntax": "Arithmetic:  +  -  *  /  %\nComparison:  =  <>  !=  >  <  >=  <=\nLogical:     AND  OR  NOT\nMembership:  IN  BETWEEN  LIKE  IS NULL\nConcatenation (SQLite): ||",
                "example": "SELECT loan_id, principal_amount,\n       principal_amount * 0.08 AS annual_interest,\n       first_name || ' ' || last_name AS full_name\nFROM loans l\nJOIN customers c ON c.customer_id = l.customer_id;",
                "explanation": "Arithmetic operators calculate new values from numeric columns. Comparison operators produce a true/false result used inside WHERE or HAVING. Logical operators combine multiple conditions. Concatenation (|| in SQLite; CONCAT() in MySQL/SQL Server) joins text values together — useful for building full names or labels.",
                "practice": "Return each loan's principal_amount, an 8% annual_interest calculation, and the customer's full_name built by concatenation.",
                "practiceQuery": "SELECT l.loan_id, l.principal_amount,\n       ROUND(l.principal_amount * 0.08, 2) AS annual_interest,\n       c.first_name || ' ' || c.last_name AS full_name\nFROM loans l\nJOIN customers c ON c.customer_id = l.customer_id\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "AUTO INCREMENT / Identity Columns",
                "concept": "An auto-increment (identity) column automatically generates a unique, increasing numeric value for the primary key whenever a new row is inserted, so the application does not have to supply it.",
                "syntax": "-- SQLite\nCREATE TABLE table_name (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  column1 TEXT\n);\n\n-- MySQL\nid INT AUTO_INCREMENT PRIMARY KEY\n\n-- SQL Server\nid INT IDENTITY(1,1) PRIMARY KEY\n\n-- PostgreSQL\nid SERIAL PRIMARY KEY  -- or GENERATED ALWAYS AS IDENTITY",
                "example": "CREATE TABLE demo_ticket (\n  ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,\n  subject TEXT NOT NULL\n);\n\nINSERT INTO demo_ticket (subject) VALUES ('Card not working');\n-- ticket_id is generated automatically",
                "explanation": "Keyword and behavior differ across engines, so always check the target database's documentation. In SQLite a plain INTEGER PRIMARY KEY already auto-increments row IDs; AUTOINCREMENT additionally guarantees the value is never reused, even after deletes, at a small performance cost.",
                "practice": "Create a small demo table with an auto-incrementing primary key, insert two rows without specifying the id, and view the generated ids.",
                "practiceQuery": "CREATE TABLE demo_ticket (\n  ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,\n  subject TEXT NOT NULL\n);\n\nINSERT INTO demo_ticket (subject) VALUES ('Card not working');\nINSERT INTO demo_ticket (subject) VALUES ('Loan statement request');\n\nSELECT * FROM demo_ticket;",
                "database": "Banking"
            },
            {
                "title": "CREATE DATABASE & DROP DATABASE",
                "concept": "CREATE DATABASE provisions a brand-new, empty database container that will later hold tables, views and other objects. DROP DATABASE permanently removes an entire database and everything inside it.",
                "syntax": "CREATE DATABASE database_name;\nDROP DATABASE database_name;",
                "example": "CREATE DATABASE banking_prod;\n-- later, only for a throwaway environment:\nDROP DATABASE banking_staging_test;",
                "explanation": "This platform's browser practice engine (SQLite) works with a single already-created database file, so CREATE DATABASE / DROP DATABASE statements are not run here — treat this as a conceptual lesson for server-based engines such as MySQL, PostgreSQL or SQL Server. DROP DATABASE is one of the most destructive statements in SQL: it deletes every table, view and row inside it with no undo, so production systems normally restrict who can run it.",
                "practice": "Conceptual: Why do most companies restrict DROP DATABASE permissions to a very small group of database administrators?",
                "type": "conceptual"
            },
            {
                "title": "CREATE INDEX & DROP INDEX",
                "concept": "CREATE INDEX builds an index on one or more columns to speed up lookups, filters and joins. DROP INDEX removes an index that is no longer needed.",
                "syntax": "CREATE INDEX index_name ON table_name(column_name);\nCREATE UNIQUE INDEX index_name ON table_name(column_name);\nCREATE INDEX index_name ON table_name(column1, column2);  -- composite index\nDROP INDEX index_name;",
                "example": "CREATE INDEX idx_customers_city ON customers(city);\nCREATE UNIQUE INDEX idx_customers_email ON customers(email);",
                "explanation": "An index behaves like a book's index — the database can jump straight to matching rows instead of scanning the whole table. A UNIQUE index also enforces that no two rows share the same value. Indexes speed up reads but add overhead to INSERT/UPDATE/DELETE, since the index itself must be maintained, so index only the columns that are actually filtered, joined or sorted on frequently.",
                "practice": "Create an index on customers.city to speed up city-based filtering, then drop it.",
                "practiceQuery": "CREATE INDEX idx_tutorial_customers_city ON customers(city);\n\nSELECT customer_id, first_name, city\nFROM customers\nWHERE city = 'Pune'\nLIMIT 5;\n\nDROP INDEX idx_tutorial_customers_city;",
                "database": "Banking"
            },
            {
                "title": "COUNT, SUM, AVG, MIN, MAX — One at a Time",
                "concept": "These five aggregate functions are the most commonly used building blocks of reporting SQL. Each reduces a set of rows to a single summary value.",
                "syntax": "COUNT(*)              -- number of rows\nCOUNT(column)          -- number of non-NULL values\nCOUNT(DISTINCT column) -- number of unique non-NULL values\nSUM(column)             -- total of a numeric column\nAVG(column)             -- average of a numeric column\nMIN(column)             -- smallest value\nMAX(column)             -- largest value",
                "example": "SELECT\n  COUNT(*)                AS total_loans,\n  COUNT(DISTINCT customer_id) AS unique_borrowers,\n  SUM(principal_amount)   AS total_lent,\n  AVG(principal_amount)   AS avg_loan,\n  MIN(principal_amount)   AS smallest_loan,\n  MAX(principal_amount)   AS largest_loan\nFROM loans;",
                "explanation": "COUNT(*) counts every row, including ones with NULLs; COUNT(column) skips NULLs in that column; COUNT(DISTINCT column) also removes duplicates. SUM and AVG ignore NULL values automatically rather than treating them as zero. MIN/MAX work on numbers, dates and even text (alphabetical order).",
                "practice": "Return total loan count, unique borrower count, total amount lent, average loan, smallest loan and largest loan.",
                "practiceQuery": "SELECT\n  COUNT(*) AS total_loans,\n  COUNT(DISTINCT customer_id) AS unique_borrowers,\n  SUM(principal_amount) AS total_lent,\n  ROUND(AVG(principal_amount), 2) AS avg_loan,\n  MIN(principal_amount) AS smallest_loan,\n  MAX(principal_amount) AS largest_loan\nFROM loans;",
                "database": "Banking"
            },
            {
                "title": "Date & Time Basics",
                "concept": "Date functions extract, format or calculate with date and time values. SQLite stores dates as text, real or integer and provides DATE(), TIME(), DATETIME() and strftime() to work with them.",
                "syntax": "DATE('now')                       -- current date\nDATE(column)                      -- normalize/extract date part\nDATE(column, '+30 days')          -- date arithmetic\nstrftime('%Y', column)            -- extract year\njulianday(date1) - julianday(date2)  -- difference in days",
                "example": "SELECT loan_id, start_date,\n       DATE(start_date, '+1 year') AS review_date,\n       strftime('%Y', start_date) AS start_year\nFROM loans;",
                "explanation": "Read date functions left to right: start with the base date, then apply a modifier such as '+30 days' or '-1 month'. strftime() is the general-purpose formatter — '%Y' is year, '%m' is month, '%d' is day. Exact function names differ across engines (e.g. DATEADD in SQL Server, DATE_ADD in MySQL), so always confirm the dialect in real projects.",
                "practice": "For each loan, show start_date, a review_date one year later, and the start_year extracted from start_date.",
                "practiceQuery": "SELECT loan_id, start_date,\n       DATE(start_date, '+1 year') AS review_date,\n       strftime('%Y', start_date) AS start_year\nFROM loans\nLIMIT 5;",
                "database": "Banking"
            }
        ]
    },
    "intermediate": {
        "title": "🟡 Intermediate SQL",
        "subtitle": "Move from individual queries to joins, business logic, set operations and multi-step analysis.",
        "lessons": [
            {
                "title": "INNER JOIN",
                "concept": "INNER JOIN returns rows where the join condition matches in both tables.",
                "syntax": "SELECT ...\nFROM table_a a\nJOIN table_b b ON a.key = b.key;",
                "example": "SELECT c.customer_id, c.first_name, a.account_number\nFROM customers c\nJOIN accounts a ON c.customer_id = a.customer_id;",
                "explanation": "First identify the relationship key. Then select only the columns needed from each side. INNER JOIN removes customers without a matching account.",
                "practice": "Return customer names with their account numbers.",
                "practiceQuery": "SELECT c.customer_id, c.first_name, c.last_name, a.account_number\nFROM customers c\nJOIN accounts a ON c.customer_id = a.customer_id\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "LEFT JOIN",
                "concept": "LEFT JOIN preserves every row from the left table and adds matching right-side data when available.",
                "syntax": "SELECT ...\nFROM left_table l\nLEFT JOIN right_table r ON l.key = r.key;",
                "example": "SELECT c.customer_id, c.first_name, a.account_number\nFROM customers c\nLEFT JOIN accounts a ON c.customer_id = a.customer_id;",
                "explanation": "Use LEFT JOIN when the business requirement says 'all customers', 'including those without...' or when missing relationships matter.",
                "practice": "List every customer and any account number they have.",
                "practiceQuery": "SELECT c.customer_id, c.first_name, c.last_name, a.account_number\nFROM customers c\nLEFT JOIN accounts a ON c.customer_id = a.customer_id\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "RIGHT/FULL JOIN — Portability Note",
                "concept": "RIGHT JOIN keeps all rows from the right table; FULL OUTER JOIN keeps unmatched rows from both sides. Support differs by SQL engine.",
                "syntax": "FROM table_a a\nRIGHT JOIN table_b b ON ...\n\nFULL OUTER JOIN table_b b ON ...",
                "example": "In engines that support it, FULL OUTER JOIN can expose records that exist on only one side of a relationship.",
                "explanation": "Your platform's browser engine is SQLite, so do not rely on RIGHT JOIN or FULL OUTER JOIN in practice exercises. Learn the concept and use LEFT JOIN plus query restructuring when needed.",
                "practice": "Conceptual: How can a RIGHT JOIN often be rewritten as a LEFT JOIN by swapping table order?",
                "type": "conceptual"
            },
            {
                "title": "SELF JOIN",
                "concept": "A self join joins a table to itself, usually to represent hierarchical or peer relationships.",
                "syntax": "SELECT a.column, b.column\nFROM table_name a\nJOIN table_name b ON a.parent_id = b.id;",
                "example": "SELECT e.employee_name, m.employee_name AS manager_name\nFROM employees e\nJOIN employees m ON e.manager_id = m.employee_id;",
                "explanation": "The same physical table gets two aliases, and each alias represents a different role. The current schema may not contain manager_id, so treat this as a general SQL pattern.",
                "practice": "Conceptual: Why are two aliases required when joining a table to itself?",
                "type": "conceptual"
            },
            {
                "title": "CASE — Business Rules",
                "concept": "CASE converts conditions into business-friendly labels or calculated values.",
                "syntax": "CASE\n  WHEN condition THEN result\n  WHEN condition THEN result\n  ELSE result\nEND",
                "example": "SELECT loan_id, principal_amount,\nCASE\n  WHEN principal_amount >= 1000000 THEN 'High'\n  WHEN principal_amount >= 500000 THEN 'Medium'\n  ELSE 'Low'\nEND AS loan_category\nFROM loans;",
                "explanation": "Evaluate CASE branches from top to bottom. Put the most specific or highest threshold conditions first when ranges overlap.",
                "practice": "Classify loans as High, Medium or Low using principal_amount.",
                "practiceQuery": "SELECT loan_id, principal_amount,\nCASE\n  WHEN principal_amount >= 1000000 THEN 'High'\n  WHEN principal_amount >= 500000 THEN 'Medium'\n  ELSE 'Low'\nEND AS loan_category\nFROM loans\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "Subqueries — Scalar & Multi-row",
                "concept": "A subquery is a query nested inside another SQL statement. It can return a single value, a set of values, a row or a table-like result depending on how it is used.",
                "syntax": "WHERE value > (SELECT ...)\nWHERE value IN (SELECT ...)\nFROM (SELECT ...) x",
                "example": "SELECT loan_id, principal_amount\nFROM loans\nWHERE principal_amount > (\n    SELECT AVG(principal_amount)\n    FROM loans\n);",
                "explanation": "Flow: inner query calculates a reference value → outer query uses that value to filter or calculate the final result. Use IN when the inner query returns multiple values.",
                "flow": [
                    "Inner query",
                    "↓",
                    "Calculate reference value/set",
                    "↓",
                    "Outer query consumes it",
                    "↓",
                    "Final result"
                ],
                "practice": "Find loans above the average principal_amount.",
                "practiceQuery": "SELECT loan_id, principal_amount\nFROM loans\nWHERE principal_amount > (\n    SELECT AVG(principal_amount) FROM loans\n)\nORDER BY principal_amount DESC\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "Correlated Subquery",
                "concept": "A correlated subquery refers to a value from the current row of the outer query, so the inner logic is evaluated in relation to that outer row.",
                "syntax": "SELECT ...\nFROM outer_table o\nWHERE EXISTS (\n  SELECT 1\n  FROM inner_table i\n  WHERE i.key = o.key\n);",
                "example": "SELECT c.customer_id, c.first_name\nFROM customers c\nWHERE EXISTS (\n    SELECT 1\n    FROM loans l\n    WHERE l.customer_id = c.customer_id\n);",
                "explanation": "Flow: take one outer customer → check the inner query for that customer's loans → keep the customer if a match exists → repeat for the next customer.",
                "flow": [
                    "Outer row: customer",
                    "↓",
                    "Inner query references customer_id",
                    "↓",
                    "Match found?",
                    "↓",
                    "Keep / discard outer row"
                ],
                "practice": "Find customers who have at least one loan.",
                "practiceQuery": "SELECT c.customer_id, c.first_name, c.last_name\nFROM customers c\nWHERE EXISTS (\n    SELECT 1 FROM loans l WHERE l.customer_id = c.customer_id\n)\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "CTEs",
                "concept": "A Common Table Expression names an intermediate result using WITH, making a multi-step query easier to read and validate.",
                "syntax": "WITH step_one AS (...)\nSELECT ...\nFROM step_one;",
                "example": "WITH account_totals AS (\n  SELECT account_id, SUM(amount) AS total_amount\n  FROM transactions\n  GROUP BY account_id\n)\nSELECT * FROM account_totals\nWHERE total_amount > 100000;",
                "explanation": "Think of a CTE as a named temporary result for the duration of one statement. It is especially useful when a business problem has several logical stages.",
                "flow": [
                    "Raw transactions",
                    "↓",
                    "CTE: aggregate by account",
                    "↓",
                    "Filter / rank the summary",
                    "↓",
                    "Final output"
                ],
                "practice": "Create a CTE containing total transaction amount per account and return accounts above 100000.",
                "practiceQuery": "WITH account_totals AS (\n  SELECT account_id, SUM(amount) AS total_amount\n  FROM transactions\n  GROUP BY account_id\n)\nSELECT account_id, total_amount\nFROM account_totals\nWHERE total_amount > 100000\nORDER BY total_amount DESC\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "EXISTS / NOT EXISTS",
                "concept": "EXISTS returns true when a subquery finds at least one matching row. NOT EXISTS returns true when it finds none.",
                "syntax": "WHERE EXISTS (SELECT 1 ...)\nWHERE NOT EXISTS (SELECT 1 ...)",
                "example": "SELECT c.customer_id, c.first_name\nFROM customers c\nWHERE NOT EXISTS (\n  SELECT 1 FROM loans l\n  WHERE l.customer_id = c.customer_id\n);",
                "explanation": "EXISTS asks 'does at least one related record exist?' It does not need the actual values from the inner SELECT. This makes it a strong pattern for relationship checks.",
                "practice": "Find customers who do not have any loan.",
                "practiceQuery": "SELECT c.customer_id, c.first_name, c.last_name\nFROM customers c\nWHERE NOT EXISTS (\n  SELECT 1 FROM loans l WHERE l.customer_id = c.customer_id\n)\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "UNION vs UNION ALL",
                "concept": "UNION combines result sets and removes duplicate rows; UNION ALL combines them without duplicate removal.",
                "syntax": "SELECT column1 FROM table_a\nUNION [ALL]\nSELECT column1 FROM table_b;",
                "example": "SELECT city FROM customers\nUNION\nSELECT city FROM branches;",
                "explanation": "The two SELECT statements must have compatible column counts and types. Choose UNION ALL when duplicates are meaningful or when you do not need duplicate elimination.",
                "practice": "Conceptual: When would UNION ALL be preferable to UNION?",
                "type": "conceptual"
            },
            {
                "title": "Date & String Functions",
                "concept": "SQL engines provide functions for transforming dates, text and other values. Exact function names can vary by database.",
                "syntax": "LOWER(text)\nUPPER(text)\nLENGTH(text)\nDATE(...)",
                "example": "SELECT customer_id, UPPER(first_name) AS first_name_upper\nFROM customers;",
                "explanation": "Function portability matters. Since this platform executes in SQLite in the browser, examples should use SQLite-compatible functions rather than assuming Oracle, MySQL or SQL Server syntax.",
                "practice": "Convert customer first names to uppercase.",
                "practiceQuery": "SELECT customer_id, UPPER(first_name) AS first_name_upper\nFROM customers\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "Conditional Aggregation",
                "concept": "Conditional aggregation combines CASE with aggregate functions to calculate multiple business metrics in one grouped query.",
                "syntax": "SUM(CASE WHEN condition THEN 1 ELSE 0 END)",
                "example": "SELECT\n  SUM(CASE WHEN transaction_status = 'Completed' THEN 1 ELSE 0 END) AS completed_count,\n  SUM(CASE WHEN transaction_status = 'Failed' THEN 1 ELSE 0 END) AS failed_count\nFROM transactions;",
                "explanation": "Flow: inspect each row → CASE converts it to 1/0 or a value → SUM adds those values → one summary row is produced.",
                "flow": [
                    "Each transaction",
                    "↓",
                    "CASE → 1 or 0",
                    "↓",
                    "SUM",
                    "↓",
                    "Metric"
                ],
                "practice": "Return completed and failed transaction counts in one row.",
                "practiceQuery": "SELECT\n  SUM(CASE WHEN transaction_status = 'Completed' THEN 1 ELSE 0 END) AS completed_count,\n  SUM(CASE WHEN transaction_status = 'Failed' THEN 1 ELSE 0 END) AS failed_count\nFROM transactions;",
                "database": "Banking"
            },
            {
                "title": "CROSS JOIN",
                "concept": "CROSS JOIN returns the Cartesian product of two tables — every row from the first table paired with every row from the second table. There is no ON condition.",
                "syntax": "SELECT ...\nFROM table_a\nCROSS JOIN table_b;",
                "example": "SELECT b.branch_name, r.report_month\nFROM branches b\nCROSS JOIN (SELECT '2026-01' AS report_month UNION SELECT '2026-02') r;",
                "explanation": "If table_a has M rows and table_b has N rows, a CROSS JOIN produces M × N rows. It is genuinely useful for generating combinations — for example, pairing every branch with every reporting month to build a complete report grid — but is easy to trigger by accident when an ON condition is forgotten on a regular JOIN, so treat an unexpectedly huge result set as a warning sign.",
                "practice": "Pair every branch with two report months ('2026-01' and '2026-02') to build a reporting grid.",
                "practiceQuery": "SELECT b.branch_name, r.report_month\nFROM branches b\nCROSS JOIN (\n  SELECT '2026-01' AS report_month\n  UNION\n  SELECT '2026-02' AS report_month\n) r\nORDER BY b.branch_name, r.report_month\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "TCL — COMMIT, ROLLBACK, SAVEPOINT",
                "concept": "Transaction Control Language (TCL) statements manage transactions: COMMIT makes changes permanent, ROLLBACK undoes changes since the last commit, and SAVEPOINT marks a point you can roll back to without undoing the whole transaction.",
                "syntax": "BEGIN TRANSACTION;\nUPDATE ...;\nSAVEPOINT sp1;\nUPDATE ...;\nROLLBACK TO sp1;   -- undo only the work after sp1\nCOMMIT;            -- or ROLLBACK; to undo everything",
                "example": "BEGIN TRANSACTION;\nUPDATE accounts SET balance = balance - 5000 WHERE account_id = 101;\nUPDATE accounts SET balance = balance + 5000 WHERE account_id = 202;\nCOMMIT;",
                "explanation": "Think of a transaction as a draft: statements inside BEGIN...COMMIT are not permanently visible to others until COMMIT runs. If something goes wrong partway through, ROLLBACK discards every change made since BEGIN, keeping the database consistent — this is exactly what protects a money transfer from leaving one account debited without the other being credited. SAVEPOINT is useful for partial rollback inside a longer transaction.",
                "practice": "Move 5000 from account 101 to account 202 inside a transaction, then commit, then verify both balances.",
                "practiceQuery": "BEGIN TRANSACTION;\nUPDATE accounts SET balance = balance - 5000 WHERE account_id = 101;\nUPDATE accounts SET balance = balance + 5000 WHERE account_id = 202;\nCOMMIT;\n\nSELECT account_id, balance FROM accounts WHERE account_id IN (101, 202);",
                "database": "Banking"
            },
            {
                "title": "Subquery in the SELECT Clause",
                "concept": "A scalar subquery can appear directly inside the SELECT list to attach a computed value to every row of the outer query.",
                "syntax": "SELECT column1,\n  (SELECT aggregate(...) FROM other_table WHERE other_table.key = outer_table.key) AS derived_column\nFROM outer_table;",
                "example": "SELECT c.customer_id, c.first_name,\n  (SELECT COUNT(*) FROM accounts a WHERE a.customer_id = c.customer_id) AS account_count\nFROM customers c;",
                "explanation": "The subquery in SELECT must return exactly one value per outer row (a scalar). It runs once for every row of the outer query, so it is conceptually similar to a correlated subquery in WHERE — just placed to produce an output column instead of filtering rows. For large tables a LEFT JOIN with GROUP BY is often a faster alternative to the same result.",
                "practice": "For each customer, show first_name and a derived account_count using a scalar subquery.",
                "practiceQuery": "SELECT c.customer_id, c.first_name,\n  (SELECT COUNT(*) FROM accounts a WHERE a.customer_id = c.customer_id) AS account_count\nFROM customers c\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Subquery in the FROM Clause (Derived Table)",
                "concept": "A subquery placed in the FROM clause acts like a temporary, unnamed table (a derived table) that the outer query can select from, filter or join.",
                "syntax": "SELECT outer_columns\nFROM (\n  SELECT ...\n  FROM table_name\n  GROUP BY ...\n) AS derived_alias\nWHERE outer_condition;",
                "example": "SELECT account_totals.account_id, account_totals.total_amount\nFROM (\n  SELECT account_id, SUM(amount) AS total_amount\n  FROM transactions\n  GROUP BY account_id\n) AS account_totals\nWHERE account_totals.total_amount > 100000;",
                "explanation": "A derived table lets you first shape or pre-aggregate data, then apply further filtering or joins on that already-summarized result — something you normally cannot do directly with HAVING alone if additional logic is needed afterward. This pattern is functionally similar to a CTE; CTEs (WITH ...) are usually preferred today for readability, but derived tables remain common, especially in older codebases.",
                "practice": "Find accounts whose total transaction amount exceeds 100000 using a derived table in FROM.",
                "practiceQuery": "SELECT account_totals.account_id, account_totals.total_amount\nFROM (\n  SELECT account_id, SUM(amount) AS total_amount\n  FROM transactions\n  GROUP BY account_id\n) AS account_totals\nWHERE account_totals.total_amount > 100000\nORDER BY account_totals.total_amount DESC\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Views — Definition & CREATE VIEW",
                "concept": "A view is a saved SELECT statement that behaves like a virtual table. It does not store data itself (unless it is a materialized view) — every time you query it, the underlying SELECT runs again.",
                "syntax": "CREATE VIEW view_name AS\nSELECT ...\nFROM table_name\nWHERE ...;\n\nSELECT * FROM view_name;",
                "example": "CREATE VIEW active_customers AS\nSELECT customer_id, first_name, last_name, city\nFROM customers\nWHERE customer_status = 'Active';\n\nSELECT * FROM active_customers WHERE city = 'Pune';",
                "explanation": "Use a view to hide complex joins/filters behind a simple, reusable name, to standardize a business definition (like 'active customer') across many reports, or to restrict which columns/rows a group of users can see. Because a view re-runs its underlying query each time, it always reflects the current data — but it also means a view is not automatically faster than the equivalent query written by hand.",
                "practice": "Create a view of active customers and query it for customers in Pune.",
                "practiceQuery": "CREATE VIEW active_customers AS\nSELECT customer_id, first_name, last_name, city\nFROM customers\nWHERE customer_status = 'Active';\n\nSELECT * FROM active_customers\nWHERE city = 'Pune'\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "Altering & Dropping Views",
                "concept": "Most engines do not let you ALTER the logic of a view directly in the same way as a table; instead you typically DROP and re-CREATE it, or use CREATE OR REPLACE VIEW where supported.",
                "syntax": "-- SQLite / general pattern\nDROP VIEW IF EXISTS view_name;\nCREATE VIEW view_name AS\nSELECT ...;\n\n-- MySQL / PostgreSQL shortcut\nCREATE OR REPLACE VIEW view_name AS\nSELECT ...;",
                "example": "DROP VIEW IF EXISTS active_customers;\nCREATE VIEW active_customers AS\nSELECT customer_id, first_name, last_name, city, customer_status\nFROM customers\nWHERE customer_status = 'Active';",
                "explanation": "Treat a view definition as versioned logic: when the business rule changes (for example, adding a new status value that should count as active), drop and recreate the view rather than patching data. A view can be dropped safely without affecting the underlying base tables — only the saved query definition is removed.",
                "practice": "Redefine the active_customers view to also include a 'Pending' status, then query it.",
                "practiceQuery": "DROP VIEW IF EXISTS active_customers;\n\nCREATE VIEW active_customers AS\nSELECT customer_id, first_name, last_name, city, customer_status\nFROM customers\nWHERE customer_status IN ('Active', 'Pending');\n\nSELECT * FROM active_customers\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "Set Operations — INTERSECT & EXCEPT",
                "concept": "INTERSECT returns only the rows that appear in both result sets. EXCEPT (called MINUS in Oracle) returns rows from the first result set that do not appear in the second.",
                "syntax": "SELECT column FROM table_a\nINTERSECT\nSELECT column FROM table_b;\n\nSELECT column FROM table_a\nEXCEPT\nSELECT column FROM table_b;",
                "example": "SELECT customer_id FROM loans\nINTERSECT\nSELECT customer_id FROM accounts;\n\nSELECT customer_id FROM loans\nEXCEPT\nSELECT customer_id FROM accounts;",
                "explanation": "Like UNION, both SELECT statements need compatible columns. INTERSECT is handy for finding overlap between two populations (customers who have both a loan and an account); EXCEPT is handy for finding what is in one set but not the other (customers who have a loan but no account). The same results can also be written with JOIN/EXISTS patterns, which sometimes perform better.",
                "practice": "Find customer_ids that exist in both loans and accounts using INTERSECT.",
                "practiceQuery": "SELECT customer_id FROM loans\nINTERSECT\nSELECT customer_id FROM accounts\nLIMIT 10;",
                "database": "Banking"
            }
        ]
    },
    "expert": {
        "title": "🔴 Expert SQL",
        "subtitle": "Solve analytical problems using window functions, advanced subqueries, CTE pipelines and performance reasoning.",
        "lessons": [
            {
                "title": "Window Functions — Mental Model",
                "concept": "A window function calculates across a related set of rows while keeping the individual rows visible. Unlike GROUP BY, it does not collapse the result to one row per group.",
                "syntax": "function(...) OVER (\n  PARTITION BY group_column\n  ORDER BY sort_column\n)",
                "example": "SELECT account_id, transaction_date, amount,\nSUM(amount) OVER (\n  PARTITION BY account_id\n  ORDER BY transaction_date\n) AS running_total\nFROM transactions;",
                "explanation": "Flow: start with the current row → define its window using PARTITION BY → order rows inside that window → calculate the function → attach the result to the current row.",
                "flow": [
                    "Rows",
                    "↓",
                    "PARTITION BY → groups",
                    "↓",
                    "ORDER BY → sequence",
                    "↓",
                    "Window function",
                    "↓",
                    "Value added to each row"
                ],
                "practice": "Calculate a running transaction total for every account.",
                "practiceQuery": "SELECT account_id, transaction_date, amount,\nSUM(amount) OVER (\n  PARTITION BY account_id\n  ORDER BY transaction_date, transaction_id\n  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n) AS running_total\nFROM transactions\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "ROW_NUMBER vs RANK vs DENSE_RANK",
                "concept": "All three are ranking window functions, but they handle ties differently. ROW_NUMBER always increments uniquely; RANK leaves gaps after ties; DENSE_RANK does not leave gaps.",
                "syntax": "ROW_NUMBER() OVER (ORDER BY score DESC)\nRANK() OVER (ORDER BY score DESC)\nDENSE_RANK() OVER (ORDER BY score DESC)",
                "example": "SELECT loan_id, principal_amount,\nROW_NUMBER() OVER (ORDER BY principal_amount DESC) AS row_num,\nRANK() OVER (ORDER BY principal_amount DESC) AS rnk,\nDENSE_RANK() OVER (ORDER BY principal_amount DESC) AS dense_rnk\nFROM loans;",
                "explanation": "Example with values 100, 100, 90: ROW_NUMBER → 1,2,3; RANK → 1,1,3; DENSE_RANK → 1,1,2. Use ROW_NUMBER when you need exactly one position per row, RANK when gaps after ties are meaningful, and DENSE_RANK when ranking distinct values.",
                "flow": [
                    "100 → rank 1",
                    "100 → rank 1",
                    "90 → RANK 3 / DENSE_RANK 2"
                ],
                "visualRows": [
                    [
                        "100",
                        "1",
                        "1",
                        "1"
                    ],
                    [
                        "100",
                        "2",
                        "1",
                        "1"
                    ],
                    [
                        "90",
                        "3",
                        "3",
                        "2"
                    ]
                ],
                "visualHeaders": [
                    "value",
                    "ROW_NUMBER",
                    "RANK",
                    "DENSE_RANK"
                ],
                "practice": "Compare ranking behavior for loans with equal principal_amount values.",
                "practiceQuery": "SELECT loan_id, principal_amount,\nROW_NUMBER() OVER (ORDER BY principal_amount DESC) AS row_num,\nRANK() OVER (ORDER BY principal_amount DESC) AS rnk,\nDENSE_RANK() OVER (ORDER BY principal_amount DESC) AS dense_rnk\nFROM loans\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Top-N Per Group",
                "concept": "Top-N per group means finding the largest or smallest N rows separately inside every group.",
                "syntax": "WITH ranked AS (\n  SELECT ...,\n  ROW_NUMBER() OVER (\n    PARTITION BY group_column\n    ORDER BY value_column DESC\n  ) rn\n  FROM table_name\n)\nSELECT ... FROM ranked WHERE rn <= N;",
                "example": "WITH ranked_loans AS (\nSELECT loan_id, customer_id, principal_amount,\nROW_NUMBER() OVER (\n  PARTITION BY customer_id\n  ORDER BY principal_amount DESC\n) rn\nFROM loans)\nSELECT loan_id, customer_id, principal_amount\nFROM ranked_loans\nWHERE rn <= 2;",
                "explanation": "Flow: partition by customer → rank each customer's loans → keep rank 1 and 2. The outer query is necessary because window results are calculated after the WHERE stage.",
                "flow": [
                    "All loans",
                    "↓",
                    "Partition by customer",
                    "↓",
                    "Rank inside each customer",
                    "↓",
                    "Filter rn <= N"
                ],
                "practice": "Return the two largest loans for each customer.",
                "practiceQuery": "WITH ranked_loans AS (\n  SELECT loan_id, customer_id, principal_amount,\n  ROW_NUMBER() OVER (\n    PARTITION BY customer_id\n    ORDER BY principal_amount DESC, loan_id\n  ) AS rn\n  FROM loans\n)\nSELECT loan_id, customer_id, principal_amount\nFROM ranked_loans\nWHERE rn <= 2\nORDER BY customer_id, rn\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "LAG & LEAD",
                "concept": "LAG looks backward to a previous row and LEAD looks forward to a following row within the ordered window.",
                "syntax": "LAG(value) OVER (PARTITION BY group ORDER BY date)\nLEAD(value) OVER (PARTITION BY group ORDER BY date)",
                "example": "SELECT account_id, transaction_date, amount,\nLAG(amount) OVER (\n  PARTITION BY account_id\n  ORDER BY transaction_date, transaction_id\n) AS previous_amount,\nLEAD(amount) OVER (\n  PARTITION BY account_id\n  ORDER BY transaction_date, transaction_id\n) AS next_amount\nFROM transactions;",
                "explanation": "Flow: establish the sequence with ORDER BY → current row looks one position backward with LAG → current row looks one position forward with LEAD. The first LAG and last LEAD values are normally NULL because a neighbor does not exist.",
                "flow": [
                    "Row 1 → previous NULL → next Row 2",
                    "Row 2 → previous Row 1 → next Row 3",
                    "Row 3 → previous Row 2 → next NULL"
                ],
                "practice": "Show each transaction amount with the previous transaction amount for the same account.",
                "practiceQuery": "SELECT account_id, transaction_date, amount,\nLAG(amount) OVER (\n  PARTITION BY account_id\n  ORDER BY transaction_date, transaction_id\n) AS previous_amount\nFROM transactions\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Running Totals & Moving Windows",
                "concept": "Window frames control exactly which rows participate in a window calculation. A running total commonly uses all rows from the beginning through the current row.",
                "syntax": "SUM(amount) OVER (\n  PARTITION BY account_id\n  ORDER BY transaction_date\n  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n)",
                "example": "SELECT account_id, transaction_date, amount,\nSUM(amount) OVER (\n  PARTITION BY account_id\n  ORDER BY transaction_date, transaction_id\n  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n) AS running_total\nFROM transactions;",
                "explanation": "The frame is the precise slice of the ordered partition used for the current row. Changing the frame can turn a running total into a moving or centered calculation.",
                "flow": [
                    "Partition",
                    "↓",
                    "Order rows",
                    "↓",
                    "Choose frame",
                    "↓",
                    "Calculate aggregate"
                ],
                "practice": "Calculate a running total for each account.",
                "practiceQuery": "SELECT account_id, transaction_date, amount,\nSUM(amount) OVER (\n  PARTITION BY account_id\n  ORDER BY transaction_date, transaction_id\n  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n) AS running_total\nFROM transactions\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Deduplication with ROW_NUMBER",
                "concept": "ROW_NUMBER can select one preferred record from each duplicate business-key group.",
                "syntax": "WITH ranked AS (\nSELECT *, ROW_NUMBER() OVER (\nPARTITION BY business_key\nORDER BY preferred_date DESC\n) rn\nFROM table_name)\nSELECT * FROM ranked WHERE rn = 1;",
                "example": "WITH ranked AS (\nSELECT customer_id, email, registration_date,\nROW_NUMBER() OVER (\n  PARTITION BY email\n  ORDER BY registration_date DESC, customer_id DESC\n) rn\nFROM customers)\nSELECT customer_id, email, registration_date\nFROM ranked WHERE rn = 1;",
                "explanation": "First define what 'duplicate' means. Then define which row should survive. The ORDER BY inside ROW_NUMBER expresses that business rule.",
                "flow": [
                    "Duplicate business key",
                    "↓",
                    "Partition by key",
                    "↓",
                    "Sort by preferred record",
                    "↓",
                    "rn = 1 survives"
                ],
                "practice": "Return one customer record per email, preferring the latest registration_date.",
                "practiceQuery": "WITH ranked AS (\n  SELECT customer_id, email, registration_date,\n  ROW_NUMBER() OVER (\n    PARTITION BY email\n    ORDER BY registration_date DESC, customer_id DESC\n  ) AS rn\n  FROM customers\n)\nSELECT customer_id, email, registration_date\nFROM ranked\nWHERE rn = 1\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Multiple CTE Pipeline",
                "concept": "Complex analytical SQL can be divided into named stages, where each CTE prepares data for the next stage.",
                "syntax": "WITH step1 AS (...),\nstep2 AS (...),\nstep3 AS (...)\nSELECT ... FROM step3;",
                "example": "WITH totals AS (\n  SELECT account_id, SUM(amount) total_amount\n  FROM transactions GROUP BY account_id\n), ranked AS (\n  SELECT account_id, total_amount,\n  DENSE_RANK() OVER (ORDER BY total_amount DESC) rnk\n  FROM totals\n)\nSELECT * FROM ranked WHERE rnk <= 3;",
                "explanation": "Treat each CTE like a documented transformation stage. Validate each stage independently before combining them. This makes complex SQL easier to debug and explain in interviews.",
                "flow": [
                    "Raw data",
                    "↓",
                    "CTE 1: aggregate",
                    "↓",
                    "CTE 2: rank",
                    "↓",
                    "Final filter"
                ],
                "practice": "Find the top three accounts by total transaction amount, including ties.",
                "practiceQuery": "WITH totals AS (\n  SELECT account_id, SUM(amount) AS total_amount\n  FROM transactions\n  GROUP BY account_id\n), ranked AS (\n  SELECT account_id, total_amount,\n  DENSE_RANK() OVER (ORDER BY total_amount DESC) AS rnk\n  FROM totals\n)\nSELECT account_id, total_amount\nFROM ranked\nWHERE rnk <= 3\nORDER BY rnk, account_id;",
                "database": "Banking"
            },
            {
                "title": "Conditional Aggregation at Scale",
                "concept": "Conditional aggregation can produce several business metrics in one grouped pass, often avoiding repeated queries.",
                "syntax": "SUM(CASE WHEN condition THEN amount ELSE 0 END)",
                "example": "SELECT account_id,\nSUM(CASE WHEN transaction_status = 'Completed' THEN amount ELSE 0 END) AS completed_amount,\nSUM(CASE WHEN transaction_status = 'Failed' THEN amount ELSE 0 END) AS failed_amount\nFROM transactions\nGROUP BY account_id;",
                "explanation": "Flow: group rows by account → evaluate each CASE for each transaction → add only the values matching each business rule → return one row per account.",
                "practice": "For each account, calculate completed and failed transaction amounts.",
                "practiceQuery": "SELECT account_id,\nSUM(CASE WHEN transaction_status = 'Completed' THEN amount ELSE 0 END) AS completed_amount,\nSUM(CASE WHEN transaction_status = 'Failed' THEN amount ELSE 0 END) AS failed_amount\nFROM transactions\nGROUP BY account_id\nORDER BY account_id\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Query Performance — Read the Plan",
                "concept": "Query performance depends on data volume, filtering, joins, indexes and execution strategy. EXPLAIN QUERY PLAN can show how SQLite intends to access data.",
                "syntax": "EXPLAIN QUERY PLAN\nSELECT ...;",
                "example": "EXPLAIN QUERY PLAN\nSELECT * FROM transactions\nWHERE account_id = 100;",
                "explanation": "Look for unnecessary full scans, expensive joins and filters that could benefit from an appropriate index. Do not assume an index is always faster; measure the actual workload.",
                "practice": "Conceptual: Why can an index improve a WHERE lookup but also make INSERT and UPDATE operations more expensive?",
                "type": "conceptual"
            },
            {
                "title": "Advanced Date Bucketing",
                "concept": "Analytical queries often group events into periods such as year-month. The exact date function depends on the SQL dialect.",
                "syntax": "strftime('%Y-%m', date_column)",
                "example": "SELECT strftime('%Y-%m', transaction_date) AS year_month,\nSUM(amount) AS total_amount\nFROM transactions\nGROUP BY strftime('%Y-%m', transaction_date)\nORDER BY year_month;",
                "explanation": "Flow: convert each date into a reporting bucket → group rows by that bucket → aggregate the measure → sort chronologically.",
                "flow": [
                    "Raw date",
                    "↓",
                    "YYYY-MM bucket",
                    "↓",
                    "GROUP BY month",
                    "↓",
                    "SUM amount"
                ],
                "practice": "Return monthly transaction totals using a year-month bucket.",
                "practiceQuery": "SELECT strftime('%Y-%m', transaction_date) AS year_month,\nSUM(amount) AS total_amount\nFROM transactions\nGROUP BY strftime('%Y-%m', transaction_date)\nORDER BY year_month\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Stored Procedures — Concept & Syntax",
                "concept": "A stored procedure is a named, precompiled block of SQL (often with parameters and procedural logic like IF/LOOP) that is stored in the database and can be called repeatedly, instead of sending the full SQL text from the application every time.",
                "syntax": "-- MySQL\nDELIMITER //\nCREATE PROCEDURE GetCustomerLoans(IN p_customer_id INT)\nBEGIN\n  SELECT loan_id, principal_amount, loan_status\n  FROM loans\n  WHERE customer_id = p_customer_id;\nEND //\nDELIMITER ;\n\nCALL GetCustomerLoans(101);\n\n-- PostgreSQL\nCREATE PROCEDURE get_customer_loans(p_customer_id INT)\nLANGUAGE SQL\nAS $$\n  SELECT loan_id, principal_amount, loan_status\n  FROM loans\n  WHERE customer_id = p_customer_id;\n$$;\n\nCALL get_customer_loans(101);",
                "example": "A stored procedure named ProcessMonthlyInterest could loop through active loans, calculate interest, insert transaction rows, and log a summary — all inside the database in one call.",
                "explanation": "Stored procedures centralize business logic in the database, reduce repeated network round trips, and can encapsulate multi-step transactional work (calculate → insert → commit) behind one callable name. Trade-offs: logic becomes harder to version-control alongside application code, and it ties you more closely to one database vendor's procedural language (T-SQL, PL/pgSQL, PL/SQL). This platform's browser practice engine (SQLite) does not support CREATE PROCEDURE, so this lesson is conceptual — study the syntax pattern above for interviews and real projects on MySQL, PostgreSQL, SQL Server or Oracle.",
                "practice": "Conceptual: What is one advantage and one drawback of moving business logic into a stored procedure instead of application code?",
                "type": "conceptual"
            },
            {
                "title": "Stored Procedure vs Function vs View",
                "concept": "All three are reusable saved database objects, but they serve different purposes: a view saves a SELECT query, a function returns a value and can be used inside another SQL statement, and a stored procedure performs an action and is called on its own.",
                "syntax": "View:       SELECT * FROM view_name;\nFunction:   SELECT function_name(column) FROM table_name;\nProcedure:  CALL procedure_name(args);",
                "example": "A view active_customers simplifies a filter. A function calculate_age(dob) can be used inline inside any SELECT. A procedure transfer_funds(from_acc, to_acc, amount) performs a debit-and-credit transaction and cannot be embedded inside a SELECT.",
                "explanation": "Interview shorthand: views are for reusable reads, functions are for reusable calculations you can embed in a query, and procedures are for reusable actions/workflows — including ones that change data or run multiple statements as a unit.",
                "practice": "Conceptual: Would you implement 'calculate a customer's loyalty tier from their transaction history' as a function or a stored procedure? Justify your choice.",
                "type": "conceptual"
            }
        ]
    },
    "interview": {
        "title": "💼 SQL Interview",
        "subtitle": "Real-world conceptual and coding patterns for roughly 0–5 years of experience.",
        "lessons": [
            {
                "title": "Interview: Second-Highest Salary / Value",
                "concept": "A classic interview problem is finding the second-highest distinct value, while correctly handling duplicate maximum values.",
                "syntax": "SELECT MAX(value)\nFROM table_name\nWHERE value < (SELECT MAX(value) FROM table_name);",
                "example": "SELECT MAX(principal_amount) AS second_highest_loan\nFROM loans\nWHERE principal_amount < (SELECT MAX(principal_amount) FROM loans);",
                "explanation": "First find the maximum. Then restrict the outer query to values below that maximum and take the maximum of the remaining values. Duplicates of the highest value do not break the logic.",
                "practice": "Find the second-highest distinct principal_amount in loans.",
                "practiceQuery": "SELECT MAX(principal_amount) AS second_highest_loan\nFROM loans\nWHERE principal_amount < (SELECT MAX(principal_amount) FROM loans);",
                "database": "Banking"
            },
            {
                "title": "Interview: Nth Highest Value",
                "concept": "For a general Nth-highest problem, DENSE_RANK is often clearer because it ranks distinct values without gaps.",
                "syntax": "DENSE_RANK() OVER (ORDER BY value DESC)",
                "example": "WITH ranked AS (\nSELECT principal_amount,\nDENSE_RANK() OVER (ORDER BY principal_amount DESC) rnk\nFROM loans)\nSELECT DISTINCT principal_amount\nFROM ranked WHERE rnk = 3;",
                "explanation": "Flow: order distinct-value positions → assign dense ranks → filter the requested rank. Clarify whether the interviewer wants the Nth distinct value or the Nth row.",
                "practice": "Find the third-highest distinct principal_amount.",
                "practiceQuery": "WITH ranked AS (\n  SELECT principal_amount,\n  DENSE_RANK() OVER (ORDER BY principal_amount DESC) AS rnk\n  FROM loans\n)\nSELECT DISTINCT principal_amount\nFROM ranked\nWHERE rnk = 3;",
                "database": "Banking"
            },
            {
                "title": "Interview: WHERE vs HAVING",
                "concept": "WHERE filters rows before grouping. HAVING filters groups after aggregation.",
                "syntax": "FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY",
                "example": "SELECT account_id, SUM(amount) AS total_amount\nFROM transactions\nWHERE transaction_status = 'Completed'\nGROUP BY account_id\nHAVING SUM(amount) > 100000;",
                "explanation": "If the condition describes an individual row, use WHERE. If it describes an aggregate such as SUM or COUNT, use HAVING. This execution-order mental model is a frequent interview discussion.",
                "flow": [
                    "Rows",
                    "↓",
                    "WHERE filters",
                    "↓",
                    "GROUP BY forms groups",
                    "↓",
                    "HAVING filters groups"
                ],
                "practice": "Return accounts whose completed transaction total exceeds 100000.",
                "practiceQuery": "SELECT account_id, SUM(amount) AS total_amount\nFROM transactions\nWHERE transaction_status = 'Completed'\nGROUP BY account_id\nHAVING SUM(amount) > 100000\nORDER BY total_amount DESC\nLIMIT 5;",
                "database": "Banking"
            },
            {
                "title": "Interview: Find Missing Relationships",
                "concept": "Interviewers often ask for entities with no related records, such as customers without accounts or patients without appointments.",
                "syntax": "LEFT JOIN ... WHERE right_table.key IS NULL",
                "example": "SELECT c.customer_id, c.first_name, c.last_name\nFROM customers c\nLEFT JOIN accounts a ON c.customer_id = a.customer_id\nWHERE a.account_id IS NULL;",
                "explanation": "Use LEFT JOIN to preserve every customer, then keep only rows where the right side failed to match. This is a common anti-join pattern.",
                "practice": "Find customers who do not have an account.",
                "practiceQuery": "SELECT c.customer_id, c.first_name, c.last_name\nFROM customers c\nLEFT JOIN accounts a ON c.customer_id = a.customer_id\nWHERE a.account_id IS NULL\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Interview: Latest Record Per Customer",
                "concept": "Finding the latest record for each entity tests window functions, partitioning, ordering and tie-breaking.",
                "syntax": "ROW_NUMBER() OVER (PARTITION BY entity_id ORDER BY date DESC, id DESC)",
                "example": "WITH ranked AS (\nSELECT l.*,\nROW_NUMBER() OVER (\nPARTITION BY customer_id\nORDER BY start_date DESC, loan_id DESC\n) rn\nFROM loans l)\nSELECT * FROM ranked WHERE rn = 1;",
                "explanation": "Flow: partition by customer → sort newest first → assign row numbers → keep rn = 1. The secondary key makes the result deterministic when dates tie.",
                "practice": "Return the latest loan for every customer.",
                "practiceQuery": "WITH ranked AS (\n  SELECT l.*,\n  ROW_NUMBER() OVER (\n    PARTITION BY customer_id\n    ORDER BY start_date DESC, loan_id DESC\n  ) AS rn\n  FROM loans l\n)\nSELECT loan_id, customer_id, principal_amount, start_date, loan_status\nFROM ranked\nWHERE rn = 1\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Interview: Duplicate Detection",
                "concept": "Duplicate detection is usually based on a business key such as email, not the primary key.",
                "syntax": "GROUP BY business_column\nHAVING COUNT(*) > 1",
                "example": "SELECT email, COUNT(*) AS record_count\nFROM customers\nGROUP BY email\nHAVING COUNT(*) > 1;",
                "explanation": "The key interview question is 'what makes two rows duplicates?' State the business definition before writing SQL.",
                "practice": "Find duplicate customer email addresses.",
                "practiceQuery": "SELECT email, COUNT(*) AS record_count\nFROM customers\nWHERE email IS NOT NULL\nGROUP BY email\nHAVING COUNT(*) > 1;",
                "database": "Banking"
            },
            {
                "title": "Interview: JOIN + Aggregation Case",
                "concept": "Real interviews often combine multiple joins and aggregation rather than asking about one SQL keyword in isolation.",
                "syntax": "JOIN → GROUP BY → aggregate → HAVING",
                "example": "SELECT c.customer_id, c.first_name,\nCOUNT(a.account_id) AS account_count,\nCOALESCE(SUM(a.balance),0) AS total_balance\nFROM customers c\nLEFT JOIN accounts a ON c.customer_id = a.customer_id\nGROUP BY c.customer_id, c.first_name;",
                "explanation": "The important reasoning is to preserve customers with no accounts using LEFT JOIN, then aggregate at customer level. Mention the grain of the output before coding.",
                "practice": "For each customer, show account count and total balance.",
                "practiceQuery": "SELECT c.customer_id, c.first_name, c.last_name,\nCOUNT(a.account_id) AS account_count,\nCOALESCE(SUM(a.balance), 0) AS total_balance\nFROM customers c\nLEFT JOIN accounts a ON c.customer_id = a.customer_id\nGROUP BY c.customer_id, c.first_name, c.last_name\nORDER BY total_balance DESC\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Interview: Conditional Metrics",
                "concept": "A common reporting problem is producing several metrics from the same dataset in one query.",
                "syntax": "SUM(CASE WHEN condition THEN 1 ELSE 0 END)",
                "example": "SELECT\nSUM(CASE WHEN transaction_status = 'Completed' THEN 1 ELSE 0 END) completed_count,\nSUM(CASE WHEN transaction_status = 'Pending' THEN 1 ELSE 0 END) pending_count\nFROM transactions;",
                "explanation": "Explain the pattern row by row: each CASE turns a qualifying row into 1 and all other rows into 0; SUM then counts the qualifying rows.",
                "practice": "Return completed, pending and failed transaction counts in one row.",
                "practiceQuery": "SELECT\nSUM(CASE WHEN transaction_status = 'Completed' THEN 1 ELSE 0 END) AS completed_count,\nSUM(CASE WHEN transaction_status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,\nSUM(CASE WHEN transaction_status = 'Failed' THEN 1 ELSE 0 END) AS failed_count\nFROM transactions;",
                "database": "Banking"
            },
            {
                "title": "Interview: EXISTS vs IN",
                "concept": "Both can express membership tests, but EXISTS naturally answers whether at least one related row exists, while IN compares against a returned set of values.",
                "syntax": "WHERE EXISTS (SELECT 1 ...)\nWHERE key IN (SELECT key ...)",
                "example": "SELECT c.customer_id, c.first_name\nFROM customers c\nWHERE EXISTS (\nSELECT 1 FROM loans l WHERE l.customer_id = c.customer_id\n);",
                "explanation": "Interviewers may ask about NULL behavior and performance. Do not claim one is always faster; explain that the optimizer and data distribution matter.",
                "practice": "Find customers with at least one loan using EXISTS.",
                "practiceQuery": "SELECT c.customer_id, c.first_name\nFROM customers c\nWHERE EXISTS (\n  SELECT 1 FROM loans l WHERE l.customer_id = c.customer_id\n)\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Interview: Query Debugging",
                "concept": "A strong SQL candidate can diagnose wrong results, not only write syntactically correct SQL.",
                "syntax": "Check grain → joins → filters → duplicates → aggregation → expected row count",
                "example": "If a customer balance suddenly doubles after joining accounts to another one-to-many table, inspect the join grain before changing the SUM.",
                "explanation": "Flow: define expected output grain → test each join separately → compare row counts → inspect duplicates → aggregate only after confirming the correct grain.",
                "flow": [
                    "Expected grain",
                    "↓",
                    "Test base table",
                    "↓",
                    "Add one join",
                    "↓",
                    "Check row count",
                    "↓",
                    "Add next join",
                    "↓",
                    "Aggregate"
                ],
                "practice": "Conceptual: Why can joining two one-to-many relationships create inflated aggregate totals?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Transaction & Data Integrity Scenario",
                "concept": "Interviewers may test whether you understand how SQL operations interact with data integrity, transactions and constraints.",
                "syntax": "BEGIN;\nUPDATE ...;\nUPDATE ...;\nCOMMIT;\n-- or ROLLBACK",
                "example": "A transfer should debit one account and credit another as one logical unit.",
                "explanation": "Explain Atomicity first, then constraints and isolation. The goal is to show that you understand correctness beyond a single SELECT statement.",
                "practice": "Conceptual: What should happen if the debit succeeds but the credit fails before the transaction commits?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Explain Your Query",
                "concept": "For 0–5 years experience, interviewers often evaluate how clearly you explain SQL reasoning, assumptions, edge cases and trade-offs.",
                "syntax": "Requirement → Tables → Grain → Joins → Filters → Aggregation → Window → Validation",
                "example": "For 'top two loans per customer', state the grain, choose customer_id as the partition, rank by principal_amount, then filter the rank.",
                "explanation": "A good interview answer is not just code. Explain why you chose each clause, what happens with ties, NULLs and missing relationships, and how you would validate the result.",
                "practice": "Conceptual: Explain the approach you would take before writing SQL for a 'top 2 transactions per customer per month' requirement.",
                "type": "conceptual"
            },
            {
                "title": "Interview: DELETE vs TRUNCATE vs DROP",
                "concept": "DELETE removes rows with an optional WHERE clause and can be rolled back inside a transaction. TRUNCATE removes all rows quickly and resets identity counters, with limited rollback support depending on the engine. DROP removes the entire table object, including its structure.",
                "syntax": "DELETE FROM table_name WHERE condition;\nTRUNCATE TABLE table_name;\nDROP TABLE table_name;",
                "example": "DELETE FROM transactions WHERE transaction_status = 'Cancelled';\n-- vs\nTRUNCATE TABLE staging_transactions;\n-- vs\nDROP TABLE staging_transactions;",
                "explanation": "A quick interview answer: DELETE is DML, row-by-row, filterable, and transaction-safe. TRUNCATE is closer to DDL, removes everything at once, and is much faster on very large tables. DROP removes the table itself — the structure is gone, not just the data.",
                "practice": "Conceptual: Why would TRUNCATE be preferred over DELETE for clearing a large staging table between ETL runs?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Execution Order of a SQL Query",
                "concept": "SQL is written in one order but the database engine logically processes it in a different order: FROM/JOIN, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT.",
                "syntax": "FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT",
                "example": "SELECT account_id, COUNT(*) AS tx_count\nFROM transactions\nWHERE transaction_status = 'Completed'\nGROUP BY account_id\nHAVING COUNT(*) > 5\nORDER BY tx_count DESC\nLIMIT 5;",
                "explanation": "This ordering explains several common interview 'gotchas': you cannot reference a SELECT alias in WHERE (WHERE runs before SELECT), but you usually can in ORDER BY (it runs after SELECT); and HAVING can filter on an aggregate because GROUP BY has already run by that point.",
                "practice": "Conceptual: Why can't you write WHERE tx_count > 5 in the query above, but ORDER BY tx_count works fine?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Primary Key vs Unique Key",
                "concept": "A table can have only one PRIMARY KEY, which cannot contain NULLs, while it can have several UNIQUE keys, which typically allow one NULL value (behavior varies slightly by engine).",
                "syntax": "customer_id INTEGER PRIMARY KEY\nemail TEXT UNIQUE",
                "example": "CREATE TABLE demo_customer (\n  customer_id INTEGER PRIMARY KEY,\n  email TEXT UNIQUE,\n  phone TEXT UNIQUE\n);",
                "explanation": "Both enforce uniqueness and are usually backed by an index. The practical difference is intent: the primary key is the table's main identifier used by foreign keys elsewhere, while unique keys enforce business uniqueness rules (like 'no two customers share an email') without necessarily being the identifier other tables reference.",
                "practice": "Conceptual: Could a table have a surrogate primary key (an auto-increment id) and still enforce uniqueness on a natural business column like email? Why is that a common design?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Clustered vs Non-Clustered Index",
                "concept": "A clustered index determines the physical order in which table rows are stored on disk — a table can have at most one. A non-clustered index is a separate structure that points back to the row location and a table can have many.",
                "syntax": "-- SQL Server style\nCREATE CLUSTERED INDEX idx_name ON table_name(column);\nCREATE NONCLUSTERED INDEX idx_name ON table_name(column);",
                "example": "A table's primary key is often the clustered index (rows physically ordered by customer_id), while a non-clustered index on email speeds up lookups by email without changing row storage order.",
                "explanation": "Interview framing: 'clustered = the table's data', 'non-clustered = a lookup structure pointing at the data'. Because there is only one physical row order, only one clustered index is possible per table, but many non-clustered indexes can exist to support different query patterns.",
                "practice": "Conceptual: Why might choosing a frequently-changing column as the clustered index key hurt write performance?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Normalization vs Denormalization",
                "concept": "Normalization splits data into related tables to reduce duplication (good for transactional systems). Denormalization intentionally combines or duplicates data to reduce joins and speed up reads (common in analytics and reporting).",
                "syntax": "Normalized:  customers, accounts, transactions (joined for reports)\nDenormalized: a wide reporting table with customer + account + transaction columns already combined",
                "example": "An OLTP banking database keeps customers and accounts separate. A nightly ETL job might denormalize them into a single customer_account_summary table for a dashboard, trading storage and duplication for query speed.",
                "explanation": "Data engineers frequently work at this boundary: source systems stay normalized for integrity, while analytics/warehouse layers are denormalized (star schemas, wide tables) so BI tools can query without expensive joins at read time.",
                "practice": "Conceptual: Why is a highly-normalized schema often a poor fit for a dashboard that needs sub-second response times?",
                "type": "conceptual"
            },
            {
                "title": "Interview: OLTP vs OLAP",
                "concept": "OLTP (Online Transaction Processing) systems handle many small, fast read/write transactions, such as a banking app processing a payment. OLAP (Online Analytical Processing) systems handle complex, read-heavy queries over large historical volumes, such as a sales dashboard.",
                "syntax": "OLTP: INSERT/UPDATE-heavy, normalized, row-oriented\nOLAP: SELECT/aggregate-heavy, denormalized, often column-oriented",
                "example": "The core banking system processing a customer's withdrawal in milliseconds is OLTP. A data warehouse calculating total quarterly loan disbursement across all branches is OLAP.",
                "explanation": "This distinction drives schema design choices, indexing strategy and even the choice of database engine (row-store like PostgreSQL/MySQL for OLTP; column-store like Snowflake/Redshift/BigQuery for OLAP).",
                "practice": "Conceptual: Why is heavy indexing that helps OLAP reporting queries sometimes harmful to OLTP write performance?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Star Schema vs Snowflake Schema",
                "concept": "A star schema has one central fact table connected directly to denormalized dimension tables. A snowflake schema normalizes those dimensions further into sub-dimension tables, resembling a snowflake shape.",
                "syntax": "Star:      fact_transactions → dim_customer, dim_account, dim_date\nSnowflake: fact_transactions → dim_customer → dim_city → dim_state",
                "example": "In a star schema, dim_customer might store city and state directly. In a snowflake schema, dim_customer references a separate dim_city table, which references dim_state.",
                "explanation": "Star schemas favor query simplicity and speed (fewer joins) and are the default choice for most BI tools. Snowflake schemas favor storage efficiency and reduce dimension duplication, at the cost of more joins per query.",
                "practice": "Conceptual: Why do most modern BI/reporting tools recommend a star schema over a snowflake schema for dashboard performance?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Slowly Changing Dimensions (SCD Type 1 & 2)",
                "concept": "A Slowly Changing Dimension handles how a dimension table reacts when an attribute changes over time. Type 1 overwrites the old value with no history. Type 2 preserves history by adding a new row with effective date ranges.",
                "syntax": "Type 1: UPDATE dim_customer SET city = 'Mumbai' WHERE customer_id = 101;\n\nType 2: INSERT new row with new city, start_date=today, end_date=NULL;\n        UPDATE previous row SET end_date = today - 1, is_current = 0;",
                "example": "If customer 101 moves from Pune to Mumbai: Type 1 simply overwrites city to 'Mumbai', losing the fact they were ever in Pune. Type 2 keeps the Pune row (end_date set) and adds a new Mumbai row (is_current = 1), so historical reports for last year still correctly show Pune.",
                "explanation": "This is one of the most common data engineering interview topics. Choose Type 1 when history doesn't matter (e.g. correcting a typo), and Type 2 when historical accuracy matters for reporting (e.g. tracking where a customer lived when a loan was issued).",
                "practice": "Conceptual: Why would a bank need SCD Type 2 for a customer's home_branch attribute rather than simply overwriting it?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Fact Table vs Dimension Table",
                "concept": "A fact table stores measurable, numeric business events (amounts, counts) at a specific grain, along with foreign keys to dimensions. A dimension table stores descriptive context (who, what, where, when) used to filter and group the facts.",
                "syntax": "fact_transactions(transaction_id, account_id, date_id, amount)\ndim_account(account_id, account_type, branch)\ndim_date(date_id, day, month, year)",
                "example": "fact_transactions holds one row per transaction with a numeric amount; dim_account and dim_date describe the context needed to slice that amount by branch, account type or month.",
                "explanation": "The first design question in any warehouse project is 'what is the grain of the fact table?' — one row per transaction, per day, per order line? Getting the grain wrong causes double counting or under counting in every downstream report.",
                "practice": "Conceptual: If fact_transactions is at daily-summary grain instead of individual-transaction grain, what analysis becomes impossible?",
                "type": "conceptual"
            },
            {
                "title": "Interview: ETL vs ELT",
                "concept": "ETL (Extract, Transform, Load) transforms data before loading it into the target system. ELT (Extract, Load, Transform) loads raw data first and transforms it inside the target system, typically a modern cloud data warehouse.",
                "syntax": "ETL: source → transform (external engine) → warehouse\nELT: source → warehouse (raw) → transform (SQL inside warehouse)",
                "example": "A traditional ETL pipeline cleans and reshapes loan data in a separate processing tool before loading it into the warehouse. A modern ELT pipeline loads raw loan data as-is, then uses SQL (often via dbt) inside the warehouse to build cleaned, modeled tables.",
                "explanation": "ELT became popular because cloud warehouses (Snowflake, BigQuery, Redshift) can now cheaply store and transform huge raw datasets with SQL, shifting transformation logic closer to the analyst/engineer and making it version-controllable.",
                "practice": "Conceptual: What is one advantage of keeping the raw, untransformed data in ELT even after cleaned tables are built on top of it?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Batch vs Streaming Processing",
                "concept": "Batch processing runs on a schedule over a bounded chunk of accumulated data (e.g. nightly). Streaming processing handles events continuously and near-instantly as they arrive.",
                "syntax": "Batch:     scheduled job every N hours over a date range\nStreaming: continuous pipeline processing each event as it occurs",
                "example": "A nightly job that aggregates yesterday's transactions into a summary table is batch. A fraud-detection pipeline that flags a suspicious transaction within seconds of it occurring is streaming.",
                "explanation": "Batch is simpler to build, test and debug, and is sufficient for most reporting needs. Streaming adds real-time value but brings more operational complexity (ordering, late-arriving data, exactly-once processing).",
                "practice": "Conceptual: Why would daily interest calculation likely use batch processing, while fraud alerts would use streaming?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Table Partitioning Strategy",
                "concept": "Partitioning splits a very large table into smaller physical segments (commonly by date range) so queries that filter on the partition key only scan relevant partitions instead of the whole table.",
                "syntax": "-- conceptual pattern (engine-specific)\nCREATE TABLE transactions_2026 PARTITION OF transactions\nFOR VALUES FROM ('2026-01-01') TO ('2027-01-01');",
                "example": "A transactions table partitioned by transaction_date lets a query for 'last month's transactions' scan only that month's partition instead of years of history.",
                "explanation": "Good partition key choice mirrors how the table is most commonly filtered — date is extremely common for transactional/event data. Partition pruning is one of the biggest levers for performance and cost in large analytical tables.",
                "practice": "Conceptual: Why is transaction_date usually a better partition key for the transactions table than transaction_status?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Idempotency in Data Pipelines",
                "concept": "An idempotent pipeline produces the same final result no matter how many times it is re-run for the same input, which is critical when jobs fail and need to be retried.",
                "syntax": "-- Idempotent pattern: delete-then-insert or upsert for the target partition\nDELETE FROM daily_summary WHERE report_date = '2026-08-16';\nINSERT INTO daily_summary SELECT ... WHERE transaction_date = '2026-08-16';",
                "example": "If a nightly job that appends rows to daily_summary is re-run after a partial failure, a non-idempotent design would duplicate rows; an idempotent design (delete-and-reload for that date, or UPSERT) produces the exact same table either way.",
                "explanation": "This is a favorite data-engineering interview question because it distinguishes candidates who have run real production pipelines from those who have only written one-off queries. Always ask 'what happens if this job runs twice for the same day?'",
                "practice": "Conceptual: How would you redesign a plain INSERT-only nightly job into an idempotent one?",
                "type": "conceptual"
            },
            {
                "title": "Interview: CTE vs Subquery vs Temporary Table",
                "concept": "All three can hold an intermediate result, but they differ in reusability and scope: a CTE is named and readable but scoped to one statement, a subquery is inline and unnamed, and a temp table physically persists for the session and can be indexed or reused across multiple statements.",
                "syntax": "CTE:      WITH x AS (SELECT ...) SELECT ... FROM x;\nSubquery: SELECT ... FROM (SELECT ...) x;\nTemp tbl: CREATE TEMP TABLE x AS SELECT ...; SELECT ... FROM x;",
                "example": "For a one-off multi-step report, a CTE is usually clearest. For a value reused across several separate queries in a session, or one that benefits from its own index, a temp table can be more efficient.",
                "explanation": "Interview answer structure: readability → CTE; simplicity for a single inline filter → subquery; reuse across multiple statements or need for indexing → temp table. Recursive CTEs (WITH RECURSIVE) can also do things a plain subquery cannot, such as traversing a hierarchy.",
                "practice": "Conceptual: When would you choose a temporary table over a CTE even though the CTE is easier to read?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Recursive CTE",
                "concept": "A recursive CTE repeatedly refers to itself to build results across an unknown number of levels, commonly used for hierarchies (org charts, category trees) or generating sequences.",
                "syntax": "WITH RECURSIVE cte_name AS (\n  SELECT ... -- anchor member\n  UNION ALL\n  SELECT ... FROM table_name JOIN cte_name ON ... -- recursive member\n)\nSELECT * FROM cte_name;",
                "example": "WITH RECURSIVE months(n) AS (\n  SELECT 1\n  UNION ALL\n  SELECT n + 1 FROM months WHERE n < 12\n)\nSELECT n FROM months;",
                "explanation": "Flow: the anchor member produces the starting row(s); the recursive member repeatedly joins back to the CTE's own growing result until no new rows are produced (n < 12 becomes false). This same pattern scales to real hierarchies like 'find all employees under a given manager, at any depth.'",
                "flow": [
                    "Anchor: n = 1",
                    "↓",
                    "Recursive: n = n + 1",
                    "↓",
                    "Repeat while n < 12",
                    "↓",
                    "Stop and combine all rows"
                ],
                "practice": "Generate the numbers 1 through 12 using a recursive CTE — useful for building a month sequence for reports.",
                "practiceQuery": "WITH RECURSIVE months(n) AS (\n  SELECT 1\n  UNION ALL\n  SELECT n + 1 FROM months WHERE n < 12\n)\nSELECT n FROM months;",
                "database": "Banking"
            },
            {
                "title": "Interview: Find and Remove Duplicate Rows",
                "concept": "A common task is identifying duplicate rows by a business key and deleting all but one 'preferred' copy — ROW_NUMBER makes this deterministic.",
                "syntax": "WITH ranked AS (\n  SELECT rowid, *,\n  ROW_NUMBER() OVER (PARTITION BY business_key ORDER BY tiebreaker) rn\n  FROM table_name\n)\nDELETE FROM table_name WHERE rowid IN (SELECT rowid FROM ranked WHERE rn > 1);",
                "example": "WITH ranked AS (\n  SELECT rowid, email,\n  ROW_NUMBER() OVER (PARTITION BY email ORDER BY rowid) rn\n  FROM customers\n)\nSELECT rowid FROM ranked WHERE rn > 1;",
                "explanation": "First identify duplicates with GROUP BY ... HAVING COUNT(*) > 1 to confirm the scope, then use ROW_NUMBER to explicitly decide which copy survives (rn = 1) before deleting the rest (rn > 1). Always SELECT the rows to be deleted first and review them before running the DELETE.",
                "practice": "Identify (without deleting) which customer rows would be considered duplicates by email, keeping the lowest rowid as the survivor.",
                "practiceQuery": "WITH ranked AS (\n  SELECT rowid, customer_id, email,\n  ROW_NUMBER() OVER (PARTITION BY email ORDER BY rowid) AS rn\n  FROM customers\n  WHERE email IS NOT NULL\n)\nSELECT rowid, customer_id, email, rn\nFROM ranked\nWHERE rn > 1;",
                "database": "Banking"
            },
            {
                "title": "Interview: Percentage of Total with Window Functions",
                "concept": "A window SUM without a PARTITION BY (or with one) can compute a grand total or group total alongside each row, letting you calculate each row's percentage contribution in the same query.",
                "syntax": "value / SUM(value) OVER (PARTITION BY group_column) * 100",
                "example": "SELECT account_id, amount,\n  ROUND(amount * 100.0 / SUM(amount) OVER (), 2) AS pct_of_total\nFROM transactions;",
                "explanation": "The window function calculates the group or grand total without collapsing rows, so each row can immediately be divided by that total to get a percentage — no self-join or second query needed.",
                "practice": "For each transaction, show its amount and what percentage it represents of the overall transaction total.",
                "practiceQuery": "SELECT transaction_id, amount,\n  ROUND(amount * 100.0 / SUM(amount) OVER (), 2) AS pct_of_total\nFROM transactions\nORDER BY pct_of_total DESC\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Interview: First and Last Value Per Group",
                "concept": "Finding the first and last record per group (e.g. per account) can be done with MIN/MAX plus a join, or more directly with FIRST_VALUE/LAST_VALUE window functions.",
                "syntax": "FIRST_VALUE(column) OVER (PARTITION BY group_column ORDER BY sort_column)\nLAST_VALUE(column) OVER (\n  PARTITION BY group_column ORDER BY sort_column\n  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING\n)",
                "example": "SELECT account_id, transaction_date, amount,\n  FIRST_VALUE(amount) OVER (\n    PARTITION BY account_id ORDER BY transaction_date, transaction_id\n  ) AS first_amount\nFROM transactions;",
                "explanation": "LAST_VALUE needs an explicit frame (ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) — without it, the default frame stops at the current row, so LAST_VALUE would just return the current row's own value instead of the true last row in the partition. This frame detail is a frequent interview trap.",
                "practice": "For every transaction, show the first transaction amount recorded for that account.",
                "practiceQuery": "SELECT account_id, transaction_date, amount,\n  FIRST_VALUE(amount) OVER (\n    PARTITION BY account_id\n    ORDER BY transaction_date, transaction_id\n  ) AS first_amount\nFROM transactions\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Interview: COUNT(*) vs COUNT(column) vs COUNT(DISTINCT column)",
                "concept": "COUNT(*) counts all rows regardless of NULLs. COUNT(column) counts only rows where that column is not NULL. COUNT(DISTINCT column) counts unique non-NULL values.",
                "syntax": "SELECT COUNT(*), COUNT(phone), COUNT(DISTINCT city) FROM customers;",
                "example": "If 100 customers exist, 90 have a phone number on file, and there are 12 distinct cities: COUNT(*) = 100, COUNT(phone) = 90, COUNT(DISTINCT city) = 12.",
                "explanation": "This is a very frequent early-interview question precisely because the three often return different numbers on the same table, and confusing them leads to subtly wrong metrics like 'total customers' actually reporting 'customers with a phone number'.",
                "practice": "Compare COUNT(*), COUNT(phone) and COUNT(DISTINCT city) on customers.",
                "practiceQuery": "SELECT COUNT(*) AS total_rows,\n       COUNT(phone) AS rows_with_phone,\n       COUNT(DISTINCT city) AS distinct_cities\nFROM customers;",
                "database": "Banking"
            },
            {
                "title": "Interview: IS NULL vs = NULL",
                "concept": "NULL means 'unknown', so it can never be compared with = or <>. WHERE column = NULL always evaluates to unknown (effectively false) and returns zero rows — you must use IS NULL or IS NOT NULL.",
                "syntax": "WHERE column IS NULL\nWHERE column IS NOT NULL",
                "example": "SELECT customer_id FROM customers WHERE phone IS NULL;  -- correct\nSELECT customer_id FROM customers WHERE phone = NULL;    -- always returns 0 rows",
                "explanation": "This is a classic beginner-to-intermediate trap. Because NULL represents an unknown value, comparing an unknown to anything (even another NULL) with = is itself unknown, not true — SQL's three-valued logic (TRUE/FALSE/UNKNOWN) is why IS NULL exists as a dedicated operator.",
                "practice": "Find customers with a missing phone number using the correct NULL comparison.",
                "practiceQuery": "SELECT customer_id, first_name, phone\nFROM customers\nWHERE phone IS NULL\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Interview: NULLs Inside Aggregate Functions",
                "concept": "SUM, AVG, MIN, MAX and COUNT(column) all silently skip NULL values rather than treating them as zero — this can make averages misleading if not accounted for.",
                "syntax": "AVG(column)                       -- ignores NULLs in the denominator\nAVG(COALESCE(column, 0))          -- treats NULLs as 0 instead",
                "example": "If three loan rows have interest_rate values 4, 6 and NULL, AVG(interest_rate) returns 5 (averaging only 4 and 6), not (4+6+0)/3.",
                "explanation": "Always ask 'should a missing value be excluded, or treated as zero?' before trusting an AVG. Wrapping the column in COALESCE(column, 0) changes the denominator and can produce a very different, sometimes more correct, business answer.",
                "practice": "Conceptual: If 20% of loans have a NULL interest_rate because it hasn't been set yet, why could AVG(interest_rate) overstate the true average rate across all loans?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Self Join for Peer Comparison",
                "concept": "A self join can compare rows within the same table to each other — for example, finding pairs of accounts or loans that share the same attribute.",
                "syntax": "SELECT a.column, b.column\nFROM table_name a\nJOIN table_name b ON a.shared_column = b.shared_column AND a.id <> b.id;",
                "example": "SELECT l1.loan_id, l2.loan_id, l1.principal_amount\nFROM loans l1\nJOIN loans l2\n  ON l1.customer_id = l2.customer_id\n AND l1.loan_id < l2.loan_id;",
                "explanation": "The l1.loan_id < l2.loan_id condition (rather than <>) is a common technique to avoid both duplicate mirrored pairs (A,B and B,A) and a row matching itself. Self joins are the standard pattern for 'find customers/loans/employees that share X with another row.'",
                "practice": "Find pairs of loans belonging to the same customer, avoiding duplicate mirrored pairs.",
                "practiceQuery": "SELECT l1.customer_id, l1.loan_id AS loan_a, l2.loan_id AS loan_b\nFROM loans l1\nJOIN loans l2\n  ON l1.customer_id = l2.customer_id\n AND l1.loan_id < l2.loan_id\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Interview: Pivoting Rows into Columns",
                "concept": "SQL does not have a universal native PIVOT keyword (SQLite and MySQL lack it entirely), so pivoting — turning row values into columns — is usually done with conditional aggregation.",
                "syntax": "SELECT group_column,\n  SUM(CASE WHEN category_column = 'A' THEN value_column ELSE 0 END) AS a,\n  SUM(CASE WHEN category_column = 'B' THEN value_column ELSE 0 END) AS b\nFROM table_name\nGROUP BY group_column;",
                "example": "SELECT account_id,\n  SUM(CASE WHEN transaction_type = 'Deposit' THEN amount ELSE 0 END) AS deposit_total,\n  SUM(CASE WHEN transaction_type = 'Withdrawal' THEN amount ELSE 0 END) AS withdrawal_total\nFROM transactions\nGROUP BY account_id;",
                "explanation": "Flow: decide the target columns (one per category value) → for each row, CASE routes its value into the matching column or 0 → SUM/GROUP BY collapses to one summary row per group. This is the standard interview answer for 'how would you pivot without a PIVOT keyword?'",
                "practice": "Pivot transaction_type into deposit_total and withdrawal_total columns for each account.",
                "practiceQuery": "SELECT account_id,\n  SUM(CASE WHEN transaction_type = 'Deposit' THEN amount ELSE 0 END) AS deposit_total,\n  SUM(CASE WHEN transaction_type = 'Withdrawal' THEN amount ELSE 0 END) AS withdrawal_total\nFROM transactions\nGROUP BY account_id\nORDER BY account_id\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Interview: String Aggregation (GROUP_CONCAT)",
                "concept": "String aggregation combines multiple row values from a group into a single delimited text value — GROUP_CONCAT in SQLite/MySQL, STRING_AGG in PostgreSQL/SQL Server, LISTAGG in Oracle.",
                "syntax": "GROUP_CONCAT(column, ', ')   -- SQLite / MySQL\nSTRING_AGG(column, ', ')     -- PostgreSQL / SQL Server",
                "example": "SELECT customer_id, GROUP_CONCAT(account_number, ', ') AS account_numbers\nFROM accounts\nGROUP BY customer_id;",
                "explanation": "This turns a one-to-many relationship into a single readable row per parent entity — useful for exports and summary reports where a full join would otherwise produce one row per child record.",
                "practice": "For each customer, list all of their account numbers as a single comma-separated value.",
                "practiceQuery": "SELECT customer_id, GROUP_CONCAT(account_number, ', ') AS account_numbers\nFROM accounts\nGROUP BY customer_id\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Interview: Finding Gaps in a Sequence",
                "concept": "A common data-quality check is finding missing numbers in what should be a continuous sequence, such as invoice or loan IDs — often surfaced by comparing each value to the previous one using LAG.",
                "syntax": "WITH ordered AS (\n  SELECT id, LAG(id) OVER (ORDER BY id) AS prev_id\n  FROM table_name\n)\nSELECT prev_id, id\nFROM ordered\nWHERE id - prev_id > 1;",
                "example": "WITH ordered AS (\n  SELECT loan_id, LAG(loan_id) OVER (ORDER BY loan_id) AS prev_id\n  FROM loans\n)\nSELECT prev_id, loan_id AS next_id\nFROM ordered\nWHERE loan_id - prev_id > 1;",
                "explanation": "Flow: order the ids → LAG pulls the previous id alongside the current one → any difference greater than 1 marks a gap. This pattern generalizes to detecting missing dates in a daily reporting table by swapping the numeric difference for a date difference.",
                "practice": "Find any gaps in the loan_id sequence.",
                "practiceQuery": "WITH ordered AS (\n  SELECT loan_id, LAG(loan_id) OVER (ORDER BY loan_id) AS prev_id\n  FROM loans\n)\nSELECT prev_id, loan_id AS next_id\nFROM ordered\nWHERE loan_id - prev_id > 1\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Interview: Month-over-Month Growth",
                "concept": "Comparing each period's total against the previous period is a classic reporting pattern combining GROUP BY (to build the period totals) with LAG (to bring the prior period alongside the current one).",
                "syntax": "WITH monthly AS (\n  SELECT strftime('%Y-%m', date_column) AS ym, SUM(value) AS total\n  FROM table_name\n  GROUP BY ym\n)\nSELECT ym, total,\n  LAG(total) OVER (ORDER BY ym) AS prev_total,\n  ROUND((total - LAG(total) OVER (ORDER BY ym)) * 100.0 / LAG(total) OVER (ORDER BY ym), 2) AS pct_growth\nFROM monthly;",
                "example": "WITH monthly AS (\n  SELECT strftime('%Y-%m', transaction_date) AS ym, SUM(amount) AS total\n  FROM transactions\n  GROUP BY ym\n)\nSELECT ym, total, LAG(total) OVER (ORDER BY ym) AS prev_total\nFROM monthly;",
                "explanation": "Flow: first collapse raw rows into monthly totals with GROUP BY, then apply LAG over that already-aggregated result to see the previous month next to the current one, and finally calculate percentage growth from the difference.",
                "practice": "Calculate month-over-month transaction total growth.",
                "practiceQuery": "WITH monthly AS (\n  SELECT strftime('%Y-%m', transaction_date) AS ym, SUM(amount) AS total\n  FROM transactions\n  GROUP BY ym\n)\nSELECT ym, total,\n  LAG(total) OVER (ORDER BY ym) AS prev_total\nFROM monthly\nORDER BY ym\nLIMIT 10;",
                "database": "Banking"
            },
            {
                "title": "Interview: Median Value with SQL",
                "concept": "SQL has no universal built-in MEDIAN() function in every engine, so it is commonly computed by ranking rows and picking the middle position(s), or via PERCENTILE_CONT where supported.",
                "syntax": "-- PostgreSQL / SQL Server (where supported)\nPERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY column)\n\n-- Portable pattern via ranking\nWITH ordered AS (\n  SELECT column, ROW_NUMBER() OVER (ORDER BY column) rn, COUNT(*) OVER () cnt\n  FROM table_name\n)\nSELECT AVG(column) FROM ordered\nWHERE rn IN ((cnt + 1) / 2, (cnt + 2) / 2);",
                "example": "For loan principal_amount values, the ranking pattern picks the middle row (odd count) or averages the two middle rows (even count) after ordering.",
                "explanation": "Explain the two middle-row cases clearly in an interview: with an odd number of rows there is one exact middle value; with an even number of rows the median is the average of the two central values. This portable pattern works even on engines without a native median function.",
                "practice": "Estimate the median principal_amount across all loans using the ranking approach.",
                "practiceQuery": "WITH ordered AS (\n  SELECT principal_amount,\n  ROW_NUMBER() OVER (ORDER BY principal_amount) AS rn,\n  COUNT(*) OVER () AS cnt\n  FROM loans\n)\nSELECT AVG(principal_amount) AS median_principal\nFROM ordered\nWHERE rn IN ((cnt + 1) / 2, (cnt + 2) / 2);",
                "database": "Banking"
            },
            {
                "title": "Interview: Scalar Function vs Aggregate Function",
                "concept": "A scalar function returns one output value per input row (e.g. UPPER, ROUND, DATE). An aggregate function returns one output value per group of many rows (e.g. SUM, COUNT, AVG).",
                "syntax": "Scalar:    SELECT UPPER(first_name) FROM customers;\nAggregate: SELECT COUNT(*) FROM customers;",
                "example": "SELECT customer_id, UPPER(city) AS city_upper FROM customers;  -- scalar, one row in, one row out\nSELECT city, COUNT(*) FROM customers GROUP BY city;  -- aggregate, many rows collapse to one per city",
                "explanation": "This distinction matters for GROUP BY rules: a scalar function can sit alongside a non-aggregated column freely, while an aggregate function requires every other selected column to either also be aggregated or included in GROUP BY.",
                "practice": "Conceptual: Why does SELECT city, first_name, COUNT(*) FROM customers GROUP BY city fail in standard SQL?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Anti-Join Pattern (NOT IN vs NOT EXISTS vs LEFT JOIN)",
                "concept": "Finding rows in one table with no match in another (an anti-join) can be written three common ways: NOT IN, NOT EXISTS, or LEFT JOIN ... WHERE key IS NULL — they usually agree, except NOT IN has a well-known NULL pitfall.",
                "syntax": "WHERE key NOT IN (SELECT key FROM other_table)\nWHERE NOT EXISTS (SELECT 1 FROM other_table WHERE other_table.key = this_table.key)\nLEFT JOIN other_table ON ... WHERE other_table.key IS NULL",
                "example": "SELECT c.customer_id FROM customers c\nWHERE c.customer_id NOT IN (SELECT customer_id FROM loans WHERE customer_id IS NOT NULL);",
                "explanation": "The critical trap: if the subquery in NOT IN can return even a single NULL, the entire NOT IN comparison becomes unknown for every row and silently returns zero rows. NOT EXISTS and LEFT JOIN/IS NULL do not have this problem, so many engineers prefer them by default for anti-joins.",
                "practice": "Conceptual: Why does adding WHERE customer_id IS NOT NULL inside the NOT IN subquery matter so much here?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Query Optimization Checklist",
                "concept": "When a query runs slowly, experienced engineers work through a structured checklist rather than guessing: filters, indexes, join order/type, unnecessary columns, and row explosion from joins.",
                "syntax": "1. Are WHERE filters selective and indexed?\n2. Are JOIN keys indexed on both sides?\n3. Is SELECT * pulling unused columns?\n4. Does any join multiply rows unexpectedly (wrong grain)?\n5. Can a subquery be rewritten as a JOIN or vice versa?\n6. Does EXPLAIN / EXPLAIN QUERY PLAN show a full table scan where an index scan is expected?",
                "example": "A report joining transactions to accounts to customers to branches, filtered only by transaction_date, likely benefits from an index on transactions(transaction_date) and on the join key columns.",
                "explanation": "In interviews, walking through this checklist out loud — rather than jumping straight to 'add an index' — demonstrates structured problem solving, which is usually what the interviewer is actually testing.",
                "practice": "Conceptual: Given a report that joins four tables and filters on one date column, which single index would you check for first, and why?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Composite Primary Keys",
                "concept": "A composite (compound) primary key uses two or more columns together to uniquely identify a row, used when no single column is unique on its own — common in many-to-many join/bridge tables.",
                "syntax": "CREATE TABLE account_holders (\n  account_id INTEGER,\n  customer_id INTEGER,\n  PRIMARY KEY (account_id, customer_id)\n);",
                "example": "A joint bank account with two co-holders needs a bridge table like account_holders(account_id, customer_id) where neither column alone is unique, but the pair together is.",
                "explanation": "Composite keys are the standard solution for representing many-to-many relationships (one account can have many customers; one customer can have many accounts) without duplicating data.",
                "practice": "Conceptual: Why would a joint-account bridge table need a composite key of (account_id, customer_id) instead of its own single auto-increment id?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Surrogate Key vs Natural Key",
                "concept": "A natural key is a real-world business attribute that already uniquely identifies a row (like an email or a national ID). A surrogate key is an artificial identifier (often auto-increment) with no business meaning, generated purely to identify the row.",
                "syntax": "Natural key:   PRIMARY KEY (pan_number)\nSurrogate key: customer_id INTEGER PRIMARY KEY AUTOINCREMENT",
                "example": "A customer's email could theoretically be a natural key, but if a customer legitimately changes email, a natural key forces cascading updates everywhere it's referenced; a surrogate customer_id stays stable regardless.",
                "explanation": "Surrogate keys are preferred in most modern schema designs, especially warehouses, because they never change, are usually smaller/faster to join on, and insulate the schema from real-world data changes. Natural keys are still enforced separately as UNIQUE constraints when needed.",
                "practice": "Conceptual: What breaks across a database if a natural key like email is used as a primary key and a customer later needs to change their email?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Materialized View vs Regular View",
                "concept": "A regular view re-runs its underlying query every time it is selected from. A materialized view physically stores the query's result set and must be refreshed to reflect new data, trading storage and staleness for read speed.",
                "syntax": "-- PostgreSQL\nCREATE MATERIALIZED VIEW view_name AS SELECT ...;\nREFRESH MATERIALIZED VIEW view_name;",
                "example": "A regular view of 'monthly account totals' always shows live numbers but recalculates every time. A materialized version of the same view answers instantly but only reflects data as of the last REFRESH.",
                "explanation": "Choose a materialized view when the underlying query is expensive and slightly-stale data is acceptable (e.g. a dashboard refreshed hourly); choose a regular view when correctness must always be current and the query is cheap enough to re-run.",
                "practice": "Conceptual: For a real-time fraud dashboard, would you use a regular view or a materialized view, and why?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Handling Late-Arriving / Out-of-Order Data",
                "concept": "In real pipelines, records for a given date sometimes arrive after that date's batch has already run, requiring a strategy for reprocessing or reconciling the affected periods.",
                "syntax": "-- Common pattern: reprocess a rolling window on every run\nDELETE FROM daily_summary WHERE report_date >= DATE('now', '-3 days');\nINSERT INTO daily_summary SELECT ... WHERE transaction_date >= DATE('now', '-3 days');",
                "example": "If a branch's transaction feed is occasionally delayed by a day, a nightly job that always recalculates and overwrites the last 3 days (not just 'yesterday') automatically absorbs late-arriving corrections.",
                "explanation": "This connects directly back to idempotency: a rolling reprocessing window combined with a delete-and-reload (or upsert) pattern is one of the simplest reliable ways to handle late data without complex event-time logic.",
                "practice": "Conceptual: Why is recalculating a rolling 3-day window each night safer than only ever processing 'yesterday'?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Data Quality Checks in SQL",
                "concept": "Before trusting a dataset for reporting, engineers typically run a standard set of SQL-based data quality checks: row counts, null rates, duplicate keys, referential integrity, and value-range sanity checks.",
                "syntax": "-- Row count\nSELECT COUNT(*) FROM table_name;\n-- Null rate\nSELECT SUM(CASE WHEN column IS NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*) FROM table_name;\n-- Orphaned foreign keys\nSELECT COUNT(*) FROM child_table c LEFT JOIN parent_table p ON c.key = p.key WHERE p.key IS NULL;",
                "example": "SELECT COUNT(*) AS orphaned_accounts\nFROM accounts a\nLEFT JOIN customers c ON a.customer_id = c.customer_id\nWHERE c.customer_id IS NULL;",
                "explanation": "Running a handful of these checks after every load catches broken pipelines (missing foreign keys, sudden spikes in NULLs, unexpected duplicate rows) before they reach a dashboard or report and mislead a business decision.",
                "practice": "Check for any accounts that reference a customer_id that no longer exists in customers.",
                "practiceQuery": "SELECT COUNT(*) AS orphaned_accounts\nFROM accounts a\nLEFT JOIN customers c ON a.customer_id = c.customer_id\nWHERE c.customer_id IS NULL;",
                "database": "Banking"
            },
            {
                "title": "Interview: Explaining a Dashboard Query End-to-End",
                "concept": "For 2–5 years of experience, interviewers often want to see the full reasoning process behind building a report, not just a final query — from requirement to validated output.",
                "syntax": "Requirement → Grain → Source tables → Joins → Filters → Aggregation → Validation → Performance check",
                "example": "For 'monthly active-customer count by branch': clarify what 'active' means, pick the grain (one row per customer per month), identify source tables, join carefully to avoid row explosion, aggregate, and finally sanity-check totals against a known number.",
                "explanation": "A strong answer walks through: (1) clarifying ambiguous requirements first, (2) stating the target grain before writing SQL, (3) explaining join choices and why LEFT vs INNER matters here, (4) validating the result against an independent check (like a rough total), and (5) noting how the query would be scheduled/monitored in production.",
                "practice": "Conceptual: Walk through, step by step, how you would build and validate a 'monthly active customers by branch' report from this Banking schema.",
                "type": "conceptual"
            },
            {
                "title": "Interview: CHAR vs VARCHAR vs TEXT",
                "concept": "CHAR stores fixed-length text padded with spaces to the declared length. VARCHAR stores variable-length text up to a declared maximum. TEXT (and similar large-object types) stores variable-length text with no practical length limit.",
                "syntax": "name CHAR(10)      -- always stores exactly 10 characters, padded\nname VARCHAR(100)  -- stores up to 100 characters, only uses the space needed\nname TEXT           -- stores long, unbounded text",
                "example": "A fixed-format 3-letter currency code (e.g. 'INR') is a good fit for CHAR(3). A customer's variable-length last_name fits VARCHAR. A long free-text complaint description fits TEXT.",
                "explanation": "SQLite is dynamically typed and treats CHAR/VARCHAR/TEXT similarly under the hood, but in engines like MySQL, PostgreSQL and SQL Server this choice affects storage size and sometimes comparison performance. Use CHAR only for genuinely fixed-length codes; default to VARCHAR/TEXT for everything else.",
                "practice": "Conceptual: Why would using CHAR(50) for a last_name column waste storage compared to VARCHAR(50)?",
                "type": "conceptual"
            },
            {
                "title": "Interview: Indexing Trade-offs — Read vs Write",
                "concept": "Indexes speed up SELECT queries that filter, join or sort on the indexed column, but every INSERT, UPDATE or DELETE must also update each affected index, adding write overhead.",
                "syntax": "-- Fast reads, slower writes as index count grows\nCREATE INDEX idx_1 ON transactions(account_id);\nCREATE INDEX idx_2 ON transactions(transaction_date);\nCREATE INDEX idx_3 ON transactions(transaction_status);",
                "example": "A transactions table with five indexes will insert new rows more slowly than the same table with one well-chosen index, because each insert must maintain all five index structures.",
                "explanation": "A common interview follow-up after 'how do you speed up a slow query?' is 'so should we just index every column?' — the correct answer is no: over-indexing a write-heavy table (like a live transactions table) can meaningfully slow down inserts and updates, so indexes should be added deliberately based on actual query patterns, not defensively on every column.",
                "practice": "Conceptual: For a table that receives thousands of inserts per second but is rarely queried, would you index heavily or sparingly?",
                "type": "conceptual"
            }
        ]
    }
};

    let activeTrack = "rdbms";
    let activeLessonIndex = 0;
    const collapsedTracks = new Set(
        Object.keys(TUTORIAL_CONTENT).filter((key) => key !== activeTrack)
    );

    const $ = (selector) => document.querySelector(selector);

    /*
     * ============================================================
     * SECURITY / HTML ESCAPING
     * ============================================================
     * Lesson content is rendered into innerHTML. Escaping prevents
     * SQL/code examples from being interpreted as HTML.
     */
    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    /*
     * ============================================================
     * TRACK COLLAPSE HELPERS
     * ============================================================
     * Selecting a track automatically collapses the other tracks,
     * which keeps the sidebar manageable on long tutorial pages.
     */
    function setActiveTrack(trackKey, lessonIndex = 0) {
        if (!TUTORIAL_CONTENT[trackKey]) return;

        activeTrack = trackKey;
        activeLessonIndex = Math.max(
            0,
            Math.min(
                lessonIndex,
                TUTORIAL_CONTENT[trackKey].lessons.length - 1
            )
        );

        Object.keys(TUTORIAL_CONTENT).forEach((key) => {
            if (key === activeTrack) {
                collapsedTracks.delete(key);
            } else {
                collapsedTracks.add(key);
            }
        });

        renderSidebarState();
        renderLesson();
    }

    function toggleTrack(trackKey) {
        if (!TUTORIAL_CONTENT[trackKey]) return;

        if (collapsedTracks.has(trackKey)) {
            collapsedTracks.delete(trackKey);
        } else {
            collapsedTracks.add(trackKey);
        }

        renderSidebarState();
    }

    /*
     * ============================================================
     * ADVANCED-CONCEPT FLOW RENDERER
     * ============================================================
     * Used for topics such as normalization, ACID, window functions,
     * ranking, LAG/LEAD, CTE pipelines and query-debugging flow.
     */
    function renderFlow(flow) {
        if (!Array.isArray(flow) || flow.length === 0) {
            return "";
        }

        return `
            <section class="tutorial-section tutorial-flow-section">
                <h2>🔎 How the Flow Works</h2>
                <div class="tutorial-flow">
                    ${flow.map((step, index) => `
                        <div class="tutorial-flow-step">
                            <span>${escapeHtml(step)}</span>
                        </div>
                        ${index < flow.length - 1
                            ? `<div class="tutorial-flow-arrow" aria-hidden="true">↓</div>`
                            : ""}
                    `).join("")}
                </div>
            </section>
        `;
    }

    /*
     * ============================================================
     * RANKING VISUALIZER
     * ============================================================
     * Some expert lessons provide a small static visual table so a
     * learner can understand gaps/ties before running SQL.
     */
    function renderVisualTable(lesson) {
        if (
            !Array.isArray(lesson.visualRows) ||
            lesson.visualRows.length === 0
        ) {
            return "";
        }

        const headers = lesson.visualHeaders || [];

        return `
            <section class="tutorial-section tutorial-visual-section">
                <h2>📊 Visual Example</h2>
                <div class="tutorial-visual-table-wrapper">
                    <table class="tutorial-visual-table">
                        <thead>
                            <tr>
                                ${headers.map((header) =>
                                    `<th>${escapeHtml(header)}</th>`
                                ).join("")}
                            </tr>
                        </thead>
                        <tbody>
                            ${lesson.visualRows.map((row) => `
                                <tr>
                                    ${row.map((value) =>
                                        `<td>${escapeHtml(value)}</td>`
                                    ).join("")}
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    /*
     * ============================================================
     * PRACTICE EDITOR
     * ============================================================
     * Results are deliberately hidden until Run SQL is clicked.
     * The editor uses the existing browser SQLite engine through
     * window.sqlEngine, keeping Tutorial execution primarily in the
     * browser and avoiding unnecessary backend load.
     */
    function renderPracticeEditor(lesson) {
        if (!lesson.practiceQuery) {
            return `
                <section class="tutorial-practice tutorial-concept-practice">
                    <div class="tutorial-practice-badge">💡 Concept Check</div>
                    <h2>Practice Question</h2>
                    <p>${escapeHtml(lesson.practice)}</p>
                    <p class="tutorial-practice-note">
                        This is a conceptual exercise. Explain your answer before moving to the next lesson.
                    </p>
                </section>
            `;
        }

        const database = lesson.database || "Banking";

        return `
            <section class="tutorial-practice tutorial-query-practice">
                <div class="tutorial-practice-heading">
                    <div>
                        <div class="tutorial-practice-badge">🧪 Try It Yourself</div>
                        <h2>Practice Question</h2>
                    </div>

                    <label class="tutorial-db-select">
                        Database
                        <select id="tutorial-database">
                            <option value="Banking" ${database === "Banking" ? "selected" : ""}>Banking</option>
                            <option value="Healthcare" ${database === "Healthcare" ? "selected" : ""}>Healthcare</option>
                        </select>
                    </label>
                </div>

                <p>${escapeHtml(lesson.practice)}</p>

                <textarea
                    id="tutorial-sql-editor"
                    class="tutorial-sql-editor"
                    spellcheck="false"
                    aria-label="Tutorial SQL editor"
                    placeholder="Write your SQL query here..."
                >${escapeHtml(lesson.practiceQuery)}</textarea>

                <div class="tutorial-editor-actions">
                    <button
                        type="button"
                        class="tutorial-run-button"
                        id="tutorial-run-query"
                    >
                        ▶ Run Query
                    </button>

                    <button
                        type="button"
                        class="tutorial-reset-button"
                        id="tutorial-reset-query"
                    >
                        ↺ Reset
                    </button>

                    <span class="tutorial-editor-hint">
                        Results appear only after execution.
                    </span>
                </div>

                <div
                    id="tutorial-query-status"
                    class="tutorial-query-status"
                    aria-live="polite"
                ></div>

                <!-- Hidden until the first successful/failed execution. -->
                <div
                    id="tutorial-query-results"
                    class="tutorial-query-results"
                    hidden
                >
                    <div class="tutorial-results-header">
                        <div>
                            <h3>📋 Results</h3>
                            <span id="tutorial-results-summary"></span>
                        </div>
                    </div>

                    <!--
                         Compact viewport intentionally shows only a few
                         rows at once. The remaining rows are available
                         through vertical scrolling.
                    -->
                    <div class="tutorial-results-scroll">
                        <table>
                            <thead id="tutorial-results-head"></thead>
                            <tbody id="tutorial-results-body"></tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    }

    /*
     * ============================================================
     * LESSON RENDERING
     * ============================================================
     */
    function renderLesson() {
        const container = $(".tutorial-content");
        const track = TUTORIAL_CONTENT[activeTrack];

        if (!container || !track) return;

        const lesson = track.lessons[activeLessonIndex];

        container.innerHTML = `
            <div class="tutorial-track-header">
                <div>
                    <span class="tutorial-track-badge">${escapeHtml(track.title)}</span>
                    <p>${escapeHtml(track.subtitle)}</p>
                </div>
                <div class="tutorial-lesson-count">
                    ${activeLessonIndex + 1} / ${track.lessons.length}
                </div>
            </div>

            <article class="tutorial-lesson">
                <div class="tutorial-lesson-kicker">
                    ${escapeHtml(track.title)}
                </div>

                <h1>${escapeHtml(lesson.title)}</h1>

                <section class="tutorial-section">
                    <h2>📘 Definition</h2>
                    <p>${escapeHtml(lesson.concept)}</p>
                </section>

                <section class="tutorial-section">
                    <h2>⌨️ Syntax</h2>
                    <pre><code>${escapeHtml(lesson.syntax)}</code></pre>
                </section>

                <section class="tutorial-section">
                    <h2>💻 Example</h2>
                    <pre><code>${escapeHtml(lesson.example)}</code></pre>
                </section>

                ${renderFlow(lesson)}
                ${renderVisualTable(lesson)}

                <section class="tutorial-section tutorial-thinking-section">
                    <h2>🧠 How to Think About It</h2>
                    <p>${escapeHtml(lesson.explanation)}</p>
                </section>

                ${renderPracticeEditor(lesson)}
            </article>

            <div class="tutorial-lesson-navigation">
                <button
                    type="button"
                    class="tutorial-nav-button"
                    data-action="previous"
                    ${activeLessonIndex === 0 ? "disabled" : ""}
                >
                    ← Previous
                </button>

                <span>
                    Lesson ${activeLessonIndex + 1} of ${track.lessons.length}
                </span>

                <button
                    type="button"
                    class="tutorial-nav-button"
                    data-action="next"
                    ${activeLessonIndex === track.lessons.length - 1 ? "disabled" : ""}
                >
                    Next →
                </button>
            </div>
        `;

        renderSidebarState();
    }

    /*
     * ============================================================
     * SIDEBAR RENDERING
     * ============================================================
     * Each learning segment can be collapsed independently.
     * Selecting a lesson automatically makes its track visible.
     */
    function buildSidebar() {
        const sidebarList = $(".tutorial-sidebar ul");
        if (!sidebarList) return;

        sidebarList.innerHTML = Object.entries(TUTORIAL_CONTENT)
            .map(([key, track]) => `
                <li
                    class="tutorial-track-group"
                    data-track-group="${key}"
                >
                    <div
                        class="tutorial-track-link"
                        data-track="${key}"
                        role="button"
                        tabindex="0"
                        aria-expanded="${!collapsedTracks.has(key)}"
                    >
                        <span class="tutorial-track-title">
                            ${escapeHtml(track.title)}
                        </span>

                        <button
                            type="button"
                            class="tutorial-collapse-button"
                            data-collapse-track="${key}"
                            aria-label="Collapse or expand ${escapeHtml(track.title)}"
                        >
                            ${collapsedTracks.has(key) ? "▸" : "▾"}
                        </button>
                    </div>

                    <div
                        class="tutorial-track-lessons"
                        data-track-lessons="${key}"
                    >
                        <ul>
                            ${track.lessons.map((lesson, index) => `
                                <li
                                    class="tutorial-lesson-link"
                                    data-track="${key}"
                                    data-lesson-index="${index}"
                                    role="button"
                                    tabindex="0"
                                >
                                    <span class="tutorial-lesson-number">
                                        ${index + 1}
                                    </span>
                                    <span>
                                        ${escapeHtml(lesson.title)}
                                    </span>
                                </li>
                            `).join("")}
                        </ul>
                    </div>
                </li>
            `)
            .join("");

        renderSidebarState();
    }

    function renderSidebarState() {
        document.querySelectorAll(".tutorial-track-group").forEach((group) => {
            const key = group.dataset.trackGroup;
            const collapsed = collapsedTracks.has(key);

            group.classList.toggle("is-collapsed", collapsed);
        });

        document.querySelectorAll(".tutorial-track-link").forEach((item) => {
            const key = item.dataset.track;
            const collapsed = collapsedTracks.has(key);

            item.classList.toggle("active", key === activeTrack);
            item.setAttribute("aria-expanded", String(!collapsed));

            const collapseButton = item.querySelector(
                "[data-collapse-track]"
            );

            if (collapseButton) {
                collapseButton.textContent = collapsed ? "▸" : "▾";
            }
        });

        document.querySelectorAll("[data-lesson-index]").forEach((item) => {
            item.classList.toggle(
                "active",
                item.dataset.track === activeTrack &&
                Number(item.dataset.lessonIndex) === activeLessonIndex
            );
        });
    }

    /*
     * ============================================================
     * SIDEBAR EVENTS
     * ============================================================
     */
    function handleSidebar(event) {
        const collapseButton = event.target.closest(
            "[data-collapse-track]"
        );

        if (collapseButton) {
            event.stopPropagation();
            toggleTrack(collapseButton.dataset.collapseTrack);
            return;
        }

        const lesson = event.target.closest("[data-lesson-index]");

        if (lesson) {
            setActiveTrack(
                lesson.dataset.track,
                Number(lesson.dataset.lessonIndex)
            );
            return;
        }

        const track = event.target.closest(".tutorial-track-link");

        if (track) {
            setActiveTrack(track.dataset.track, 0);
        }
    }

    /*
     * ============================================================
     * LESSON NAVIGATION
     * ============================================================
     */
    function handleNavigation(event) {
        const button = event.target.closest("[data-action]");

        if (!button || button.disabled) return;

        if (
            button.dataset.action === "previous" &&
            activeLessonIndex > 0
        ) {
            activeLessonIndex--;
        }

        if (
            button.dataset.action === "next" &&
            activeLessonIndex <
                TUTORIAL_CONTENT[activeTrack].lessons.length - 1
        ) {
            activeLessonIndex++;
        }

        renderLesson();
        $(".tutorial-content")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    /*
     * ============================================================
     * QUERY RESULT RENDERING
     * ============================================================
     */
    function renderQueryResults(result) {
        const resultContainer = $("#tutorial-query-results");
        const head = $("#tutorial-results-head");
        const body = $("#tutorial-results-body");
        const summary = $("#tutorial-results-summary");

        if (!resultContainer || !head || !body || !summary) {
            return;
        }

        const columns = Array.isArray(result.columns)
            ? result.columns
            : [];

        const rows = Array.isArray(result.rows)
            ? result.rows
            : [];

        head.innerHTML = `
            <tr>
                ${columns.map((column) =>
                    `<th>${escapeHtml(column)}</th>`
                ).join("")}
            </tr>
        `;

        body.innerHTML = rows.map((row) => `
            <tr>
                ${columns.map((column) =>
                    `<td>${escapeHtml(row[column] ?? "")}</td>`
                ).join("")}
            </tr>
        `).join("");

        summary.textContent =
            `${rows.length} row${rows.length === 1 ? "" : "s"} returned` +
            (
                Number.isFinite(result.executionTime)
                    ? ` • ${result.executionTime} ms`
                    : ""
            );

        resultContainer.hidden = false;
    }

    /*
     * ============================================================
     * QUERY EXECUTION
     * ============================================================
     */
    async function executeTutorialQuery() {
        const editor = $("#tutorial-sql-editor");
        const databaseSelect = $("#tutorial-database");
        const status = $("#tutorial-query-status");
        const resultContainer = $("#tutorial-query-results");
        const runButton = $("#tutorial-run-query");

        if (!editor || !status || !resultContainer || !runButton) {
            return;
        }

        const query = editor.value.trim();

        if (!query) {
            status.textContent = "Please enter a SQL query.";
            status.className = "tutorial-query-status error";
            resultContainer.hidden = true;
            return;
        }

        if (!window.sqlEngine) {
            status.textContent =
                "SQL engine is not available. Please check the tutorial script dependencies.";
            status.className = "tutorial-query-status error";
            return;
        }

        const database =
            databaseSelect?.value || "Banking";

        runButton.disabled = true;
        status.textContent = "Executing query in browser SQLite...";
        status.className = "tutorial-query-status loading";
        resultContainer.hidden = true;

        try {
            const result = await window.sqlEngine.execute(
                query,
                { database }
            );

            renderQueryResults(result);

            status.textContent =
                `Query executed successfully • ${result.rowCount ?? 0} row(s)`;
            status.className = "tutorial-query-status success";
        } catch (error) {
            resultContainer.hidden = true;
            status.textContent =
                error?.message || "SQL query execution failed.";
            status.className = "tutorial-query-status error";
        } finally {
            runButton.disabled = false;
        }
    }

    function resetTutorialQuery() {
        const editor = $("#tutorial-sql-editor");
        const resultContainer = $("#tutorial-query-results");
        const status = $("#tutorial-query-status");

        const lesson =
            TUTORIAL_CONTENT[activeTrack]?.lessons[activeLessonIndex];

        if (editor && lesson) {
            editor.value = lesson.practiceQuery || "";
        }

        if (resultContainer) {
            resultContainer.hidden = true;
        }

        if (status) {
            status.textContent = "";
            status.className = "tutorial-query-status";
        }
    }

    /*
     * ============================================================
     * PRACTICE EDITOR EVENTS
     * ============================================================
     */
    function handlePracticeEvents(event) {
        const runButton = event.target.closest("#tutorial-run-query");

        if (runButton) {
            executeTutorialQuery();
            return;
        }

        const resetButton = event.target.closest("#tutorial-reset-query");

        if (resetButton) {
            resetTutorialQuery();
        }
    }

    /*
     * ============================================================
     * KEYBOARD SHORTCUT
     * ============================================================
     * Ctrl/Cmd + Enter executes the tutorial query.
     */
    function handleEditorKeydown(event) {
        if (
            event.target?.id !== "tutorial-sql-editor"
        ) {
            return;
        }

        if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey)
        ) {
            event.preventDefault();
            executeTutorialQuery();
        }
    }

    /*
     * ============================================================
     * INITIALIZATION
     * ============================================================
     */
    function initialize() {
        if (
            !$(".tutorial-content") ||
            !$(".tutorial-sidebar ul")
        ) {
            console.error(
                "Tutorial containers were not found."
            );
            return;
        }

        buildSidebar();
        renderLesson();

        $(".tutorial-sidebar ul")
            .addEventListener("click", handleSidebar);

        $(".tutorial-content")
            .addEventListener("click", handleNavigation);

        $(".tutorial-content")
            .addEventListener("click", handlePracticeEvents);

        $(".tutorial-content")
            .addEventListener("keydown", handleEditorKeydown);

        console.log(
            "tutorial.js V3 loaded successfully"
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );
    } else {
        initialize();
    }
})();

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

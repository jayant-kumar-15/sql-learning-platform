/*
 * SQL Learning Platform - Tutorial JavaScript V3
 * ============================================================
 * FILE PATH
 * ----------
 * frontend/tutorial/tutorial.js
 *
 * PURPOSE
 * -------
 * Powers the complete Tutorial learning experience.
 *
 * FEATURES
 * --------
 * 1. Beginner, Intermediate, Expert, RDBMS and Interview tracks.
 * 2. Collapsible roadmap sections.
 * 3. Fresher/college-friendly concept explanations.
 * 4. Syntax + example + key points + practice.
 * 5. Embedded browser-first SQL editor.
 * 6. Results remain hidden until the user executes SQL.
 * 7. Result table is scrollable and intentionally compact.
 * 8. ACID and normalization visual explanations.
 * 9. Lesson navigation and local progress persistence.
 *
 * REVISION-SENSITIVE RULES
 * ------------------------
 * - SQL examples use the CURRENT Banking/Healthcare schema.
 * - Do not introduce columns such as customer_name or full_name.
 * - Current Banking customer name = first_name + last_name.
 * - Current Loans amount/status = principal_amount + loan_status.
 * - The SQL engine is shared with Playground/Challenges.
 * - Tutorial execution does NOT use Challenge validation.
 * ============================================================
 */

(() => {
    "use strict";

    /* ============================================================
     * TUTORIAL CONTENT
     * ------------------------------------------------------------
     * Content is intentionally stored separately from rendering
     * logic so new lessons can be added without rewriting the UI.
     * ============================================================ */

    const TUTORIAL_CONTENT = {
        beginner: {
            title: "🟢 Beginner SQL",
            subtitle: "Build the foundation step by step — ideal for college students, freshers and first-time SQL learners.",
            color: "green",
            lessons: [
                {
                    title: "What is SQL?",
                    concept: "SQL (Structured Query Language) is the standard language used to work with relational databases. You use SQL to retrieve, filter, summarize and modify structured data.",
                    keyPoints: [
                        "A database stores related data in tables.",
                        "SQL describes what data you want; the database engine decides how to retrieve it.",
                        "SELECT is the most common statement for learning and analyzing data."
                    ],
                    syntax: "SELECT column_name\nFROM table_name;",
                    example: "SELECT first_name, last_name\nFROM customers;",
                    explanation: "Think of SQL as a way of asking a database a precise question. In our Banking database, customers is a table and first_name and last_name are columns.",
                    practice: "Return the first_name, last_name and city of customers.",
                    database: "Banking",
                    starterQuery: "SELECT first_name, last_name, city\nFROM customers;"
                },
                {
                    title: "SELECT — Choose Columns",
                    concept: "SELECT tells SQL which columns or calculated values should appear in the result.",
                    keyPoints: [
                        "Use SELECT * when you genuinely need every column.",
                        "Prefer explicit columns in production queries because they are easier to read and maintain.",
                        "You can rename an output column with AS."
                    ],
                    syntax: "SELECT column1, column2 AS alias\nFROM table_name;",
                    example: "SELECT account_id,\n       balance AS current_balance\nFROM accounts;",
                    explanation: "The table may contain many columns, but the business question usually needs only a few. Selecting only those columns keeps the result focused.",
                    practice: "Show account_id, account_type and balance for Banking accounts.",
                    database: "Banking",
                    starterQuery: "SELECT account_id, account_type, balance\nFROM accounts;"
                },
                {
                    title: "WHERE — Filter Rows",
                    concept: "WHERE filters individual rows before SQL returns the result.",
                    keyPoints: [
                        "Use comparison operators such as =, >, <, >= and <=",
                        "Combine conditions with AND and OR.",
                        "Text values normally need single quotes."
                    ],
                    syntax: "SELECT column1, column2\nFROM table_name\nWHERE condition;",
                    example: "SELECT account_id, balance\nFROM accounts\nWHERE balance >= 100000;",
                    explanation: "WHERE answers questions such as 'which rows meet this condition?' It operates before grouping and aggregation.",
                    practice: "Find Banking accounts whose balance is at least 100000.",
                    database: "Banking",
                    starterQuery: "SELECT account_id, balance\nFROM accounts\nWHERE balance >= 100000;"
                },
                {
                    title: "AND, OR and NOT",
                    concept: "Logical operators let you combine or reverse conditions.",
                    keyPoints: [
                        "AND requires every condition to be true.",
                        "OR requires at least one condition to be true.",
                        "NOT reverses a condition.",
                        "Use parentheses when a condition contains mixed AND/OR logic."
                    ],
                    syntax: "WHERE condition1\n  AND condition2;",
                    example: "SELECT customer_id, first_name, city\nFROM customers\nWHERE state = 'Maharashtra'\n  AND customer_status = 'Active';",
                    explanation: "Write the business rule in plain language first, then translate each part into SQL conditions.",
                    practice: "Find active customers from Maharashtra.",
                    database: "Banking",
                    starterQuery: "SELECT customer_id, first_name, last_name, city\nFROM customers\nWHERE state = 'Maharashtra'\n  AND customer_status = 'Active';"
                },
                {
                    title: "DISTINCT",
                    concept: "DISTINCT removes duplicate result combinations from the SELECT output.",
                    keyPoints: [
                        "DISTINCT applies to the complete set of selected columns.",
                        "It does not remove duplicate records from the underlying table.",
                        "Use it when the question asks for unique categories or values."
                    ],
                    syntax: "SELECT DISTINCT column_name\nFROM table_name;",
                    example: "SELECT DISTINCT state\nFROM customers\nORDER BY state;",
                    explanation: "If 500 customers belong to only 10 states, DISTINCT state returns those unique states instead of repeating a state for every customer.",
                    practice: "List the unique cities in the Banking customers table.",
                    database: "Banking",
                    starterQuery: "SELECT DISTINCT city\nFROM customers\nORDER BY city;"
                },
                {
                    title: "ORDER BY",
                    concept: "ORDER BY controls the order in which SQL returns rows.",
                    keyPoints: [
                        "ASC means ascending and is the default.",
                        "DESC means descending.",
                        "Use a deterministic second sort column when ties matter."
                    ],
                    syntax: "SELECT column1, column2\nFROM table_name\nORDER BY column1 DESC;",
                    example: "SELECT loan_id, principal_amount\nFROM loans\nORDER BY principal_amount DESC\nLIMIT 5;",
                    explanation: "SQL does not promise a meaningful row order unless ORDER BY is specified.",
                    practice: "Show the five largest loans by principal_amount.",
                    database: "Banking",
                    starterQuery: "SELECT loan_id, principal_amount\nFROM loans\nORDER BY principal_amount DESC\nLIMIT 5;"
                },
                {
                    title: "LIMIT",
                    concept: "LIMIT restricts how many rows are returned. It is especially useful while exploring a large table.",
                    keyPoints: [
                        "LIMIT is useful for previews and top-N queries.",
                        "Use ORDER BY before LIMIT when you want a meaningful top or bottom set.",
                        "Without ORDER BY, the selected rows are not guaranteed to represent the first business records."
                    ],
                    syntax: "SELECT ...\nFROM table_name\nORDER BY column_name DESC\nLIMIT 10;",
                    example: "SELECT patient_id, first_name, last_name\nFROM patients\nORDER BY registration_date DESC\nLIMIT 5;",
                    explanation: "A common real-world workflow is to inspect a small sample before processing a full dataset.",
                    practice: "Return the five most recently registered patients.",
                    database: "Healthcare",
                    starterQuery: "SELECT patient_id, first_name, last_name, registration_date\nFROM patients\nORDER BY registration_date DESC\nLIMIT 5;"
                },
                {
                    title: "Aggregate Functions",
                    concept: "Aggregate functions summarize multiple rows into calculated values. Common functions are COUNT, SUM, AVG, MIN and MAX.",
                    keyPoints: [
                        "COUNT(*) counts rows.",
                        "COUNT(column) ignores NULL values in that column.",
                        "SUM and AVG are commonly used for numeric business measures."
                    ],
                    syntax: "SELECT COUNT(*), SUM(amount), AVG(amount)\nFROM table_name;",
                    example: "SELECT COUNT(*) AS payment_count,\n       SUM(payment_amount) AS total_paid,\n       AVG(payment_amount) AS average_payment\nFROM payments;",
                    explanation: "Aggregation changes the question from 'show me every row' to 'give me a summary of all rows'.",
                    practice: "Find the total and average payment_amount from Banking payments.",
                    database: "Banking",
                    starterQuery: "SELECT SUM(payment_amount) AS total_paid,\n       AVG(payment_amount) AS average_payment\nFROM payments;"
                },
                {
                    title: "GROUP BY",
                    concept: "GROUP BY divides rows into groups so aggregate functions can calculate one summary per group.",
                    keyPoints: [
                        "Every selected non-aggregate column normally belongs in GROUP BY.",
                        "GROUP BY is useful for 'per customer', 'per city' and 'per status' questions.",
                        "The result contains one row per group."
                    ],
                    syntax: "SELECT category, COUNT(*) AS total\nFROM table_name\nGROUP BY category;",
                    example: "SELECT account_type,\n       COUNT(*) AS account_count\nFROM accounts\nGROUP BY account_type\nORDER BY account_count DESC;",
                    explanation: "Read GROUP BY as 'calculate this summary separately for each value of this column'.",
                    practice: "Count Banking accounts by account_type.",
                    database: "Banking",
                    starterQuery: "SELECT account_type, COUNT(*) AS account_count\nFROM accounts\nGROUP BY account_type\nORDER BY account_count DESC;"
                },
                {
                    title: "HAVING",
                    concept: "HAVING filters groups after aggregation, while WHERE filters individual rows before grouping.",
                    keyPoints: [
                        "WHERE is for row-level filtering.",
                        "HAVING is for aggregate/group-level filtering.",
                        "A condition such as COUNT(*) > 5 belongs naturally in HAVING."
                    ],
                    syntax: "SELECT category, COUNT(*) AS total\nFROM table_name\nGROUP BY category\nHAVING COUNT(*) > 5;",
                    example: "SELECT account_id,\n       COUNT(*) AS transaction_count\nFROM transactions\nGROUP BY account_id\nHAVING COUNT(*) > 5;",
                    explanation: "First SQL forms the groups, calculates the aggregate, and then HAVING decides which groups remain.",
                    practice: "Find accounts that have more than five transactions.",
                    database: "Banking",
                    starterQuery: "SELECT account_id, COUNT(*) AS transaction_count\nFROM transactions\nGROUP BY account_id\nHAVING COUNT(*) > 5;"
                },
                {
                    title: "NULL — Missing or Unknown Value",
                    concept: "NULL means a value is missing or unknown. It is not the same as zero, an empty string or the text 'NULL'.",
                    keyPoints: [
                        "Use IS NULL to find NULL values.",
                        "Use IS NOT NULL to exclude NULL values.",
                        "Comparisons such as column = NULL do not work as beginners often expect."
                    ],
                    syntax: "SELECT ...\nFROM table_name\nWHERE column_name IS NULL;",
                    example: "SELECT patient_id, first_name, phone\nFROM patients\nWHERE phone IS NULL;",
                    explanation: "SQL uses three-valued logic around NULL: true, false and unknown. This is why NULL requires special operators.",
                    practice: "Find Healthcare patients whose phone number is missing.",
                    database: "Healthcare",
                    starterQuery: "SELECT patient_id, first_name, last_name\nFROM patients\nWHERE phone IS NULL;"
                },
                {
                    title: "Aliases with AS",
                    concept: "An alias gives a temporary, readable name to a column or table within a query.",
                    keyPoints: [
                        "Column aliases improve report readability.",
                        "Table aliases make joins shorter and easier to read.",
                        "Aliases do not rename the actual database column."
                    ],
                    syntax: "SELECT column_name AS readable_name\nFROM table_name AS t;",
                    example: "SELECT c.first_name AS customer_first_name,\n       c.last_name AS customer_last_name\nFROM customers AS c;",
                    explanation: "Aliases are especially important once queries contain multiple tables with similarly named columns.",
                    practice: "Return customer_id and balance using readable aliases.",
                    database: "Banking",
                    starterQuery: "SELECT c.customer_id AS customer_id,\n       a.balance AS account_balance\nFROM customers AS c\nJOIN accounts AS a\n  ON c.customer_id = a.customer_id;"
                }
            ]
        },

        intermediate: {
            title: "🟡 Intermediate SQL",
            subtitle: "Connect tables, build multi-step logic and translate business requirements into SQL.",
            color: "yellow",
            lessons: [
                {
                    title: "INNER JOIN",
                    concept: "INNER JOIN combines rows from two tables when their join condition matches.",
                    keyPoints: [
                        "Identify the primary/foreign-key relationship first.",
                        "Rows without a match are excluded.",
                        "Always write the ON condition carefully to avoid accidental Cartesian products."
                    ],
                    syntax: "SELECT ...\nFROM table_a a\nJOIN table_b b\n  ON a.key = b.key;",
                    example: "SELECT c.customer_id,\n       c.first_name,\n       c.last_name,\n       a.account_id,\n       a.balance\nFROM customers c\nJOIN accounts a\n  ON c.customer_id = a.customer_id;",
                    explanation: "The Banking schema links customers to accounts through customer_id. JOIN lets one business question use both tables.",
                    practice: "Return each customer's name and account balance.",
                    database: "Banking",
                    starterQuery: "SELECT c.customer_id,\n       c.first_name,\n       c.last_name,\n       a.balance\nFROM customers c\nJOIN accounts a\n  ON c.customer_id = a.customer_id;"
                },
                {
                    title: "LEFT JOIN",
                    concept: "LEFT JOIN keeps every row from the left table and adds matching data from the right table when available.",
                    keyPoints: [
                        "Unmatched right-side columns become NULL.",
                        "It is excellent for finding missing relationships.",
                        "Moving a right-table filter from ON to WHERE can change the result."
                    ],
                    syntax: "SELECT ...\nFROM customers c\nLEFT JOIN accounts a\n  ON c.customer_id = a.customer_id;",
                    example: "SELECT c.customer_id,\n       c.first_name,\n       a.account_id\nFROM customers c\nLEFT JOIN accounts a\n  ON c.customer_id = a.customer_id;",
                    explanation: "Use LEFT JOIN when the business question says 'show every customer, even if there is no account'.",
                    practice: "List every customer and any account_id they have.",
                    database: "Banking",
                    starterQuery: "SELECT c.customer_id, c.first_name, c.last_name, a.account_id\nFROM customers c\nLEFT JOIN accounts a\n  ON c.customer_id = a.customer_id;"
                },
                {
                    title: "Multiple JOINs",
                    concept: "Real reporting queries often cross several related tables to reach the business fact you need.",
                    keyPoints: [
                        "Join one relationship at a time.",
                        "Check the expected grain of the result after every join.",
                        "One-to-many joins can multiply rows."
                    ],
                    syntax: "FROM customers c\nJOIN accounts a ON ...\nJOIN transactions t ON ...",
                    example: "SELECT c.customer_id,\n       c.first_name,\n       t.transaction_id,\n       t.amount\nFROM customers c\nJOIN accounts a\n  ON c.customer_id = a.customer_id\nJOIN transactions t\n  ON a.account_id = t.account_id;",
                    explanation: "Customer → Account → Transaction is a common Banking relationship chain.",
                    practice: "Show customers together with their transaction amounts.",
                    database: "Banking",
                    starterQuery: "SELECT c.customer_id, c.first_name, t.transaction_id, t.amount\nFROM customers c\nJOIN accounts a ON c.customer_id = a.customer_id\nJOIN transactions t ON a.account_id = t.account_id;"
                },
                {
                    title: "CASE — Business Rules",
                    concept: "CASE converts conditions into labels or calculated values inside a query.",
                    keyPoints: [
                        "Conditions are evaluated from top to bottom.",
                        "The first matching WHEN wins.",
                        "Always check boundary conditions carefully."
                    ],
                    syntax: "CASE\n    WHEN condition THEN result\n    ELSE result\nEND AS category",
                    example: "SELECT loan_id,\n       principal_amount,\n       CASE\n           WHEN principal_amount >= 500000 THEN 'High'\n           WHEN principal_amount >= 200000 THEN 'Medium'\n           ELSE 'Low'\n       END AS loan_category\nFROM loans;",
                    explanation: "CASE is how SQL can express many simple business classifications without changing the underlying data.",
                    practice: "Classify loans as High, Medium or Low using principal_amount.",
                    database: "Banking",
                    starterQuery: "SELECT loan_id, principal_amount,\n       CASE\n           WHEN principal_amount >= 500000 THEN 'High'\n           WHEN principal_amount >= 200000 THEN 'Medium'\n           ELSE 'Low'\n       END AS loan_category\nFROM loans;"
                },
                {
                    title: "Subqueries",
                    concept: "A subquery is a query nested inside another query. It can provide a value, a list of values or a temporary result set.",
                    keyPoints: [
                        "Scalar subqueries return one value.",
                        "IN can consume multiple values.",
                        "The outer query uses the subquery result as part of its logic."
                    ],
                    syntax: "SELECT ...\nFROM table_name\nWHERE value > (\n    SELECT AVG(value)\n    FROM table_name\n);",
                    example: "SELECT loan_id, principal_amount\nFROM loans\nWHERE principal_amount > (\n    SELECT AVG(principal_amount)\n    FROM loans\n);",
                    explanation: "The inner query calculates the average first; the outer query then finds loans above that benchmark.",
                    practice: "Find loans whose principal_amount is greater than the average.",
                    database: "Banking",
                    starterQuery: "SELECT loan_id, principal_amount\nFROM loans\nWHERE principal_amount > (\n    SELECT AVG(principal_amount)\n    FROM loans\n);"
                },
                {
                    title: "EXISTS and NOT EXISTS",
                    concept: "EXISTS checks whether at least one matching row exists. NOT EXISTS checks that no matching row exists.",
                    keyPoints: [
                        "EXISTS is often clearer than joining when only existence matters.",
                        "The subquery is logically connected to the outer row.",
                        "NOT EXISTS is a powerful pattern for missing activity."
                    ],
                    syntax: "SELECT ...\nFROM parent p\nWHERE EXISTS (\n    SELECT 1\n    FROM child c\n    WHERE c.parent_id = p.parent_id\n);",
                    example: "SELECT c.customer_id, c.first_name\nFROM customers c\nWHERE EXISTS (\n    SELECT 1\n    FROM loans l\n    WHERE l.customer_id = c.customer_id\n);",
                    explanation: "The query asks 'does at least one loan exist for this customer?' rather than needing the loan rows themselves.",
                    practice: "Find customers who have at least one loan.",
                    database: "Banking",
                    starterQuery: "SELECT c.customer_id, c.first_name, c.last_name\nFROM customers c\nWHERE EXISTS (\n    SELECT 1\n    FROM loans l\n    WHERE l.customer_id = c.customer_id\n);"
                },
                {
                    title: "CTEs — WITH",
                    concept: "A Common Table Expression (CTE) gives a complex intermediate result a temporary name inside one SQL statement.",
                    keyPoints: [
                        "CTEs improve readability.",
                        "Multiple CTEs can represent multiple logical stages.",
                        "A CTE exists only for the statement that defines it."
                    ],
                    syntax: "WITH summary AS (\n    SELECT ...\n)\nSELECT ...\nFROM summary;",
                    example: "WITH account_totals AS (\n    SELECT account_id,\n           SUM(amount) AS total_amount\n    FROM transactions\n    GROUP BY account_id\n)\nSELECT account_id, total_amount\nFROM account_totals\nWHERE total_amount > 100000;",
                    explanation: "Think of a CTE as naming a temporary result so the next part of the query can reason about it clearly.",
                    practice: "Return accounts whose total transaction amount exceeds 100000.",
                    database: "Banking",
                    starterQuery: "WITH account_totals AS (\n    SELECT account_id, SUM(amount) AS total_amount\n    FROM transactions\n    GROUP BY account_id\n)\nSELECT account_id, total_amount\nFROM account_totals\nWHERE total_amount > 100000;"
                },
                {
                    title: "UNION vs UNION ALL",
                    concept: "UNION combines compatible result sets and removes duplicate rows. UNION ALL combines them without removing duplicates.",
                    keyPoints: [
                        "Both SELECT statements must have compatible column counts and types.",
                        "UNION may perform extra duplicate-removal work.",
                        "Use UNION ALL when duplicates are meaningful or already impossible."
                    ],
                    syntax: "SELECT column1 FROM table_a\nUNION ALL\nSELECT column1 FROM table_b;",
                    example: "SELECT city FROM customers\nUNION\nSELECT city FROM branches;",
                    explanation: "Set operations are useful when two queries represent the same kind of information but come from different sources.",
                    practice: "Return a unique list of cities appearing in customers or branches.",
                    database: "Banking",
                    starterQuery: "SELECT city FROM customers\nUNION\nSELECT city FROM branches;"
                },
                {
                    title: "COALESCE",
                    concept: "COALESCE returns the first non-NULL expression from its arguments and is commonly used to provide safe fallback values.",
                    keyPoints: [
                        "It is useful when reports should display a default instead of NULL.",
                        "It can also protect arithmetic calculations from NULL inputs.",
                        "The fallback should have a meaningful business interpretation."
                    ],
                    syntax: "COALESCE(column_name, fallback_value)",
                    example: "SELECT patient_id,\n       first_name,\n       COALESCE(phone, 'Not Available') AS phone_display\nFROM patients;",
                    explanation: "Instead of leaving missing phone numbers as NULL in a report, COALESCE can display a friendly fallback.",
                    practice: "Display every Healthcare patient's phone, replacing missing values with 'Not Available'.",
                    database: "Healthcare",
                    starterQuery: "SELECT patient_id, first_name, last_name,\n       COALESCE(phone, 'Not Available') AS phone_display\nFROM patients;"
                },
                {
                    title: "Correlated Subquery",
                    concept: "A correlated subquery references a value from the current row of the outer query, so its logic is evaluated in relation to that outer row.",
                    keyPoints: [
                        "The inner query depends on the current outer row.",
                        "It can express per-row comparisons.",
                        "Window functions are often a clearer alternative for advanced problems."
                    ],
                    syntax: "SELECT ...\nFROM table_a a\nWHERE value > (\n    SELECT AVG(value)\n    FROM table_a b\n    WHERE b.group_id = a.group_id\n);",
                    example: "SELECT l.loan_id,\n       l.customer_id,\n       l.principal_amount\nFROM loans l\nWHERE l.principal_amount > (\n    SELECT AVG(l2.principal_amount)\n    FROM loans l2\n    WHERE l2.customer_id = l.customer_id\n);",
                    explanation: "For each loan, the inner query calculates the average loan amount for that same customer.",
                    practice: "Find loans larger than the customer's own average loan amount.",
                    database: "Banking",
                    starterQuery: "SELECT l.loan_id, l.customer_id, l.principal_amount\nFROM loans l\nWHERE l.principal_amount > (\n    SELECT AVG(l2.principal_amount)\n    FROM loans l2\n    WHERE l2.customer_id = l.customer_id\n);"
                }
            ]
        },

        expert: {
            title: "🔴 Expert SQL",
            subtitle: "Advanced analytical SQL, window functions, multi-stage reasoning and production-style query patterns.",
            color: "red",
            lessons: [
                {
                    title: "ROW_NUMBER, RANK and DENSE_RANK",
                    concept: "Window ranking functions assign positions to rows without collapsing the original result set.",
                    keyPoints: [
                        "ROW_NUMBER gives every row a unique sequence.",
                        "RANK gives tied rows the same rank and leaves gaps.",
                        "DENSE_RANK gives tied rows the same rank without gaps."
                    ],
                    syntax: "ROW_NUMBER() OVER (\n    PARTITION BY group_column\n    ORDER BY value_column DESC\n)",
                    example: "SELECT customer_id,\n       loan_id,\n       principal_amount,\n       ROW_NUMBER() OVER (\n           PARTITION BY customer_id\n           ORDER BY principal_amount DESC\n       ) AS loan_rank\nFROM loans;",
                    explanation: "Use PARTITION BY when ranking must restart for every business entity, such as every customer.",
                    practice: "Rank each customer's loans from highest to lowest principal_amount.",
                    database: "Banking",
                    starterQuery: "SELECT customer_id, loan_id, principal_amount,\n       ROW_NUMBER() OVER (\n           PARTITION BY customer_id\n           ORDER BY principal_amount DESC\n       ) AS loan_rank\nFROM loans;"
                },
                {
                    title: "Top-N Per Group",
                    concept: "Top-N per group means finding the largest or smallest N rows inside every group rather than across the entire table.",
                    keyPoints: [
                        "Rank rows inside each group first.",
                        "Filter the rank in an outer query or CTE.",
                        "This is a common interview and analytics pattern."
                    ],
                    syntax: "WITH ranked AS (\n    SELECT ...,\n           ROW_NUMBER() OVER (\n               PARTITION BY group_id\n               ORDER BY amount DESC\n           ) AS rn\n    FROM table_name\n)\nSELECT ...\nFROM ranked\nWHERE rn <= 2;",
                    example: "WITH ranked_loans AS (\n    SELECT loan_id, customer_id, principal_amount,\n           ROW_NUMBER() OVER (\n               PARTITION BY customer_id\n               ORDER BY principal_amount DESC\n           ) AS rn\n    FROM loans\n)\nSELECT loan_id, customer_id, principal_amount\nFROM ranked_loans\nWHERE rn <= 2;",
                    explanation: "The important idea is that the ranking happens independently for every customer.",
                    practice: "Return the two largest loans for each customer.",
                    database: "Banking",
                    starterQuery: "WITH ranked_loans AS (\n    SELECT loan_id, customer_id, principal_amount,\n           ROW_NUMBER() OVER (\n               PARTITION BY customer_id\n               ORDER BY principal_amount DESC\n           ) AS rn\n    FROM loans\n)\nSELECT loan_id, customer_id, principal_amount\nFROM ranked_loans\nWHERE rn <= 2;"
                },
                {
                    title: "LAG and LEAD",
                    concept: "LAG reads a value from a previous row and LEAD reads a value from a following row according to a defined order.",
                    keyPoints: [
                        "Use ORDER BY inside OVER to define the sequence.",
                        "PARTITION BY restarts the comparison for each entity.",
                        "These functions are useful for change detection and time-series analysis."
                    ],
                    syntax: "LAG(value_column) OVER (\n    PARTITION BY group_column\n    ORDER BY date_column\n)",
                    example: "SELECT account_id,\n       transaction_date,\n       amount,\n       LAG(amount) OVER (\n           PARTITION BY account_id\n           ORDER BY transaction_date, transaction_id\n       ) AS previous_amount\nFROM transactions;",
                    explanation: "Instead of joining a table to itself just to find the previous transaction, LAG expresses the intent directly.",
                    practice: "Show each transaction with the previous transaction amount for that account.",
                    database: "Banking",
                    starterQuery: "SELECT account_id, transaction_id, transaction_date, amount,\n       LAG(amount) OVER (\n           PARTITION BY account_id\n           ORDER BY transaction_date, transaction_id\n       ) AS previous_amount\nFROM transactions;"
                },
                {
                    title: "Running Totals",
                    concept: "A running total is a cumulative aggregate that keeps every row while adding the total accumulated up to that row.",
                    keyPoints: [
                        "Window SUM keeps the original row grain.",
                        "ORDER BY defines the accumulation sequence.",
                        "A ROWS frame makes the intended calculation explicit."
                    ],
                    syntax: "SUM(amount) OVER (\n    PARTITION BY account_id\n    ORDER BY transaction_date, transaction_id\n    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n)",
                    example: "SELECT account_id,\n       transaction_id,\n       amount,\n       SUM(amount) OVER (\n           PARTITION BY account_id\n           ORDER BY transaction_date, transaction_id\n           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n       ) AS running_total\nFROM transactions;",
                    explanation: "GROUP BY would collapse all transactions for an account into one row. A window SUM adds the cumulative value while keeping every transaction.",
                    practice: "Calculate a running transaction total for each account.",
                    database: "Banking",
                    starterQuery: "SELECT account_id, transaction_id, transaction_date, amount,\n       SUM(amount) OVER (\n           PARTITION BY account_id\n           ORDER BY transaction_date, transaction_id\n           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n       ) AS running_total\nFROM transactions;"
                },
                {
                    title: "Second-Highest Distinct Value",
                    concept: "Finding the second-highest distinct value is a classic SQL interview pattern. The word distinct matters when multiple rows share the maximum.",
                    keyPoints: [
                        "MAX(value) below the overall MAX is one solution.",
                        "DENSE_RANK is another strong solution.",
                        "Always clarify whether ties should count as one rank."
                    ],
                    syntax: "SELECT MAX(value_column)\nFROM table_name\nWHERE value_column < (\n    SELECT MAX(value_column)\n    FROM table_name\n);",
                    example: "SELECT MAX(principal_amount) AS second_highest_loan\nFROM loans\nWHERE principal_amount < (\n    SELECT MAX(principal_amount)\n    FROM loans\n);",
                    explanation: "The inner query finds the highest amount. The outer query searches only values below that maximum and chooses the largest remaining value.",
                    practice: "Find the second-highest distinct principal_amount from loans.",
                    database: "Banking",
                    starterQuery: "SELECT MAX(principal_amount) AS second_highest_loan\nFROM loans\nWHERE principal_amount < (\n    SELECT MAX(principal_amount)\n    FROM loans\n);"
                },
                {
                    title: "Conditional Aggregation",
                    concept: "Conditional aggregation combines CASE with aggregate functions to calculate multiple business metrics in one grouped query.",
                    keyPoints: [
                        "SUM(CASE WHEN ... THEN 1 ELSE 0 END) is a common counting pattern.",
                        "Different conditions can produce separate columns.",
                        "It is useful for dashboards and operational summaries."
                    ],
                    syntax: "SELECT\n    SUM(CASE WHEN condition THEN 1 ELSE 0 END) AS metric_1,\n    SUM(CASE WHEN other_condition THEN 1 ELSE 0 END) AS metric_2\nFROM table_name;",
                    example: "SELECT\n    SUM(CASE WHEN transaction_type = 'DEPOSIT' THEN 1 ELSE 0 END) AS deposits,\n    SUM(CASE WHEN transaction_type = 'WITHDRAWAL' THEN 1 ELSE 0 END) AS withdrawals\nFROM transactions;",
                    explanation: "Instead of running separate queries for every metric, conditional aggregation calculates related counts in one pass.",
                    practice: "Return one row containing counts of DEPOSIT and WITHDRAWAL transactions.",
                    database: "Banking",
                    starterQuery: "SELECT\n    SUM(CASE WHEN transaction_type = 'DEPOSIT' THEN 1 ELSE 0 END) AS deposits,\n    SUM(CASE WHEN transaction_type = 'WITHDRAWAL' THEN 1 ELSE 0 END) AS withdrawals\nFROM transactions;"
                },
                {
                    title: "Multi-Stage CTE Analysis",
                    concept: "Complex analytical SQL becomes easier to reason about when each CTE represents one business stage.",
                    keyPoints: [
                        "Stage 1: create a clean base dataset.",
                        "Stage 2: aggregate or enrich it.",
                        "Stage 3: rank/classify/filter the result."
                    ],
                    syntax: "WITH stage_one AS (...),\nstage_two AS (...)\nSELECT ...\nFROM stage_two;",
                    example: "WITH customer_totals AS (\n    SELECT a.customer_id,\n           SUM(t.amount) AS total_amount\n    FROM accounts a\n    JOIN transactions t\n      ON a.account_id = t.account_id\n    GROUP BY a.customer_id\n),\nranked AS (\n    SELECT customer_id,\n           total_amount,\n           DENSE_RANK() OVER (ORDER BY total_amount DESC) AS rnk\n    FROM customer_totals\n)\nSELECT customer_id, total_amount\nFROM ranked\nWHERE rnk <= 3;",
                    explanation: "Breaking the problem into named stages makes it easier to validate each intermediate result before moving to the next step.",
                    practice: "Find the three customers with the highest total transaction amount, including ties.",
                    database: "Banking",
                    starterQuery: "WITH customer_totals AS (\n    SELECT a.customer_id, SUM(t.amount) AS total_amount\n    FROM accounts a\n    JOIN transactions t ON a.account_id = t.account_id\n    GROUP BY a.customer_id\n),\nranked AS (\n    SELECT customer_id, total_amount,\n           DENSE_RANK() OVER (ORDER BY total_amount DESC) AS rnk\n    FROM customer_totals\n)\nSELECT customer_id, total_amount\nFROM ranked\nWHERE rnk <= 3;"
                },
                {
                    title: "Deduplication with ROW_NUMBER",
                    concept: "ROW_NUMBER can identify one preferred record when multiple rows are considered duplicates according to business columns.",
                    keyPoints: [
                        "Define what makes two rows duplicates.",
                        "Define which row should survive.",
                        "Use a deterministic ORDER BY for the survivor rule."
                    ],
                    syntax: "WITH ranked AS (\n    SELECT *,\n           ROW_NUMBER() OVER (\n               PARTITION BY duplicate_columns\n               ORDER BY preferred_column DESC\n           ) AS rn\n    FROM table_name\n)\nSELECT ...\nFROM ranked\nWHERE rn = 1;",
                    example: "WITH ranked_customers AS (\n    SELECT customer_id,\n           email,\n           registration_date,\n           ROW_NUMBER() OVER (\n               PARTITION BY email\n               ORDER BY registration_date DESC, customer_id DESC\n           ) AS rn\n    FROM customers\n    WHERE email IS NOT NULL\n)\nSELECT customer_id, email, registration_date\nFROM ranked_customers\nWHERE rn = 1;",
                    explanation: "A production deduplication rule must explain both the duplicate key and the business reason for keeping one row.",
                    practice: "For duplicate customer emails, keep the most recently registered customer.",
                    database: "Banking",
                    starterQuery: "WITH ranked_customers AS (\n    SELECT customer_id, email, registration_date,\n           ROW_NUMBER() OVER (\n               PARTITION BY email\n               ORDER BY registration_date DESC, customer_id DESC\n           ) AS rn\n    FROM customers\n    WHERE email IS NOT NULL\n)\nSELECT customer_id, email, registration_date\nFROM ranked_customers\nWHERE rn = 1;"
                },
                {
                    title: "Latest Record Per Entity",
                    concept: "A common production pattern is to return the latest record for every customer, patient or other business entity.",
                    keyPoints: [
                        "Partition by the entity key.",
                        "Sort newest first.",
                        "Filter ROW_NUMBER() = 1 in an outer query."
                    ],
                    syntax: "ROW_NUMBER() OVER (\n    PARTITION BY entity_id\n    ORDER BY date_column DESC\n)",
                    example: "WITH ranked AS (\n    SELECT l.*,\n           ROW_NUMBER() OVER (\n               PARTITION BY customer_id\n               ORDER BY start_date DESC, loan_id DESC\n           ) AS rn\n    FROM loans l\n)\nSELECT loan_id, customer_id, principal_amount, start_date\nFROM ranked\nWHERE rn = 1;",
                    explanation: "The second ordering column is a deterministic tie-breaker when two records share the same date.",
                    practice: "Return the latest loan for every customer.",
                    database: "Banking",
                    starterQuery: "WITH ranked AS (\n    SELECT l.*,\n           ROW_NUMBER() OVER (\n               PARTITION BY customer_id\n               ORDER BY start_date DESC, loan_id DESC\n           ) AS rn\n    FROM loans l\n)\nSELECT loan_id, customer_id, principal_amount, start_date\nFROM ranked\nWHERE rn = 1;"
                },
                {
                    title: "Query Grain and Duplicate Rows",
                    concept: "Query grain means what one output row represents. Understanding grain is essential for preventing accidental duplicate rows after joins.",
                    keyPoints: [
                        "Before writing SQL, state what one result row should represent.",
                        "A one-to-many join can multiply parent rows.",
                        "Aggregate or deduplicate only when the business requirement calls for it."
                    ],
                    syntax: "-- Example grain: one row per customer\nSELECT c.customer_id,\n       COUNT(t.transaction_id) AS transaction_count\nFROM customers c\nLEFT JOIN accounts a ON c.customer_id = a.customer_id\nLEFT JOIN transactions t ON a.account_id = t.account_id\nGROUP BY c.customer_id;",
                    example: "SELECT c.customer_id,\n       c.first_name,\n       COUNT(t.transaction_id) AS transaction_count\nFROM customers c\nLEFT JOIN accounts a\n  ON c.customer_id = a.customer_id\nLEFT JOIN transactions t\n  ON a.account_id = t.account_id\nGROUP BY c.customer_id, c.first_name;",
                    explanation: "If the desired output is one row per customer, every join and aggregation must preserve that grain.",
                    practice: "Return exactly one row per customer with their transaction count.",
                    database: "Banking",
                    starterQuery: "SELECT c.customer_id, c.first_name, c.last_name,\n       COUNT(t.transaction_id) AS transaction_count\nFROM customers c\nLEFT JOIN accounts a ON c.customer_id = a.customer_id\nLEFT JOIN transactions t ON a.account_id = t.account_id\nGROUP BY c.customer_id, c.first_name, c.last_name;"
                }
            ]
        },

        rdbms: {
            title: "🟣 RDBMS Core",
            subtitle: "Understand the database concepts underneath SQL so queries make sense rather than feeling like memorized syntax.",
            color: "purple",
            lessons: [
                {
                    title: "What is an RDBMS?",
                    concept: "An RDBMS (Relational Database Management System) stores data in related tables and provides rules and operations for creating, reading, updating and managing that data.",
                    keyPoints: [
                        "Tables contain rows and columns.",
                        "Relationships connect tables through keys.",
                        "The system manages storage, integrity, concurrency and query execution."
                    ],
                    visual: {
                        type: "flow",
                        title: "Relational thinking",
                        steps: [
                            ["Table", "Customers"],
                            ["Relationship", "customer_id"],
                            ["Table", "Accounts"]
                        ]
                    }
                },
                {
                    title: "Primary Key",
                    concept: "A primary key is a column or combination of columns that uniquely identifies each row in a table. It cannot contain NULL values.",
                    keyPoints: [
                        "A table has one primary-key constraint, which may contain multiple columns.",
                        "Primary keys prevent duplicate identities.",
                        "A numeric ID is common but not mandatory."
                    ],
                    syntax: "CREATE TABLE customers (\n    customer_id INTEGER PRIMARY KEY,\n    first_name TEXT NOT NULL\n);",
                    explanation: "In our Banking schema, customers.customer_id uniquely identifies a customer. Other tables can reference that value."
                },
                {
                    title: "Foreign Key",
                    concept: "A foreign key is a column or set of columns that references a key in another table. It helps maintain referential integrity between related records.",
                    keyPoints: [
                        "It represents a relationship between tables.",
                        "It can prevent child records from referencing non-existent parent records.",
                        "It is central to relational database design."
                    ],
                    syntax: "FOREIGN KEY (customer_id)\nREFERENCES customers(customer_id)",
                    example: "accounts.customer_id → customers.customer_id",
                    explanation: "An account belongs to a customer. The foreign key expresses that relationship in the database schema."
                },
                {
                    title: "Candidate, Natural and Surrogate Keys",
                    concept: "A candidate key is any minimal set of columns that can uniquely identify a row. A natural key comes from business data, while a surrogate key is an artificial identifier created for database use.",
                    keyPoints: [
                        "A table may have several candidate keys.",
                        "One candidate key is selected as the primary key.",
                        "Surrogate keys such as customer_id are common in data platforms."
                    ],
                    explanation: "A customer_number may be a business identifier while customer_id can serve as a stable internal identifier."
                },
                {
                    title: "Constraints",
                    concept: "Constraints are database rules that protect data quality and integrity.",
                    keyPoints: [
                        "PRIMARY KEY identifies rows.",
                        "FOREIGN KEY protects relationships.",
                        "UNIQUE prevents duplicate values.",
                        "NOT NULL requires a value.",
                        "CHECK can restrict allowed values."
                    ],
                    syntax: "email TEXT UNIQUE,\nname TEXT NOT NULL,\nstatus TEXT CHECK (status IN ('Active','Inactive'));",
                    explanation: "Constraints move important data-quality rules closer to the database instead of relying entirely on application code."
                },
                {
                    title: "Normalization",
                    concept: "Normalization is the process of organizing relational data to reduce unnecessary duplication and prevent update anomalies.",
                    keyPoints: [
                        "1NF focuses on atomic values and a clear row/column structure.",
                        "2NF removes partial dependency on part of a composite key.",
                        "3NF removes inappropriate transitive dependencies.",
                        "Normalization improves consistency; denormalization may later be used deliberately for performance."
                    ],
                    visual: {
                        type: "normalization",
                        title: "Normalization at a glance",
                        steps: [
                            ["Raw design", "Repeated customer details"],
                            ["1NF", "Atomic values"],
                            ["2NF / 3NF", "Move dependent facts to their proper tables"]
                        ]
                    },
                    explanation: "For example, customer information should not be copied into every account or transaction row when a stable customer table can hold that information once."
                },
                {
                    title: "ACID Transactions",
                    concept: "ACID describes four properties that make database transactions reliable: Atomicity, Consistency, Isolation and Durability.",
                    keyPoints: [
                        "Atomicity: all operations succeed or the transaction is rolled back.",
                        "Consistency: the transaction preserves defined database rules.",
                        "Isolation: concurrent transactions should not incorrectly interfere with each other.",
                        "Durability: committed changes survive failures."
                    ],
                    visual: {
                        type: "acid",
                        title: "The four properties of a reliable transaction"
                    },
                    syntax: "BEGIN TRANSACTION;\n-- related changes\nCOMMIT;\n\n-- or\nROLLBACK;",
                    explanation: "A bank transfer is a classic example: subtracting money from one account and adding it to another should behave as one reliable unit."
                },
                {
                    title: "Transactions and COMMIT / ROLLBACK",
                    concept: "A transaction groups related database operations so they can be committed together or rolled back when something goes wrong.",
                    keyPoints: [
                        "COMMIT makes the transaction permanent.",
                        "ROLLBACK cancels uncommitted changes.",
                        "Transaction behavior matters when multiple writes must remain consistent."
                    ],
                    syntax: "BEGIN TRANSACTION;\nUPDATE accounts SET balance = balance - 100 WHERE account_id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE account_id = 2;\nCOMMIT;",
                    explanation: "The important idea is not the syntax itself but the guarantee that the two business changes should be treated as one unit."
                },
                {
                    title: "Indexes",
                    concept: "An index is an additional data structure that helps the database find rows faster for suitable queries, at the cost of extra storage and write maintenance.",
                    keyPoints: [
                        "Indexes can speed up filtering, joins and ordering when the indexed columns match the access pattern.",
                        "Too many indexes increase INSERT/UPDATE/DELETE cost.",
                        "An index does not automatically make every query faster."
                    ],
                    syntax: "CREATE INDEX idx_accounts_customer\nON accounts(customer_id);",
                    explanation: "Our Banking schema already contains indexes on important relationship columns such as accounts.customer_id and transactions.account_id."
                },
                {
                    title: "Views",
                    concept: "A view is a saved SQL definition that behaves like a virtual table when queried.",
                    keyPoints: [
                        "A view can simplify a complex query.",
                        "It can provide a controlled interface to underlying data.",
                        "A normal view stores the query definition rather than a separate copy of the result."
                    ],
                    syntax: "CREATE VIEW active_accounts AS\nSELECT account_id, customer_id, balance\nFROM accounts\nWHERE account_status = 'Active';",
                    explanation: "Views can give analysts a stable, simplified interface without duplicating the underlying data."
                }
            ]
        },

        interview: {
            title: "💼 SQL Interview",
            subtitle: "Real-world conceptual and coding patterns for roughly 0–5 years of experience. Questions are designed around the same concepts used in practical SQL interviews.",
            color: "blue",
            lessons: [
                {
                    title: "Interview: SQL vs RDBMS",
                    concept: "SQL is a language for interacting with relational databases. An RDBMS is the software system that stores and manages the relational data and executes SQL.",
                    keyPoints: [
                        "SQL is not itself a database server.",
                        "Different RDBMS products implement SQL with vendor-specific features.",
                        "Interviewers often check whether candidates understand the distinction."
                    ],
                    interviewQuestion: "Explain the difference between SQL, an RDBMS, and a database. Give one practical example."
                },
                {
                    title: "Interview: Primary Key vs UNIQUE",
                    concept: "Both primary keys and UNIQUE constraints enforce uniqueness, but they have different roles in relational design.",
                    keyPoints: [
                        "A table has one primary-key constraint.",
                        "A table can have multiple UNIQUE constraints.",
                        "Primary-key columns cannot be NULL."
                    ],
                    interviewQuestion: "What is the difference between PRIMARY KEY and UNIQUE? Can a table have more than one UNIQUE constraint?"
                },
                {
                    title: "Interview: WHERE vs HAVING",
                    concept: "WHERE filters rows before grouping. HAVING filters groups after aggregation.",
                    keyPoints: [
                        "Use WHERE for ordinary row conditions.",
                        "Use HAVING when the condition depends on an aggregate result.",
                        "This distinction is frequently tested in interviews."
                    ],
                    syntax: "SELECT account_id, SUM(amount) AS total_amount\nFROM transactions\nWHERE transaction_status = 'Completed'\nGROUP BY account_id\nHAVING SUM(amount) > 100000;",
                    interviewQuestion: "Why can SUM(amount) > 100000 not normally be placed directly in WHERE?",
                    practice: "Return accounts whose completed transaction total exceeds 100000.",
                    database: "Banking",
                    starterQuery: "SELECT account_id, SUM(amount) AS total_amount\nFROM transactions\nWHERE transaction_status = 'Completed'\nGROUP BY account_id\nHAVING SUM(amount) > 100000;"
                },
                {
                    title: "Interview: Second-Highest Salary Pattern",
                    concept: "The second-highest distinct value is a standard interview problem because it tests ordering, duplicates and edge cases.",
                    keyPoints: [
                        "MAX below the maximum is one approach.",
                        "DENSE_RANK is another.",
                        "Always clarify whether 'second' means second row or second distinct value."
                    ],
                    syntax: "SELECT MAX(salary)\nFROM employees\nWHERE salary < (SELECT MAX(salary) FROM employees);",
                    interviewQuestion: "Find the second-highest distinct salary. How would your solution behave if the highest salary appears multiple times?",
                    practice: "Find the second-highest distinct principal_amount from Banking loans.",
                    database: "Banking",
                    starterQuery: "SELECT MAX(principal_amount) AS second_highest_loan\nFROM loans\nWHERE principal_amount < (\n    SELECT MAX(principal_amount)\n    FROM loans\n);"
                },
                {
                    title: "Interview: Find Duplicates",
                    concept: "Duplicate detection usually means grouping by the business column that defines a duplicate, not grouping by the primary key.",
                    keyPoints: [
                        "Choose the correct business definition of a duplicate.",
                        "COUNT(*) > 1 identifies repeated groups.",
                        "Primary keys normally should not duplicate."
                    ],
                    syntax: "SELECT email, COUNT(*) AS record_count\nFROM customers\nGROUP BY email\nHAVING COUNT(*) > 1;",
                    interviewQuestion: "How would you find duplicate email addresses in a customer table?",
                    practice: "Find duplicate customer email addresses in Banking.",
                    database: "Banking",
                    starterQuery: "SELECT email, COUNT(*) AS record_count\nFROM customers\nGROUP BY email\nHAVING COUNT(*) > 1;"
                },
                {
                    title: "Interview: Customers Without Activity",
                    concept: "Finding entities with no related records is a common real-world SQL interview pattern.",
                    keyPoints: [
                        "LEFT JOIN + IS NULL is a classic approach.",
                        "NOT EXISTS is another strong approach.",
                        "The correct relationship path matters."
                    ],
                    syntax: "SELECT c.customer_id\nFROM customers c\nLEFT JOIN accounts a\n  ON c.customer_id = a.customer_id\nWHERE a.customer_id IS NULL;",
                    interviewQuestion: "Give two ways to find customers who have never had a transaction.",
                    practice: "Return customers for whom no transaction record exists.",
                    database: "Banking",
                    starterQuery: "SELECT c.customer_id, c.first_name, c.last_name\nFROM customers c\nWHERE NOT EXISTS (\n    SELECT 1\n    FROM accounts a\n    JOIN transactions t ON a.account_id = t.account_id\n    WHERE a.customer_id = c.customer_id\n);"
                },
                {
                    title: "Interview: Latest Record Per Customer",
                    concept: "Latest-row problems test whether you can combine partitioning, ordering and row filtering.",
                    keyPoints: [
                        "ROW_NUMBER is usually the clearest solution.",
                        "PARTITION BY defines the entity.",
                        "ORDER BY defines what 'latest' means."
                    ],
                    interviewQuestion: "Return the latest loan for every customer. What happens if two loans have the same start_date?",
                    practice: "Return the latest loan for every customer with a deterministic tie-breaker.",
                    database: "Banking",
                    starterQuery: "WITH ranked AS (\n    SELECT l.*,\n           ROW_NUMBER() OVER (\n               PARTITION BY customer_id\n               ORDER BY start_date DESC, loan_id DESC\n           ) AS rn\n    FROM loans l\n)\nSELECT loan_id, customer_id, principal_amount, start_date\nFROM ranked\nWHERE rn = 1;"
                },
                {
                    title: "Interview: DELETE Without WHERE",
                    concept: "A DELETE statement without a WHERE condition can remove every row from the target table. Interviewers use this to test practical SQL safety awareness.",
                    keyPoints: [
                        "DELETE FROM table; can affect every row.",
                        "Always verify the target set before destructive operations.",
                        "A transaction can provide an additional safety mechanism where supported."
                    ],
                    interviewQuestion: "What happens when DELETE is executed without WHERE? How would you safely validate the affected rows first?"
                },
                {
                    title: "Interview: UNION vs UNION ALL",
                    concept: "Both combine compatible result sets, but UNION removes duplicates while UNION ALL preserves them.",
                    keyPoints: [
                        "UNION can require duplicate elimination.",
                        "UNION ALL is often preferable when duplicates are meaningful.",
                        "Column counts and compatible types are required."
                    ],
                    interviewQuestion: "When would you intentionally choose UNION ALL instead of UNION?"
                },
                {
                    title: "Interview: Window Function vs GROUP BY",
                    concept: "GROUP BY collapses rows into groups. Window functions calculate across related rows while keeping the original row grain.",
                    keyPoints: [
                        "Use GROUP BY for one result row per group.",
                        "Use window functions when you need detail plus an analytical calculation.",
                        "This distinction is central to many experienced SQL interviews."
                    ],
                    practice: "Show every Banking transaction together with the total transaction amount for its account without collapsing individual transaction rows.",
                    database: "Banking",
                    starterQuery: "SELECT account_id,\n       transaction_id,\n       amount,\n       SUM(amount) OVER (PARTITION BY account_id) AS account_total\nFROM transactions;"
                },
                {
                    title: "Interview Case Study: Customer Risk",
                    concept: "Real interviews often combine several SQL concepts instead of asking for one keyword at a time. A candidate must translate a business rule into joins, aggregation and CASE logic.",
                    keyPoints: [
                        "Start by defining the required output grain.",
                        "Aggregate transactions to customer level.",
                        "Use CASE to classify the final business metric."
                    ],
                    interviewQuestion: "A bank wants to classify customers as High, Medium or Low risk using transaction volume and total transaction amount. Explain your assumptions before writing SQL.",
                    practice: "Create a customer-level transaction summary and classify customers based on total transaction amount.",
                    database: "Banking",
                    starterQuery: "WITH customer_activity AS (\n    SELECT c.customer_id,\n           COUNT(t.transaction_id) AS transaction_count,\n           COALESCE(SUM(t.amount), 0) AS total_amount\n    FROM customers c\n    LEFT JOIN accounts a ON c.customer_id = a.customer_id\n    LEFT JOIN transactions t ON a.account_id = t.account_id\n    GROUP BY c.customer_id\n)\nSELECT customer_id,\n       transaction_count,\n       total_amount,\n       CASE\n           WHEN total_amount >= 500000 THEN 'High'\n           WHEN total_amount >= 100000 THEN 'Medium'\n           ELSE 'Low'\n       END AS risk_segment\nFROM customer_activity;"
                }
            ]
        }
    };

    let activeTrack = "beginner";
    let activeLessonIndex = 0;

    const STORAGE_KEY = "sqlLearningTutorialProgress_v3";

    /* ============================================================
     * DOM HELPERS
     * ============================================================ */

    const $ = (selector, root = document) => root.querySelector(selector);

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replaceAll("\n", "&#10;");
    }

    /* ============================================================
     * LOCAL PROGRESS
     * ------------------------------------------------------------
     * Progress is intentionally lightweight and browser-local for
     * V1. It records lessons that the learner has successfully
     * executed at least once.
     * ============================================================ */

    function loadProgress() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return saved && typeof saved === "object" ? saved : {};
        } catch {
            return {};
        }
    }

    function saveLessonProgress() {
        const progress = loadProgress();

        if (!progress[activeTrack]) {
            progress[activeTrack] = {};
        }

        progress[activeTrack][activeLessonIndex] = {
            practiced: true,
            completedAt: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }

    function isLessonPracticed(trackKey, index) {
        const progress = loadProgress();
        return Boolean(progress?.[trackKey]?.[index]?.practiced);
    }

    /* ============================================================
     * ROADMAP RENDERING
     * ------------------------------------------------------------
     * Each track is a native <details> element so the learner can
     * collapse one segment while studying another.
     * ============================================================ */

    function buildRoadmap() {
        const roadmap = $("#tutorial-roadmap");
        if (!roadmap) return;

        roadmap.innerHTML = Object.entries(TUTORIAL_CONTENT)
            .map(([trackKey, track]) => {
                const isOpen = trackKey === activeTrack;

                return `
                    <details
                        class="roadmap-track"
                        data-track="${escapeAttribute(trackKey)}"
                        ${isOpen ? "open" : ""}
                    >
                        <summary>
                            <span>${escapeHtml(track.title)}</span>
                        </summary>

                        <div class="track-lessons">
                            ${track.lessons.map((lesson, index) => `
                                <button
                                    type="button"
                                    class="track-lesson ${trackKey === activeTrack && index === activeLessonIndex ? "active" : ""}"
                                    data-track="${escapeAttribute(trackKey)}"
                                    data-index="${index}"
                                >
                                    ${isLessonPracticed(trackKey, index) ? "✓ " : ""}
                                    ${escapeHtml(lesson.title)}
                                </button>
                            `).join("")}
                        </div>
                    </details>
                `;
            })
            .join("");
    }

    /* ============================================================
     * VISUAL COMPONENTS
     * ============================================================ */

    function renderVisual(visual) {
        if (!visual) return "";

        if (visual.type === "acid") {
            const cards = [
                ["A", "Atomicity", "All-or-nothing transaction behavior."],
                ["C", "Consistency", "Database rules remain valid."],
                ["I", "Isolation", "Concurrent work does not incorrectly interfere."],
                ["D", "Durability", "Committed changes survive failures."]
            ];

            return `
                <section class="concept-visual-card">
                    <h3>✨ ${escapeHtml(visual.title)}</h3>
                    <div class="acid-grid">
                        ${cards.map(card => `
                            <div class="acid-card">
                                <strong>${card[0]} — ${card[1]}</strong>
                                <span>${card[2]}</span>
                            </div>
                        `).join("")}
                    </div>
                </section>
            `;
        }

        if (visual.type === "normalization") {
            return `
                <section class="concept-visual-card">
                    <h3>✨ ${escapeHtml(visual.title)}</h3>
                    <div class="normalization-flow">
                        ${visual.steps.map((step, index) => `
                            <div class="normalization-step">
                                <div>
                                    <strong>${escapeHtml(step[0])}</strong>
                                    <br>
                                    <span>${escapeHtml(step[1])}</span>
                                </div>
                            </div>
                            ${index < visual.steps.length - 1 ? `<div class="flow-arrow">→</div>` : ""}
                        `).join("")}
                    </div>
                </section>
            `;
        }

        if (visual.type === "flow") {
            return `
                <section class="concept-visual-card">
                    <h3>✨ ${escapeHtml(visual.title)}</h3>
                    <div class="normalization-flow">
                        ${visual.steps.map((step, index) => `
                            <div class="normalization-step">
                                <div>
                                    <strong>${escapeHtml(step[0])}</strong>
                                    <br>
                                    <span>${escapeHtml(step[1])}</span>
                                </div>
                            </div>
                            ${index < visual.steps.length - 1 ? `<div class="flow-arrow">→</div>` : ""}
                        `).join("")}
                    </div>
                </section>
            `;
        }

        return "";
    }

    /* ============================================================
     * PRACTICE EDITOR HTML
     * ------------------------------------------------------------
     * Results container starts hidden. No result rows are created
     * until Run Query succeeds.
     * ============================================================ */

    function renderPractice(lesson) {
        if (!lesson.practice || !lesson.database) {
            return "";
        }

        return `
            <section class="practice-card">
                <div class="practice-label">💻 Practice after learning</div>

                <h3>Try it yourself</h3>

                <p class="practice-question">
                    ${escapeHtml(lesson.practice)}
                </p>

                <textarea
                    class="practice-editor"
                    id="tutorial-sql-editor"
                    spellcheck="false"
                    aria-label="Tutorial SQL editor"
                    placeholder="Write your SQL query here..."
                >${escapeHtml(lesson.starterQuery || "")}</textarea>

                <div class="practice-toolbar">
                    <button
                        type="button"
                        id="tutorial-run-query"
                    >
                        ▶ Run Query
                    </button>

                    <button
                        type="button"
                        id="tutorial-clear-query"
                    >
                        Clear
                    </button>

                    <span class="practice-database">
                        Database: ${escapeHtml(lesson.database)}
                    </span>
                </div>

                <div
                    id="tutorial-practice-status"
                    class="practice-status"
                    aria-live="polite"
                ></div>

                <!-- Intentionally hidden until the first successful execution. -->
                <div
                    id="tutorial-practice-results"
                    class="practice-results"
                    aria-live="polite"
                >
                    <div class="practice-results-header">
                        <strong>Query Results</strong>
                        <span id="tutorial-result-summary"></span>
                    </div>

                    <div class="practice-results-scroll">
                        <table>
                            <thead id="tutorial-result-head"></thead>
                            <tbody id="tutorial-result-body"></tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    }

    /* ============================================================
     * LESSON RENDERING
     * ============================================================ */

    function renderLesson() {
        const container = $(".tutorial-content");
        const track = TUTORIAL_CONTENT[activeTrack];

        if (!container || !track) return;

        const lesson = track.lessons[activeLessonIndex];

        const lessonType =
            activeTrack === "rdbms"
                ? "RDBMS Core"
                : activeTrack === "interview"
                    ? "Interview"
                    : track.title.replace(/^[^\s]+\s/, "");

        const interviewBlock = lesson.interviewQuestion
            ? `
                <section class="interview-card">
                    <div class="practice-label">🎯 Interview Question</div>
                    <h3>Think before you code</h3>
                    <p>${escapeHtml(lesson.interviewQuestion)}</p>
                </section>
            `
            : "";

        const syntaxBlock = lesson.syntax
            ? `
                <section class="tutorial-section">
                    <h3>SQL Syntax / Pattern</h3>
                    <div class="sql-code-block">
                        <pre><code>${escapeHtml(lesson.syntax)}</code></pre>
                    </div>
                </section>
            `
            : "";

        const exampleBlock = lesson.example
            ? `
                <section class="tutorial-section">
                    <h3>Example</h3>
                    <div class="sql-code-block">
                        <pre><code>${escapeHtml(lesson.example)}</code></pre>
                    </div>
                </section>
            `
            : "";

        const explanationBlock = lesson.explanation
            ? `
                <section class="tutorial-section">
                    <h3>How to Think About It</h3>
                    <p>${escapeHtml(lesson.explanation)}</p>
                </section>
            `
            : "";

        container.innerHTML = `
            <div class="tutorial-track-header">
                <span class="track-badge">${escapeHtml(track.title)}</span>

                <h1>${escapeHtml(lesson.title)}</h1>

                <p>${escapeHtml(track.subtitle)}</p>

                <div class="lesson-meta">
                    <span>${escapeHtml(lessonType)}</span>
                    <span>Lesson ${activeLessonIndex + 1} of ${track.lessons.length}</span>
                    ${isLessonPracticed(activeTrack, activeLessonIndex)
                        ? `<span>✓ Practiced</span>`
                        : `<span>Not practiced yet</span>`}
                    ${lesson.database
                        ? `<span>DB: ${escapeHtml(lesson.database)}</span>`
                        : ""}
                </div>
            </div>

            <article class="tutorial-lesson">

                <section class="tutorial-section">
                    <h3>📖 Definition</h3>
                    <div class="definition-box">
                        ${escapeHtml(lesson.concept)}
                    </div>

                    ${lesson.keyPoints?.length
                        ? `
                            <ul class="key-points">
                                ${lesson.keyPoints.map(point => `
                                    <li>${escapeHtml(point)}</li>
                                `).join("")}
                            </ul>
                        `
                        : ""}
                </section>

                ${syntaxBlock}
                ${exampleBlock}
                ${explanationBlock}
                ${renderVisual(lesson.visual)}
                ${interviewBlock}
                ${renderPractice(lesson)}

            </article>

            <div class="lesson-navigation">
                <button
                    type="button"
                    data-action="previous"
                    ${activeLessonIndex === 0 ? "disabled" : ""}
                >
                    ← Previous
                </button>

                <span class="lesson-counter">
                    ${activeLessonIndex + 1} / ${track.lessons.length}
                </span>

                <button
                    type="button"
                    data-action="next"
                    ${activeLessonIndex === track.lessons.length - 1 ? "disabled" : ""}
                >
                    Next →
                </button>
            </div>
        `;

        updateRoadmapState();
    }

    function updateRoadmapState() {
        document.querySelectorAll(".track-lesson").forEach(button => {
            const selected =
                button.dataset.track === activeTrack &&
                Number(button.dataset.index) === activeLessonIndex;

            button.classList.toggle("active", selected);
        });

        document.querySelectorAll(".roadmap-track").forEach(trackElement => {
            trackElement.classList.toggle(
                "active-track",
                trackElement.dataset.track === activeTrack
            );
        });
    }

    /* ============================================================
     * PRACTICE QUERY RESULT RENDERING
     * ============================================================ */

    function getResultRows(result) {
        if (Array.isArray(result?.rows)) {
            return result.rows;
        }

        if (Array.isArray(result?.data)) {
            return result.data;
        }

        return [];
    }

    function getResultColumns(result, rows) {
        if (Array.isArray(result?.columns) && result.columns.length) {
            return result.columns;
        }

        if (rows.length) {
            return Object.keys(rows[0]);
        }

        return [];
    }

    function displayPracticeResults(result) {
        const container = $("#tutorial-practice-results");
        const head = $("#tutorial-result-head");
        const body = $("#tutorial-result-body");
        const summary = $("#tutorial-result-summary");

        if (!container || !head || !body || !summary) return;

        const rows = getResultRows(result);
        const columns = getResultColumns(result, rows);

        head.innerHTML = `
            <tr>
                ${columns.map(column => `
                    <th>${escapeHtml(column)}</th>
                `).join("")}
            </tr>
        `;

        body.innerHTML = rows.map(row => `
            <tr>
                ${columns.map(column => `
                    <td>${escapeHtml(row?.[column] ?? "")}</td>
                `).join("")}
            </tr>
        `).join("");

        summary.textContent =
            `${rows.length} row${rows.length === 1 ? "" : "s"} returned`;

        container.classList.add("visible");
    }

    /* ============================================================
     * PRACTICE QUERY EXECUTION
     * ------------------------------------------------------------
     * Browser-first execution is preferred. sqlEngine already uses
     * browserSqlEngine when available and only falls back to the
     * backend service when necessary.
     * ============================================================ */

    async function runPracticeQuery() {
        const editor = $("#tutorial-sql-editor");
        const status = $("#tutorial-practice-status");
        const button = $("#tutorial-run-query");

        if (!editor || !status || !button) return;

        const query = editor.value.trim();

        if (!query) {
            status.className = "practice-status error";
            status.textContent = "❌ Please enter a SQL query.";
            return;
        }

        const lesson = TUTORIAL_CONTENT[activeTrack]?.lessons[activeLessonIndex];

        if (!lesson?.database) {
            status.className = "practice-status error";
            status.textContent = "This lesson does not have a SQL practice database.";
            return;
        }

        const resultContainer = $("#tutorial-practice-results");

        /* Hide old results while a new query is running. */
        if (resultContainer) {
            resultContainer.classList.remove("visible");
        }

        button.disabled = true;
        button.textContent = "⏳ Running...";

        status.className = "practice-status";
        status.textContent = "Running in browser SQL engine...";

        try {
            if (!window.sqlEngine) {
                throw new Error("SQL engine is not loaded. Please refresh the page.");
            }

            const result = await window.sqlEngine.execute(query, {
                database: lesson.database
            });

            displayPracticeResults(result);

            status.className = "practice-status success";
            status.textContent =
                `✅ Query executed successfully in ${result.executionTime ?? 0} ms.`;

            saveLessonProgress();
            buildRoadmap();
            updateRoadmapState();

        } catch (error) {
            status.className = "practice-status error";
            status.textContent =
                `❌ ${error?.message || "Query execution failed."}`;
        } finally {
            button.disabled = false;
            button.textContent = "▶ Run Query";
        }
    }

    function clearPracticeQuery() {
        const editor = $("#tutorial-sql-editor");
        const status = $("#tutorial-practice-status");
        const resultContainer = $("#tutorial-practice-results");

        if (editor) {
            editor.value = "";
            editor.focus();
        }

        if (status) {
            status.className = "practice-status";
            status.textContent = "";
        }

        if (resultContainer) {
            resultContainer.classList.remove("visible");
        }

        const head = $("#tutorial-result-head");
        const body = $("#tutorial-result-body");
        const summary = $("#tutorial-result-summary");

        if (head) head.innerHTML = "";
        if (body) body.innerHTML = "";
        if (summary) summary.textContent = "";
    }

    /* ============================================================
     * NAVIGATION
     * ============================================================ */

    function selectLesson(trackKey, index) {
        if (!TUTORIAL_CONTENT[trackKey]) return;

        activeTrack = trackKey;
        activeLessonIndex = Math.max(
            0,
            Math.min(index, TUTORIAL_CONTENT[trackKey].lessons.length - 1)
        );

        localStorage.setItem(
            "sqlLearningTutorialLastLocation_v3",
            JSON.stringify({
                track: activeTrack,
                index: activeLessonIndex
            })
        );

        buildRoadmap();
        renderLesson();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    function handleRoadmapClick(event) {
        const button = event.target.closest(".track-lesson");

        if (!button) return;

        selectLesson(
            button.dataset.track,
            Number(button.dataset.index)
        );
    }

    function handleLessonClick(event) {
        const actionButton = event.target.closest("[data-action]");

        if (actionButton && !actionButton.disabled) {
            if (actionButton.dataset.action === "previous") {
                if (activeLessonIndex > 0) {
                    selectLesson(activeTrack, activeLessonIndex - 1);
                }
            }

            if (actionButton.dataset.action === "next") {
                if (
                    activeLessonIndex <
                    TUTORIAL_CONTENT[activeTrack].lessons.length - 1
                ) {
                    selectLesson(activeTrack, activeLessonIndex + 1);
                }
            }

            return;
        }

        if (event.target.closest("#tutorial-run-query")) {
            runPracticeQuery();
            return;
        }

        if (event.target.closest("#tutorial-clear-query")) {
            clearPracticeQuery();
        }
    }

    /* ============================================================
     * RESTORE LAST LESSON
     * ============================================================ */

    function restoreLastLocation() {
        try {
            const saved = JSON.parse(
                localStorage.getItem("sqlLearningTutorialLastLocation_v3")
            );

            if (
                saved &&
                TUTORIAL_CONTENT[saved.track] &&
                Number.isInteger(saved.index)
            ) {
                activeTrack = saved.track;
                activeLessonIndex = Math.max(
                    0,
                    Math.min(
                        saved.index,
                        TUTORIAL_CONTENT[saved.track].lessons.length - 1
                    )
                );
            }
        } catch {
            /* Ignore malformed local progress and use Beginner Lesson 1. */
        }
    }

    /* ============================================================
     * INITIALIZATION
     * ============================================================ */

    function initialize() {
        if (!$(".tutorial-content") || !$("#tutorial-roadmap")) {
            console.error("Tutorial containers were not found.");
            return;
        }

        restoreLastLocation();
        buildRoadmap();
        renderLesson();

        $("#tutorial-roadmap").addEventListener(
            "click",
            handleRoadmapClick
        );

        $(".tutorial-content").addEventListener(
            "click",
            handleLessonClick
        );

        console.log("✅ tutorial.js V3 loaded successfully");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
})();

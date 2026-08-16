/*
 * SQL Learning Platform - Tutorial JavaScript
 * ============================================================
 * Tutorial V2:
 * - Beginner, Intermediate, Expert and Interview tracks
 * - Dynamic lesson navigation
 * - Concept → Syntax → Example → Explanation → Practice
 * - Keeps Tutorial separate from Playground, Challenge and Sandbox
 *
 * Revision-sensitive:
 * - Uses the platform's current Banking/Healthcare column names.
 * - Additional lessons can be added to TUTORIAL_CONTENT without
 *   changing the rendering/navigation logic.
 * ============================================================
 */

(() => {
    "use strict";

    const TUTORIAL_CONTENT = {

        rdbms: {
            title: "📚 RDBMS Core",
            subtitle: "Understand the database concepts that make SQL and relational databases work.",
            lessons: [
                {
                    title: "DBMS vs RDBMS",
                    concept: "A DBMS manages data, while an RDBMS organizes data into related tables and enforces relationships through relational concepts such as keys and constraints.",
                    syntax: "Tables → Rows + Columns\nRelationships → Primary Key + Foreign Key",
                    example: "SELECT customer_id, first_name, last_name\nFROM customers;",
                    explanation: "In this platform, Banking and Healthcare are modeled as relational databases. Customers, Accounts and Transactions are separate tables connected through keys rather than storing everything in one large table.",
                    practice: "Explore the customers table and return customer_id, first_name and last_name."
                },
                {
                    title: "Primary Key",
                    concept: "A primary key uniquely identifies each row in a table.",
                    syntax: "PRIMARY KEY (column_name)",
                    example: "SELECT customer_id, first_name, last_name\nFROM customers\nORDER BY customer_id\nLIMIT 5;",
                    explanation: "A primary key should uniquely identify a record. In the Banking database, customer_id identifies a customer, while account_id identifies an account.",
                    practice: "Return the first five customer records and include customer_id so you can observe the row identifier."
                },
                {
                    title: "Foreign Key",
                    concept: "A foreign key connects a row in one table to a related row in another table.",
                    syntax: "FOREIGN KEY (child_column)\nREFERENCES parent_table(parent_column)",
                    example: "SELECT c.customer_id,\n       c.first_name,\n       a.account_id\nFROM customers c\nJOIN accounts a\n  ON c.customer_id = a.customer_id\nLIMIT 5;",
                    explanation: "The customer_id in accounts refers to the related customer. Foreign keys help maintain referential integrity and allow meaningful joins between tables.",
                    practice: "Join customers and accounts using their customer_id relationship and return five matching records."
                },
                {
                    title: "Constraints",
                    concept: "Constraints protect data quality by enforcing rules on table columns and relationships.",
                    syntax: "PRIMARY KEY\nFOREIGN KEY\nNOT NULL\nUNIQUE\nCHECK\nDEFAULT",
                    example: "SELECT customer_id, email\nFROM customers\nWHERE email IS NOT NULL\nLIMIT 5;",
                    explanation: "Constraints prevent invalid or inconsistent data. They are part of the database design, not merely rules applied by individual queries.",
                    practice: "Find five customers whose email value is not NULL."
                },
                {
                    title: "Relationships",
                    concept: "Relational databases model how entities are connected, commonly through one-to-one, one-to-many and many-to-many relationships.",
                    syntax: "Parent table\n    ↓ Foreign Key\nChild table",
                    example: "SELECT a.account_id,\n       c.first_name,\n       c.last_name\nFROM accounts a\nJOIN customers c\n  ON a.customer_id = c.customer_id\nLIMIT 5;",
                    explanation: "One customer can have multiple accounts, making Customers → Accounts a one-to-many relationship in the Banking model.",
                    practice: "Show five accounts together with the first and last name of their customer."
                },
                {
                    title: "Normalization",
                    concept: "Normalization organizes data to reduce unnecessary duplication and improve consistency.",
                    syntax: "1NF → atomic values\n2NF → remove partial dependency\n3NF → remove transitive dependency",
                    example: "SELECT c.customer_id,\n       c.first_name,\n       a.account_id\nFROM customers c\nJOIN accounts a\n  ON c.customer_id = a.customer_id\nLIMIT 5;",
                    explanation: "Instead of repeatedly storing customer information inside every account record, customer details are kept in customers and linked through customer_id.",
                    practice: "Use a join to display customer information alongside account information without duplicating the customer columns in the accounts table."
                },
                {
                    title: "Transactions & ACID",
                    concept: "A database transaction groups related operations into a reliable unit of work. ACID stands for Atomicity, Consistency, Isolation and Durability.",
                    syntax: "BEGIN TRANSACTION;\n-- statements\nCOMMIT;\n-- or ROLLBACK;",
                    example: "SELECT transaction_id,\n       account_id,\n       amount,\n       transaction_status\nFROM transactions\nORDER BY transaction_date DESC\nLIMIT 5;",
                    explanation: "A banking transfer may involve multiple related changes. Transactions help ensure the database does not remain in an inconsistent state if part of the operation fails.",
                    practice: "Review five recent banking transactions and identify the columns that would be important when validating transaction processing."
                },
                {
                    title: "Indexes",
                    concept: "An index is a data structure that can help the database locate rows faster for suitable queries.",
                    syntax: "CREATE INDEX index_name\nON table_name(column_name);",
                    example: "SELECT *\nFROM transactions\nWHERE account_id = 1001\nORDER BY transaction_date DESC\nLIMIT 5;",
                    explanation: "Indexes can improve lookup and filtering performance, but they also consume storage and add overhead when indexed data changes. Index design should therefore be based on actual access patterns.",
                    practice: "Filter transactions for a specific account and order them by transaction_date to understand a common lookup pattern."
                },
                {
                    title: "Views",
                    concept: "A view is a stored query that presents data through a reusable logical result set.",
                    syntax: "CREATE VIEW view_name AS\nSELECT ...;",
                    example: "SELECT c.first_name,\n       c.last_name,\n       a.account_id\nFROM customers c\nJOIN accounts a\n  ON c.customer_id = a.customer_id;",
                    explanation: "Views can hide complex joins and provide a simpler interface for reporting or repeated queries. The exact ability to create views depends on the environment in which SQL is executed.",
                    practice: "Write a SELECT statement that could form the basis of a customer-account reporting view."
                }
            ]
        },

        beginner: {
            title: "🟢 Beginner SQL",
            subtitle: "Build a strong foundation from the first SELECT to grouped analysis.",
            lessons: [
                {
                    title: "SQL Basics & SELECT",
                    concept: "SELECT retrieves data from one or more tables.",
                    syntax: "SELECT column1, column2\nFROM table_name;",
                    example: "SELECT first_name, last_name\nFROM customers;",
                    explanation: "Start by identifying the table and the columns you need. Explicitly selecting columns makes a query easier to understand and maintain.",
                    practice: "From the Banking customers table, return first_name, last_name and city for all customers."
                },
                {
                    title: "WHERE — Filter Rows",
                    concept: "WHERE filters individual rows before they are returned.",
                    syntax: "SELECT column1, column2\nFROM table_name\nWHERE condition;",
                    example: "SELECT first_name, last_name\nFROM customers\nWHERE customer_status = 'Active';",
                    explanation: "Use WHERE for row-level conditions. Combine conditions with AND or OR when the business rule requires multiple filters.",
                    practice: "Find active customers who live in Mumbai."
                },
                {
                    title: "DISTINCT",
                    concept: "DISTINCT removes duplicate combinations from the selected result.",
                    syntax: "SELECT DISTINCT column_name\nFROM table_name;",
                    example: "SELECT DISTINCT city\nFROM customers;",
                    explanation: "DISTINCT applies to the complete selected row. Selecting multiple columns removes duplicate combinations of those columns.",
                    practice: "List the unique states represented in the customers table."
                },
                {
                    title: "ORDER BY & LIMIT",
                    concept: "ORDER BY controls result order and LIMIT restricts the number of returned rows.",
                    syntax: "SELECT column1, column2\nFROM table_name\nORDER BY column1 DESC\nLIMIT 5;",
                    example: "SELECT loan_id, principal_amount\nFROM loans\nORDER BY principal_amount DESC\nLIMIT 5;",
                    explanation: "Use ORDER BY only when a particular ordering is required. SQL does not guarantee row order when the query does not request one.",
                    practice: "Return the five largest loans by principal_amount."
                },
                {
                    title: "Aggregate Functions",
                    concept: "COUNT, SUM, AVG, MIN and MAX summarize values across rows.",
                    syntax: "SELECT COUNT(*), AVG(amount), MAX(amount)\nFROM payments;",
                    example: "SELECT AVG(amount) AS average_payment\nFROM payments;",
                    explanation: "Aggregate functions turn many rows into summary values. COUNT(*) counts rows, while COUNT(column) ignores NULL values in that column.",
                    practice: "Find the total and average payment amount from payments."
                },
                {
                    title: "GROUP BY",
                    concept: "GROUP BY creates a summary group for each distinct value or combination of values.",
                    syntax: "SELECT category, COUNT(*)\nFROM table_name\nGROUP BY category;",
                    example: "SELECT payment_method, AVG(amount) AS average_payment\nFROM payments\nGROUP BY payment_method;",
                    explanation: "GROUP BY is commonly paired with aggregate functions to answer questions such as how many, how much or what is the average per category.",
                    practice: "Find the number of payments made through each payment_method."
                },
                {
                    title: "HAVING",
                    concept: "HAVING filters groups after aggregation.",
                    syntax: "SELECT category, COUNT(*) AS total\nFROM table_name\nGROUP BY category\nHAVING COUNT(*) > 5;",
                    example: "SELECT account_id, COUNT(*) AS transaction_count\nFROM transactions\nGROUP BY account_id\nHAVING COUNT(*) > 5;",
                    explanation: "WHERE filters individual rows before grouping. HAVING filters grouped results after aggregate calculations.",
                    practice: "Find accounts that have more than five transactions."
                },
                {
                    title: "NULL",
                    concept: "NULL represents a missing or unknown value and must be tested with IS NULL or IS NOT NULL.",
                    syntax: "SELECT *\nFROM table_name\nWHERE column_name IS NULL;",
                    example: "SELECT *\nFROM customers\nWHERE email IS NULL;",
                    explanation: "Do not compare NULL using = or <>. Use IS NULL or IS NOT NULL.",
                    practice: "Find customers whose email is missing."
                }
            ]
        },

        intermediate: {
            title: "🟡 Intermediate SQL",
            subtitle: "Move from individual tables to multi-step business analysis.",
            lessons: [
                {
                    title: "INNER JOIN",
                    concept: "INNER JOIN returns rows where the join condition matches in both tables.",
                    syntax: "SELECT a.column, b.column\nFROM table_a a\nJOIN table_b b\n  ON a.key = b.key;",
                    example: "SELECT c.first_name, c.last_name, a.account_id\nFROM customers c\nJOIN accounts a\n  ON c.customer_id = a.customer_id;",
                    explanation: "Use a join when the information needed for the answer is spread across related tables. Identify the relationship key before choosing the join condition.",
                    practice: "Return each customer's first and last name together with their account_id."
                },
                {
                    title: "LEFT JOIN",
                    concept: "LEFT JOIN preserves every row from the left table even when no matching row exists on the right.",
                    syntax: "SELECT a.column, b.column\nFROM table_a a\nLEFT JOIN table_b b\n  ON a.key = b.key;",
                    example: "SELECT c.customer_id, c.first_name, a.account_id\nFROM customers c\nLEFT JOIN accounts a\n  ON c.customer_id = a.customer_id;",
                    explanation: "LEFT JOIN is useful for finding missing relationships, such as customers without accounts.",
                    practice: "List every customer and any account associated with that customer, including customers with no account."
                },
                {
                    title: "CASE",
                    concept: "CASE adds conditional business logic to a query.",
                    syntax: "CASE\n  WHEN condition THEN result\n  ELSE result\nEND",
                    example: "SELECT loan_id,\n       principal_amount,\n       CASE\n           WHEN principal_amount >= 500000 THEN 'High'\n           WHEN principal_amount >= 200000 THEN 'Medium'\n           ELSE 'Low'\n       END AS loan_category\nFROM loans;",
                    explanation: "CASE is useful for classifications, flags and business rules. Conditions are evaluated from top to bottom.",
                    practice: "Classify loans into High, Medium and Low categories using principal_amount."
                },
                {
                    title: "Subqueries",
                    concept: "A subquery is a SELECT statement nested inside another query and can calculate or filter values.",
                    syntax: "SELECT ...\nFROM table_name\nWHERE column_name > (\n    SELECT aggregate_function(column_name)\n    FROM table_name\n);",
                    example: "SELECT loan_id, principal_amount\nFROM loans\nWHERE principal_amount > (\n    SELECT AVG(principal_amount)\n    FROM loans\n);",
                    explanation: "Subqueries are useful when the outer query depends on a value or set calculated by another query.",
                    practice: "Find loans whose principal_amount is greater than the average loan amount."
                },
                {
                    title: "CTEs",
                    concept: "A Common Table Expression gives a complex query a named intermediate result.",
                    syntax: "WITH summary AS (\n    SELECT ...\n)\nSELECT ...\nFROM summary;",
                    example: "WITH account_totals AS (\n    SELECT account_id, SUM(amount) AS total_amount\n    FROM transactions\n    GROUP BY account_id\n)\nSELECT *\nFROM account_totals\nWHERE total_amount > 100000;",
                    explanation: "CTEs make multi-step logic easier to read, validate and debug.",
                    practice: "Create a CTE containing total transaction amount per account and return accounts whose total exceeds 100000."
                },
                {
                    title: "EXISTS / NOT EXISTS",
                    concept: "EXISTS checks whether a related row exists; NOT EXISTS checks that no matching row exists.",
                    syntax: "SELECT ...\nFROM table_a a\nWHERE EXISTS (\n    SELECT 1\n    FROM table_b b\n    WHERE b.key = a.key\n);",
                    example: "SELECT c.customer_id, c.first_name\nFROM customers c\nWHERE EXISTS (\n    SELECT 1\n    FROM loans l\n    WHERE l.customer_id = c.customer_id\n);",
                    explanation: "EXISTS naturally expresses questions such as 'customers for whom at least one related record exists'.",
                    practice: "Find customers who have at least one loan."
                }
            ]
        },

        expert: {
            title: "🔴 Expert SQL",
            subtitle: "Solve analytical and interview-style problems using advanced SQL reasoning.",
            lessons: [
                {
                    title: "ROW_NUMBER, RANK & DENSE_RANK",
                    concept: "Window ranking functions assign positions without collapsing the underlying rows.",
                    syntax: "ROW_NUMBER() OVER (\n    PARTITION BY group_column\n    ORDER BY value_column DESC\n)",
                    example: "SELECT customer_id,\n       loan_id,\n       principal_amount,\n       ROW_NUMBER() OVER (\n           PARTITION BY customer_id\n           ORDER BY principal_amount DESC\n       ) AS loan_rank\nFROM loans;",
                    explanation: "ROW_NUMBER gives each row a unique position. RANK gives ties the same rank with gaps. DENSE_RANK gives ties the same rank without gaps.",
                    practice: "Rank each customer's loans from highest to lowest principal_amount."
                },
                {
                    title: "Top-N Per Group",
                    concept: "Window functions can find the largest N records inside every group.",
                    syntax: "WITH ranked AS (\n    SELECT ...,\n           ROW_NUMBER() OVER (\n               PARTITION BY group_column\n               ORDER BY value_column DESC\n           ) AS rn\n    FROM table_name\n)\nSELECT ...\nFROM ranked\nWHERE rn <= N;",
                    example: "WITH ranked_loans AS (\n    SELECT loan_id,\n           customer_id,\n           principal_amount,\n           ROW_NUMBER() OVER (\n               PARTITION BY customer_id\n               ORDER BY principal_amount DESC\n           ) AS rn\n    FROM loans\n)\nSELECT loan_id, customer_id, principal_amount\nFROM ranked_loans\nWHERE rn <= 2;",
                    explanation: "Rank rows inside each group first, then filter the rank in an outer query.",
                    practice: "Return the two largest loans for each customer."
                },
                {
                    title: "LAG and LEAD",
                    concept: "LAG and LEAD compare the current row with a previous or following row.",
                    syntax: "LAG(value_column) OVER (\n    PARTITION BY group_column\n    ORDER BY date_column\n)",
                    example: "SELECT account_id,\n       transaction_date,\n       amount,\n       LAG(amount) OVER (\n           PARTITION BY account_id\n           ORDER BY transaction_date\n       ) AS previous_amount\nFROM transactions;",
                    explanation: "These functions are useful for period-over-period comparisons, detecting changes and analyzing sequences.",
                    practice: "For each account, show each transaction amount alongside the previous transaction amount."
                },
                {
                    title: "Running Totals",
                    concept: "A windowed SUM calculates cumulative values while retaining every transaction row.",
                    syntax: "SUM(value_column) OVER (\n    PARTITION BY group_column\n    ORDER BY date_column\n    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n)",
                    example: "SELECT account_id,\n       transaction_date,\n       amount,\n       SUM(amount) OVER (\n           PARTITION BY account_id\n           ORDER BY transaction_date\n           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n       ) AS running_total\nFROM transactions;",
                    explanation: "Unlike GROUP BY, a window aggregate does not collapse the rows. It adds the cumulative calculation beside each row.",
                    practice: "Calculate the running transaction total for every account."
                },
                {
                    title: "Deduplication with Window Functions",
                    concept: "ROW_NUMBER can identify one preferred row within each duplicate group.",
                    syntax: "WITH ranked AS (\n    SELECT *,\n           ROW_NUMBER() OVER (\n               PARTITION BY duplicate_columns\n               ORDER BY preferred_column DESC\n           ) AS rn\n    FROM table_name\n)\nSELECT *\nFROM ranked\nWHERE rn = 1;",
                    example: "WITH ranked_customers AS (\n    SELECT customer_id,\n           email,\n           registration_date,\n           ROW_NUMBER() OVER (\n               PARTITION BY email\n               ORDER BY registration_date DESC\n           ) AS rn\n    FROM customers\n    WHERE email IS NOT NULL\n)\nSELECT customer_id, email, registration_date\nFROM ranked_customers\nWHERE rn = 1;",
                    explanation: "First define what makes a duplicate, then define which record should survive. The ORDER BY expresses that business rule.",
                    practice: "For duplicate email addresses, return the most recently registered customer record."
                },
                {
                    title: "Advanced CTE Analysis",
                    concept: "Multiple CTEs can break a difficult analytical problem into understandable stages.",
                    syntax: "WITH first_step AS (...),\nsecond_step AS (...)\nSELECT ...\nFROM second_step;",
                    example: "WITH account_totals AS (\n    SELECT account_id, SUM(amount) AS total_amount\n    FROM transactions\n    GROUP BY account_id\n),\nranked_accounts AS (\n    SELECT account_id,\n           total_amount,\n           DENSE_RANK() OVER (ORDER BY total_amount DESC) AS rnk\n    FROM account_totals\n)\nSELECT account_id, total_amount\nFROM ranked_accounts\nWHERE rnk <= 3;",
                    explanation: "Treat each CTE as one logical stage. This makes intermediate results easier to validate.",
                    practice: "Find the three accounts with the highest total transaction amount, including ties."
                }
            ]
        },

        interview: {
            title: "💼 SQL Interview",
            subtitle: "Conceptual questions, coding patterns and real-world scenarios for 0–5 years of experience.",
            lessons: [
                {
                    title: "Second-Highest Value",
                    concept: "A classic interview pattern: find the second-highest distinct value.",
                    syntax: "SELECT MAX(value_column)\nFROM table_name\nWHERE value_column < (\n    SELECT MAX(value_column)\n    FROM table_name\n);",
                    example: "SELECT MAX(principal_amount) AS second_highest_loan\nFROM loans\nWHERE principal_amount < (\n    SELECT MAX(principal_amount)\n    FROM loans\n);",
                    explanation: "The key interview concept is handling distinct values correctly. Multiple rows can share the maximum value.",
                    practice: "Find the second-highest distinct principal_amount from loans."
                },
                {
                    title: "WHERE vs HAVING — Interview Question",
                    concept: "WHERE filters rows before grouping; HAVING filters groups after aggregate calculations.",
                    syntax: "SELECT account_id, SUM(amount) AS total_amount\nFROM transactions\nWHERE transaction_status = 'Completed'\nGROUP BY account_id\nHAVING SUM(amount) > 100000;",
                    example: "SELECT account_id,\n       SUM(amount) AS total_amount\nFROM transactions\nWHERE transaction_status = 'Completed'\nGROUP BY account_id\nHAVING SUM(amount) > 100000;",
                    explanation: "An interviewer may ask why transaction_status belongs in WHERE while the SUM(amount) condition belongs in HAVING.",
                    practice: "Explain why an aggregate such as SUM(amount) is normally filtered with HAVING rather than WHERE."
                },
                {
                    title: "Find Customers Without Transactions",
                    concept: "A common real-world interview pattern is finding records with no matching activity.",
                    syntax: "SELECT ...\nFROM customers c\nLEFT JOIN transactions t\n  ON ...\nWHERE t.key IS NULL;",
                    example: "SELECT c.customer_id,\n       c.first_name,\n       c.last_name\nFROM customers c\nLEFT JOIN accounts a\n  ON c.customer_id = a.customer_id\nLEFT JOIN transactions t\n  ON a.account_id = t.account_id\nWHERE t.transaction_id IS NULL;",
                    explanation: "The candidate must reason through customer → account → transaction. LEFT JOIN preserves customers even when the later relationship is missing.",
                    practice: "Return customers for whom no transaction record exists."
                },
                {
                    title: "Latest Record Per Customer",
                    concept: "Finding the latest row for each entity is a common interview task and a practical use of ROW_NUMBER.",
                    syntax: "ROW_NUMBER() OVER (\n    PARTITION BY entity_id\n    ORDER BY date_column DESC\n)",
                    example: "WITH ranked AS (\n    SELECT l.*,\n           ROW_NUMBER() OVER (\n               PARTITION BY customer_id\n               ORDER BY start_date DESC, loan_id DESC\n           ) AS rn\n    FROM loans l\n)\nSELECT *\nFROM ranked\nWHERE rn = 1;",
                    explanation: "The second ordering column acts as a deterministic tie-breaker when dates are equal.",
                    practice: "Return the latest loan for every customer."
                },
                {
                    title: "Duplicate Detection",
                    concept: "Interviewers commonly test whether you can identify duplicates using business columns rather than primary keys.",
                    syntax: "SELECT duplicate_column, COUNT(*) AS record_count\nFROM table_name\nGROUP BY duplicate_column\nHAVING COUNT(*) > 1;",
                    example: "SELECT email,\n       COUNT(*) AS record_count\nFROM customers\nWHERE email IS NOT NULL\nGROUP BY email\nHAVING COUNT(*) > 1;",
                    explanation: "The duplicate definition should be based on the business column. Primary keys should remain unique.",
                    practice: "Find email addresses that appear more than once in customers."
                },
                {
                    title: "Interview Case Study — Customer Risk",
                    concept: "Real interviews often combine aggregation, CASE and business rules instead of testing one keyword at a time.",
                    syntax: "CASE\n    WHEN condition THEN 'High'\n    WHEN condition THEN 'Medium'\n    ELSE 'Low'\nEND",
                    example: "WITH customer_activity AS (\n    SELECT c.customer_id,\n           COUNT(t.transaction_id) AS transaction_count,\n           COALESCE(SUM(t.amount), 0) AS total_amount\n    FROM customers c\n    LEFT JOIN accounts a\n      ON c.customer_id = a.customer_id\n    LEFT JOIN transactions t\n      ON a.account_id = t.account_id\n    GROUP BY c.customer_id\n)\nSELECT customer_id,\n       transaction_count,\n       total_amount,\n       CASE\n           WHEN total_amount >= 500000 THEN 'High'\n           WHEN total_amount >= 100000 THEN 'Medium'\n           ELSE 'Low'\n       END AS risk_segment\nFROM customer_activity;",
                    explanation: "This tests whether you can translate business rules into SQL, preserve customers with no activity, aggregate correctly and classify the result.",
                    practice: "Design a customer risk classification using transaction volume and total transaction amount. State your assumptions before writing SQL."
                }
            ]
        }
    };

    let activeTrack = "beginner";
    let activeLessonIndex = 0;

    const $ = (selector) => document.querySelector(selector);

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function renderLesson() {
        const container = $(".tutorial-content");
        const track = TUTORIAL_CONTENT[activeTrack];
        if (!container || !track) return;

        const lesson = track.lessons[activeLessonIndex];

        container.innerHTML = `
            <div class="tutorial-track-header">
                <span class="tutorial-track-badge">${track.title}</span>
                <p>${escapeHtml(track.subtitle)}</p>
            </div>

            <article class="tutorial-lesson">
                <h1>${escapeHtml(lesson.title)}</h1>

                <section class="tutorial-section">
                    <h2>Concept</h2>
                    <p>${escapeHtml(lesson.concept)}</p>
                </section>

                <section class="tutorial-section">
                    <h2>Syntax</h2>
                    <pre><code>${escapeHtml(lesson.syntax)}</code></pre>
                </section>

                <section class="tutorial-section">
                    <h2>Example</h2>
                    <pre><code>${escapeHtml(lesson.example)}</code></pre>
                </section>

                <section class="tutorial-section">
                    <h2>How to Think About It</h2>
                    <p>${escapeHtml(lesson.explanation)}</p>
                </section>

                <section class="tutorial-practice">
                    <h2>Practice Question</h2>
                    <p>${escapeHtml(lesson.practice)}</p>
                </section>
            </article>

            <div class="tutorial-lesson-navigation">
                <button type="button" class="tutorial-nav-button"
                        data-action="previous" ${activeLessonIndex === 0 ? "disabled" : ""}>
                    ← Previous
                </button>
                <span>Lesson ${activeLessonIndex + 1} of ${track.lessons.length}</span>
                <button type="button" class="tutorial-nav-button"
                        data-action="next" ${activeLessonIndex === track.lessons.length - 1 ? "disabled" : ""}>
                    Next →
                </button>
            </div>
        `;

        updateSidebarState();
    }

    function updateSidebarState() {
        document.querySelectorAll("[data-track]").forEach((item) => {
            item.classList.toggle("active", item.dataset.track === activeTrack);
        });

        document.querySelectorAll("[data-lesson-index]").forEach((item) => {
            item.classList.toggle(
                "active",
                item.dataset.track === activeTrack &&
                Number(item.dataset.lessonIndex) === activeLessonIndex
            );
        });
    }

    function buildSidebar() {
        const sidebarList = $(".tutorial-sidebar ul");
        if (!sidebarList) return;

        sidebarList.innerHTML = Object.entries(TUTORIAL_CONTENT).map(([key, track]) => `
            <li class="tutorial-track-link"
                data-track="${key}"
                role="button"
                tabindex="0">
                ${escapeHtml(track.title)}
            </li>
            <li class="tutorial-track-lessons" data-track-group="${key}">
                <ul>
                    ${track.lessons.map((lesson, index) => `
                        <li class="tutorial-lesson-link"
                            data-track="${key}"
                            data-lesson-index="${index}"
                            role="button"
                            tabindex="0">
                            ${escapeHtml(lesson.title)}
                        </li>
                    `).join("")}
                </ul>
            </li>
        `).join("");
    }

    function handleSidebar(event) {
        const lesson = event.target.closest("[data-lesson-index]");
        if (lesson) {
            activeTrack = lesson.dataset.track;
            activeLessonIndex = Number(lesson.dataset.lessonIndex);
            renderLesson();
            return;
        }

        const track = event.target.closest(".tutorial-track-link");
        if (track) {
            activeTrack = track.dataset.track;
            activeLessonIndex = 0;
            renderLesson();
        }
    }

    function handleNavigation(event) {
        const button = event.target.closest("[data-action]");
        if (!button || button.disabled) return;

        if (button.dataset.action === "previous" && activeLessonIndex > 0) {
            activeLessonIndex--;
        }

        if (
            button.dataset.action === "next" &&
            activeLessonIndex < TUTORIAL_CONTENT[activeTrack].lessons.length - 1
        ) {
            activeLessonIndex++;
        }

        renderLesson();
    }

    function initialize() {
        if (!$(".tutorial-content") || !$(".tutorial-sidebar ul")) {
            console.error("Tutorial containers were not found.");
            return;
        }

        buildSidebar();
        renderLesson();

        $(".tutorial-sidebar ul").addEventListener("click", handleSidebar);
        $(".tutorial-content").addEventListener("click", handleNavigation);

        console.log("tutorial.js loaded successfully");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
})();

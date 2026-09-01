/*
 * ============================================================
 * SQL SANDBOX
 * ============================================================
 *
 * PURPOSE
 * -------
 * Browser-based SQL Sandbox powered by sql.js / SQLite.
 *
 * MAIN FEATURES
 * -------------
 * 1. Create databases from the UI.
 * 2. Create/drop databases using SQL commands.
 * 3. Create/drop/alter tables using SQL.
 * 4. INSERT / UPDATE / DELETE data.
 * 5. SELECT queries with result display.
 * 6. Multiple SQL statements separated by semicolon.
 * 7. Execute selected SQL statement only.
 * 8. Execute statement under cursor when nothing is selected.
 * 9. Execute complete SQL script when no single statement is
 *    explicitly targeted.
 * 10. Emulated USE database_name command.
 * 11. Emulated DESCRIBE table command.
 * 12. Database Explorer automatically refreshes after DDL/DML.
 * 13. Query tabs.
 * 14. Query history state.
 * 15. CSV download.
 * 16. Mobile sidebar.
 * 17. Local browser persistence.
 *
 * IMPORTANT
 * ---------
 * SQLite does not support:
 *
 *     USE database_name;
 *     DESCRIBE table_name;
 *
 * Therefore this Sandbox implements those commands itself.
 *
 * ============================================================
 */


/* ============================================================
 * CONFIGURATION
 * ============================================================ */

const SQLITE_WASM_PATH =
    "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/";


const SANDBOX_STORAGE_KEY =
    "sql_learning_platform_sandbox";


/*
 * Stores the last active database name separately from the
 * database contents. This lets the Sandbox restore the same
 * working database after a browser refresh.
 */
const ACTIVE_DATABASE_STORAGE_KEY =
    "sql_learning_platform_active_database";


const MAX_DATABASES =
    2;


const MAX_TABLES_PER_DATABASE =
    10;


const MAX_ROWS_PER_TABLE =
    2000;


/* ============================================================
 * ELEMENTS
 * ============================================================ */

const sqlEditor =
    document.getElementById("sql-editor");


const runQueryButton =
    document.getElementById("run-query-button");


/*
 * Keeps the original desktop location of the Run Query button.
 * On mobile the same button is moved into .sandbox-editor-actions
 * so it remains visible below the SQL editor, matching Playground.
 */
let runQueryOriginalParent = null;
let runQueryOriginalNextSibling = null;


let sandboxStatus =
    document.getElementById("sandbox-status");


const resultsSection =
    document.getElementById("results-section");


const resultsContainer =
    document.getElementById("results-container");


const resultsSummary =
    document.getElementById("results-summary");


const downloadResultsButton =
    document.getElementById("download-results-button");


const databaseModal =
    document.getElementById("database-modal");


const createDatabaseButton =
    document.getElementById("create-database-button");


const closeDatabaseModal =
    document.getElementById("close-database-modal");


const cancelDatabaseButton =
    document.getElementById("cancel-database-button");


const saveDatabaseButton =
    document.getElementById("save-database-button");


const databaseNameInput =
    document.getElementById("database-name-input");


const databaseSidebar =
    document.getElementById("database-sidebar");


const databaseTree =
    document.getElementById("database-tree");


const databaseSearchInput =
    document.getElementById("database-search-input");


const mobileSidebarButton =
    document.getElementById("mobile-sidebar-button");


const mobileNavButton =
    document.getElementById("mobile-nav-button");



const closeSidebarButton =
    document.getElementById("close-sidebar-button");


const describeTableButton =
    document.getElementById("describe-table-button");


const viewSchemaButton =
    document.getElementById("view-schema-button");


const viewRelationshipsButton =
    document.getElementById("view-relationships-button");


const queryTabs =
    document.getElementById("query-tabs");


const newQueryButton =
    document.getElementById("new-query-button");

const resultsResizeHandle =
    document.getElementById("results-resize-handle");

const minimizeResultsButton =
    document.getElementById("minimize-results-button");

const maximizeResultsButton =
    document.getElementById("maximize-results-button");

const closeResultsButton =
    document.getElementById("close-results-button");


/* ============================================================
 * APPLICATION STATE
 * ============================================================ */

let SQL_ENGINE =
    null;


let activeSQLiteDatabase =
    null;


let activeDatabaseName =
    null;


/*
 * Stores exported SQLite databases.
 *
 * Map:
 *
 * database name -> Uint8Array
 */
const sandboxDatabases =
    new Map();


let latestResults =
    null;


let queryCounter =
    1;


let activeQueryId =
    1;


/*
 * Stores SQL text for every query tab.
 */
const queryContents =
    new Map();


let selectedTableName =
    null;


/*
 * Database that owns selectedTableName.
 *
 * Keeping the database name with the selected table prevents
 * Describe / Schema / Relationships from accidentally using a
 * table name from a previously selected database.
 */
let selectedTableDatabaseName =
    null;


/* ============================================================
 * INITIALIZATION
 * ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeSandbox
);



/* ============================================================
 * MOBILE PLATFORM NAVIGATION — ISOLATED BINDING
 * ------------------------------------------------------------
 * Keeps the Playground-style hamburger independent from the
 * Sandbox/SQLite initialization. This affects only the mobile
 * platform navbar.
 * ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const button =
            document.getElementById(
                "mobile-nav-button"
            );

        const header =
            document.querySelector(
                "body > .platform-header"
            );

        if (
            !button ||
            !header ||
            button.dataset.navToggleBound
        ) {
            return;
        }

        button.dataset.navToggleBound =
            "true";

        /* ------------------------------------------------------------
         * Keep all mobile navigation state changes in one small helper.
         * This only controls the platform navbar; Sandbox functionality
         * and database/query state are intentionally untouched.
         * ------------------------------------------------------------ */
        function closeMobileNavigation() {

            header.classList.remove("mobile-nav-open");

            button.setAttribute(
                "aria-expanded",
                "false"
            );

            button.setAttribute(
                "aria-label",
                "Open navigation"
            );

            button.setAttribute(
                "title",
                "Open navigation"
            );

            button.textContent = "☰";
        }

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                const isOpen =
                    header.classList.toggle(
                        "mobile-nav-open"
                    );

                button.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );

                button.setAttribute(
                    "aria-label",
                    isOpen
                        ? "Close navigation"
                        : "Open navigation"
                );

                button.setAttribute(
                    "title",
                    isOpen
                        ? "Close navigation"
                        : "Open navigation"
                );

                /* Match the working Tutorial mobile header. */
                button.textContent =
                    isOpen ? "✕" : "☰";
            }
        );

        /* Close the platform navbar as soon as the user scrolls.
         * This is especially important on long Sandbox pages: the
         * navigation must never remain open while the user scrolls
         * toward the footer. */
        window.addEventListener(
            "scroll",
            function () {
                if (
                    header.classList.contains(
                        "mobile-nav-open"
                    )
                ) {
                    closeMobileNavigation();
                }
            },
            { passive: true }
        );

        /* Clicking a navigation link should also close the menu. */
        header
            .querySelectorAll(".platform-nav a")
            .forEach(function (link) {
                link.addEventListener(
                    "click",
                    closeMobileNavigation
                );
            });

        /* Clicking outside the open navigation closes it. */
        document.addEventListener(
            "click",
            function (event) {

                if (
                    !header.contains(event.target) &&
                    header.classList.contains(
                        "mobile-nav-open"
                    )
                ) {
                    closeMobileNavigation();
                }
            }
        );

    }
);



/* ============================================================
 * INITIALIZE SANDBOX
 * ============================================================ */

async function initializeSandbox() {

    try {

        showStatus(
            "⏳ Initializing SQL engine...",
            "info"
        );


        await initializeSQLite();


        loadSavedDatabases();


        /*
         * Restore the previously active database when possible.
         * This is only a convenience; SQL commands such as USE
         * and CREATE DATABASE can also work when no database is
         * currently active.
         */
        restoreActiveDatabase();


        updateActiveDatabaseHint();


        renderDatabaseTree();


        queryContents.set(
            1,
            ""
        );


        hideResultsPanel();


        initializeEventListeners();


        showStatus(
            "✅ SQL Sandbox ready.",
            "success"
        );


        console.log(
            "✅ SQL Sandbox initialized successfully."
        );

    }

    catch (error) {

        console.error(
            "❌ Sandbox initialization failed:",
            error
        );


        showStatus(
            "❌ Failed to initialize SQL engine.",
            "error"
        );

    }

}


/* ============================================================
 * SQLITE INITIALIZATION
 * ============================================================ */

async function initializeSQLite() {

    if (SQL_ENGINE) {

        return;

    }


    if (
        typeof window.initSqlJs !==
        "function"
    ) {

        throw new Error(
            "sql.js could not be loaded."
        );

    }


    SQL_ENGINE =
        await window.initSqlJs({

            locateFile:
                function () {

                    return (
                        SQLITE_WASM_PATH +
                        "sql-wasm.wasm"
                    );

                }

        });

}


/* ============================================================
 * RESPONSIVE RUN QUERY BUTTON
 * ============================================================
 * The desktop toolbar intentionally hides its Run Query button on
 * mobile. The same button is therefore moved into the dedicated
 * mobile .sandbox-editor-actions container instead of creating a
 * second button. This keeps the existing query logic unchanged.
 * ============================================================ */

function updateRunQueryButtonPlacement() {

    if (!runQueryButton) {
        return;
    }

    if (!runQueryOriginalParent) {
        runQueryOriginalParent = runQueryButton.parentElement;
        runQueryOriginalNextSibling = runQueryButton.nextSibling;
    }

    const isMobile = window.matchMedia("(max-width: 760px)").matches;

    if (isMobile) {

        let mobileActions =
            document.querySelector(".sandbox-editor-actions");

        /*
         * Normally this container already exists in sandbox.html.
         * Create it only as a safe fallback if a cached/older HTML
         * version does not contain it.
         */
        if (!mobileActions) {
            mobileActions = document.createElement("div");
            mobileActions.className = "sandbox-editor-actions";

            const editorPanel =
                document.querySelector(".sandbox-editor-panel");

            if (editorPanel) {
                editorPanel.appendChild(mobileActions);
            }
        }

        if (mobileActions && runQueryButton.parentElement !== mobileActions) {
            mobileActions.appendChild(runQueryButton);
        }

        /*
         * CSS controls the normal layout; this inline fallback prevents
         * an older cached stylesheet from hiding the mobile button.
         */
        runQueryButton.style.display = "inline-flex";
        runQueryButton.style.visibility = "visible";

    } else {

        if (
            runQueryOriginalParent &&
            runQueryButton.parentElement !== runQueryOriginalParent
        ) {
            if (runQueryOriginalNextSibling &&
                runQueryOriginalNextSibling.parentNode === runQueryOriginalParent) {
                runQueryOriginalParent.insertBefore(
                    runQueryButton,
                    runQueryOriginalNextSibling
                );
            } else {
                runQueryOriginalParent.appendChild(runQueryButton);
            }
        }

        runQueryButton.style.display = "";
        runQueryButton.style.visibility = "";
    }
}


/* ============================================================
 * EVENT INITIALIZATION
 * ============================================================ */

function initializeEventListeners() {

    updateRunQueryButtonPlacement();

    window.addEventListener("resize", updateRunQueryButtonPlacement);


    /* --------------------------------------------------------
     * RUN QUERY
     * -------------------------------------------------------- */

    if (runQueryButton) {

        runQueryButton.addEventListener(
            "click",
            executeCurrentQuery
        );

    }


    /* --------------------------------------------------------
     * DATABASE MODAL
     * -------------------------------------------------------- */

    if (createDatabaseButton) {

        createDatabaseButton.addEventListener(
            "click",
            openDatabaseModal
        );

    }


    if (closeDatabaseModal) {

        closeDatabaseModal.addEventListener(
            "click",
            closeDatabaseModalWindow
        );

    }


    if (cancelDatabaseButton) {

        cancelDatabaseButton.addEventListener(
            "click",
            closeDatabaseModalWindow
        );

    }


    if (saveDatabaseButton) {

        saveDatabaseButton.addEventListener(
            "click",
            createNewDatabase
        );

    }


    /* --------------------------------------------------------
     * CSV
     * -------------------------------------------------------- */

    if (downloadResultsButton) {

        downloadResultsButton.addEventListener(
            "click",
            function () {

                if (latestResults) {

                    downloadCSV(
                        latestResults
                    );

                }

            }
        );

    }


    /* --------------------------------------------------------
     * MOBILE SIDEBAR
     * -------------------------------------------------------- */

    if (mobileSidebarButton) {

        mobileSidebarButton.addEventListener(
            "click",
            function () {

                databaseSidebar.classList.add(
                    "mobile-open"
                );

            }
        );

    }


    if (closeSidebarButton) {

        closeSidebarButton.addEventListener(
            "click",
            function () {

                databaseSidebar.classList.remove(
                    "mobile-open"
                );

            }
        );

    }


    /* --------------------------------------------------------
     * DATABASE SEARCH
     * -------------------------------------------------------- */

    if (databaseSearchInput) {

        databaseSearchInput.addEventListener(
            "input",
            filterDatabaseTree
        );

    }


    /* --------------------------------------------------------
     * NEW QUERY
     * -------------------------------------------------------- */

    if (newQueryButton) {

        newQueryButton.addEventListener(
            "click",
            createNewQueryTab
        );

    }


    /* --------------------------------------------------------
     * SQL EDITOR
     * -------------------------------------------------------- */

    if (sqlEditor) {

        sqlEditor.addEventListener(
            "input",
            function () {

                queryContents.set(
                    activeQueryId,
                    sqlEditor.value
                );

            }
        );


        /*
         * Ctrl + Enter / Cmd + Enter
         *
         * Executes the selected statement if text is selected.
         *
         * Otherwise executes the statement containing the cursor.
         */
        sqlEditor.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter" &&
                    (
                        event.ctrlKey ||
                        event.metaKey
                    )
                ) {

                    event.preventDefault();

                    executeCurrentQuery();

                }

            }
        );

    }


    /* --------------------------------------------------------
     * DATABASE NAME ENTER
     * -------------------------------------------------------- */

    if (databaseNameInput) {

        databaseNameInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    createNewDatabase();

                }

            }
        );

    }


    /* --------------------------------------------------------
     * TABLE INSPECTION
     * -------------------------------------------------------- */

    if (describeTableButton) {

        describeTableButton.addEventListener(
            "click",
            describeSelectedTable
        );

    }


    if (viewSchemaButton) {

        viewSchemaButton.addEventListener(
            "click",
            showSelectedTableSchema
        );

    }


    if (viewRelationshipsButton) {

        viewRelationshipsButton.addEventListener(
            "click",
            showSelectedTableRelationships
        );

    }


    /* --------------------------------------------------------
     * RESULTS PANEL CONTROLS
     * -------------------------------------------------------- */

    initializeResultsPanelControls();

}


/* ============================================================
 * QUERY EXECUTION
 * ============================================================
 *
 * IMPORTANT EXECUTION RULE
 * ------------------------
 *
 * If the user highlights text:
 *
 *     execute highlighted SQL only.
 *
 * Otherwise:
 *
 *     find the SQL statement under the cursor
 *     and execute that statement.
 *
 * This allows:
 *
 *     SELECT * FROM users;
 *     SELECT * FROM doctors;
 *     SELECT * FROM patients;
 *
 * to exist in the same editor.
 *
 * The user can click anywhere inside one statement and
 * Ctrl+Enter / Run Query will execute only that statement.
 *
 * ============================================================
 */

function executeCurrentQuery() {

    /*
     * Do NOT reject the query here just because no database is
     * active. CREATE DATABASE, SHOW DATABASES, USE <db>, and
     * DROP DATABASE are intentionally allowed without an active
     * database, just like a normal SQL client.
     *
     * executeSingleStatement() will enforce the active-database
     * requirement only for statements that actually need one.
     */

    if (!sqlEditor) {

        return;

    }


    const fullSQL =
        sqlEditor.value;


    /*
     * First priority:
     *
     * If the user highlighted SQL, execute exactly that.
     */
    const selectedSQL =
        getSelectedSQL();


    let sqlToExecute;


    if (selectedSQL) {

        sqlToExecute =
            selectedSQL;

    }

    else {

        /*
         * No selection.
         *
         * Execute the statement where the cursor currently is.
         */
        sqlToExecute =
            getStatementAtCursor();

    }


    if (!sqlToExecute) {

        showStatus(
            "❌ No SQL statement found.",
            "error"
        );

        return;

    }


    /*
     * Save current query tab.
     */
    queryContents.set(
        activeQueryId,
        fullSQL
    );


    try {

        showStatus(
            "⏳ Executing SQL...",
            "info"
        );


        const statements =
            splitSQLStatements(
                sqlToExecute
            );


        if (
            statements.length === 0
        ) {

            showStatus(
                "❌ No executable SQL statement found.",
                "error"
            );

            return;

        }


        /*
         * Execute every statement contained in the selected
         * SQL block.
         *
         * This is useful when the user highlights multiple
         * statements intentionally.
         */
        let lastResult =
            null;


        let executedCount =
            0;


        for (
            const statement of statements
        ) {

            const result =
                executeSingleStatement(
                    statement
                );


            if (result) {

                lastResult =
                    result;

            }


            executedCount++;

        }


        /*
         * DDL/DML changes must be persisted and reflected
         * immediately in Database Explorer.
         */
        persistActiveDatabase();


        renderDatabaseTree();


        /*
         * If one of the statements returned rows,
         * display the latest returned result.
         */
        if (lastResult) {

            displaySandboxResults(
                lastResult
            );

        }

        else {

            /*
             * DDL/DML commands don't naturally return a result
             * set, so display a small execution result.
             */
            displayActionResult(
                executedCount
            );

        }


        showStatus(
            "✅ " +
            executedCount +
            (
                executedCount === 1
                    ? " statement"
                    : " statements"
            ) +
            " executed successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "❌ SQL execution error:",
            error
        );


        showStatus(
            "❌ " +
            getSQLiteErrorMessage(error),
            "error"
        );

    }

}


/* ============================================================
 * SELECT SQL UNDER CURSOR
 * ============================================================ */

function getSelectedSQL() {

    if (!sqlEditor) {

        return "";

    }


    const start =
        sqlEditor.selectionStart;


    const end =
        sqlEditor.selectionEnd;


    if (
        start === end
    ) {

        return "";

    }


    return sqlEditor.value
        .substring(
            start,
            end
        )
        .trim();

}


/* ============================================================
 * GET STATEMENT UNDER CURSOR
 * ============================================================
 *
 * Example:
 *
 * SELECT * FROM users;
 *
 * INSERT INTO users VALUES (...);
 *
 * SELECT * FROM users;
 *
 * If the cursor is inside the second statement, only the
 * second statement is returned.
 * ============================================================
 */

function getStatementAtCursor() {

    if (!sqlEditor) {

        return "";

    }


    const sql =
        sqlEditor.value;


    const cursor =
        sqlEditor.selectionStart;


    if (!sql.trim()) {

        return "";

    }


    /*
     * Split the script while preserving statement positions.
     */
    const statements =
        getStatementRanges(
            sql
        );


    for (
        const item of statements
    ) {

        if (
            cursor >= item.start &&
            cursor <= item.end
        ) {

            return item.sql.trim();

        }

    }


    /*
     * Cursor may be sitting immediately after a semicolon.
     *
     * In that situation select the closest previous statement.
     */
    for (
        let i = statements.length - 1;
        i >= 0;
        i--
    ) {

        if (
            cursor >= statements[i].end
        ) {

            return statements[i].sql.trim();

        }

    }


    return "";

}


/* ============================================================
 * STATEMENT RANGES
 * ============================================================ */

function getStatementRanges(sql) {

    const result =
        [];


    let start =
        0;


    let quote =
        null;


    let escaped =
        false;


    for (
        let i = 0;
        i < sql.length;
        i++
    ) {

        const char =
            sql[i];


        if (escaped) {

            escaped =
                false;

            continue;

        }


        if (
            char === "\\" &&
            quote
        ) {

            escaped =
                true;

            continue;

        }


        if (quote) {

            if (
                char === quote
            ) {

                quote =
                    null;

            }

            continue;

        }


        if (
            char === "'" ||
            char === '"' ||
            char === "`"
        ) {

            quote =
                char;

            continue;

        }


        if (
            char === ";"
        ) {

            const statement =
                sql
                    .substring(
                        start,
                        i
                    )
                    .trim();


            if (statement) {

                result.push({

                    sql:
                        statement,

                    start:
                        start,

                    end:
                        i + 1

                });

            }


            start =
                i + 1;

        }

    }


    /*
     * Last statement without semicolon.
     */
    const finalStatement =
        sql
            .substring(
                start
            )
            .trim();


    if (finalStatement) {

        result.push({

            sql:
                finalStatement,

            start:
                start,

            end:
                sql.length

        });

    }


    return result;

}


/* ============================================================
 * SPLIT SQL STATEMENTS
 * ============================================================
 *
 * Handles semicolons inside quoted strings.
 *
 * Example:
 *
 * INSERT INTO users(name)
 * VALUES ('John;Smith');
 *
 * is treated as ONE statement.
 * ============================================================
 */

function splitSQLStatements(sql) {

    return getStatementRanges(sql)
        .map(
            item =>
                item.sql.trim()
        )
        .filter(
            item =>
                item.length > 0
        );

}


/* ============================================================
 * EXECUTE ONE STATEMENT
 * ============================================================ */

function executeSingleStatement(
    rawStatement
) {

    let statement =
        rawStatement.trim();


    if (!statement) {

        return null;

    }


    /*
     * Remove trailing semicolon.
     */
    statement =
        statement.replace(
            /;\s*$/,
            ""
        ).trim();


    /*
     * --------------------------------------------------------
     * USE DATABASE
     * --------------------------------------------------------
     *
     * SQLite does not support USE.
     *
     * We emulate it by opening the corresponding Sandbox DB.
     */
    const useMatch =
        statement.match(
            /^USE\s+["'`]?([A-Za-z0-9_]+)["'`]?\s*$/i
        );


    if (useMatch) {

        const databaseName =
            useMatch[1];


        if (
            !sandboxDatabases.has(
                databaseName
            )
        ) {

            throw new Error(
                "Database '" +
                databaseName +
                "' does not exist."
            );

        }


        openDatabase(
            databaseName
        );


        return {

            columns:
                ["Message"],

            rows:
                [
                    {
                        Message:
                            "Database changed to " +
                            databaseName
                    }
                ],

            executionTime:
                0

        };

    }


    /*
     * --------------------------------------------------------
     * CREATE DATABASE
     * --------------------------------------------------------
     *
     * SQLite doesn't support CREATE DATABASE.
     */
    const createDatabaseMatch =
        statement.match(
            /^CREATE\s+DATABASE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?([A-Za-z0-9_]+)["'`]?\s*$/i
        );


    if (createDatabaseMatch) {

        const databaseName =
            createDatabaseMatch[1];


        createDatabaseFromSQL(
            databaseName
        );


        return {

            columns:
                ["Message"],

            rows:
                [
                    {
                        Message:
                            "Database '" +
                            databaseName +
                            "' created successfully."
                    }
                ],

            executionTime:
                0

        };

    }


    /*
     * --------------------------------------------------------
     * DROP DATABASE
     * --------------------------------------------------------
     */
    const dropDatabaseMatch =
        statement.match(
            /^DROP\s+DATABASE\s+(?:IF\s+EXISTS\s+)?["'`]?([A-Za-z0-9_]+)["'`]?\s*$/i
        );


    if (dropDatabaseMatch) {

        const databaseName =
            dropDatabaseMatch[1];


        dropDatabaseFromSQL(
            databaseName
        );


        return {

            columns:
                ["Message"],

            rows:
                [
                    {
                        Message:
                            "Database '" +
                            databaseName +
                            "' dropped successfully."
                    }
                ],

            executionTime:
                0

        };

    }


    /*
     * --------------------------------------------------------
     * DESCRIBE TABLE
     * --------------------------------------------------------
     *
     * SQLite equivalent:
     *
     * PRAGMA table_info(table_name)
     */
    const describeMatch =
        statement.match(
            /^(?:DESCRIBE|DESC)\s+["'`]?([A-Za-z0-9_]+)["'`]?\s*$/i
        );


    if (describeMatch) {

        const tableName =
            describeMatch[1];


        return executeDescribeTable(
            tableName
        );

    }


    /*
     * --------------------------------------------------------
     * SHOW TABLES
     * --------------------------------------------------------
     */
    if (
        /^SHOW\s+TABLES$/i.test(
            statement
        )
    ) {

        return executeShowTables();

    }


    /*
     * --------------------------------------------------------
     * SHOW DATABASES
     * --------------------------------------------------------
     */
    if (
        /^SHOW\s+DATABASES$/i.test(
            statement
        )
    ) {

        return {

            columns:
                ["Database"],

            rows:
                Array.from(
                    sandboxDatabases.keys()
                ).map(
                    name => ({
                        Database:
                            name
                    })
                ),

            executionTime:
                0

        };

    }


    /*
     * --------------------------------------------------------
     * NORMAL SQLITE QUERY
     * --------------------------------------------------------
     */
    const startTime =
        performance.now();


    const results =
        activeSQLiteDatabase.exec(
            statement
        );


    const executionTime =
        Math.round(
            performance.now() -
            startTime
        );


    /*
     * SELECT / PRAGMA / WITH etc.
     */
    if (
        Array.isArray(results) &&
        results.length > 0
    ) {

        const result =
            results[
                results.length - 1
            ];


        return {

            columns:
                result.columns || [],

            rows:
                convertSQLiteRows(
                    result
                ),

            executionTime:
                executionTime

        };

    }


    /*
     * DDL / DML.
     *
     * SQLite exec() returns no result set.
     *
     * Refresh explorer and return a message.
     */
    renderDatabaseTree();


    return {

        columns:
            ["Message"],

        rows:
            [
                {
                    Message:
                        getStatementSuccessMessage(
                            statement
                        )
                }
            ],

        executionTime:
            executionTime

    };

}


/* ============================================================
 * SQLITE ROW CONVERSION
 * ============================================================ */

function convertSQLiteRows(
    result
) {

    const rows =
        [];


    if (
        !result ||
        !Array.isArray(result.values)
    ) {

        return rows;

    }


    result.values.forEach(
        function (values) {

            const row =
                {};


            result.columns.forEach(
                function (
                    column,
                    index
                ) {

                    row[column] =
                        values[index];

                }
            );


            rows.push(
                row
            );

        }
    );


    return rows;

}


/* ============================================================
 * CREATE DATABASE FROM SQL
 * ============================================================ */

function createDatabaseFromSQL(
    databaseName
) {

    if (
        sandboxDatabases.has(
            databaseName
        )
    ) {

        /*
         * Behave like IF NOT EXISTS.
         */
        openDatabase(
            databaseName
        );

        return;

    }


    if (
        sandboxDatabases.size >=
        MAX_DATABASES
    ) {

        throw new Error(
            "Maximum of " +
            MAX_DATABASES +
            " databases allowed."
        );

    }


    const database =
        new SQL_ENGINE.Database();


    sandboxDatabases.set(
        databaseName,
        database.export()
    );


    activeSQLiteDatabase =
        database;


    activeDatabaseName =
        databaseName;


    persistDatabases();
    persistActiveDatabaseName();


    renderDatabaseTree();

}


/* ============================================================
 * DROP DATABASE FROM SQL
 * ============================================================ */

function dropDatabaseFromSQL(
    databaseName
) {

    if (
        !sandboxDatabases.has(
            databaseName
        )
    ) {

        throw new Error(
            "Database '" +
            databaseName +
            "' does not exist."
        );

    }


    if (
        activeDatabaseName ===
        databaseName
    ) {

        if (
            activeSQLiteDatabase
        ) {

            try {

                activeSQLiteDatabase.close();

            }

            catch (error) {

                console.warn(
                    error
                );

            }

        }


        activeSQLiteDatabase =
            null;

        activeDatabaseName =
            null;

        selectedTableName =
            null;

        selectedTableDatabaseName =
            null;

    }


    sandboxDatabases.delete(
        databaseName
    );


    persistDatabases();


    if (!activeDatabaseName) {

        localStorage.removeItem(
            ACTIVE_DATABASE_STORAGE_KEY
        );

    }


    renderDatabaseTree();


    hideResultsPanel();

}


/* ============================================================
 * DESCRIBE TABLE
 * ============================================================ */

function executeDescribeTable(
    tableName
) {

    ensureActiveDatabase();


    const result =
        activeSQLiteDatabase.exec(
            "PRAGMA table_info(" +
            quoteSQLiteIdentifier(
                tableName
            ) +
            ")"
        );


    if (
        !result.length
    ) {

        throw new Error(
            "No such table: " +
            tableName
        );

    }


    const tableResult =
        result[0];


    const rows =
        convertSQLiteRows(
            tableResult
        );


    if (
        rows.length === 0
    ) {

        throw new Error(
            "No such table: " +
            tableName
        );

    }


    return {

        columns:
            [
                "cid",
                "name",
                "type",
                "notnull",
                "default_value",
                "primary_key"
            ],

        rows:
            rows.map(
                function (row) {

                    return {

                        cid:
                            row.cid,

                        name:
                            row.name,

                        type:
                            row.type,

                        notnull:
                            row.notnull,

                        default_value:
                            row.dflt_value,

                        primary_key:
                            row.pk

                    };

                }
            ),

        executionTime:
            0

    };

}


/* ============================================================
 * SHOW TABLES
 * ============================================================ */

function executeShowTables() {

    ensureActiveDatabase();


    const result =
        activeSQLiteDatabase.exec(
            `
            SELECT name AS table_name
            FROM sqlite_master
            WHERE type = 'table'
            AND name NOT LIKE 'sqlite_%'
            ORDER BY name
            `
        );


    if (
        !result.length
    ) {

        return {

            columns:
                ["table_name"],

            rows:
                [],

            executionTime:
                0

        };

    }


    return {

        columns:
            result[0].columns,

        rows:
            convertSQLiteRows(
                result[0]
            ),

        executionTime:
            0

    };

}


/* ============================================================
 * TABLE COUNT
 * ============================================================ */

function getTableCount() {

    if (
        !activeSQLiteDatabase
    ) {

        return 0;

    }


    const result =
        activeSQLiteDatabase.exec(
            `
            SELECT COUNT(*) AS count
            FROM sqlite_master
            WHERE type = 'table'
            AND name NOT LIKE 'sqlite_%'
            `
        );


    if (
        !result.length
    ) {

        return 0;

    }


    return Number(
        result[0].values[0][0]
    );

}


/* ============================================================
 * DATABASE CREATION BUTTON
 * ============================================================ */

function createNewDatabase() {

    if (!SQL_ENGINE) {

        showModalError(
            "SQL engine is still loading."
        );

        return;

    }


    const name =
        databaseNameInput.value.trim();


    if (!name) {

        showModalError(
            "Please enter a database name."
        );

        return;

    }


    if (
        !/^[A-Za-z0-9_]+$/.test(name)
    ) {

        showModalError(
            "Use only letters, numbers and underscores."
        );

        return;

    }


    if (
        sandboxDatabases.has(name)
    ) {

        showModalError(
            "A database with this name already exists."
        );

        return;

    }


    if (
        sandboxDatabases.size >=
        MAX_DATABASES
    ) {

        showModalError(
            "You can create a maximum of " +
            MAX_DATABASES +
            " databases."
        );

        return;

    }


    try {

        const database =
            new SQL_ENGINE.Database();


        sandboxDatabases.set(
            name,
            database.export()
        );


        activeSQLiteDatabase =
            database;


        activeDatabaseName =
            name;


        persistDatabases();
        persistActiveDatabaseName();


        renderDatabaseTree();


        closeDatabaseModalWindow();


        hideResultsPanel();


        showDatabaseActionStatus(
            "✅ Database '" +
            name +
            "' created successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            error
        );


        showModalError(
            "Failed to create database."
        );

    }

}


/* ============================================================
 * OPEN DATABASE
 * ============================================================ */

function openDatabase(
    databaseName
) {

    const storedDatabase =
        sandboxDatabases.get(
            databaseName
        );


    if (!storedDatabase) {

        showStatus(
            "❌ Database could not be found.",
            "error"
        );

        return;

    }


    try {

        if (
            activeSQLiteDatabase
        ) {

            try {

                activeSQLiteDatabase.close();

            }

            catch (error) {

                console.warn(
                    error
                );

            }

        }


        activeSQLiteDatabase =
            new SQL_ENGINE.Database(
                storedDatabase
            );


        activeDatabaseName =
            databaseName;


        /*
         * Keep the active database visible directly inside the SQL
         * worksheet so the user always knows which database will
         * receive CREATE / INSERT / UPDATE / DELETE / SELECT work.
         */
        updateActiveDatabaseHint();


        persistActiveDatabaseName();


        selectedTableName =
            null;

        selectedTableDatabaseName =
            null;


        renderDatabaseTree();


        hideResultsPanel();


        showStatus(
            "✅ Database '" +
            databaseName +
            "' selected.",
            "success"
        );

    }

    catch (error) {

        console.error(
            error
        );


        showStatus(
            "❌ Failed to open database.",
            "error"
        );

    }

}


/* ============================================================
 * ENSURE ACTIVE DATABASE
 * ============================================================ */

function ensureActiveDatabase() {

    if (
        !activeSQLiteDatabase
    ) {

        throw new Error(
            "Please create or select a database first."
        );

    }

}


/* ============================================================
 * DATABASE PERSISTENCE
 * ============================================================ */

function persistActiveDatabase() {

    if (
        !activeSQLiteDatabase ||
        !activeDatabaseName
    ) {

        return;

    }


    sandboxDatabases.set(
        activeDatabaseName,
        activeSQLiteDatabase.export()
    );


    persistDatabases();

}


/* ============================================================
 * SAVE ALL DATABASES
 * ============================================================ */

function persistDatabases() {

    const saved =
        {};


    sandboxDatabases.forEach(
        function (
            bytes,
            name
        ) {

            saved[name] =
                uint8ArrayToBase64(
                    bytes
                );

        }
    );


    localStorage.setItem(
        SANDBOX_STORAGE_KEY,
        JSON.stringify(
            saved
        )
    );

}


/* ============================================================
 * LOAD DATABASES
 * ============================================================ */

function loadSavedDatabases() {

    sandboxDatabases.clear();


    const stored =
        localStorage.getItem(
            SANDBOX_STORAGE_KEY
        );


    if (!stored) {

        return;

    }


    try {

        const saved =
            JSON.parse(
                stored
            );


        Object.keys(
            saved
        ).forEach(
            function (name) {

                sandboxDatabases.set(
                    name,
                    base64ToUint8Array(
                        saved[name]
                    )
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Failed to load Sandbox databases:",
            error
        );

    }

}


/* ============================================================
 * UINT8 ARRAY -> BASE64
 * ============================================================ */

function uint8ArrayToBase64(
    bytes
) {

    let binary =
        "";


    const chunkSize =
        0x8000;


    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {

        binary +=
            String.fromCharCode.apply(
                null,
                bytes.subarray(
                    i,
                    Math.min(
                        i + chunkSize,
                        bytes.length
                    )
                )
            );

    }


    return btoa(
        binary
    );

}


/* ============================================================
 * BASE64 -> UINT8 ARRAY
 * ============================================================ */

function base64ToUint8Array(
    base64
) {

    const binary =
        atob(
            base64
        );


    const bytes =
        new Uint8Array(
            binary.length
        );


    for (
        let i = 0;
        i < binary.length;
        i++
    ) {

        bytes[i] =
            binary.charCodeAt(
                i
            );

    }


    return bytes;

}


/* ============================================================
 * ACTIVE DATABASE PERSISTENCE
 * ============================================================
 *
 * Keep the last active database name separate from the database
 * bytes. This allows refresh -> restore -> USE/SELECT without
 * forcing the user to click the Database Explorer first.
 * ============================================================ */

function persistActiveDatabaseName() {

    if (!activeDatabaseName) {

        localStorage.removeItem(
            ACTIVE_DATABASE_STORAGE_KEY
        );

        return;

    }


    localStorage.setItem(
        ACTIVE_DATABASE_STORAGE_KEY,
        activeDatabaseName
    );

}


function restoreActiveDatabase() {

    const savedActiveDatabase =
        localStorage.getItem(
            ACTIVE_DATABASE_STORAGE_KEY
        );


    if (!savedActiveDatabase) {

        return;

    }


    if (!sandboxDatabases.has(savedActiveDatabase)) {

        localStorage.removeItem(
            ACTIVE_DATABASE_STORAGE_KEY
        );

        return;

    }


    try {

        /*
         * Re-open the saved database so the normal openDatabase()
         * path is used and all related state is initialized in
         * one place.
         */
        openDatabase(
            savedActiveDatabase
        );

    }

    catch (error) {

        console.warn(
            "Could not restore active database:",
            error
        );

    }

}


/* ============================================================
 * DATABASE TREE
 * ============================================================ */

function renderDatabaseTree() {

    if (!databaseTree) {

        return;

    }


    databaseTree.innerHTML =
        "";


    if (
        sandboxDatabases.size === 0
    ) {

        databaseTree.innerHTML = `

            <div class="empty-database-message">

                <div class="empty-database-icon">
                    🗄️
                </div>

                <p>
                    No databases yet
                </p>

                <span>
                    Create a database to get started.
                </span>

            </div>

        `;

        return;

    }


    sandboxDatabases.forEach(
        function (
            bytes,
            databaseName
        ) {

            let database;


            try {

                database =
                    new SQL_ENGINE.Database(
                        bytes
                    );

            }

            catch (error) {

                console.error(
                    error
                );

                return;

            }


            const databaseItem =
                document.createElement(
                    "div"
                );


            databaseItem.className =
                "database-item";


            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "database-header";


            const isActive =
                databaseName ===
                activeDatabaseName;


            if (isActive) {

                header.classList.add(
                    "active"
                );

            }


            header.innerHTML = `

                <span class="database-arrow">
                    ▶
                </span>

                <span class="database-icon">
                    🗄️
                </span>

                <span class="database-name">
                    ${escapeHTML(databaseName)}
                </span>

                <span class="database-actions">
                    <button type="button" class="database-action-button create-table-action" title="Create table">＋</button>
                    <button type="button" class="database-action-button drop-database-action" title="Drop database">×</button>
                </span>

            `;


            const createTableAction =
                header.querySelector(".create-table-action");

            const dropDatabaseAction =
                header.querySelector(".drop-database-action");

            if (createTableAction) {
                createTableAction.addEventListener("click", function (event) {
                    event.stopPropagation();
                    openCreateTableModal(databaseName);
                });
            }

            if (dropDatabaseAction) {
                dropDatabaseAction.addEventListener("click", function (event) {
                    event.stopPropagation();
                    confirmDropDatabase(databaseName);
                });
            }


            const tableList =
                document.createElement(
                    "div"
                );


            tableList.className =
                "table-list";


            tableList.style.display =
                isActive
                    ? "block"
                    : "none";


            const tables =
                getTablesFromDatabase(
                    database
                );


            tables.forEach(
                function (
                    tableName
                ) {

                    const table =
                        document.createElement(
                            "div"
                        );


                    table.className =
                        "table-item";


                    table.dataset.table =
                        tableName;


                    table.dataset.database =
                        databaseName;


                    table.innerHTML = `

                        <span class="table-item-main">
                            <span>▦</span>
                            <span>${escapeHTML(tableName)}</span>
                        </span>

                        <span class="table-actions">
                            <button type="button" class="table-action-button table-data-action" title="View and edit data">Data</button>
                            <button type="button" class="table-action-button table-insert-action" title="Insert row">＋</button>
                            <button type="button" class="table-action-button table-drop-action" title="Drop table">×</button>
                        </span>

                    `;


                    const dataAction =
                        table.querySelector(".table-data-action");
                    const insertAction =
                        table.querySelector(".table-insert-action");
                    const dropAction =
                        table.querySelector(".table-drop-action");

                    if (dataAction) {
                        dataAction.addEventListener("click", function (event) {
                            event.stopPropagation();
                            selectTable(databaseName, tableName);
                            openTableDataEditor(databaseName, tableName);
                        });
                    }

                    if (insertAction) {
                        insertAction.addEventListener("click", function (event) {
                            event.stopPropagation();
                            selectTable(databaseName, tableName);
                            openInsertRowModal(databaseName, tableName);
                        });
                    }

                    if (dropAction) {
                        dropAction.addEventListener("click", function (event) {
                            event.stopPropagation();
                            confirmDropTable(databaseName, tableName);
                        });
                    }

                    table.addEventListener(
                        "click",
                        function (event) {

                            event.stopPropagation();


                            selectTable(
                                databaseName,
                                tableName
                            );

                        }
                    );


                    tableList.appendChild(
                        table
                    );

                }
            );


            header.addEventListener(
                "click",
                function () {

                    openDatabase(
                        databaseName
                    );


                    const hidden =
                        tableList.style.display ===
                        "none";


                    tableList.style.display =
                        hidden
                            ? "block"
                            : "none";


                    const arrow =
                        header.querySelector(
                            ".database-arrow"
                        );


                    if (arrow) {

                        arrow.textContent =
                            hidden
                                ? "▼"
                                : "▶";

                    }

                }
            );


            databaseItem.appendChild(
                header
            );


            databaseItem.appendChild(
                tableList
            );


            databaseTree.appendChild(
                databaseItem
            );


            /*
             * Close temporary inspection database.
             */
            try {

                database.close();

            }

            catch (error) {

                console.warn(
                    error
                );

            }

        }
    );

}


/* ============================================================
 * GET TABLES
 * ============================================================ */

function getTablesFromDatabase(
    database
) {

    const result =
        database.exec(
            `
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            AND name NOT LIKE 'sqlite_%'
            ORDER BY name
            `
        );


    if (
        !result.length
    ) {

        return [];

    }


    return result[0].values.map(
        row =>
            row[0]
    );

}


/* ============================================================
 * SELECT TABLE
 * ============================================================ */

function selectTable(
    databaseName,
    tableName
) {

    openDatabase(
        databaseName
    );


    selectedTableName =
        tableName;

    selectedTableDatabaseName =
        databaseName;


    /*
     * Selecting a table does NOT execute SQL.
     *
     * It only prepares the editor and identifies the table.
     */
    sqlEditor.value =
        "SELECT *\nFROM " +
        quoteSQLiteIdentifier(
            tableName
        ) +
        ";";


    queryContents.set(
        activeQueryId,
        sqlEditor.value
    );


    sqlEditor.focus();


    databaseSidebar.classList.remove(
        "mobile-open"
    );


    showStatus(
        "📋 Table '" +
        tableName +
        "' selected.",
        "info"
    );

}


/* ============================================================
 * FILTER DATABASE TREE
 * ============================================================ */

function filterDatabaseTree() {

    const search =
        databaseSearchInput.value
            .trim()
            .toLowerCase();


    document
        .querySelectorAll(
            ".database-item"
        )
        .forEach(
            function (item) {

                const text =
                    item.textContent
                        .toLowerCase();


                item.style.display =
                    text.includes(search)
                        ? ""
                        : "none";

            }
        );

}


/* ============================================================
 * RESOLVE TABLE FOR INSPECTION BUTTONS
 * ============================================================
 *
 * The Describe / Schema / Relationships buttons should feel
 * like a normal SQL client. A user should not be forced to
 * click a table in the explorer first if the editor already
 * clearly identifies the table.
 *
 * Resolution priority:
 * 1. Table selected from Database Explorer.
 * 2. DESCRIBE/DESC statement in the editor.
 * 3. FROM <table> in the editor.
 * 4. UPDATE/INTO/JOIN table references as a fallback.
 *
 * This only identifies a table; it does not execute SQL.
 * ============================================================ */

function resolveInspectionTable() {

    /*
     * The SQL editor is the most recent source of intent.
     *
     * Example:
     *     SELECT * FROM Dummy;
     *
     * If the user previously clicked Test, we must NOT continue
     * describing Test when the editor now clearly says Dummy.
     */
    if (sqlEditor && activeSQLiteDatabase) {

        const sql =
            sqlEditor.value.trim();


        if (sql) {

            const patterns = [

                /(?:DESCRIBE|DESC)\s+(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?/i,

                /\bFROM\s+(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?/i,

                /\bJOIN\s+(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?/i,

                /\bUPDATE\s+(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?/i,

                /\bINTO\s+(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?/i,

                /\bTABLE\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?/i

            ];


            const tables =
                getTablesFromDatabase(
                    activeSQLiteDatabase
                );


            for (const pattern of patterns) {

                const match =
                    sql.match(pattern);


                if (!match) {

                    continue;

                }


                const candidate =
                    match[1];


                const actualTable =
                    tables.find(
                        function (name) {

                            return (
                                name.toLowerCase() ===
                                candidate.toLowerCase()
                            );

                        }
                    );


                if (actualTable) {

                    selectedTableName =
                        actualTable;

                    selectedTableDatabaseName =
                        activeDatabaseName;

                    return actualTable;

                }

            }

        }

    }


    /*
     * If the editor does not identify a table, use the explorer
     * selection as the second source of intent.
     */
    if (
        selectedTableName &&
        selectedTableDatabaseName === activeDatabaseName
    ) {

        return selectedTableName;

    }


    /*
     * Convenience behaviour:
     * if this database contains exactly one user table, that table
     * is unambiguous and can be inspected without another click.
     */
    if (activeSQLiteDatabase) {

        const tables =
            getTablesFromDatabase(
                activeSQLiteDatabase
            );


        if (tables.length === 1) {

            selectedTableName =
                tables[0];

            selectedTableDatabaseName =
                activeDatabaseName;

            return tables[0];

        }

    }


    return null;
}

/* ============================================================
 * DESCRIBE BUTTON
 * ============================================================ */

function describeSelectedTable() {

    const tableName =
        resolveInspectionTable();


    if (!tableName) {

        showStatus(
            "❌ Select a table or place a table query in the editor first.",
            "error"
        );

        return;

    }


    if (
        !activeSQLiteDatabase ||
        activeDatabaseName !== selectedTableDatabaseName
    ) {

        showStatus(
            "❌ Select the database containing this table first.",
            "error"
        );

        return;

    }


    try {

        const result =
            executeDescribeTable(
                tableName
            );


        displaySandboxResults(
            result
        );


        showStatus(
            "✅ Table '" +
            selectedTableName +
            "' described successfully.",
            "success"
        );

    }

    catch (error) {

        showStatus(
            "❌ " +
            error.message,
            "error"
        );

    }

}


/* ============================================================
 * SCHEMA BUTTON
 * ============================================================ */

function showSelectedTableSchema() {

    /*
     * The schema button operates on the table selected in the
     * Database Explorer, not merely on a table-name string.
     */
    const tableName =
        resolveInspectionTable();


    if (!tableName) {

        showStatus(
            "❌ Select a table or place a table query in the editor first.",
            "error"
        );

        return;

    }


    if (
        !activeSQLiteDatabase ||
        activeDatabaseName !== selectedTableDatabaseName
    ) {

        showStatus(
            "❌ Select the database containing this table first.",
            "error"
        );

        return;

    }


    try {

        const result =
            executeSingleStatement(
                `
                PRAGMA table_info(
                    ${quoteSQLiteIdentifier(
                        tableName
                    )}
                )
                `
            );


        displaySandboxResults(
            result
        );

        showStatus(
            "✅ Schema loaded for '" +
            selectedTableName +
            "'.",
            "success"
        );

    }

    catch (error) {

        showStatus(
            "❌ " +
            error.message,
            "error"
        );

    }

}


/* ============================================================
 * RELATIONSHIPS BUTTON
 * ============================================================ */

function showSelectedTableRelationships() {

    if (!activeSQLiteDatabase) {

        showStatus(
            "❌ Select a database first.",
            "error"
        );

        return;

    }


    const inspectionTable =
        resolveInspectionTable();


    /*
     * Relationships are read directly from SQLite PRAGMA data.
     * We intentionally avoid pragma_foreign_key_list(...) as a
     * table-valued function because some sql.js/SQLite builds do
     * not expose that form consistently.
     *
     * If a table is selected, show relationships for that table.
     * Otherwise show relationships for all user tables.
     */
    try {

        const tables =
            inspectionTable
                ? [inspectionTable]
                : getTablesFromDatabase(
                    activeSQLiteDatabase
                );


        const rows =
            [];


        tables.forEach(
            function (tableName) {

                const result =
                    activeSQLiteDatabase.exec(
                        `PRAGMA foreign_key_list(${quoteSQLiteIdentifier(tableName)})`
                    );


                if (!result.length) {

                    return;

                }


                const pragmaRows =
                    convertSQLiteRows(
                        result[0]
                    );


                pragmaRows.forEach(
                    function (relationship) {

                        rows.push({

                            table_name:
                                tableName,

                            column_name:
                                relationship.from ||
                                "",

                            referenced_table:
                                relationship.table ||
                                "",

                            referenced_column:
                                relationship.to ||
                                ""

                        });

                    }
                );

            }
        );


        if (rows.length === 0) {

            displaySandboxResults({

                columns:
                    [
                        "Message"
                    ],

                rows:
                    [
                        {
                            Message:
                                inspectionTable
                                    ? "No foreign-key relationships found for '" +
                                      inspectionTable +
                                      "'."
                                    : "No foreign-key relationships found in this database."
                        }
                    ],

                executionTime:
                    0

            });

            showStatus(
                "ℹ️ Relationship inspection completed.",
                "info"
            );

            return;

        }


        displaySandboxResults({

            columns:
                [
                    "table_name",
                    "column_name",
                    "referenced_table",
                    "referenced_column"
                ],

            rows:
                rows,

            executionTime:
                0

        });


        showStatus(
            "✅ Relationships loaded successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Relationship inspection failed:",
            error
        );

        showStatus(
            "❌ Unable to inspect relationships: " +
            error.message,
            "error"
        );

    }

}


/* ============================================================
 * QUERY TABS
 * ============================================================ */

function createNewQueryTab() {

    queryCounter++;


    const id =
        queryCounter;


    queryContents.set(
        id,
        ""
    );


    activeQueryId =
        id;


    const tab =
        document.createElement(
            "button"
        );


    tab.className =
        "query-tab";


    tab.dataset.queryId =
        id;


    tab.type =
        "button";


    tab.innerHTML = `

        <span class="query-tab-name">
            Query ${id}
        </span>

        <span
            class="query-tab-close"
            title="Close Query"
        >
            ×
        </span>

    `;


    tab.addEventListener(
        "click",
        function (event) {

            if (
                event.target.classList.contains(
                    "query-tab-close"
                )
            ) {

                event.stopPropagation();

                closeQueryTab(
                    id
                );

                return;

            }


            switchQueryTab(
                id
            );

        }
    );


    /*
     * Insert before the + button.
     */
    queryTabs.insertBefore(
        tab,
        newQueryButton
    );


    document
        .querySelectorAll(
            ".query-tab"
        )
        .forEach(
            function (item) {

                item.classList.remove(
                    "active"
                );

            }
        );


    tab.classList.add(
        "active"
    );


    sqlEditor.value =
        "";


    hideResultsPanel();


    sqlEditor.focus();

}


/* ============================================================
 * SWITCH QUERY TAB
 * ============================================================ */

function switchQueryTab(
    id
) {

    /*
     * Save current query.
     */
    queryContents.set(
        activeQueryId,
        sqlEditor.value
    );


    activeQueryId =
        id;


    sqlEditor.value =
        queryContents.get(id) || "";


    document
        .querySelectorAll(
            ".query-tab"
        )
        .forEach(
            function (tab) {

                tab.classList.toggle(
                    "active",
                    Number(
                        tab.dataset.queryId
                    ) === id
                );

            }
        );


    hideResultsPanel();


    sqlEditor.focus();

}


/* ============================================================
 * CLOSE QUERY TAB
 * ============================================================ */

function closeQueryTab(
    id
) {

    /*
     * Query 1 is the permanent first worksheet.
     */
    if (id === 1) {

        showStatus(
            "ℹ️ Query 1 cannot be closed.",
            "info"
        );

        return;

    }


    const tab =
        document.querySelector(
            `.query-tab[data-query-id="${id}"]`
        );


    if (tab) {

        tab.remove();

    }


    queryContents.delete(
        id
    );


    /*
     * If closing the active query, move to Query 1
     * or another available query.
     */
    if (
        activeQueryId === id
    ) {

        const remaining =
            Array.from(
                document.querySelectorAll(
                    ".query-tab"
                )
            );


        if (
            remaining.length > 0
        ) {

            const nextId =
                Number(
                    remaining[
                        remaining.length - 1
                    ].dataset.queryId
                );


            switchQueryTab(
                nextId
            );

        }

        else {

            activeQueryId =
                1;

            sqlEditor.value =
                queryContents.get(1) || "";

        }

    }

}


/* ============================================================
 * RESULTS
 * ============================================================ */

function displaySandboxResults(
    data
) {

    if (!data) {

        return;

    }


    latestResults =
        data;


    const columns =
        Array.isArray(data.columns)
            ? data.columns
            : [];


    const rows =
        Array.isArray(data.rows)
            ? data.rows
            : [];


    showResultsPanel();


    if (resultsSummary) {

        resultsSummary.textContent =
            rows.length +
            (
                rows.length === 1
                    ? " row"
                    : " rows"
            ) +
            " • " +
            (
                data.executionTime ||
                0
            ) +
            " ms";

    }


    if (!resultsContainer) {

        return;

    }


    if (
        rows.length === 0
    ) {

        resultsContainer.innerHTML = `

            <div class="empty-results">

                <div class="empty-results-icon">
                    ◫
                </div>

                <p>
                    Query executed successfully.
                    No rows returned.
                </p>

            </div>

        `;

    }

    else {

        let html = `

            <table class="results-table">

                <thead>

                    <tr>

        `;


        columns.forEach(
            function (column) {

                html +=
                    "<th>" +
                    escapeHTML(
                        column
                    ) +
                    "</th>";

            }
        );


        html += `

                    </tr>

                </thead>

                <tbody>

        `;


        rows.forEach(
            function (row) {

                html +=
                    "<tr>";


                columns.forEach(
                    function (column) {

                        let value =
                            row[column];


                        if (
                            value === null ||
                            value === undefined
                        ) {

                            value =
                                "NULL";

                        }


                        html +=
                            "<td>" +
                            escapeHTML(
                                value
                            ) +
                            "</td>";

                    }
                );


                html +=
                    "</tr>";

            }
        );


        html += `

                </tbody>

            </table>

        `;


        resultsContainer.innerHTML =
            html;

    }


    if (downloadResultsButton) {

        downloadResultsButton.disabled =
            rows.length === 0;

    }

}


/* ============================================================
 * ACTION RESULT
 * ============================================================ */

function displayActionResult(
    count
) {

    displaySandboxResults({

        columns:
            [
                "Message"
            ],

        rows:
            [
                {
                    Message:
                        count +
                        (
                            count === 1
                                ? " statement executed successfully."
                                : " statements executed successfully."
                        )
                }
            ],

        executionTime:
            0

    });

}


/* ============================================================
 * RESULTS PANEL
 * ============================================================ */

function showResultsPanel() {

    if (!resultsSection) {

        return;

    }


    resultsSection.classList.add(
        "results-visible"
    );


    resultsSection.classList.remove(
        "results-hidden"
    );

}


/* ============================================================
 * HIDE RESULTS PANEL
 * ============================================================ */

function hideResultsPanel() {

    if (!resultsSection) {

        return;

    }


    resultsSection.classList.remove(
        "results-visible"
    );


    resultsSection.classList.add(
        "results-hidden"
    );


    latestResults =
        null;


    if (downloadResultsButton) {

        downloadResultsButton.disabled =
            true;

    }

}


/* ============================================================
 * STATEMENT SUCCESS MESSAGE
 * ============================================================ */

function getStatementSuccessMessage(
    statement
) {

    const upper =
        statement
            .trim()
            .toUpperCase();


    if (
        upper.startsWith(
            "CREATE TABLE"
        )
    ) {

        return "Table created successfully.";

    }


    if (
        upper.startsWith(
            "DROP TABLE"
        )
    ) {

        return "Table dropped successfully.";

    }


    if (
        upper.startsWith(
            "ALTER TABLE"
        )
    ) {

        return "Table altered successfully.";

    }


    if (
        upper.startsWith(
            "INSERT"
        )
    ) {

        return "Data inserted successfully.";

    }


    if (
        upper.startsWith(
            "UPDATE"
        )
    ) {

        return "Data updated successfully.";

    }


    if (
        upper.startsWith(
            "DELETE"
        )
    ) {

        return "Data deleted successfully.";

    }


    return "Statement executed successfully.";

}


/* ============================================================
 * CSV DOWNLOAD
 * ============================================================ */

function downloadCSV(
    data
) {

    if (
        !data ||
        !Array.isArray(data.columns) ||
        !Array.isArray(data.rows)
    ) {

        return;

    }


    const lines =
        [];


    lines.push(
        data.columns
            .map(csvEscape)
            .join(",")
    );


    data.rows.forEach(
        function (row) {

            const values =
                data.columns.map(
                    function (column) {

                        return csvEscape(
                            row[column]
                        );

                    }
                );


            lines.push(
                values.join(",")
            );

        }
    );


    const blob =
        new Blob(
            [
                lines.join("\n")
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "sql-query-results.csv";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}


/* ============================================================
 * CSV ESCAPE
 * ============================================================ */

function csvEscape(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return '"' +
        String(value)
            .replace(
                /"/g,
                '""'
            ) +
        '"';

}


/* ============================================================
 * MODAL
 * ============================================================ */

function openDatabaseModal() {

    if (!databaseModal) {

        return;

    }


    databaseModal.classList.remove(
        "hidden"
    );


    databaseNameInput.value =
        "";


    removeModalError();


    databaseNameInput.focus();

}


function closeDatabaseModalWindow() {

    if (!databaseModal) {

        return;

    }


    databaseModal.classList.add(
        "hidden"
    );


    removeModalError();

}


/* ============================================================
 * MODAL ERROR
 * ============================================================ */

function showModalError(
    message
) {

    removeModalError();


    const error =
        document.createElement(
            "div"
        );


    error.className =
        "modal-error";


    error.style.color =
        "#f87171";


    error.style.fontSize =
        "12px";


    error.style.marginTop =
        "8px";


    error.textContent =
        message;


    databaseNameInput
        .parentElement
        .appendChild(
            error
        );

}


function removeModalError() {

    const existing =
        document.querySelector(
            ".modal-error"
        );


    if (existing) {

        existing.remove();

    }

}


/* ============================================================
 * UI ACTION STATUS HELPERS
 * ============================================================ */

function ensureSandboxStatusElement() {

    if (sandboxStatus && document.body.contains(sandboxStatus)) {
        return sandboxStatus;
    }

    sandboxStatus = document.getElementById("sandbox-status");

    if (sandboxStatus) {
        return sandboxStatus;
    }

    /*
     * The Sandbox CSS already contains the .sandbox-status styling,
     * but some HTML revisions do not include the element itself.
     * Create that existing status area dynamically instead of
     * changing the page layout or adding another UI component.
     */
    const editorPanel = document.querySelector(".sandbox-editor-panel");
    if (!editorPanel) {
        return null;
    }

    sandboxStatus = document.createElement("div");
    sandboxStatus.id = "sandbox-status";
    sandboxStatus.className = "sandbox-status";
    sandboxStatus.hidden = true;
    sandboxStatus.setAttribute("aria-live", "polite");
    sandboxStatus.setAttribute("role", "status");

    /* Keep the status message between the editor and Query Results. */
    editorPanel.insertAdjacentElement("afterend", sandboxStatus);

    return sandboxStatus;
}


function showDatabaseActionStatus(message, type) {
    /*
     * All Database Explorer mutations use the same status path.
     * This makes INSERT / UPDATE / DELETE / CREATE / DROP actions
     * immediately visible to the user without changing the existing
     * Database Explorer or worksheet logic.
     */
    showStatus(message, type || "success");
}


/* ============================================================
 * STATUS
 * ============================================================ */

function showStatus(
    message,
    type
) {

    const statusElement = ensureSandboxStatusElement();

    if (!statusElement) {
        return;
    }

    /* Keep the existing status area visible after Explorer actions. */
    statusElement.hidden = false;
    statusElement.style.display = "block";
    statusElement.style.visibility = "visible";
    statusElement.setAttribute("aria-live", "polite");
    statusElement.setAttribute("role", "status");

    statusElement.textContent =
        message;

    statusElement.className =
        "sandbox-status " +
        (
            type || ""
        );

}


/* ============================================================
 * QUOTE SQLITE IDENTIFIER
 * ============================================================ */

function quoteSQLiteIdentifier(
    identifier
) {

    return '"' +
        String(identifier)
            .replace(
                /"/g,
                '""'
            ) +
        '"';

}


/* ============================================================
 * SQLITE ERROR
 * ============================================================ */

function getSQLiteErrorMessage(
    error
) {

    const message =
        error && error.message
            ? error.message
            : String(error);


    /*
     * Translate SQLite's generic missing-table error into a
     * Sandbox-specific message that tells the user exactly which
     * database was searched.
     */
    const tableMatch =
        message.match(
            /no such table:\s*([A-Za-z0-9_]+)/i
        );


    if (tableMatch) {

        return (
            "Table '" +
            tableMatch[1] +
            "' is not present in database '" +
            (activeDatabaseName || "current database") +
            "'."
        );

    }


    return message;

}


/* ============================================================
 * HTML ESCAPE
 * ============================================================ */

function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ============================================================
 * DEBUG HELPER
 * ============================================================ */

window.getSandboxState =
    function () {

        return {

            sqlEngineLoaded:
                Boolean(
                    SQL_ENGINE
                ),

            activeDatabase:
                activeDatabaseName,

            savedActiveDatabase:
                localStorage.getItem(
                    ACTIVE_DATABASE_STORAGE_KEY
                ),

            databaseCount:
                sandboxDatabases.size,

            databases:
                Array.from(
                    sandboxDatabases.keys()
                ),

            activeQuery:
                activeQueryId,

            selectedTable:
                selectedTableName

        };

    };


/* ============================================================
 * STARTUP LOG
 * ============================================================ */

console.log(
    "✅ sandbox.js loaded."
);


/* ============================================================
 * ACTIVE DATABASE WORKSHEET HINT
 * ============================================================
 *
 * The SQL worksheet always shows the current database context.
 *
 * Example:
 *     Active database: TestDB | To change: USE database_name;
 *
 * This is intentionally kept in the textarea placeholder rather
 * than adding another permanent toolbar element, so it uses no
 * additional vertical workspace space.
 * ============================================================ */

function updateActiveDatabaseHint() {

    if (!sqlEditor) {

        return;

    }


    const databaseLabel =
        activeDatabaseName
            ? activeDatabaseName
            : "No database selected";


    sqlEditor.placeholder =
        "-- Active database: " +
        databaseLabel +
        " | To change: USE database_name;\n\n" +
        "-- Write your SQL query here\n\n" +
        "-- Example:\n" +
        "SELECT *\n" +
        "FROM your_table;";

}


/* ============================================================
 * TABLE EXISTENCE / INSPECTION HELPERS
 * ============================================================
 *
 * Describe and Schema behave like a database client:
 *
 * 1. If SQL names a table, inspect that table.
 * 2. If the selected explorer table belongs to the active DB,
 *    inspect that table.
 * 3. If the active DB contains one table, inspect it directly.
 * 4. If several tables exist and no table is identified, display
 *    the table list and let the user choose one.
 *
 * A table from another database is never silently reused.
 * ============================================================ */

function getActiveDatabaseTables() {

    if (!activeSQLiteDatabase) {

        return [];

    }


    return getTablesFromDatabase(
        activeSQLiteDatabase
    );

}


function findTableInActiveDatabase(tableName) {

    if (!tableName || !activeSQLiteDatabase) {

        return null;

    }


    const tables =
        getActiveDatabaseTables();


    return tables.find(
        function (name) {

            return (
                name.toLowerCase() ===
                String(tableName).toLowerCase()
            );

        }
    ) || null;

}


function extractInspectionTableFromEditor() {

    if (!sqlEditor) {

        return {
            table: null,
            mentioned: false
        };

    }


    const sql =
        sqlEditor.value.trim();


    if (!sql) {

        return {
            table: null,
            mentioned: false
        };

    }


    const patterns = [

        /(?:DESCRIBE|DESC)\s+(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?/i,

        /\bFROM\s+(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?/i,

        /\bJOIN\s+(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?/i,

        /\bUPDATE\s+(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?/i,

        /\bINTO\s+(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?/i,

        /\bTABLE\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?/i

    ];


    for (const pattern of patterns) {

        const match =
            sql.match(pattern);


        if (match) {

            return {
                table: match[1],
                mentioned: true
            };

        }

    }


    return {
        table: null,
        mentioned: false
    };

}


function showInspectionTableList(
    actionName
) {

    const tables =
        getActiveDatabaseTables();


    if (!activeDatabaseName) {

        showStatus(
            "❌ Please create or select a database first.",
            "error"
        );

        return true;

    }


    if (tables.length === 0) {

        showStatus(
            "ℹ️ Database '" +
            activeDatabaseName +
            "' has no tables.",
            "info"
        );

        displaySandboxResults({

            columns: [
                "Message"
            ],

            rows: [
                {
                    Message:
                        "Database '" +
                        activeDatabaseName +
                        "' has no tables."
                }
            ],

            executionTime: 0

        });

        return true;

    }


    /*
     * One table means there is no ambiguity.
     * Describe / Schema can open it immediately.
     */
    if (tables.length === 1) {

        return false;

    }


    /*
     * Multiple tables:
     *
     * Do NOT use the previous selectedTableName here.
     * The user explicitly asked for a table-selection popup
     * whenever the active database contains more than one table.
     *
     * This also prevents a stale table from TestDB being reused
     * after the user switches to MYTest.
     */
    openInspectionTablePopup(
        actionName,
        tables
    );


    return true;

}


/* ============================================================
 * INSPECTION TABLE POPUP
 * ============================================================
 *
 * Used by Describe / Schema when the active database contains
 * more than one table.
 *
 * Example:
 *
 *     TestDB
 *     ----------------
 *     Test       [Describe]
 *     Dummy      [Describe]
 *
 * Clicking a button executes the requested inspection and closes
 * the popup immediately.
 * ============================================================ */

function openInspectionTablePopup(
    actionName,
    tables
) {

    closeInspectionTablePopup();


    const overlay =
        document.createElement("div");


    overlay.id =
        "inspection-table-popup";


    overlay.style.position =
        "fixed";

    overlay.style.inset =
        "0";

    overlay.style.zIndex =
        "2000";

    overlay.style.display =
        "flex";

    overlay.style.alignItems =
        "center";

    overlay.style.justifyContent =
        "center";

    overlay.style.background =
        "rgba(2, 6, 23, .72)";

    overlay.style.padding =
        "20px";


    const modal =
        document.createElement("div");


    modal.style.width =
        "420px";

    modal.style.maxWidth =
        "100%";

    modal.style.maxHeight =
        "80vh";

    modal.style.overflow =
        "hidden";

    modal.style.background =
        "#111c31";

    modal.style.border =
        "1px solid #334155";

    modal.style.borderRadius =
        "10px";

    modal.style.boxShadow =
        "0 20px 50px rgba(0,0,0,.55)";


    const header =
        document.createElement("div");


    header.style.display =
        "flex";

    header.style.alignItems =
        "center";

    header.style.justifyContent =
        "space-between";

    header.style.padding =
        "15px 18px";

    header.style.borderBottom =
        "1px solid #263247";


    const title =
        document.createElement("div");


    title.innerHTML =
        "<strong style='color:#f1f5f9;font-size:15px;'>" +
        escapeHTML(actionName) +
        " Table</strong>" +
        "<div style='margin-top:3px;color:#94a3b8;font-size:11px;'>" +
        "Select a table from " +
        escapeHTML(activeDatabaseName) +
        "</div>";


    const closeButton =
        document.createElement("button");


    closeButton.type =
        "button";

    closeButton.textContent =
        "×";

    closeButton.title =
        "Close";

    closeButton.style.border =
        "0";

    closeButton.style.background =
        "transparent";

    closeButton.style.color =
        "#94a3b8";

    closeButton.style.fontSize =
        "22px";

    closeButton.style.cursor =
        "pointer";


    closeButton.addEventListener(
        "click",
        closeInspectionTablePopup
    );


    header.appendChild(title);
    header.appendChild(closeButton);


    const body =
        document.createElement("div");


    body.style.padding =
        "12px";

    body.style.maxHeight =
        "60vh";

    body.style.overflowY =
        "auto";


    tables.forEach(
        function (tableName, index) {

            const row =
                document.createElement("div");


            row.style.display =
                "flex";

            row.style.alignItems =
                "center";

            row.style.justifyContent =
                "space-between";

            row.style.gap =
                "12px";

            row.style.padding =
                "10px 11px";

            row.style.border =
                "1px solid #263247";

            row.style.borderRadius =
                "7px";

            row.style.background =
                "#0f172a";

            row.style.marginBottom =
                index === tables.length - 1
                    ? "0"
                    : "7px";


            const name =
                document.createElement("span");


            name.textContent =
                tableName;

            name.style.color =
                "#dbeafe";

            name.style.fontSize =
                "13px";

            name.style.fontWeight =
                "600";

            name.style.overflow =
                "hidden";

            name.style.textOverflow =
                "ellipsis";

            name.style.whiteSpace =
                "nowrap";


            const button =
                document.createElement("button");


            button.type =
                "button";

            button.textContent =
                actionName;

            button.style.height =
                "32px";

            button.style.padding =
                "0 11px";

            button.style.border =
                "1px solid #3b82f6";

            button.style.borderRadius =
                "6px";

            button.style.background =
                "#2563eb";

            button.style.color =
                "#ffffff";

            button.style.cursor =
                "pointer";

            button.style.fontSize =
                "12px";

            button.style.fontWeight =
                "600";


            button.addEventListener(
                "click",
                function () {

                    /*
                     * Close first so the results panel becomes the
                     * visible destination of the inspection output.
                     */
                    closeInspectionTablePopup();


                    /*
                     * Always re-check against the CURRENT database.
                     * This protects against stale table selections.
                     */
                    const actualTable =
                        findTableInActiveDatabase(
                            tableName
                        );


                    if (!actualTable) {

                        showStatus(
                            "❌ Table '" +
                            tableName +
                            "' is not present in database '" +
                            activeDatabaseName +
                            "'.",
                            "error"
                        );

                        return;

                    }


                    selectedTableName =
                        actualTable;

                    selectedTableDatabaseName =
                        activeDatabaseName;


                    if (
                        actionName ===
                        "Describe"
                    ) {

                        describeTableByName(
                            actualTable
                        );

                    }

                    else {

                        schemaTableByName(
                            actualTable
                        );

                    }

                }
            );


            row.appendChild(name);
            row.appendChild(button);
            body.appendChild(row);

        }
    );


    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);


    /*
     * Clicking the dark area outside the popup closes it.
     */
    overlay.addEventListener(
        "click",
        function (event) {

            if (event.target === overlay) {

                closeInspectionTablePopup();

            }

        }
    );


    document.body.appendChild(
        overlay
    );

}


function closeInspectionTablePopup() {

    const popup =
        document.getElementById(
            "inspection-table-popup"
        );


    if (popup) {

        popup.remove();

    }

}


function makeInspectionResultsClickable() {

    /*
     * Kept as a harmless compatibility function because older
     * Sandbox code may call it. Inspection selection now happens
     * through the dedicated popup instead of the Results table.
     */
    return;

}


function describeTableByName(
    tableName
) {

    const actualTable =
        findTableInActiveDatabase(
            tableName
        );


    if (!actualTable) {

        showStatus(
            "❌ Table '" +
            tableName +
            "' is not present in database '" +
            activeDatabaseName +
            "'.",
            "error"
        );

        return;

    }


    selectedTableName =
        actualTable;

    selectedTableDatabaseName =
        activeDatabaseName;


    try {

        displaySandboxResults(
            executeDescribeTable(
                actualTable
            )
        );


        showStatus(
            "✅ Table '" +
            actualTable +
            "' described successfully.",
            "success"
        );

    }

    catch (error) {

        showStatus(
            "❌ " +
            getSQLiteErrorMessage(error),
            "error"
        );

    }

}


function schemaTableByName(
    tableName
) {

    const actualTable =
        findTableInActiveDatabase(
            tableName
        );


    if (!actualTable) {

        showStatus(
            "❌ Table '" +
            tableName +
            "' is not present in database '" +
            activeDatabaseName +
            "'.",
            "error"
        );

        return;

    }


    selectedTableName =
        actualTable;

    selectedTableDatabaseName =
        activeDatabaseName;


    try {

        displaySandboxResults(
            executeSingleStatement(
                `PRAGMA table_info(${quoteSQLiteIdentifier(actualTable)})`
            )
        );


        showStatus(
            "✅ Schema loaded for '" +
            actualTable +
            "'.",
            "success"
        );

    }

    catch (error) {

        showStatus(
            "❌ " +
            getSQLiteErrorMessage(error),
            "error"
        );

    }

}


/* ============================================================
 * DESCRIBE / SCHEMA BUTTON BEHAVIOUR
 * ============================================================
 *
 * IMPORTANT DESIGN RULE
 * ---------------------
 *
 * These buttons operate on the CURRENTLY ACTIVE DATABASE.
 *
 * We intentionally do NOT use the old SQL editor text here.
 *
 * Why?
 * -----
 * Suppose TestDB contains:
 *
 *     Test
 *     Dummy
 *
 * The editor may still contain:
 *
 *     SELECT * FROM Test;
 *
 * If the user switches to MYTest, that old query must NOT force
 * Describe / Schema to inspect Test again.
 *
 * Behaviour:
 * ----------
 * 0 tables  -> show no-tables message
 * 1 table   -> inspect that table automatically
 * >1 tables -> show the table-selection popup
 *
 * The popup always uses tables from activeDatabaseName.
 * Therefore switching databases cannot reuse a stale table.
 * ============================================================ */

function describeSelectedTable() {

    if (!activeSQLiteDatabase || !activeDatabaseName) {

        showStatus(
            "❌ Please create or select a database first.",
            "error"
        );

        return;

    }


    /*
     * ALWAYS obtain the table list from the current database.
     * Never use selectedTableName here.
     */
    const tables =
        getActiveDatabaseTables();


    if (tables.length === 0) {

        showStatus(
            "ℹ️ Database '" +
            activeDatabaseName +
            "' has no tables.",
            "info"
        );

        displaySandboxResults({

            columns: [
                "Message"
            ],

            rows: [
                {
                    Message:
                        "Database '" +
                        activeDatabaseName +
                        "' has no tables."
                }
            ],

            executionTime: 0

        });

        return;

    }


    /*
     * One table is unambiguous.
     */
    if (tables.length === 1) {

        describeTableByName(
            tables[0]
        );

        return;

    }


    /*
     * More than one table:
     * ALWAYS show the popup.
     *
     * This is the important fix for TestDB -> Test + Dummy.
     */
    showInspectionTableList(
        "Describe"
    );

}


/* ============================================================
 * SCHEMA BUTTON
 * ============================================================ */

function showSelectedTableSchema() {

    if (!activeSQLiteDatabase || !activeDatabaseName) {

        showStatus(
            "❌ Please create or select a database first.",
            "error"
        );

        return;

    }


    /*
     * ALWAYS obtain tables from the CURRENT active database.
     */
    const tables =
        getActiveDatabaseTables();


    if (tables.length === 0) {

        showStatus(
            "ℹ️ Database '" +
            activeDatabaseName +
            "' has no tables.",
            "info"
        );

        displaySandboxResults({

            columns: [
                "Message"
            ],

            rows: [
                {
                    Message:
                        "Database '" +
                        activeDatabaseName +
                        "' has no tables."
                }
            ],

            executionTime: 0

        });

        return;

    }


    /*
     * One table is unambiguous.
     */
    if (tables.length === 1) {

        schemaTableByName(
            tables[0]
        );

        return;

    }


    /*
     * More than one table:
     * ALWAYS show the popup.
     */
    showInspectionTableList(
        "Schema"
    );

}


/* ============================================================
 * FINAL WORKSHEET HINT INITIALIZATION
 * ============================================================ */

updateActiveDatabaseHint();


/* ============================================================
 * UI TABLE / DATABASE MANAGEMENT
 * ============================================================
 *
 * PURPOSE
 * -------
 * Adds the missing Snowflake-like object-management actions:
 *
 * 1. Create table from the Database Explorer.
 * 2. Drop table from the Database Explorer.
 * 3. Drop database from the Database Explorer.
 * 4. View table data from the Database Explorer.
 * 5. Insert a row through a UI form.
 * 6. Edit existing rows and commit changes.
 * 7. Drag the Query Results panel vertically.
 * 8. Make Results minimize / maximize / close controls functional.
 *
 * SQL remains fully supported. These are convenience controls on
 * top of the same SQLite database already used by the Sandbox.
 * ============================================================ */

function initializeResultsPanelControls() {

    if (minimizeResultsButton) {
        minimizeResultsButton.addEventListener("click", function () {
            if (!resultsSection) return;
            resultsSection.classList.remove("results-maximized");
            resultsSection.classList.toggle("results-minimized");
        });
    }

    if (maximizeResultsButton) {
        maximizeResultsButton.addEventListener("click", function () {
            if (!resultsSection) return;
            resultsSection.classList.remove("results-minimized");
            resultsSection.classList.toggle("results-maximized");
        });
    }

    if (closeResultsButton) {
        closeResultsButton.addEventListener("click", function () {
            if (!resultsSection) return;
            resultsSection.classList.remove("results-maximized", "results-minimized");
            hideResultsPanel();
        });
    }

    if (resultsResizeHandle && resultsSection) {
        let dragging = false;

        const startDrag = function (event) {
            if (resultsSection.classList.contains("results-maximized")) return;
            dragging = true;
            resultsSection.classList.remove("results-minimized");
            document.body.classList.add("sandbox-resizing-results");
            event.preventDefault();
        };

        const moveDrag = function (event) {
            if (!dragging) return;

            const workspace = document.querySelector(".sandbox-workspace");
            if (!workspace) return;

            const rect = workspace.getBoundingClientRect();
            const desiredHeight = rect.bottom - event.clientY;
            const minHeight = 100;
            const maxHeight = Math.max(minHeight, rect.height - 180);
            const height = Math.min(maxHeight, Math.max(minHeight, desiredHeight));

            resultsSection.style.height = height + "px";
            resultsSection.style.flexBasis = height + "px";
        };

        const stopDrag = function () {
            if (!dragging) return;
            dragging = false;
            document.body.classList.remove("sandbox-resizing-results");
        };

        resultsResizeHandle.addEventListener("mousedown", startDrag);
        document.addEventListener("mousemove", moveDrag);
        document.addEventListener("mouseup", stopDrag);

        resultsResizeHandle.addEventListener("touchstart", function (event) {
            if (resultsSection.classList.contains("results-maximized")) return;
            dragging = true;
            resultsSection.classList.remove("results-minimized");
            document.body.classList.add("sandbox-resizing-results");
            event.preventDefault();
        }, { passive: false });

        document.addEventListener("touchmove", function (event) {
            if (!dragging || !event.touches.length) return;
            const workspace = document.querySelector(".sandbox-workspace");
            if (!workspace) return;
            const rect = workspace.getBoundingClientRect();
            const desiredHeight = rect.bottom - event.touches[0].clientY;
            const minHeight = 100;
            const maxHeight = Math.max(minHeight, rect.height - 180);
            const height = Math.min(maxHeight, Math.max(minHeight, desiredHeight));
            resultsSection.style.height = height + "px";
            resultsSection.style.flexBasis = height + "px";
            event.preventDefault();
        }, { passive: false });

        document.addEventListener("touchend", stopDrag);
    }
}


function createTemporaryModal(title, subtitle) {
    const existing = document.getElementById("sandbox-ui-modal");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "sandbox-ui-modal";
    overlay.className = "sandbox-ui-modal-overlay";

    const modal = document.createElement("div");
    modal.className = "sandbox-ui-modal";

    modal.innerHTML = `
        <div class="sandbox-ui-modal-header">
            <div>
                <h2>${escapeHTML(title)}</h2>
                <span>${escapeHTML(subtitle || "")}</span>
            </div>
            <button type="button" class="sandbox-ui-modal-close">×</button>
        </div>
        <div class="sandbox-ui-modal-body"></div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = function () { overlay.remove(); };
    modal.querySelector(".sandbox-ui-modal-close").addEventListener("click", close);
    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) close();
    });

    return {
        overlay,
        modal,
        body: modal.querySelector(".sandbox-ui-modal-body"),
        close
    };
}


function openCreateTableModal(databaseName) {
    if (!sandboxDatabases.has(databaseName)) {
        showStatus("❌ Database could not be found.", "error");
        return;
    }

    openDatabase(databaseName);

    const ui = createTemporaryModal(
        "Create Table",
        "Database: " + databaseName
    );

    ui.body.innerHTML = `
        <label>Table name</label>
        <input id="ui-table-name" class="sandbox-ui-input" type="text" placeholder="e.g. users" />

        <label>Columns</label>
        <textarea id="ui-column-definition" class="sandbox-ui-textarea" rows="7" placeholder="id INTEGER PRIMARY KEY\nname TEXT NOT NULL\nage INTEGER\nemail TEXT"></textarea>

        <div class="sandbox-ui-help">
            One column per line. Example: <b>id INTEGER PRIMARY KEY</b>
        </div>

        <div class="sandbox-ui-footer">
            <button type="button" class="sandbox-ui-secondary">Cancel</button>
            <button type="button" class="sandbox-ui-primary">Create Table</button>
        </div>
    `;

    ui.body.querySelector(".sandbox-ui-secondary").addEventListener("click", ui.close);
    ui.body.querySelector(".sandbox-ui-primary").addEventListener("click", function () {
        const tableName = document.getElementById("ui-table-name").value.trim();
        const definition = document.getElementById("ui-column-definition").value.trim();

        if (!tableName || !/^[A-Za-z0-9_]+$/.test(tableName)) {
            showStatus("❌ Enter a valid table name.", "error");
            return;
        }

        if (!definition) {
            showStatus("❌ Add at least one column definition.", "error");
            return;
        }

        if (getTableCount() >= MAX_TABLES_PER_DATABASE) {
            showStatus("❌ Maximum of " + MAX_TABLES_PER_DATABASE + " tables allowed in this database.", "error");
            return;
        }

        const columns = definition
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);

        try {
            ensureActiveDatabase();
            activeSQLiteDatabase.run(
                "CREATE TABLE " + quoteSQLiteIdentifier(tableName) + " (" + columns.join(", ") + ")"
            );
            persistActiveDatabase();
            renderDatabaseTree();
            ui.close();
            displayActionResult(1);
            showDatabaseActionStatus("✅ Table '" + tableName + "' created successfully.", "success");
        } catch (error) {
            showStatus("❌ " + getSQLiteErrorMessage(error), "error");
        }
    });
}


function confirmDropDatabase(databaseName) {
    if (!window.confirm("Drop database '" + databaseName + "'? This cannot be undone.")) return;

    try {
        dropDatabaseFromSQL(databaseName);
        displayActionResult(1);
        showDatabaseActionStatus("🗑️ Database '" + databaseName + "' dropped successfully.", "success");
    } catch (error) {
        showStatus("❌ " + getSQLiteErrorMessage(error), "error");
    }
}


function confirmDropTable(databaseName, tableName) {
    if (!window.confirm("Drop table '" + tableName + "' from '" + databaseName + "'?")) return;

    try {
        openDatabase(databaseName);
        activeSQLiteDatabase.run("DROP TABLE " + quoteSQLiteIdentifier(tableName));
        persistActiveDatabase();
        if (selectedTableName === tableName && selectedTableDatabaseName === databaseName) {
            selectedTableName = null;
            selectedTableDatabaseName = null;
        }
        renderDatabaseTree();
        displayActionResult(1);
        showDatabaseActionStatus("🗑️ Table '" + tableName + "' dropped successfully.", "success");
    } catch (error) {
        showStatus("❌ " + getSQLiteErrorMessage(error), "error");
    }
}


function openInsertRowModal(databaseName, tableName) {
    openDatabase(databaseName);

    const schema = getTableSchemaForUI(tableName);
    if (!schema.length) {
        showStatus("❌ Table '" + tableName + "' has no columns.", "error");
        return;
    }

    const ui = createTemporaryModal("Insert Row", databaseName + " • " + tableName);

    const fields = schema.map(column => `
        <label>${escapeHTML(column.name)} <span>${escapeHTML(column.type || "")}</span></label>
        <input class="sandbox-ui-input ui-insert-field" data-column="${escapeHTML(column.name)}" type="text" placeholder="NULL / value" />
    `).join("");

    ui.body.innerHTML = `
        <div class="sandbox-ui-form">${fields}</div>
        <div class="sandbox-ui-help">Leave a field blank to insert SQL NULL. Text values are quoted automatically.</div>
        <div class="sandbox-ui-footer">
            <button type="button" class="sandbox-ui-secondary">Cancel</button>
            <button type="button" class="sandbox-ui-primary">Insert & Commit</button>
        </div>
    `;

    ui.body.querySelector(".sandbox-ui-secondary").addEventListener("click", ui.close);
    ui.body.querySelector(".sandbox-ui-primary").addEventListener("click", function () {
        const values = {};
        ui.body.querySelectorAll(".ui-insert-field").forEach(input => {
            values[input.dataset.column] = input.value;
        });

        try {
            const columns = schema.map(c => c.name);
            const sql = "INSERT INTO " + quoteSQLiteIdentifier(tableName) + " (" +
                columns.map(quoteSQLiteIdentifier).join(", ") + ") VALUES (" +
                columns.map(column => sqlLiteral(values[column])).join(", ") + ")";

            activeSQLiteDatabase.run(sql);
            persistActiveDatabase();
            renderDatabaseTree();
            ui.close();
            displayTableData(databaseName, tableName);
            showDatabaseActionStatus("✅ Data inserted into table '" + tableName + "' successfully.", "success");
        } catch (error) {
            showStatus("❌ " + getSQLiteErrorMessage(error), "error");
        }
    });
}


function getTableSchemaForUI(tableName) {
    const result = activeSQLiteDatabase.exec(
        "PRAGMA table_info(" + quoteSQLiteIdentifier(tableName) + ")"
    );
    if (!result.length) return [];
    return convertSQLiteRows(result[0]).map(row => ({
        name: row.name,
        type: row.type,
        notnull: Number(row.notnull) === 1,
        primaryKey: Number(row.pk) > 0,
        defaultValue: row.dflt_value
    }));
}


function sqlLiteral(value) {
    if (value === null || value === undefined || String(value).trim() === "") return "NULL";
    const text = String(value).trim();
    if (/^(NULL|CURRENT_TIMESTAMP|CURRENT_DATE|CURRENT_TIME)$/i.test(text)) return text.toUpperCase();
    if (/^-?\d+(?:\.\d+)?$/.test(text)) return text;
    if (/^(TRUE|FALSE)$/i.test(text)) return text.toUpperCase() === "TRUE" ? "1" : "0";
    return "'" + text.replace(/'/g, "''") + "'";
}


function openTableDataEditor(databaseName, tableName) {
    openDatabase(databaseName);
    displayTableData(databaseName, tableName);
}


function displayTableData(databaseName, tableName) {
    const rowsResult = activeSQLiteDatabase.exec(
        "SELECT rowid AS __sandbox_rowid, * FROM " + quoteSQLiteIdentifier(tableName)
    );

    const columns = rowsResult.length ? rowsResult[0].columns : [];
    const rows = rowsResult.length ? convertSQLiteRows(rowsResult[0]) : [];
    const editableColumns = columns.filter(c => c !== "__sandbox_rowid");

    const ui = createTemporaryModal("Table Data", databaseName + " • " + tableName);

    let tableHTML = `
        <div class="sandbox-data-toolbar">
            <button type="button" class="sandbox-ui-primary" id="ui-add-row">＋ Add Row</button>
            <button type="button" class="sandbox-ui-secondary" id="ui-refresh-data">Refresh</button>
        </div>
        <div class="sandbox-data-grid-wrap">
            <table class="sandbox-data-grid">
                <thead><tr>
                    <th>rowid</th>
                    ${editableColumns.map(c => `<th>${escapeHTML(c)}</th>`).join("")}
                    <th>Delete</th>
                </tr></thead>
                <tbody>
    `;

    rows.forEach(row => {
        tableHTML += `<tr data-rowid="${escapeHTML(row.__sandbox_rowid)}">`;
        tableHTML += `<td>${escapeHTML(row.__sandbox_rowid)}</td>`;
        editableColumns.forEach(column => {
            const value = row[column];
            tableHTML += `<td><input class="sandbox-cell-input" data-column="${escapeHTML(column)}" value="${escapeHTML(value === null ? "" : value)}" /></td>`;
        });
        tableHTML += `<td><button type="button" class="sandbox-delete-row">×</button></td></tr>`;
    });

    tableHTML += `</tbody></table></div>
        <div class="sandbox-ui-footer">
            <button type="button" class="sandbox-ui-secondary" id="ui-close-data">Close</button>
            <button type="button" class="sandbox-ui-primary" id="ui-commit-data">Commit Changes</button>
        </div>`;

    ui.body.innerHTML = tableHTML;

    ui.body.querySelector("#ui-close-data").addEventListener("click", ui.close);
    ui.body.querySelector("#ui-refresh-data").addEventListener("click", function () {
        ui.close();
        displayTableData(databaseName, tableName);
    });
    ui.body.querySelector("#ui-add-row").addEventListener("click", function () {
        ui.close();
        openInsertRowModal(databaseName, tableName);
    });

    ui.body.querySelectorAll(".sandbox-delete-row").forEach(button => {
        button.addEventListener("click", function () {
            const row = button.closest("tr");
            const rowid = row.dataset.rowid;
            if (!window.confirm("Delete row " + rowid + "?")) return;
            row.classList.toggle("sandbox-row-marked-delete");
            if (row.classList.contains("sandbox-row-marked-delete")) {
                button.textContent = "↶";
                showStatus("🗑️ Row marked for deletion. Click Commit Changes to apply it.", "info");
            } else {
                button.textContent = "×";
                showStatus("↶ Row deletion cancelled.", "info");
            }
        });
    });

    ui.body.querySelector("#ui-commit-data").addEventListener("click", function () {
        try {
            let updatedRows = 0;
            let deletedRows = 0;

            ui.body.querySelectorAll("tbody tr").forEach(row => {
                const rowid = Number(row.dataset.rowid);

                if (row.classList.contains("sandbox-row-marked-delete")) {
                    activeSQLiteDatabase.run(
                        "DELETE FROM " + quoteSQLiteIdentifier(tableName) + " WHERE rowid = ?",
                        [rowid]
                    );
                    deletedRows++;
                    return;
                }

                const updates = [];
                const values = [];

                row.querySelectorAll(".sandbox-cell-input").forEach(input => {
                    updates.push(quoteSQLiteIdentifier(input.dataset.column) + " = ?");
                    values.push(input.value === "" ? null : input.value);
                });

                if (updates.length) {
                    activeSQLiteDatabase.run(
                        "UPDATE " + quoteSQLiteIdentifier(tableName) + " SET " + updates.join(", ") + " WHERE rowid = ?",
                        values.concat(rowid)
                    );
                    updatedRows++;
                }
            });

            persistActiveDatabase();
            renderDatabaseTree();
            ui.close();
            displayTableData(databaseName, tableName);

            let actionMessage;

            if (updatedRows > 0 && deletedRows > 0) {
                actionMessage =
                    "✅ Table '" + tableName + "' updated and " + deletedRows +
                    " row(s) deleted successfully. Changes committed.";
            } else if (deletedRows > 0) {
                actionMessage =
                    "🗑️ " + deletedRows + " row(s) deleted from table '" +
                    tableName + "' successfully. Changes committed.";
            } else if (updatedRows > 0) {
                actionMessage =
                    "✅ Table '" + tableName + "' updated successfully. Changes committed.";
            } else {
                actionMessage =
                    "ℹ️ No data changes were made to table '" + tableName + "'.";
            }

            showDatabaseActionStatus(actionMessage, "success");
        } catch (error) {
            showStatus("❌ " + getSQLiteErrorMessage(error), "error");
        }
    });
}

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


const sandboxStatus =
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


/* ============================================================
 * INITIALIZATION
 * ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeSandbox
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
 * EVENT INITIALIZATION
 * ============================================================ */

function initializeEventListeners() {


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
     * IMPORTANT:
     *
     * Do not require an active database here. CREATE DATABASE,
     * DROP DATABASE, USE and SHOW DATABASES are Sandbox-level
     * commands and must work without a selected SQLite database.
     * Real SQLite statements are validated later by
     * executeSingleStatement().
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
            /^USE(?:\s+DATABASE)?\s+["'`]?([A-Za-z0-9_]+)["'`]?\s*$/i
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
     *
     * Supported forms:
     *     SHOW DATABASES;
     *     SHOW DATABASES LIKE 'Test%';
     *     SHOW DATABASE TestDB;
     *
     * These are Sandbox-level commands and therefore do not
     * require an active database.
     */

    const showDatabasesLikeMatch =
        statement.match(
            /^SHOW\s+DATABASES\s+LIKE\s+["'](.+)["']$/i
        );


    if (showDatabasesLikeMatch) {

        const pattern =
            showDatabasesLikeMatch[1]
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                .replace(/%/g, ".*")
                .replace(/_/g, ".");


        const matcher =
            new RegExp(
                "^" + pattern + "$",
                "i"
            );


        return {

            columns:
                ["Database", "Active"],

            rows:
                Array.from(
                    sandboxDatabases.keys()
                )
                .filter(
                    name => matcher.test(name)
                )
                .map(
                    name => ({
                        Database:
                            name,
                        Active:
                            name === activeDatabaseName
                                ? "YES"
                                : "NO"
                    })
                ),

            executionTime:
                0

        };

    }


    if (
        /^SHOW\s+DATABASES$/i.test(
            statement
        )
    ) {

        return {

            columns:
                ["Database", "Active"],

            rows:
                Array.from(
                    sandboxDatabases.keys()
                ).map(
                    name => ({
                        Database:
                            name,
                        Active:
                            name === activeDatabaseName
                                ? "YES"
                                : "NO"
                    })
                ),

            executionTime:
                0

        };

    }


    const showDatabaseMatch =
        statement.match(
            /^SHOW\s+DATABASE\s+["'`]?([A-Za-z0-9_]+)["'`]?\s*$/i
        );


    if (showDatabaseMatch) {

        const databaseName =
            showDatabaseMatch[1];


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


        const inspectionDatabase =
            new SQL_ENGINE.Database(
                sandboxDatabases.get(
                    databaseName
                )
            );


        try {

            const tableResult =
                inspectionDatabase.exec(
                    `
                    SELECT name AS table_name
                    FROM sqlite_master
                    WHERE type = 'table'
                    AND name NOT LIKE 'sqlite_%'
                    ORDER BY name
                    `
                );


            const tables =
                tableResult.length
                    ? convertSQLiteRows(
                        tableResult[0]
                    )
                    : [];


            return {

                columns:
                    [
                        "Database",
                        "Active",
                        "Tables"
                    ],

                rows:
                    [
                        {
                            Database:
                                databaseName,
                            Active:
                                databaseName === activeDatabaseName
                                    ? "YES"
                                    : "NO",
                            Tables:
                                tables.length
                                    ? tables
                                        .map(
                                            row => row.table_name
                                        )
                                        .join(", ")
                                    : "No tables"
                        }
                    ],

                executionTime:
                    0

            };

        }

        finally {

            inspectionDatabase.close();

        }

    }


    /*
     * --------------------------------------------------------
     * NORMAL SQLITE QUERY
     * --------------------------------------------------------
     */

    /*
     * All remaining commands are actual SQLite commands.
     * They require a currently selected database.
     */
    ensureActiveDatabase();


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

    }


    sandboxDatabases.delete(
        databaseName
    );


    persistDatabases();


    renderDatabaseTree();

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


        renderDatabaseTree();


        closeDatabaseModalWindow();


        hideResultsPanel();


        showStatus(
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


        selectedTableName =
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

            `;


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

                        <span>
                            ▦
                        </span>

                        <span>
                            ${escapeHTML(tableName)}
                        </span>

                    `;


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
 * DESCRIBE BUTTON
 * ============================================================ */

function describeSelectedTable() {

    if (!selectedTableName) {

        showStatus(
            "❌ Select a table first.",
            "error"
        );

        return;

    }


    if (!activeSQLiteDatabase) {

        showStatus(
            "❌ Select a database first.",
            "error"
        );

        return;

    }


    try {

        const result =
            executeDescribeTable(
                selectedTableName
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

    if (!selectedTableName) {

        showStatus(
            "❌ Select a table first.",
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
                        selectedTableName
                    )}
                )
                `
            );


        displaySandboxResults(
            result
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


    try {

        const result =
            activeSQLiteDatabase.exec(
                `
                SELECT
                    m.name AS table_name,
                    p."from" AS column_name,
                    p."table" AS referenced_table,
                    p."to" AS referenced_column
                FROM sqlite_master m,
                     pragma_foreign_key_list(m.name) p
                WHERE m.type = 'table'
                `
            );


        if (
            !result.length
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
                                "No foreign-key relationships found."
                        }
                    ],

                executionTime:
                    0

            });

            return;

        }


        displaySandboxResults({

            columns:
                result[0].columns,

            rows:
                convertSQLiteRows(
                    result[0]
                ),

            executionTime:
                0

        });

    }

    catch (error) {

        /*
         * Older SQLite builds may not expose
         * pragma_foreign_key_list() as a table-valued
         * function.
         */
        showStatus(
            "❌ Unable to inspect relationships.",
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
 * STATUS
 * ============================================================ */

function showStatus(
    message,
    type
) {

    if (!sandboxStatus) {

        return;

    }


    sandboxStatus.textContent =
        message;


    sandboxStatus.className =
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

    if (
        error &&
        error.message
    ) {

        return error.message;

    }


    return String(
        error
    );

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

/*
 * ============================================================
 * SQL SANDBOX
 * ============================================================
 *
 * PURPOSE
 * -------
 * This file controls the complete SQL Sandbox experience.
 *
 *
 * CURRENT RESPONSIBILITIES
 * ------------------------
 *
 * 1. Initialize SQLite in the browser using sql.js.
 * 2. Create databases from the UI.
 * 3. Create databases using SQL.
 * 4. Delete databases from the UI.
 * 5. Display databases in Database Explorer.
 * 6. Display tables automatically.
 * 7. Create tables using SQL.
 * 8. Create tables from the UI.
 * 9. Insert data using SQL.
 * 10. Insert a row from the UI.
 * 11. Update/delete data using SQL.
 * 12. Drop tables using SQL.
 * 13. Delete tables from the UI.
 * 14. Execute multiple SQL statements in one worksheet.
 * 15. Display SELECT results.
 * 16. Display CREATE / INSERT / UPDATE / DELETE / DROP status.
 * 17. Manage multiple query tabs.
 * 18. Close Query 2, Query 3, etc.
 * 19. Download query results as CSV.
 * 20. Describe tables.
 * 21. View table schema.
 * 22. View table relationships.
 * 23. Persist databases in localStorage.
 * 24. Support mobile database sidebar.
 *
 *
 * IMPORTANT ARCHITECTURE
 * ----------------------
 *
 * SQLite runs completely inside the browser through sql.js.
 *
 * No Node.js server is required for this stage.
 *
 * No backend API is required for this stage.
 *
 *
 * MULTIPLE SQL STATEMENTS
 * -----------------------
 *
 * The worksheet supports:
 *
 * CREATE TABLE users (...);
 *
 * INSERT INTO users (...) VALUES (...);
 *
 * INSERT INTO users (...) VALUES (...);
 *
 * SELECT * FROM users;
 *
 *
 * Statements are executed sequentially.
 *
 * The final SELECT statement becomes the visible result.
 *
 *
 * DATABASE PERSISTENCE
 * --------------------
 *
 * sql.js databases cannot be directly stored in localStorage.
 *
 * Therefore every database is exported into Uint8Array,
 * converted to Base64 and stored in localStorage.
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
    document.getElementById(
        "sql-editor"
    );


const runQueryButton =
    document.getElementById(
        "run-query-button"
    );


const sandboxStatus =
    document.getElementById(
        "sandbox-status"
    );


const resultsSection =
    document.getElementById(
        "results-section"
    );


const resultsContainer =
    document.getElementById(
        "results-container"
    );


const resultsSummary =
    document.getElementById(
        "results-summary"
    );


const downloadResultsButton =
    document.getElementById(
        "download-results-button"
    );


/* ------------------------------------------------------------
 * DATABASE MODAL
 * ------------------------------------------------------------ */

const databaseModal =
    document.getElementById(
        "database-modal"
    );


const createDatabaseButton =
    document.getElementById(
        "create-database-button"
    );


const closeDatabaseModal =
    document.getElementById(
        "close-database-modal"
    );


const cancelDatabaseButton =
    document.getElementById(
        "cancel-database-button"
    );


const saveDatabaseButton =
    document.getElementById(
        "save-database-button"
    );


const databaseNameInput =
    document.getElementById(
        "database-name-input"
    );


/* ------------------------------------------------------------
 * DATABASE EXPLORER
 * ------------------------------------------------------------ */

const databaseSidebar =
    document.getElementById(
        "database-sidebar"
    );


const databaseTree =
    document.getElementById(
        "database-tree"
    );


const databaseSearchInput =
    document.getElementById(
        "database-search-input"
    );


const mobileSidebarButton =
    document.getElementById(
        "mobile-sidebar-button"
    );


const closeSidebarButton =
    document.getElementById(
        "close-sidebar-button"
    );


/* ------------------------------------------------------------
 * TABLE INSPECTION BUTTONS
 * ------------------------------------------------------------ */

const describeTableButton =
    document.getElementById(
        "describe-table-button"
    );


const viewSchemaButton =
    document.getElementById(
        "view-schema-button"
    );


const viewRelationshipsButton =
    document.getElementById(
        "view-relationships-button"
    );


/* ------------------------------------------------------------
 * QUERY TABS
 * ------------------------------------------------------------ */

const queryTabs =
    document.getElementById(
        "query-tabs"
    );


const newQueryButton =
    document.getElementById(
        "new-query-button"
    );


/* ============================================================
 * APPLICATION STATE
 * ============================================================ */


/*
 * sql.js engine.
 */
let SQL_ENGINE =
    null;


/*
 * Currently active SQLite database object.
 */
let activeSQLiteDatabase =
    null;


/*
 * Name of the currently selected database.
 */
let activeDatabaseName =
    null;


/*
 * All saved databases.
 *
 * Map structure:
 *
 * databaseName -> Uint8Array
 */
const sandboxDatabases =
    new Map();


/*
 * Latest SELECT/query result.
 */
let latestResults =
    null;


/*
 * Query tab counter.
 */
let queryCounter =
    1;


/*
 * Currently active query.
 */
let activeQueryId =
    1;


/*
 * SQL content of every query tab.
 *
 * Example:
 *
 * 1 -> SELECT * FROM users;
 * 2 -> SELECT * FROM doctors;
 */
const queryContents =
    new Map();


/*
 * Currently selected table.
 */
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
     * DATABASE CREATION
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
     * CSV DOWNLOAD
     * -------------------------------------------------------- */

    if (downloadResultsButton) {

        downloadResultsButton.addEventListener(
            "click",
            function () {

                if (!latestResults) {

                    return;

                }


                downloadCSV(
                    latestResults
                );

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

                if (databaseSidebar) {

                    databaseSidebar.classList.add(
                        "mobile-open"
                    );

                }

            }
        );

    }


    if (closeSidebarButton) {

        closeSidebarButton.addEventListener(
            "click",
            function () {

                if (databaseSidebar) {

                    databaseSidebar.classList.remove(
                        "mobile-open"
                    );

                }

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
     * SQL EDITOR
     * -------------------------------------------------------- */

    if (sqlEditor) {

        /*
         * Save SQL automatically.
         */
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
         * executes the worksheet.
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
     * DATABASE MODAL ENTER KEY
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

}


/* ============================================================
 * SQL EXECUTION
 * ============================================================
 *
 * This function supports multiple statements.
 *
 * Example:
 *
 * CREATE TABLE users (...);
 *
 * INSERT INTO users (...) VALUES (...);
 *
 * INSERT INTO users (...) VALUES (...);
 *
 * SELECT * FROM users;
 *
 * Every statement executes sequentially.
 *
 * The final SELECT result becomes the visible result.
 * ============================================================ */

function executeCurrentQuery() {

    if (!activeSQLiteDatabase) {

        showStatus(
            "⚠️ Please create or select a database first.",
            "error"
        );

        return;

    }


    const query =
        sqlEditor
            ? sqlEditor.value.trim()
            : "";


    if (!query) {

        showStatus(
            "❌ Please enter a SQL query.",
            "error"
        );

        return;

    }


    try {

        const statements =
            splitSQLStatements(
                query
            );


        if (
            statements.length === 0
        ) {

            showStatus(
                "❌ No SQL statement found.",
                "error"
            );

            return;

        }


        let finalResult =
            null;


        let totalChanges =
            0;


        const messages = [];


        /*
         * Execute statements one by one.
         */
        statements.forEach(
            function (statement) {

                const result =
                    executeSingleStatement(
                        statement
                    );


                if (
                    result.result
                ) {

                    finalResult =
                        result.result;

                }


                if (
                    result.changes
                ) {

                    totalChanges +=
                        result.changes;

                }


                if (
                    result.message
                ) {

                    messages.push(
                        result.message
                    );

                }

            }
        );


        /*
         * Save query contents.
         */
        queryContents.set(
            activeQueryId,
            query
        );


        /*
         * Save changed database.
         */
        persistActiveDatabase();


        /*
         * Refresh Database Explorer.
         *
         * This is important after:
         *
         * CREATE TABLE
         * DROP TABLE
         * ALTER TABLE
         */
        renderDatabaseTree();


        /*
         * If there was a SELECT result,
         * display it.
         */
        if (finalResult) {

            displaySandboxResults(
                finalResult
            );

        }

        else {

            /*
             * No SELECT statement.
             *
             * Still show a useful result panel.
             */
            displayActionResult(
                messages,
                totalChanges
            );

        }


        showStatus(
            "✅ Query executed successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "SQL execution error:",
            error
        );


        showStatus(
            "❌ SQL Error: " +
            error.message,
            "error"
        );


        displayActionResult(
            [
                "SQL execution failed.",
                error.message
            ],
            0,
            true
        );

    }

}


/* ============================================================
 * EXECUTE SINGLE STATEMENT
 * ============================================================ */

function executeSingleStatement(
    statement
) {

    const normalized =
        statement
            .trim();


    const keyword =
        normalized
            .split(/\s+/)[0]
            .toUpperCase();


    /*
     * SELECT / PRAGMA / WITH
     *
     * These can return result sets.
     */
    if (
        keyword === "SELECT" ||
        keyword === "PRAGMA" ||
        keyword === "WITH"
    ) {

        const result =
            activeSQLiteDatabase.exec(
                normalized
            );


        if (
            result &&
            result.length > 0
        ) {

            return {

                result:
                    result[0],

                changes:
                    0,

                message:
                    "SELECT executed successfully."

            };

        }


        return {

            result:
                null,

            changes:
                0,

            message:
                "Statement executed successfully."

        };

    }


    
    /*
     * CREATE / INSERT / UPDATE / DELETE / DROP / ALTER
     *
     * sql.js run() is used because these statements modify
     * the database.
     */
    activeSQLiteDatabase.run(
        normalized
    );


    let changes =
        0;


    try {

        const changeResult =
            activeSQLiteDatabase.exec(
                "SELECT changes() AS changes;"
            );


        if (
            changeResult &&
            changeResult[0] &&
            changeResult[0].values &&
            changeResult[0].values[0]
        ) {

            changes =
                Number(
                    changeResult[0].values[0][0]
                ) || 0;

        }

    }

    catch (error) {

        console.warn(
            "Could not read SQLite changes():",
            error
        );

    }


    let message;


    switch (keyword) {

        case "CREATE":

            if (
                /^CREATE\s+TABLE/i.test(
                    normalized
                )
            ) {

                message =
                    "Table created successfully.";

            }

            else {

                message =
                    "Object created successfully.";

            }

            break;


        case "INSERT":

            message =
                changes +
                " row" +
                (
                    changes === 1
                        ? ""
                        : "s"
                ) +
                " inserted.";

            break;


        case "UPDATE":

            message =
                changes +
                " row" +
                (
                    changes === 1
                        ? ""
                        : "s"
                ) +
                " updated.";

            break;


        case "DELETE":

            message =
                changes +
                " row" +
                (
                    changes === 1
                        ? ""
                        : "s"
                ) +
                " deleted.";

            break;


        case "DROP":

            if (
                /^DROP\s+TABLE/i.test(
                    normalized
                )
            ) {

                message =
                    "Table dropped successfully.";

            }

            else if (
                /^DROP\s+VIEW/i.test(
                    normalized
                )
            ) {

                message =
                    "View dropped successfully.";

            }

            else {

                message =
                    "Object dropped successfully.";

            }

            break;


        case "ALTER":

            message =
                "Table altered successfully.";

            break;


        case "CREATE":

            message =
                "Object created successfully.";

            break;


        default:

            message =
                "Statement executed successfully.";

    }


    return {

        result:
            null,

        changes:
            changes,

        message:
            message

    };

}


/* ============================================================
 * SQL STATEMENT SPLITTER
 * ============================================================
 *
 * JavaScript's simple:
 *
 *     query.split(";")
 *
 * is dangerous because semicolons may exist inside strings.
 *
 * This function splits statements while respecting:
 *
 * - single quotes
 * - double quotes
 * - backticks
 * - escaped quotes
 *
 * It is not intended to be a complete SQL parser.
 * It is sufficient for our browser Sandbox use case.
 * ============================================================ */

function splitSQLStatements(
    sql
) {

    const statements = [];


    let current =
        "";


    let quote =
        null;


    for (
        let i = 0;
        i < sql.length;
        i++
    ) {

        const char =
            sql[i];


        const next =
            sql[i + 1];


        /*
         * Handle escaped single quote:
         *
         * 'John''s'
         */
        if (
            quote === "'" &&
            char === "'" &&
            next === "'"
        ) {

            current +=
                char +
                next;

            i++;

            continue;

        }


        /*
         * Handle backslash escape.
         */
        if (
            quote &&
            char === "\\" &&
            next
        ) {

            current +=
                char +
                next;

            i++;

            continue;

        }


        /*
         * Enter / leave quoted string.
         */
        if (
            char === "'" ||
            char === '"' ||
            char === "`"
        ) {

            if (!quote) {

                quote =
                    char;

            }

            else if (
                quote === char
            ) {

                quote =
                    null;

            }


            current +=
                char;

            continue;

        }


        /*
         * Semicolon outside quotes
         * means statement boundary.
         */
        if (
            char === ";" &&
            !quote
        ) {

            if (
                current.trim()
            ) {

                statements.push(
                    current.trim()
                );

            }


            current =
                "";

            continue;

        }


        current +=
            char;

    }


    if (
        current.trim()
    ) {

        statements.push(
            current.trim()
        );

    }


    return statements;

}


/* ============================================================
 * CREATE DATABASE
 * ============================================================ */

function createNewDatabase() {

    if (!SQL_ENGINE) {

        showModalError(
            "SQL engine is still loading. Please wait."
        );

        return;

    }


    const name =
        databaseNameInput
            ? databaseNameInput.value.trim()
            : "";


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


        selectedTableName =
            null;


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
            "Database creation failed:",
            error
        );


        showModalError(
            "Failed to create database."
        );

    }

}


/* ============================================================
 * CREATE DATABASE FROM SQL
 * ============================================================
 *
 * SQLite does not support server-style:
 *
 *     CREATE DATABASE mydb;
 *
 * because SQLite databases are files.
 *
 * Our Sandbox therefore provides a small compatibility layer:
 *
 *     CREATE DATABASE mydb;
 *
 * is intercepted and converted into creation of another
 * Sandbox SQLite database.
 *
 * This allows the user to use the familiar SQL syntax.
 * ============================================================ */

function createDatabaseFromSQL(
    statement
) {

    const match =
        statement.match(
            /^CREATE\s+DATABASE\s+([A-Za-z0-9_]+)$/i
        );


    if (!match) {

        return false;

    }


    const databaseName =
        match[1];


    if (
        sandboxDatabases.has(
            databaseName
        )
    ) {

        throw new Error(
            "Database '" +
            databaseName +
            "' already exists."
        );

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


    selectedTableName =
        null;


    return true;

}


/* ============================================================
 * DROP DATABASE FROM SQL
 * ============================================================
 *
 * SQLite does not have DROP DATABASE.
 *
 * Therefore:
 *
 *     DROP DATABASE mydb;
 *
 * is handled by the Sandbox itself.
 * ============================================================ */

function dropDatabaseFromSQL(
    statement
) {

    const match =
        statement.match(
            /^DROP\s+DATABASE\s+([A-Za-z0-9_]+)$/i
        );


    if (!match) {

        return false;

    }


    const databaseName =
        match[1];


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


    sandboxDatabases.delete(
        databaseName
    );


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


        latestResults =
            null;

    }


    return true;

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
                    "Previous database close warning:",
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
            "Failed to open database:",
            error
        );


        showStatus(
            "❌ Failed to open database.",
            "error"
        );

    }

}

/* ============================================================
 * PERSIST ACTIVE DATABASE
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
 * PERSIST ALL DATABASES
 * ============================================================ */

function persistDatabases() {

    try {

        const storageObject =
            {};


        sandboxDatabases.forEach(
            function (
                databaseBytes,
                databaseName
            ) {

                storageObject[
                    databaseName
                ] =
                    uint8ArrayToBase64(
                        databaseBytes
                    );

            }
        );


        localStorage.setItem(
            SANDBOX_STORAGE_KEY,
            JSON.stringify(
                storageObject
            )
        );

    }

    catch (error) {

        console.error(
            "Failed to persist databases:",
            error
        );


        showStatus(
            "⚠️ Could not save Sandbox data to browser storage.",
            "error"
        );

    }

}


/* ============================================================
 * LOAD SAVED DATABASES
 * ============================================================ */

function loadSavedDatabases() {

    sandboxDatabases.clear();


    const saved =
        localStorage.getItem(
            SANDBOX_STORAGE_KEY
        );


    if (!saved) {

        return;

    }


    try {

        const storageObject =
            JSON.parse(
                saved
            );


        Object.keys(
            storageObject
        )
        .forEach(
            function (
                databaseName
            ) {

                sandboxDatabases.set(
                    databaseName,
                    base64ToUint8Array(
                        storageObject[
                            databaseName
                        ]
                    )
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Failed to load saved Sandbox databases:",
            error
        );


        localStorage.removeItem(
            SANDBOX_STORAGE_KEY
        );

    }

}


/* ============================================================
 * DATABASE EXPLORER
 * ============================================================
 *
 * The Explorer is rebuilt from the actual SQLite database.
 *
 * Therefore after:
 *
 * CREATE TABLE
 * DROP TABLE
 * ALTER TABLE
 *
 * the sidebar automatically reflects the real database state.
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

            <div
                id="empty-database-message"
                class="empty-database-message"
            >

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
            storedBytes,
            databaseName
        ) {

            let database;


            try {

                database =
                    new SQL_ENGINE.Database(
                        storedBytes
                    );

            }

            catch (error) {

                console.error(
                    "Could not inspect database:",
                    databaseName,
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


            databaseItem.dataset.database =
                databaseName;


            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "database-header";


            const arrow =
                document.createElement(
                    "span"
                );


            arrow.className =
                "database-arrow";


            const tableList =
                document.createElement(
                    "div"
                );


            tableList.className =
                "table-list";


            tableList.style.display =
                "none";


            /*
             * Expand active database automatically.
             */
            const isActive =
                databaseName ===
                activeDatabaseName;


            if (isActive) {

                tableList.style.display =
                    "block";

                arrow.textContent =
                    "▼";

            }

            else {

                arrow.textContent =
                    "▶";

            }


            const icon =
                document.createElement(
                    "span"
                );


            icon.className =
                "database-icon";


            icon.textContent =
                "🗄️";


            const name =
                document.createElement(
                    "span"
                );


            name.className =
                "database-name";


            name.textContent =
                databaseName;


            /*
             * UI actions for database.
             */
            const actions =
                document.createElement(
                    "span"
                );


            actions.className =
                "database-actions";


            const createTableButton =
                document.createElement(
                    "button"
                );


            createTableButton.type =
                "button";


            createTableButton.className =
                "tree-action-button";


            createTableButton.title =
                "Create Table";


            createTableButton.textContent =
                "+";


            createTableButton.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    openDatabase(
                        databaseName
                    );

                    createTableFromUI();

                }
            );


            const deleteDatabaseButton =
                document.createElement(
                    "button"
                );


            deleteDatabaseButton.type =
                "button";


            deleteDatabaseButton.className =
                "tree-action-button delete";


            deleteDatabaseButton.title =
                "Delete Database";


            deleteDatabaseButton.textContent =
                "×";


            deleteDatabaseButton.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    deleteDatabaseFromUI(
                        databaseName
                    );

                }
            );


            actions.appendChild(
                createTableButton
            );


            actions.appendChild(
                deleteDatabaseButton
            );


            header.appendChild(
                arrow
            );


            header.appendChild(
                icon
            );


            header.appendChild(
                name
            );


            header.appendChild(
                actions
            );


            /*
             * Get actual SQLite tables.
             */
            const tableResult =
                database.exec(
                    `
                    SELECT name
                    FROM sqlite_master
                    WHERE type = 'table'
                    AND name NOT LIKE 'sqlite_%'
                    ORDER BY name;
                    `
                );


            const tables =
                (
                    tableResult.length &&
                    tableResult[0].values
                )
                    ? tableResult[0].values
                    : [];


            /*
             * Create table entries.
             */
            tables.forEach(
                function (
                    row
                ) {

                    const tableName =
                        row[0];


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


                    const tableNameSpan =
                        document.createElement(
                            "span"
                        );


                    tableNameSpan.textContent =
                        "▦ " +
                        tableName;


                    const tableActions =
                        document.createElement(
                            "span"
                        );


                    tableActions.className =
                        "table-actions";


                    /*
                     * Insert row button.
                     */
                    const insertButton =
                        document.createElement(
                            "button"
                        );


                    insertButton.type =
                        "button";


                    insertButton.className =
                        "tree-action-button";


                    insertButton.title =
                        "Insert Row";


                    insertButton.textContent =
                        "+";


                    insertButton.addEventListener(
                        "click",
                        function (event) {

                            event.stopPropagation();

                            openDatabase(
                                databaseName
                            );


                            selectTable(
                                databaseName,
                                tableName
                            );


                            insertRowFromUI();

                        }
                    );


                    /*
                     * Delete table button.
                     */
                    const deleteButton =
                        document.createElement(
                            "button"
                        );


                    deleteButton.type =
                        "button";


                    deleteButton.className =
                        "tree-action-button delete";


                    deleteButton.title =
                        "Delete Table";


                    deleteButton.textContent =
                        "×";


                    deleteButton.addEventListener(
                        "click",
                        function (event) {

                            event.stopPropagation();

                            openDatabase(
                                databaseName
                            );


                            deleteTableFromUI(
                                tableName
                            );

                        }
                    );


                    tableActions.appendChild(
                        insertButton
                    );


                    tableActions.appendChild(
                        deleteButton
                    );


                    table.appendChild(
                        tableNameSpan
                    );


                    table.appendChild(
                        tableActions
                    );


                    table.addEventListener(
                        "click",
                        function () {

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


            /*
             * Database header click:
             *
             * - selects database
             * - expands/collapses tables
             */
            header.addEventListener(
                "click",
                function () {

                    openDatabase(
                        databaseName
                    );


                    const isHidden =
                        tableList.style.display ===
                        "none";


                    tableList.style.display =
                        isHidden
                            ? "block"
                            : "none";


                    arrow.textContent =
                        isHidden
                            ? "▼"
                            : "▶";

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


            database.close();

        }
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
     * Automatically prepare a SELECT query.
     *
     * We DO NOT execute it automatically.
     */
    if (sqlEditor) {

        sqlEditor.value =
            "SELECT *\nFROM " +
            tableName +
            ";";


        queryContents.set(
            activeQueryId,
            sqlEditor.value
        );


        sqlEditor.focus();

    }


    if (databaseSidebar) {

        databaseSidebar.classList.remove(
            "mobile-open"
        );

    }


    showStatus(
        "📋 Table '" +
        tableName +
        "' selected.",
        "info"
    );

}


/* ============================================================
 * CREATE TABLE FROM UI
 * ============================================================
 *
 * Simple browser prompt for now.
 *
 * Example:
 *
 * Table name:
 * users
 *
 * Columns:
 * id INTEGER PRIMARY KEY,
 * name TEXT,
 * email TEXT
 *
 * ============================================================ */

function createTableFromUI() {

    if (!activeSQLiteDatabase) {

        showStatus(
            "⚠️ Please select a database first.",
            "error"
        );

        return;

    }


    const tableCount =
        getUserTableCount();


    if (
        tableCount >=
        MAX_TABLES_PER_DATABASE
    ) {

        showStatus(
            "❌ Maximum of " +
            MAX_TABLES_PER_DATABASE +
            " tables allowed.",
            "error"
        );

        return;

    }


    const tableName =
        window.prompt(
            "Enter table name:"
        );


    if (!tableName) {

        return;

    }


    if (
        !/^[A-Za-z_][A-Za-z0-9_]*$/.test(
            tableName
        )
    ) {

        showStatus(
            "❌ Invalid table name.",
            "error"
        );

        return;

    }


    const columns =
        window.prompt(
            "Enter columns separated by commas.\n\nExample:\nid INTEGER PRIMARY KEY, name TEXT, email TEXT"
        );


    if (!columns) {

        return;

    }


    try {

        activeSQLiteDatabase.run(
            "CREATE TABLE " +
            quoteIdentifier(
                tableName
            ) +
            " (" +
            columns +
            ");"
        );


        persistActiveDatabase();


        renderDatabaseTree();


        showStatus(
            "✅ Table '" +
            tableName +
            "' created successfully.",
            "success"
        );

    }

    catch (error) {

        showStatus(
            "❌ Could not create table: " +
            error.message,
            "error"
        );

    }

}


/* ============================================================
 * INSERT ROW FROM UI
 * ============================================================
 *
 * This intentionally uses prompts for now.
 *
 * Later this can become a proper Snowflake-style
 * Insert Row modal/grid.
 * ============================================================ */

function insertRowFromUI() {

    if (
        !activeSQLiteDatabase ||
        !selectedTableName
    ) {

        showStatus(
            "⚠️ Select a table first.",
            "error"
        );

        return;

    }


    try {

        const info =
            activeSQLiteDatabase.exec(
                "PRAGMA table_info(" +
                quoteIdentifier(
                    selectedTableName
                ) +
                ");"
            );


        if (
            !info.length
        ) {

            throw new Error(
                "Table information could not be loaded."
            );

        }


        const columns =
            info[0].values;


        const insertColumns = [];


        const values = [];


        columns.forEach(
            function (
                column
            ) {

                const columnName =
                    column[1];


                const columnType =
                    String(
                        column[2] || ""
                    );


                const primaryKey =
                    Number(
                        column[5]
                    ) === 1;


                /*
                 * Skip auto-increment style integer primary key
                 * if the user leaves it blank.
                 */
                const value =
                    window.prompt(
                        "Value for " +
                        columnName +
                        " (" +
                        columnType +
                        ")" +
                        (
                            primaryKey
                                ? " - leave blank for automatic ID"
                                : ""
                        ) +
                        ":"
                    );


                if (
                    value === null
                ) {

                    throw new Error(
                        "Insert cancelled."
                    );

                }


                if (
                    value === "" &&
                    primaryKey
                ) {

                    return;

                }


                insertColumns.push(
                    columnName
                );


                values.push(
                    sqlLiteral(
                        value,
                        columnType
                    )
                );

            }
        );


        if (
            insertColumns.length === 0
        ) {

            throw new Error(
                "No values supplied."
            );

        }


        const sql =
            "INSERT INTO " +
            quoteIdentifier(
                selectedTableName
            ) +
            " (" +
            insertColumns
                .map(
                    quoteIdentifier
                )
                .join(", ") +
            ") VALUES (" +
            values.join(", ") +
            ");";


        activeSQLiteDatabase.run(
            sql
        );


        persistActiveDatabase();


        renderDatabaseTree();


        displayActionResult(
            [
                "1 row inserted into '" +
                selectedTableName +
                "'."
            ],
            1
        );


        showStatus(
            "✅ Row inserted successfully.",
            "success"
        );

    }

    catch (error) {

        if (
            error.message ===
            "Insert cancelled."
        ) {

            return;

        }


        showStatus(
            "❌ Insert failed: " +
            error.message,
            "error"
        );

    }

}


/* ============================================================
 * DELETE TABLE FROM UI
 * ============================================================ */

function deleteTableFromUI(
    tableName
) {

    if (!activeSQLiteDatabase) {

        return;

    }


    const confirmed =
        window.confirm(
            "Delete table '" +
            tableName +
            "'?\n\nAll data inside this table will be permanently removed."
        );


    if (!confirmed) {

        return;

    }


    try {

        activeSQLiteDatabase.run(
            "DROP TABLE " +
            quoteIdentifier(
                tableName
            ) +
            ";"
        );


        persistActiveDatabase();


        if (
            selectedTableName ===
            tableName
        ) {

            selectedTableName =
                null;

        }


        renderDatabaseTree();


        displayActionResult(
            [
                "Table '" +
                tableName +
                "' was deleted successfully."
            ],
            0
        );


        showStatus(
            "✅ Table '" +
            tableName +
            "' deleted.",
            "success"
        );

    }

    catch (error) {

        showStatus(
            "❌ Could not delete table: " +
            error.message,
            "error"
        );

    }

}


/* ============================================================
 * DELETE DATABASE FROM UI
 * ============================================================ */

function deleteDatabaseFromUI(
    databaseName
) {

    const confirmed =
        window.confirm(
            "Delete database '" +
            databaseName +
            "'?\n\nAll tables and data inside it will be permanently removed."
        );


    if (!confirmed) {

        return;

    }


    try {

        sandboxDatabases.delete(
            databaseName
        );


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

        }


        persistDatabases();


        renderDatabaseTree();


        hideResultsPanel();


        showStatus(
            "✅ Database '" +
            databaseName +
            "' deleted.",
            "success"
        );

    }

    catch (error) {

        showStatus(
            "❌ Could not delete database.",
            "error"
        );

    }

}


/* ============================================================
 * TABLE COUNT
 * ============================================================ */

function getUserTableCount() {

    if (
        !activeSQLiteDatabase
    ) {

        return 0;

    }


    const result =
        activeSQLiteDatabase.exec(
            `
            SELECT COUNT(*)
            FROM sqlite_master
            WHERE type = 'table'
            AND name NOT LIKE 'sqlite_%';
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
 * TABLE DESCRIPTION
 * ============================================================ */

function describeSelectedTable() {

    if (
        !activeSQLiteDatabase ||
        !selectedTableName
    ) {

        showStatus(
            "⚠️ Select a table first.",
            "error"
        );

        return;

    }


    const result =
        activeSQLiteDatabase.exec(
            "PRAGMA table_info(" +
            quoteIdentifier(
                selectedTableName
            ) +
            ");"
        );


    if (
        !result.length
    ) {

        showStatus(
            "❌ Table information not found.",
            "error"
        );

        return;

    }


    const columns =
        result[0].values;


    const rows =
        columns.map(
            function (
                row
            ) {

                return {

                    cid:
                        row[0],

                    name:
                        row[1],

                    type:
                        row[2],

                    notnull:
                        row[3],

                    default:
                        row[4],

                    primary_key:
                        row[5]

                };

            }
        );


    displaySandboxResults({

        columns: [
            "cid",
            "name",
            "type",
            "notnull",
            "default",
            "primary_key"
        ],

        values: [],

        rows: rows,

        executionTime: 0

    });

}


/* ============================================================
 * SHOW SCHEMA
 * ============================================================ */

function showSelectedTableSchema() {

    if (
        !activeSQLiteDatabase ||
        !selectedTableName
    ) {

        showStatus(
            "⚠️ Select a table first.",
            "error"
        );

        return;

    }


    const result =
        activeSQLiteDatabase.exec(
            `
            SELECT
                sql
            FROM sqlite_master
            WHERE type = 'table'
            AND name = '${escapeSQLString(
                selectedTableName
            )}';
            `
        );


    if (
        !result.length ||
        !result[0].values.length
    ) {

        showStatus(
            "❌ Schema not found.",
            "error"
        );

        return;

    }


    displaySandboxResults({

        columns: [
            "table_name",
            "schema"
        ],

        rows: [
            {

                table_name:
                    selectedTableName,

                schema:
                    result[0].values[0][0]

            }
        ],

        executionTime: 0

    });

}


/* ============================================================
 * SHOW RELATIONSHIPS
 * ============================================================ */

function showSelectedTableRelationships() {

    if (
        !activeSQLiteDatabase ||
        !selectedTableName
    ) {

        showStatus(
            "⚠️ Select a table first.",
            "error"
        );

        return;

    }


    const result =
        activeSQLiteDatabase.exec(
            "PRAGMA foreign_key_list(" +
            quoteIdentifier(
                selectedTableName
            ) +
            ");"
        );


    if (
        !result.length ||
        !result[0].values.length
    ) {

        displayActionResult(
            [
                "No foreign-key relationships found for '" +
                selectedTableName +
                "'."
            ],
            0
        );

        return;

    }


    const rows =
        result[0].values.map(
            function (
                row
            ) {

                return {

                    id:
                        row[0],

                    table:
                        row[2],

                    from_column:
                        row[3],

                    to_column:
                        row[4],

                    on_update:
                        row[5],

                    on_delete:
                        row[6]

                };

            }
        );


    displaySandboxResults({

        columns: [
            "id",
            "table",
            "from_column",
            "to_column",
            "on_update",
            "on_delete"
        ],

        rows:
            rows,

        executionTime:
            0

    });

}


/* ============================================================
 * DATABASE SEARCH
 * ============================================================ */

function filterDatabaseTree() {

    const search =
        databaseSearchInput
            ? databaseSearchInput.value
                .trim()
                .toLowerCase()
            : "";


    document
        .querySelectorAll(
            ".database-item"
        )
        .forEach(
            function (
                databaseItem
            ) {

                const databaseName =
                    (
                        databaseItem.dataset.database ||
                        ""
                    )
                    .toLowerCase();


                const tables =
                    Array.from(
                        databaseItem.querySelectorAll(
                            ".table-item"
                        )
                    );


                let databaseMatches =
                    databaseName.includes(
                        search
                    );


                tables.forEach(
                    function (
                        table
                    ) {

                        const tableName =
                            (
                                table.dataset.table ||
                                ""
                            )
                            .toLowerCase();


                        const matches =
                            tableName.includes(
                                search
                            );


                        table.style.display =
                            (
                                !search ||
                                matches
                            )
                                ? "flex"
                                : "none";

                    }
                );


                databaseItem.style.display =
                    (
                        !search ||
                        databaseMatches ||
                        tables.some(
                            function (
                                table
                            ) {

                                return (
                                    table.style.display !==
                                    "none"
                                );

                            }
                        )
                    )
                        ? "block"
                        : "none";

            }
        );

}


/* ============================================================
 * QUERY TABS
 * ============================================================ */

function createNewQueryTab() {

    queryCounter++;


    const newId =
        queryCounter;


    queryContents.set(
        newId,
        ""
    );


    const tab =
        document.createElement(
            "button"
        );


    tab.className =
        "query-tab";


    tab.dataset.queryId =
        newId;


    tab.type =
        "button";


    tab.innerHTML = `

        <span class="query-tab-name">
            Query ${newId}
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

            /*
             * If the X was clicked,
             * close the query instead of switching.
             */
            if (
                event.target.classList.contains(
                    "query-tab-close"
                )
            ) {

                event.stopPropagation();

                closeQueryTab(
                    newId
                );

                return;

            }


            switchQueryTab(
                newId
            );

        }
    );


    /*
     * Insert before the + button.
     */
    if (
        newQueryButton &&
        newQueryButton.parentElement
    ) {

        newQueryButton.parentElement.insertBefore(
            tab,
            newQueryButton
        );

    }

    else if (queryTabs) {

        queryTabs.appendChild(
            tab
        );

    }


    switchQueryTab(
        newId
    );

}

/* ============================================================
 * SWITCH QUERY TAB
 * ============================================================ */

function switchQueryTab(
    queryId
) {

    /*
     * Save current query first.
     */
    if (sqlEditor) {

        queryContents.set(
            activeQueryId,
            sqlEditor.value
        );

    }


    activeQueryId =
        queryId;


    /*
     * Load selected query.
     */
    if (sqlEditor) {

        sqlEditor.value =
            queryContents.get(
                queryId
            ) || "";

    }


    /*
     * Update active tab visual state.
     */
    document
        .querySelectorAll(
            ".query-tab"
        )
        .forEach(
            function (
                tab
            ) {

                tab.classList.toggle(
                    "active",
                    Number(
                        tab.dataset.queryId
                    ) === queryId
                );

            }
        );


    if (sqlEditor) {

        sqlEditor.focus();

    }

}


/* ============================================================
 * CLOSE QUERY TAB
 * ============================================================
 *
 * Query 1 is permanent.
 *
 * Query 2+ can be closed.
 *
 * If the active tab is closed, the previous remaining tab
 * becomes active.
 * ============================================================ */

function closeQueryTab(
    queryId
) {

    if (
        queryId === 1
    ) {

        showStatus(
            "ℹ️ Query 1 cannot be closed.",
            "info"
        );

        return;

    }


    const tab =
        document.querySelector(
            `.query-tab[data-query-id="${queryId}"]`
        );


    if (!tab) {

        return;

    }


    const wasActive =
        activeQueryId ===
        queryId;


    /*
     * Remove stored SQL.
     */
    queryContents.delete(
        queryId
    );


    /*
     * Remove tab.
     */
    tab.remove();


    if (wasActive) {

        /*
         * Select the nearest remaining query.
         */
        const remainingTabs =
            Array.from(
                document.querySelectorAll(
                    ".query-tab"
                )
            );


        if (
            remainingTabs.length
        ) {

            const previousTab =
                remainingTabs[
                    remainingTabs.length - 1
                ];


            const newActiveId =
                Number(
                    previousTab.dataset.queryId
                );


            switchQueryTab(
                newActiveId
            );

        }

    }


    showStatus(
        "Query closed.",
        "info"
    );

}


/* ============================================================
 * DISPLAY RESULTS
 * ============================================================ */

function displaySandboxResults(
    data
) {

    if (!data) {

        return;

    }


    latestResults =
        normalizeResults(
            data
        );


    showResultsPanel();


    const columns =
        latestResults.columns;


    const rows =
        latestResults.rows;


    if (resultsSummary) {

        resultsSummary.textContent =
            rows.length +
            " row" +
            (
                rows.length === 1
                    ? ""
                    : "s"
            ) +
            " • " +
            (
                latestResults.executionTime ||
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
            function (
                column
            ) {

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
            function (
                row
            ) {

                html +=
                    "<tr>";


                columns.forEach(
                    function (
                        column
                    ) {

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
 * ============================================================
 *
 * Used for:
 *
 * CREATE TABLE
 * INSERT
 * UPDATE
 * DELETE
 * DROP TABLE
 * ALTER TABLE
 *
 * This ensures that non-SELECT operations still populate the
 * result area after Run Query.
 * ============================================================ */

function displayActionResult(
    messages,
    changes,
    isError = false
) {

    showResultsPanel();


    latestResults =
        null;


    if (downloadResultsButton) {

        downloadResultsButton.disabled =
            true;

    }


    if (resultsSummary) {

        resultsSummary.textContent =
            isError
                ? "Execution failed"
                : "Statement executed";

    }


    if (!resultsContainer) {

        return;

    }


    const safeMessages =
        Array.isArray(messages)
            ? messages
            : [];


    resultsContainer.innerHTML = `

        <div class="empty-results">

            <div
                class="empty-results-icon"
                style="
                    color: ${
                        isError
                            ? "#f87171"
                            : "#60a5fa"
                    };
                "
            >
                ${
                    isError
                        ? "⚠"
                        : "✓"
                }
            </div>

            ${
                safeMessages
                    .map(
                        function (
                            message
                        ) {

                            return `
                                <p>
                                    ${escapeHTML(
                                        message
                                    )}
                                </p>
                            `;

                        }
                    )
                    .join("")
            }

            ${
                changes
                    ? `
                        <p>
                            ${changes}
                            row${
                                changes === 1
                                    ? ""
                                    : "s"
                            }
                            affected.
                        </p>
                    `
                    : ""
            }

        </div>

    `;

}


/* ============================================================
 * SHOW RESULTS PANEL
 * ============================================================ */

function showResultsPanel() {

    if (!resultsSection) {

        return;

    }


    resultsSection.classList.add(
        "results-visible"
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


    latestResults =
        null;


    if (downloadResultsButton) {

        downloadResultsButton.disabled =
            true;

    }


    if (resultsSummary) {

        resultsSummary.textContent =
            "No query executed";

    }

}


/* ============================================================
 * NORMALIZE RESULTS
 * ============================================================ */

function normalizeResults(
    data
) {

    /*
     * sql.js exec() format:
     *
     * {
     *     columns: ["id", "name"],
     *     values: [
     *         [1, "Jayant"],
     *         [2, "Alex"]
     *     ]
     * }
     *
     * Our UI uses:
     *
     * rows: [
     *     {
     *         id: 1,
     *         name: "Jayant"
     *     }
     * ]
     */

    const columns =
        Array.isArray(
            data.columns
        )
            ? data.columns
            : [];


    let rows =
        Array.isArray(
            data.rows
        )
            ? data.rows
            : [];


    if (
        Array.isArray(
            data.values
        )
    ) {

        rows =
            data.values.map(
                function (
                    values
                ) {

                    const row =
                        {};


                    columns.forEach(
                        function (
                            column,
                            index
                        ) {

                            row[column] =
                                values[index];

                        }
                    );


                    return row;

                }
            );

    }


    return {

        columns:
            columns,

        rows:
            rows,

        executionTime:
            data.executionTime || 0

    };

}


/* ============================================================
 * CSV DOWNLOAD
 * ============================================================ */

function downloadCSV(
    data
) {

    if (
        !data ||
        !Array.isArray(
            data.columns
        ) ||
        !Array.isArray(
            data.rows
        )
    ) {

        return;

    }


    const lines =
        [];


    lines.push(
        data.columns
            .map(
                csvEscape
            )
            .join(",")
    );


    data.rows.forEach(
        function (
            row
        ) {

            const values =
                data.columns.map(
                    function (
                        column
                    ) {

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


    const stringValue =
        String(
            value
        );


    return '"' +
        stringValue.replace(
            /"/g,
            '""'
        ) +
        '"';

}


/* ============================================================
 * DATABASE MODAL
 * ============================================================ */

function openDatabaseModal() {

    if (!databaseModal) {

        return;

    }


    databaseModal.classList.remove(
        "hidden"
    );


    if (databaseNameInput) {

        databaseNameInput.value =
            "";

    }


    removeModalError();


    if (databaseNameInput) {

        databaseNameInput.focus();

    }

}


/* ============================================================
 * CLOSE DATABASE MODAL
 * ============================================================ */

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


    if (
        !databaseNameInput ||
        !databaseNameInput.parentElement
    ) {

        return;

    }


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


/* ============================================================
 * REMOVE MODAL ERROR
 * ============================================================ */

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
            type ||
            ""
        );

}


/* ============================================================
 * IDENTIFIER QUOTING
 * ============================================================
 *
 * Used for SQLite table/column names.
 *
 * Example:
 *
 * users
 *
 * becomes:
 *
 * "users"
 *
 * This protects identifiers from SQL syntax conflicts.
 * ============================================================ */

function quoteIdentifier(
    value
) {

    return (
        '"' +
        String(
            value
        ).replace(
            /"/g,
            '""'
        ) +
        '"'
    );

}


/* ============================================================
 * SQL STRING ESCAPING
 * ============================================================ */

function escapeSQLString(
    value
) {

    return String(
        value
    ).replace(
        /'/g,
        "''"
    );

}


/* ============================================================
 * SQL VALUE LITERAL
 * ============================================================
 *
 * Converts UI-entered values into SQLite literals.
 * ============================================================ */

function sqlLiteral(
    value,
    type
) {

    if (
        value === null ||
        value === ""
    ) {

        return "NULL";

    }


    const normalizedType =
        String(
            type || ""
        )
        .toUpperCase();


    /*
     * Numeric SQLite types.
     */
    if (
        normalizedType.includes(
            "INT"
        ) ||
        normalizedType.includes(
            "REAL"
        ) ||
        normalizedType.includes(
            "NUM"
        ) ||
        normalizedType.includes(
            "DEC"
        ) ||
        normalizedType.includes(
            "FLOAT"
        ) ||
        normalizedType.includes(
            "DOUBLE"
        )
    ) {

        if (
            /^-?\d+(\.\d+)?$/.test(
                value
            )
        ) {

            return value;

        }

    }


    /*
     * Everything else is treated as text.
     */
    return "'" +
        escapeSQLString(
            value
        ) +
        "'";

}


/* ============================================================
 * BASE64 HELPERS
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
 * HTML ESCAPE
 * ============================================================ */

function escapeHTML(
    value
) {

    return String(
        value
    )
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
 * INITIAL RESULTS STATE
 * ============================================================ */

function initializeResultsState() {

    if (
        resultsContainer
    ) {

        resultsContainer.innerHTML = `

            <div class="empty-results">

                <div class="empty-results-icon">
                    ◫
                </div>

                <p>
                    Run a SQL query to see results here.
                </p>

            </div>

        `;

    }


    if (
        resultsSummary
    ) {

        resultsSummary.textContent =
            "No query executed";

    }


    if (
        downloadResultsButton
    ) {

        downloadResultsButton.disabled =
            true;

    }

}


/* ============================================================
 * INITIAL DATABASE STATE
 * ============================================================ */

initializeResultsState();


/* ============================================================
 * DEBUG HELPER
 * ============================================================
 *
 * Browser console:
 *
 *     window.getSandboxState()
 *
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

            queryCount:
                queryContents.size,

            selectedTable:
                selectedTableName

        };

    };


/* ============================================================
 * GLOBAL RESULT HELPER
 * ============================================================
 *
 * Allows future backend/SQLite modules to directly populate
 * Sandbox results.
 * ============================================================ */

window.displaySandboxResults =
    displaySandboxResults;


/* ============================================================
 * FINAL LOG
 * ============================================================ */

console.log(
    "✅ sandbox.js loaded."
);

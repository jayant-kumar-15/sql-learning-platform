/*
 * ============================================================
 * SQL SANDBOX
 * ============================================================
 *
 * PURPOSE
 * -------
 * This file controls the complete browser-based SQL Sandbox.
 *
 * CURRENT RESPONSIBILITIES
 * ------------------------
 * 1. Initialize SQLite using sql.js.
 * 2. Create/select/delete Sandbox databases.
 * 3. Support CREATE DATABASE / DROP DATABASE through the
 *    Sandbox command layer.
 * 4. Create/drop tables using normal SQL.
 * 5. Automatically refresh the Database Explorer after DDL.
 * 6. Execute SELECT, INSERT, UPDATE, DELETE and other SQL.
 * 7. Automatically open Query Results after SELECT.
 * 8. Allow users to click a table and inspect its data.
 * 9. Support Describe / Schema / Relationships.
 * 10. Manage multiple query tabs.
 * 11. Download query results as CSV.
 * 12. Persist databases in localStorage.
 * 13. Support mobile database navigation.
 *
 * IMPORTANT ARCHITECTURE
 * ----------------------
 * SQLite runs completely inside the browser using sql.js.
 *
 * SQLite itself does NOT support:
 *
 *     CREATE DATABASE my_database;
 *
 * Therefore CREATE DATABASE and DROP DATABASE are handled by
 * this application layer.
 *
 * Every Sandbox database is represented by its own SQLite
 * database object.
 *
 * ============================================================
 */


/* ============================================================
 * CONFIGURATION
 * ============================================================ */

/*
 * Location of the sql.js WebAssembly file.
 */
const SQLITE_WASM_PATH =
    "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/";


/*
 * LocalStorage key used for persistent Sandbox data.
 */
const SANDBOX_STORAGE_KEY =
    "sql_learning_platform_sandbox";


/*
 * Maximum number of databases allowed in the Sandbox.
 */
const MAX_DATABASES =
    2;


/*
 * Maximum number of tables allowed inside one database.
 */
const MAX_TABLES_PER_DATABASE =
    10;


/*
 * Maximum number of rows allowed inside one table.
 */
const MAX_ROWS_PER_TABLE =
    2000;


/* ============================================================
 * DOM ELEMENTS
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


/*
 * Query Results elements.
 */
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


/*
 * Database modal elements.
 */
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


/*
 * Database Explorer.
 */
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


/*
 * Table inspection buttons.
 */
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


/*
 * Query tab controls.
 */
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
 * Currently active SQLite database.
 */
let activeSQLiteDatabase =
    null;


/*
 * Name of currently selected database.
 */
let activeDatabaseName =
    null;


/*
 * Stores Sandbox databases.
 *
 * Map structure:
 *
 *     database name
 *          ↓
 *     Uint8Array containing exported SQLite DB
 *
 * We store exported SQLite bytes rather than the live SQLite
 * object because live WASM database objects cannot be directly
 * saved in localStorage.
 */
const sandboxDatabases =
    new Map();


/*
 * Latest query result.
 *
 * Used by:
 *
 *     - results display
 *     - CSV download
 */
let latestResults =
    null;


/*
 * Query tab counter.
 */
let queryCounter =
    1;


/*
 * Currently active query tab.
 */
let activeQueryId =
    1;


/*
 * Stores SQL text for each query tab.
 *
 * Example:
 *
 * {
 *     1: "SELECT * FROM users;",
 *     2: "SELECT * FROM doctors;"
 * }
 */
const queryContents =
    new Map();


/*
 * Currently selected table.
 *
 * Used by Describe / Schema / Relationships.
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


/*
 * ============================================================
 * INITIALIZE SANDBOX
 * ============================================================
 *
 * Startup sequence:
 *
 *     sql.js
 *       ↓
 *     load saved databases
 *       ↓
 *     render explorer
 *       ↓
 *     initialize Query 1
 *       ↓
 *     hide results
 *       ↓
 *     attach events
 *
 * ============================================================
 */

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


        /*
         * Results should not consume workspace space when
         * the user has not executed a query.
         */
        hideResultsPanel();


        initializeEventListeners();


        showStatus(
            "✅ SQL Sandbox ready.",
            "success"
        );


        console.log(
            "✅ SQL Sandbox initialized."
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


    /*
     * sql.js must already be loaded by sandbox.html.
     */
    if (
        typeof window.initSqlJs !==
        "function"
    ) {

        throw new Error(
            "sql.js could not be loaded. Make sure sql-wasm.js is loaded before sandbox.js."
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
     * CREATE DATABASE
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
     * DOWNLOAD CSV
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
     * NEW QUERY TAB
     * -------------------------------------------------------- */

    if (newQueryButton) {

        newQueryButton.addEventListener(
            "click",
            createNewQueryTab
        );

    }


    /* --------------------------------------------------------
     * TABLE DESCRIPTION
     * -------------------------------------------------------- */

    if (describeTableButton) {

        describeTableButton.addEventListener(
            "click",
            describeSelectedTable
        );

    }


    /* --------------------------------------------------------
     * TABLE SCHEMA
     * -------------------------------------------------------- */

    if (viewSchemaButton) {

        viewSchemaButton.addEventListener(
            "click",
            showSelectedTableSchema
        );

    }


    /* --------------------------------------------------------
     * TABLE RELATIONSHIPS
     * -------------------------------------------------------- */

    if (viewRelationshipsButton) {

        viewRelationshipsButton.addEventListener(
            "click",
            showSelectedTableRelationships
        );

    }


    /* --------------------------------------------------------
     * SQL EDITOR
     * --------------------------------------------------------
     *
     * Query text is saved whenever the user types.
     *
     * This prevents SQL from disappearing when switching
     * between Query 1, Query 2, Query 3, etc.
     */

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
         * Ctrl + Enter / Cmd + Enter executes the query.
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
     * DATABASE NAME ENTER KEY
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
 * CREATE DATABASE USING BUTTON
 * ============================================================
 *
 * This creates a new independent SQLite database in the
 * browser.
 *
 * ============================================================
 */

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


        /*
         * Store the exported database immediately.
         */
        sandboxDatabases.set(
            name,
            database.export()
        );


        /*
         * Keep the live database open because it is now active.
         */
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
            "' created and selected.",
            "success"
        );


        console.log(
            "Database created:",
            name
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
 * CREATE DATABASE USING SQL
 * ============================================================
 *
 * SQLite does not natively support CREATE DATABASE.
 *
 * We intercept this command and create a new Sandbox database.
 *
 * Example:
 *
 *     CREATE DATABASE MyPracticeDB;
 *
 * ============================================================
 */

function handleCreateDatabaseCommand(
    query
) {

    const match =
        query.match(
            /^\s*CREATE\s+DATABASE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z0-9_]+)\s*;?\s*$/i
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

        showStatus(
            "ℹ️ Database '" +
            databaseName +
            "' already exists.",
            "info"
        );


        openDatabase(
            databaseName
        );


        return true;

    }


    if (
        sandboxDatabases.size >=
        MAX_DATABASES
    ) {

        showStatus(
            "❌ Maximum of " +
            MAX_DATABASES +
            " databases allowed.",
            "error"
        );


        return true;

    }


    try {

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


        persistDatabases();


        renderDatabaseTree();


        hideResultsPanel();


        showStatus(
            "✅ Database '" +
            databaseName +
            "' created successfully.",
            "success"
        );


        return true;

    }

    catch (error) {

        console.error(
            error
        );


        showStatus(
            "❌ Failed to create database.",
            "error"
        );


        return true;

    }

}


/* ============================================================
 * DROP DATABASE USING SQL
 * ============================================================
 *
 * Example:
 *
 *     DROP DATABASE MyPracticeDB;
 *
 * ============================================================
 */

function handleDropDatabaseCommand(
    query
) {

    const match =
        query.match(
            /^\s*DROP\s+DATABASE\s+(?:IF\s+EXISTS\s+)?([A-Za-z0-9_]+)\s*;?\s*$/i
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

        showStatus(
            "❌ Database '" +
            databaseName +
            "' does not exist.",
            "error"
        );


        return true;

    }


    /*
     * Close active SQLite object before deleting its stored copy.
     */
    if (
        activeDatabaseName ===
        databaseName &&
        activeSQLiteDatabase
    ) {

        try {

            activeSQLiteDatabase.close();

        }

        catch (error) {

            console.warn(
                "Database close warning:",
                error
            );

        }


        activeSQLiteDatabase =
            null;

        activeDatabaseName =
            null;

        selectedTableName =
            null;

    }


    sandboxDatabases.delete(
        databaseName
    );


    persistDatabases();


    renderDatabaseTree();


    hideResultsPanel();


    showStatus(
        "✅ Database '" +
        databaseName +
        "' deleted successfully.",
        "success"
    );


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


        console.log(
            "Active database:",
            databaseName
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
 * DELETE DATABASE USING UI
 * ============================================================ */

function deleteDatabase(
    databaseName
) {

    if (
        !sandboxDatabases.has(
            databaseName
        )
    ) {

        return;

    }


    const confirmed =
        window.confirm(
            "Delete database '" +
            databaseName +
            "'?\n\nAll tables and data inside this database will be permanently removed."
        );


    if (!confirmed) {

        return;

    }


    handleDropDatabaseCommand(
        "DROP DATABASE " +
        databaseName
    );

}


/* ============================================================
 * DATABASE EXPLORER
 * ============================================================
 *
 * The Explorer is rebuilt from the actual SQLite database.
 *
 * This is important:
 *
 *     CREATE TABLE
 *          ↓
 *     SQLite
 *          ↓
 *     renderDatabaseTree()
 *          ↓
 *     table appears in left panel
 *
 * ============================================================
 */

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
            storedDatabase,
            databaseName
        ) {

            renderSingleDatabase(
                databaseName,
                storedDatabase
            );

        }
    );


    applyDatabaseSearchFilter();

}


/* ============================================================
 * RENDER ONE DATABASE
 * ============================================================ */

function renderSingleDatabase(
    databaseName,
    storedDatabase
) {

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


    const isActive =
        databaseName ===
        activeDatabaseName;


    header.innerHTML = `

        <span class="database-arrow">
            ${isActive ? "▼" : "▶"}
        </span>

        <span class="database-icon">
            🗄️
        </span>

        <span class="database-name">
            ${escapeHTML(databaseName)}
        </span>

        <button
            type="button"
            class="database-delete-button"
            title="Delete database"
        >
            ×
        </button>

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


    /*
     * Reconstruct a temporary SQLite object only for reading
     * the table list when this database is not active.
     */
    let databaseForInspection =
        null;


    try {

        if (
            databaseName ===
            activeDatabaseName &&
            activeSQLiteDatabase
        ) {

            databaseForInspection =
                activeSQLiteDatabase;

        }

        else {

            databaseForInspection =
                new SQL_ENGINE.Database(
                    storedDatabase
                );

        }


        const tables =
            getTables(
                databaseForInspection
            );


        tables.forEach(
            function (
                tableName
            ) {

                renderTableItem(
                    tableList,
                    databaseName,
                    tableName
                );

            }
        );


    }

    catch (error) {

        console.error(
            "Failed to inspect database:",
            databaseName,
            error
        );

    }

    finally {

        /*
         * Do not close the active database.
         */
        if (
            databaseForInspection &&
            databaseForInspection !==
            activeSQLiteDatabase
        ) {

            try {

                databaseForInspection.close();

            }

            catch (error) {

                console.warn(
                    "Temporary database close warning:",
                    error
                );

            }

        }

    }


    /*
     * Database header click:
     *
     * - selects database
     * - expands/collapses table list
     */
    header.addEventListener(
        "click",
        function (event) {

            /*
             * Clicking delete button should NOT open the DB.
             */
            if (
                event.target.closest(
                    ".database-delete-button"
                )
            ) {

                return;

            }


            const currentlyVisible =
                tableList.style.display !==
                "none";


            if (
                activeDatabaseName !==
                databaseName
            ) {

                openDatabase(
                    databaseName
                );


                tableList.style.display =
                    "block";

            }

            else {

                tableList.style.display =
                    currentlyVisible
                        ? "none"
                        : "block";

            }


            const arrow =
                header.querySelector(
                    ".database-arrow"
                );


            if (arrow) {

                arrow.textContent =
                    tableList.style.display !==
                    "none"
                        ? "▼"
                        : "▶";

            }

        }
    );


    /*
     * Delete database button.
     */
    const deleteButton =
        header.querySelector(
            ".database-delete-button"
        );


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                deleteDatabase(
                    databaseName
                );

            }
        );

    }


    databaseItem.appendChild(
        header
    );


    databaseItem.appendChild(
        tableList
    );


    databaseTree.appendChild(
        databaseItem
    );

}


/* ============================================================
 * RENDER TABLE ITEM
 * ============================================================ */

function renderTableItem(
    tableList,
    databaseName,
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


/* ============================================================
 * GET TABLES
 * ============================================================ */

function getTables(
    database
) {

    if (!database) {

        return [];

    }


    const result =
        database.exec(`

            SELECT name

            FROM sqlite_master

            WHERE type = 'table'

            AND name NOT LIKE 'sqlite_%'

            ORDER BY name;

        `);


    if (
        !result.length ||
        !result[0].values
    ) {

        return [];

    }


    return result[0].values.map(
        function (row) {

            return row[0];

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

    if (
        activeDatabaseName !==
        databaseName
    ) {

        openDatabase(
            databaseName
        );

    }


    selectedTableName =
        tableName;


    /*
     * Automatically load the table's data.
     *
     * This gives the Database Explorer the same convenient
     * behavior users expect from database tools such as
     * Snowflake.
     */
    loadTableData(
        tableName
    );


    /*
     * Close mobile sidebar after selecting a table.
     */
    if (databaseSidebar) {

        databaseSidebar.classList.remove(
            "mobile-open"
        );

    }

}


/* ============================================================
 * LOAD TABLE DATA
 * ============================================================ */

function loadTableData(
    tableName
) {

    if (
        !activeSQLiteDatabase
    ) {

        showStatus(
            "❌ Please select a database first.",
            "error"
        );

        return;

    }


    try {

        const safeTableName =
            quoteIdentifier(
                tableName
            );


        const result =
            activeSQLiteDatabase.exec(

                `SELECT * FROM ${safeTableName};`

            );


        if (
            !result.length
        ) {

            displaySandboxResults({

                columns: [],

                rows: [],

                executionTime: 0

            });


            return;

        }


        const columns =
            result[0].columns;


        const rows =
            result[0].values.map(
                function (values) {

                    const row = {};


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


        displaySandboxResults({

            columns:
                columns,

            rows:
                rows,

            executionTime:
                0

        });


        showStatus(
            "✅ Showing data from '" +
            tableName +
            "'.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Table data error:",
            error
        );


        showStatus(
            "❌ Could not load table data.",
            "error"
        );

    }

}


/* ============================================================
 * EXECUTE CURRENT QUERY
 * ============================================================
 *
 * This is the central SQL execution function.
 *
 * Flow:
 *
 *     User clicks Run
 *          ↓
 *     Check database
 *          ↓
 *     Detect Sandbox commands
 *          ↓
 *     Execute SQLite SQL
 *          ↓
 *     Persist database
 *          ↓
 *     Refresh Explorer
 *          ↓
 *     Show results when appropriate
 *
 * ============================================================
 */

function executeCurrentQuery() {

    if (!sqlEditor) {

        return;

    }


    const query =
        sqlEditor.value.trim();


    if (!query) {

        showStatus(
            "❌ Please enter a SQL query.",
            "error"
        );

        return;

    }


    /*
     * CREATE DATABASE and DROP DATABASE are application-level
     * commands, so they are handled before SQLite execution.
     */
    if (
        handleCreateDatabaseCommand(
            query
        )
    ) {

        return;

    }


    if (
        handleDropDatabaseCommand(
            query
        )
    ) {

        return;

    }


    /*
     * All other SQL requires an active database.
     */
    if (
        !activeSQLiteDatabase
    ) {

        showStatus(
            "❌ Create or select a database first.",
            "error"
        );

        return;

    }


    const startTime =
        performance.now();


    try {

        /*
         * Before CREATE TABLE, enforce the table limit.
         */
        if (
            isCreateTableQuery(
                query
            )
        ) {

            const tableCount =
                getTables(
                    activeSQLiteDatabase
                ).length;


            if (
                tableCount >=
                MAX_TABLES_PER_DATABASE
            ) {

                showStatus(
                    "❌ Maximum of " +
                    MAX_TABLES_PER_DATABASE +
                    " tables allowed per database.",
                    "error"
                );

                return;

            }

        }


        /*
         * Execute the SQL.
         */
        const result =
            activeSQLiteDatabase.exec(
                query
            );


        const executionTime =
            Math.round(
                performance.now() -
                startTime
            );


        /*
         * Save current SQL in the active tab.
         */
        queryContents.set(
            activeQueryId,
            sqlEditor.value
        );


        /*
         * Persist database immediately after every successful
         * change.
         */
        persistActiveDatabase();


        /*
         * Refresh left Database Explorer.
         *
         * This is what makes newly-created tables immediately
         * appear in the left panel.
         */
        renderDatabaseTree();


        /*
         * Determine whether the query returned rows.
         */
        if (
            result &&
            result.length
        ) {

            const firstResult =
                result[0];


            const columns =
                firstResult.columns ||
                [];


            const rows =
                firstResult.values.map(
                    function (values) {

                        const row = {};


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


            displaySandboxResults({

                columns:
                    columns,

                rows:
                    rows,

                executionTime:
                    executionTime

            });


            showStatus(
                "✅ Query executed successfully.",
                "success"
            );

        }

        else {

            /*
             * CREATE / INSERT / UPDATE / DELETE / DROP etc.
             * do not need a large results panel.
             */
            hideResultsPanel();


            const operation =
                getSQLStatementType(
                    query
                );


            showStatus(
                "✅ " +
                operation +
                " executed successfully.",
                "success"
            );

        }


        /*
         * DDL changes can affect the currently selected table.
         */
        if (
            isCreateTableQuery(
                query
            ) ||
            isDropTableQuery(
                query
            ) ||
            isAlterTableQuery(
                query
            )
        ) {

            selectedTableName =
                null;

        }

    }

    catch (error) {

        console.error(
            "SQL execution error:",
            error
        );


        hideResultsPanel();


        showStatus(
            "❌ " +
            getSQLiteErrorMessage(
                error
            ),
            "error"
        );

    }

}


/* ============================================================
 * SQL STATEMENT HELPERS
 * ============================================================ */

function isCreateTableQuery(
    query
) {

    return /^\s*CREATE\s+TABLE\b/i.test(
        query
    );

}


function isDropTableQuery(
    query
) {

    return /^\s*DROP\s+TABLE\b/i.test(
        query
    );

}


function isAlterTableQuery(
    query
) {

    return /^\s*ALTER\s+TABLE\b/i.test(
        query
    );

}


function getSQLStatementType(
    query
) {

    const match =
        query.match(
            /^\s*([A-Za-z]+)/i
        );


    if (!match) {

        return "SQL statement";

    }


    const type =
        match[1].toUpperCase();


    const names = {

        SELECT:
            "SELECT query",

        INSERT:
            "INSERT",

        UPDATE:
            "UPDATE",

        DELETE:
            "DELETE",

        CREATE:
            "CREATE",

        DROP:
            "DROP",

        ALTER:
            "ALTER",

        PRAGMA:
            "PRAGMA"

    };


    return (
        names[type] ||
        type
    );

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
 * LOCAL STORAGE PERSISTENCE
 * ============================================================ */

function persistDatabases() {

    try {

        const serialized =
            {};


        sandboxDatabases.forEach(
            function (
                bytes,
                databaseName
            ) {

                serialized[
                    databaseName
                ] =
                    uint8ArrayToBase64(
                        bytes
                    );

            }
        );


        localStorage.setItem(

            SANDBOX_STORAGE_KEY,

            JSON.stringify(
                serialized
            )

        );

    }

    catch (error) {

        console.error(
            "Failed to persist Sandbox:",
            error
        );


        showStatus(
            "❌ Could not save Sandbox data.",
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

        const parsed =
            JSON.parse(
                saved
            );


        Object.keys(
            parsed
        ).forEach(
            function (
                databaseName
            ) {

                sandboxDatabases.set(

                    databaseName,

                    base64ToUint8Array(
                        parsed[
                            databaseName
                        ]
                    )

                );

            }
        );

    }

    catch (error) {

        console.error(
            "Failed to load saved Sandbox:",
            error
        );

    }

}


/* ============================================================
 * UINT8ARRAY → BASE64
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

        const chunk =
            bytes.subarray(
                i,
                i + chunkSize
            );


        binary +=
            String.fromCharCode(
                ...chunk
            );

    }


    return btoa(
        binary
    );

}


/* ============================================================
 * BASE64 → UINT8ARRAY
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
 * RESULTS PANEL
 * ============================================================ */

/*
 * Results remain hidden until a SELECT-like query returns
 * actual result data.
 */
function hideResultsPanel() {

    if (
        resultsSection
    ) {

        resultsSection.classList.remove(
            "results-visible"
        );

        resultsSection.classList.add(
            "results-hidden"
        );

    }


    latestResults =
        null;


    if (
        downloadResultsButton
    ) {

        downloadResultsButton.disabled =
            true;

    }

}


/*
 * Display and open the results panel.
 */
function showResultsPanel() {

    if (
        resultsSection
    ) {

        resultsSection.classList.remove(
            "results-hidden"
        );

        resultsSection.classList.add(
            "results-visible"
        );

    }

}


/* ============================================================
 * DISPLAY SANDBOX RESULTS
 * ============================================================ */

window.displaySandboxResults =
    function (
        data
    ) {

        if (!data) {

            return;

        }


        latestResults =
            data;


        const columns =
            Array.isArray(
                data.columns
            )
                ? data.columns
                : [];


        const rows =
            Array.isArray(
                data.rows
            )
                ? data.rows
                : [];


        /*
         * Results are now available, so open the results panel.
         */
        showResultsPanel();


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
                    data.executionTime ||
                    0
                ) +
                " ms";

        }


        if (!resultsContainer) {

            return;

        }


        /*
         * Query returned zero rows.
         */
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


        /*
         * Query returned rows.
         */
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
                                value ===
                                null ||
                                value ===
                                undefined
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


        if (
            downloadResultsButton
        ) {

            downloadResultsButton.disabled =
                rows.length === 0;

        }

    };


/* ============================================================
 * TABLE DESCRIPTION
 * ============================================================ */

function describeSelectedTable() {

    if (
        !activeSQLiteDatabase ||
        !selectedTableName
    ) {

        showStatus(
            "ℹ️ Select a table first.",
            "info"
        );

        return;

    }

    try {

        const table =
            quoteIdentifier(
                selectedTableName
            );


        const result =
            activeSQLiteDatabase.exec(

                `PRAGMA table_info(${table});`

            );


        if (
            !result.length
        ) {

            return;

        }


        const columns =
            result[0].columns;


        const rows =
            result[0].values.map(
                function (
                    values
                ) {

                    const row = {};


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


        displaySandboxResults({

            columns:
                columns,

            rows:
                rows,

            executionTime:
                0

        });


        showStatus(
            "✅ Table description loaded.",
            "success"
        );

    }

    catch (error) {

        showStatus(
            "❌ Could not describe table.",
            "error"
        );

    }

}


/* ============================================================
 * SHOW TABLE SCHEMA
 * ============================================================ */

function showSelectedTableSchema() {

    if (
        !activeSQLiteDatabase ||
        !selectedTableName
    ) {

        showStatus(
            "ℹ️ Select a table first.",
            "info"
        );

        return;

    }


    try {

        const table =
            quoteIdentifier(
                selectedTableName
            );


        const result =
            activeSQLiteDatabase.exec(

                `PRAGMA table_info(${table});`

            );


        if (
            !result.length
        ) {

            return;

        }


        const columns =
            result[0].columns;


        const rows =
            result[0].values.map(
                function (
                    values
                ) {

                    const row = {};


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


        displaySandboxResults({

            columns:
                columns,

            rows:
                rows,

            executionTime:
                0

        });


        showStatus(
            "✅ Schema loaded.",
            "success"
        );

    }

    catch (error) {

        showStatus(
            "❌ Could not load schema.",
            "error"
        );

    }

}


/* ============================================================
 * TABLE RELATIONSHIPS
 * ============================================================ */

function showSelectedTableRelationships() {

    if (
        !activeSQLiteDatabase ||
        !selectedTableName
    ) {

        showStatus(
            "ℹ️ Select a table first.",
            "info"
        );

        return;

    }


    try {

        const table =
            quoteIdentifier(
                selectedTableName
            );


        const result =
            activeSQLiteDatabase.exec(

                `PRAGMA foreign_key_list(${table});`

            );


        if (
            !result.length
        ) {

            displaySandboxResults({

                columns: [
                    "message"
                ],

                rows: [
                    {
                        message:
                            "No foreign-key relationships found."
                    }
                ],

                executionTime:
                    0

            });


            return;

        }


        const columns =
            result[0].columns;


        const rows =
            result[0].values.map(
                function (
                    values
                ) {

                    const row = {};


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


        displaySandboxResults({

            columns:
                columns,

            rows:
                rows,

            executionTime:
                0

        });


        showStatus(
            "✅ Relationships loaded.",
            "success"
        );

    }

    catch (error) {

        showStatus(
            "❌ Could not load relationships.",
            "error"
        );

    }

}


/* ============================================================
 * QUERY TABS
 * ============================================================ */

function createNewQueryTab() {

    queryCounter +=
        1;


    const newId =
        queryCounter;


    queryContents.set(
        newId,
        ""
    );


    activeQueryId =
        newId;


    if (
        sqlEditor
    ) {

        sqlEditor.value =
            "";

    }


    renderQueryTabs();


    hideResultsPanel();


    if (
        sqlEditor
    ) {

        sqlEditor.focus();

    }


    showStatus(
        "New query created.",
        "info"
    );

}


/* ============================================================
 * RENDER QUERY TABS
 * ============================================================ */

function renderQueryTabs() {

    if (!queryTabs) {

        return;

    }


    /*
     * Preserve the + button.
     */
    const plusButton =
        newQueryButton;


    queryTabs.innerHTML =
        "";


    queryContents.forEach(
        function (
            content,
            id
        ) {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "query-tab" +
                (
                    id ===
                    activeQueryId
                        ? " active"
                        : ""
                );


            button.dataset.queryId =
                id;


            button.innerHTML = `

                <span class="query-tab-name">
                    Query ${id}
                </span>

            `;


            button.addEventListener(
                "click",
                function () {

                    switchQueryTab(
                        id
                    );

                }
            );


            queryTabs.appendChild(
                button
            );

        }
    );


    /*
     * Put + directly beside the tabs.
     */
    if (plusButton) {

        queryTabs.parentElement.appendChild(
            plusButton
        );

    }

}


/* ============================================================
 * SWITCH QUERY TAB
 * ============================================================ */

function switchQueryTab(
    queryId
) {

    /*
     * Save current editor before switching.
     */
    if (
        sqlEditor
    ) {

        queryContents.set(
            activeQueryId,
            sqlEditor.value
        );

    }


    activeQueryId =
        Number(
            queryId
        );


    if (
        sqlEditor
    ) {

        sqlEditor.value =
            queryContents.get(
                activeQueryId
            ) ||
            "";

    }


    renderQueryTabs();


    hideResultsPanel();


    if (
        sqlEditor
    ) {

        sqlEditor.focus();

    }

}


/* ============================================================
 * DATABASE SEARCH
 * ============================================================ */

function filterDatabaseTree() {

    applyDatabaseSearchFilter();

}


function applyDatabaseSearchFilter() {

    if (!databaseTree) {

        return;

    }


    const search =
        databaseSearchInput
            ? databaseSearchInput.value
                .trim()
                .toLowerCase()
            : "";


    databaseTree
        .querySelectorAll(
            ".database-item"
        )
        .forEach(
            function (
                item
            ) {

                const databaseName =
                    (
                        item.dataset.database ||
                        ""
                    ).toLowerCase();


                let databaseMatches =
                    databaseName.includes(
                        search
                    );


                let tableMatches =
                    false;


                item.querySelectorAll(
                    ".table-item"
                ).forEach(
                    function (
                        table
                    ) {

                        const tableName =
                            (
                                table.dataset.table ||
                                ""
                            ).toLowerCase();


                        const matches =
                            tableName.includes(
                                search
                            );


                        table.style.display =
                            matches
                                ? "flex"
                                : "none";


                        if (matches) {

                            tableMatches =
                                true;

                        }

                    }
                );


                item.style.display =
                    (
                        !search ||
                        databaseMatches ||
                        tableMatches
                    )
                        ? ""
                        : "none";

            }
        );

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


    if (
        databaseNameInput
    ) {

        databaseNameInput.value =
            "";

    }


    removeModalError();


    if (
        databaseNameInput
    ) {

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
        !databaseNameInput
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


    /*
     * Header.
     */
    lines.push(
        data.columns
            .map(
                csvEscape
            )
            .join(",")
    );


    /*
     * Data rows.
     */
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
                lines.join(
                    "\n"
                )
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


    return (
        '"' +
        String(value)
            .replace(
                /"/g,
                '""'
            ) +
        '"'
    );

}


/* ============================================================
 * SQLITE IDENTIFIER QUOTING
 * ============================================================
 *
 * Used when table names come from the Database Explorer.
 *
 * Example:
 *
 *     users
 *
 * becomes:
 *
 *     "users"
 *
 * This prevents table names containing special characters from
 * breaking generated queries.
 * ============================================================
 */

function quoteIdentifier(
    name
) {

    return (
        '"' +
        String(name)
            .replace(
                /"/g,
                '""'
            ) +
        '"'
    );

}


/* ============================================================
 * SQLITE ERROR MESSAGE
 * ============================================================ */

function getSQLiteErrorMessage(
    error
) {

    if (
        !error
    ) {

        return "SQL execution failed.";

    }


    return (
        error.message ||
        String(error)
    );

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
 * DEBUG HELPER
 * ============================================================
 *
 * Open the browser console and run:
 *
 *     window.getSandboxState()
 *
 * to inspect the current Sandbox state.
 * ============================================================
 */

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
                selectedTableName,

            tables:
                activeSQLiteDatabase
                    ? getTables(
                        activeSQLiteDatabase
                    )
                    : []

        };

    };


/* ============================================================
 * FINAL LOG
 * ============================================================ */

console.log(
    "✅ sandbox.js loaded successfully."
);

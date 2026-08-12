/*
 * ============================================================
 * SQL SANDBOX
 * ============================================================
 *
 * PURPOSE
 * -------
 * This file controls the complete SQL Sandbox experience.
 *
 * CURRENT RESPONSIBILITIES
 * ------------------------
 * 1. Initialize SQLite in the browser using sql.js.
 * 2. Create user databases.
 * 3. Display databases in the Database Explorer.
 * 4. Create and detect tables.
 * 5. Execute SQL queries.
 * 6. Display query results.
 * 7. Manage query tabs.
 * 8. Download query results as CSV.
 * 9. Support Describe / Schema / Relationships buttons.
 * 10. Persist sandbox data in browser storage.
 * 11. Support mobile database sidebar.
 *
 * IMPORTANT ARCHITECTURE
 * ----------------------
 * This page uses SQLite locally inside the browser.
 *
 * No Node.js server is required for this stage.
 * No backend API is required for this stage.
 *
 * sql.js loads SQLite through WebAssembly.
 *
 * The HTML loads:
 *
 *     sql-wasm.js
 *
 * BEFORE:
 *
 *     sandbox.js
 *
 * Therefore the global SQL object becomes available to this file.
 *
 * ============================================================
 */


/* ============================================================
 * CONFIGURATION
 * ============================================================ */

/*
 * sql.js needs to know where its WebAssembly file is located.
 *
 * We are using the CDN version of sql.js in sandbox.html.
 *
 * Keeping this URL in one place makes future migration easier.
 */
const SQLITE_WASM_PATH =
    "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/";


/*
 * Local-storage key used to save Sandbox databases.
 *
 * IMPORTANT:
 * We are not storing the live SQLite object directly.
 *
 * Instead, the SQLite database is exported into a Uint8Array
 * and converted into Base64 before being stored.
 *
 * This allows the database to survive page refreshes.
 */
const SANDBOX_STORAGE_KEY =
    "sql_learning_platform_sandbox";


/*
 * Maximum number of databases allowed per user.
 *
 * This can be changed later when we implement the final
 * Sandbox limits.
 */
const MAX_DATABASES =
    2;


/*
 * Maximum number of tables allowed inside one database.
 *
 * This is currently aligned with the planned Sandbox limits.
 */
const MAX_TABLES_PER_DATABASE =
    10;


/*
 * Maximum number of rows per table.
 *
 * This is a safety limit for the browser-based Sandbox.
 */
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


/*
 * IMPORTANT:
 *
 * There is intentionally NO clear-query button.
 *
 * We removed the Clear button because accidental clicks could
 * destroy a user's SQL query.
 *
 * The SQL editor can simply be edited manually.
 */


/*
 * Status area below the SQL editor.
 */
const sandboxStatus =
    document.getElementById(
        "sandbox-status"
    );


/*
 * Results area.
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
 * Database creation modal.
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
 * Database explorer.
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
 * Buttons for table inspection.
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
 * sql.js module.
 *
 * Once initialized, this contains the SQLite engine.
 */
let SQL_ENGINE =
    null;


/*
 * Currently selected SQLite database.
 *
 * This is the actual sql.js Database object.
 */
let activeSQLiteDatabase =
    null;


/*
 * Name of the currently selected database.
 */
let activeDatabaseName =
    null;


/*
 * Stores all Sandbox databases.
 *
 * Structure:
 *
 * {
 *     "Database1": Uint8Array,
 *     "Database2": Uint8Array
 * }
 *
 * We keep exported SQLite databases in memory and persist them
 * to localStorage after changes.
 */
const sandboxDatabases =
    new Map();


/*
 * Most recently executed query result.
 *
 * Used by CSV download.
 */
let latestResults =
    null;


/*
 * Query tab state.
 */
let queryCounter =
    1;


/*
 * Stores the currently selected query.
 */
let activeQueryId =
    1;


/*
 * Stores SQL text for individual query tabs.
 *
 * Example:
 *
 * {
 *     1: "SELECT * FROM patients;",
 *     2: "SELECT * FROM doctors;"
 * }
 */
const queryContents =
    new Map();


/*
 * Currently selected table in Database Explorer.
 *
 * Describe / Schema / Relationships use this value.
 */
let selectedTableName =
    null;


/* ============================================================
 * INITIALIZATION
 * ============================================================ */

/*
 * Wait until the page has finished loading before initializing
 * the SQLite engine and Sandbox UI.
 */
document.addEventListener(
    "DOMContentLoaded",
    initializeSandbox
);


/*
 * ============================================================
 * INITIALIZE SANDBOX
 * ============================================================
 *
 * Main startup sequence:
 *
 *     1. Initialize SQLite.
 *     2. Load saved databases.
 *     3. Build Database Explorer.
 *     4. Initialize Query 1.
 *     5. Prepare results panel.
 *     6. Attach event listeners.
 * ============================================================
 */

async function initializeSandbox() {

    try {

        showStatus(
            "⏳ Initializing SQL engine...",
            "info"
        );


        /*
         * Initialize sql.js.
         */
        await initializeSQLite();


        /*
         * Load databases previously saved in the browser.
         */
        loadSavedDatabases();


        /*
         * Render Database Explorer.
         */
        renderDatabaseTree();


        /*
         * Initialize Query 1.
         */
        queryContents.set(
            1,
            ""
        );


        /*
         * Results should NOT occupy the workspace when
         * nothing has been executed.
         */
        hideResultsPanel();


        /*
         * Attach all UI events.
         */
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

    /*
     * Prevent duplicate initialization.
     */
    if (SQL_ENGINE) {

        return;

    }


    /*
     * sql.js is loaded by sandbox.html.
     *
     * The global SQL object should now exist.
     */
    if (
        typeof window.initSqlJs !==
        "function"
    ) {

        throw new Error(
            "sql.js could not be loaded."
        );

    }


    /*
     * Initialize sql.js and tell it where the WebAssembly
     * file is located.
     */
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
     * Save query text automatically whenever the user types.
     *
     * This prevents query text from disappearing when the user
     * switches between Query 1 / Query 2.
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
         * Ctrl + Enter / Cmd + Enter
         * runs the current query.
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


    /*
     * Enter key inside database name input
     * creates the database.
     */
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
        databaseNameInput.value.trim();


    if (!name) {

        showModalError(
            "Please enter a database name."
        );

        return;

    }


    /*
     * Basic database-name validation.
     *
     * SQLite allows many characters, but keeping database names
     * simple makes the Sandbox easier to use.
     */
    if (
        !/^[A-Za-z0-9_]+$/.test(name)
    ) {

        showModalError(
            "Use only letters, numbers and underscores."
        );

        return;

    }


    /*
     * Prevent duplicate databases.
     */
    if (
        sandboxDatabases.has(name)
    ) {

        showModalError(
            "A database with this name already exists."
        );

        return;

    }


    /*
     * Enforce planned Sandbox limit.
     */
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

        /*
         * Create a brand-new SQLite database.
         */
        const database =
            new SQL_ENGINE.Database();


        /*
         * Store the database.
         */
        sandboxDatabases.set(
            name,
            database.export()
        );


        /*
         * Make it active immediately.
         */
        activeSQLiteDatabase =
            database;

        activeDatabaseName =
            name;


        /*
         * Save to localStorage.
         */
        persistDatabases();


        /*
         * Refresh Database Explorer.
         */
        renderDatabaseTree();


        /*
         * Close modal.
         */
        closeDatabaseModalWindow();


        /*
         * Remove any old modal error.
         */
        removeModalError();


        /*
         * Hide old results because this is a new database.
         */
        hideResultsPanel();


        showStatus(
            "✅ Database '" +
            name +
            "' created successfully.",
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

        /*
         * Close previous active database object.
         */
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


        /*
         * Reconstruct SQLite database from exported bytes.
         */
        activeSQLiteDatabase =
            new SQL_ENGINE.Database(
                storedDatabase
            );


        activeDatabaseName =
            databaseName;


        /*
         * Refresh explorer so tables are visible.
         */
        renderDatabaseTree();


        /*
         * Hide results until another query is executed.
         */
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
 * EXECUTE CURRENT QUERY
 * ============================================================ */

function executeCurrentQuery() {

    /*
     * A query requires an active database.
     */
    if (
        !activeSQLiteDatabase
    ) {

        showStatus(
            "⚠️ Create or select a database first.",
            "error"
        );

        return;

    }


    /*
     * Save the current query before executing.
     */
    queryContents.set(
        activeQueryId,
        sqlEditor.value
    );


    const query =
        sqlEditor.value.trim();


    if (!query) {

        showStatus(
            "❌ Please enter a SQL query.",
            "error"
        );

        return;

    }


    const startTime =
        performance.now();


    try {

        /*
         * Execute the SQL statement.
         *
         * sql.js returns an array of result sets.
         */
        const rawResults =
            activeSQLiteDatabase.exec(
                query
            );


        const executionTime =
            Math.round(
                performance.now() -
                startTime
            );


        /*
         * Convert sql.js result into our standard result
         * structure.
         */
        const result =
            convertSQLiteResults(
                rawResults,
                executionTime
            );


        /*
         * Save database AFTER successful execution.
         *
         * This is critical for:
         *
         * CREATE TABLE
         * INSERT
         * UPDATE
         * DELETE
         * DROP TABLE
         *
         * etc.
         */
        saveActiveDatabase();


        /*
         * Refresh Database Explorer.
         *
         * This means newly created tables immediately appear
         * in the left sidebar.
         */
        renderDatabaseTree();


        /*
         * Display result only AFTER Run Query is clicked.
         */
        displaySandboxResults(
            result
        );


        /*
         * Results panel becomes visible after execution.
         */
        showResultsPanel();


        showStatus(
            "✅ Query executed successfully.",
            "success"
        );


        console.log(
            "SQL executed:",
            query
        );

    }

    catch (error) {

        console.error(
            "SQL execution error:",
            error
        );


        showStatus(
            "❌ SQL Error: " +
            getSQLiteErrorMessage(error),
            "error"
        );


        /*
         * Do not destroy previous results when a query fails.
         *
         * This is intentional.
         */
    }

}


/* ============================================================
 * CONVERT SQLITE RESULTS
 * ============================================================ */

function convertSQLiteResults(
    rawResults,
    executionTime
) {

    /*
     * SELECT normally produces one result set.
     *
     * CREATE / INSERT / UPDATE / DELETE may produce no result
     * set at all.
     */

    if (
        !Array.isArray(rawResults) ||
        rawResults.length === 0
    ) {

        return {

            columns: [],

            rows: [],

            executionTime:
                executionTime,

            isStatementOnly:
                true

        };

    }


    const result =
        rawResults[0];


    const columns =
        Array.isArray(result.columns)
            ? result.columns
            : [];


    const values =
        Array.isArray(result.values)
            ? result.values
            : [];


    const rows =
        values.map(
            function (row) {

                const object = {};


                columns.forEach(
                    function (
                        column,
                        index
                    ) {

                        object[column] =
                            row[index];

                    }
                );


                return object;

            }
        );


    return {

        columns:
            columns,

        rows:
            rows,

        executionTime:
            executionTime,

        isStatementOnly:
            false

    };

}


/* ============================================================
 * DISPLAY SANDBOX RESULTS
 * ============================================================ */

window.displaySandboxResults =
    function (data) {

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


        /*
         * Statements such as CREATE TABLE or INSERT do not return
         * rows.
         */
        if (
            data.isStatementOnly
        ) {

            resultsSummary.textContent =
                "Query executed successfully";


            resultsContainer.innerHTML = `

                <div class="empty-results">

                    <div class="empty-results-icon">
                        ✓
                    </div>

                    <p>
                        Query executed successfully.
                    </p>

                </div>

            `;


            if (
                downloadResultsButton
            ) {

                downloadResultsButton.disabled =
                    true;

            }


            return;

        }


        /*
         * Update summary.
         */
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


        /*
         * No rows.
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

            if (
                downloadResultsButton
            ) {

                downloadResultsButton.disabled =
                    true;

            }

            return;

        }


        /*
         * Build results table.
         */
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

                html += "<tr>";


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


                html += "</tr>";

            }
        );


        html += `

                </tbody>

            </table>

        `;


        resultsContainer.innerHTML =
            html;


        if (
            downloadResultsButton
        ) {

            downloadResultsButton.disabled =
                false;

        }

    };


/* ============================================================
 * SAVE ACTIVE DATABASE
 * ============================================================ */

function saveActiveDatabase() {

    if (
        !activeSQLiteDatabase ||
        !activeDatabaseName
    ) {

        return;

    }


    /*
     * Export current SQLite database.
     */
    const exported =
        activeSQLiteDatabase.export();


    /*
     * Update in-memory storage.
     */
    sandboxDatabases.set(
        activeDatabaseName,
        exported
    );


    /*
     * Persist to localStorage.
     */
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
                data,
                name
            ) {

                storageObject[name] =
                    uint8ArrayToBase64(
                        data
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
            "Failed to save Sandbox data:",
            error
        );


        showStatus(
            "⚠️ Sandbox data could not be saved.",
            "error"
        );

    }

}


/* ============================================================
 * LOAD SAVED DATABASES
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

        const storageObject =
            JSON.parse(
                stored
            );


        Object.keys(
            storageObject
        ).forEach(
            function (name) {

                const base64 =
                    storageObject[name];


                const bytes =
                    base64ToUint8Array(
                        base64
                    );


                sandboxDatabases.set(
                    name,
                    bytes
                );

            }
        );


        /*
         * Automatically open the first saved database.
         */
        const firstDatabase =
            sandboxDatabases.keys().next();


        if (
            !firstDatabase.done
        ) {

            openDatabase(
                firstDatabase.value
            );

        }

    }

    catch (error) {

        console.error(
            "Failed to load Sandbox databases:",
            error
        );


        localStorage.removeItem(
            SANDBOX_STORAGE_KEY
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
            bytes,
            databaseName
        ) {

            const databaseItem =
                document.createElement(
                    "div"
                );


            databaseItem.className =
                "database-item";


            databaseItem.dataset.database =
                databaseName;


            /*
             * Header.
             */
            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "database-header";


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


            /*
             * Table list.
             */
            const tableList =
                document.createElement(
                    "div"
                );


            tableList.className =
                "table-list";


            tableList.style.display =
                "none";


            /*
             * Get table names from SQLite.
             */
            const tables =
                getDatabaseTables(
                    databaseName,
                    bytes
                );


            tables.forEach(
                function (tableName) {

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
            );


            /*
             * Clicking database header opens database and
             * expands/collapses its table list.
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


                    const arrow =
                        header.querySelector(
                            ".database-arrow"
                        );


                    if (arrow) {

                        arrow.textContent =
                            isHidden
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

        }
    );

}


/* ============================================================
 * GET DATABASE TABLES
 * ============================================================ */

function getDatabaseTables(
    databaseName,
    bytes
) {

    try {

        const temporaryDatabase =
            new SQL_ENGINE.Database(
                bytes
            );


        const result =
            temporaryDatabase.exec(`

                SELECT name

                FROM sqlite_master

                WHERE type = 'table'

                AND name NOT LIKE 'sqlite_%'

                ORDER BY name;

            `);


        temporaryDatabase.close();


        if (
            !result.length
        ) {

            return [];

        }


        return result[0].values.map(
            function (row) {

                return row[0];

            }
        );

    }

    catch (error) {

        console.error(
            "Could not read tables:",
            error
        );


        return [];

    }

}


/* ============================================================
 * SELECT TABLE
 * ============================================================ */

function selectTable(
    databaseName,
    tableName
) {

    /*
     * Make selected database active.
     */
    openDatabase(
        databaseName
    );


    selectedTableName =
        tableName;


    /*
     * Put a useful SELECT query into editor.
     */
    if (sqlEditor) {

        sqlEditor.value =
            "SELECT *\n" +
            "FROM " +
            quoteIdentifier(
                tableName
            ) +
            ";";


        queryContents.set(
            activeQueryId,
            sqlEditor.value
        );


        sqlEditor.focus();

    }


    /*
     * Close mobile sidebar.
     */
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
 * DESCRIBE TABLE
 * ============================================================ */

function describeSelectedTable() {

    if (
        !activeSQLiteDatabase
    ) {

        showStatus(
            "⚠️ Select a database first.",
            "error"
        );

        return;

    }


    if (
        !selectedTableName
    ) {

        showStatus(
            "⚠️ Select a table first.",
            "error"
        );

        return;

    }


    try {

        const result =
            activeSQLiteDatabase.exec(`

                PRAGMA table_info(
                    ${quoteIdentifier(
                        selectedTableName
                    )}
                );

            `);


        const converted =
            convertSQLiteResults(
                result,
                0
            );


        displaySandboxResults(
            converted
        );


        showResultsPanel();


        showStatus(
            "ℹ️ Showing structure of '" +
            selectedTableName +
            "'.",
            "info"
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
 * SHOW SCHEMA
 * ============================================================ */

function showSelectedTableSchema() {

    if (
        !activeSQLiteDatabase
    ) {

        showStatus(
            "⚠️ Select a database first.",
            "error"
        );

        return;

    }


    if (
        !selectedTableName
    ) {

        showStatus(
            "⚠️ Select a table first.",
            "error"
        );

        return;

    }


    try {

        const result =
            activeSQLiteDatabase.exec(`

                SELECT
                    sql

                FROM sqlite_master

                WHERE type = 'table'

                AND name = ${sqlStringLiteral(
                    selectedTableName
                )};

            `);


        const converted =
            convertSQLiteResults(
                result,
                0
            );


        displaySandboxResults(
            converted
        );


        showResultsPanel();


        showStatus(
            "ℹ️ Showing schema for '" +
            selectedTableName +
            "'.",
            "info"
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
 * SHOW TABLE RELATIONSHIPS
 * ============================================================ */

function showSelectedTableRelationships() {

    if (
        !activeSQLiteDatabase
    ) {

        showStatus(
            "⚠️ Select a database first.",
            "error"
        );

        return;

    }


    if (
        !selectedTableName
    ) {

        showStatus(
            "⚠️ Select a table first.",
            "error"
        );

        return;

    }


    try {

        const result =
            activeSQLiteDatabase.exec(`

                PRAGMA foreign_key_list(
                    ${quoteIdentifier(
                        selectedTableName
                    )}
                );

            `);


        const converted =
            convertSQLiteResults(
                result,
                0
            );


        if (
            converted.columns.length === 0
        ) {

            converted.columns =
                [
                    "Relationship"
                ];


            converted.rows =
                [
                    {
                        Relationship:
                            "No foreign-key relationships found."
                    }
                ];

        }


        displaySandboxResults(
            converted
        );


        showResultsPanel();


        showStatus(
            "🔗 Showing relationships for '" +
            selectedTableName +
            "'.",
            "info"
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
 * SEARCH DATABASE TREE
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
            function (databaseItem) {

                const databaseName =
                    (
                        databaseItem
                            .dataset
                            .database ||
                        ""
                    )
                    .toLowerCase();


                const tables =
                    databaseItem.querySelectorAll(
                        ".table-item"
                    );


                let databaseMatches =
                    databaseName.includes(
                        search
                    );


                let tableMatches =
                    false;


                tables.forEach(
                    function (table) {

                        const tableName =
                            (
                                table
                                    .dataset
                                    .table ||
                                ""
                            )
                            .toLowerCase();


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


                databaseItem.style.display =
                    (
                        !search ||
                        databaseMatches ||
                        tableMatches
                    )
                        ? "block"
                        : "none";


                /*
                 * Automatically expand matching databases.
                 */
                if (
                    search &&
                    tableMatches
                ) {

                    const tableList =
                        databaseItem.querySelector(
                            ".table-list"
                        );


                    if (tableList) {

                        tableList.style.display =
                            "block";

                    }

                }

            }
        );

}


/* ============================================================
 * QUERY TABS
 * ============================================================ */

function createNewQueryTab() {

    /*
     * Save current query.
     */
    if (sqlEditor) {

        queryContents.set(
            activeQueryId,
            sqlEditor.value
        );

    }


    queryCounter++;


    const newId =
        queryCounter;


    queryContents.set(
        newId,
        ""
    );


    /*
     * Create tab button.
     */
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

    `;


    /*
     * Put the new tab BEFORE the + button.
     */
    queryTabs.insertBefore(
        tab,
        newQueryButton
    );


    tab.addEventListener(
        "click",
        function () {

            switchQueryTab(
                newId
            );

        }
    );


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
     * Save current query.
     */
    queryContents.set(
        activeQueryId,
        sqlEditor.value
    );


    activeQueryId =
        queryId;


    /*
     * Load selected query.
     */
    sqlEditor.value =
        queryContents.get(
            queryId
        ) ||
        "";


    /*
     * Update active tab styling.
     */
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
                    ) ===
                    queryId
                );

            }
        );


    /*
     * Results remain hidden until this query is executed.
     *
     * This keeps the editor focused and prevents old results
     * from taking workspace space unnecessarily.
     */
    hideResultsPanel();


    sqlEditor.focus();

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

}


function hideResultsPanel() {

    if (!resultsSection) {

        return;

    }


    resultsSection.classList.remove(
        "results-visible"
    );

}


/*
 * Public function for future UI controls.
 *
 * We can connect this later to:
 *
 * - maximize
 * - minimize
 * - drag resize
 *
 * similar to Snowflake's results panel.
 */
window.toggleSandboxResults =
    function () {

        if (!resultsSection) {

            return;

        }


        resultsSection.classList.toggle(
            "results-visible"
        );

    };


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
 * DATABASE MODAL
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
     * Rows.
     */
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
 * SQL IDENTIFIER QUOTING
 * ============================================================
 *
 * Used when table names are inserted into SQL.
 *
 * Example:
 *
 *     Patients
 *
 * becomes:
 *
 *     "Patients"
 *
 * This prevents table names containing reserved words or
 * special characters from breaking generated SQL.
 * ============================================================
 */

function quoteIdentifier(
    identifier
) {

    return (
        '"' +
        String(identifier)
            .replace(
                /"/g,
                '""'
            ) +
        '"'
    );

}


/* ============================================================
 * SQL STRING LITERAL
 * ============================================================
 *
 * Used when a value needs to be inserted safely into SQL.
 *
 * Example:
 *
 *     O'Reilly
 *
 * becomes:
 *
 *     'O''Reilly'
 * ============================================================
 */

function sqlStringLiteral(
    value
) {

    return (
        "'" +
        String(value)
            .replace(
                /'/g,
                "''"
            ) +
        "'"
    );

}


/* ============================================================
 * SQLITE ERROR MESSAGE
 * ============================================================ */

function getSQLiteErrorMessage(
    error
) {

    if (!error) {

        return "Unknown SQL error.";

    }


    return (
        error.message ||
        String(error)
    );

}


/* ============================================================
 * BASE64 UTILITIES
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
                Math.min(
                    i + chunkSize,
                    bytes.length
                )
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
 * INITIAL DATABASE TREE STATE
 * ============================================================ */

/*
 * The initial HTML already contains Query 1.
 *
 * We intentionally do not execute anything automatically.
 *
 * The user must:
 *
 *     1. Create/select a database.
 *     2. Write SQL.
 *     3. Click Run Query.
 *
 * Only then will the results panel appear.
 */


/* ============================================================
 * GLOBAL DEBUG HELPERS
 * ============================================================
 *
 * These are useful during development.
 *
 * Browser console:
 *
 *     window.getSandboxState()
 *
 * will return useful information about the current Sandbox.
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
                selectedTableName

        };

    };


/* ============================================================
 * FINAL STARTUP LOG
 * ============================================================ */

console.log(
    "✅ sandbox.js loaded."
);

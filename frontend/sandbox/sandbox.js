/*
 * ============================================================
 * SQL SANDBOX
 * ============================================================
 *
 * PURPOSE
 * -------
 * This file controls the SQL Sandbox experience.
 *
 * CURRENT FEATURES
 * ----------------
 * 1. SQLite runs directly inside the browser using sql.js.
 * 2. Multiple databases can be created.
 * 3. Databases are persisted in localStorage.
 * 4. Databases can be created through the UI.
 * 5. Databases can also be created through SQL.
 * 6. Databases can be dropped through SQL.
 * 7. USE database_name switches the active database.
 * 8. CREATE TABLE works inside the active database.
 * 9. DROP TABLE works inside the active database.
 * 10. INSERT / UPDATE / DELETE work.
 * 11. SELECT queries return visible results.
 * 12. Multiple SQL statements separated by ; are supported.
 * 13. Database Explorer refreshes automatically.
 * 14. Tables appear/disappear automatically after DDL.
 * 15. Query tabs are supported.
 * 16. Query 2+ can be closed.
 * 17. Results panel appears only after query execution.
 * 18. Results can be downloaded as CSV.
 * 19. Describe / Schema / Relationships are supported.
 * 20. Mobile database sidebar is supported.
 *
 * IMPORTANT
 * ---------
 * This is a browser-based SQL Sandbox.
 *
 * No Node.js server is required for this stage.
 * No backend API is required for this stage.
 *
 * ============================================================
 */


/* ============================================================
 * CONFIGURATION
 * ============================================================ */

/*
 * sql.js WebAssembly location.
 */
const SQLITE_WASM_PATH =
    "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/";


/*
 * localStorage key used for Sandbox persistence.
 */
const SANDBOX_STORAGE_KEY =
    "sql_learning_platform_sandbox";


/*
 * Maximum number of databases allowed.
 */
const MAX_DATABASES =
    2;


/*
 * Maximum number of tables per database.
 */
const MAX_TABLES_PER_DATABASE =
    10;


/*
 * Maximum number of rows allowed in a table.
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
 * Currently open SQLite database.
 */
let activeSQLiteDatabase =
    null;


/*
 * Name of currently selected database.
 */
let activeDatabaseName =
    null;


/*
 * Database storage.
 *
 * Each database is stored as:
 *
 *     databaseName -> Uint8Array
 *
 * The Uint8Array is produced by SQLite export().
 */
const sandboxDatabases =
    new Map();


/*
 * Last query result.
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
 * Stores query text for every query tab.
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


/*
 * ============================================================
 * INITIALIZE SANDBOX
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
            "Sandbox initialization failed:",
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
     * CREATE DATABASE BUTTON
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
     * SQL EDITOR
     * -------------------------------------------------------- */

    if (sqlEditor) {

        /*
         * Save query automatically while typing.
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
         * Ctrl + Enter / Cmd + Enter executes query.
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


    /* --------------------------------------------------------
     * INSPECTION BUTTONS
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

                /*
                 * Before switching databases, save the current
                 * database so no recent changes are lost.
                 */
                saveActiveDatabase();

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
 * EXECUTE CURRENT QUERY
 * ============================================================
 *
 * IMPORTANT
 * ---------
 * This function supports MULTIPLE SQL statements.
 *
 * Example:
 *
 * USE testdb;
 *
 * CREATE TABLE users (
 *     id INTEGER,
 *     name TEXT
 * );
 *
 * INSERT INTO users
 * VALUES (1, 'Jayant');
 *
 * SELECT *
 * FROM users;
 *
 * All statements are processed in order.
 *
 * ============================================================
 */

function executeCurrentQuery() {

    if (!SQL_ENGINE) {

        showStatus(
            "❌ SQL engine is not ready.",
            "error"
        );

        return;

    }


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


    queryContents.set(
        activeQueryId,
        sqlEditor.value
    );


    /*
     * If the user did not explicitly select a database,
     * try to find a database automatically.
     *
     * If there is exactly one database, use it.
     */
    if (
        !activeSQLiteDatabase &&
        sandboxDatabases.size === 1
    ) {

        const onlyDatabase =
            Array.from(
                sandboxDatabases.keys()
            )[0];


        openDatabase(
            onlyDatabase
        );

    }


    /*
     * Split SQL safely enough for normal Sandbox usage.
     *
     * We avoid splitting semicolons that occur inside:
     *
     *     'strings'
     *     "strings"
     *
     * This is important for INSERT statements.
     */
    const statements =
        splitSQLStatements(
            query
        );


    if (!statements.length) {

        showStatus(
            "❌ No SQL statement found.",
            "error"
        );

        return;

    }


    let lastSelectResult =
        null;


    let totalAffectedRows =
        0;


    let executedCount =
        0;


    const startedAt =
        performance.now();


    try {

        /*
         * Process statements sequentially.
         */
        for (
            let i = 0;
            i < statements.length;
            i++
        ) {

            const statement =
                statements[i].trim();


            if (!statement) {

                continue;

            }


            /*
             * ------------------------------------------------
             * USE DATABASE
             * ------------------------------------------------
             */

            if (
                isUseDatabaseStatement(
                    statement
                )
            ) {

                const databaseName =
                    extractUseDatabaseName(
                        statement
                    );


                handleUseDatabase(
                    databaseName
                );


                executedCount++;


                continue;

            }


            /*
             * ------------------------------------------------
             * CREATE DATABASE
             * ------------------------------------------------
             */

            if (
                isCreateDatabaseStatement(
                    statement
                )
            ) {

                const databaseName =
                    extractCreateDatabaseName(
                        statement
                    );


                createDatabaseFromSQL(
                    databaseName
                );


                executedCount++;


                continue;

            }


            /*
             * ------------------------------------------------
             * DROP DATABASE
             * ------------------------------------------------
             */

            if (
                isDropDatabaseStatement(
                    statement
                )
            ) {

                const databaseName =
                    extractDropDatabaseName(
                        statement
                    );


                dropDatabaseFromSQL(
                    databaseName
                );


                executedCount++;


                continue;

            }


            /*
             * ------------------------------------------------
             * Normal SQLite statement.
             * ------------------------------------------------
             */

            if (!activeSQLiteDatabase) {

                throw new Error(
                    "No database selected. Use 'USE database_name;' first."
                );

            }


            const result =
                executeSQLiteStatement(
                    statement
                );


            executedCount++;


            /*
             * SELECT / PRAGMA results.
             */
            if (
                result &&
                Array.isArray(
                    result.columns
                )
            ) {

                lastSelectResult =
                    result;

            }


            /*
             * DML affected-row count.
             */
            if (
                result &&
                typeof result.affectedRows ===
                "number"
            ) {

                totalAffectedRows +=
                    result.affectedRows;

            }


            /*
             * Refresh explorer after structural
             * operations such as CREATE/DROP TABLE.
             */
            if (
                isSchemaChangingStatement(
                    statement
                )
            ) {

                refreshActiveDatabaseStorage();


                renderDatabaseTree();

            }

        }


        /*
         * Save all changes after successful execution.
         */
        saveActiveDatabase();


        persistDatabases();


        /*
         * If a SELECT statement occurred anywhere in the
         * submitted batch, display its result.
         *
         * Example:
         *
         * INSERT ...;
         * SELECT * FROM users;
         */
        if (lastSelectResult) {

            lastSelectResult.executionTime =
                Math.round(
                    performance.now() -
                    startedAt
                );


            displaySandboxResults(
                lastSelectResult
            );

        }

        else {

            /*
             * DDL / DML statements do not produce a traditional
             * table result, so we still show a useful execution
             * result instead of leaving the old SELECT result
             * visible.
             */
            displayExecutionSummary({

                statements:
                    executedCount,

                affectedRows:
                    totalAffectedRows,

                executionTime:
                    Math.round(
                        performance.now() -
                        startedAt
                    )

            });

        }


        showResultsPanel();


        showStatus(
            "✅ Query executed successfully.",
            "success"
        );


        /*
         * If tables changed, refresh the explorer one more time.
         */
        renderDatabaseTree();

    }

    catch (error) {

        console.error(
            "SQL execution failed:",
            error
        );


        displayExecutionError(
            error
        );


        showResultsPanel();


        showStatus(
            "❌ " +
            error.message,
            "error"
        );

    }

}


/* ============================================================
 * EXECUTE ONE SQLITE STATEMENT
 * ============================================================ */

function executeSQLiteStatement(
    statement
) {

    const normalized =
        statement
            .trim()
            .replace(
                /;\s*$/,
                ""
            );


    /*
     * SELECT / PRAGMA / EXPLAIN can return rows.
     */
    if (
        /^(SELECT|PRAGMA|EXPLAIN|WITH)\b/i.test(
            normalized
        )
    ) {

        const result =
            activeSQLiteDatabase.exec(
                normalized
            );


        if (
            !result.length
        ) {

            return {

                columns: [],

                rows: [],

                affectedRows: 0

            };

        }


        const firstResult =
            result[0];


        const rows =
            firstResult.values.map(
                function (values) {

                    const row = {};


                    firstResult.columns.forEach(
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


        return {

            columns:
                firstResult.columns,

            rows:
                rows,

            affectedRows:
                0

        };

    }


    /*
     * DDL / DML.
     */
    activeSQLiteDatabase.run(
        normalized
    );


    /*
     * SQLite does not directly expose affected-row
     * information through run(), so changes() is used.
     */
    let affectedRows =
        0;


    try {

        const changesResult =
            activeSQLiteDatabase.exec(
                "SELECT changes() AS affected_rows;"
            );


        if (
            changesResult.length &&
            changesResult[0].values.length
        ) {

            affectedRows =
                Number(
                    changesResult[0].values[0][0]
                );

        }

    }

    catch (error) {

        console.warn(
            "Could not calculate affected rows:",
            error
        );

    }


    return {

        columns: [],

        rows: [],

        affectedRows:
            affectedRows

    };

}


/* ============================================================
 * USE DATABASE
 * ============================================================ */

function handleUseDatabase(
    databaseName
) {

    const cleanName =
        databaseName.trim();


    if (
        !cleanName
    ) {

        throw new Error(
            "Database name is missing in USE statement."
        );

    }


    /*
     * If database already exists, simply open it.
     */
    if (
        sandboxDatabases.has(
            cleanName
        )
    ) {

        openDatabase(
            cleanName
        );


        return;

    }


    /*
     * SQLite itself does not have separate database files
     * in this browser architecture.
     *
     * Therefore USE only works with Sandbox databases that
     * already exist.
     */
    throw new Error(
        "Database '" +
        cleanName +
        "' does not exist."
    );

}


/* ============================================================
 * CREATE DATABASE FROM SQL
 * ============================================================ */

function createDatabaseFromSQL(
    databaseName
) {

    const name =
        databaseName.trim();


    if (
        !/^[A-Za-z0-9_]+$/.test(name)
    ) {

        throw new Error(
            "Invalid database name: " +
            name
        );

    }


    if (
        sandboxDatabases.has(name)
    ) {

        /*
         * CREATE DATABASE IF NOT EXISTS should not fail.
         */
        return;

    }


    if (
        sandboxDatabases.size >=
        MAX_DATABASES
    ) {

        throw new Error(
            "Maximum database limit reached."
        );

    }


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


    showStatus(
        "✅ Database '" +
        name +
        "' created and selected.",
        "success"
    );

}


/* ============================================================
 * DROP DATABASE FROM SQL
 * ============================================================ */

function dropDatabaseFromSQL(
    databaseName
) {

    const name =
        databaseName.trim();


    if (
        !sandboxDatabases.has(name)
    ) {

        throw new Error(
            "Database '" +
            name +
            "' does not exist."
        );

    }


    /*
     * Close active SQLite object if dropping the
     * currently selected database.
     */
    if (
        activeDatabaseName ===
        name
    ) {

        if (
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

        }


        activeSQLiteDatabase =
            null;


        activeDatabaseName =
            null;


        selectedTableName =
            null;

    }


    sandboxDatabases.delete(
        name
    );


    persistDatabases();


    renderDatabaseTree();


    showStatus(
        "✅ Database '" +
        name +
        "' dropped.",
        "success"
    );

}


/* ============================================================
 * CREATE TABLE / DROP TABLE DETECTION
 * ============================================================ */

function isSchemaChangingStatement(
    statement
) {

    return (
        /^(CREATE\s+TABLE|DROP\s+TABLE|ALTER\s+TABLE|CREATE\s+INDEX|DROP\s+INDEX)\b/i.test(
            statement.trim()
        )
    );

}


/* ============================================================
 * DATABASE STORAGE REFRESH
 * ============================================================ */

function refreshActiveDatabaseStorage() {

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

}


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


    refreshActiveDatabaseStorage();

    persistDatabases();

}


/* ============================================================
 * PERSIST DATABASES
 * ============================================================ */

function persistDatabases() {

    try {

        const storageObject = {};


        sandboxDatabases.forEach(
            function (
                bytes,
                name
            ) {

                storageObject[name] =
                    uint8ArrayToBase64(
                        bytes
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
        ).forEach(
            function (
                name
            ) {

                sandboxDatabases.set(
                    name,
                    base64ToUint8Array(
                        storageObject[name]
                    )
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Failed to load saved databases:",
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
        sandboxDatabases.size ===
        0
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
                activeDatabaseName ===
                databaseName;


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

            `;


            if (isActive) {

                header.style.color =
                    "#60a5fa";

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


            /*
             * Load a temporary SQLite instance only
             * to inspect the database schema.
             */
            let inspectionDatabase =
                null;


            try {

                inspectionDatabase =
                    new SQL_ENGINE.Database(
                        storedBytes
                    );


                const tableResult =
                    inspectionDatabase.exec(`

                        SELECT
                            name
                        FROM sqlite_master
                        WHERE type = 'table'
                        AND name NOT LIKE 'sqlite_%'
                        ORDER BY name;

                    `);


                if (
                    tableResult.length
                ) {

                    tableResult[0].values.forEach(
                        function (
                            value
                        ) {

                            const tableName =
                                value[0];


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
                                function (
                                    event
                                ) {

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

                }

            }

            catch (error) {

                console.error(
                    "Could not inspect database:",
                    databaseName,
                    error
                );

            }

            finally {

                if (
                    inspectionDatabase
                ) {

                    try {

                        inspectionDatabase.close();

                    }

                    catch (error) {

                        console.warn(
                            "Inspection database close warning:",
                            error
                        );

                    }

                }

            }


            /*
             * Database header click:
             *
             * 1. Select database.
             * 2. Expand/collapse tables.
             */
            header.addEventListener(
                "click",
                function () {

                    openDatabase(
                        databaseName
                    );


                    /*
                     * After openDatabase(), renderDatabaseTree()
                     * may have recreated the tree.
                     *
                     * Therefore we don't manipulate the old
                     * DOM tree after opening the database.
                     */

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
     * Populate a simple SELECT query.
     */
    if (sqlEditor) {

        sqlEditor.value =
            "SELECT *\nFROM " +
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


    showStatus(
        "📋 Table '" +
        tableName +
        "' selected.",
        "info"
    );


    if (databaseSidebar) {

        databaseSidebar.classList.remove(
            "mobile-open"
        );

    }

}


/* ============================================================
 * FILTER DATABASE TREE
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
                        databaseItem
                            .querySelector(
                                ".database-name"
                            )
                            ?.textContent ||
                        ""
                    )
                        .toLowerCase();


                const tables =
                    databaseItem.querySelectorAll(
                        ".table-item"
                    );


                let tableMatch =
                    false;


                tables.forEach(
                    function (
                        table
                    ) {

                        const name =
                            (
                                table.textContent ||
                                ""
                            )
                                .toLowerCase();


                        const matches =
                            name.includes(
                                search
                            );


                        table.style.display =
                            matches
                                ? "flex"
                                : "none";


                        if (matches) {

                            tableMatch =
                                true;

                        }

                    }
                );


                databaseItem.style.display =
                    (
                        !search ||
                        databaseName.includes(search) ||
                        tableMatch
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


    const newQueryId =
        queryCounter;


    queryContents.set(
        newQueryId,
        ""
    );


    if (!queryTabs) {

        return;

    }


    /*
     * Create tab wrapper.
     */
    const tab =
        document.createElement(
            "button"
        );


    tab.className =
        "query-tab";


    tab.dataset.queryId =
        String(
            newQueryId
        );


    tab.type =
        "button";


    tab.innerHTML = `

        <span class="query-tab-name">
            Query ${newQueryId}
        </span>

        <span
            class="query-tab-close"
            title="Close Query"
        >
            ×
        </span>

    `;


    /*
     * Clicking the close button closes the query.
     */
    const closeButton =
        tab.querySelector(
            ".query-tab-close"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();


                closeQueryTab(
                    newQueryId,
                    tab
                );

            }
        );

    }


    /*
     * Clicking the rest of the tab activates it.
     */
    tab.addEventListener(
        "click",
        function () {

            activateQueryTab(
                newQueryId
            );

        }
    );


    /*
     * Insert before the + button.
     */
    if (newQueryButton) {

        queryTabs.insertBefore(
            tab,
            newQueryButton
        );

    }

    else {

        queryTabs.appendChild(
            tab
        );

    }


    activateQueryTab(
        newQueryId
    );

}


/* ============================================================
 * ACTIVATE QUERY TAB
 * ============================================================ */

function activateQueryTab(
    queryId
) {

    /*
     * Save current editor content.
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
     * Restore selected query content.
     */
    if (sqlEditor) {

        sqlEditor.value =
            queryContents.get(
                queryId
            ) || "";

        sqlEditor.focus();

    }


    /*
     * Update active tab styling.
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
                    ) ===
                    queryId
                );

            }
        );

}


/* ============================================================
 * CLOSE QUERY TAB
 * ============================================================ */

function closeQueryTab(
    queryId,
    tab
) {

    /*
     * Query 1 is the permanent first query.
     */
    if (
        queryId === 1
    ) {

        showStatus(
            "ℹ️ Query 1 cannot be closed.",
            "info"
        );

        return;

    }


    const wasActive =
        activeQueryId ===
        queryId;


    queryContents.delete(
        queryId
    );


    if (tab) {

        tab.remove();

    }


    /*
     * If the closed query was active,
     * activate the nearest remaining query.
     */
    if (wasActive) {

        const remainingTabs =
            Array.from(
                document.querySelectorAll(
                    ".query-tab"
                )
            )
                .filter(
                    function (
                        item
                    ) {

                        return (
                            Number(
                                item.dataset.queryId
                            ) !==
                            queryId
                        );

                    }
                );


        if (remainingTabs.length) {

            const target =
                remainingTabs[
                    remainingTabs.length - 1
                ];


            activateQueryTab(
                Number(
                    target.dataset.queryId
                )
            );

        }

    }


    showStatus(
        "Query " +
        queryId +
        " closed.",
        "info"
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


    if (!databaseNameInput) {

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
 * RESULTS PANEL
 * ============================================================ */

/*
 * Results are hidden initially.
 *
 * The panel appears only after Run Query.
 */
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

}


/*
 * Show results after execution.
 */
function showResultsPanel() {

    if (!resultsSection) {

        return;

    }


    resultsSection.classList.remove(
        "results-hidden"
    );


    resultsSection.classList.add(
        "results-visible"
    );

}


/* ============================================================
 * DISPLAY SELECT RESULTS
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


    showResultsPanel();

}


/* ============================================================
 * DISPLAY EXECUTION SUMMARY
 * ============================================================ */

function displayExecutionSummary(
    data
) {

    latestResults =
        null;


    if (downloadResultsButton) {

        downloadResultsButton.disabled =
            true;

    }


    if (resultsSummary) {

        resultsSummary.textContent =
            data.statements +
            " statement" +
            (
                data.statements === 1
                    ? ""
                    : "s"
            ) +
            " executed • " +
            data.executionTime +
            " ms";

    }


    if (!resultsContainer) {

        return;

    }


    resultsContainer.innerHTML = `

        <div class="empty-results">

            <div class="empty-results-icon">
                ✓
            </div>

            <p>
                ${data.statements}
                SQL statement${data.statements === 1 ? "" : "s"}
                executed successfully.
                ${
                    data.affectedRows > 0
                        ? data.affectedRows +
                          " row(s) affected."
                        : ""
                }
            </p>

        </div>

    `;


    showResultsPanel();

}


/* ============================================================
 * DISPLAY SQL ERROR
 * ============================================================ */

function displayExecutionError(
    error
) {

    latestResults =
        null;


    if (downloadResultsButton) {

        downloadResultsButton.disabled =
            true;

    }


    if (resultsSummary) {

        resultsSummary.textContent =
            "Query failed";

    }


    if (resultsContainer) {

        resultsContainer.innerHTML = `

            <div class="empty-results">

                <div
                    class="empty-results-icon"
                    style="color:#f87171;"
                >
                    ⚠
                </div>

                <p style="color:#f87171;">
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;

    }


    showResultsPanel();

}


/* ============================================================
 * CLEAR / HIDE RESULTS
 * ============================================================ */

function clearResults() {

    latestResults =
        null;


    if (resultsContainer) {

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


    if (resultsSummary) {

        resultsSummary.textContent =
            "No query executed";

    }


    if (downloadResultsButton) {

        downloadResultsButton.disabled =
            true;

    }


    hideResultsPanel();

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


    const lines = [];


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
        String(value);


    return '"' +
        stringValue.replace(
            /"/g,
            '""'
        ) +
        '"';

}


/* ============================================================
 * SQL STATEMENT SPLITTER
 * ============================================================
 *
 * Splits statements using semicolon while preserving
 * semicolons inside quoted strings.
 *
 * Example:
 *
 * INSERT INTO users
 * VALUES ('John;Smith');
 *
 * remains one statement.
 * ============================================================
 */

function splitSQLStatements(
    sql
) {

    const statements = [];


    let current =
        "";


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


        /*
         * Handle escaped characters.
         */
        if (escaped) {

            current +=
                char;

            escaped =
                false;

            continue;

        }


        /*
         * Backslash escape.
         */
        if (
            char === "\\" &&
            quote
        ) {

            current +=
                char;

            escaped =
                true;

            continue;

        }


        /*
         * Start/end quote.
         */
        if (
            char === "'" ||
            char === '"'
        ) {

            if (!quote) {

                quote =
                    char;

            }

            else if (
                quote ===
                char
            ) {

                /*
                 * SQL uses doubled quotes to escape
                 * quotes inside strings.
                 */
                if (
                    sql[i + 1] ===
                    char
                ) {

                    current +=
                        char;

                    current +=
                        sql[i + 1];

                    i++;

                    continue;

                }


                quote =
                    null;

            }


            current +=
                char;

            continue;

        }


        /*
         * Semicolon outside a string means
         * end of SQL statement.
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
 * USE DATABASE DETECTION
 * ============================================================ */

function isUseDatabaseStatement(
    statement
) {

    return /^USE\s+/i.test(
        statement.trim()
    );

}


function extractUseDatabaseName(
    statement
) {

    const match =
        statement
            .trim()
            .match(
                /^USE\s+(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?\s*$/i
            );


    if (!match) {

        throw new Error(
            "Invalid USE database syntax."
        );

    }


    return match[1];

}


/* ============================================================
 * CREATE DATABASE DETECTION
 * ============================================================ */

function isCreateDatabaseStatement(
    statement
) {

    return /^CREATE\s+DATABASE\b/i.test(
        statement.trim()
    );

}


function extractCreateDatabaseName(
    statement
) {

    const match =
        statement
            .trim()
            .match(
                /^CREATE\s+DATABASE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?\s*$/i
            );


    if (!match) {

        throw new Error(
            "Invalid CREATE DATABASE syntax."
        );

    }


    return match[1];

}


/* ============================================================
 * DROP DATABASE DETECTION
 * ============================================================ */

function isDropDatabaseStatement(
    statement
) {

    return /^DROP\s+DATABASE\b/i.test(
        statement.trim()
    );

}


function extractDropDatabaseName(
    statement
) {

    const match =
        statement
            .trim()
            .match(
                /^DROP\s+DATABASE\s+(?:IF\s+EXISTS\s+)?(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?\s*$/i
            );


    if (!match) {

        throw new Error(
            "Invalid DROP DATABASE syntax."
        );

    }


    return match[1];

}


/* ============================================================
 * QUOTE SQL IDENTIFIER
 * ============================================================ */

function quoteIdentifier(
    value
) {

    return '"' +
        String(value)
            .replace(
                /"/g,
                '""'
            ) +
        '"';

}


/* ============================================================
 * DESCRIBE TABLE
 * ============================================================ */

function describeSelectedTable() {

    if (
        !activeSQLiteDatabase
    ) {

        showStatus(
            "❌ Select a database first.",
            "error"
        );

        return;

    }


    if (
        !selectedTableName
    ) {

        showStatus(
            "❌ Select a table first.",
            "error"
        );

        return;

    }


    try {

        const result =
            activeSQLiteDatabase.exec(
                "PRAGMA table_info(" +
                quoteIdentifier(
                    selectedTableName
                ) +
                ");"
            );


        const columns =
            [
                "cid",
                "name",
                "type",
                "notnull",
                "default_value",
                "pk"
            ];


        const rows =
            result.length
                ? result[0].values.map(
                    function (
                        values
                    ) {

                        return {

                            cid:
                                values[0],

                            name:
                                values[1],

                            type:
                                values[2],

                            notnull:
                                values[3],

                            default_value:
                                values[4],

                            pk:
                                values[5]

                        };

                    }
                )
                : [];


        displaySandboxResults({

            columns:
                columns,

            rows:
                rows,

            executionTime:
                0

        });


        showResultsPanel();

    }

    catch (error) {

        displayExecutionError(
            error
        );

    }

}


/* ============================================================
 * SHOW TABLE SCHEMA
 * ============================================================ */

function showSelectedTableSchema() {

    if (
        !activeSQLiteDatabase
    ) {

        showStatus(
            "❌ Select a database first.",
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
                AND name = '${escapeSQLString(
                    selectedTableName || ""
                )}';

            `);


        if (
            !result.length ||
            !result[0].values.length
        ) {

            throw new Error(
                "Table schema not found."
            );

        }


        displaySandboxResults({

            columns:
                [
                    "table",
                    "schema"
                ],

            rows:
                [
                    {

                        table:
                            selectedTableName,

                        schema:
                            result[0]
                                .values[0][0]

                    }

                ],

            executionTime:
                0

        });

    }

    catch (error) {

        displayExecutionError(
            error
        );

    }

}


/* ============================================================
 * TABLE RELATIONSHIPS
 * ============================================================ */

function showSelectedTableRelationships() {

    if (
        !activeSQLiteDatabase
    ) {

        showStatus(
            "❌ Select a database first.",
            "error"
        );

        return;

    }


    if (
        !selectedTableName
    ) {

        showStatus(
            "❌ Select a table first.",
            "error"
        );

        return;

    }


    try {

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

            displayExecutionSummary({

                statements:
                    1,

                affectedRows:
                    0,

                executionTime:
                    0

            });


            if (resultsContainer) {

                resultsContainer.innerHTML = `

                    <div class="empty-results">

                        <div class="empty-results-icon">
                            🔗
                        </div>

                        <p>
                            No foreign-key relationships found.
                        </p>

                    </div>

                `;

            }


            return;

        }


        const columns =
            [
                "id",
                "seq",
                "table",
                "from",
                "to",
                "on_update",
                "on_delete"
            ];


        const rows =
            result[0].values.map(
                function (
                    values
                ) {

                    return {

                        id:
                            values[0],

                        seq:
                            values[1],

                        table:
                            values[2],

                        from:
                            values[3],

                        to:
                            values[4],

                        on_update:
                            values[5],

                        on_delete:
                            values[6]

                    };

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

    }

    catch (error) {

        displayExecutionError(
            error
        );

    }

}


/* ============================================================
 * ESCAPE SQL STRING
 * ============================================================ */

function escapeSQLString(
    value
) {

    return String(value)
        .replace(
            /'/g,
            "''"
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
 * BASE64 CONVERSION
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

        binary += String.fromCharCode.apply(
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
 * BASE64 TO UINT8ARRAY
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
 * GLOBAL DEBUG HELPER
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
 * INITIAL STARTUP
 * ============================================================ */

console.log(
    "✅ sandbox.js loaded."
);

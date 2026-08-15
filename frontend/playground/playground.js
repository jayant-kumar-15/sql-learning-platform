/*
 * ============================================================
 * FILE PATH
 * ============================================================
 * frontend/playground/playground.js
 *
 * ============================================================
 * PURPOSE
 * ============================================================
 * Read-only SQL Playground for the SQL Learning Platform.
 *
 * The Playground is intended for practicing SQL against
 * platform-provided learning databases.
 *
 * Unlike Sandbox:
 * - Users cannot create databases.
 * - Users cannot modify database structure.
 * - Users cannot INSERT / UPDATE / DELETE learning data.
 * - Users can execute practice/read queries.
 *
 * ============================================================
 * MAIN FEATURES
 * ============================================================
 *
 * 1. Load learning databases from backend.
 * 2. Display databases and tables in Database Explorer.
 * 3. Select database from the explorer.
 * 4. Persist last active database in browser storage.
 * 5. Support:
 *
 *        USE database_name;
 *
 *    as a client-side command.
 *
 * 6. Support:
 *
 *        SHOW DATABASES;
 *        SHOW TABLES;
 *        DESCRIBE table_name;
 *        DESC table_name;
 *
 *    through Playground compatibility handling.
 *
 * 7. Execute multiple SQL statements separated by semicolon.
 * 8. Execute statement under cursor.
 * 9. Execute selected statement when text is selected.
 * 10. Execute entire script with Ctrl/Cmd + Shift + Enter.
 * 11. Correctly process statements sequentially.
 * 12. Display SELECT/query results.
 * 13. Display successful DDL/read-only messages.
 * 14. Display SQL errors.
 * 15. Query tabs.
 * 16. Rename query tabs.
 * 17. Persist query names and SQL text.
 * 18. Close query tabs.
 * 19. Keep at least one query tab open.
 * 20. Describe table popup.
 * 21. Schema/table metadata popup.
 * 22. Relationships/data-model popup.
 * 23. Results panel resize by dragging.
 * 24. Results minimize.
 * 25. Results maximize.
 * 26. Results close.
 * 27. CSV download.
 * 28. Search database/table explorer.
 * 29. Mobile sidebar support.
 *
 * ============================================================
 * IMPORTANT ARCHITECTURE
 * ============================================================
 *
 * SQLite does not natively support:
 *
 *      USE database_name;
 *      SHOW DATABASES;
 *      SHOW TABLES;
 *      DESCRIBE table_name;
 *
 * Therefore those commands are interpreted by this Playground
 * before normal SQL is sent to the backend.
 *
 * Normal SQL is sent to:
 *
 *      /api/query
 *
 * Database metadata is loaded through:
 *
 *      /api/schema/databases
 *      /api/schema/table/:database/:table
 *      /api/schema/relationships/:database
 *
 * ============================================================
 */


/* ============================================================
 * CONFIGURATION
 * ============================================================ */

const PLAYGROUND_API_BASE_URL =
    "https://sql-learning-platform-5fu8.onrender.com";


const PLAYGROUND_ACTIVE_DATABASE_KEY =
    "sqlPlaygroundActiveDatabase";


const PLAYGROUND_QUERY_STATE_KEY =
    "sqlPlaygroundQueryState";


const DEFAULT_RESULTS_HEIGHT =
    260;


const MIN_RESULTS_HEIGHT =
    110;


const MAX_RESULTS_HEIGHT_RATIO =
    0.85;


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


const statusElement =
    document.getElementById(
        "playground-status"
    ) ||
    document.getElementById(
        "sandbox-status"
    );


const databaseTree =
    document.getElementById(
        "database-tree"
    );


const searchInput =
    document.getElementById(
        "database-search-input"
    );


const activeDbElement =
    document.getElementById(
        "active-database-name"
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
 * RESULTS ELEMENTS
 * ============================================================ */

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


const downloadButton =
    document.getElementById(
        "download-results-button"
    );


const minimizeButton =
    document.getElementById(
        "minimize-results-button"
    );


const maximizeButton =
    document.getElementById(
        "maximize-results-button"
    );


const closeResultsButton =
    document.getElementById(
        "close-results-button"
    );


const resizeHandle =
    document.getElementById(
        "results-resize-handle"
    );


/* ============================================================
 * TABLE SELECTOR / DETAILS ELEMENTS
 * ============================================================ */

const selectorModal =
    document.getElementById(
        "table-selector-modal"
    );


const selectorTitle =
    document.getElementById(
        "table-selector-title"
    );


const selectorList =
    document.getElementById(
        "table-selector-list"
    );


const closeSelector =
    document.getElementById(
        "close-table-selector"
    );


const detailsModal =
    document.getElementById(
        "table-details-modal"
    );


const detailsTitle =
    document.getElementById(
        "table-details-title"
    );


const detailsContainer =
    document.getElementById(
        "table-details-container"
    );


const closeDetails =
    document.getElementById(
        "close-table-details"
    );


const relationshipsModal =
    document.getElementById(
        "relationships-modal"
    );


const relationshipsContainer =
    document.getElementById(
        "relationships-container"
    );


const closeRelationships =
    document.getElementById(
        "close-relationships"
    );


/* ============================================================
 * OTHER CONTROLS
 * ============================================================ */

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


const closeSidebar =
    document.getElementById(
        "close-sidebar-button"
    );


/* ============================================================
 * APPLICATION STATE
 * ============================================================ */

let databases = [];


let activeDatabase =
    localStorage.getItem(
        PLAYGROUND_ACTIVE_DATABASE_KEY
    ) || null;


let activeTable =
    null;


let latestResults =
    null;


let resultsHeight =
    DEFAULT_RESULTS_HEIGHT;


let queryCounter =
    1;


let activeQueryId =
    1;


/*
 * Query state:
 *
 * {
 *   1: {
 *      name: "Query 1",
 *      sql: ""
 *   }
 * }
 */
const queryState =
    new Map();


queryState.set(
    1,
    {
        name: "Query 1",
        sql: ""
    }
);


/* ============================================================
 * STARTUP
 * ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializePlayground
);


/* ============================================================
 * INITIALIZE PLAYGROUND
 * ============================================================ */

async function initializePlayground() {

    try {

        showStatus(
            "Loading Playground databases...",
            "info"
        );


        loadPersistedQueries();


        await loadDatabases();


        restoreActiveDatabase();


        renderDatabaseTree();


        renderQueryTabs();


        initializeEvents();


        hideResults();


        updateActiveDatabase();


        showStatus(
            "SQL Playground ready.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Playground initialization failed:",
            error
        );


        showStatus(
            "Unable to initialize Playground: " +
            error.message,
            "error"
        );

    }

}


/* ============================================================
 * LOAD DATABASES
 * ============================================================ */

async function loadDatabases() {

    const response =
        await fetch(
            PLAYGROUND_API_BASE_URL +
            "/api/schema/databases"
        );


    let data = null;


    try {

        data =
            await response.json();

    }

    catch {

        throw new Error(
            "Invalid response received from database API."
        );

    }


    if (!response.ok) {

        throw new Error(
            data?.message ||
            "Database list request failed."
        );

    }


    const rawDatabases =
        Array.isArray(data)
            ? data
            : (
                Array.isArray(data?.databases)
                    ? data.databases
                    : []
            );


    databases =
        rawDatabases
            .map(
                normalizeDatabase
            )
            .filter(
                database =>
                    database.name
            );

}


/* ============================================================
 * NORMALIZE DATABASE
 * ============================================================ */

function normalizeDatabase(
    database
) {

    const name =
        String(
            database?.name ||
            database?.database ||
            database?.databaseName ||
            ""
        ).trim();


    const rawTables =
        database?.tables ||
        database?.tableNames ||
        [];


    const tables =
        Array.isArray(rawTables)
            ? rawTables
                .map(
                    normalizeTable
                )
                .filter(
                    table =>
                        table.name
                )
            : [];


    return {
        name,
        tables
    };

}


/* ============================================================
 * NORMALIZE TABLE
 * ============================================================ */

function normalizeTable(
    table
) {

    if (
        typeof table ===
        "string"
    ) {

        return {
            name: table,
            columns: []
        };

    }


    return {

        name:
            String(
                table?.name ||
                table?.tableName ||
                table?.table_name ||
                ""
            ).trim(),

        columns:
            Array.isArray(
                table?.columns
            )
                ? table.columns
                : []

    };

}


/* ============================================================
 * RESTORE ACTIVE DATABASE
 * ============================================================ */

function restoreActiveDatabase() {

    if (
        activeDatabase &&
        databases.some(
            database =>
                database.name ===
                activeDatabase
        )
    ) {

        return;

    }


    activeDatabase =
        databases.length > 0
            ? databases[0].name
            : null;


    persistActiveDatabase();

}


/* ============================================================
 * SET ACTIVE DATABASE
 * ============================================================ */

function setActiveDatabase(
    databaseName
) {

    const database =
        findDatabase(
            databaseName
        );


    if (!database) {

        showStatus(
            `Database '${databaseName}' is not available in Playground.`,
            "error"
        );


        return false;

    }


    activeDatabase =
        database.name;


    activeTable =
        null;


    persistActiveDatabase();


    updateActiveDatabase();


    renderDatabaseTree();


    return true;

}


/* ============================================================
 * PERSIST ACTIVE DATABASE
 * ============================================================ */

function persistActiveDatabase() {

    if (activeDatabase) {

        localStorage.setItem(
            PLAYGROUND_ACTIVE_DATABASE_KEY,
            activeDatabase
        );

    }

    else {

        localStorage.removeItem(
            PLAYGROUND_ACTIVE_DATABASE_KEY
        );

    }

}


/* ============================================================
 * UPDATE ACTIVE DATABASE DISPLAY
 * ============================================================ */

function updateActiveDatabase() {

    if (!activeDbElement) {

        return;

    }


    activeDbElement.textContent =
        activeDatabase ||
        "None";

}


/* ============================================================
 * FIND DATABASE
 * ============================================================ */

function findDatabase(
    databaseName
) {

    return databases.find(
        database =>
            database.name.toLowerCase() ===
            String(
                databaseName
            ).toLowerCase()
    );

}


/* ============================================================
 * FIND TABLE
 * ============================================================ */

function findTable(
    databaseName,
    tableName
) {

    const database =
        findDatabase(
            databaseName
        );


    if (!database) {

        return null;

    }


    return database.tables.find(
        table =>
            table.name.toLowerCase() ===
            String(
                tableName
            ).toLowerCase()
    );

}


/* ============================================================
 * DATABASE EXPLORER
 * ============================================================ */

function renderDatabaseTree() {

    if (!databaseTree) {

        return;

    }


    databaseTree.innerHTML = "";


    const searchTerm =
        (
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    databases.forEach(
        database => {

            const databaseMatches =
                database.name
                    .toLowerCase()
                    .includes(
                        searchTerm
                    );


            const matchingTables =
                database.tables.filter(
                    table =>
                        table.name
                            .toLowerCase()
                            .includes(
                                searchTerm
                            )
                );


            if (
                searchTerm &&
                !databaseMatches &&
                matchingTables.length === 0
            ) {

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
                activeDatabase ===
                database.name;


            header.innerHTML = `

                <span class="database-arrow">
                    ▶
                </span>

                <span>
                    🗄️
                </span>

                <span>
                    ${escapeHTML(
                        database.name
                    )}
                </span>

                ${
                    isActive
                        ? `
                            <span
                                class="active-database-badge"
                            >
                                ACTIVE
                            </span>
                          `
                        : ""
                }

            `;


            const tableList =
                document.createElement(
                    "div"
                );


            tableList.className =
                "table-list";

/*
 * DATABASE EXPANSION
 * ------------------
 *
 * Databases are collapsed by default.
 *
 * Search results automatically expand when a matching table
 * is found so the user can locate the table easily.
 *
 * The active database is NOT automatically forced open.
 * This allows the user to manually collapse/expand it.
 */
if (
    searchTerm &&
    matchingTables.length > 0
) {

    tableList.style.display =
        "block";


    header.querySelector(
        ".database-arrow"
    ).textContent =
        "▼";

}


            database.tables.forEach(
                table => {

                    if (
                        searchTerm &&
                        !databaseMatches &&
                        !table.name
                            .toLowerCase()
                            .includes(
                                searchTerm
                            )
                    ) {

                        return;

                    }


                    const tableElement =
                        document.createElement(
                            "div"
                        );


                    tableElement.className =
                        "table-item";


                    const selected =
                        activeTable &&
                        activeTable.database ===
                            database.name &&
                        activeTable.table ===
                            table.name;


                    if (selected) {

                        tableElement.classList.add(
                            "selected"
                        );

                    }


                    tableElement.innerHTML = `

                        <span>
                            ▦
                        </span>

                        <span>
                            ${escapeHTML(
                                table.name
                            )}
                        </span>

                    `;


                    tableElement.addEventListener(
                        "click",
                        event => {

                            event.stopPropagation();


                            setActiveDatabase(
                                database.name
                            );


                            activeTable = {

                                database:
                                    database.name,

                                table:
                                    table.name

                            };


                            renderDatabaseTree();


                            showStatus(
                                `Selected table '${table.name}' in database '${database.name}'.`,
                                "info"
                            );

                        }
                    );


                    tableList.appendChild(
                        tableElement
                    );

                }
            );


            header.addEventListener(
    "click",
    () => {

        /*
         * Determine the current state BEFORE changing
         * the active database.
         */
        const isOpen =
            tableList.style.display ===
            "block";


        /*
         * Toggle the database visually.
         */
        tableList.style.display =
            isOpen
                ? "none"
                : "block";


        header.querySelector(
            ".database-arrow"
        ).textContent =
            isOpen
                ? "▶"
                : "▼";


        /*
         * Selecting a database should still make it the
         * active database.
         *
         * This is intentionally done AFTER the visual
         * toggle so the user's expand/collapse action is
         * preserved.
         */
        if (
            activeDatabase !==
            database.name
        ) {

            setActiveDatabase(
                database.name
            );

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
 * SQL STATEMENT SPLITTER
 * ============================================================
 *
 * Splits SQL on semicolons while respecting:
 *
 * - single quotes
 * - double quotes
 * - backticks
 * - line comments
 * - block comments
 *
 * This prevents:
 *
 * SELECT 'A;B';
 *
 * from being split incorrectly.
 * ============================================================ */

function splitSqlStatements(
    sql
) {

    const statements = [];


    let current = "";


    let quote = null;


    let inLineComment = false;


    let inBlockComment = false;


    for (
        let index = 0;
        index < sql.length;
        index++
    ) {

        const character =
            sql[index];


        const next =
            sql[index + 1];


        if (inLineComment) {

            current += character;


            if (
                character === "\n"
            ) {

                inLineComment =
                    false;

            }


            continue;

        }


        if (inBlockComment) {

            current += character;


            if (
                character === "*" &&
                next === "/"
            ) {

                current += next;


                index++;


                inBlockComment =
                    false;

            }


            continue;

        }


        if (
            !quote &&
            character === "-" &&
            next === "-"
        ) {

            current +=
                character +
                next;


            index++;


            inLineComment =
                true;


            continue;

        }


        if (
            !quote &&
            character === "/" &&
            next === "*"
        ) {

            current +=
                character +
                next;


            index++;


            inBlockComment =
                true;


            continue;

        }


        if (quote) {

            current +=
                character;


            if (
                character === quote
            ) {

                /*
                 * SQL escaped quote:
                 *
                 * ''
                 * ""
                 * ``
                 */
                if (
                    next === quote
                ) {

                    current +=
                        next;


                    index++;

                }

                else {

                    quote =
                        null;

                }

            }


            continue;

        }


        if (
            character === "'" ||
            character === '"' ||
            character === "`"
        ) {

            quote =
                character;


            current +=
                character;


            continue;

        }


        if (
            character === ";"
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
            character;

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
 * GET STATEMENT UNDER CURSOR
 * ============================================================ */

function getStatementUnderCursor(
    sql,
    cursorPosition
) {

    const statements =
        splitSqlStatementsWithPositions(
            sql
        );


    for (
        const statement of statements
    ) {

        if (
            cursorPosition >=
                statement.start &&
            cursorPosition <=
                statement.end
        ) {

            return statement.text;

        }

    }


    return "";

}


/* ============================================================
 * SPLIT SQL WITH POSITIONS
 * ============================================================ */

function splitSqlStatementsWithPositions(
    sql
) {

    const result = [];


    let start =
        0;


    let quote =
        null;


    let inLineComment =
        false;


    let inBlockComment =
        false;


    for (
        let index = 0;
        index < sql.length;
        index++
    ) {

        const character =
            sql[index];


        const next =
            sql[index + 1];


        if (inLineComment) {

            if (
                character === "\n"
            ) {

                inLineComment =
                    false;

            }


            continue;

        }


        if (inBlockComment) {

            if (
                character === "*" &&
                next === "/"
            ) {

                index++;


                inBlockComment =
                    false;

            }


            continue;

        }


        if (
            !quote &&
            character === "-" &&
            next === "-"
        ) {

            index++;


            inLineComment =
                true;


            continue;

        }


        if (
            !quote &&
            character === "/" &&
            next === "*"
        ) {

            index++;


            inBlockComment =
                true;


            continue;

        }


        if (quote) {

            if (
                character === quote
            ) {

                if (
                    next === quote
                ) {

                    index++;

                }

                else {

                    quote =
                        null;

                }

            }


            continue;

        }


        if (
            character === "'" ||
            character === '"' ||
            character === "`"
        ) {

            quote =
                character;


            continue;

        }


        if (
            character === ";"
        ) {

            const text =
                sql
                    .slice(
                        start,
                        index
                    )
                    .trim();


            if (text) {

                result.push({

                    text,

                    start,

                    end:
                        index

                });

            }


            start =
                index + 1;

        }

    }


    const finalText =
        sql
            .slice(start)
            .trim();


    if (finalText) {

        result.push({

            text:
                finalText,

            start,

            end:
                sql.length

        });

    }


    return result;

}


/* ============================================================
 * EXECUTION TARGET
 * ============================================================
 *
 * Behaviour:
 *
 * 1. Selected text exists:
 *      execute selected text.
 *
 * 2. Nothing selected:
 *      execute statement under cursor.
 *
 * 3. Ctrl/Cmd + Shift + Enter:
 *      execute complete script.
 * ============================================================ */

async function executeCurrentQuery(
    options = {}
) {

    if (!sqlEditor) {

        return;

    }


    const fullSql =
        sqlEditor.value;


    if (
        !fullSql.trim()
    ) {

        showStatus(
            "Please enter a SQL query.",
            "error"
        );


        return;

    }


    let statements = [];


    if (
        options.executeAll
    ) {

        statements =
            splitSqlStatements(
                fullSql
            );

    }

    else if (
        sqlEditor.selectionStart !==
        sqlEditor.selectionEnd
    ) {

        const selectedText =
            fullSql.slice(
                sqlEditor.selectionStart,
                sqlEditor.selectionEnd
            );


        statements =
            splitSqlStatements(
                selectedText
            );

    }

    else {

        const statement =
            getStatementUnderCursor(
                fullSql,
                sqlEditor.selectionStart
            );


        if (statement) {

            statements =
                [statement];

        }

        else {

            statements =
                splitSqlStatements(
                    fullSql
                );

        }

    }


    if (
        statements.length === 0
    ) {

        showStatus(
            "No executable SQL statement found.",
            "error"
        );


        return;

    }


    showStatus(
        `Executing ${statements.length} statement${
            statements.length === 1
                ? ""
                : "s"
        }...`,
        "info"
    );


    try {

        let lastResult =
            null;


        let executedCount =
            0;


        for (
            const statement of statements
        ) {

            const result =
                await executeSingleStatement(
                    statement
                );


            executedCount++;


            if (result) {

                lastResult =
                    result;

            }

        }


        if (lastResult) {

            displayResults(
                lastResult
            );

        }


        await loadDatabases();


        renderDatabaseTree();


        updateActiveDatabase();


        showStatus(
            `Query executed successfully. ${executedCount} statement${
                executedCount === 1
                    ? ""
                    : "s"
            } executed.`,
            "success"
        );

    }

    catch (error) {

        console.error(
            "SQL execution error:",
            error
        );


        displayResults({

            columns:
                ["Error"],

            rows: [
                {
                    Error:
                        error.message
                }
            ],

            executionTime:
                0,

            error:
                true

        });


        showStatus(
            "❌ " +
            error.message,
            "error"
        );

    }

}


/* ============================================================
 * EXECUTE SINGLE STATEMENT
 * ============================================================ */

async function executeSingleStatement(
    statement
) {

    const sql =
        statement.trim();


    if (!sql) {

        return null;

    }


    /*
     * USE database_name;
     */
    const useMatch =
        sql.match(
            /^USE\s+(?:["'`])?([A-Za-z0-9_]+)(?:["'`])?\s*$/i
        );


    if (useMatch) {

        const databaseName =
            useMatch[1];


        if (
            !setActiveDatabase(
                databaseName
            )
        ) {

            throw new Error(
                `Database '${databaseName}' is not present in Playground.`
            );

        }


        return {

            columns:
                ["Message"],

            rows: [
                {
                    Message:
                        `Database changed to ${databaseName}.`
                }
            ],

            rowCount:
                1,

            executionTime:
                0

        };

    }


    /*
     * SHOW DATABASES;
     */
    if (
        /^SHOW\s+DATABASES?$/i.test(
            sql
        )
    ) {

        return {

            columns:
                ["Database"],

            rows:
                databases.map(
                    database => ({
                        Database:
                            database.name
                    })
                ),

            rowCount:
                databases.length,

            executionTime:
                0

        };

    }


    /*
     * SHOW TABLES;
     */
    if (
        /^SHOW\s+TABLES?$/i.test(
            sql
        )
    ) {

        requireActiveDatabase();


        const database =
            findDatabase(
                activeDatabase
            );


        return {

            columns:
                ["Table"],

            rows:
                database.tables.map(
                    table => ({
                        Table:
                            table.name
                    })
                ),

            rowCount:
                database.tables.length,

            executionTime:
                0

        };

    }


    /*
     * DESCRIBE / DESC
     */
    const describeMatch =
        sql.match(
            /^(?:DESCRIBE|DESC)\s+(?:TABLE\s+)?["'`]?([A-Za-z0-9_]+)["'`]?\s*$/i
        );


    if (describeMatch) {

        requireActiveDatabase();


        return await describeTable(
            describeMatch[1]
        );

    }


    /*
     * Every normal SQL statement requires
     * an active database.
     */
    requireActiveDatabase();


    return await executeNormalSQL(
        sql
    );

}


/* ============================================================
 * REQUIRE ACTIVE DATABASE
 * ============================================================ */

function requireActiveDatabase() {

    if (
        !activeDatabase
    ) {

        throw new Error(
            "Please select or USE a database first."
        );

    }


    if (
        !findDatabase(
            activeDatabase
        )
    ) {

        throw new Error(
            `Database '${activeDatabase}' is not available in Playground.`
        );

    }

}


/* ============================================================
 * EXECUTE NORMAL SQL
 * ============================================================ */

async function executeNormalSQL(
    statement
) {

    /*
     * Prefer the shared API helper when available.
     */
    if (
        typeof window.executeSqlQuery ===
        "function"
    ) {

        const result =
            await window.executeSqlQuery(
                statement,
                null,
                activeDatabase
            );


        return normalizeQueryResult(
            result
        );

    }


    /*
     * Fallback direct API request.
     */
    const response =
        await fetch(
            PLAYGROUND_API_BASE_URL +
            "/api/query",
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        query:
                            statement,

                        database:
                            activeDatabase,

                        expectedOutput:
                            null

                    })

            }
        );


    let data = null;


    try {

        data =
            await response.json();

    }

    catch {

        throw new Error(
            "Invalid SQL API response."
        );

    }


    if (
        !response.ok
    ) {

        throw new Error(
            data?.message ||
            "SQL query execution failed."
        );

    }


    return normalizeQueryResult(
        data
    );

}


/* ============================================================
 * NORMALIZE QUERY RESULT
 * ============================================================ */

function normalizeQueryResult(
    result
) {

    if (!result) {

        return {

            columns: [],

            rows: [],

            rowCount: 0,

            executionTime: 0

        };

    }


    const rows =
        Array.isArray(
            result.rows
        )
            ? result.rows
            : (
                Array.isArray(
                    result.data
                )
                    ? result.data
                    : []
            );


    let columns =
        Array.isArray(
            result.columns
        )
            ? result.columns
            : [];


    if (
        columns.length === 0 &&
        rows.length > 0
    ) {

        columns =
            Object.keys(
                rows[0]
            );

    }


    return {

        ...result,

        columns,

        rows,

        rowCount:
            Number.isFinite(
                result.rowCount
            )
                ? result.rowCount
                : rows.length,

        executionTime:
            Number(
                result.executionTime
            ) || 0

    };

}


/* ============================================================
 * DESCRIBE TABLE
 * ============================================================ */

async function describeTable(
    tableName
) {

    requireActiveDatabase();


    const table =
        findTable(
            activeDatabase,
            tableName
        );


    if (!table) {

        throw new Error(
            `Table '${tableName}' is not present in database '${activeDatabase}'.`
        );

    }


    const metadata =
        await fetchTableMetadata(
            activeDatabase,
            tableName
        );


    const columns =
        normalizeColumns(
            metadata?.columns ||
            metadata?.schema ||
            table.columns ||
            []
        );


    return {

        columns: [
            "Column",
            "Data Type",
            "Nullable",
            "Key",
            "Default"
        ],

        rows:
            columns.map(
                column => ({

                    Column:
                        column.name,

                    "Data Type":
                        column.type,

                    Nullable:
                        column.nullable,

                    Key:
                        column.key,

                    Default:
                        column.defaultValue

                })
            ),

        rowCount:
            columns.length,

        executionTime:
            0

    };

}


/* ============================================================
 * FETCH TABLE METADATA
 * ============================================================ */

async function fetchTableMetadata(
    databaseName,
    tableName
) {

    const response =
        await fetch(
            PLAYGROUND_API_BASE_URL +
            "/api/schema/table/" +
            encodeURIComponent(
                databaseName
            ) +
            "/" +
            encodeURIComponent(
                tableName
            )
        );


    let data = null;


    try {

        data =
            await response.json();

    }

    catch {

        throw new Error(
            "Unable to read table metadata."
        );

    }


    if (
        !response.ok
    ) {

        throw new Error(
            data?.message ||
            "Unable to load table metadata."
        );

    }


    return data;

}


/* ============================================================
 * NORMALIZE COLUMN METADATA
 * ============================================================ */

function normalizeColumns(
    columns
) {

    if (
        !Array.isArray(columns)
    ) {

        return [];

    }


    return columns.map(
        column => ({

            name:
                String(
                    column?.name ||
                    column?.column_name ||
                    column?.columnName ||
                    ""
                ),

            type:
                String(
                    column?.type ||
                    column?.data_type ||
                    column?.dataType ||
                    ""
                ),

            nullable:
                normalizeNullable(
                    column
                ),

            key:
                String(
                    column?.key ||
                    column?.constraint ||
                    column?.primaryKey ||
                    ""
                ),

            defaultValue:
                column?.default ??
                column?.defaultValue ??
                ""

        })
    );

}


/* ============================================================
 * NORMALIZE NULLABLE
 * ============================================================ */

function normalizeNullable(
    column
) {

    if (
        column?.nullable !==
        undefined
    ) {

        return String(
            column.nullable
        );

    }


    if (
        column?.is_nullable !==
        undefined
    ) {

        return String(
            column.is_nullable
        );

    }


    if (
        column?.isNullable !==
        undefined
    ) {

        return String(
            column.isNullable
        );

    }


    return "";

}


/* ============================================================
 * DISPLAY RESULTS
 * ============================================================ */

function displayResults(
    data
) {

    latestResults =
        normalizeQueryResult(
            data
        );


    const columns =
        latestResults.columns;


    const rows =
        latestResults.rows;


    if (
        resultsSummary
    ) {

        resultsSummary.textContent =
            `${rows.length} row${
                rows.length === 1
                    ? ""
                    : "s"
            } • ${
                latestResults.executionTime ||
                0
            } ms`;

    }


    if (
        !resultsContainer
    ) {

        return;

    }


    if (
        latestResults.error
    ) {

        resultsContainer.innerHTML = `

            <div class="empty-results error-results">

                ${escapeHTML(
                    rows[0]?.Error ||
                    "Query failed."
                )}

            </div>

        `;

    }

    else if (
        columns.length === 0
    ) {

        resultsContainer.innerHTML = `

            <div class="empty-results">

                Query executed successfully.

            </div>

        `;

    }

    else {

        resultsContainer.innerHTML = `

            <div class="results-table-wrapper">

                <table class="results-table">

                    <thead>

                        <tr>

                            ${columns
                                .map(
                                    column => `
                                        <th>
                                            ${escapeHTML(
                                                column
                                            )}
                                        </th>
                                    `
                                )
                                .join("")
                            }

                        </tr>

                    </thead>

                    <tbody>

                        ${
                            rows.length > 0
                                ? rows
                                    .map(
                                        row => `
                                            <tr>

                                                ${
                                                    columns
                                                        .map(
                                                            column => `
                                                                <td>
                                                                    ${escapeHTML(
                                                                        row?.[
                                                                            column
                                                                        ] ??
                                                                        "NULL"
                                                                    )}
                                                                </td>
                                                            `
                                                        )
                                                        .join("")
                                                }

                                            </tr>
                                        `
                                    )
                                    .join("")
                                : `
                                    <tr>

                                        <td
                                            colspan="${columns.length}"
                                        >
                                            No rows returned.
                                        </td>

                                    </tr>
                                  `
                        }

                    </tbody>

                </table>

            </div>

        `;

    }


    if (
        downloadButton
    ) {

        downloadButton.disabled =
            columns.length === 0;

    }


    showResults();

}


/* ============================================================
 * SHOW RESULTS
 * ============================================================ */

function showResults() {

    if (!resultsSection) {

        return;

    }


    resultsSection.classList.remove(
        "results-hidden"
    );


    resultsSection.classList.remove(
        "results-minimized"
    );


    resultsSection.style.flexBasis =
        `${resultsHeight}px`;

}


/* ============================================================
 * HIDE RESULTS
 * ============================================================ */

function hideResults() {

    if (!resultsSection) {

        return;

    }


    resultsSection.classList.add(
        "results-hidden"
    );

}


/* ============================================================
 * MINIMIZE RESULTS
 * ============================================================ */

function minimizeResults() {

    if (!resultsSection) {

        return;

    }


    resultsSection.classList.remove(
        "results-maximized"
    );


    resultsSection.classList.toggle(
        "results-minimized"
    );


    if (
        !resultsSection.classList.contains(
            "results-minimized"
        )
    ) {

        resultsSection.style.flexBasis =
            `${resultsHeight}px`;

    }

}


/* ============================================================
 * MAXIMIZE RESULTS
 * ============================================================ */

function maximizeResults() {

    if (!resultsSection) {

        return;

    }


    resultsSection.classList.remove(
        "results-minimized"
    );


    resultsSection.classList.toggle(
        "results-maximized"
    );


    if (
        resultsSection.classList.contains(
            "results-maximized"
        )
    ) {

        resultsSection.style.flexBasis =
            "85vh";

    }

    else {

        resultsSection.style.flexBasis =
            `${resultsHeight}px`;

    }

}


/* ============================================================
 * RESULTS DRAG / RESIZE
 * ============================================================ */

function initializeResultsResize() {

    if (
        !resizeHandle ||
        !resultsSection
    ) {

        return;

    }


    let dragging =
        false;


    let startY =
        0;


    let startHeight =
        0;


    resizeHandle.addEventListener(
        "pointerdown",
        event => {

            if (
                resultsSection.classList.contains(
                    "results-maximized"
                )
            ) {

                return;

            }


            dragging =
                true;


            startY =
                event.clientY;


            startHeight =
                resultsSection.getBoundingClientRect()
                    .height;


            resizeHandle.setPointerCapture(
                event.pointerId
            );


            document.body.style.userSelect =
                "none";

        }
    );


    resizeHandle.addEventListener(
        "pointermove",
        event => {

            if (!dragging) {

                return;

            }


            const difference =
                startY -
                event.clientY;


            const maximum =
                window.innerHeight *
                MAX_RESULTS_HEIGHT_RATIO;


            const newHeight =
                Math.min(
                    Math.max(
                        startHeight +
                        difference,
                        MIN_RESULTS_HEIGHT
                    ),
                    maximum
                );


            resultsHeight =
                newHeight;


            resultsSection.style.flexBasis =
                `${newHeight}px`;

        }
    );


    const stopDragging =
        () => {

            dragging =
                false;


            document.body.style.userSelect =
                "";

        };


    resizeHandle.addEventListener(
        "pointerup",
        stopDragging
    );


    resizeHandle.addEventListener(
        "pointercancel",
        stopDragging
    );

}


/* ============================================================
 * QUERY TABS
 * ============================================================ */

function renderQueryTabs() {

    if (!queryTabs) {

        return;

    }


    queryTabs
        .querySelectorAll(
            ".query-tab"
        )
        .forEach(
            tab =>
                tab.remove()
        );


    queryState.forEach(
        (
            query,
            id
        ) => {

            const tab =
                document.createElement(
                    "button"
                );


            tab.type =
                "button";


            tab.className =
                "query-tab";


            tab.dataset.queryId =
                String(id);


            if (
                id ===
                activeQueryId
            ) {

                tab.classList.add(
                    "active"
                );

            }


            tab.innerHTML = `

                <span
                    class="query-tab-name"
                    title="Double-click to rename"
                >
                    ${escapeHTML(
                        query.name
                    )}
                </span>

                <button
                    type="button"
                    class="query-tab-close"
                    aria-label="Close query"
                    title="Close query"
                >
                    ×
                </button>

            `;


            tab.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            ".query-tab-close"
                        )
                    ) {

                        return;

                    }


                    switchQuery(
                        id
                    );

                }
            );


            tab.addEventListener(
                "dblclick",
                event => {

                    if (
                        event.target.closest(
                            ".query-tab-close"
                        )
                    ) {

                        return;

                    }


                    renameQueryTab(
                        id
                    );

                }
            );


            const closeButton =
                tab.querySelector(
                    ".query-tab-close"
                );


            closeButton?.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    closeQueryTab(
                        id
                    );

                }
            );


            queryTabs.insertBefore(
                tab,
                newQueryButton
            );

        }
    );

}


/* ============================================================
 * CREATE QUERY TAB
 * ============================================================ */

function createQueryTab() {

    saveCurrentQuery();


    queryCounter =
        Math.max(
            queryCounter,
            ...Array.from(
                queryState.keys()
            )
        ) + 1;


    queryState.set(
        queryCounter,
        {

            name:
                `Query ${queryCounter}`,

            sql:
                ""

        }
    );


    persistQueries();


    activeQueryId =
        queryCounter;


    renderQueryTabs();


    sqlEditor.value =
        "";


    sqlEditor.focus();

}


/* ============================================================
 * SWITCH QUERY
 * ============================================================ */

function switchQuery(
    queryId
) {

    saveCurrentQuery();


    const query =
        queryState.get(
            queryId
        );


    if (!query) {

        return;

    }


    activeQueryId =
        queryId;


    activeTable =
        null;


    sqlEditor.value =
        query.sql ||
        "";


    renderQueryTabs();


    persistQueries();


    sqlEditor.focus();

}


/* ============================================================
 * SAVE CURRENT QUERY
 * ============================================================ */

function saveCurrentQuery() {

    const query =
        queryState.get(
            activeQueryId
        );


    if (!query) {

        return;

    }


    query.sql =
        sqlEditor?.value ||
        "";


    persistQueries();

}


/* ============================================================
 * RENAME QUERY TAB
 * ============================================================ */

function renameQueryTab(
    queryId
) {

    const query =
        queryState.get(
            queryId
        );


    if (!query) {

        return;

    }


    const newName =
        window.prompt(
            "Enter query name:",
            query.name
        );


    if (
        newName ===
        null
    ) {

        return;

    }


    const cleaned =
        newName
            .trim();


    if (!cleaned) {

        showStatus(
            "Query name cannot be empty.",
            "error"
        );


        return;

    }


    query.name =
        cleaned;


    persistQueries();


    renderQueryTabs();


    showStatus(
        `Query renamed to '${cleaned}'.`,
        "success"
    );

}


/* ============================================================
 * CLOSE QUERY TAB
 * ============================================================ */

function closeQueryTab(
    queryId
) {

    if (
        queryState.size <=
        1
    ) {

        showStatus(
            "At least one query sheet must remain open.",
            "info"
        );


        return;

    }


    const query =
        queryState.get(
            queryId
        );


    if (!query) {

        return;

    }


    const confirmed =
        window.confirm(
            `Close '${query.name}'?`
        );


    if (!confirmed) {

        return;

    }


    queryState.delete(
        queryId
    );


    if (
        activeQueryId ===
        queryId
    ) {

        const nextId =
            Array.from(
                queryState.keys()
            )[0];


        activeQueryId =
            nextId;


        sqlEditor.value =
            queryState.get(
                nextId
            )?.sql ||
            "";

    }


    persistQueries();


    renderQueryTabs();


    sqlEditor.focus();

}


/* ============================================================
 * PERSIST QUERY STATE
 * ============================================================ */

function persistQueries() {

    saveCurrentQueryWithoutPersist();


    const serializable =
        Array.from(
            queryState.entries()
        )
            .map(
                (
                    [
                        id,
                        query
                    ]
                ) => ({

                    id,

                    name:
                        query.name,

                    sql:
                        query.sql

                })
            );


    localStorage.setItem(
        PLAYGROUND_QUERY_STATE_KEY,
        JSON.stringify({

            activeQueryId,

            queryCounter,

            queries:
                serializable

        })
    );

}


/* ============================================================
 * SAVE QUERY WITHOUT RECURSIVE PERSIST
 * ============================================================ */

function saveCurrentQueryWithoutPersist() {

    const query =
        queryState.get(
            activeQueryId
        );


    if (query) {

        query.sql =
            sqlEditor?.value ||
            query.sql ||
            "";

    }

}


/* ============================================================
 * LOAD PERSISTED QUERIES
 * ============================================================ */

function loadPersistedQueries() {

    try {

        const raw =
            localStorage.getItem(
                PLAYGROUND_QUERY_STATE_KEY
            );


        if (!raw) {

            return;

        }


        const saved =
            JSON.parse(
                raw
            );


        if (
            !Array.isArray(
                saved?.queries
            )
        ) {

            return;

        }


        queryState.clear();


        saved.queries.forEach(
            query => {

                const id =
                    Number(
                        query.id
                    );


                if (
                    !Number.isFinite(
                        id
                    )
                ) {

                    return;

                }


                queryState.set(
                    id,
                    {

                        name:
                            String(
                                query.name ||
                                `Query ${id}`
                            ),

                        sql:
                            String(
                                query.sql ||
                                ""
                            )

                    }
                );

            }
        );


        if (
            queryState.size ===
            0
        ) {

            queryState.set(
                1,
                {

                    name:
                        "Query 1",

                    sql:
                        ""

                }
            );

        }


        queryCounter =
            Number(
                saved.queryCounter
            ) ||
            Math.max(
                ...queryState.keys()
            );


        activeQueryId =
            Number(
                saved.activeQueryId
            );


        if (
            !queryState.has(
                activeQueryId
            )
        ) {

            activeQueryId =
                Array.from(
                    queryState.keys()
                )[0];

        }

    }

    catch (error) {

        console.warn(
            "Could not restore query state:",
            error
        );

    }

}


/* ============================================================
 * TABLE SELECTOR
 * ============================================================ */

function openTableSelector(
    action
) {

    requireActiveDatabaseForUI();


    const database =
        findDatabase(
            activeDatabase
        );


    if (
        !database ||
        database.tables.length ===
        0
    ) {

        showStatus(
            `No tables are available in database '${activeDatabase}'.`,
            "info"
        );


        return;

    }


    if (
        selectorTitle
    ) {

        selectorTitle.textContent =
            `${action} - ${activeDatabase}`;

    }


    if (
        selectorList
    ) {

        selectorList.innerHTML =
            "";

    }


    database.tables.forEach(
        table => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "table-selector-row";


            row.innerHTML = `

                <strong>
                    ${escapeHTML(
                        table.name
                    )}
                </strong>

                <button
                    type="button"
                >
                    ${escapeHTML(
                        action
                    )}
                </button>

            `;


            row.querySelector(
                "button"
            ).addEventListener(
                "click",
                () => {

                    activeTable = {

                        database:
                            activeDatabase,

                        table:
                            table.name

                    };


                    selectorModal?.classList.add(
                        "hidden"
                    );


                    loadTableDetails(
                        table.name,
                        action
                    );

                }
            );


            selectorList?.appendChild(
                row
            );

        }
    );


    selectorModal?.classList.remove(
        "hidden"
    );

}


/* ============================================================
 * REQUIRE ACTIVE DATABASE FOR UI
 * ============================================================ */

function requireActiveDatabaseForUI() {

    if (
        !activeDatabase
    ) {

        showStatus(
            "Please select or USE a database first.",
            "error"
        );


        return false;

    }


    return true;

}


/* ============================================================
 * LOAD TABLE DETAILS
 * ============================================================ */

async function loadTableDetails(
    tableName,
    mode
) {

    requireActiveDatabase();


    const table =
        findTable(
            activeDatabase,
            tableName
        );


    if (!table) {

        showStatus(
            `Table '${tableName}' is not present in database '${activeDatabase}'.`,
            "error"
        );


        return;

    }


    detailsModal?.classList.remove(
        "hidden"
    );


    if (detailsTitle) {

        detailsTitle.textContent =
            `${mode}: ${activeDatabase}.${tableName}`;

    }


    if (detailsContainer) {

        detailsContainer.innerHTML = `

            <div class="empty-results">
                Loading table metadata...
            </div>

        `;

    }


    try {

        const metadata =
            await fetchTableMetadata(
                activeDatabase,
                tableName
            );


        const columns =
            normalizeColumns(
                metadata?.columns ||
                metadata?.schema ||
                table.columns ||
                []
            );


        if (
            detailsContainer
        ) {

            detailsContainer.innerHTML = `

                <table class="table-details-table">

                    <thead>

                        <tr>

                            <th>
                                Column
                            </th>

                            <th>
                                Data Type
                            </th>

                            <th>
                                Nullable
                            </th>

                            <th>
                                Key
                            </th>

                            <th>
                                Default
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${
                            columns.length
                                ? columns
                                    .map(
                                        column => `

                                            <tr>

                                                <td>
                                                    ${escapeHTML(
                                                        column.name
                                                    )}
                                                </td>

                                                <td>
                                                    ${escapeHTML(
                                                        column.type
                                                    )}
                                                </td>

                                                <td>
                                                    ${escapeHTML(
                                                        column.nullable
                                                    )}
                                                </td>

                                                <td>
                                                    ${escapeHTML(
                                                        column.key
                                                    )}
                                                </td>

                                                <td>
                                                    ${escapeHTML(
                                                        column.defaultValue
                                                    )}
                                                </td>

                                            </tr>

                                        `
                                    )
                                    .join("")
                                : `

                                    <tr>

                                        <td
                                            colspan="5"
                                        >
                                            No column metadata available.
                                        </td>

                                    </tr>

                                  `
                        }

                    </tbody>

                </table>

            `;

        }

    }

    catch (error) {

        if (
            detailsContainer
        ) {

            detailsContainer.innerHTML = `

                <div class="empty-results error-results">

                    ${escapeHTML(
                        error.message
                    )}

                </div>

            `;

        }

    }

}


/* ============================================================
 * RELATIONSHIPS
 * ============================================================ */

async function showRelationships() {

    requireActiveDatabase();


    relationshipsModal?.classList.remove(
        "hidden"
    );


    if (
        relationshipsContainer
    ) {

        relationshipsContainer.innerHTML = `

            <div class="empty-results">
                Loading data model...
            </div>

        `;

    }


    try {

        const response =
            await fetch(
                PLAYGROUND_API_BASE_URL +
                "/api/schema/relationships/" +
                encodeURIComponent(
                    activeDatabase
                )
            );


        let data = null;


        try {

            data =
                await response.json();

        }

        catch {

            throw new Error(
                "Invalid relationships API response."
            );

        }


        if (
            !response.ok
        ) {

            throw new Error(
                data?.message ||
                "Unable to load relationships."
            );

        }


        const relationships =
            Array.isArray(
                data?.relationships
            )
                ? data.relationships
                : [];


        if (
            relationships.length ===
            0
        ) {

            relationshipsContainer.innerHTML = `

                <div class="empty-results">

                    No foreign-key relationships found
                    in ${escapeHTML(
                        activeDatabase
                    )}.

                </div>

            `;


            return;

        }


        relationshipsContainer.innerHTML = `

            <div class="relationship-diagram">

                ${relationships
                    .map(
                        relationship => {

                            const fromTable =
                                relationship.fromTable ||
                                relationship.table ||
                                relationship.table_name ||
                                "";

                            const fromColumn =
                                relationship.fromColumn ||
                                relationship.column ||
                                relationship.column_name ||
                                "";

                            const toTable =
                                relationship.toTable ||
                                relationship.referencesTable ||
                                relationship.referenced_table ||
                                "";

                            const toColumn =
                                relationship.toColumn ||
                                relationship.referencesColumn ||
                                relationship.referenced_column ||
                                "";


                            return `

                                <div
                                    class="relationship-card"
                                >

                                    <strong>
                                        ${escapeHTML(
                                            fromTable
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            fromColumn
                                        )}
                                    </span>

                                    <span
                                        class="relationship-arrow"
                                    >
                                        →
                                    </span>

                                    <strong>
                                        ${escapeHTML(
                                            toTable
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            toColumn
                                        )}
                                    </span>

                                </div>

                            `;

                        }
                    )
                    .join("")
                }

            </div>

        `;

    }

    catch (error) {

        if (
            relationshipsContainer
        ) {

            relationshipsContainer.innerHTML = `

                <div class="empty-results error-results">

                    ${escapeHTML(
                        error.message
                    )}

                </div>

            `;

        }

    }

}


/* ============================================================
 * DOWNLOAD CSV
 * ============================================================ */

function downloadCSV(
    data
) {

    if (
        !data ||
        !Array.isArray(
            data.columns
        )
    ) {

        showStatus(
            "There are no query results to download.",
            "error"
        );


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


    const rows =
        Array.isArray(
            data.rows
        )
            ? data.rows
            : [];


    rows.forEach(
        row => {

            lines.push(
                data.columns
                    .map(
                        column =>
                            csvEscape(
                                row?.[
                                    column
                                ]
                            )
                    )
                    .join(",")
            );

        }
    );


    const blob =
        new Blob(
            [
                lines.join(
                    "\r\n"
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
        `playground-${(
            activeDatabase ||
            "results"
        )}-results.csv`;


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
        value ===
        null ||
        value ===
        undefined
    ) {

        return "";

    }


    const text =
        String(
            value
        );


    if (
        /[",\r\n]/.test(
            text
        )
    ) {

        return (
            '"' +
            text.replace(
                /"/g,
                '""'
            ) +
            '"'
        );

    }


    return text;

}


/* ============================================================
 * STATUS MESSAGE
 * ============================================================ */

function showStatus(
    message,
    type = ""
) {

    if (
        !statusElement
    ) {

        return;

    }


    statusElement.textContent =
        message;


    statusElement.className =
        "playground-status";


    if (type) {

        statusElement.classList.add(
            type
        );

    }

}


/* ============================================================
 * ESCAPE HTML
 * ============================================================ */

function escapeHTML(
    value
) {

    return String(
        value ??
        ""
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
 * INITIALIZE EVENTS
 * ============================================================ */

function initializeEvents() {

    runQueryButton?.addEventListener(
        "click",
        () => executeCurrentQuery()
    );


    newQueryButton?.addEventListener(
        "click",
        createQueryTab
    );


    describeTableButton?.addEventListener(
        "click",
        () =>
            openTableSelector(
                "Describe"
            )
    );


    viewSchemaButton?.addEventListener(
        "click",
        () =>
            openTableSelector(
                "Schema"
            )
    );


    viewRelationshipsButton?.addEventListener(
        "click",
        showRelationships
    );


    downloadButton?.addEventListener(
        "click",
        () =>
            downloadCSV(
                latestResults
            )
    );


    minimizeButton?.addEventListener(
        "click",
        minimizeResults
    );


    maximizeButton?.addEventListener(
        "click",
        maximizeResults
    );


    closeResultsButton?.addEventListener(
        "click",
        hideResults
    );


    closeSelector?.addEventListener(
        "click",
        () =>
            selectorModal?.classList.add(
                "hidden"
            )
    );


    closeDetails?.addEventListener(
        "click",
        () =>
            detailsModal?.classList.add(
                "hidden"
            )
    );


    closeRelationships?.addEventListener(
        "click",
        () =>
            relationshipsModal?.classList.add(
                "hidden"
            )
    );


    closeSidebar?.addEventListener(
        "click",
        () =>
            document
                .getElementById(
                    "database-sidebar"
                )
                ?.classList.remove(
                    "mobile-open"
                )
    );


    searchInput?.addEventListener(
        "input",
        renderDatabaseTree
    );


    sqlEditor?.addEventListener(
        "input",
        saveCurrentQuery
    );


    sqlEditor?.addEventListener(
        "keydown",
        event => {

            /*
             * Ctrl + Enter / Cmd + Enter
             *
             * Execute statement under cursor
             * or selected statement.
             */
            if (
                event.key === "Enter" &&
                (
                    event.ctrlKey ||
                    event.metaKey
                ) &&
                !event.shiftKey
            ) {

                event.preventDefault();


                executeCurrentQuery();

            }


            /*
             * Ctrl + Shift + Enter /
             * Cmd + Shift + Enter
             *
             * Execute complete SQL worksheet.
             */
            if (
                event.key === "Enter" &&
                (
                    event.ctrlKey ||
                    event.metaKey
                ) &&
                event.shiftKey
            ) {

                event.preventDefault();


                executeCurrentQuery(
                    {
                        executeAll:
                            true
                    }
                );

            }

        }
    );


    initializeResultsResize();


    /*
     * Restore Query 1 SQL text after the DOM
     * is ready.
     */
    const activeQuery =
        queryState.get(
            activeQueryId
        );


    if (
        activeQuery &&
        sqlEditor
    ) {

        sqlEditor.value =
            activeQuery.sql ||
            "";

    }

}


/* ============================================================
 * DEBUG HELPER
 * ============================================================ */

window.getPlaygroundState =
    function () {

        return {

            activeDatabase,

            activeTable,

            databaseCount:
                databases.length,

            databases:
                databases.map(
                    database => ({

                        name:
                            database.name,

                        tableCount:
                            database.tables.length

                    })
                ),

            activeQuery:
                activeQueryId,

            queries:
                Array.from(
                    queryState.entries()
                )
                    .map(
                        (
                            [
                                id,
                                query
                            ]
                        ) => ({

                            id,

                            name:
                                query.name,

                            sqlLength:
                                query.sql.length

                        })
                    )

        };

    };


/* ============================================================
 * GLOBAL STARTUP LOG
 * ============================================================ */

console.log(
    "✅ frontend/playground/playground.js loaded successfully."
);

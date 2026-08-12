/*
 * ============================================================
 * SQL SANDBOX
 * ============================================================
 *
 * STEP 2:
 * SQLite WASM integration + worksheet behaviour.
 *
 * Responsibilities of this file:
 *
 * 1. Initialize SQLite WASM.
 * 2. Create the initial in-browser SQLite database.
 * 3. Execute SQL entered by the user.
 * 4. Display query results.
 * 5. Open results only after Run Query.
 * 6. Resize the results panel by dragging.
 * 7. Minimize / maximize / close results.
 * 8. Download query results as CSV.
 * 9. Handle database creation UI.
 * 10. Handle database explorer interactions.
 *
 * IMPORTANT:
 *
 * sql.js currently keeps the SQLite database in memory.
 * Persistent browser storage for Sandbox databases will be
 * implemented in a later step.
 * ============================================================
 */


/* ============================================================
 * SQLITE CONFIGURATION
 * ============================================================ */

const SQL_WASM_VERSION =
    "1.14.1";


const SQL_WASM_PATH =
    "https://cdnjs.cloudflare.com/ajax/libs/sql.js/" +
    SQL_WASM_VERSION +
    "/";


/* ============================================================
 * SQLITE STATE
 * ============================================================ */

let sqliteEngine = null;


/*
 * The currently active SQLite database.
 *
 * At this stage we maintain one active database.
 *
 * Later this will be expanded so each user-created Sandbox
 * database has its own SQLite instance / stored database.
 */

let activeSqliteDatabase = null;


/*
 * Prevent Run Query from executing before SQLite has finished
 * loading.
 */

let sqliteReady = false;


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


const minimizeResultsButton =
    document.getElementById(
        "minimize-results-button"
    );


const maximizeResultsButton =
    document.getElementById(
        "maximize-results-button"
    );


const closeResultsButton =
    document.getElementById(
        "close-results-button"
    );


const resultsResizeHandle =
    document.getElementById(
        "results-resize-handle"
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


const mobileSidebarButton =
    document.getElementById(
        "mobile-sidebar-button"
    );


const closeSidebarButton =
    document.getElementById(
        "close-sidebar-button"
    );


const databaseSidebar =
    document.getElementById(
        "database-sidebar"
    );


const databaseSearchInput =
    document.getElementById(
        "database-search-input"
    );


/* ============================================================
 * RESULT STORAGE
 * ============================================================ */

let latestResults = null;


/* ============================================================
 * RESULTS PANEL STATE
 * ============================================================ */

const DEFAULT_RESULTS_HEIGHT =
    180;


const MIN_RESULTS_HEIGHT =
    80;


const MAX_RESULTS_HEIGHT =
    650;


/*
 * Stores the previous height before maximize/minimize.
 */

let previousResultsHeight =
    DEFAULT_RESULTS_HEIGHT;


/*
 * Drag state for the results resize handle.
 */

let isResizingResults =
    false;


/* ============================================================
 * SQLITE INITIALIZATION
 * ============================================================ */

async function initializeSQLite() {

    /*
     * sql.js exposes initSqlJs globally because the library
     * was loaded before sandbox.js in sandbox.html.
     */

    if (
        typeof window.initSqlJs !==
        "function"
    ) {

        showStatus(
            "❌ SQLite library could not be loaded.",
            "error"
        );

        return;

    }


    try {

        showStatus(
            "⏳ Initializing SQLite...",
            "info"
        );


        /*
         * Initialize the WebAssembly SQLite engine.
         *
         * locateFile tells sql.js where the corresponding
         * sql-wasm.wasm file is located.
         */

        sqliteEngine =
            await window.initSqlJs({

                locateFile:
                    function (filename) {

                        return (
                            SQL_WASM_PATH +
                            filename
                        );

                    }

            });


        /*
         * Create the first in-memory SQLite database.
         */

        activeSqliteDatabase =
            new sqliteEngine.Database();


        sqliteReady =
            true;


        /*
         * Run Query is now available.
         */

        if (runQueryButton) {

            runQueryButton.disabled =
                false;

        }


        showStatus(
            "✅ SQLite ready.",
            "success"
        );


        /*
         * Remove the temporary status message after a
         * short delay so the worksheet remains clean.
         */

        setTimeout(
            function () {

                if (
                    sandboxStatus &&
                    sandboxStatus.textContent ===
                    "✅ SQLite ready."
                ) {

                    showStatus(
                        "",
                        ""
                    );

                }

            },
            2500
        );


    }
    catch (error) {

        console.error(
            "SQLite initialization failed:",
            error
        );


        sqliteReady =
            false;


        if (runQueryButton) {

            runQueryButton.disabled =
                true;

        }


        showStatus(
            "❌ Failed to initialize SQLite.",
            "error"
        );

    }

}


/* ============================================================
 * RUN QUERY
 * ============================================================ */

if (runQueryButton) {

    /*
     * Disable Run Query until SQLite is ready.
     */

    runQueryButton.disabled =
        true;


    runQueryButton.addEventListener(
        "click",
        executeCurrentQuery
    );

}


/*
 * Main SQL execution function.
 */

function executeCurrentQuery() {

    if (!sqliteReady) {

        showStatus(
            "⏳ SQLite is still loading. Please wait.",
            "info"
        );

        return;

    }


    if (!activeSqliteDatabase) {

        showStatus(
            "❌ No active SQLite database.",
            "error"
        );

        return;

    }


    const query =
        sqlEditor
            ? sqlEditor.value.trim()
            : "";


    /*
     * Do not destroy the user's query when it is empty.
     */

    if (!query) {

        showStatus(
            "❌ Please enter a SQL query.",
            "error"
        );

        if (sqlEditor) {

            sqlEditor.focus();

        }

        return;

    }


    /*
     * Start timing the SQL execution.
     */

    const startTime =
        performance.now();


    try {

        /*
         * db.exec() supports SQL statements such as:
         *
         * CREATE TABLE
         * INSERT
         * UPDATE
         * DELETE
         * SELECT
         *
         * SELECT statements return result sets.
         */

        const executionResults =
            activeSqliteDatabase.exec(
                query
            );


        const endTime =
            performance.now();


        const executionTime =
            Math.round(
                endTime -
                startTime
            );


        /*
         * sql.js returns an array of result sets.
         *
         * For normal worksheet usage we display the first
         * returned result set.
         */

        if (
            !executionResults ||
            executionResults.length === 0
        ) {

            /*
             * CREATE / INSERT / UPDATE / DELETE queries
             * generally do not return rows.
             */

            latestResults = {

                columns: [],

                rows: [],

                executionTime:
                    executionTime

            };


            showResultsPanel();


            resultsSummary.textContent =
                "Query executed • " +
                executionTime +
                " ms";


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


            if (downloadResultsButton) {

                downloadResultsButton.disabled =
                    true;

            }


            /*
             * Refresh the database explorer because a
             * CREATE TABLE statement may have created a
             * new table.
             */

            refreshDatabaseExplorer();


            showStatus(
                "✅ Query executed successfully.",
                "success"
            );


            return;

        }


        /*
         * Use the first result set returned by SQLite.
         */

        const result =
            executionResults[0];


        const columns =
            Array.isArray(result.columns)
                ? result.columns
                : [];


        const values =
            Array.isArray(result.values)
                ? result.values
                : [];


        /*
         * Convert sql.js array rows into objects.
         *
         * This keeps the result renderer independent from
         * the SQLite library.
         */

        const rows =
            values.map(
                function (valueRow) {

                    const row = {};


                    columns.forEach(
                        function (column, index) {

                            row[column] =
                                valueRow[index];

                        }
                    );


                    return row;

                }
            );


        latestResults = {

            columns:
                columns,

            rows:
                rows,

            executionTime:
                executionTime

        };


        /*
         * Display results only after Run Query.
         */

        displaySandboxResults(
            latestResults
        );


        /*
         * Open the results panel.
         */

        showResultsPanel();


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


        /*
         * SQL errors are displayed in the results area rather
         * than destroying the user's SQL.
         */

        showResultsPanel();


        latestResults =
            null;


        if (resultsSummary) {

            resultsSummary.textContent =
                "Query failed";

        }


        if (downloadResultsButton) {

            downloadResultsButton.disabled =
                true;

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

                    <p
                        style="color:#fca5a5;"
                    >
                        ${escapeHTML(
                            error.message ||
                            "SQL execution failed."
                        )}
                    </p>

                </div>

            `;

        }


        showStatus(
            "❌ SQL error: " +
            (
                error.message ||
                "Query failed."
            ),
            "error"
        );

    }

}


/* ============================================================
 * SHOW RESULTS PANEL
 * ============================================================ */

function showResultsPanel() {

    if (!resultsSection) {

        return;

    }


    /*
     * Remove hidden state.
     */

    resultsSection.classList.remove(
        "results-hidden"
    );


    /*
     * Restore compact results height unless the user had
     * explicitly maximized the panel.
     */

    resultsSection.classList.remove(
        "results-maximized"
    );


    resultsSection.classList.remove(
        "results-minimized"
    );


    resultsSection.style.height =
        previousResultsHeight +
        "px";


    resultsSection.style.flexBasis =
        previousResultsHeight +
        "px";

}


/* ============================================================
 * CLOSE RESULTS
 * ============================================================ */

if (closeResultsButton) {

    closeResultsButton.addEventListener(
        "click",
        function () {

            closeResultsPanel();

        }
    );

}


function closeResultsPanel() {

    if (!resultsSection) {

        return;

    }


    resultsSection.classList.remove(
        "results-maximized"
    );


    resultsSection.classList.remove(
        "results-minimized"
    );


    resultsSection.classList.add(
        "results-hidden"
    );


    resultsSection.style.height =
        "";


    resultsSection.style.flexBasis =
        "";

}


/* ============================================================
 * MINIMIZE RESULTS
 * ============================================================ */

if (minimizeResultsButton) {

    minimizeResultsButton.addEventListener(
        "click",
        function () {

            if (!resultsSection) {

                return;

            }


            /*
             * If currently maximized, restore the previous
             * compact height instead of hiding the results.
             */

            if (
                resultsSection.classList.contains(
                    "results-maximized"
                )
            ) {

                resultsSection.classList.remove(
                    "results-maximized"
                );


                resultsSection.classList.remove(
                    "results-minimized"
                );


                resultsSection.style.height =
                    previousResultsHeight +
                    "px";


                resultsSection.style.flexBasis =
                    previousResultsHeight +
                    "px";


                return;

            }


            /*
             * Store current height before minimizing.
             */

            const currentHeight =
                resultsSection.offsetHeight;


            if (
                currentHeight >
                MIN_RESULTS_HEIGHT
            ) {

                previousResultsHeight =
                    currentHeight;

            }


            resultsSection.classList.add(
                "results-minimized"
            );

        }
    );

}


/* ============================================================
 * MAXIMIZE RESULTS
 * ============================================================ */

if (maximizeResultsButton) {

    maximizeResultsButton.addEventListener(
        "click",
        function () {

            if (!resultsSection) {

                return;

            }


            /*
             * If already maximized, restore the previous
             * height.
             */

            if (
                resultsSection.classList.contains(
                    "results-maximized"
                )
            ) {

                resultsSection.classList.remove(
                    "results-maximized"
                );


                resultsSection.style.height =
                    previousResultsHeight +
                    "px";


                resultsSection.style.flexBasis =
                    previousResultsHeight +
                    "px";


                return;

            }


            /*
             * Save current height before maximizing.
             */

            const currentHeight =
                resultsSection.offsetHeight;


            if (
                currentHeight >
                MIN_RESULTS_HEIGHT
            ) {

                previousResultsHeight =
                    currentHeight;

            }


            resultsSection.classList.remove(
                "results-minimized"
            );


            resultsSection.classList.add(
                "results-maximized"
            );

        }
    );

}


/* ============================================================
 * DRAGGABLE RESULTS RESIZE
 * ============================================================ */

if (resultsResizeHandle) {

    resultsResizeHandle.addEventListener(
        "mousedown",
        startResultsResize
    );

}


/*
 * Start vertical resize.
 */

function startResultsResize(event) {

    if (!resultsSection) {

        return;

    }


    /*
     * Do not resize while maximized or minimized.
     */

    if (
        resultsSection.classList.contains(
            "results-maximized"
        ) ||
        resultsSection.classList.contains(
            "results-minimized"
        )
    ) {

        return;

    }


    event.preventDefault();


    isResizingResults =
        true;


    document.body.style.cursor =
        "ns-resize";


    document.body.style.userSelect =
        "none";


    document.addEventListener(
        "mousemove",
        resizeResultsPanel
    );


    document.addEventListener(
        "mouseup",
        stopResultsResize
    );

}


/*
 * Calculate the new results height while dragging.
 */

function resizeResultsPanel(event) {

    if (!isResizingResults) {

        return;

    }

/*
     * Results are attached to the bottom of the workspace.
     *
     * Therefore:
     *
     * Mouse moves upward → results become taller.
     * Mouse moves downward → results become smaller.
     */

    const workspace =
        document.querySelector(
            ".sandbox-workspace"
        );


    if (!workspace) {

        return;

    }


    const workspaceRect =
        workspace.getBoundingClientRect();


    const desiredHeight =
        workspaceRect.bottom -
        event.clientY;


    const workspaceHeight =
        workspaceRect.height;


    const maximumAllowed =
        Math.min(
            MAX_RESULTS_HEIGHT,
            workspaceHeight - 180
        );


    const newHeight =
        Math.max(
            MIN_RESULTS_HEIGHT,
            Math.min(
                desiredHeight,
                maximumAllowed
            )
        );


    previousResultsHeight =
        newHeight;


    resultsSection.style.height =
        newHeight +
        "px";


    resultsSection.style.flexBasis =
        newHeight +
        "px";

}


/*
 * Stop vertical resize.
 */

function stopResultsResize() {

    if (!isResizingResults) {

        return;

    }


    isResizingResults =
        false;


    document.body.style.cursor =
        "";


    document.body.style.userSelect =
        "";


    document.removeEventListener(
        "mousemove",
        resizeResultsPanel
    );


    document.removeEventListener(
        "mouseup",
        stopResultsResize
    );

}


/* ============================================================
 * DATABASE MODAL
 * ============================================================ */

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
        function () {

            const name =
                databaseNameInput.value.trim();


            if (!name) {

                showModalError(
                    "Please enter a database name."
                );

                return;

            }


            /*
             * For this first SQLite step, creating a database
             * means creating a fresh in-memory SQLite database.
             *
             * Persistent database storage will be added later.
             */

            if (sqliteEngine) {

                if (activeSqliteDatabase) {

                    activeSqliteDatabase.close();

                }


                activeSqliteDatabase =
                    new sqliteEngine.Database();

            }


            closeDatabaseModalWindow();


            showStatus(
                "✅ Database '" +
                name +
                "' created.",
                "success"
            );


            /*
             * Clear any old query results because the active
             * database has changed.
             */

            latestResults =
                null;


            closeResultsPanel();


            clearResultsDisplay();


            /*
             * Database explorer will be populated by SQLite
             * metadata in a later refinement.
             */

        }
    );

}


/* ============================================================
 * OPEN DATABASE MODAL
 * ============================================================ */

function openDatabaseModal() {

    if (!databaseModal) {

        return;

    }


    databaseModal.classList.remove(
        "hidden"
    );


    if (databaseNameInput) {

        databaseNameInput.value = "";

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

}


/* ============================================================
 * MODAL ERROR
 * ============================================================ */

function showModalError(message) {

    const existing =
        document.querySelector(
            ".modal-error"
        );


    if (existing) {

        existing.remove();

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


    if (
        databaseNameInput &&
        databaseNameInput.parentElement
    ) {

        databaseNameInput
            .parentElement
            .appendChild(
                error
            );

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
 * CLEAR RESULTS DISPLAY
 * ============================================================

 * This does NOT clear the SQL editor.
 *
 * The user's query is intentionally preserved.
 * ============================================================
 */

function clearResultsDisplay() {

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

}


/* ============================================================
 * DOWNLOAD RESULTS
 * ============================================================ */

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


/* ============================================================
 * CSV DOWNLOAD
 * ============================================================ */

function downloadCSV(data) {

    if (
        !data ||
        !Array.isArray(data.columns) ||
        !Array.isArray(data.rows)
    ) {

        return;

    }


    const lines = [];


    /*
     * Header
     */

    lines.push(
        data.columns
            .map(csvEscape)
            .join(",")
    );


    /*
     * Rows
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

function csvEscape(value) {

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
 * MOBILE SIDEBAR
 * ============================================================ */

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


/* ============================================================
 * DATABASE TREE
 * ============================================================ */

function attachDatabaseTreeEvents() {

    document
        .querySelectorAll(
            ".database-header"
        )
        .forEach(
            function (header) {

                /*
                 * Prevent duplicate listeners when the tree
                 * is refreshed.
                 */

                if (
                    header.dataset.bound ===
                    "true"
                ) {

                    return;

                }


                header.dataset.bound =
                    "true";


                header.addEventListener(
                    "click",
                    function () {

                        const databaseItem =
                            header.parentElement;


                        const tableList =
                            databaseItem.querySelector(
                                ".table-list"
                            );


                        const arrow =
                            header.querySelector(
                                ".database-arrow"
                            );


                        if (!tableList) {

                            return;

                        }


                        const isHidden =
                            tableList.style.display ===
                            "none";


                        tableList.style.display =
                            isHidden
                                ? "block"
                                : "none";


                        if (arrow) {

                            arrow.textContent =
                                isHidden
                                    ? "▼"
                                    : "▶";

                        }

                    }
                );

            }
        );


    attachTableClickEvents();

}


/* ============================================================
 * TABLE CLICK
 * ============================================================ */

function attachTableClickEvents() {

    document
        .querySelectorAll(
            ".table-item"
        )
        .forEach(
            function (table) {

                if (
                    table.dataset.bound ===
                    "true"
                ) {

                    return;

                }


                table.dataset.bound =
                    "true";


                table.addEventListener(
                    "click",
                    function () {

                        const tableName =
                            table.dataset.table;


                        if (!tableName) {

                            return;

                        }


                        if (sqlEditor) {

                            sqlEditor.value =
                                "SELECT *\n" +
                                "FROM " +
                                tableName +
                                ";";


                            sqlEditor.focus();

                        }


                        if (databaseSidebar) {

                            databaseSidebar.classList.remove(
                                "mobile-open"
                            );

                        }

                    }
                );

            }
        );

}


/* ============================================================
 * TABLE SEARCH
 * ============================================================ */

if (databaseSearchInput) {

    databaseSearchInput.addEventListener(
        "input",
        function () {

            const search =
                databaseSearchInput.value
                    .trim()
                    .toLowerCase();


            document
                .querySelectorAll(
                    ".table-item"
                )
                .forEach(
                    function (table) {

                        const tableName =
                            (
                                table.dataset.table ||
                                ""
                            )
                            .toLowerCase();


                        table.style.display =
                            tableName.includes(
                                search
                            )
                                ? "flex"
                                : "none";

                    }
                );

        }
    );

}


/* ============================================================
 * REFRESH DATABASE EXPLORER
 * ============================================================

 * Reads SQLite metadata and updates the table list.
 *
 * This is intentionally simple for Step 2.
 * The full multi-database explorer will be implemented later.
 * ============================================================
 */

function refreshDatabaseExplorer() {

    if (
        !activeSqliteDatabase ||
        !databaseTreeAvailable()
    ) {

        return;

    }


    try {

        const queryResult =
            activeSqliteDatabase.exec(
                `
                SELECT
                    name
                FROM sqlite_master
                WHERE type = 'table'
                AND name NOT LIKE 'sqlite_%'
                ORDER BY name;
                `
            );


        const tableNames =
            queryResult.length > 0
                ? queryResult[0].values.map(
                    function (row) {

                        return row[0];

                    }
                )
                : [];


        /*
         * At this point we only refresh the tree when there
         * is an existing database tree structure.
         *
         * Full dynamic database rendering comes next.
         */

        console.log(
            "SQLite tables:",
            tableNames
        );

    }
    catch (error) {

        console.error(
            "Failed to refresh database explorer:",
            error
        );

    }

}


/* ============================================================
 * DATABASE TREE CHECK
 * ============================================================ */

function databaseTreeAvailable() {

    return Boolean(
        document.getElementById(
            "database-tree"
        )
    );

}


/* ============================================================
 * GLOBAL RESULT RENDERER
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


        if (!resultsContainer) {

            return;

        }


        /*
         * No rows returned.
         */

        if (rows.length === 0) {

            resultsContainer.innerHTML = `

                <div class="empty-results">

                    <div class="empty-results-icon">
                        ✓
                    </div>

                    <p>
                        Query executed successfully.
                        No rows returned.
                    </p>

                </div>

            `;

        }


        /*
         * Render result table.
         */

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

    };


/* ============================================================
 * HTML ESCAPE
 * ============================================================ */

function escapeHTML(value) {

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
 * INITIAL STATE
 * ============================================================ */

/*
 * Results are hidden when the page initially loads.
 *
 * This gives the SQL editor maximum available space.
 */

clearResultsDisplay();


closeResultsPanel();


/*
 * Start SQLite.
 */

initializeSQLite();


console.log(
    "✅ SQL Sandbox UI loaded."
);

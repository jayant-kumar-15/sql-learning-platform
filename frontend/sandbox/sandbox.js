/*
 * ============================================================
 * SQL SANDBOX
 * ============================================================
 *
 * Current responsibilities:
 *
 * 1. SQL editor UI behaviour
 * 2. Query execution button behaviour
 * 3. Query results rendering
 * 4. CSV download
 * 5. Database creation UI
 * 6. Database Explorer rendering
 * 7. Database/table persistence using localStorage
 * 8. Table selection -> SQL editor
 * 9. Mobile database sidebar
 *
 * IMPORTANT:
 * ------------------------------------------------------------
 * The actual SQLite execution engine can be connected later.
 *
 * For now, this file maintains the Sandbox structure and
 * persists databases/tables in the browser.
 *
 * Persistence layer:
 *     localStorage
 *
 * Later:
 *     SQLite WASM can use this same state structure.
 * ============================================================
 */


/* ============================================================
 * STORAGE CONFIGURATION
 * ============================================================ */

/*
 * Single storage key for the Sandbox.
 *
 * Keeping one central key makes future migration easier.
 */

const SANDBOX_STORAGE_KEY =
    "sqlLearningPlatformSandbox";


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


const activeDatabaseLabel =
    document.getElementById(
        "active-database-label"
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


const databaseTree =
    document.getElementById(
        "database-tree"
    );


const emptyDatabaseMessage =
    document.getElementById(
        "empty-database-message"
    );


const databaseSearchInput =
    document.getElementById(
        "database-search-input"
    );


/* ============================================================
 * SANDBOX STATE
 * ============================================================ */

/*
 * Example state:
 *
 * {
 *     databases: [
 *
 *         {
 *             id: "db_123",
 *             name: "HealthcareDB",
 *             tables: [
 *
 *                 {
 *                     name: "Patients"
 *                 },
 *
 *                 {
 *                     name: "Doctors"
 *                 }
 *
 *             ]
 *         }
 *
 *     ],
 *
 *     activeDatabaseId: "db_123"
 * }
 *
 * This structure is intentionally simple.
 *
 * Later SQLite WASM can become the actual SQL engine while
 * this state continues to control the Sandbox UI.
 */

let sandboxState = {
    databases: [],
    activeDatabaseId: null
};


/*
 * Stores the most recent query result.
 *
 * Used by CSV download.
 */

let latestResults = null;


/* ============================================================
 * LOAD SANDBOX STATE
 * ============================================================ */

/*
 * Load previously saved Sandbox data from localStorage.
 *
 * This is called when the page opens.
 */

function loadSandboxState() {

    try {

        const savedState =
            localStorage.getItem(
                SANDBOX_STORAGE_KEY
            );


        if (!savedState) {

            sandboxState = {
                databases: [],
                activeDatabaseId: null
            };

            return;

        }


        const parsedState =
            JSON.parse(
                savedState
            );


        /*
         * Basic validation.
         *
         * Prevents corrupted localStorage data from
         * breaking the Sandbox.
         */

        if (
            !parsedState ||
            !Array.isArray(
                parsedState.databases
            )
        ) {

            sandboxState = {
                databases: [],
                activeDatabaseId: null
            };

            return;

        }


        sandboxState = {

            databases:
                parsedState.databases,

            activeDatabaseId:
                parsedState.activeDatabaseId ||
                null

        };


    }

    catch (error) {

        console.error(
            "❌ Failed to load Sandbox state:",
            error
        );


        sandboxState = {
            databases: [],
            activeDatabaseId: null
        };

    }

}


/* ============================================================
 * SAVE SANDBOX STATE
 * ============================================================ */

/*
 * Save the current Sandbox state.
 *
 * Every database/table change should call this function.
 */

function saveSandboxState() {

    try {

        localStorage.setItem(
            SANDBOX_STORAGE_KEY,
            JSON.stringify(
                sandboxState
            )
        );

    }

    catch (error) {

        console.error(
            "❌ Failed to save Sandbox state:",
            error
        );


        showStatus(
            "❌ Unable to save Sandbox data in this browser.",
            "error"
        );

    }

}


/* ============================================================
 * DATABASE ID
 * ============================================================ */

/*
 * Generate a unique ID for each database.
 *
 * We do not use the database name as the ID because the name
 * may later be renamed.
 */

function generateDatabaseId() {

    return (
        "db_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );

}


/* ============================================================
 * GET ACTIVE DATABASE
 * ============================================================ */

function getActiveDatabase() {

    if (
        !sandboxState.activeDatabaseId
    ) {

        return null;

    }


    return (
        sandboxState.databases.find(
            function (database) {

                return (
                    database.id ===
                    sandboxState.activeDatabaseId
                );

            }
        ) || null
    );

}


/* ============================================================
 * UPDATE ACTIVE DATABASE LABEL
 * ============================================================ */

function updateActiveDatabaseLabel() {

    if (!activeDatabaseLabel) {

        return;

    }


    const activeDatabase =
        getActiveDatabase();


    if (activeDatabase) {

        activeDatabaseLabel.textContent =
            activeDatabase.name;

    }

    else {

        /*
         * The current HTML does not display this label,
         * but keeping this function makes the code compatible
         * if the label is added later.
         */

        activeDatabaseLabel.textContent =
            "No database selected";

    }

}


/* ============================================================
 * DATABASE TREE RENDERING
 * ============================================================ */

/*
 * Rebuild the entire Database Explorer from sandboxState.
 *
 * This is important because:
 *
 *     localStorage
 *          ↓
 *     sandboxState
 *          ↓
 *     renderDatabaseTree()
 *          ↓
 *     left Database Explorer
 *
 * Therefore the UI always reflects the saved state.
 */

function renderDatabaseTree() {

    if (!databaseTree) {

        return;

    }


    /*
     * Remove dynamically generated database items.
     *
     * Keep the original empty-state element.
     */

    databaseTree
        .querySelectorAll(
            ".database-item"
        )
        .forEach(
            function (item) {

                item.remove();

            }
        );


    /*
     * No databases.
     */

    if (
        sandboxState.databases.length === 0
    ) {

        if (emptyDatabaseMessage) {

            emptyDatabaseMessage.style.display =
                "block";

        }


        updateActiveDatabaseLabel();

        return;

    }


    /*
     * Databases exist.
     */

    if (emptyDatabaseMessage) {

        emptyDatabaseMessage.style.display =
            "none";

    }


    sandboxState.databases.forEach(
        function (database) {

            createDatabaseTreeItem(
                database
            );

        }
    );


    updateActiveDatabaseLabel();


    attachDatabaseTreeEvents();

}


/* ============================================================
 * CREATE DATABASE TREE ITEM
 * ============================================================ */

/*
 * Creates one database section inside the left sidebar.
 *
 * Example:
 *
 * ▼ HealthcareDB
 *     🗃 Patients
 *     🗃 Doctors
 */

function createDatabaseTreeItem(
    database
) {

    const databaseItem =
        document.createElement(
            "div"
        );


    databaseItem.className =
        "database-item";


    databaseItem.dataset.databaseId =
        database.id;


    const databaseHeader =
        document.createElement(
            "div"
        );


    databaseHeader.className =
        "database-header";


    databaseHeader.innerHTML = `

        <span class="database-arrow">
            ▼
        </span>

        <span class="database-icon">
            🗄️
        </span>

        <span class="database-name">
            ${escapeHTML(database.name)}
        </span>

    `;


    const tableList =
        document.createElement(
            "div"
        );


    tableList.className =
        "table-list";


    /*
     * Render tables belonging to this database.
     */

    if (
        Array.isArray(
            database.tables
        )
    ) {

        database.tables.forEach(
            function (table) {

                const tableItem =
                    document.createElement(
                        "div"
                    );


                tableItem.className =
                    "table-item";


                tableItem.dataset.table =
                    table.name;


                tableItem.dataset.databaseId =
                    database.id;


                tableItem.innerHTML = `

                    <span>
                        🗃️
                    </span>

                    <span>
                        ${escapeHTML(table.name)}
                    </span>

                `;


                tableList.appendChild(
                    tableItem
                );

            }
        );

    }


    databaseItem.appendChild(
        databaseHeader
    );


    databaseItem.appendChild(
        tableList
    );


    databaseTree.appendChild(
        databaseItem
    );

}


/* ============================================================
 * DATABASE TREE EVENTS
 * ============================================================ */

/*
 * Attach events after every database tree refresh.
 */

function attachDatabaseTreeEvents() {


    /*
     * Database expand/collapse.
     */

    document
        .querySelectorAll(
            ".database-header"
        )
        .forEach(
            function (header) {

                header.addEventListener(
                    "click",
                    function () {

                        const databaseItem =
                            header.parentElement;


                        const databaseId =
                            databaseItem.dataset.databaseId;


                        const tableList =
                            databaseItem.querySelector(
                                ".table-list"
                            );


                        const arrow =
                            header.querySelector(
                                ".database-arrow"
                            );


                        /*
                         * Make clicked database active.
                         */

                        if (
                            sandboxState.activeDatabaseId !==
                            databaseId
                        ) {

                            sandboxState.activeDatabaseId =
                                databaseId;


                            saveSandboxState();

                            updateActiveDatabaseLabel();

                        }


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


    /*
     * Table click.
     */

    document
        .querySelectorAll(
            ".table-item"
        )
        .forEach(
            function (table) {

                table.addEventListener(
                    "click",
                    function () {

                        const tableName =
                            table.dataset.table;


                        const databaseId =
                            table.dataset.databaseId;


                        /*
                         * Make the table's database active.
                         */

                        sandboxState.activeDatabaseId =
                            databaseId;


                        saveSandboxState();


                        updateActiveDatabaseLabel();


                        /*
                         * Populate the SQL editor.
                         */

                        if (sqlEditor) {

                            sqlEditor.value =
                                "SELECT *\n" +
                                "FROM " +
                                tableName +
                                ";";


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
                            "ℹ️ Table '" +
                            tableName +
                            "' selected.",
                            "info"
                        );

                    }
                );

            }
        );

}


/* ============================================================
 * CREATE DATABASE
 * ============================================================ */

if (createDatabaseButton) {

    createDatabaseButton.addEventListener(
        "click",
        function () {

            openDatabaseModal();

        }
    );

}


/* ============================================================
 * DATABASE MODAL
 * ============================================================ */

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


/* ============================================================
 * SAVE DATABASE
 * ============================================================ */

/*
 * Creates a new persistent database entry.
 *
 * Important:
 *
 * This currently creates the Sandbox database structure.
 *
 * Actual SQLite database creation will be connected in the
 * SQLite integration step.
 */

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
             * Prevent duplicate database names.
             */

            const duplicate =
                sandboxState.databases.some(
                    function (database) {

                        return (
                            database.name
                                .toLowerCase() ===
                            name.toLowerCase()
                        );

                    }
                );


            if (duplicate) {

                showModalError(
                    "A database with this name already exists."
                );

                return;

            }


            /*
             * Create database object.
             */

            const database = {

                id:
                    generateDatabaseId(),

                name:
                    name,

                tables:
                    []

            };


            /*
             * Add to Sandbox state.
             */

            sandboxState.databases.push(
                database
            );


            /*
             * Automatically select the new database.
             */

            sandboxState.activeDatabaseId =
                database.id;


            /*
             * Persist immediately.
             */

            saveSandboxState();


            /*
             * Refresh left Database Explorer.
             */

            renderDatabaseTree();


            /*
             * Close modal.
             */

            closeDatabaseModalWindow();


            /*
             * Tell user what happened.
             */

            showStatus(
                "✅ Database '" +
                name +
                "' created successfully.",
                "success"
            );

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


    /*
     * Remove previous modal error.
     */

    const existingError =
        document.querySelector(
            ".modal-error"
        );


    if (existingError) {

        existingError.remove();

    }

}


/* ============================================================
 * MODAL ERROR
 * ============================================================ */

function showModalError(
    message
) {

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
        "#ef4444";


    error.style.fontSize =
        "12px";


    error.style.marginTop =
        "8px";


    error.textContent =
        message;


    if (databaseNameInput) {

        databaseNameInput
            .parentElement
            .appendChild(
                error
            );

    }

}


/* ============================================================
 * RUN QUERY
 * ============================================================ */

/*
 * At this stage the actual SQLite engine is not connected.
 *
 * This handler is intentionally kept ready for the next
 * SQLite integration step.
 */

if (runQueryButton) {

    runQueryButton.addEventListener(
        "click",
        function () {

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


            /*
             * SQLite execution will be connected here.
             */

            showStatus(
                "ℹ️ SQL engine connection will be added next.",
                "info"
            );

        }
    );

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
        (type || "");

}


/* ============================================================
 * CLEAR RESULTS
 * ============================================================ */

/*
 * Results are NOT automatically cleared when the user types.
 *
 * This protects the user's previous result until another query
 * is executed.
 */

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


    const lines = [];


    /*
     * CSV header.
     */

    lines.push(
        data.columns
            .map(csvEscape)
            .join(",")
    );


    /*
     * CSV rows.
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


    const stringValue =
        String(value);


    return (
        '"' +
        stringValue.replace(
            /"/g,
            '""'
        ) +
        '"'
    );

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
 * TABLE SEARCH
 * ============================================================ */

/*
 * Search works against dynamically generated tables.
 *
 * Therefore the listener is attached to the search box and
 * searches the current DOM every time the user types.
 */

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
                    ".database-item"
                )
                .forEach(
                    function (databaseItem) {

                        const databaseName =
                            databaseItem
                                .querySelector(
                                    ".database-name"
                                )
                                ?.textContent
                                .toLowerCase() ||
                            "";


                        let databaseMatches =
                            databaseName.includes(
                                search
                            );


                        let visibleTableCount =
                            0;


                        databaseItem
                            .querySelectorAll(
                                ".table-item"
                            )
                            .forEach(
                                function (table) {

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

                                        visibleTableCount++;

                                    }

                                }
                            );


                        /*
                         * Show the database if either:
                         *
                         * - database name matches
                         * - at least one table matches
                         */

                        databaseItem.style.display =
                            (
                                search === "" ||
                                databaseMatches ||
                                visibleTableCount > 0
                            )
                                ? "block"
                                : "none";

                    }
                );

        }
    );

}


/* ============================================================
 * GLOBAL SANDBOX RESULT RENDERER
 * ============================================================ */

/*
 * SQLite will call:
 *
 *     window.displaySandboxResults(data)
 *
 * Example data:
 *
 * {
 *     columns: ["id", "name"],
 *     rows: [
 *         {
 *             id: 1,
 *             name: "Jayant"
 *         }
 *     ],
 *     executionTime: 12
 * }
 */

window.displaySandboxResults =
    function (data) {

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
         * Update result summary.
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
         * Query executed but returned no rows.
         */

        if (rows.length === 0) {

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


        /*
         * Enable CSV download only when rows exist.
         */

        if (downloadResultsButton) {

            downloadResultsButton.disabled =
                rows.length === 0;

        }

    };


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
 * INITIALIZE SANDBOX
 * ============================================================ */

/*
 * Important initialization order:
 *
 * 1. Load saved state
 * 2. Render Database Explorer
 * 3. Update active database
 * 4. Reset query-result UI
 *
 * This means refreshing sandbox.html will NOT remove the
 * databases created by the user.
 */

loadSandboxState();

renderDatabaseTree();

updateActiveDatabaseLabel();

clearResults();


console.log(
    "✅ Sandbox UI and persistent state loaded successfully."
);

/*
 * ============================================================
 * SQL SANDBOX
 * ============================================================
 *
 * Current step:
 * - UI behaviour
 * - Query editor
 * - Query results open/close behaviour
 * - Database modal
 * - Database sidebar
 * - Table selection
 * - CSV download
 *
 * SQLite execution will be connected in the next step.
 * ============================================================
 */


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


const closeResultsButton =
    document.getElementById("close-results-button");


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


const activeDatabaseLabel =
    document.getElementById("active-database-label");


const mobileSidebarButton =
    document.getElementById("mobile-sidebar-button");


const closeSidebarButton =
    document.getElementById("close-sidebar-button");


const databaseSidebar =
    document.getElementById("database-sidebar");


const databaseSearchInput =
    document.getElementById("database-search-input");


/* ============================================================
 * TEMPORARY RESULT STORAGE
 * ============================================================ */

let latestResults = null;


/* ============================================================
 * RESULTS PANEL STATE
 * ============================================================ */

/*
 * Open the Query Results panel.
 *
 * CSS will use the "results-open" class to reduce the
 * SQL editor height and give space to the results.
 */

function openResultsPanel() {

    if (!resultsSection) {
        return;
    }


    resultsSection.hidden = false;

    resultsSection.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "results-open"
    );

}


/*
 * Close the Query Results panel.
 *
 * The SQL editor automatically gets the released
 * space through CSS.
 */

function closeResultsPanel() {

    if (!resultsSection) {
        return;
    }


    resultsSection.hidden = true;

    resultsSection.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "results-open"
    );


    /*
     * Return cursor to SQL editor.
     */

    if (sqlEditor) {

        sqlEditor.focus();

    }

}


/* ============================================================
 * CLOSE RESULTS BUTTON
 * ============================================================ */

if (closeResultsButton) {

    closeResultsButton.addEventListener(
        "click",
        function () {

            closeResultsPanel();

        }
    );

}


/* ============================================================
 * RUN QUERY
 * ============================================================ */

if (runQueryButton) {

    runQueryButton.addEventListener(
        "click",
        function () {

            if (!sqlEditor) {
                return;
            }


            const query =
                sqlEditor.value.trim();


            /*
             * Do not open results if
             * the query editor is empty.
             */

            if (!query) {

                showStatus(
                    "❌ Please enter a SQL query.",
                    "error"
                );

                sqlEditor.focus();

                return;

            }


            /*
             * Open results ONLY after
             * the user clicks Run Query.
             */

            openResultsPanel();


            /*
             * SQLite will be connected here
             * in the next development step.
             */

            showStatus(
                "ℹ️ SQL engine connection will be added next.",
                "info"
            );


            /*
             * Temporary result state.
             *
             * This prevents the old result from
             * remaining visible when a new query
             * is executed.
             */

            latestResults = null;


            if (resultsSummary) {

                resultsSummary.textContent =
                    "Waiting for SQL engine...";

            }


            if (downloadResultsButton) {

                downloadResultsButton.disabled =
                    true;

            }


            if (resultsContainer) {

                resultsContainer.innerHTML = `

                    <div class="empty-results">

                        <div class="empty-results-icon">
                            ◫
                        </div>

                        <p>
                            SQL engine connection will be added next.
                        </p>

                    </div>

                `;

            }

        }
    );

}


/* ============================================================
 * DATABASE MODAL
 * ============================================================ */

if (createDatabaseButton) {

    createDatabaseButton.addEventListener(
        "click",
        function () {

            openDatabaseModal();

        }
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


/* ============================================================
 * SAVE DATABASE
 * ============================================================ */

if (saveDatabaseButton) {

    saveDatabaseButton.addEventListener(
        "click",
        function () {

            if (!databaseNameInput) {
                return;
            }


            const name =
                databaseNameInput.value.trim();


            if (!name) {

                showModalError(
                    "Please enter a database name."
                );

                databaseNameInput.focus();

                return;

            }


            /*
             * Temporary UI behaviour.
             *
             * Actual SQLite/database storage
             * will be added in the next step.
             */

            if (activeDatabaseLabel) {

                activeDatabaseLabel.textContent =
                    name;

            }


            closeDatabaseModalWindow();


            showStatus(
                "✅ Database '" +
                name +
                "' will be created in the next step.",
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

}


/* ============================================================
 * CLOSE MODAL WHEN CLICKING OVERLAY
 * ============================================================ */

if (databaseModal) {

    databaseModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                databaseModal
            ) {

                closeDatabaseModalWindow();

            }

        }
    );

}


/* ============================================================
 * MODAL ERROR
 * ============================================================ */

function showModalError(message) {

    if (!databaseNameInput) {
        return;
    }


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


    databaseNameInput
        .parentElement
        .appendChild(
            error
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

function clearResults() {

    latestResults = null;


    /*
     * Close results panel completely.
     */

    closeResultsPanel();


    /*
     * Reset result content.
     */

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

if (
    mobileSidebarButton &&
    databaseSidebar
) {

    mobileSidebarButton.addEventListener(
        "click",
        function () {

            databaseSidebar.classList.add(
                "mobile-open"
            );

        }
    );

}


if (
    closeSidebarButton &&
    databaseSidebar
) {

    closeSidebarButton.addEventListener(
        "click",
        function () {

            databaseSidebar.classList.remove(
                "mobile-open"
            );

        }
    );

}


/* ============================================================
 * DATABASE TREE
 *
 * Event delegation is used here so that databases/tables
 * created dynamically by sandbox.js will also work.
 * ============================================================ */

if (databaseSidebar) {

    databaseSidebar.addEventListener(
        "click",
        function (event) {

            const header =
                event.target.closest(
                    ".database-header"
                );


            if (header) {

                toggleDatabaseTree(
                    header
                );

                return;

            }


            const table =
                event.target.closest(
                    ".table-item"
                );


            if (table) {

                selectTable(
                    table
                );

            }

        }
    );

}


/* ============================================================
 * DATABASE TREE TOGGLE
 * ============================================================ */

function toggleDatabaseTree(header) {

    const databaseItem =
        header.parentElement;


    if (!databaseItem) {
        return;
    }


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


/* ============================================================
 * TABLE SELECTION
 * ============================================================ */

function selectTable(table) {

    if (!sqlEditor) {
        return;
    }


    const tableName =
        table.dataset.table;


    if (!tableName) {
        return;
    }


    sqlEditor.value =
        "SELECT *\n" +
        "FROM " +
        tableName +
        ";";


    sqlEditor.focus();


    /*
     * If mobile sidebar is open,
     * close it after table selection.
     */

    if (databaseSidebar) {

        databaseSidebar.classList.remove(
            "mobile-open"
        );

    }

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


            /*
             * Search tables.
             */

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
                            ).toLowerCase();


                        table.style.display =
                            tableName.includes(search)
                                ? "flex"
                                : "none";

                    }
                );


            /*
             * Search database names too.
             */

            document
                .querySelectorAll(
                    ".database-item"
                )
                .forEach(
                    function (databaseItem) {

                        const databaseNameElement =
                            databaseItem.querySelector(
                                ".database-name"
                            );


                        const databaseName =
                            databaseNameElement
                                ? databaseNameElement.textContent
                                    .trim()
                                    .toLowerCase()
                                : "";


                        const matchingTable =
                            databaseItem.querySelector(
                                ".table-item:not([style*='display: none'])"
                            );


                        const shouldShow =
                            !search ||
                            databaseName.includes(search) ||
                            !!matchingTable;


                        databaseItem.style.display =
                            shouldShow
                                ? ""
                                : "none";

                    }
                );

        }
    );

}


/* ============================================================
 * GLOBAL SANDBOX RESULT RENDERER
 * ============================================================
 *
 * SQLite engine will call this function later:
 *
 * window.displaySandboxResults({
 *     columns: [...],
 *     rows: [...],
 *     executionTime: 12
 * });
 * ============================================================ */

window.displaySandboxResults =
    function (data) {

        if (!data) {
            return;
        }


        /*
         * Open results automatically when actual
         * query data is received.
         */

        openResultsPanel();


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

            const executionTime =
                Number(
                    data.executionTime || 0
                );


            resultsSummary.textContent =
                rows.length +
                " row" +
                (
                    rows.length === 1
                        ? ""
                        : "s"
                ) +
                " • " +
                executionTime +
                " ms";

        }


        if (!resultsContainer) {
            return;
        }


        /*
         * No rows.
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
         * Rows returned.
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
         * Enable CSV only when rows exist.
         */

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
 * KEYBOARD SHORTCUT
 *
 * Ctrl + Enter / Cmd + Enter
 * runs the query.
 * ============================================================ */

if (sqlEditor) {

    sqlEditor.addEventListener(
        "keydown",
        function (event) {

            if (
                (event.ctrlKey || event.metaKey) &&
                event.key === "Enter"
            ) {

                event.preventDefault();


                if (runQueryButton) {

                    runQueryButton.click();

                }

            }

        }
    );

}


/* ============================================================
 * ESC KEY
 *
 * Close results or modal.
 * ============================================================ */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {
            return;
        }


        /*
         * Close results first.
         */

        if (
            resultsSection &&
            !resultsSection.hidden
        ) {

            closeResultsPanel();

            return;

        }


        /*
         * Close database modal.
         */

        if (
            databaseModal &&
            !databaseModal.classList.contains(
                "hidden"
            )
        ) {

            closeDatabaseModalWindow();

        }

    }
);


/* ============================================================
 * INITIAL STATE
 * ============================================================ */

/*
 * Results MUST be closed when page loads.
 */

closeResultsPanel();


/*
 * Reset result data.
 */

clearResults();


/*
 * Make sure editor receives focus.
 */

if (sqlEditor) {

    sqlEditor.focus();

}


/* ============================================================
 * READY
 * ============================================================ */

console.log(
    "✅ SQL Sandbox UI loaded successfully."
);

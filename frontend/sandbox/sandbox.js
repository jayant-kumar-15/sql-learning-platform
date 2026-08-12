/*
 * ============================================================
 * SQL SANDBOX
 * ============================================================
 *
 * Step 1:
 * UI behaviour only.
 *
 * SQLite connection will be added in the next step.
 * ============================================================
 */


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


const clearQueryButton =
    document.getElementById(
        "clear-query-button"
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


const databaseSearchInput =
    document.getElementById(
        "database-search-input"
    );


/* ============================================================
 * TEMPORARY RESULT STORAGE
 * ============================================================ */

let latestResults = null;


/* ============================================================
 * RUN QUERY
 * ============================================================ */

if (runQueryButton) {

    runQueryButton.addEventListener(
        "click",
        function () {

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
             * SQLite will be connected
             * here in Step 2.
             */

            showStatus(
                "ℹ️ SQL engine connection will be added next.",
                "info"
            );

        }
    );

}


/* ============================================================
 * CLEAR QUERY
 * ============================================================ */

if (clearQueryButton) {

    clearQueryButton.addEventListener(
        "click",
        function () {

            sqlEditor.value = "";

            sqlEditor.focus();

            clearResults();

            showStatus(
                "",
                ""
            );

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
             * Temporary UI behaviour.
             *
             * Actual IndexedDB/SQLite
             * creation comes in Step 2.
             */

            activeDatabaseLabel.textContent =
                name;

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

    databaseModal.classList.remove(
        "hidden"
    );

    databaseNameInput.value = "";

    databaseNameInput.focus();

}


/* ============================================================
 * CLOSE DATABASE MODAL
 * ============================================================ */

function closeDatabaseModalWindow() {

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
        "#dc2626";


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


/* ============================================================
 * DATABASE TREE
 * ============================================================ */

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


                    arrow.textContent =
                        isHidden
                            ? "▼"
                            : "▶";

                }
            );

        }
    );


/* ============================================================
 * TABLE CLICK
 * ============================================================ */

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


                    sqlEditor.value =
                        "SELECT *\nFROM " +
                        tableName +
                        ";";


                    sqlEditor.focus();


                    /*
                     * Close mobile sidebar.
                     */

                    databaseSidebar.classList.remove(
                        "mobile-open"
                    );

                }
            );

        }
    );


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

                        const name =
                            table
                                .dataset
                                .table
                                .toLowerCase();


                        table.style.display =
                            name.includes(search)
                                ? "flex"
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
 * SQLite engine will call this later.
 */

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

clearResults();


console.log(
    "✅ Sandbox UI loaded successfully."
);

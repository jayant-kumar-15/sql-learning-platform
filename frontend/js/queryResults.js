/*
 * ============================================================
 * QUERY RESULTS UI
 * ============================================================
 *
 * PATH:
 * frontend/js/queryResults.js
 *
 * PURPOSE:
 * Render the COMPLETE SQL result set while keeping the visible
 * result window compact and scrollable.
 *
 * IMPORTANT:
 * This file changes ONLY result presentation.
 * SQL execution, challenge validation, scoring, progress,
 * question navigation and schema functionality are untouched.
 * ============================================================
 */

(function installQueryResultsStyles() {

    /*
     * Install result-window styles once.
     *
     * These styles are injected from JavaScript intentionally so the
     * result-window behaviour cannot be cancelled by an older/mobile
     * CSS rule elsewhere in challenge.css.
     */
    if (document.getElementById("sql-result-window-styles")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "sql-result-window-styles";

    style.textContent = `
        /* ============================================================
         * RESULT VIEWPORT
         * ============================================================ */

        #query-results-container .query-results-table-wrapper {
            width: 100% !important;
            height: 230px !important;
            max-height: 230px !important;

            overflow-y: auto !important;
            overflow-x: auto !important;

            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;

            scrollbar-width: auto;
            scrollbar-color: #64748b #e2e8f0;
        }

        #query-results-container .query-results-table-wrapper::-webkit-scrollbar {
            width: 12px;
            height: 12px;
        }

        #query-results-container .query-results-table-wrapper::-webkit-scrollbar-track {
            background: #e2e8f0;
        }

        #query-results-container .query-results-table-wrapper::-webkit-scrollbar-thumb {
            background: #64748b;
            border-radius: 8px;
            border: 2px solid #e2e8f0;
        }

        #query-results-container .query-results-table-wrapper::-webkit-scrollbar-thumb:hover {
            background: #475569;
        }

        /* ============================================================
         * RESULT HEADER
         * ============================================================ */

        #query-results-container .query-results-header {
            position: relative !important;
            padding-right: 145px !important;
            box-sizing: border-box;
            min-height: 58px;
        }

        /* ============================================================
         * MINIMIZE / MAXIMIZE / CLOSE CONTROLS
         * ============================================================ */

        #query-results-container .query-results-actions {
            position: absolute !important;
            top: 10px;
            right: 10px;

            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: flex-end !important;

            gap: 6px !important;
            margin: 0 !important;
        }

        #query-results-container .query-results-control {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;

            width: 30px !important;
            height: 30px !important;

            padding: 0 !important;
            margin: 0 !important;

            border: 1px solid #94a3b8 !important;
            border-radius: 6px !important;

            background: #ffffff !important;
            color: #111827 !important;

            font-family: Arial, sans-serif !important;
            font-size: 18px !important;
            font-weight: 700 !important;
            line-height: 1 !important;

            cursor: pointer !important;
            user-select: none;
        }

        #query-results-container .query-results-control:hover {
            background: #e2e8f0 !important;
        }

        #query-results-container .query-results-close {
            font-size: 21px !important;
        }

        /* ============================================================
         * RESIZE HANDLE
         * ============================================================ */

        #query-results-container .query-results-resize-handle {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;

            width: 100% !important;
            height: 12px !important;

            margin: 0 !important;
            padding: 0 !important;

            background: #e2e8f0 !important;
            border-top: 1px solid #cbd5e1 !important;

            cursor: ns-resize !important;
            touch-action: none !important;
            user-select: none !important;

            box-sizing: border-box;
        }

        #query-results-container .query-results-resize-handle::after {
            content: "" !important;

            width: 55px !important;
            height: 4px !important;

            border-radius: 5px !important;
            background: #64748b !important;
        }

        #query-results-container.query-results-minimized
            .query-results-table-wrapper,
        #query-results-container.query-results-minimized
            .query-results-resize-handle {
            display: none !important;
        }

        #query-results-container.query-results-maximized
            .query-results-table-wrapper {
            height: 65vh !important;
            max-height: 65vh !important;
        }

        body.sql-result-resizing {
            cursor: ns-resize !important;
            user-select: none !important;
        }

        @media (max-width: 768px) {

            #query-results-container .query-results-table-wrapper {
                height: 230px !important;
                max-height: 230px !important;
            }

            #query-results-container .query-results-header {
                padding-right: 120px !important;
            }

            #query-results-container .query-results-actions {
                top: 8px;
                right: 8px;
                gap: 4px !important;
            }

            #query-results-container .query-results-control {
                width: 28px !important;
                height: 28px !important;
            }

            #query-results-container.query-results-maximized
                .query-results-table-wrapper {
                height: 65vh !important;
                max-height: 65vh !important;
            }
        }
    `;

    document.head.appendChild(style);

})();


/* ============================================================
 * CREATE / RESTORE RESULT WINDOW CONTROLS
 * ============================================================ */

function setupQueryResultWindow(container) {

    if (!container) {
        return;
    }

    const header =
        container.querySelector(".query-results-header");

    const tableWrapper =
        container.querySelector(".query-results-table-wrapper");

    if (!header || !tableWrapper) {
        console.error(
            "❌ Query result header/table wrapper is missing."
        );
        return;
    }

    /*
     * ------------------------------------------------------------
     * Create the controls only once.
     * ------------------------------------------------------------
     */

    let actions =
        header.querySelector(".query-results-actions");

    if (!actions) {

        actions =
            document.createElement("div");

        actions.className =
            "query-results-actions";

        actions.setAttribute(
            "role",
            "group"
        );

        actions.setAttribute(
            "aria-label",
            "Query result controls"
        );

        const minimize =
            document.createElement("button");

        minimize.type = "button";
        minimize.className = "query-results-control";
        minimize.textContent = "−";
        minimize.title = "Minimize results";
        minimize.setAttribute(
            "aria-label",
            "Minimize results"
        );

        const maximize =
            document.createElement("button");

        maximize.type = "button";
        maximize.className = "query-results-control";
        maximize.textContent = "⛶";
        maximize.title = "Maximize results";
        maximize.setAttribute(
            "aria-label",
            "Maximize results"
        );

        const close =
            document.createElement("button");

        close.type = "button";
        close.className =
            "query-results-control query-results-close";
        close.textContent = "×";
        close.title = "Close results";
        close.setAttribute(
            "aria-label",
            "Close results"
        );

        actions.append(
            minimize,
            maximize,
            close
        );

        header.appendChild(
            actions
        );

        /*
         * --------------------------------------------------------
         * MINIMIZE
         * --------------------------------------------------------
         */

        minimize.addEventListener(
            "click",
            function () {

                const minimized =
                    container.classList.toggle(
                        "query-results-minimized"
                    );

                minimize.textContent =
                    minimized ? "+" : "−";

                minimize.title =
                    minimized
                        ? "Restore results"
                        : "Minimize results";

                minimize.setAttribute(
                    "aria-label",
                    minimized
                        ? "Restore results"
                        : "Minimize results"
                );

            }
        );

        /*
         * --------------------------------------------------------
         * MAXIMIZE
         * --------------------------------------------------------
         */

        maximize.addEventListener(
            "click",
            function () {

                const maximized =
                    container.classList.toggle(
                        "query-results-maximized"
                    );

                maximize.title =
                    maximized
                        ? "Restore results size"
                        : "Maximize results";

                maximize.setAttribute(
                    "aria-label",
                    maximized
                        ? "Restore results size"
                        : "Maximize results"
                );

                /*
                 * Keep the normal viewport height when returning
                 * from maximized mode.
                 */
                if (!maximized) {

                    tableWrapper.style.height =
                        "230px";

                    tableWrapper.style.maxHeight =
                        "230px";

                }

            }
        );

        /*
         * --------------------------------------------------------
         * CLOSE
         * --------------------------------------------------------
         */

        close.addEventListener(
            "click",
            function () {

                container.style.display =
                    "none";

                container.setAttribute(
                    "aria-hidden",
                    "true"
                );

            }
        );

    }


    /*
     * ------------------------------------------------------------
     * Restore the normal state whenever a NEW query is executed.
     * ------------------------------------------------------------
     */

    container.classList.remove(
        "query-results-minimized"
    );

    container.classList.remove(
        "query-results-maximized"
    );

    container.removeAttribute(
        "aria-hidden"
    );

    container.style.display =
        "block";

    tableWrapper.style.height =
        "230px";

    tableWrapper.style.maxHeight =
        "230px";

    tableWrapper.style.overflowY =
        "auto";

    tableWrapper.style.overflowX =
        "auto";


    /*
     * ------------------------------------------------------------
     * Create the drag handle once.
     * ------------------------------------------------------------
     */

    let resizeHandle =
        container.querySelector(
            ".query-results-resize-handle"
        );

    if (!resizeHandle) {

        resizeHandle =
            document.createElement("div");

        resizeHandle.className =
            "query-results-resize-handle";

        resizeHandle.title =
            "Drag up or down to resize results";

        resizeHandle.setAttribute(
            "role",
            "separator"
        );

        resizeHandle.setAttribute(
            "aria-orientation",
            "horizontal"
        );

        resizeHandle.setAttribute(
            "aria-label",
            "Drag up or down to resize query results"
        );

        /*
         * Place the handle BELOW the scrollable result window.
         */
        tableWrapper.insertAdjacentElement(
            "afterend",
            resizeHandle
        );

    }


    /*
     * ------------------------------------------------------------
     * Install resize listener once.
     * ------------------------------------------------------------
     */

    if (
        resizeHandle.dataset.ready === "true"
    ) {
        return;
    }

    resizeHandle.dataset.ready =
        "true";

    let startY = 0;
    let startHeight = 230;
    let resizing = false;

    resizeHandle.addEventListener(
        "pointerdown",
        function (event) {

            event.preventDefault();

            resizing = true;

            startY =
                event.clientY;

            startHeight =
                tableWrapper.getBoundingClientRect().height;

            if (
                resizeHandle.setPointerCapture
            ) {
                resizeHandle.setPointerCapture(
                    event.pointerId
                );
            }

            document.body.classList.add(
                "sql-result-resizing"
            );

        }
    );

    resizeHandle.addEventListener(
        "pointermove",
        function (event) {

            if (!resizing) {
                return;
            }

            const delta =
                event.clientY -
                startY;

            const newHeight =
                Math.min(
                    Math.max(
                        startHeight +
                        delta,
                        130
                    ),
                    Math.max(
                        window.innerHeight * 0.75,
                        260
                    )
                );

            tableWrapper.style.height =
                newHeight + "px";

            tableWrapper.style.maxHeight =
                newHeight + "px";

        }
    );

    function stopResize() {

        if (!resizing) {
            return;
        }

        resizing = false;

        document.body.classList.remove(
            "sql-result-resizing"
        );

    }

    resizeHandle.addEventListener(
        "pointerup",
        stopResize
    );

    resizeHandle.addEventListener(
        "pointercancel",
        stopResize
    );

}


/* ============================================================
 * MAIN RESULT RENDERER
 * ============================================================ */

function displayQueryResults(data) {

    /*
     * ============================================================
     * GET RESULT ELEMENTS
     * ============================================================
     */

    const container =
        document.getElementById(
            "query-results-container"
        );

    const head =
        document.getElementById(
            "query-results-head"
        );

    const body =
        document.getElementById(
            "query-results-body"
        );

    const summary =
        document.getElementById(
            "query-result-summary"
        );

    const status =
        document.getElementById(
            "query-result-status"
        );


    /*
     * ============================================================
     * SAFETY CHECK
     * ============================================================
     */

    if (
        !container ||
        !head ||
        !body ||
        !summary
    ) {

        console.error(
            "❌ Query result UI elements are missing."
        );

        return;

    }


    /*
     * ============================================================
     * CLEAR PREVIOUS RESULTS
     * ============================================================
     */

    head.replaceChildren();

    body.replaceChildren();


    /*
     * ============================================================
     * VALIDATE RESULT DATA
     * ============================================================
     */

    if (
        !data ||
        !Array.isArray(data.rows) ||
        !Array.isArray(data.columns)
    ) {

        console.error(
            "❌ Invalid query result data:",
            data
        );

        summary.textContent =
            "Unable to display query results.";

        return;

    }


    /*
     * ============================================================
     * RESET / PREPARE RESULT WINDOW
     * ============================================================
     *
     * IMPORTANT:
     * This does NOT modify data.rows.
     *
     * ALL rows are rendered below. The wrapper provides the
     * compact visible viewport and scrollbar.
     */

    setupQueryResultWindow(
        container
    );


    /*
     * ============================================================
     * CLEAR QUERY STATUS
     * ============================================================
     */

    if (status) {

        status.textContent =
            "";

        status.className =
            "query-result-status";

    }


    /*
     * ============================================================
     * SUMMARY
     * ============================================================
     */

    const rowCount =
        Number(data.rowCount) ||
        data.rows.length;

    const executionTime =
        Number(data.executionTime) ||
        0;

    summary.textContent =
        rowCount +
        " row" +
        (rowCount === 1 ? "" : "s") +
        " • " +
        executionTime +
        " ms";

    if (
        data.resultsTruncated
    ) {

        summary.textContent +=
            " • Showing first 1,000 rows";

    }

    else if (
        data.rows.length > 5
    ) {

        summary.textContent +=
            " • Scroll to view all rows";

    }


    /*
     * ============================================================
     * NO ROWS
     * ============================================================
     */

    if (
        data.rows.length === 0
    ) {

        const row =
            document.createElement(
                "tr"
            );

        const cell =
            document.createElement(
                "td"
            );

        cell.colSpan =
            data.columns.length ||
            1;

        cell.textContent =
            "No rows returned.";

        row.appendChild(
            cell
        );

        body.appendChild(
            row
        );

        return;

    }


    /*
     * ============================================================
     * CREATE COLUMN HEADERS
     * ============================================================
     */

    const headerRow =
        document.createElement(
            "tr"
        );

    data.columns.forEach(
        function (column) {

            const th =
                document.createElement(
                    "th"
                );

            th.textContent =
                column;

            headerRow.appendChild(
                th
            );

        }
    );

    head.appendChild(
        headerRow
    );


    /*
     * ============================================================
     * CREATE ALL RESULT ROWS
     * ============================================================
     *
     * DO NOT use slice(0, 5).
     * DO NOT truncate the visible data here.
     *
     * The browser displays only the viewport height, while the
     * scrollbar gives access to the complete result set.
     */

    data.rows.forEach(
        function (resultRow) {

            const row =
                document.createElement(
                    "tr"
                );

            data.columns.forEach(
                function (column) {

                    const cell =
                        document.createElement(
                            "td"
                        );

                    const value =
                        resultRow[column];

                    if (
                        value === null ||
                        value === undefined
                    ) {

                        cell.textContent =
                            "NULL";

                    }

                    else {

                        cell.textContent =
                            String(value);

                    }

                    row.appendChild(
                        cell
                    );

                }
            );

            body.appendChild(
                row
            );

        }
    );


    /*
     * ============================================================
     * DEBUG
     * ============================================================
     */

    console.log(
        "🟢 Query results UI refreshed."
    );

    console.log(
        "Rows rendered:",
        data.rows.length
    );

    console.log(
        "Total rows reported:",
        rowCount
    );

    console.log(
        "Scrollable result window:",
        true
    );

}

/*
 * ============================================================
 * QUERY RESULTS RENDERER
 * ============================================================
 *
 * PATH
 * ----
 * frontend/js/queryResults.js
 *
 * PURPOSE
 * -------
 * This file controls how SQL query results are displayed on
 * the Challenge page.
 *
 * CURRENT RESPONSIBILITIES
 * ------------------------
 * 1. Find the result-table elements from challenge.html.
 * 2. Clear results from the previous execution.
 * 3. Show the result container after a query executes.
 * 4. Display row count and execution time.
 * 5. Display the "first 1,000 rows" warning when applicable.
 * 6. Display an empty-result message when no rows are returned.
 * 7. Build table column headers dynamically.
 * 8. Build table rows dynamically.
 * 9. Display SQL NULL values safely as "NULL".
 * 10. Avoid inserting raw HTML from database values.
 *
 * IMPORTANT ARCHITECTURE
 * ----------------------
 * API communication is NOT handled here.
 *
 * Query execution/API communication is handled by:
 *
 *     frontend/js/queryApi.js
 *
 * This file only receives the result object and renders it.
 *
 * EXPECTED DATA FORMAT
 * --------------------
 * {
 *     columns: ["id", "name"],
 *     rows: [
 *         {
 *             id: 1,
 *             name: "John"
 *         }
 *     ],
 *     rowCount: 1,
 *     executionTime: 12,
 *     resultsTruncated: false
 * }
 *
 * ============================================================
 */


/* ============================================================
 * DISPLAY QUERY RESULTS
 * ============================================================ */

/*
 * Render the result returned by the SQL engine/API.
 *
 * The function intentionally rebuilds the result table on every
 * execution. This prevents stale rows from a previous challenge
 * question from remaining visible when the user runs another
 * query.
 */
function displayQueryResults(data) {


    /*
     * ============================================================
     * GET RESULT ELEMENTS
     * ============================================================
     *
     * These IDs are defined in:
     *
     *     frontend/pages/challenge.html
     *
     * If the Challenge UI changes its IDs, update this section.
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
     *
     * If the result elements are temporarily unavailable
     * while the Challenge UI is changing, do not crash the
     * complete application.
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


        console.error(
            "container:",
            container
        );


        console.error(
            "head:",
            head
        );


        console.error(
            "body:",
            body
        );


        console.error(
            "summary:",
            summary
        );


        return;

    }


    /*
     * ============================================================
     * CLEAR PREVIOUS RESULTS
     * ============================================================
     *
     * IMPORTANT:
     * Every execution starts with a completely clean result area.
     *
     * This prevents Q1's result from remaining visible when:
     *
     *     Q2 -> Q3 -> Q4
     *
     * or when the user changes the SQL query without refreshing.
     */

    head.replaceChildren();


    body.replaceChildren();


    /*
     * Show result container.
     *
     * challenge.html initially keeps this hidden so the result
     * area does not consume space before the user executes a
     * query.
     */

    container.style.display =
        "block";


    /*
     * ============================================================
     * CLEAR PREVIOUS STATUS
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
     * VALIDATE DATA OBJECT
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
     * SUMMARY
     * ============================================================
     *
     * Show:
     *
     *     5 rows • 12 ms
     *
     * instead of exposing unnecessary technical information.
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
        (
            rowCount === 1
                ? ""
                : "s"
        ) +
        " • " +
        executionTime +
        " ms";


    /*
     * ============================================================
     * RESULTS TRUNCATION MESSAGE
     * ============================================================
     *
     * The backend may limit the number of rows returned to the
     * browser for performance and safety.
     */

    if (
        data.resultsTruncated
    ) {

        summary.textContent +=
            " • Showing first 1,000 rows";

    }


    /*
     * ============================================================
     * NO ROWS
     * ============================================================
     *
     * A successful query can return zero rows.
     *
     * Example:
     *
     *     SELECT *
     *     FROM users
     *     WHERE id = 999999;
     *
     * In that case, show a friendly message instead of leaving
     * an empty table.
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


            /*
             * textContent is deliberately used instead of
             * innerHTML so column names cannot inject HTML.
             */
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
     * CREATE RESULT ROWS
     * ============================================================
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


                    /*
                     * ====================================================
                     * NULL VALUES
                     * ====================================================
                     *
                     * SQL NULL is different from an empty string.
                     *
                     * We display NULL explicitly so learners can
                     * understand the actual database value.
                     */

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
     * DEBUG INFORMATION
     * ============================================================
     *
     * These logs are useful during development and can be removed
     * later when the Challenge page is considered production-ready.
     */

    console.log(
        "🟢 Query results UI refreshed."
    );


    console.log(
        "Rows displayed:",
        data.rows.length
    );


    console.log(
        "Columns displayed:",
        data.columns
    );

}

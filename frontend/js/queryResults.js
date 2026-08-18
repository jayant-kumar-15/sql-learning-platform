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
     *
     * If the result elements are temporarily unavailable
     * while the challenge UI is changing, do not crash.
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
     * Q2 -> Q3 -> Q4
     *
     * or when the user changes the SQL query without refreshing.
     */

    head.replaceChildren();

    body.replaceChildren();


    /*
     * Show result container.
     */

    container.style.display =
        "block";


    /*
     * Clear previous status.
     */

    if (status) {

        status.textContent = "";

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
     * SUMMARY + COMPACT VISIBLE PREVIEW
     * ============================================================
     *
     * IMPORTANT:
     * The complete result set remains untouched for Challenge
     * validation. Only the rows rendered in the visible table are
     * limited to the first five rows.
     */

    const totalRowCount =
        Number(data.rowCount) ||
        data.rows.length;

    const visibleRows =
        data.rows.slice(0, 5);

    const executionTime =
        Number(data.executionTime) ||
        0;


    if (totalRowCount > visibleRows.length) {

        summary.textContent =
            totalRowCount +
            " rows • " +
            executionTime +
            " ms • Showing first " +
            visibleRows.length +
            " rows";

    } else {

        summary.textContent =
            totalRowCount +
            " row" +
            (totalRowCount === 1 ? "" : "s") +
            " • " +
            executionTime +
            " ms";
    }


    /*
     * Preserve the SQL engine's own truncation information.
     * This is separate from our five-row visual preview.
     */
    if (
        data.resultsTruncated
    ) {

        summary.textContent +=
            " • Engine result capped";
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
     * CREATE RESULT ROWS
     * ============================================================
     */

    visibleRows.forEach(
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
                     * NULL values
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
     * DEBUG
     * ============================================================
     */

    console.log(
        "🟢 Query results UI refreshed."
    );

    console.log(
        "Rows displayed in Challenge UI:",
        visibleRows.length
    );

    console.log(
        "Total rows returned:",
        totalRowCount
    );

    console.log(
        "Columns displayed:",
        data.columns
    );

}

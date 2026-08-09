function displayQueryResults(data) {

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

    head.innerHTML = "";
    body.innerHTML = "";

    container.style.display = "block";

    status.textContent = "";

    summary.textContent =
        data.rowCount +
        " row" +
        (data.rowCount === 1 ? "" : "s") +
        " • " +
        data.executionTime +
        " ms";

    if (data.resultsTruncated) {

        summary.textContent +=
            " • Showing first 1,000 rows";

    }

    /*
     * No rows returned
     */

    if (data.rows.length === 0) {

        const row =
            document.createElement("tr");

        const cell =
            document.createElement("td");

        cell.colSpan =
            data.columns.length || 1;

        cell.textContent =
            "No rows returned.";

        row.appendChild(cell);

        body.appendChild(row);

        return;

    }

    /*
     * Create column headers
     */

    const headerRow =
        document.createElement("tr");

    data.columns.forEach(function (column) {

        const th =
            document.createElement("th");

        th.textContent = column;

        headerRow.appendChild(th);

    });

    head.appendChild(headerRow);

    /*
     * Create result rows
     */

    data.rows.forEach(function (resultRow) {

        const row =
            document.createElement("tr");

        data.columns.forEach(
            function (column) {

                const cell =
                    document.createElement("td");

                const value =
                    resultRow[column];

                if (
                    value === null ||
                    value === undefined
                ) {

                    cell.textContent = "NULL";

                } else {

                    cell.textContent =
                        String(value);

                }

                row.appendChild(cell);

            }
        );

        body.appendChild(row);

    });

}

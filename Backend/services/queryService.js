const db = require("../config/db");

function executeQuery(query) {

    return new Promise(function (resolve, reject) {

        const trimmedQuery = query.trim();

        if (
            !trimmedQuery
                .toLowerCase()
                .startsWith("select")
        ) {

            return reject(
                new Error(
                    "Only SELECT queries are supported in the shared database."
                )
            );

        }

        db.all(
            trimmedQuery,
            function (error, rows) {

                if (error) {

                    return reject(error);

                }

                const resultRows = rows || [];

                let columns = [];

                if (resultRows.length > 0) {

                    columns = Object.keys(
                        resultRows[0]
                    );

                }

                resolve({

                    columns: columns,

                    rows: resultRows,

                    rowCount: resultRows.length

                });

            }
        );

    });

}

module.exports = {
    executeQuery
};

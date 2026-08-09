const db = require("../config/db");

const queryValidator =
    require("./queryValidator");

function executeQuery(query) {

    return new Promise(function (resolve, reject) {

        const validation =
            queryValidator.validateQuery(query);

        if (!validation.valid) {

            return reject(
                new Error(validation.message)
            );

        }

        const trimmedQuery =
            query.trim();

        const startTime = Date.now();

        db.all(
            trimmedQuery,
            function (error, rows) {

                const executionTime =
                    Date.now() - startTime;

                if (error) {

                    const queryError =
                        new Error(error.message);

                    queryError.executionTime =
                        executionTime;

                    return reject(queryError);

                }

                const resultRows =
    rows || [];

const MAX_RESULT_ROWS = 1000;

const limitedRows =
    resultRows.slice(
        0,
        MAX_RESULT_ROWS
    );

const resultsTruncated =
    resultRows.length > MAX_RESULT_ROWS;

                let columns = [];

                if (resultRows.length > 0) {

                    columns =
                        Object.keys(
                            resultRows[0]
                        );

                }

                resolve({

                    status: "success",

                    columns: columns,

rows: limitedRows,

rowCount:
    limitedRows.length,

resultsTruncated:
    resultsTruncated,

executionTime:
    executionTime

                });

            }

        );

    });

}

module.exports = {
    executeQuery
};

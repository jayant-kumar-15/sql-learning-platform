function compareQueryResults(
    actualRows,
    expectedRows
) {

    /*
     * Both must be arrays.
     */
    if (
        !Array.isArray(actualRows) ||
        !Array.isArray(expectedRows)
    ) {

        return false;

    }

    /*
     * Different number of rows
     * means the answer is incorrect.
     */
    if (
        actualRows.length !==
        expectedRows.length
    ) {

        return false;

    }

    /*
     * Compare each row.
     */
    for (
        let i = 0;
        i < expectedRows.length;
        i++
    ) {

        const actualRow =
            actualRows[i];

        const expectedRow =
            expectedRows[i];

        /*
         * Compare column count.
         */
        const actualColumns =
            Object.keys(
                actualRow
            );

        const expectedColumns =
            Object.keys(
                expectedRow
            );

        if (
            actualColumns.length !==
            expectedColumns.length
        ) {

            return false;

        }

        /*
         * Compare every expected column.
         */
        for (
            let j = 0;
            j < expectedColumns.length;
            j++
        ) {

            const column =
                expectedColumns[j];

            /*
             * Column must exist.
             */
            if (
                !Object.prototype.hasOwnProperty.call(
                    actualRow,
                    column
                )
            ) {

                return false;

            }

            const actualValue =
                actualRow[column];

            const expectedValue =
                expectedRow[column];

            /*
             * Normalize values before comparison.
             */
            const actualNormalized =
                normalizeValue(
                    actualValue
                );

            const expectedNormalized =
                normalizeValue(
                    expectedValue
                );

            if (
                actualNormalized !==
                expectedNormalized
            ) {

                return false;

            }

        }

    }

    return true;

}


/*
 * Normalize SQL values before
 * comparing expected output.
 */
function normalizeValue(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return null;

    }

    /*
     * Numbers
     */
    if (
        typeof value ===
        "number"
    ) {

        return value;

    }

    /*
     * Strings
     */
    return String(value).trim();

}

const browserSqlEngine = {

    db: null,

    initialized: false,

    currentDatabase: null,


    /* ============================================================
     * INITIALIZE BROWSER SQLITE
     * ============================================================
     */

    async initialize(databaseName = "Banking") {

        /*
         * Already initialized for this database.
         */
        if (
            this.initialized &&
            this.db &&
            this.currentDatabase === databaseName
        ) {

            return this.db;

        }


        try {

            console.log(
                "⏳ Initializing browser SQLite database:",
                databaseName
            );


            /*
             * Load SQLite WASM.
             */
            const sqlite3 =
                await initializeSQLite();


            /*
             * Create an in-memory SQLite database.
             *
             * This database exists only
             * inside the user's browser.
             */
            this.db =
                new sqlite3.oo1.DB(
                    ":memory:"
                );


            /*
             * Determine the correct schema
             * and seed files.
             */
            let schemaFile;
            let seedFile;


            if (
                databaseName.toLowerCase() ===
                "banking"
            ) {

                schemaFile =
                    "../assets/banking-schema.sql";

                seedFile =
                    "../assets/banking-seed.sql";

            }


            else if (
                databaseName.toLowerCase() ===
                "healthcare"
            ) {

                schemaFile =
                    "../assets/healthcare-schema.sql";

                seedFile =
                    "../assets/healthcare-seed.sql";

            }


            else {

                throw new Error(
                    "Unsupported database: " +
                    databaseName
                );

            }


            /*
             * Temporarily disable foreign-key
             * enforcement while loading seed data.
             */
            this.db.exec(
                "PRAGMA foreign_keys = OFF;"
            );


            /* ====================================================
             * LOAD SCHEMA
             * ====================================================
             */

            console.log(
                "📐 Loading schema:",
                schemaFile
            );


            const schemaResponse =
                await fetch(
                    schemaFile
                );


            if (!schemaResponse.ok) {

                throw new Error(
                    "Unable to load schema file: " +
                    schemaFile
                );

            }


            const schemaSql =
                await schemaResponse.text();


            this.db.exec(
                schemaSql
            );


            console.log(
                "✅ Schema loaded successfully."
            );


            /* ====================================================
             * LOAD SEED DATA
             * ====================================================
             */

            console.log(
                "🌱 Loading seed data:",
                seedFile
            );


            const seedResponse =
                await fetch(
                    seedFile
                );


            if (!seedResponse.ok) {

                throw new Error(
                    "Unable to load seed file: " +
                    seedFile
                );

            }


            const seedSql =
                await seedResponse.text();


            this.db.exec(
                seedSql
            );


            console.log(
                "✅ Seed data loaded successfully."
            );


            /*
             * Re-enable foreign-key enforcement.
             */
            this.db.exec(
                "PRAGMA foreign_keys = ON;"
            );


            /*
             * Remember which database
             * is currently loaded.
             */
            this.currentDatabase =
                databaseName;


            this.initialized =
                true;


            console.log(
                "✅ Browser SQLite database initialized:",
                databaseName
            );


            return this.db;


        }


        catch (error) {

            console.error(
                "❌ Browser SQLite initialization failed:",
                error
            );


            /*
             * Clean up failed database.
             */
            this.db =
                null;


            this.initialized =
                false;


            this.currentDatabase =
                null;


            throw error;

        }

    },


    /* ============================================================
     * EXECUTE SQL QUERY
     * ============================================================
     */

    async execute(
        query,
        options = {}
    ) {

        /*
         * Validate query.
         */
        if (
            !query ||
            typeof query !== "string"
        ) {

            throw new Error(
                "SQL query is required."
            );

        }


        /*
         * Determine which database
         * should be used.
         *
         * Default = Banking.
         */
        const databaseName =
            options.database ||
            "Banking";


        /*
         * Initialize the correct
         * browser database.
         */
        const db =
            await this.initialize(
                databaseName
            );


        const startTime =
            performance.now();


        try {

            /*
             * Execute SQL.
             *
             * rowMode: object means each
             * result row becomes a JS object.
             */
            const result =
                db.exec({

                    sql: query,

                    rowMode: "object",

                    returnValue: "resultRows"

                });


            const executionTime =
                Math.round(
                    performance.now() -
                    startTime
                );


            const rows =
                result || [];


            /* ====================================================
             * DETERMINE COLUMNS
             * ====================================================
             */

            let columns = [];


            /*
             * If rows exist, obtain
             * column names from first row.
             */
            if (
                rows.length > 0
            ) {

                columns =
                    Object.keys(
                        rows[0]
                    );

            }


            /*
             * If query returned zero rows,
             * still try to obtain column names.
             */
            else {

                const statement =
                    db.prepare(
                        query
                    );


                try {

                    columns =
                        statement
                            .getColumnNames();

                }


                finally {

                    statement.finalize();

                }

            }


            console.log(
                "🟢 Browser SQL executed successfully."
            );


            console.log(
                "Database:",
                databaseName
            );


            console.log(
                "Rows:",
                rows.length
            );


            console.log(
                "Execution time:",
                executionTime,
                "ms"
            );


            /*
             * Return the same basic structure
             * expected by queryResults.js.
             */
            const expectedOutput =
    options.expectedOutput || null;

let isCorrect = null;

if (expectedOutput !== null) {

    isCorrect =
        compareQueryResults(
            rows,
            expectedOutput
        );

}

return {

    success: true,

    columns: columns,

    rows: rows,

    rowCount: rows.length,

    executionTime:
        executionTime,

    resultsTruncated: false,

    isCorrect:
        isCorrect

};
        }


        catch (error) {

            console.error(
                "❌ Browser SQL execution failed:",
                error
            );


            throw new Error(
                error.message ||
                "SQL query execution failed."
            );

        }

    }

};


/* ================================================================
 * GLOBAL AVAILABILITY
 * ================================================================
 */

window.browserSqlEngine =
    browserSqlEngine;

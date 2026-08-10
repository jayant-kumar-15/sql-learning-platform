/*
 * ============================================================
 * QUERY RESULT COMPARISON
 * ============================================================
 */

function compareQueryResults(actualRows, expectedRows) {

    if (
        !Array.isArray(actualRows) ||
        !Array.isArray(expectedRows)
    ) {
        return false;
    }

    /*
     * Different number of rows = incorrect
     */
    if (actualRows.length !== expectedRows.length) {
        return false;
    }

    /*
     * Convert each row into a normalized
     * representation.
     *
     * This makes comparison independent
     * of row order.
     */
    function normalizeRow(row) {

        const values = Object.values(row);

        return values.map(function (value) {

            if (
                value === null ||
                value === undefined
            ) {
                return null;
            }

            if (typeof value === "number") {
                return Number(value);
            }

            return String(value)
                .trim()
                .toLowerCase();

        });

    }

    const actualNormalized =
        actualRows.map(normalizeRow);

    const expectedNormalized =
        expectedRows.map(normalizeRow);

    /*
     * Sort rows so that:
     *
     * A,B,C
     *
     * and
     *
     * C,A,B
     *
     * are treated as the same result.
     */
    actualNormalized.sort(function (a, b) {

        return JSON.stringify(a)
            .localeCompare(
                JSON.stringify(b)
            );

    });

    expectedNormalized.sort(function (a, b) {

        return JSON.stringify(a)
            .localeCompare(
                JSON.stringify(b)
            );

    });

    /*
     * Compare normalized results.
     */
    return JSON.stringify(actualNormalized) ===
           JSON.stringify(expectedNormalized);

}

/*
 * ============================================================
 * VALUE NORMALIZATION
 * ============================================================
 */

function normalizeValue(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return null;

    }

    if (
        typeof value === "number"
    ) {

        return value;

    }

    return String(value).trim();

}


/*
 * ============================================================
 * BROWSER SQLITE ENGINE
 * ============================================================
 */

const browserSqlEngine = {

    db: null,

    initialized: false,

    currentDatabase: null,

    /*
     * IMPORTANT:
     *
     * Prevents multiple initialize()
     * calls from creating multiple SQLite
     * databases at the same time.
     */
    initializationPromise: null,


    /* ========================================================
     * INITIALIZE DATABASE
     * ========================================================
     */

    async initialize(
        databaseName = "Banking"
    ) {

        /*
         * Already initialized.
         */
        if (
            this.initialized &&
            this.db &&
            this.currentDatabase === databaseName
        ) {

            return this.db;

        }


        /*
         * If another initialization is
         * already running, wait for it.
         */
        if (
            this.initializationPromise
        ) {

            await this.initializationPromise;

            /*
             * After waiting, check again.
             */
            if (
                this.initialized &&
                this.db &&
                this.currentDatabase === databaseName
            ) {

                return this.db;

            }

        }


        /*
         * Create one initialization lock.
         */
        this.initializationPromise =
            this._initializeDatabase(
                databaseName
            );


        try {

            return await this.initializationPromise;

        }

        finally {

            this.initializationPromise =
                null;

        }

    },


    /* ========================================================
     * ACTUAL DATABASE INITIALIZATION
     * ========================================================
     */

    async _initializeDatabase(
        databaseName
    ) {

        try {

            console.log(
                "⏳ Initializing browser SQLite database:",
                databaseName
            );


            /*
             * If another database is already loaded,
             * close it before creating a new one.
             */
            if (this.db) {

                try {

                    this.db.close();

                } catch (closeError) {

                    console.warn(
                        "Previous SQLite database could not be closed:",
                        closeError
                    );

                }

            }


            this.db = null;

            this.initialized = false;

            this.currentDatabase = null;


            /*
             * Load SQLite WASM.
             */
            const sqlite3 =
                await initializeSQLite();


            console.log(
                "SQLite WASM ready."
            );


            /*
             * Create in-memory database.
             */
            this.db =
                new sqlite3.oo1.DB(
                    ":memory:"
                );


            if (!this.db) {

                throw new Error(
                    "Unable to create browser SQLite database."
                );

            }


            /*
             * Determine database files.
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
             * Disable foreign keys while
             * loading seed data.
             */
            this.db.exec(
                "PRAGMA foreign_keys = OFF;"
            );


            /* =================================================
             * LOAD SCHEMA
             * =================================================
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


            if (
                !schemaSql.trim()
            ) {

                throw new Error(
                    "Schema file is empty: " +
                    schemaFile
                );

            }


            this.db.exec(
                schemaSql
            );


            console.log(
                "✅ Schema loaded successfully."
            );


            /* =================================================
             * LOAD SEED
             * =================================================
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


            if (
                !seedSql.trim()
            ) {

                throw new Error(
                    "Seed file is empty: " +
                    seedFile
                );

            }


            this.db.exec(
                seedSql
            );


            console.log(
                "✅ Seed data loaded successfully."
            );


            /*
             * Re-enable foreign keys.
             */
            this.db.exec(
                "PRAGMA foreign_keys = ON;"
            );


            /*
             * Mark database as ready ONLY
             * after everything succeeds.
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
                "❌ SQLite initialization failed:",
                error
            );


            /*
             * Close failed database.
             */
            if (this.db) {

                try {

                    this.db.close();

                } catch (closeError) {

                    console.warn(
                        "Failed to close SQLite database:",
                        closeError
                    );

                }

            }


            this.db = null;

            this.initialized = false;

            this.currentDatabase = null;


            throw error;

        }

    },


    /* ========================================================
     * EXECUTE SQL
     * ========================================================
     */

    async execute(
        query,
        options = {}
    ) {

        if (
            !query ||
            typeof query !== "string"
        ) {

            throw new Error(
                "SQL query is required."
            );

        }


        const databaseName =
            options.database ||
            "Banking";


        /*
         * Initialize database if required.
         */
        const db =
            await this.initialize(
                databaseName
            );


        if (!db) {

            throw new Error(
                "Browser SQLite database is not available."
            );

        }


        const startTime =
            performance.now();


        try {

            /*
             * Execute query.
             */
            const result =
                db.exec({

                    sql: query,

                    rowMode: "object",

                    returnValue: "resultRows"

                });


            const rows =
                result || [];


            const executionTime =
                Math.round(
                    performance.now() -
                    startTime
                );


            /*
             * Determine columns.
             */
            let columns = [];


            if (
                rows.length > 0
            ) {

                columns =
                    Object.keys(
                        rows[0]
                    );

            }

            else {

                const statement =
                    db.prepare(
                        query
                    );

                try {

                    columns =
                        statement.getColumnNames();

                }

                finally {

                    statement.finalize();

                }

            }


            /*
             * Compare with expected output
             * when supplied.
             */
            let isCorrect = null;


            if (
                Array.isArray(
                    options.expectedOutput
                )
            ) {

                isCorrect =
                    compareQueryResults(
                        rows,
                        options.expectedOutput
                    );

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

            console.log(
                "Correct:",
                isCorrect
            );


            return {

                success: true,

                columns: columns,

                rows: rows,

                rowCount:
                    rows.length,

                executionTime:
                    executionTime,

                resultsTruncated:
                    false,

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


/* ============================================================
 * PRELOAD CHALLENGE DATABASE
 * ============================================================
 */

async function preloadChallengeDatabase(
    databaseName = "Banking"
) {

    try {

        console.log(
            "🚀 Preloading challenge database:",
            databaseName
        );


        await browserSqlEngine.initialize(
            databaseName
        );


        console.log(
            "✅ Challenge database ready:",
            databaseName
        );


        return true;

    }

    catch (error) {

        console.error(
            "❌ Challenge database preload failed:",
            error
        );


        return false;

    }

}


/* ============================================================
 * GLOBAL AVAILABILITY
 * ============================================================
 */

window.browserSqlEngine =
    browserSqlEngine;

window.preloadChallengeDatabase =
    preloadChallengeDatabase;

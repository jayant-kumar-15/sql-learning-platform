/*
 * ============================================================
 * ROBUST QUERY RESULT VALIDATION
 * ============================================================
 *
 * The SQL approach does NOT matter.
 *
 * We validate the logical result produced by
 * the user's SQL query.
 *
 * Supported:
 *
 * - JOIN
 * - SUBQUERY
 * - EXISTS
 * - IN
 * - CTE
 * - Different row order
 * - Different column order
 * - Different column aliases
 * - String case differences
 * - Leading/trailing spaces
 * - Numeric representation differences
 * - NULL values
 * - Duplicate rows
 *
 * Example:
 *
 * User:
 *
 * SELECT c.customer_name, a.balance
 * FROM customers c
 * JOIN accounts a
 *   ON c.customer_id = a.customer_id
 * WHERE a.balance > 50000;
 *
 * and another valid solution:
 *
 * SELECT customer_name, balance
 * FROM customers
 * WHERE customer_id IN (
 *     SELECT customer_id
 *     FROM accounts
 *     WHERE balance > 50000
 * );
 *
 * can both be accepted when they produce
 * the same logical result.
 * ============================================================
 */

function compareQueryResults(
    actualRows,
    expectedRows
) {

    /*
     * ========================================================
     * BASIC VALIDATION
     * ========================================================
     */

    if (
        !Array.isArray(actualRows) ||
        !Array.isArray(expectedRows)
    ) {

        return false;

    }


    /*
     * Empty result sets.
     *
     * If both are empty, the query produced
     * the expected result.
     */

    if (
        actualRows.length === 0 &&
        expectedRows.length === 0
    ) {

        console.log(
            "✅ Both actual and expected results are empty."
        );

        return true;

    }


    /*
     * Different number of rows means the
     * logical result is different.
     *
     * This also preserves duplicate rows.
     */

    if (
        actualRows.length !==
        expectedRows.length
    ) {

        console.log(
            "❌ Row count mismatch:",
            actualRows.length,
            "vs",
            expectedRows.length
        );

        return false;

    }


    /*
     * ========================================================
     * VALUE NORMALIZATION
     * ========================================================
     */

    function normalizeValue(value) {

        /*
         * NULL values.
         */

        if (
            value === null ||
            value === undefined
        ) {

            return {
                type: "null",
                value: null
            };

        }


        /*
         * Boolean values.
         */

        if (
            typeof value === "boolean"
        ) {

            return {
                type: "boolean",
                value: value
            };

        }


        /*
         * Numbers.
         *
         * Convert everything to Number so:
         *
         * 50000
         * 50000.0
         * "50000"
         *
         * can be treated as the same value.
         */

        if (
            typeof value === "number"
        ) {

            if (
                Number.isNaN(value)
            ) {

                return {
                    type: "nan",
                    value: "nan"
                };

            }

            return {
                type: "number",
                value: Number(value)
            };

        }


        /*
         * Strings.
         */

        const stringValue =
            String(value)
                .trim();


        /*
         * Empty strings.
         */

        if (
            stringValue === ""
        ) {

            return {
                type: "string",
                value: ""
            };

        }


        /*
         * If a string represents a number,
         * treat it as a number.
         *
         * Examples:
         *
         * "50000"
         * "50000.0"
         * "5e4"
         */

        const numericValue =
            Number(stringValue);


        if (
            !Number.isNaN(numericValue) &&
            stringValue !== ""
        ) {

            return {
                type: "number",
                value: numericValue
            };

        }


        /*
         * Normal text.
         *
         * Ignore capitalization and
         * surrounding whitespace.
         */

        return {
            type: "string",
            value:
                stringValue
                    .toLowerCase()
        };

    }


    /*
     * ========================================================
     * VALUES ARE EQUAL
     * ========================================================
     */

    function valuesEqual(
        actualValue,
        expectedValue
    ) {

        const actual =
            normalizeValue(
                actualValue
            );

        const expected =
            normalizeValue(
                expectedValue
            );


        /*
         * NULL.
         */

        if (
            actual.type === "null" &&
            expected.type === "null"
        ) {

            return true;

        }


        /*
         * Different NULL/non-NULL values.
         */

        if (
            actual.type === "null" ||
            expected.type === "null"
        ) {

            return false;

        }


        /*
         * Numeric comparison.
         *
         * Small floating-point differences
         * are tolerated.
         */

        if (
            actual.type === "number" &&
            expected.type === "number"
        ) {

            return (
                Math.abs(
                    actual.value -
                    expected.value
                ) < 0.000001
            );

        }


        /*
         * Boolean comparison.
         */

        if (
            actual.type === "boolean" &&
            expected.type === "boolean"
        ) {

            return (
                actual.value ===
                expected.value
            );

        }


        /*
         * String comparison.
         */

        return (
            String(actual.value) ===
            String(expected.value)
        );

    }


    /*
     * ========================================================
     * ROW HELPERS
     * ========================================================
     */

    function getColumns(row) {

        return Object.keys(row);

    }


    /*
     * ========================================================
     * EXACT COLUMN-NAME MATCH
     * ========================================================
     *
     * First attempt:
     *
     * customer_name -> customer_name
     * balance       -> balance
     *
     * This is the safest comparison.
     */

    function compareRowsByColumnName(
        actualRow,
        expectedRow
    ) {

        const actualColumns =
            getColumns(
                actualRow
            );

        const expectedColumns =
            getColumns(
                expectedRow
            );


        /*
         * Number of columns must match.
         */

        if (
            actualColumns.length !==
            expectedColumns.length
        ) {

            return false;

        }


        /*
         * Every expected column must exist.
         */

        for (
            let i = 0;
            i < expectedColumns.length;
            i++
        ) {

            const expectedColumn =
                expectedColumns[i];


            const matchingActualColumn =
                actualColumns.find(
                    function (actualColumn) {

                        return (
                            String(actualColumn)
                                .trim()
                                .toLowerCase() ===
                            String(expectedColumn)
                                .trim()
                                .toLowerCase()
                        );

                    }
                );


            if (
                !matchingActualColumn
            ) {

                return false;

            }


            if (
                !valuesEqual(
                    actualRow[
                        matchingActualColumn
                    ],
                    expectedRow[
                        expectedColumn
                    ]
                )
            ) {

                return false;

            }

        }


        return true;

    }


    /*
     * ========================================================
     * COLUMN-ORDER / ALIAS-TOLERANT MATCH
     * ========================================================
     *
     * If column names are different, compare
     * the values themselves.
     *
     * Example:
     *
     * SELECT customer_name AS name
     *
     * can match:
     *
     * customer_name
     *
     * because the actual values are identical.
     *
     * IMPORTANT:
     *
     * We do NOT simply compare JSON.
     */

    function compareRowsByValues(
        actualRow,
        expectedRow
    ) {

        const actualColumns =
            getColumns(
                actualRow
            );

        const expectedColumns =
            getColumns(
                expectedRow
            );


        if (
            actualColumns.length !==
            expectedColumns.length
        ) {

            return false;

        }


        /*
         * Track which actual columns
         * have already been matched.
         */

        const usedActualColumns =
            new Set();


        /*
         * Try to match every expected
         * value with exactly one actual value.
         *
         * This handles column order
         * and aliases.
         */

        for (
            let i = 0;
            i < expectedColumns.length;
            i++
        ) {

            const expectedColumn =
                expectedColumns[i];

            const expectedValue =
                expectedRow[
                    expectedColumn
                ];


            let foundMatch =
                false;


            for (
                let j = 0;
                j < actualColumns.length;
                j++
            ) {

                const actualColumn =
                    actualColumns[j];


                if (
                    usedActualColumns.has(
                        actualColumn
                    )
                ) {

                    continue;

                }


                const actualValue =
                    actualRow[
                        actualColumn
                    ];


                if (
                    valuesEqual(
                        actualValue,
                        expectedValue
                    )
                ) {

                    usedActualColumns.add(
                        actualColumn
                    );

                    foundMatch =
                        true;

                    break;

                }

            }


            if (
                !foundMatch
            ) {

                return false;

            }

        }


        return true;

    }


    /*
     * ========================================================
     * ROW COMPARISON
     * ========================================================
     */

    function rowsEqual(
        actualRow,
        expectedRow
    ) {

        /*
         * First use exact column names.
         */

        if (
            compareRowsByColumnName(
                actualRow,
                expectedRow
            )
        ) {

            return true;

        }


        /*
         * If that fails, allow column
         * aliases / different column order.
         */

        return compareRowsByValues(
            actualRow,
            expectedRow
        );

    }


    /*
     * ========================================================
     * MATCH ROWS
     * ========================================================
     *
     * We do NOT sort only by JSON because
     * column aliases/order can differ.
     *
     * Instead, each expected row must find
     * exactly one unused matching actual row.
     *
     * This also handles duplicate rows correctly.
     */

    const usedActualRows =
        new Set();


    for (
        let i = 0;
        i < expectedRows.length;
        i++
    ) {

        const expectedRow =
            expectedRows[i];


        let matched =
            false;


        for (
            let j = 0;
            j < actualRows.length;
            j++
        ) {

            /*
             * Do not use the same actual row
             * twice.
             */

            if (
                usedActualRows.has(j)
            ) {

                continue;

            }


            if (
                rowsEqual(
                    actualRows[j],
                    expectedRow
                )
            ) {

                usedActualRows.add(j);

                matched =
                    true;

                break;

            }

        }


        /*
         * Expected row could not be found.
         */

        if (
            !matched
        ) {

            console.log(
                "❌ Expected row not found:",
                expectedRow
            );

            return false;

        }

    }


    /*
     * ========================================================
     * SUCCESS
     * ========================================================
     */

    console.log(
        "========== QUERY VALIDATION =========="
    );

    console.log(
        "Actual rows:",
        actualRows
    );

    console.log(
        "Expected rows:",
        expectedRows
    );

    console.log(
        "Validation result:",
        true
    );

    console.log(
        "======================================="
    );


    return true;

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


            /* =================================================
             * BANKING PAYMENTS COLUMN COMPATIBILITY
             * =================================================
             * Some older Banking schema/seed combinations used
             * `payment_amount`, while the finalized Challenge
             * questions use `amount`.
             *
             * Do NOT change the source schema or question files.
             * If the loaded database has the legacy column only,
             * expose the finalized `amount` column in this in-memory
             * Challenge database so existing questions continue to
             * execute correctly.
             */
            if (
                databaseName.toLowerCase() === "banking"
            ) {

                try {

                    const paymentTableInfo =
                        this.db.exec(
                            "PRAGMA table_info(payments);"
                        );

                    const paymentColumns =
                        paymentTableInfo?.[0]?.values?.map(
                            row => row[1]
                        ) || [];

                    if (
                        !paymentColumns.includes("amount") &&
                        paymentColumns.includes("payment_amount")
                    ) {

                        console.warn(
                            "⚠️ Legacy Banking payments column detected. "+
                            "Creating Challenge-compatible amount column."
                        );

                        this.db.exec(
                            "ALTER TABLE payments ADD COLUMN amount REAL;"
                        );

                        this.db.exec(
                            "UPDATE payments SET amount = payment_amount;"
                        );

                        console.log(
                            "✅ Banking payments.amount compatibility column created."
                        );
                    }

                }

                catch (compatibilityError) {

                    console.error(
                        "❌ Banking payments compatibility check failed:",
                        compatibilityError
                    );

                    throw compatibilityError;
                }
            }


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

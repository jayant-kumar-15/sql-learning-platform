const browserSqlEngine = {

    db: null,

    initialized: false,

    currentDatabase: null,

    async initialize(databaseName = "Banking") {

        /*
         * Already initialized for this database
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
             * Load SQLite WASM
             */
            const sqlite3 =
                await initializeSQLite();

            /*
             * Create an in-memory SQLite database.
             *
             * The database exists only inside
             * the user's browser.
             */
            this.db =
                new sqlite3.oo1.DB(
                    ":memory:"
                );

            /*
             * During seed loading we temporarily
             * disable foreign-key enforcement.
             *
             * This is required because the current
             * seed.sql inserts some child records
             * before their parent records.
             */
            this.db.exec(
                "PRAGMA foreign_keys = OFF;"
            );

            /*
             * Load schema.sql
             */
            const schemaResponse =
                await fetch(
                    "../database/schema.sql"
                );

            if (!schemaResponse.ok) {

                throw new Error(
                    "Unable to load schema.sql"
                );

            }

            const schemaSql =
                await schemaResponse.text();

            console.log(
                "📐 Loading database schema..."
            );

            this.db.exec(schemaSql);

            /*
             * Load seed.sql
             */
            const seedResponse =
                await fetch(
                    "../database/seed.sql"
                );

            if (!seedResponse.ok) {

                throw new Error(
                    "Unable to load seed.sql"
                );

            }

            const seedSql =
                await seedResponse.text();

            console.log(
                "🌱 Loading sample data..."
            );

            this.db.exec(seedSql);

            /*
             * Re-enable foreign-key enforcement
             */
            this.db.exec(
                "PRAGMA foreign_keys = ON;"
            );

            /*
             * Remember current database
             */
            this.currentDatabase =
                databaseName;

            this.initialized = true;

            console.log(
                "✅ Browser SQLite database initialized:",
                databaseName
            );

            return this.db;

        } catch (error) {

            console.error(
                "❌ Browser SQLite initialization failed:",
                error
            );

            /*
             * Clean up failed database
             */
            this.db = null;

            this.initialized = false;

            this.currentDatabase = null;

            throw error;

        }

    },


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

        /*
         * For now Banking is the default.
         *
         * Later challenge.js will pass:
         *
         * database: "Banking"
         *
         * or
         *
         * database: "Healthcare"
         */
        const databaseName =
            options.database ||
            "Banking";

        const db =
            await this.initialize(
                databaseName
            );

        const startTime =
            performance.now();

        try {

            /*
             * Execute query and obtain
             * rows as JavaScript objects.
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

            /*
             * Determine columns.
             */
            let columns = [];

            if (rows.length > 0) {

                columns =
                    Object.keys(
                        rows[0]
                    );

            } else {

                /*
                 * For SELECT queries that
                 * return zero rows, we need
                 * SQLite to provide column names.
                 */
                const statement =
                    db.prepare(query);

                try {

                    columns =
                        statement
                            .getColumnNames();

                } finally {

                    statement.finalize();

                }

            }

            console.log(
                "🟢 Browser SQL executed successfully"
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

            return {

                success: true,

                columns: columns,

                rows: rows,

                rowCount: rows.length,

                executionTime:
                    executionTime,

                resultsTruncated: false

            };

        } catch (error) {

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


/*
 * Make browser SQL engine globally available.
 */
window.browserSqlEngine =
    browserSqlEngine;

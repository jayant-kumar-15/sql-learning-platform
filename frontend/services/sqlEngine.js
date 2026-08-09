const sqlEngine = {

    mode: "backend",

    async execute(query, options = {}) {

        if (!query || typeof query !== "string") {

            throw new Error(
                "SQL query is required."
            );

        }

        /*
         * Browser SQLite will eventually handle
         * fixed practice databases.
         */

        if (
            this.mode === "browser" &&
            window.browserSqlEngine
        ) {

            return await browserSqlEngine.execute(
                query
            );

        }

        /*
         * Current backend implementation.
         */

        if (typeof executeSqlQuery !== "function") {

            throw new Error(
                "SQL execution service is unavailable."
            );

        }

        return await executeSqlQuery(
            query,
            options.expectedOutput || null
        );

    }

};

window.sqlEngine = sqlEngine;

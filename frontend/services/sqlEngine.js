const sqlEngine = {

    async execute(query, options = {}) {

        if (!query || typeof query !== "string") {

            throw new Error(
                "SQL query is required."
            );

        }

        /*
         * Temporary implementation
         *
         * For now SQL execution still goes
         * through our backend API.
         *
         * Later this will be replaced by
         * SQLite WASM for fixed practice
         * databases.
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

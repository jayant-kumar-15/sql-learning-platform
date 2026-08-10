const sqlEngine = {

    /*
     * Fixed challenge questions should run
     * inside the browser.
     *
     * Backend remains available for operations
     * that require server-side persistence.
     */
    mode: "browser",

    async execute(query, options = {}) {

        if (
            !query ||
            typeof query !== "string"
        ) {

            throw new Error(
                "SQL query is required."
            );

        }

        /*
         * =========================================
         * BROWSER SQL ENGINE
         * =========================================
         */

        if (
            this.mode === "browser" &&
            window.browserSqlEngine
        ) {

            try {

                return await window.browserSqlEngine.execute(
                    query,
                    {
                        database:
                            options.database ||
                            "Banking"
                    }
                );

            } catch (error) {

                console.error(
                    "Browser SQL execution failed:",
                    error
                );

                /*
                 * IMPORTANT:
                 *
                 * We do NOT automatically send the
                 * query to Render here.
                 *
                 * If browser execution fails, we
                 * want to know why rather than
                 * silently moving the workload back
                 * to the backend.
                 */

                throw error;

            }

        }

        /*
         * =========================================
         * BACKEND FALLBACK
         * =========================================
         */

        if (
            typeof executeSqlQuery !== "function"
        ) {

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


/*
 * Make SQL engine globally available.
 */

window.sqlEngine =
    sqlEngine;

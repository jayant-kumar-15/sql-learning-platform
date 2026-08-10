const sqlEngine = {

    /*
     * Fixed challenge questions should run
     * inside the browser.
     *
     * Backend remains available for operations
     * that require server-side persistence.
     */
    mode: "browser",


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
                            "Banking",

                        /*
                         * IMPORTANT:
                         * Pass expected output to the
                         * browser engine so it can
                         * validate the answer.
                         */
                        expectedOutput:
                            options.expectedOutput ||
                            null
                    }
                );

            } catch (error) {

                console.error(
                    "Browser SQL execution failed:",
                    error
                );

                /*
                 * Do NOT automatically fall back
                 * to Render.
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
            options.expectedOutput ||
            null
        );

    }

};


/*
 * Make SQL engine globally available.
 */

window.sqlEngine =
    sqlEngine;

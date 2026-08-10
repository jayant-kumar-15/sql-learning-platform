const sqlEngine = {

    /*
     * Fixed challenge questions run
     * inside the browser.
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
         * =====================================================
         * BROWSER SQL ENGINE
         * =====================================================
         */

        if (
            this.mode === "browser" &&
            window.browserSqlEngine
        ) {

            return await window.browserSqlEngine.execute(
                query,
                {

                    database:
                        options.database ||
                        "Banking",

                    expectedOutput:
                        options.expectedOutput ||
                        null

                }
            );

        }


        /*
         * =====================================================
         * BACKEND FALLBACK
         * =====================================================
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
 * Global availability.
 */

window.sqlEngine =
    sqlEngine;

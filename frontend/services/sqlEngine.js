const sqlEngine = {

    /*
     * Fixed challenge questions run
     * inside the browser.
     */
    mode: "browser",


    /* ============================================================
     * EXECUTE SQL
     * ============================================================
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


        /*
         * ========================================================
         * BROWSER SQL ENGINE
         * ========================================================
         */

        if (
            this.mode === "browser" &&
            window.browserSqlEngine
        ) {

            try {

                /*
                 * Execute query inside browser SQLite.
                 *
                 * expectedOutput is passed so the
                 * browser engine can produce the
                 * initial result comparison.
                 */

                const result =
                    await window.browserSqlEngine.execute(
                        query,
                        {

                            database:
                                options.database ||
                                "Banking",

                            expectedOutput:
                                options.expectedOutput ||
                                null,

                            /* Pass the full challenge for dynamic reference validation. */
                            challenge:
                                options.challenge ||
                                null

                        }
                    );


                /*
                 * =================================================
                 * CHALLENGE VALIDATION
                 * =================================================
                 *
                 * Only fixed challenge questions
                 * should use challengeValidator.
                 *
                 * User-created databases will not
                 * pass a challenge object.
                 */

                if (
                    options.challenge &&
                    window.challengeValidator
                ) {

                    console.log(
                        "🧠 Running challenge validator..."
                    );


                    result.isCorrect =
                        window.challengeValidator.validate(
                            options.challenge,
                            result
                        );


                    console.log(
                        "🧠 Challenge validation result:",
                        result.isCorrect
                    );

                }


                return result;


            }

            catch (error) {

                console.error(
                    "❌ Browser SQL execution failed:",
                    error
                );


                throw error;

            }

        }


        /*
         * ========================================================
         * BACKEND FALLBACK
         * ========================================================
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
 * ================================================================
 * GLOBAL AVAILABILITY
 * ================================================================
 */

window.sqlEngine =
    sqlEngine;

console.log(
    "✅ sqlEngine.js loaded successfully"
);

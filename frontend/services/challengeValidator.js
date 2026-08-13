/*
 * ============================================================
 * FILE PATH: frontend/services/challengeValidator.js
 * ============================================================
 * PURPOSE
 * -------
 * SQL Learning Platform module.
 *
 * DOCUMENTATION
 * -------------
 * Keep this path header during future revisions. Add section
 * comments before every new major feature, state object,
 * event group, API call, or validation rule.
 *
 * Existing functionality is preserved in this documentation
 * revision.
 * ============================================================
 */

/*
 * ============================================================
 * CHALLENGE VALIDATOR
 * ============================================================
 *
 * Central validation layer for challenge questions.
 *
 * Supported validation types:
 *
 * RESULT
 * ORDERED_RESULT
 * ROW_COUNT
 * DATABASE_STATE
 * CUSTOM
 *
 *
 * RESULT
 * ------------------------------------------------------------
 * Used mainly for SELECT questions.
 *
 * Row order does NOT matter.
 *
 * Example:
 *
 * Rahul | 60000
 * Priya | 70000
 *
 * is equivalent to:
 *
 * Priya | 70000
 * Rahul | 60000
 *
 *
 * ORDERED_RESULT
 * ------------------------------------------------------------
 * Used when row order is intentionally important.
 *
 *
 * ROW_COUNT
 * ------------------------------------------------------------
 * Used when only the number of returned rows matters.
 *
 *
 * DATABASE_STATE
 * ------------------------------------------------------------
 * Used later for INSERT / UPDATE / DELETE challenges.
 *
 *
 * CUSTOM
 * ------------------------------------------------------------
 * Reserved for special challenge-specific validation.
 * ============================================================
 */


const challengeValidator = {


    /*
     * ============================================================
     * MAIN VALIDATION FUNCTION
     * ============================================================
     */

    validate(
        challenge,
        actualResult
    ) {

        /*
         * --------------------------------------------------------
         * BASIC VALIDATION
         * --------------------------------------------------------
         */

        if (!challenge) {

            throw new Error(
                "Challenge information is required."
            );

        }


        if (!actualResult) {

            throw new Error(
                "SQL execution result is required."
            );

        }


        /*
         * --------------------------------------------------------
         * DETERMINE VALIDATION TYPE
         * --------------------------------------------------------
         *
         * Existing questions without validationType
         * automatically use RESULT.
         *
         * This means we do NOT need to update all
         * existing challenge JSON files immediately.
         */

        const validationType =
            String(
                challenge.validationType ||
                "RESULT"
            )
            .trim()
            .toUpperCase();


        console.log(
            "🧠 Challenge validation type:",
            validationType
        );


        console.log(
            "📝 Challenge ID:",
            challenge.id
        );


        /*
         * ========================================================
         * RESULT
         * ========================================================
         */

        if (
            validationType ===
            "RESULT"
        ) {

            const result =
                this.validateResult(
                    challenge,
                    actualResult
                );


            console.log(
                "🎯 RESULT validation:",
                result
            );


            return result;

        }


        /*
         * ========================================================
         * ORDERED RESULT
         * ========================================================
         */

        if (
            validationType ===
            "ORDERED_RESULT"
        ) {

            const result =
                this.validateOrderedResult(
                    challenge,
                    actualResult
                );


            console.log(
                "🎯 ORDERED_RESULT validation:",
                result
            );


            return result;

        }


        /*
         * ========================================================
         * ROW COUNT
         * ========================================================
         */

        if (
            validationType ===
            "ROW_COUNT"
        ) {

            const result =
                this.validateRowCount(
                    challenge,
                    actualResult
                );


            console.log(
                "🎯 ROW_COUNT validation:",
                result
            );


            return result;

        }


        /*
         * ========================================================
         * DATABASE STATE
         * ========================================================
         */

        if (
            validationType ===
            "DATABASE_STATE"
        ) {

            const result =
                this.validateDatabaseState(
                    challenge,
                    actualResult
                );


            console.log(
                "🎯 DATABASE_STATE validation:",
                result
            );


            return result;

        }


        /*
         * ========================================================
         * CUSTOM
         * ========================================================
         */

        if (
            validationType ===
            "CUSTOM"
        ) {

            const result =
                this.validateCustom(
                    challenge,
                    actualResult
                );


            console.log(
                "🎯 CUSTOM validation:",
                result
            );


            return result;

        }


        /*
         * ========================================================
         * UNKNOWN VALIDATION TYPE
         * ========================================================
         *
         * For safety we don't automatically mark an
         * unknown validation type as correct.
         */

        console.error(
            "❌ Unknown challenge validation type:",
            validationType
        );


        return false;

    },


    /*
     * ============================================================
     * RESULT VALIDATION
     * ============================================================
     *
     * This is our primary SELECT validator.
     *
     * The browserSqlEngine already performs robust comparison.
     *
     * Therefore:
     *
     * JOIN
     * SUBQUERY
     * EXISTS
     * IN
     * CTE
     * UNION
     *
     * can all be accepted when they produce the same
     * logical result.
     */

    validateResult(
        challenge,
        actualResult
    ) {

        /*
         * --------------------------------------------------------
         * Use browserSqlEngine result when available.
         * --------------------------------------------------------
         */

        if (
            typeof actualResult.isCorrect ===
            "boolean"
        ) {

            return actualResult.isCorrect;

        }


        /*
         * --------------------------------------------------------
         * Direct fallback comparison.
         * --------------------------------------------------------
         */

        if (
            typeof compareQueryResults ===
            "function" &&
            Array.isArray(
                challenge.expectedOutput
            )
        ) {

            return compareQueryResults(
                actualResult.rows || [],
                challenge.expectedOutput
            );

        }


        /*
         * --------------------------------------------------------
         * Missing expected output.
         * --------------------------------------------------------
         */

        console.warn(
            "⚠️ RESULT validation requested but expectedOutput is missing.",
            challenge.id
        );


        return false;

    },


    /*
     * ============================================================
     * ORDERED RESULT VALIDATION
     * ============================================================
     *
     * Unlike RESULT validation, this validator DOES care
     * about row order.
     *
     * This can be used for questions such as:
     *
     * "Display the top 5 customers ordered by balance DESC."
     *
     * ============================================================
     */

    validateOrderedResult(
        challenge,
        actualResult
    ) {

        if (
            !Array.isArray(
                challenge.expectedOutput
            )
        ) {

            console.warn(
                "⚠️ ORDERED_RESULT requires expectedOutput."
            );

            return false;

        }


        const actualRows =
            Array.isArray(
                actualResult.rows
            )
                ? actualResult.rows
                : [];


        const expectedRows =
            challenge.expectedOutput;


        /*
         * Same number of rows.
         */

        if (
            actualRows.length !==
            expectedRows.length
        ) {

            return false;

        }


        /*
         * Normalize values.
         */

        function normalizeValue(value) {

            if (
                value === null ||
                value === undefined
            ) {

                return "__NULL__";

            }


            if (
                typeof value === "number"
            ) {

                return String(
                    Number(value)
                );

            }


            return String(value)
                .trim()
                .toLowerCase();

        }


        /*
         * Compare row-by-row.
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


            const actualColumns =
                Object.keys(
                    actualRow
                )
                .map(function (column) {

                    return String(column)
                        .trim()
                        .toLowerCase();

                })
                .sort();


            const expectedColumns =
                Object.keys(
                    expectedRow
                )
                .map(function (column) {

                    return String(column)
                        .trim()
                        .toLowerCase();

                })
                .sort();


            /*
             * Same columns required.
             */

            if (
                JSON.stringify(
                    actualColumns
                ) !==
                JSON.stringify(
                    expectedColumns
                )
            ) {

                return false;

            }


            /*
             * Compare values by column.
             */

            for (
                const expectedColumn
                of Object.keys(expectedRow)
            ) {

                let actualColumn =
                    Object.keys(actualRow)
                        .find(function (column) {

                            return String(column)
                                .trim()
                                .toLowerCase() ===
                                String(expectedColumn)
                                    .trim()
                                    .toLowerCase();

                        });


                if (
                    actualColumn ===
                    undefined
                ) {

                    return false;

                }


                const actualValue =
                    normalizeValue(
                        actualRow[
                            actualColumn
                        ]
                    );


                const expectedValue =
                    normalizeValue(
                        expectedRow[
                            expectedColumn
                        ]
                    );


                if (
                    actualValue !==
                    expectedValue
                ) {

                    return false;

                }

            }

        }


        return true;

    },


    /*
     * ============================================================
     * ROW COUNT VALIDATION
     * ============================================================
     */

    validateRowCount(
        challenge,
        actualResult
    ) {

        const expectedRowCount =
            Number(
                challenge.expectedRowCount
            );


        const actualRowCount =
            Number(
                actualResult.rowCount ||
                (
                    Array.isArray(
                        actualResult.rows
                    )
                        ? actualResult.rows.length
                        : 0
                )
            );


        /*
         * Validate configuration.
         */

        if (
            Number.isNaN(
                expectedRowCount
            )
        ) {

            console.warn(
                "⚠️ expectedRowCount is missing.",
                challenge.id
            );

            return false;

        }


        return (
            actualRowCount ===
            expectedRowCount
        );

    },


    /*
     * ============================================================
     * DATABASE STATE VALIDATION
     * ============================================================
     *
     * Reserved for:
     *
     * INSERT
     * UPDATE
     * DELETE
     *
     * challenges.
     *
     * We will connect this to the browser SQLite database
     * after the SELECT challenge system is fully stable.
     */

    validateDatabaseState(
        challenge,
        actualResult
    ) {

        console.log(
            "🗄️ DATABASE_STATE validation requested."
        );


        /*
         * We intentionally do NOT mark this
         * as correct yet.
         */

        console.warn(
            "⚠️ DATABASE_STATE validator is not implemented yet.",
            challenge.id
        );


        return false;

    },


    /*
     * ============================================================
     * CUSTOM VALIDATION
     * ============================================================
     *
     * Reserved for special challenge types.
     */

    validateCustom(
        challenge,
        actualResult
    ) {

        console.log(
            "🔧 CUSTOM validation requested."
        );


        console.warn(
            "⚠️ CUSTOM validator has no rule configured.",
            challenge.id
        );


        return false;

    }

};


/*
 * ============================================================
 * GLOBAL AVAILABILITY
 * ============================================================
 */

window.challengeValidator =
    challengeValidator;


console.log(
    "✅ challengeValidator.js loaded successfully"
);

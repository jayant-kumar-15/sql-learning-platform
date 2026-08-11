/*
 * ============================================================
 * CHALLENGE VALIDATOR
 * ============================================================
 *
 * Central validation layer for fixed challenge questions.
 *
 * Supported validation types:
 *
 * RESULT
 * DATABASE_STATE
 * ROW_COUNT
 * CUSTOM
 *
 * RESULT:
 *   Used mainly for SELECT questions.
 *
 * DATABASE_STATE:
 *   Will be used later for INSERT / UPDATE / DELETE.
 *
 * ROW_COUNT:
 *   Used when the challenge cares about affected rows.
 *
 * CUSTOM:
 *   Reserved for special challenge-specific validation.
 * ============================================================
 */

const challengeValidator = {


    /*
     * ========================================================
     * MAIN VALIDATION FUNCTION
     * ========================================================
     */

    validate(
        challenge,
        actualResult
    ) {

        /*
         * Basic validation.
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
         * Determine validation type.
         *
         * Existing questions that don't have
         * validationType will automatically
         * behave as RESULT questions.
         */

        const validationType =
            challenge.validationType ||
            "RESULT";


        console.log(
            "🧠 Challenge validation type:",
            validationType
        );


        /*
         * ====================================================
         * RESULT VALIDATION
         * ====================================================
         */

        if (
            validationType ===
            "RESULT"
        ) {

            return this.validateResult(
                challenge,
                actualResult
            );

        }


        /*
         * ====================================================
         * ROW COUNT VALIDATION
         * ====================================================
         */

        if (
            validationType ===
            "ROW_COUNT"
        ) {

            return this.validateRowCount(
                challenge,
                actualResult
            );

        }


        /*
         * ====================================================
         * DATABASE STATE
         * ====================================================
         *
         * This will be expanded when we implement
         * INSERT / UPDATE / DELETE challenges.
         */

        if (
            validationType ===
            "DATABASE_STATE"
        ) {

            return this.validateDatabaseState(
                challenge,
                actualResult
            );

        }


        /*
         * ====================================================
         * CUSTOM VALIDATION
         * ====================================================
         */

        if (
            validationType ===
            "CUSTOM"
        ) {

            return this.validateCustom(
                challenge,
                actualResult
            );

        }


        /*
         * Unknown validation type.
         */

        console.error(
            "❌ Unknown challenge validation type:",
            validationType
        );


        return false;

    },


    /*
     * ========================================================
     * RESULT VALIDATION
     * ========================================================
     *
     * Used for SELECT challenges.
     *
     * The browserSqlEngine already performs
     * robust result comparison.
     *
     * We simply use its result here.
     */

    validateResult(
        challenge,
        actualResult
    ) {

        /*
         * If browserSqlEngine has already
         * calculated isCorrect, use it.
         */

        if (
            typeof actualResult.isCorrect ===
            "boolean"
        ) {

            return actualResult.isCorrect;

        }


        /*
         * Otherwise compare directly.
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
         * No expected result available.
         */

        console.warn(
            "⚠️ RESULT validation requested but expectedOutput is missing."
        );


        return false;

    },


    /*
     * ========================================================
     * ROW COUNT VALIDATION
     * ========================================================
     */

    validateRowCount(
        challenge,
        actualResult
    ) {

        /*
         * Expected row count can be defined
         * in the challenge JSON.
         */

        const expectedRowCount =
            Number(
                challenge.expectedRowCount
            );


        const actualRowCount =
            Number(
                actualResult.rowCount || 0
            );


        if (
            Number.isNaN(
                expectedRowCount
            )
        ) {

            console.warn(
                "⚠️ expectedRowCount is missing."
            );

            return false;

        }


        return (
            actualRowCount ===
            expectedRowCount
        );

    },


    /*
     * ========================================================
     * DATABASE STATE VALIDATION
     * ========================================================
     *
     * Placeholder for INSERT / UPDATE /
     * DELETE challenge validation.
     *
     * We will implement this properly next.
     */

    validateDatabaseState(
        challenge,
        actualResult
    ) {

        console.log(
            "🗄️ DATABASE_STATE validation requested."
        );


        /*
         * For now we don't automatically
         * mark it correct.
         *
         * The next step will inspect the
         * actual SQLite database state.
         */

        return false;

    },


    /*
     * ========================================================
     * CUSTOM VALIDATION
     * ========================================================
     */

    validateCustom(
        challenge,
        actualResult
    ) {

        console.log(
            "🔧 CUSTOM validation requested."
        );


        /*
         * Reserved for special questions.
         */

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

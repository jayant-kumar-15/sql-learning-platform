/*
 * ============================================================
 * FILE PATH: Backend/routes/queryRoutes.js
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

const express = require("express");

const queryService =
    require("../services/queryService");

const resultComparator =
    require("../services/resultComparator");

const router = express.Router();


router.post("/query", async function (req, res) {

    const query = req.body.query;

    const expectedOutput =
        req.body.expectedOutput;


    // ==========================================
    // VALIDATE QUERY INPUT
    // ==========================================

    if (
        !query ||
        typeof query !== "string"
    ) {

        return res.status(400).json({

            success: false,

            status: "error",

            message:
                "SQL query is required."

        });

    }


    const trimmedQuery =
        query.trim();


    if (trimmedQuery === "") {

        return res.status(400).json({

            success: false,

            status: "error",

            message:
                "SQL query cannot be empty."

        });

    }


    // ==========================================
    // EXECUTE QUERY
    // ==========================================

    try {

        const result =
            await queryService.executeQuery(
                trimmedQuery
            );


        // ======================================
        // COMPARE RESULTS
        // ======================================

        let isCorrect = null;


        if (
            Array.isArray(expectedOutput)
        ) {

            isCorrect =
                resultComparator.compareResults(

                    result.rows,

                    expectedOutput

                );

        }


        // ======================================
        // SEND RESPONSE
        // ======================================

        return res.json({

            success: true,

            status: "success",

            columns:
                result.columns,

            rows:
                result.rows,

            rowCount:
                result.rowCount,

            resultsTruncated:
                result.resultsTruncated,

            executionTime:
                result.executionTime,

            isCorrect:
                isCorrect

        });


    } catch (error) {

        console.error(

            "❌ Query execution error:",

            error.message

        );


        return res.status(400).json({

            success: false,

            status: "error",

            message:
                error.message,

            executionTime:
                error.executionTime || 0,

            isCorrect: false

        });

    }

});


module.exports = router;

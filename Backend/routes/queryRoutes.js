
/*
 * FILE: Backend/routes/queryRoutes.js
 */
const express = require("express");

const queryService = require("../services/queryService");
const resultComparator = require("../services/resultComparator");

const router = express.Router();

/*
 * BACKEND QUERY API
 * -----------------
 * The primary Playground/Challenge SQL path is browser-first:
 * frontend/assets SQL files are loaded into SQLite WASM in the browser
 * whenever possible, reducing backend load.
 *
 * This route is the backend/API execution path and is used when the
 * frontend explicitly calls /api/query or falls back to the backend.
 */
router.post("/query", async function (req, res) {
    const query = req.body.query;
    const expectedOutput = req.body.expectedOutput;

    // Validate the incoming SQL request before execution.
    if (!query || typeof query !== "string") {
        return res.status(400).json({
            success: false,
            status: "error",
            message: "SQL query is required."
        });
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery === "") {
        return res.status(400).json({
            success: false,
            status: "error",
            message: "SQL query cannot be empty."
        });
    }

    try {
        // Execute through the existing backend query service.
        const result = await queryService.executeQuery(trimmedQuery);

        // Compare results only when a challenge expected output is supplied.
        let isCorrect = null;

        if (Array.isArray(expectedOutput)) {
            isCorrect = resultComparator.compareResults(
                result.rows,
                expectedOutput
            );
        }

        return res.json({
            success: true,
            status: "success",
            columns: result.columns,
            rows: result.rows,
            rowCount: result.rowCount,
            resultsTruncated: result.resultsTruncated,
            executionTime: result.executionTime,
            isCorrect: isCorrect
        });
    } catch (error) {
        console.error("Query execution error:", error.message);

        return res.status(400).json({
            success: false,
            status: "error",
            message: error.message,
            executionTime: error.executionTime || 0,
            isCorrect: false
        });
    }
});

module.exports = router;

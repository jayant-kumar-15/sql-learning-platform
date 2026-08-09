const express = require("express");

const queryService = require("../services/queryService");

const router = express.Router();

router.post("/query", async function (req, res) {

    const query = req.body.query;

    if (!query || typeof query !== "string") {

        return res.status(400).json({
            success: false,
            message: "SQL query is required."
        });

    }

    const trimmedQuery = query.trim();

    if (trimmedQuery === "") {

        return res.status(400).json({
            success: false,
            message: "SQL query cannot be empty."
        });

    }

    try {

        const result =
            await queryService.executeQuery(
                trimmedQuery
            );

        res.json({

            success: true,

            columns: result.columns,

            rows: result.rows,

            rowCount: result.rowCount

        });

    } catch (error) {

        console.error(
            "❌ Query execution error:",
            error.message
        );

        res.status(400).json({

            success: false,

            message: error.message

        });

    }

});

module.exports = router;

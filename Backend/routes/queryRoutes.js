const express = require("express");

const router = express.Router();

router.post("/query", function (req, res) {

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

    res.json({
        success: true,
        message: "Query received successfully.",
        query: trimmedQuery
    });

});

module.exports = router;

const express = require("express");

const db = require("../config/db");

const app = express();

const PORT = 3000;

app.use(express.json());

app.get("/api/health", function (req, res) {

    res.json({
        success: true,
        message: "SQL Learning API is running"
    });

});

app.listen(PORT, function () {

    console.log(
        `🚀 Server running on port ${PORT}`
    );

});

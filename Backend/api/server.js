const express = require("express");

const db = require("../config/db");
const queryRoutes = require("../routes/queryRoutes");

const app = express();

const PORT = 3000;

app.use(express.json());
app.use("/api", queryRoutes);

app.get("/api/health", function (req, res) {

    res.json({
        success: true,
        message: "SQL Learning API is running"
    });

});

app.get("/api/db-test", function (req, res) {

    db.get(
        "SELECT 1 AS result",
        function (error, row) {

            if (error) {

                console.error(
                    "❌ Database test failed:",
                    error.message
                );

                return res.status(500).json({
                    success: false,
                    message: "Database connection failed"
                });

            }

            res.json({
                success: true,
                message: "Database connection successful",
                result: row.result
            });

        }
    );

});

app.get("/api/data-test", function (req, res) {

    const query = `
        SELECT
            c.customer_name,
            a.balance
        FROM customers c
        JOIN accounts a
            ON c.customer_id = a.customer_id
        WHERE a.balance > 50000
        ORDER BY a.balance DESC
    `;

    db.all(
        query,
        function (error, rows) {

            if (error) {

                console.error(
                    "❌ Data test failed:",
                    error.message
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to read database data"
                });

            }

            res.json({
                success: true,
                rows: rows
            });

        }
    );

});

app.listen(PORT, function () {

    console.log(
        `🚀 Server running on port ${PORT}`
    );

});

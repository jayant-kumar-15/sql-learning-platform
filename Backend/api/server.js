const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const db = require("../config/db");
const queryRoutes = require("../routes/queryRoutes");

const app = express();

function initializeDatabase(callback) {

    const schemaPath = path.join(
        __dirname,
        "../database/schema.sql"
    );

    const seedPath = path.join(
        __dirname,
        "../database/seed.sql"
    );

    db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='customers'",
        function (error, row) {

            if (error) {

                console.error(
                    "❌ Database check failed:",
                    error.message
                );

                return callback(error);

            }

            // Database already initialized
            if (row) {

                console.log(
                    "✅ Database already initialized"
                );

                return callback(null);

            }

            console.log(
                "🔄 Initializing SQLite database..."
            );

            try {

                const schema =
                    fs.readFileSync(
                        schemaPath,
                        "utf8"
                    );

                const seed =
                    fs.readFileSync(
                        seedPath,
                        "utf8"
                    );

                db.exec(
                    schema,
                    function (schemaError) {

                        if (schemaError) {

                            console.error(
                                "❌ Schema initialization failed:",
                                schemaError.message
                            );

                            return callback(
                                schemaError
                            );

                        }

                        console.log(
                            "✅ Database schema initialized"
                        );

                        db.exec(
                            seed,
                            function (seedError) {

                                if (seedError) {

                                    console.error(
                                        "❌ Seed initialization failed:",
                                        seedError.message
                                    );

                                    return callback(
                                        seedError
                                    );

                                }

                                console.log(
                                    "✅ Seed data initialized"
                                );

                                console.log(
                                    "🎉 Database setup completed"
                                );

                                callback(null);

                            }
                        );

                    }
                );

            } catch (fileError) {

                console.error(
                    "❌ Database files could not be read:",
                    fileError.message
                );

                callback(fileError);

            }

        }
    );

}

const corsOptions = {
    origin: "https://jayant-kumar-15.github.io",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

// CORS
app.use(cors(corsOptions));

// Explicitly handle browser preflight requests
app.options(/.*/, cors(corsOptions));

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

const PORT = process.env.PORT || 10000;

initializeDatabase(function (error) {

    if (error) {

        console.error(
            "❌ Server startup aborted because database initialization failed."
        );

        process.exit(1);

    }

    app.listen(
        PORT,
        "0.0.0.0",
        function () {

            console.log(
                `🚀 Server running on port ${PORT}`
            );

        }
    );

});



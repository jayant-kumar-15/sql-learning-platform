const sqlite3 = require("sqlite3").verbose();

const path = require("path");

const dbPath = path.join(
    __dirname,
    "../database/sql-learning.db"
);

const db = new sqlite3.Database(
    dbPath,
    function (error) {

        if (error) {

            console.error(
                "❌ Database connection failed:",
                error.message
            );

            return;

        }

        console.log(
            "✅ SQLite database connected"
        );

    }
);

module.exports = db;

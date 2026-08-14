/*
 * ============================================================
 * FILE PATH: Backend/config/db.js
 * ============================================================
 * PURPOSE
 * -------
 * SQL Learning Platform component.
 *
 * DOCUMENTATION
 * -------------
 * This path header is intentionally kept at the top so the
 * repository location can be identified quickly during future
 * revisions.
 *
 * Existing functionality is preserved in this documentation
 * revision.
 * ============================================================
 */

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

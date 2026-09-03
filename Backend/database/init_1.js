/*
 * ============================================================
 * FILE PATH: Backend/database/init.js
 * ============================================================
 * PURPOSE
 * -------
 * Initializes ONLY the persistent backend application database.
 *
 * IMPORTANT
 * ---------
 * This file no longer loads Healthcare/Banking schema or seed
 * files. Those learning databases are loaded by browser SQLite
 * WASM from frontend/assets/ by the Playground/Challenge engine.
 *
 * This initializer is intentionally idempotent: CREATE TABLE IF
 * NOT EXISTS / CREATE INDEX IF NOT EXISTS statements can be run
 * safely when the backend restarts.
 * ============================================================
 */

const fs = require("fs");
const path = require("path");

const db = require("../config/db");

/* ============================================================
 * BACKEND APPLICATION SCHEMA FILES
 * ============================================================
 * These files contain only persistent application data models:
 * authentication/session/feedback and traffic analytics.
 * ============================================================
 */
const schemaFiles = [
    "auth-schema.sql",
    "analytics-schema.sql"
];

/* ============================================================
 * INITIALIZATION FUNCTION
 * ============================================================
 * The callback is used by server.js so the HTTP server starts
 * only after all required application tables are available.
 * ============================================================
 */
function initializeDatabase(callback) {

    db.serialize(function () {

        console.log(
            "🔄 Initializing backend application database..."
        );

        try {

            const schemas = [];

            for (const fileName of schemaFiles) {

                const schemaPath = path.join(
                    __dirname,
                    fileName
                );

                /*
                 * Fail fast if a required application schema is
                 * missing. This prevents a partially working admin
                 * system from being deployed accidentally.
                 */
                if (!fs.existsSync(schemaPath)) {

                    throw new Error(
                        `Required application schema not found: ${fileName}`
                    );
                }

                const schema = fs.readFileSync(
                    schemaPath,
                    "utf8"
                );

                if (!schema.trim()) {

                    throw new Error(
                        `Application schema is empty: ${fileName}`
                    );
                }

                console.log(
                    `📐 Loading backend application schema: ${fileName}`
                );

                schemas.push(schema);
            }

            /*
             * Execute both application schemas as one serialized
             * SQLite operation. The callback fires only after the
             * database has actually completed both schemas.
             */
            db.exec(
                schemas.join("\n\n"),
                function (error) {

                    if (error) {

                        console.error(
                            "❌ Backend application schema initialization failed:",
                            error.message
                        );

                        return callback(error);
                    }

                    console.log(
                        "🎉 Backend application database initialization completed."
                    );

                    return callback(null);
                }
            );

        } catch (error) {

            console.error(
                "❌ Backend database initialization failed:",
                error.message
            );

            return callback(error);
        }

    });

}

module.exports = initializeDatabase;

/*
 * ============================================================
 * FILE PATH: Backend/database/init.js
 * ============================================================
 * PURPOSE
 * -------
 * Initializes the persistent PostgreSQL application database.
 *
 * IMPORTANT ARCHITECTURE RULE
 * ---------------------------
 * This initializer creates ONLY application/admin tables:
 *
 *   - users
 *   - auth_sessions
 *   - feedback
 *   - traffic_events
 *   - analytics_sessions
 *
 * It does NOT touch the existing Healthcare/Banking learning
 * databases. Those remain browser-side SQLite WASM data.
 * ============================================================
 */

const fs = require("fs");
const path = require("path");
const db = require("../config/pgDb");

const schemaFiles = [
    "auth-schema.sql",
    "analytics-schema.sql"
];

function initializeDatabase(callback) {
    db.testConnection(function (connectionError) {
        if (connectionError) {
            console.error(
                "❌ Persistent PostgreSQL connection failed:",
                connectionError.message
            );
            return callback(connectionError);
        }

        console.log(
            "✅ Persistent PostgreSQL connection established"
        );

        let combinedSchema = "";

        try {
            for (const fileName of schemaFiles) {
                const schemaPath = path.join(
                    __dirname,
                    fileName
                );

                if (!fs.existsSync(schemaPath)) {
                    throw new Error(
                        `Required PostgreSQL schema not found: ${fileName}`
                    );
                }

                const schema = fs.readFileSync(
                    schemaPath,
                    "utf8"
                );

                if (!schema.trim()) {
                    throw new Error(
                        `PostgreSQL schema is empty: ${fileName}`
                    );
                }

                console.log(
                    `📐 Loading PostgreSQL application schema: ${fileName}`
                );

                combinedSchema += "\n\n" + schema;
            }
        } catch (fileError) {
            console.error(
                "❌ PostgreSQL schema preparation failed:",
                fileError.message
            );
            return callback(fileError);
        }

        db.exec(
            combinedSchema,
            function (schemaError) {
                if (schemaError) {
                    console.error(
                        "❌ PostgreSQL application schema initialization failed:",
                        schemaError.message
                    );
                    return callback(schemaError);
                }

                console.log(
                    "🎉 Persistent PostgreSQL application database initialized."
                );

                return callback(null);
            }
        );
    });
}

module.exports = initializeDatabase;

/*
 * FILE: Backend/routes/schemaRoutes.js
 *
 * PURPOSE
 * -------
 * Backend schema/metadata API.
 *
 * IMPORTANT ARCHITECTURE
 * ----------------------
 * Healthcare and Banking learning SQL is browser-first. The browser
 * loads these files from frontend/assets/ and executes them with
 * SQLite WASM:
 *
 *   healthcare-schema.sql
 *   healthcare-seed.sql
 *   banking-schema.sql
 *   banking-seed.sql
 *
 * This backend route does NOT replace those files.
 *
 * It provides metadata APIs for callers that need backend SQLite
 * schema information and keeps the older /:database/:tables endpoint
 * for compatibility.
 */

const express = require("express");
const router = express.Router();
const db = require("../config/db");

function isSafeIdentifier(value) {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}

function getAllTables(callback) {
    const sql = `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    `;

    db.all(sql, [], callback);
}

/*
 * GET /api/schema/databases
 *
 * Logical learning databases exposed to the frontend.
 * Actual Healthcare/Banking learning data remains browser-side.
 */
router.get("/databases", function (req, res) {
    return res.json({
        success: true,
        databases: [
            { name: "Healthcare", type: "learning" },
            { name: "Banking", type: "learning" }
        ]
    });
});

/*
 * GET /api/schema/table/:database/:table
 *
 * Backend metadata lookup for one table.
 */
router.get("/table/:database/:table", function (req, res) {
    const databaseName = req.params.database;
    const tableName = req.params.table;

    if (!isSafeIdentifier(tableName)) {
        return res.status(400).json({
            success: false,
            message: "Invalid table name."
        });
    }

    db.all(
        `PRAGMA table_info("${tableName}")`,
        [],
        function (columnError, columns) {
            if (columnError) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to read table schema."
                });
            }

            db.all(
                `PRAGMA foreign_key_list("${tableName}")`,
                [],
                function (foreignKeyError, foreignKeys) {
                    if (foreignKeyError) {
                        return res.status(500).json({
                            success: false,
                            message: "Unable to read table relationships."
                        });
                    }

                    return res.json({
                        success: true,
                        database: databaseName,
                        table: tableName,
                        columns: columns,
                        foreignKeys: foreignKeys
                    });
                }
            );
        }
    );
});

/*
 * GET /api/schema/relationships/:database
 *
 * Reads foreign-key metadata from the backend SQLite database.
 * Browser-loaded Healthcare/Banking relationships remain owned by
 * the browser SQLite engine when those datasets are used locally.
 */
router.get("/relationships/:database", function (req, res) {
    const databaseName = req.params.database;

    getAllTables(function (tableError, tables) {
        if (tableError) {
            return res.status(500).json({
                success: false,
                message: "Unable to read database tables."
            });
        }

        const relationships = [];

        if (tables.length === 0) {
            return res.json({
                success: true,
                database: databaseName,
                relationships: relationships
            });
        }

        let completed = 0;

        tables.forEach(function (table) {
            const tableName = table.name;

            db.all(
                `PRAGMA foreign_key_list("${tableName}")`,
                [],
                function (error, foreignKeys) {
                    if (error) {
                        return res.status(500).json({
                            success: false,
                            message: "Unable to read database relationships."
                        });
                    }

                    foreignKeys.forEach(function (fk) {
                        relationships.push({
                            database: databaseName,
                            fromTable: tableName,
                            fromColumn: fk.from,
                            toTable: fk.table,
                            toColumn: fk.to,
                            onUpdate: fk.on_update,
                            onDelete: fk.on_delete
                        });
                    });

                    completed++;

                    if (completed === tables.length) {
                        return res.json({
                            success: true,
                            database: databaseName,
                            relationships: relationships
                        });
                    }
                }
            );
        });
    });
});

/*
 * LEGACY COMPATIBILITY
 *
 * Keeps the previous:
 *   /api/schema/Banking/customers
 *   /api/schema/Banking/customers,accounts
 *
 * endpoint available for older callers.
 */
router.get("/:database/:tables", function (req, res) {
    const databaseName = req.params.database;

    const tableNames = req.params.tables
        .split(",")
        .map(function (table) {
            return table.trim();
        })
        .filter(Boolean);

    if (
        tableNames.length === 0 ||
        tableNames.some(function (table) {
            return !isSafeIdentifier(table);
        })
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid or missing table name."
        });
    }

    const placeholders = tableNames.map(function () {
        return "?";
    }).join(",");

    const tableSql = `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name IN (${placeholders})
        ORDER BY name
    `;

    db.all(tableSql, tableNames, function (error, tables) {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Unable to read database schema."
            });
        }

        if (tables.length === 0) {
            return res.json({
                success: true,
                database: databaseName,
                tables: []
            });
        }

        const schema = [];
        let completed = 0;

        tables.forEach(function (table) {
            const tableName = table.name;

            db.all(
                `PRAGMA table_info("${tableName}")`,
                [],
                function (columnError, columns) {
                    if (columnError) {
                        return res.status(500).json({
                            success: false,
                            message: "Unable to read table columns."
                        });
                    }

                    db.all(
                        `PRAGMA foreign_key_list("${tableName}")`,
                        [],
                        function (foreignKeyError, foreignKeys) {
                            if (foreignKeyError) {
                                return res.status(500).json({
                                    success: false,
                                    message: "Unable to read table relationships."
                                });
                            }

                            schema.push({
                                tableName: tableName,
                                columns: columns,
                                foreignKeys: foreignKeys
                            });

                            completed++;

                            if (completed === tables.length) {
                                schema.sort(function (a, b) {
                                    return a.tableName.localeCompare(b.tableName);
                                });

                                return res.json({
                                    success: true,
                                    database: databaseName,
                                    tables: schema
                                });
                            }
                        }
                    );
                }
            );
        });
    });
});

module.exports = router;

/*
 * ============================================================
 * FILE PATH: Backend/routes/schemaRoutes.js
 * ============================================================
 * PURPOSE
 * -------
 * SQL Learning Platform module.
 *
 * DOCUMENTATION
 * -------------
 * Keep this path header during future revisions. Add section
 * comments before every new major feature, state object,
 * event group, API call, or validation rule.
 *
 * Existing functionality is preserved in this documentation
 * revision.
 * ============================================================
 */

const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const db = require("../config/db");


/*
 * GET DATABASE SCHEMA
 *
 * Example:
 *
 * /api/schema/Banking/customers
 *
 * /api/schema/Banking/customers,accounts
 */

/* ============================================================
 * GET AVAILABLE PLAYGROUND DATABASES
 * ============================================================
 *
 * Playground currently supports two predefined learning
 * databases:
 *
 *     1. Banking
 *     2. Healthcare
 *
 * These databases are represented by their own schema/seed
 * files in the frontend assets:
 *
 *     frontend/assets/banking-schema.sql
 *     frontend/assets/healthcare-schema.sql
 *
 * This endpoint is used by:
 *
 *     frontend/playground/playground.js
 *
 *     GET /api/schema/databases
 *
 * The response contains the database name and the table names
 * extracted from the corresponding schema file.
 *
 * IMPORTANT
 * ----------
 * This is a read-only learning database list.
 *
 * Users cannot create/drop these Playground databases.
 * ============================================================ */

router.get("/databases", function (req, res) {

    try {

        const databaseDefinitions = [
            {
                name: "Banking",
                schemaFile: path.join(
                    __dirname,
                    "../../frontend/assets/banking-schema.sql"
                )
            },

            {
                name: "Healthcare",
                schemaFile: path.join(
                    __dirname,
                    "../../frontend/assets/healthcare-schema.sql"
                )
            }
        ];


        const databases =
            databaseDefinitions.map(
                function (database) {

                    /*
                     * Verify the schema file exists.
                     */
                    if (
                        !fs.existsSync(
                            database.schemaFile
                        )
                    ) {

                        console.warn(
                            "⚠️ Schema file not found:",
                            database.schemaFile
                        );

                        return {
                            name:
                                database.name,

                            tables:
                                []
                        };

                    }


                    /*
                     * Read the SQL schema file.
                     */
                    const schemaSql =
                        fs.readFileSync(
                            database.schemaFile,
                            "utf8"
                        );


                    /*
                     * Extract CREATE TABLE names.
                     *
                     * Supports forms such as:
                     *
                     * CREATE TABLE customers
                     * CREATE TABLE IF NOT EXISTS customers
                     */
                    const tableNames = [];


                    const createTablePattern =
                        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?([A-Za-z_][A-Za-z0-9_]*)["'`]?/gi;


                    let match;


                    while (
                        (
                            match =
                                createTablePattern.exec(
                                    schemaSql
                                )
                        ) !== null
                    ) {

                        const tableName =
                            match[1];


                        if (
                            tableName &&
                            !tableNames.includes(
                                tableName
                            )
                        ) {

                            tableNames.push(
                                tableName
                            );

                        }

                    }


                    tableNames.sort(
                        function (a, b) {

                            return a.localeCompare(
                                b
                            );

                        }
                    );


                    return {

                        name:
                            database.name,

                        tables:
                            tableNames

                    };

                }
            );


        res.json({

            success: true,

            databases:
                databases

        });

    }

    catch (error) {

        console.error(
            "❌ Failed to load Playground databases:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to load Playground databases."

        });

    }

});

router.get("/:database/:tables", function (req, res) {

    const databaseName =
        req.params.database;

    const tableNames =
        req.params.tables
            .split(",")
            .map(function (table) {
                return table.trim();
            });


    if (tableNames.length === 0) {

        return res.status(400).json({

            success: false,

            message: "No tables specified."

        });

    }


    /*
     * Currently our application uses
     * one SQLite database.
     *
     * We still accept databaseName because
     * later we can support multiple databases.
     */

    console.log(
        "Schema request:",
        databaseName,
        tableNames
    );


    const placeholders =
        tableNames
            .map(function () {
                return "?";
            })
            .join(",");


    const tableQuery = `

        SELECT
            name

        FROM sqlite_master

        WHERE type = 'table'

        AND name IN (${placeholders})

        ORDER BY name

    `;


    db.all(
        tableQuery,
        tableNames,
        function (error, tables) {

            if (error) {

                console.error(
                    "❌ Schema table lookup failed:",
                    error.message
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to read database schema."

                });

            }


            const schema = [];


            let completed =
                0;


            if (tables.length === 0) {

                return res.json({

                    success: true,

                    database: databaseName,

                    tables: []

                });

            }


            tables.forEach(
                function (table) {

                    const tableName =
                        table.name;


                    const pragmaQuery =
                        `PRAGMA table_info("${tableName}")`;


                    db.all(
                        pragmaQuery,
                        function (
                            columnError,
                            columns
                        ) {

                            if (columnError) {

                                console.error(
                                    "❌ Column lookup failed:",
                                    columnError.message
                                );

                                return res.status(500).json({

                                    success: false,

                                    message:
                                        "Unable to read table columns."

                                });

                            }


                            const foreignKeyQuery =
                                `PRAGMA foreign_key_list("${tableName}")`;


                            db.all(
                                foreignKeyQuery,
                                function (
                                    foreignKeyError,
                                    foreignKeys
                                ) {

                                    if (foreignKeyError) {

                                        console.error(
                                            "❌ Foreign key lookup failed:",
                                            foreignKeyError.message
                                        );

                                        return res.status(500).json({

                                            success: false,

                                            message:
                                                "Unable to read table relationships."

                                        });

                                    }


                                    schema.push({

                                        tableName:
                                            tableName,

                                        columns:
                                            columns,

                                        foreignKeys:
                                            foreignKeys

                                    });


                                    completed++;


                                    if (
                                        completed ===
                                        tables.length
                                    ) {

                                        schema.sort(
                                            function (a, b) {

                                                return a.tableName.localeCompare(
                                                    b.tableName
                                                );

                                            }
                                        );


                                        res.json({

                                            success: true,

                                            database:
                                                databaseName,

                                            tables:
                                                schema

                                        });

                                    }

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});


module.exports = router;

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

/*
 * ============================================================
 * FILE PATH: Backend/database/init.js
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

const fs = require("fs");
const path = require("path");

const db = require("../config/db");

const schemaPath = path.join(
    __dirname,
    "schema.sql"
);

const seedPath = path.join(
    __dirname,
    "seed.sql"
);

const schema = fs.readFileSync(
    schemaPath,
    "utf8"
);

const seed = fs.readFileSync(
    seedPath,
    "utf8"
);

db.serialize(function () {

    console.log("🔄 Initializing database...");

    db.exec(schema, function (error) {

        if (error) {

            console.error(
                "❌ Schema initialization failed:",
                error.message
            );

            return;
        }

        console.log(
            "✅ Database schema initialized"
        );

        db.exec(seed, function (error) {

            if (error) {

                console.error(
                    "❌ Seed data initialization failed:",
                    error.message
                );

                return;
            }

            console.log(
                "✅ Seed data initialized"
            );

            console.log(
                "🎉 Database setup completed successfully"
            );

        });

    });

});

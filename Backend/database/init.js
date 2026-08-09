const fs = require("fs");
const path = require("path");

const db = require("../config/db");

const schemaPath = path.join(
    __dirname,
    "schema.sql"
);

const schema = fs.readFileSync(
    schemaPath,
    "utf8"
);

db.exec(schema, function (error) {

    if (error) {

        console.error(
            "❌ Database initialization failed:",
            error.message
        );

        return;
    }

    console.log(
        "✅ Database schema initialized"
    );

});

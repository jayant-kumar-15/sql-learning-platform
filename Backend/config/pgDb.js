/*
 * ============================================================
 * FILE PATH: Backend/config/pgDb.js
 * ============================================================
 * PURPOSE
 * -------
 * PostgreSQL connection used ONLY by persistent application data:
 *
 *   - administrator accounts
 *   - administrator sessions
 *   - public feedback
 *   - anonymous traffic analytics
 *
 * IMPORTANT ARCHITECTURE RULE
 * ---------------------------
 * The existing SQLite connection in config/db.js is intentionally
 * left untouched. It continues to support the existing backend
 * SQL/schema compatibility paths.
 *
 * Playground/Challenge browser SQLite WASM is also untouched.
 *
 * DATABASE_URL must be supplied by Render from the persistent
 * PostgreSQL provider (for example, Neon). Never hard-code it.
 * ============================================================
 */

const { Pool } = require("pg");

const databaseUrl = String(
    process.env.DATABASE_URL || ""
).trim();

if (!databaseUrl) {
    throw new Error(
        "DATABASE_URL is required for the persistent PostgreSQL application database."
    );
}

/*
 * Neon provides a TLS PostgreSQL endpoint. rejectUnauthorized:false
 * keeps the connection compatible with managed cloud certificates.
 */
const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
        rejectUnauthorized: false
    },
    max: Number(process.env.PG_POOL_MAX || 5),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pool.on("error", function (error) {
    console.error(
        "❌ Persistent PostgreSQL pool error:",
        error.message
    );
});

/*
 * The existing application routes use the small callback-style
 * interface that was originally provided by sqlite3. These helper
 * methods keep those route files stable while changing only their
 * database connection from SQLite to PostgreSQL.
 */

function convertPlaceholders(sql) {
    let index = 0;

    return String(sql).replace(/\?/g, function () {
        index += 1;
        return "$" + index;
    });
}

function run(sql, params, callback) {
    const values = Array.isArray(params) ? params : [];
    const query = convertPlaceholders(sql);
    const isInsert = /^\s*INSERT\s+/i.test(query);
    const needsReturnedId =
        isInsert &&
        /\b(auth_sessions|users|feedback)\b/i.test(query) &&
        !/\bRETURNING\b/i.test(query);

    const finalQuery = needsReturnedId
        ? query.replace(/;?\s*$/, " RETURNING id")
        : query;

    pool.query(finalQuery, values, function (error, result) {
        if (error) {
            return callback.call(
                { lastID: undefined, changes: 0 },
                error
            );
        }

        const lastID =
            result.rows && result.rows[0]
                ? result.rows[0].id
                : undefined;

        return callback.call(
            {
                lastID: lastID,
                changes: result.rowCount || 0
            },
            null
        );
    });
}

function get(sql, params, callback) {
    const values = Array.isArray(params) ? params : [];

    if (typeof params === "function") {
        callback = params;
    }

    pool.query(
        convertPlaceholders(sql),
        values,
        function (error, result) {
            if (error) {
                return callback(error);
            }

            return callback(
                null,
                result.rows[0] || undefined
            );
        }
    );
}

function all(sql, params, callback) {
    const values = Array.isArray(params) ? params : [];

    if (typeof params === "function") {
        callback = params;
    }

    pool.query(
        convertPlaceholders(sql),
        values,
        function (error, result) {
            if (error) {
                return callback(error);
            }

            return callback(null, result.rows || []);
        }
    );
}

/*
 * Execute a schema/migration script. PostgreSQL accepts multiple
 * statements in a simple query when no parameter values are passed.
 */
function exec(sql, callback) {
    pool.query(String(sql), function (error) {
        if (typeof callback === "function") {
            callback(error || null);
        }
    });
}

function testConnection(callback) {
    pool.query(
        "SELECT 1 AS result",
        function (error, result) {
            if (error) {
                return callback(error);
            }

            return callback(null, result.rows[0]);
        }
    );
}

module.exports = {
    pool,
    run,
    get,
    all,
    exec,
    testConnection
};

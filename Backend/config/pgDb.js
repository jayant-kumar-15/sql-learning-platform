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
 * ============================================================
 * SQLITE-COMPATIBLE QUERY HELPERS
 * ============================================================
 *
 * Existing application routes use a small callback-style
 * interface originally provided by sqlite3.
 *
 * These helpers keep those route files stable while PostgreSQL
 * is used underneath.
 *
 * IMPORTANT:
 * The callback is OPTIONAL for run().
 *
 * Some application operations intentionally execute a statement
 * without waiting for a callback. The previous implementation
 * attempted callback.call(...) even when callback was undefined,
 * which caused the Render process to crash with:
 *
 *   TypeError: Cannot read properties of undefined (reading 'call')
 *
 * The implementation below safely handles both:
 *
 *   run(sql, params, callback)
 *
 * and:
 *
 *   run(sql, params)
 *
 * ============================================================
 */

function convertPlaceholders(sql) {
    let index = 0;

    return String(sql).replace(/\?/g, function () {
        index += 1;
        return "$" + index;
    });
}

/*
 * ------------------------------------------------------------
 * RUN
 * ------------------------------------------------------------
 * Executes INSERT / UPDATE / DELETE / other non-row queries.
 *
 * Supports:
 *
 *   run(sql, params, callback)
 *   run(sql, params)
 *   run(sql, callback)
 * ------------------------------------------------------------
 */
function run(sql, params, callback) {
    /*
     * Support sqlite-style:
     *
     *   run(sql, callback)
     */
    if (typeof params === "function") {
        callback = params;
        params = [];
    }

    const values = Array.isArray(params) ? params : [];

    /*
     * Normalize the callback.
     *
     * A callback is optional for fire-and-forget operations.
     */
    const hasCallback = typeof callback === "function";

    const query = convertPlaceholders(sql);

    /*
     * PostgreSQL does not automatically expose the inserted
     * auto-generated ID in the same way sqlite3's lastID does.
     *
     * For application tables where routes depend on lastID,
     * add RETURNING id automatically.
     */
    const isInsert = /^\s*INSERT\s+/i.test(query);

    const needsReturnedId =
        isInsert &&
        /\b(auth_sessions|users|feedback)\b/i.test(query) &&
        !/\bRETURNING\b/i.test(query);

    const finalQuery = needsReturnedId
        ? query.replace(/;?\s*$/, " RETURNING id")
        : query;

    pool.query(finalQuery, values, function (error, result) {
        /*
         * ----------------------------------------------------
         * IMPORTANT FIX
         * ----------------------------------------------------
         *
         * Never call callback.call(...) unless a callback
         * was actually supplied.
         */
        if (error) {
            if (hasCallback) {
                return callback.call(
                    {
                        lastID: undefined,
                        changes: 0
                    },
                    error
                );
            }

            /*
             * Fire-and-forget operation:
             * log the database error instead of crashing
             * the Node.js process.
             */
            console.error(
                "❌ PostgreSQL run() error:",
                error.message
            );

            return;
        }

        const lastID =
            result.rows && result.rows[0]
                ? result.rows[0].id
                : undefined;

        if (hasCallback) {
            return callback.call(
                {
                    lastID: lastID,
                    changes: result.rowCount || 0
                },
                null
            );
        }
    });
}

/*
 * ------------------------------------------------------------
 * GET
 * ------------------------------------------------------------
 * Returns one row.
 *
 * Supports:
 *
 *   get(sql, params, callback)
 *   get(sql, callback)
 * ------------------------------------------------------------
 */
function get(sql, params, callback) {
    if (typeof params === "function") {
        callback = params;
        params = [];
    }

    const values = Array.isArray(params) ? params : [];

    if (typeof callback !== "function") {
        throw new Error(
            "pgDb.get() requires a callback."
        );
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

/*
 * ------------------------------------------------------------
 * ALL
 * ------------------------------------------------------------
 * Returns all matching rows.
 *
 * Supports:
 *
 *   all(sql, params, callback)
 *   all(sql, callback)
 * ------------------------------------------------------------
 */
function all(sql, params, callback) {
    if (typeof params === "function") {
        callback = params;
        params = [];
    }

    const values = Array.isArray(params) ? params : [];

    if (typeof callback !== "function") {
        throw new Error(
            "pgDb.all() requires a callback."
        );
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
                result.rows || []
            );
        }
    );
}

/*
 * ------------------------------------------------------------
 * EXEC
 * ------------------------------------------------------------
 * Executes a schema/migration script.
 *
 * PostgreSQL accepts multiple statements in a simple query
 * when no parameter values are supplied.
 * ------------------------------------------------------------
 */
function exec(sql, callback) {
    pool.query(
        String(sql),
        function (error) {
            if (typeof callback === "function") {
                return callback(error || null);
            }

            if (error) {
                console.error(
                    "❌ PostgreSQL exec() error:",
                    error.message
                );
            }
        }
    );
}

/*
 * ------------------------------------------------------------
 * TEST CONNECTION
 * ------------------------------------------------------------
 * Used during server startup to verify that Neon/PostgreSQL
 * is reachable before the application begins serving requests.
 * ------------------------------------------------------------
 */
function testConnection(callback) {
    if (typeof callback !== "function") {
        throw new Error(
            "pgDb.testConnection() requires a callback."
        );
    }

    pool.query(
        "SELECT 1 AS result",
        function (error, result) {
            if (error) {
                return callback(error);
            }

            return callback(
                null,
                result.rows[0]
            );
        }
    );
}

/*
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
    pool,
    run,
    get,
    all,
    exec,
    testConnection
};

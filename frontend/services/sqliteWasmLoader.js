/*
 * ============================================================
 * FILE PATH: frontend/services/sqliteWasmLoader.js
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

let sqliteInstance = null;

async function initializeSQLite() {

    if (sqliteInstance) {
        return sqliteInstance;
    }

    try {

        console.log(
            "⏳ Loading SQLite WASM..."
        );

        const module =
            await import(
                "https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@3.53.0-build1/+esm"
            );

        const sqlite3 =
            await module.default();

        sqliteInstance = sqlite3;

        console.log(
            "✅ SQLite WASM loaded successfully."
        );

        console.log(
            "SQLite version:",
            sqlite3.version.libVersion
        );

        return sqlite3;

    } catch (error) {

        console.error(
            "❌ SQLite WASM initialization failed:",
            error
        );

        throw error;

    }

}

window.initializeSQLite =
    initializeSQLite;

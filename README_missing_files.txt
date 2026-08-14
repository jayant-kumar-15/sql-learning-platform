MISSING FILES — DOCUMENTATION UPDATE

Documented files:
- db_js.txt -> Backend/config/db.js
- init_js.txt -> Backend/database/init.js
- sqlEngine_js.txt -> frontend/services/sqlEngine.js
- sqliteWasmLoader_js.txt -> frontend/services/sqliteWasmLoader.js

Observed responsibilities:
- db.js: backend SQLite connection.
- init.js: reads schema.sql and seed.sql, then initializes/seeds the DB.
- sqlEngine.js: browser SQL execution with backend fallback and challenge validation.
- sqliteWasmLoader.js: loads SQLite WASM and exposes initializeSQLite globally.

No implementation logic was intentionally removed or rewritten.

const browserSqlEngine = {

    db: null,

    initialized: false,

    async initialize() {

        if (this.initialized) {
            return;
        }

        /*
         * SQLite WASM initialization will be added
         * in the next step.
         *
         * We intentionally keep this separate from
         * challenge.js so the SQL execution engine
         * can be replaced without changing the UI.
         */

        this.initialized = true;

        console.log(
            "🟢 Browser SQL engine initialized."
        );

    },

    async execute(query) {

        if (!query || typeof query !== "string") {

            throw new Error(
                "SQL query is required."
            );

        }

        await this.initialize();

        /*
         * Temporary placeholder.
         *
         * SQLite WASM execution will be connected
         * in the next step.
         */

        throw new Error(
            "Browser SQLite engine is not connected yet."
        );

    }

};

window.browserSqlEngine =
    browserSqlEngine;

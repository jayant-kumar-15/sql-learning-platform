/*
 * ============================================================
 * FILE PATH: Backend/api/server.js
 * ============================================================
 * PURPOSE
 * -------
 * Main Express API server for the SQL Learning Platform.
 *
 * IMPORTANT ARCHITECTURE NOTE
 * ---------------------------
 * The fixed Healthcare and Banking learning databases are NOT
 * initialized by this server. Playground/Challenge use browser
 * SQLite WASM and load their schema/seed files from:
 *
 * frontend/assets/
 *
 * Therefore this server must NOT depend on old backend:
 *   database/schema.sql
 *   database/seed.sql
 *
 * This backend SQLite database is for application/persistent
 * services such as authentication, feedback and analytics.
 * ============================================================
 */

const express = require("express");
const cors = require("cors");

/* ============================================================
 * BACKEND DATABASE + ROUTE MODULES
 * ============================================================
 * db.js connects to the persistent backend SQLite database.
 * queryRoutes/schemaRoutes are existing API routes and are kept.
 * They are separate from the browser SQLite used by Playground
 * and Challenge.
 * ============================================================
 */
const db = require("../config/db");
const initializeDatabase = require("../database/init");

const queryRoutes = require("../routes/queryRoutes");
const schemaRoutes = require("../routes/schemaRoutes");
const authModule = require("../routes/authRoutes");
const authRoutes = authModule.router;
const ensureInitialAdmin = authModule.ensureInitialAdmin;
const feedbackRoutes = require("../routes/feedbackRoutes");
const analyticsRoutes = require("../routes/analyticsRoutes");

const app = express();

/* ============================================================
 * CORS
 * ============================================================
 * Allows the GitHub Pages frontend to call this backend API.
 * Browser SQLite operations do NOT use this API for loading the
 * fixed Healthcare/Banking schema and seed files.
 * ============================================================
 */
const allowedCorsOrigins = [
    // Current custom-domain frontend.
    "https://sql-platform.com",

    // Optional www version of the custom domain.
    "https://www.sql-platform.com",

    // Keep the previous GitHub Pages origin working during the transition.
    "https://jayant-kumar-15.github.io"
];

const corsOptions = {
    origin: function (origin, callback) {

        // Allow requests without an Origin header (for example, health checks
        // or server-to-server requests) while enforcing the whitelist for browsers.
        if (!origin || allowedCorsOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

app.use(cors(corsOptions));

/* Browser preflight support for POST/PUT/DELETE API requests. */
app.options(/.*/, cors(corsOptions));

/* Parse JSON bodies sent by frontend API calls. */
app.use(express.json({ limit: "1mb" }));

/* ============================================================
 * EXISTING SQL API ROUTES
 * ============================================================
 * KEEPING these mounts preserves the current backend API.
 * Do not remove them when modifying authentication or analytics.
 * ============================================================
 */
app.use("/api", queryRoutes);
app.use("/api/schema", schemaRoutes);

/* ============================================================
 * APPLICATION SERVICES
 * ============================================================
 * These routes belong to persistent application functionality:
 *
 * - Authentication/session management
 * - Public feedback submission
 * - Admin feedback viewing
 * - Anonymous traffic collection
 * - Admin traffic analytics
 *
 * They do NOT replace the browser SQLite learning engine.
 * ============================================================
 */
app.use("/api", authRoutes);
app.use("/api", feedbackRoutes);
app.use("/api", analyticsRoutes);

/* ============================================================
 * HEALTH CHECK
 * ============================================================
 * Used by deployment/monitoring to confirm the API process is
 * responding. It does not execute Playground/Challenge SQL.
 * ============================================================
 */
app.get("/api/health", function (req, res) {

    res.json({
        success: true,
        message: "SQL Learning API is running"
    });

});

/* ============================================================
 * DATABASE CONNECTION TEST
 * ============================================================
 * Tests the persistent backend SQLite connection only.
 * ============================================================
 */
app.get("/api/db-test", function (req, res) {

    db.get(
        "SELECT 1 AS result",
        function (error, row) {

            if (error) {

                console.error(
                    "❌ Database test failed:",
                    error.message
                );

                return res.status(500).json({
                    success: false,
                    message: "Database connection failed"
                });
            }

            res.json({
                success: true,
                message: "Database connection successful",
                result: row.result
            });

        }
    );

});

/* ============================================================
 * LEGACY DATA TEST ENDPOINT
 * ============================================================
 * This endpoint is retained so existing integrations do not
 * unexpectedly break. It is NOT used by the browser SQLite
 * Playground/Challenge engine.
 *
 * NOTE: Its SQL references the older backend learning schema.
 * It should be considered a diagnostic endpoint only until its
 * query is explicitly migrated to the current Banking schema.
 * ============================================================
 */
app.get("/api/data-test", function (req, res) {

    const query = `
        SELECT
            c.customer_name,
            a.balance
        FROM customers c
        JOIN accounts a
            ON c.customer_id = a.customer_id
        WHERE a.balance > 50000
        ORDER BY a.balance DESC
    `;

    db.all(
        query,
        function (error, rows) {

            if (error) {

                console.error(
                    "❌ Legacy data test failed:",
                    error.message
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to read legacy test data"
                });
            }

            res.json({
                success: true,
                rows: rows
            });

        }
    );

});

/* ============================================================
 * SERVER STARTUP
 * ============================================================
 * init.js now initializes ONLY backend application tables such
 * as authentication, sessions, feedback and analytics.
 *
 * Healthcare/Banking schema and seed loading remains in the
 * browser SQLite engine used by Playground/Challenge.
 * ============================================================
 */
const PORT = process.env.PORT || 10000;

initializeDatabase(function (error) {

    if (error) {

        console.error(
            "❌ Server startup aborted because application database initialization failed."
        );

        process.exit(1);
    }

    /*
     * Private admin bootstrap. The credentials come only from
     * Render/server environment variables; no public signup UI is
     * exposed on the learning platform.
     */
    ensureInitialAdmin(function (adminError) {

        if (adminError) {

            console.error(
                "❌ Initial administrator bootstrap failed:",
                adminError.message
            );

            process.exit(1);
        }

        app.listen(
            PORT,
            "0.0.0.0",
            function () {

                console.log(
                    `🚀 Server running on port ${PORT}`
                );

            }
        );

    });

});

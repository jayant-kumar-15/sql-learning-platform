/*
 * ============================================================
 * FILE PATH: Backend/routes/analyticsRoutes.js
 * ============================================================
 * PURPOSE
 * -------
 * Anonymous traffic collection plus protected administrator
 * analytics, backed by persistent PostgreSQL.
 *
 * IMPORTANT TRAFFIC RULE
 * ----------------------
 * Every genuine page load creates one traffic_events row.
 * Heartbeats update live presence only and NEVER create another
 * historical page visit.
 *
 * Therefore:
 *   Page Visits   = total genuine page loads
 *   Unique Users  = distinct anonymous browser sessions
 *   Live Visitors = sessions seen within the live window
 *
 * The existing frontend tracker, public learning pages and admin
 * dashboard remain otherwise unchanged.
 * ============================================================
 */

const express = require("express");
const crypto = require("crypto");
const db = require("../config/pgDb");
const { requireAdmin } = require("./authRoutes");

const router = express.Router();

const LIVE_WINDOW_SECONDS = 90;

/* ============================================================
 * LIVE PRESENCE TABLE
 * ============================================================ */

function ensureRealtimeTable(callback) {
    db.run(`
        CREATE TABLE IF NOT EXISTS analytics_sessions (
            session_hash TEXT PRIMARY KEY,
            page_path TEXT,
            page_title TEXT,
            last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `, function (error) {
        if (error) return callback(error);

        db.run(`
            CREATE INDEX IF NOT EXISTS idx_analytics_sessions_last_seen
            ON analytics_sessions(last_seen_at)
        `, callback);
    });
}

function cleanText(value, maxLength) {
    return String(value || "")
        .trim()
        .slice(0, maxLength);
}

function getToday() {
    return new Date().toISOString().slice(0, 10);
}

/* ============================================================
 * PUBLIC TRAFFIC COLLECTION
 * ============================================================ */

router.post(
    "/analytics/track",
    function (req, res) {
        const sessionId = cleanText(req.body.sessionId, 200);
        const pagePath = cleanText(req.body.pagePath, 300) || "/";
        const pageTitle = cleanText(req.body.pageTitle, 200);
        const referrer = cleanText(req.body.referrer, 500);

        /*
         * true = genuine page load
         * false = heartbeat for live presence
         */
        const trackHistory = req.body.trackHistory !== false;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Traffic session is required."
            });
        }

        const sessionHash = crypto
            .createHash("sha256")
            .update(sessionId)
            .digest("hex");

        const visitDate = getToday();

        function updatePresence() {
            db.run(
                `
                INSERT INTO analytics_sessions
                    (session_hash, page_path, page_title, last_seen_at)
                VALUES
                    (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT (session_hash) DO UPDATE SET
                    page_path = EXCLUDED.page_path,
                    page_title = EXCLUDED.page_title,
                    last_seen_at = CURRENT_TIMESTAMP
                `,
                [sessionHash, pagePath, pageTitle],
                function (presenceError) {
                    if (presenceError) {
                        console.error(
                            "Realtime traffic tracking failed:",
                            presenceError.message
                        );
                    }

                    return res.status(204).end();
                }
            );
        }

        /*
         * Heartbeat: update live presence only.
         */
        if (!trackHistory) {
            return updatePresence();
        }

        /*
         * Genuine page load: ALWAYS record one historical visit.
         * There is deliberately NO unique session/page/day constraint.
         */
        db.run(
            `
            INSERT INTO traffic_events (
                session_hash,
                page_path,
                page_title,
                referrer,
                visit_date
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                sessionHash,
                pagePath,
                pageTitle,
                referrer || null,
                visitDate
            ],
            function (error) {
                if (error) {
                    console.error(
                        "Traffic tracking failed:",
                        error.message
                    );

                    /* Analytics must never break the public website. */
                    return res.status(204).end();
                }

                return updatePresence();
            }
        );
    }
);

/* ============================================================
 * ADMIN ANALYTICS
 * ============================================================ */

router.get(
    "/admin/analytics",
    requireAdmin,
    function (req, res) {
        const allowedRanges = new Set([
            "30d",
            "12w",
            "12m",
            "5y"
        ]);

        const range = allowedRanges.has(req.query.range)
            ? req.query.range
            : "30d";

        let startExpression;
        let groupExpression;
        let labelExpression;
        let orderExpression;

        if (range === "12w") {
            startExpression = "CURRENT_DATE - INTERVAL '83 days'";
            groupExpression = "to_char(visit_date, 'IYYY-IW')";
            labelExpression = "to_char(visit_date, 'IYYY-\"W\"IW')";
            orderExpression = "MIN(visit_date)";
        } else if (range === "12m") {
            startExpression = "date_trunc('month', CURRENT_DATE - INTERVAL '11 months')::date";
            groupExpression = "to_char(visit_date, 'YYYY-MM')";
            labelExpression = "to_char(visit_date, 'YYYY-MM')";
            orderExpression = "MIN(visit_date)";
        } else if (range === "5y") {
            startExpression = "date_trunc('year', CURRENT_DATE - INTERVAL '4 years')::date";
            groupExpression = "to_char(visit_date, 'YYYY')";
            labelExpression = "to_char(visit_date, 'YYYY')";
            orderExpression = "MIN(visit_date)";
        } else {
            startExpression = "CURRENT_DATE - INTERVAL '29 days'";
            groupExpression = "visit_date";
            labelExpression = "visit_date::text";
            orderExpression = "visit_date";
        }

        const seriesSql = `
            SELECT
                ${labelExpression} AS label,
                COUNT(*)::integer AS page_visits,
                COUNT(DISTINCT session_hash)::integer AS unique_sessions
            FROM traffic_events
            WHERE visit_date >= ${startExpression}
            GROUP BY ${groupExpression}
            ORDER BY ${orderExpression} ASC
        `;

        const pageSql = `
            SELECT
                page_path,
                COUNT(*)::integer AS visits,
                COUNT(DISTINCT session_hash)::integer AS unique_sessions
            FROM traffic_events
            WHERE visit_date >= CURRENT_DATE - INTERVAL '29 days'
            GROUP BY page_path
            ORDER BY visits DESC
            LIMIT 10
        `;

        const totalsSql = `
            SELECT
                COUNT(*)::integer AS page_visits,
                COUNT(DISTINCT session_hash)::integer AS unique_sessions,
                COUNT(DISTINCT visit_date)::integer AS active_days
            FROM traffic_events
            WHERE visit_date >= CURRENT_DATE - INTERVAL '29 days'
        `;

        const liveSql = `
            SELECT COUNT(*)::integer AS live_visitors
            FROM analytics_sessions
            WHERE last_seen_at >= CURRENT_TIMESTAMP - INTERVAL '90 seconds'
        `;

        db.all(seriesSql, [], function (seriesError, seriesRows) {
            if (seriesError) {
                console.error("Analytics series failed:", seriesError.message);
                return res.status(500).json({
                    success: false,
                    message: "Unable to load traffic analytics."
                });
            }

            db.all(pageSql, [], function (pageError, pageRows) {
                if (pageError) {
                    return res.status(500).json({
                        success: false,
                        message: "Unable to load page analytics."
                    });
                }

                db.get(totalsSql, [], function (totalError, totals) {
                    if (totalError) {
                        return res.status(500).json({
                            success: false,
                            message: "Unable to load traffic totals."
                        });
                    }

                    db.get(liveSql, [], function (liveError, liveRow) {
                        if (liveError) {
                            return res.status(500).json({
                                success: false,
                                message: "Unable to load live traffic."
                            });
                        }

                        return res.json({
                            success: true,
                            range,
                            liveVisitors: Number(
                                liveRow?.live_visitors || 0
                            ),
                            liveWindowSeconds: LIVE_WINDOW_SECONDS,
                            totals: totals || {
                                page_visits: 0,
                                unique_sessions: 0,
                                active_days: 0
                            },
                            series: seriesRows || [],
                            popularPages: pageRows || []
                        });
                    });
                });
            });
        });
    }
);

/* ============================================================
 * ADMIN TRAFFIC CLEANUP
 * ============================================================ */

router.delete(
    "/admin/analytics/cleanup",
    requireAdmin,
    function (req, res) {
        const months = Number(req.query.months);
        const from = String(req.query.from || "").trim();
        const to = String(req.query.to || "").trim();

        let sql;
        let params;

        if (from || to) {
            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
                !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
                from > to
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid cleanup date range."
                });
            }

            sql = `
                DELETE FROM traffic_events
                WHERE visit_date >= ?::date
                  AND visit_date <= ?::date
            `;
            params = [from, to];
        } else if (
            Number.isInteger(months) &&
            months >= 1 &&
            months <= 120
        ) {
            sql = `
                DELETE FROM traffic_events
                WHERE visit_date < CURRENT_DATE - (? * INTERVAL '1 month')
            `;
            params = [months];
        } else {
            return res.status(400).json({
                success: false,
                message: "Choose a cleanup period between 1 and 120 months."
            });
        }

        db.run(sql, params, function (error) {
            if (error) {
                console.error("Traffic cleanup failed:", error.message);
                return res.status(500).json({
                    success: false,
                    message: "Unable to delete traffic data."
                });
            }

            const deleted = this.changes || 0;

            return res.json({
                success: true,
                deleted,
                message: `${deleted} traffic record(s) deleted.`
            });
        });
    }
);

module.exports = router;
module.exports.router = router;
module.exports.ensureRealtimeTable = ensureRealtimeTable;

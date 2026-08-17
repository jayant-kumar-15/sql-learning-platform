/*
 * ============================================================
 * FILE PATH: Backend/routes/analyticsRoutes.js
 * ============================================================
 * PURPOSE
 * -------
 * Anonymous traffic collection plus protected admin analytics.
 *
 * PUBLIC
 * ------
 * POST /api/analytics/track
 *
 * ADMIN
 * -----
 * GET /api/admin/analytics?range=30d
 *
 * RANGE OPTIONS
 * -------------
 * 30d  -> daily traffic for the last 30 days
 * 12w  -> weekly traffic for the last 12 weeks
 * 12m  -> monthly traffic for the last 12 months
 * 5y   -> yearly traffic for the last 5 years
 *
 * The database remains the source of truth. The dashboard requests
 * whichever aggregation it needs, rather than maintaining four
 * duplicate counters.
 * ============================================================
 */

const express = require("express");
const crypto = require("crypto");
const db = require("../config/db");
const { requireAdmin } = require("./authRoutes");

const router = express.Router();


function cleanText(value, maxLength) {
    return String(value || "")
        .trim()
        .slice(0, maxLength);
}


function getToday() {
    return new Date()
        .toISOString()
        .slice(0, 10);
}


/* ============================================================
 * PUBLIC TRAFFIC COLLECTION
 * ============================================================ */

router.post(
    "/analytics/track",
    function (req, res) {

        const sessionId = cleanText(
            req.body.sessionId,
            200
        );

        const pagePath = cleanText(
            req.body.pagePath,
            300
        ) || "/";

        const pageTitle = cleanText(
            req.body.pageTitle,
            200
        );

        const referrer = cleanText(
            req.body.referrer,
            500
        );

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

        db.run(
            `
            INSERT OR IGNORE INTO traffic_events (
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
                referrer,
                visitDate
            ],
            function (error) {

                if (error) {
                    console.error(
                        "Traffic tracking failed:",
                        error.message
                    );

                    // Analytics should never make the public website fail.
                    return res.status(204).end();
                }

                return res.status(204).end();
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
            startExpression = "date('now', '-83 days')";
            groupExpression = "strftime('%Y-%W', visit_date)";
            labelExpression = "strftime('%Y-W%W', visit_date)";
            orderExpression = "MIN(visit_date)";
        } else if (range === "12m") {
            startExpression = "date('now', '-11 months', 'start of month')";
            groupExpression = "strftime('%Y-%m', visit_date)";
            labelExpression = "strftime('%Y-%m', visit_date)";
            orderExpression = "MIN(visit_date)";
        } else if (range === "5y") {
            startExpression = "date('now', '-4 years', 'start of year')";
            groupExpression = "strftime('%Y', visit_date)";
            labelExpression = "strftime('%Y', visit_date)";
            orderExpression = "MIN(visit_date)";
        } else {
            startExpression = "date('now', '-29 days')";
            groupExpression = "visit_date";
            labelExpression = "visit_date";
            orderExpression = "visit_date";
        }

        const seriesSql = `
            SELECT
                ${labelExpression} AS label,
                COUNT(*) AS page_visits,
                COUNT(DISTINCT session_hash) AS unique_sessions
            FROM traffic_events
            WHERE visit_date >= ${startExpression}
            GROUP BY ${groupExpression}
            ORDER BY ${orderExpression} ASC
        `;

        const pageSql = `
            SELECT
                page_path,
                COUNT(*) AS visits,
                COUNT(DISTINCT session_hash) AS unique_sessions
            FROM traffic_events
            WHERE visit_date >= date('now', '-29 days')
            GROUP BY page_path
            ORDER BY visits DESC
            LIMIT 10
        `;

        const totalsSql = `
            SELECT
                COUNT(*) AS page_visits,
                COUNT(DISTINCT session_hash) AS unique_sessions,
                COUNT(DISTINCT visit_date) AS active_days
            FROM traffic_events
            WHERE visit_date >= date('now', '-29 days')
        `;

        db.all(
            seriesSql,
            [],
            function (seriesError, seriesRows) {

                if (seriesError) {
                    console.error(
                        "Analytics series failed:",
                        seriesError.message
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Unable to load traffic analytics."
                    });
                }

                db.all(
                    pageSql,
                    [],
                    function (pageError, pageRows) {

                        if (pageError) {
                            return res.status(500).json({
                                success: false,
                                message: "Unable to load page analytics."
                            });
                        }

                        db.get(
                            totalsSql,
                            [],
                            function (totalError, totals) {

                                if (totalError) {
                                    return res.status(500).json({
                                        success: false,
                                        message: "Unable to load traffic totals."
                                    });
                                }

                                return res.json({
                                    success: true,
                                    range,
                                    totals: totals || {
                                        page_visits: 0,
                                        unique_sessions: 0,
                                        active_days: 0
                                    },
                                    series: seriesRows || [],
                                    popularPages: pageRows || []
                                });
                            }
                        );
                    }
                );
            }
        );
    }
);


module.exports = router;

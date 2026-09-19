/*
 * ============================================================
 * FILE PATH: Backend/routes/analyticsRoutes.js
 * ============================================================
 * PURPOSE
 * -------
 * Anonymous traffic collection plus protected admin analytics.
 *
 * RANGE OPTIONS
 * -------------
 * 30d -> daily traffic for the last 30 days
 * 12w -> weekly traffic for the last 12 weeks
 * 12m -> monthly traffic for the last 12 months
 * 5y  -> yearly traffic for the last 5 years
 *
 * WEEKLY FIX
 * ----------
 * Weekly traffic is grouped using the Monday date of each week.
 * This prevents a daily-shaped series from being returned for the
 * 12w request.
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

        let seriesSql;

        /*
         * IMPORTANT:
         * Weekly uses an explicit Monday week-start date.
         *
         * SQLite strftime('%w', visit_date):
         *   Sunday = 0
         *   Monday = 1
         *   ...
         *   Saturday = 6
         *
         * ((weekday + 6) % 7) therefore gives the number of days
         * since Monday. Subtracting that value gives the Monday
         * date for every traffic event.
         */
        if (range === "12w") {

            seriesSql = `
                SELECT
                    strftime(
                        '%Y-W%W',
                        date(
                            visit_date,
                            '-' ||
                            (
                                (
                                    CAST(
                                        strftime('%w', visit_date)
                                        AS INTEGER
                                    ) + 6
                                ) % 7
                            ) ||
                            ' days'
                        )
                    ) AS label,

                    COUNT(*) AS page_visits,

                    COUNT(
                        DISTINCT session_hash
                    ) AS unique_sessions

                FROM traffic_events

                WHERE visit_date >= date(
                    'now',
                    '-83 days'
                )

                GROUP BY
                    date(
                        visit_date,
                        '-' ||
                        (
                            (
                                CAST(
                                    strftime('%w', visit_date)
                                    AS INTEGER
                                ) + 6
                            ) % 7
                        ) ||
                        ' days'
                    )

                ORDER BY
                    date(
                        visit_date,
                        '-' ||
                        (
                            (
                                CAST(
                                    strftime('%w', visit_date)
                                    AS INTEGER
                                ) + 6
                            ) % 7
                        ) ||
                        ' days'
                    ) ASC
            `;

        } else if (range === "12m") {

            seriesSql = `
                SELECT
                    strftime(
                        '%Y-%m',
                        visit_date
                    ) AS label,

                    COUNT(*) AS page_visits,

                    COUNT(
                        DISTINCT session_hash
                    ) AS unique_sessions

                FROM traffic_events

                WHERE visit_date >= date(
                    'now',
                    '-11 months',
                    'start of month'
                )

                GROUP BY
                    strftime(
                        '%Y-%m',
                        visit_date
                    )

                ORDER BY
                    MIN(visit_date) ASC
            `;

        } else if (range === "5y") {

            seriesSql = `
                SELECT
                    strftime(
                        '%Y',
                        visit_date
                    ) AS label,

                    COUNT(*) AS page_visits,

                    COUNT(
                        DISTINCT session_hash
                    ) AS unique_sessions

                FROM traffic_events

                WHERE visit_date >= date(
                    'now',
                    '-4 years',
                    'start of year'
                )

                GROUP BY
                    strftime(
                        '%Y',
                        visit_date
                    )

                ORDER BY
                    MIN(visit_date) ASC
            `;

        } else {

            seriesSql = `
                SELECT
                    visit_date AS label,

                    COUNT(*) AS page_visits,

                    COUNT(
                        DISTINCT session_hash
                    ) AS unique_sessions

                FROM traffic_events

                WHERE visit_date >= date(
                    'now',
                    '-29 days'
                )

                GROUP BY
                    visit_date

                ORDER BY
                    visit_date ASC
            `;
        }


        const pageSql = `
            SELECT
                page_path,
                COUNT(*) AS visits,
                COUNT(
                    DISTINCT session_hash
                ) AS unique_sessions
            FROM traffic_events
            WHERE visit_date >= date(
                'now',
                '-29 days'
            )
            GROUP BY page_path
            ORDER BY visits DESC
            LIMIT 10
        `;


        const totalsSql = `
            SELECT
                COUNT(*) AS page_visits,
                COUNT(
                    DISTINCT session_hash
                ) AS unique_sessions,
                COUNT(
                    DISTINCT visit_date
                ) AS active_days
            FROM traffic_events
            WHERE visit_date >= date(
                'now',
                '-29 days'
            )
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
                        message:
                            "Unable to load traffic analytics."
                    });
                }

                db.all(
                    pageSql,
                    [],
                    function (pageError, pageRows) {

                        if (pageError) {
                            return res.status(500).json({
                                success: false,
                                message:
                                    "Unable to load page analytics."
                            });
                        }

                        db.get(
                            totalsSql,
                            [],
                            function (
                                totalError,
                                totals
                            ) {

                                if (totalError) {
                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            "Unable to load traffic totals."
                                    });
                                }

                                return res.json({
                                    success: true,
                                    range: range,
                                    totals:
                                        totals || {
                                            page_visits: 0,
                                            unique_sessions: 0,
                                            active_days: 0
                                        },
                                    series:
                                        seriesRows || [],
                                    popularPages:
                                        pageRows || []
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

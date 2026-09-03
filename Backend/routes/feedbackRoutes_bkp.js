/*
 * ============================================================
 * FILE PATH: Backend/routes/feedbackRoutes.js
 * ============================================================
 * PURPOSE
 * -------
 * Stores public Appreciation / Feedback / Other Query messages
 * in the central SQLite database.
 *
 * PUBLIC ENDPOINT
 * ---------------
 * POST /api/feedback
 *
 * ADMIN ENDPOINT
 * --------------
 * GET /api/admin/feedback
 *
 * ============================================================
 */

const express =
    require("express");

const db =
    require("../config/db");

const {
    requireAdmin,
    requireAuth
} =
    require("./authRoutes");

const router =
    express.Router();


const ALLOWED_CATEGORIES =
    new Set([
        "appreciation",
        "feedback",
        "query"
    ]);


/* ============================================================
 * PUBLIC FEEDBACK SUBMISSION
 * ============================================================ */

router.post(
    "/feedback",
    function (req, res) {

        const category =
            String(
                req.body.category || ""
            ).trim();

        const name =
            String(
                req.body.name || ""
            ).trim();

        const email =
            String(
                req.body.email || ""
            ).trim();

        const message =
            String(
                req.body.message || ""
            ).trim();


        if (
            !ALLOWED_CATEGORIES.has(
                category
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please select a valid message category."
            });

        }


        if (!message) {

            return res.status(400).json({
                success: false,
                message:
                    "Message cannot be empty."
            });

        }


        if (
            message.length >
            2000
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Message is too long."
            });

        }


        /*
         * Authentication is optional.
         *
         * If the visitor is logged in, we associate the feedback
         * with the account. Otherwise user_id remains NULL.
         */

        let userId = null;


        /*
         * The current public form does not require login.
         * To avoid duplicating authentication logic here, we first
         * store the message anonymously and can associate it later
         * through the authenticated UI.
         *
         * This preserves public feedback submission.
         */


        db.run(
            `
            INSERT INTO feedback
                (
                    user_id,
                    category,
                    name,
                    email,
                    message
                )
            VALUES
                (?, ?, ?, ?, ?)
            `,
            [
                userId,
                category,
                name || null,
                email || null,
                message
            ],
            function (error) {

                if (error) {

                    console.error(
                        "Feedback insert failed:",
                        error.message
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to save your message."
                    });

                }


                res.status(201).json({
                    success: true,
                    message:
                        "Your message has been received.",
                    id:
                        this.lastID
                });

            }
        );

    }
);


/* ============================================================
 * ADMIN FEEDBACK LIST
 * ============================================================ */

router.get(
    "/admin/feedback",
    requireAdmin,
    function (req, res) {

        const limit =
            Math.min(
                Math.max(
                    Number(
                        req.query.limit
                    ) || 50,
                    1
                ),
                200
            );


        db.all(
            `
            SELECT
                id,
                user_id,
                category,
                name,
                email,
                message,
                status,
                created_at
            FROM feedback
            ORDER BY
                created_at DESC
            LIMIT ?
            `,
            [limit],
            function (
                error,
                rows
            ) {

                if (error) {

                    console.error(
                        "Admin feedback lookup failed:",
                        error.message
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to load feedback."
                    });

                }


                res.json({
                    success: true,
                    rows
                });

            }
        );

    }
);


/* ============================================================
 * ADMIN MARK FEEDBACK STATUS
 * ============================================================ */

router.patch(
    "/admin/feedback/:id",
    requireAdmin,
    function (req, res) {

        const status =
            String(
                req.body.status || ""
            ).trim();

        const allowedStatuses =
            new Set([
                "new",
                "read",
                "resolved"
            ]);


        if (
            !allowedStatuses.has(
                status
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid feedback status."
            });

        }


        db.run(
            `
            UPDATE feedback
            SET status = ?
            WHERE id = ?
            `,
            [
                status,
                req.params.id
            ],
            function (error) {

                if (error) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to update feedback status."
                    });

                }


                if (
                    this.changes === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Feedback entry not found."
                    });

                }


                res.json({
                    success: true,
                    message:
                        "Feedback status updated."
                });

            }
        );

    }
);


module.exports =
    router;

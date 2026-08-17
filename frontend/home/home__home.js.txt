/*
 * ============================================================
 * SQL LEARNING PLATFORM — HOMEPAGE JAVASCRIPT
 * ============================================================
 * Responsibilities:
 * 1. Mobile navigation
 * 2. Temporary active-learner presentation count
 * 3. Footer year
 * 4. Appreciation / Feedback / Other Query form
 *
 * Revision-sensitive logic is intentionally kept in separate
 * functions so future backend integration does not require
 * rewriting the homepage.
 * ============================================================
 */

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        setupMobileNavigation();
        setupLearnerCount();
        setupCurrentYear();
        setupFeedbackForm();
    });

    /* ============================================================
       MOBILE NAVIGATION
       ============================================================ */
    function setupMobileNavigation() {
        const button = document.getElementById("mobileMenuButton");
        const navigation = document.getElementById("mainNavigation");

        if (!button || !navigation) {
            return;
        }

        button.addEventListener("click", function () {
            const isOpen = navigation.classList.toggle("open");

            button.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });

        navigation.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                navigation.classList.remove("open");
                button.setAttribute("aria-expanded", "false");
            });
        });
    }

    /* ============================================================
       TEMPORARY ACTIVE LEARNER DISPLAY
       ============================================================
       This is intentionally a presentation metric for V1.
       It does NOT represent real concurrent users.

       The range can be changed from learner-count.js without
       modifying the homepage logic.
       ============================================================ */
    function setupLearnerCount() {
        const element = document.getElementById("activeLearnerCount");

        if (!element) {
            return;
        }

        const config = window.SQL_HOME_LEARNER_CONFIG || {
            minimum: 20,
            maximum: 200,
            refreshMinutes: 8
        };

        const minimum = Number(config.minimum) || 20;
        const maximum = Number(config.maximum) || 200;
        const refreshMinutes = Number(config.refreshMinutes) || 8;

        function renderCount() {
            const count =
                Math.floor(
                    Math.random() * (maximum - minimum + 1)
                ) + minimum;

            element.textContent = count + "+";
        }

        renderCount();

        window.setInterval(
            renderCount,
            refreshMinutes * 60 * 1000
        );
    }

    /* ============================================================
       CURRENT YEAR
       ============================================================ */
    function setupCurrentYear() {
        const yearElement = document.getElementById("currentYear");

        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }

    /* ============================================================
       APPRECIATION / FEEDBACK / OTHER QUERY FORM
       ============================================================
       Categories:
       - appreciation
       - feedback
       - query

       V1 fallback:
       If no backend endpoint is configured, submissions are stored
       in browser localStorage for development only.

       Production:
       Replace the fallback with your backend endpoint so the
       administrator can see submissions centrally.
       ============================================================ */
    function setupFeedbackForm() {
        const form = document.getElementById("feedbackForm");
        const status = document.getElementById("feedbackStatus");

        if (!form || !status) {
            return;
        }

        form.addEventListener("submit", async function (event) {
            event.preventDefault();

            const formData = new FormData(form);

            const submission = {
                category: String(
                    formData.get("category") || "feedback"
                ),
                name: String(
                    formData.get("name") || ""
                ).trim(),
                email: String(
                    formData.get("email") || ""
                ).trim(),
                message: String(
                    formData.get("message") || ""
                ).trim(),
                createdAt: new Date().toISOString()
            };

            if (!submission.message) {
                status.textContent = "Please enter a message.";
                return;
            }

            status.textContent = "Sending...";

            try {
                /*
                 * Future backend integration:
                 *
                 * window.SQL_HOME_FEEDBACK_ENDPOINT =
                 *     "https://your-api.example.com/api/feedback";
                 *
                 * The same submission object can then be POSTed
                 * to the backend/database.
                 */
                const endpoint =
                    window.SQL_HOME_FEEDBACK_ENDPOINT;

                if (endpoint) {
                    const response = await fetch(endpoint, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(submission)
                    });

                    if (!response.ok) {
                        throw new Error(
                            "Feedback API returned HTTP " +
                            response.status
                        );
                    }
                } else {
                    /*
                     * Development-only fallback.
                     * This does not provide central admin visibility.
                     */
                    const previous =
                        JSON.parse(
                            localStorage.getItem(
                                "sqlLearningFeedback"
                            ) || "[]"
                        );

                    previous.push(submission);

                    localStorage.setItem(
                        "sqlLearningFeedback",
                        JSON.stringify(previous)
                    );
                }

                status.textContent =
                    "Thank you! Your message has been received.";

                form.reset();

            } catch (error) {
                console.error(
                    "Feedback submission failed:",
                    error
                );

                status.textContent =
                    "Unable to send right now. Please try again.";
            }
        });
    }
})();

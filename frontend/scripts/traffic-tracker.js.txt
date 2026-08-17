/*
 * ============================================================
 * SQL LEARNING PLATFORM — ANONYMOUS TRAFFIC TRACKER
 * ============================================================
 *
 * FILE
 * ----
 * frontend/scripts/traffic-tracker.js
 *
 * PURPOSE
 * -------
 * Sends a lightweight anonymous page-view event to the backend.
 *
 * This is REAL TRAFFIC ANALYTICS and is separate from the
 * homepage's temporary "20–200 Active learners" presentation
 * number.
 *
 * PRIVACY / DATA MINIMIZATION
 * ---------------------------
 * We intentionally send only basic page/session information:
 *   - page path
 *   - referrer
 *   - screen dimensions
 *   - timezone
 *
 * No login is required.
 * No SQL query is sent.
 * No password or authentication token is sent.
 *
 * BACKEND API
 * -----------
 * POST /api/analytics/track
 *
 * If the analytics endpoint is temporarily unavailable, the
 * homepage remains fully functional. Analytics must never block
 * learning.
 * ============================================================
 */

(function () {

    "use strict";


    const API_BASE_URL =
        "https://sql-learning-platform-5fu8.onrender.com";


    const ANALYTICS_ENDPOINT =
        API_BASE_URL +
        "/api/analytics/track";


    function sendPageView() {

        const payload = {

            pagePath:
                window.location.pathname,

            pageTitle:
                document.title,

            referrer:
                document.referrer || "",

            screenWidth:
                window.screen
                    ? window.screen.width
                    : null,

            screenHeight:
                window.screen
                    ? window.screen.height
                    : null,

            timezone:
                Intl.DateTimeFormat()
                    .resolvedOptions()
                    .timeZone ||
                ""

        };


        /*
         * Use sendBeacon when available so navigation away from the
         * page does not cancel the analytics request.
         */
        try {

            if (
                navigator.sendBeacon
            ) {

                const body =
                    new Blob(
                        [
                            JSON.stringify(
                                payload
                            )
                        ],
                        {
                            type:
                                "application/json"
                        }
                    );


                const queued =
                    navigator.sendBeacon(
                        ANALYTICS_ENDPOINT,
                        body
                    );


                if (queued) {
                    return;
                }

            }

        } catch (error) {

            /*
             * Analytics must never break the homepage.
             */

        }


        /*
         * Fallback for browsers where sendBeacon is unavailable
         * or rejected.
         */
        fetch(
            ANALYTICS_ENDPOINT,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        payload
                    ),

                keepalive:
                    true
            }
        )
        .catch(
            function (error) {

                console.debug(
                    "Traffic analytics unavailable:",
                    error
                );

            }
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            sendPageView,
            {
                once: true
            }
        );

    } else {

        sendPageView();

    }

})();

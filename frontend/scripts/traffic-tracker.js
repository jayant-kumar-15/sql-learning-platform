/*
 * ============================================================
 * SQL LEARNING PLATFORM — ANONYMOUS TRAFFIC TRACKER
 * ============================================================
 *
 * PURPOSE
 * -------
 * Sends one lightweight anonymous page-view event to the backend.
 *
 * IMPORTANT FIX
 * -------------
 * The backend requires `sessionId` for every analytics event.
 * The previous version did not send it, which caused:
 *
 *     POST /api/analytics/track -> 400 Bad Request
 *     "Traffic session is required."
 *
 * This version creates/reuses a random anonymous browser session ID
 * and includes it in the payload. No login, name, email, SQL query,
 * or other identifying information is collected.
 * ============================================================
 */

(function () {
    "use strict";

    const API_BASE_URL =
        "https://sql-learning-platform-5fu8.onrender.com";

    const ANALYTICS_ENDPOINT =
        API_BASE_URL + "/api/analytics/track";

    /*
     * Keep one anonymous session ID for this browser.
     * It is intentionally not tied to a user account.
     */
    const SESSION_STORAGE_KEY =
        "sql_learning_analytics_session";

    /* Backend considers sessions live for 90 seconds. */
    const HEARTBEAT_MS = 30000;

    function getSessionId() {
        try {
            const existing =
                window.localStorage.getItem(SESSION_STORAGE_KEY);

            if (existing) {
                return existing;
            }

            let sessionId = "";

            if (
                window.crypto &&
                typeof window.crypto.randomUUID === "function"
            ) {
                sessionId = window.crypto.randomUUID();
            } else if (
                window.crypto &&
                typeof window.crypto.getRandomValues === "function"
            ) {
                const bytes = new Uint8Array(16);
                window.crypto.getRandomValues(bytes);

                sessionId = Array.from(bytes)
                    .map(function (byte) {
                        return byte.toString(16).padStart(2, "0");
                    })
                    .join("");
            } else {
                sessionId =
                    Date.now().toString(36) +
                    "-" +
                    Math.random().toString(36).slice(2) +
                    "-" +
                    Math.random().toString(36).slice(2);
            }

            window.localStorage.setItem(
                SESSION_STORAGE_KEY,
                sessionId
            );

            return sessionId;
        } catch (error) {
            /*
             * localStorage can be unavailable in some privacy modes.
             * A temporary ID is still enough for the current page view.
             */
            return (
                Date.now().toString(36) +
                "-" +
                Math.random().toString(36).slice(2)
            );
        }
    }

    /*
     * `trackHistory=true` is sent only once when the page opens.
     * Heartbeats update realtime presence but do not create another
     * historical page-view row every 30 seconds.
     */
    function sendPageView(trackHistory) {
        const sessionId = getSessionId();

        const payload = {
            sessionId: sessionId,

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
                "",

            /*
             * Backend uses this flag to distinguish a real page load
             * from the 30-second presence heartbeat.
             */
            trackHistory: trackHistory === true
        };

        /*
         * Use sendBeacon when available so navigation away from the
         * page does not cancel the analytics request.
         */
        try {
            if (navigator.sendBeacon) {
                const body =
                    new Blob(
                        [JSON.stringify(payload)],
                        {
                            type: "application/json"
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
            /* Analytics must never break the website. */
        }

        /*
         * Fallback for browsers where sendBeacon is unavailable
         * or cannot queue the request.
         */
        fetch(
            ANALYTICS_ENDPOINT,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
                keepalive: true
            }
        ).catch(function (error) {
            console.debug(
                "Traffic analytics unavailable:",
                error
            );
        });
    }

    function startTracking() {
        /* Count this page load once in historical traffic. */
        sendPageView(true);

        /* Keep the same browser session visible as a live visitor. */
        window.setInterval(function () {
            sendPageView(false);
        }, HEARTBEAT_MS);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            startTracking,
            { once: true }
        );
    } else {
        startTracking();
    }
})();

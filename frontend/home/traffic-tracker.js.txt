/*
 * ============================================================
 * FILE PATH: frontend/scripts/traffic-tracker.js
 * ============================================================
 * PURPOSE
 * -------
 * Lightweight anonymous traffic tracker for the public platform.
 *
 * V1 DESIGN
 * ----------
 * - No login is required.
 * - No name, email, phone number or raw IP address is stored here.
 * - A random browser session identifier is kept in localStorage.
 * - The backend stores only a SHA-256 hash of that identifier.
 * - One session/page/day is counted once, preventing refreshes from
 *   artificially inflating the daily unique-traffic metric.
 *
 * IMPORTANT
 * ---------
 * This is intentionally lightweight for the free/low-cost launch.
 * The raw traffic events remain in SQLite so the admin dashboard can
 * calculate daily, weekly, monthly and yearly reports later.
 * ============================================================
 */

(function () {
    "use strict";

    const STORAGE_KEY = "sqlLearningPlatformTrafficSession";
    const API_URL = "/api/analytics/track";

    function createSessionId() {
        if (window.crypto && crypto.randomUUID) {
            return crypto.randomUUID();
        }

        return (
            Date.now().toString(36) +
            Math.random().toString(36).slice(2) +
            Math.random().toString(36).slice(2)
        );
    }

    function getSessionId() {
        try {
            let sessionId = localStorage.getItem(STORAGE_KEY);

            if (!sessionId) {
                sessionId = createSessionId();
                localStorage.setItem(STORAGE_KEY, sessionId);
            }

            return sessionId;
        } catch (error) {
            // Private browsing/storage restrictions should never break the page.
            return createSessionId();
        }
    }

    function sendTrafficEvent() {
        const payload = {
            sessionId: getSessionId(),
            pagePath: window.location.pathname,
            pageTitle: document.title.slice(0, 200),
            referrer: document.referrer
                ? document.referrer.slice(0, 500)
                : ""
        };

        const body = JSON.stringify(payload);

        try {
            if (navigator.sendBeacon) {
                const blob = new Blob(
                    [body],
                    { type: "application/json" }
                );

                navigator.sendBeacon(API_URL, blob);
                return;
            }
        } catch (error) {
            // Fall through to fetch.
        }

        fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body,
            keepalive: true
        }).catch(function () {
            // Analytics failure must never affect the learning experience.
        });
    }

    sendTrafficEvent();
})();

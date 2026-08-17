/*
 * ============================================================
 * ACTIVE LEARNER DISPLAY CONFIGURATION
 * ============================================================
 * Keep this file separate so the temporary homepage display
 * range can be changed without editing home.html or home.js.
 *
 * IMPORTANT:
 * This is NOT real concurrent-user analytics.
 * Replace it with genuine analytics/backend data when that
 * functionality is implemented.
 * ============================================================
 */

window.SQL_HOME_LEARNER_CONFIG = {
    minimum: 20,
    maximum: 200,

    /*
     * How frequently the presentation number changes.
     * Value is in minutes.
     */
    refreshMinutes: 8
};

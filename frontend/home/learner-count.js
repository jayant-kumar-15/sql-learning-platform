/*
 * ============================================================
 * SQL LEARNING PLATFORM — HOMEPAGE LEARNER COUNT CONFIG
 * ============================================================
 *
 * PURPOSE
 * -------
 * Controls the temporary presentation number shown on the
 * homepage as "Active learners".
 *
 * IMPORTANT
 * ---------
 * This is NOT a real concurrent-user measurement.
 *
 * Real traffic is collected separately by:
 *     frontend/scripts/traffic-tracker.js
 *
 * Change the range here later without modifying home.js.
 * ============================================================
 */

window.SQL_HOME_LEARNER_CONFIG = {

    /*
     * Minimum displayed value.
     */
    minimum: 20,

    /*
     * Maximum displayed value.
     */
    maximum: 200,

    /*
     * Refresh interval in minutes.
     */
    refreshMinutes: 8

};

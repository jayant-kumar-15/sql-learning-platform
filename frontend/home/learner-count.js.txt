/*
 * ============================================================
 * FILE PATH: frontend/home/learner-count.js
 * ============================================================
 * PURPOSE
 * -------
 * Controls the temporary homepage learner-count presentation.
 *
 * IMPORTANT
 * ---------
 * This is NOT real concurrent-user analytics.
 * It is intentionally isolated so the presentation range can be
 * changed later without editing home.html or home.js.
 *
 * ============================================================
 */

const LEARNER_COUNT_CONFIG = {

    minimum: 20,

    maximum: 200,

    refreshIntervalMs:
        45 * 1000

};


/* ============================================================
 * RANDOM DISPLAY VALUE
 * ============================================================ */

function getRandomLearnerCount() {

    const minimum =
        LEARNER_COUNT_CONFIG.minimum;

    const maximum =
        LEARNER_COUNT_CONFIG.maximum;

    return Math.floor(
        Math.random() *
        (maximum - minimum + 1)
    ) + minimum;

}


/* ============================================================
 * UPDATE HOMEPAGE VALUE
 * ============================================================ */

function updateLearnerCount() {

    const element =
        document.getElementById(
            "activeLearnerCount"
        );

    if (!element) {
        return;
    }

    element.textContent =
        getRandomLearnerCount() +
        "+";

}


/* ============================================================
 * START
 * ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateLearnerCount();

        window.setInterval(
            updateLearnerCount,
            LEARNER_COUNT_CONFIG.refreshIntervalMs
        );

    }
);

console.log(
    "✓ learner-count.js loaded successfully."
);

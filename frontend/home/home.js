/*
 * ============================================================
 * FILE PATH: frontend/home/home.js
 * ============================================================
 * PURPOSE
 * -------
 * Homepage interactions and lightweight public API integration.
 *
 * CURRENT RESPONSIBILITIES
 * ------------------------
 * 1. Mobile navigation.
 * 2. Footer year.
 * 3. Temporary active-learner presentation value.
 * 4. Public Appreciation / Feedback / Other Query submission.
 *
 * IMPORTANT
 * ---------
 * The feedback form sends data to the backend when the API is
 * available. localStorage is retained only as a development
 * fallback so the public page does not silently fail while the
 * backend is being configured.
 *
 * ============================================================
 */

/* ============================================================
 * API CONFIGURATION
 * ============================================================ */

const HOME_API_BASE_URL =
    "https://sql-learning-platform-5fu8.onrender.com";


/* ============================================================
 * MOBILE NAVIGATION
 * ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    const menuButton =
        document.getElementById("mobileMenuButton");

    const navigation =
        document.getElementById("mainNavigation");

    if (menuButton && navigation) {

        menuButton.addEventListener(
            "click",
            function () {

                const isOpen =
                    navigation.classList.toggle(
                        "is-open"
                    );

                menuButton.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );

            }
        );

        navigation
            .querySelectorAll("a")
            .forEach(function (link) {

                link.addEventListener(
                    "click",
                    function () {

                        navigation.classList.remove(
                            "is-open"
                        );

                        menuButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

            });

    }


    /* ========================================================
     * FOOTER YEAR
     * ======================================================== */

    const currentYear =
        document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent =
            new Date().getFullYear();
    }


    /* ========================================================
     * FEEDBACK FORM
     * ======================================================== */

    initializeFeedbackForm();

});


/* ============================================================
 * FEEDBACK FORM SUBMISSION
 * ============================================================ */

function initializeFeedbackForm() {

    const form =
        document.getElementById("feedbackForm");

    const statusElement =
        document.getElementById("feedbackStatus");

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const formData =
                new FormData(form);

            const payload = {

                category:
                    formData.get("category"),

                name:
                    String(
                        formData.get("name") || ""
                    ).trim(),

                email:
                    String(
                        formData.get("email") || ""
                    ).trim(),

                message:
                    String(
                        formData.get("message") || ""
                    ).trim()

            };


            if (!payload.message) {

                showFeedbackStatus(
                    statusElement,
                    "Please enter your message.",
                    "error"
                );

                return;

            }


            showFeedbackStatus(
                statusElement,
                "Sending...",
                "loading"
            );


            try {

                const response =
                    await fetch(
                        HOME_API_BASE_URL +
                        "/api/feedback",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials: "include",

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to send your message."
                    );

                }


                showFeedbackStatus(
                    statusElement,
                    "✓ Thank you. Your message has been received.",
                    "success"
                );

                form.reset();


            }
            catch (error) {

                /*
                 * Development fallback only.
                 *
                 * This keeps the form usable if the backend is
                 * temporarily unavailable. Production submissions
                 * should be stored by the backend.
                 */

                saveFeedbackLocally(
                    payload
                );


                showFeedbackStatus(
                    statusElement,
                    "✓ Message saved locally for now. Backend submission was unavailable.",
                    "warning"
                );

            }

        }
    );

}


/* ============================================================
 * DEVELOPMENT FALLBACK
 * ============================================================ */

function saveFeedbackLocally(payload) {

    const storageKey =
        "sqlLearningPlatformFeedback";

    let existing = [];

    try {

        existing =
            JSON.parse(
                localStorage.getItem(
                    storageKey
                )
            ) || [];

    }
    catch (error) {

        existing = [];

    }


    existing.push({

        ...payload,

        createdAt:
            new Date().toISOString()

    });


    localStorage.setItem(
        storageKey,
        JSON.stringify(existing)
    );

}


/* ============================================================
 * STATUS MESSAGE HELPER
 * ============================================================ */

function showFeedbackStatus(
    element,
    message,
    type
) {

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        "feedback-status " +
        "feedback-status-" +
        type;

}


/* ============================================================
 * GLOBAL STARTUP LOG
 * ============================================================ */

console.log(
    "✓ frontend/home/home.js loaded successfully."
);

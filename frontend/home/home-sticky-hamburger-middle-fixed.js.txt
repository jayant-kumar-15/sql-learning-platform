/*
 * ============================================================
 * SQL LEARNING PLATFORM — HOMEPAGE JAVASCRIPT
 * ============================================================
 *
 * PURPOSE
 * -------
 * Handles public homepage behavior only:
 *
 * 1. Mobile navigation
 * 2. Temporary learner-count display
 * 3. Current year
 * 4. Feedback / appreciation / query submission
 *
 * ARCHITECTURE
 * ------------
 * Browser-side:
 *   - navigation
 *   - learner presentation count
 *   - form validation/UI
 *
 * Backend API:
 *   - feedback persistence
 *
 * No SQL execution happens on this page.
 * Playground/Challenge retain their own browser-first SQL engines.
 *
 * ============================================================
 */

(function () {
    "use strict";

    /*
     * Backend base URL.
     *
     * This is the same Render API used by the existing platform
     * SQL API. Keep this in one place for future migration.
     */
    const API_BASE_URL =
        "https://sql-learning-platform-5fu8.onrender.com";


    /*
     * Feedback endpoint.
     *
     * The backend stores the selected category together with the
     * message so Admin can later filter:
     *   appreciation
     *   feedback
     *   query
     */
    const FEEDBACK_ENDPOINT =
        API_BASE_URL + "/api/feedback";


    document.addEventListener(
        "DOMContentLoaded",
        function () {

            setupMobileNavigation();

            setupLearnerCount();

            setupCurrentYear();

            setupFeedbackForm();

        }
    );


    /* ============================================================
       MOBILE NAVIGATION
       ============================================================ */

    function setupMobileNavigation() {

        const button =
            document.getElementById(
                "mobileMenuButton"
            );

        const navigation =
            document.getElementById(
                "mainNavigation"
            );


        if (!button || !navigation) {
            return;
        }


        /*
         * Normal click handling.
         *
         * `skipNextClick` is used by the mobile pointer-capture fallback
         * below. Some mobile layouts can place a scrolling layer above the
         * sticky header even though the hamburger is visibly on top. In that
         * situation the browser may deliver the touch to that layer instead
         * of the button. The fallback toggles the menu during the capture
         * phase and then suppresses the synthetic click so the menu is not
         * toggled twice.
         */
        let skipNextClick = false;

        button.addEventListener(
            "click",
            function () {

                if (skipNextClick) {
                    skipNextClick = false;
                    return;
                }

                const isOpen =
                    navigation.classList.toggle(
                        "open"
                    );


                button.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );

            }
        );


        /*
         * MOBILE HAMBURGER MIDDLE-OF-PAGE FALLBACK
         * -----------------------------------------
         *
         * This is intentionally event-only. It does NOT change the header
         * position, hamburger position, navbar design, footer, or page CSS.
         *
         * The listener runs during the document capture phase. Therefore,
         * even if a scrolling content layer is sitting above the button in
         * the normal event path, a tap whose coordinates fall inside the
         * visible hamburger can still open/close the navigation.
         *
         * Desktop behavior is completely untouched.
         */
        document.addEventListener(
            "pointerup",
            function (event) {

                if (window.innerWidth > 760) {
                    return;
                }

                if (event.pointerType === "mouse") {
                    return;
                }

                const rect = button.getBoundingClientRect();
                const x = event.clientX;
                const y = event.clientY;

                const insideButton =
                    x >= rect.left &&
                    x <= rect.right &&
                    y >= rect.top &&
                    y <= rect.bottom;

                if (!insideButton) {
                    return;
                }

                const isOpen =
                    navigation.classList.toggle(
                        "open"
                    );

                button.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );

                /* Prevent the following synthetic click from toggling again. */
                skipNextClick = true;

                event.preventDefault();
                event.stopPropagation();

                window.setTimeout(
                    function () {
                        skipNextClick = false;
                    },
                    500
                );

            },
            true
        );


        /*
         * Close the mobile menu after navigation.
         */
        navigation
            .querySelectorAll("a")
            .forEach(
                function (link) {

                    link.addEventListener(
                        "click",
                        function () {

                            navigation.classList.remove(
                                "open"
                            );

                            button.setAttribute(
                                "aria-expanded",
                                "false"
                            );

                        }
                    );

                }
            );


        /*
         * Mobile UX fix — close the expanded navigation when the user
         * starts scrolling the page.
         *
         * The header remains sticky, so the hamburger/logo stay available.
         * Only the open navigation panel is closed. Desktop is untouched.
         */
        window.addEventListener(
            "scroll",
            function () {
                if (window.innerWidth > 800) {
                    return;
                }

                if (!navigation.classList.contains("open")) {
                    return;
                }

                navigation.classList.remove("open");
                button.setAttribute("aria-expanded", "false");
            },
            { passive: true }
        );

    }


    /* ============================================================
       TEMPORARY ACTIVE LEARNER PRESENTATION
       ============================================================ */

    function setupLearnerCount() {

        const element =
            document.getElementById(
                "activeLearnerCount"
            );


        if (!element) {
            return;
        }


        /*
         * learner-count.js owns the configuration.
         *
         * Example:
         *
         * window.SQL_HOME_LEARNER_CONFIG = {
         *     minimum: 20,
         *     maximum: 200,
         *     refreshMinutes: 8
         * };
         *
         * This is deliberately NOT described as a real concurrent
         * user metric. Real traffic is collected separately by the
         * anonymous analytics tracker.
         */
        const config =
            window.SQL_HOME_LEARNER_CONFIG ||
            {
                minimum: 20,
                maximum: 200,
                refreshMinutes: 8
            };


        const minimum =
            Math.max(
                1,
                Number(config.minimum) || 20
            );


        const maximum =
            Math.max(
                minimum,
                Number(config.maximum) || 200
            );


        const refreshMinutes =
            Math.max(
                1,
                Number(config.refreshMinutes) || 8
            );


        function renderCount() {

            const count =
                Math.floor(
                    Math.random() *
                    (
                        maximum -
                        minimum +
                        1
                    )
                ) +
                minimum;


            element.textContent =
                count + "+";

        }


        renderCount();


        window.setInterval(
            renderCount,
            refreshMinutes *
            60 *
            1000
        );

    }


    /* ============================================================
       CURRENT YEAR
       ============================================================ */

    function setupCurrentYear() {

        const yearElement =
            document.getElementById(
                "currentYear"
            );


        if (yearElement) {

            yearElement.textContent =
                new Date()
                    .getFullYear();

        }

    }


    /* ============================================================
       FEEDBACK / APPRECIATION / OTHER QUERY
       ============================================================ */

    function setupFeedbackForm() {

        const form =
            document.getElementById(
                "feedbackForm"
            );

        const status =
            document.getElementById(
                "feedbackStatus"
            );

        const submitButton =
            document.getElementById(
                "feedbackSubmitButton"
            );


        if (
            !form ||
            !status
        ) {
            return;
        }


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const formData =
                    new FormData(form);


                const category =
                    String(
                        formData.get(
                            "category"
                        ) ||
                        "feedback"
                    )
                    .trim();


                const name =
                    String(
                        formData.get(
                            "name"
                        ) ||
                        ""
                    )
                    .trim();


                const email =
                    String(
                        formData.get(
                            "email"
                        ) ||
                        ""
                    )
                    .trim();


                const message =
                    String(
                        formData.get(
                            "message"
                        ) ||
                        ""
                    )
                    .trim();


                /*
                 * Client-side validation improves user experience.
                 * Backend validation remains authoritative.
                 */
                if (!name) {

                    status.textContent =
                        "Please enter your name.";

                    return;
                }

                if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

                    status.textContent =
                        "Please enter a valid email address.";

                    return;
                }

                if (!message) {

                    status.textContent =
                        "Please enter a message.";

                    return;
                }


                if (
                    message.length >
                    2000
                ) {

                    status.textContent =
                        "Message is too long.";

                    return;
                }


                /*
                 * Keep the three allowed categories explicit.
                 * This prevents arbitrary category values from
                 * being sent by normal UI interaction.
                 */
                const allowedCategories = [
                    "appreciation",
                    "feedback",
                    "query"
                ];


                if (
                    !allowedCategories.includes(
                        category
                    )
                ) {

                    status.textContent =
                        "Please select a valid category.";

                    return;
                }


                const submission = {

                    category:
                        category,

                    name:
                        name,

                    email:
                        email,

                    message:
                        message

                };


                status.textContent =
                    "Sending...";


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.setAttribute(
                        "aria-busy",
                        "true"
                    );

                }


                try {

                    /*
                     * BACKEND API CALL
                     * ----------------
                     * This is persistent application data.
                     *
                     * Unlike Playground/Challenge SQL, this form
                     * should NOT be stored only in browser memory
                     * because Admin needs centralized visibility.
                     */
                    const response =
                        await fetch(
                            FEEDBACK_ENDPOINT,
                            {
                                method:
                                    "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        submission
                                    )
                            }
                        );


                    let data = null;

                    try {

                        data =
                            await response.json();

                    } catch (parseError) {

                        data = null;

                    }


                    if (!response.ok) {

                        throw new Error(
                            data &&
                            data.message
                                ? data.message
                                : "Unable to submit your message."
                        );

                    }


                    status.textContent =
                        "Thank you! Your message has been received.";

                    form.reset();


                } catch (error) {

                    console.error(
                        "Homepage feedback API error:",
                        error
                    );


                    status.textContent =
                        "We couldn't send your message right now. Please try again.";


                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.removeAttribute(
                            "aria-busy"
                        );

                    }

                }

            }
        );

    }

})();


/* ============================================================
   HOMEPAGE V2 — VISUAL LEARNING INTERACTIONS
   Browser-only UI. No database/API call is made by these features.
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
    setupHeroSqlAnimation();
    setupLearningFlowAnimation();
    setupMoreFaq();
});

function setupHeroSqlAnimation() {
    const code = document.getElementById("sqlDemoCode");
    const status = document.getElementById("sqlDemoStatus");
    const action = document.getElementById("sqlDemoAction");
    const results = document.getElementById("sqlDemoResults");
    if (!code || !status || !action || !results) return;

    const lines = [
        "-- Watch how a simple SQL query runs",
        "SELECT first_name, last_name",
        "FROM customers",
        "WHERE city = 'Pune';"
    ];
    const plain = lines.join("\n");
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let index = 0;

    function finish() {
        code.textContent = plain;
        status.textContent = "Query executed";
        action.textContent = "✓ Query completed — showing example results";
        results.classList.add("is-visible");
        results.setAttribute("aria-hidden", "false");
    }

    if (reduced) { finish(); return; }

    code.textContent = "";
    const timer = window.setInterval(function () {
        code.textContent = plain.slice(0, index++);
        if (index > plain.length) {
            window.clearInterval(timer);
            status.textContent = "Ready to execute";
            action.textContent = "▶ Executing example query…";
            window.setTimeout(finish, 750);
        }
    }, 24);
}

function setupLearningFlowAnimation() {
    const cards = Array.from(document.querySelectorAll(".benefit-card[data-learning-step]"));
    if (cards.length < 2) return;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let active = 0;
    window.setInterval(function () {
        cards.forEach(card => card.classList.remove("is-active"));
        cards[active].classList.add("is-active");
        active = (active + 1) % cards.length;
    }, 2200);
}

function setupMoreFaq() {
    const button = document.getElementById("faqMoreButton");
    const content = document.getElementById("faqMoreContent");
    if (!button || !content) return;
    button.addEventListener("click", function () {
        const open = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!open));
        content.hidden = open;
    });
}

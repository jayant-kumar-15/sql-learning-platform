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
            setupMoreFaq();
            setupLearningFlowAnimation();
            setupHeroSqlAnimation();

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


        button.addEventListener(
            "click",
            function () {

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
                 * Name and email are mandatory for all public submissions.
                 * Backend validation should enforce the same rule.
                 */
                if (!name) {

                    status.textContent =
                        "Please enter your name.";

                    return;
                }


                if (!email) {

                    status.textContent =
                        "Please enter your email address.";

                    return;
                }


                const emailPattern =
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!emailPattern.test(email)) {

                    status.textContent =
                        "Please enter a valid email address.";

                    return;
                }


                /*
                 * Client-side validation improves user experience.
                 * Backend validation remains authoritative.
                 */
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
   MORE FAQ TOGGLE
   ------------------------------------------------------------
   Browser-only UI behavior. No API/database call is required.
   ============================================================ */
function setupMoreFaq() {

    const button =
        document.getElementById("moreFaqButton");

    const moreFaq =
        document.getElementById("moreFaq");

    if (!button || !moreFaq) {
        return;
    }

    button.addEventListener("click", function () {

        const shouldOpen = moreFaq.hasAttribute("hidden");

        if (shouldOpen) {
            moreFaq.removeAttribute("hidden");
        } else {
            moreFaq.setAttribute("hidden", "");
        }

        button.setAttribute(
            "aria-expanded",
            String(shouldOpen)
        );

        button.textContent = shouldOpen
            ? "Show fewer FAQ questions ↑"
            : "More FAQ questions ↓";
    });
}


/* ============================================================
   FOUR-CARD LEARNING FLOW ANIMATION
   ------------------------------------------------------------
   Automatically highlights one learning step at a time so the
   user visually understands the intended progression.
   Browser-only; no backend/API dependency.
   ============================================================ */
function setupLearningFlowAnimation() {

    const cards =
        Array.from(
            document.querySelectorAll(
                ".learning-flow-card"
            )
        );

    if (!cards.length) {
        return;
    }

    const reduceMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
        cards.forEach(function (card) {
            card.classList.add("is-flow-active");
        });
        return;
    }

    let activeIndex = 0;

    function highlightCard(index) {
        cards.forEach(function (card, cardIndex) {
            card.classList.toggle(
                "is-flow-active",
                cardIndex === index
            );
        });
    }

    highlightCard(activeIndex);

    window.setInterval(function () {
        activeIndex =
            (activeIndex + 1) % cards.length;

        highlightCard(activeIndex);
    }, 2600);
}


/* ============================================================
   HERO SQL TYPING + VISUAL RESULT REVEAL
   ------------------------------------------------------------
   This deliberately simulates execution for the homepage hero.
   It does NOT call SQLite, Playground APIs or the Render backend.
   ============================================================ */
function setupHeroSqlAnimation() {

    const lines = [
        ["heroSqlLine1", "SELECT first_name, last_name"],
        ["heroSqlLine2", "FROM customers"],
        ["heroSqlLine3", "WHERE city = 'Pune';"],
        ["heroSqlLine4", ""]
    ];

    const status =
        document.getElementById("heroSqlStatus");

    const resultPanel =
        document.getElementById("heroResultPanel");

    if (!status || !resultPanel) {
        return;
    }

    const reduceMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function renderLine(id, text) {
        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.textContent = text;
    }

    if (reduceMotion) {
        lines.forEach(function (line) {
            renderLine(line[0], line[1]);
        });

        status.textContent =
            "✓ Query executed — showing example result";

        status.classList.add("is-complete");
        resultPanel.classList.add("is-visible");
        resultPanel.setAttribute("aria-hidden", "false");
        return;
    }

    lines.forEach(function (line) {
        renderLine(line[0], "");
    });

    status.textContent = "▸ Writing query...";
    status.classList.add("is-running");

    let lineIndex = 0;
    let characterIndex = 0;

    function typeNextCharacter() {

        const current =
            lines[lineIndex];

        const id = current[0];
        const text = current[1];

        if (characterIndex < text.length) {
            renderLine(
                id,
                text.slice(0, characterIndex + 1)
            );

            characterIndex += 1;

            window.setTimeout(
                typeNextCharacter,
                38
            );

            return;
        }

        lineIndex += 1;
        characterIndex = 0;

        if (lineIndex < lines.length) {
            window.setTimeout(
                typeNextCharacter,
                180
            );

            return;
        }

        status.textContent =
            "✓ Query executed — showing example result";

        status.classList.remove("is-running");
        status.classList.add("is-complete");

        window.setTimeout(function () {
            resultPanel.classList.add("is-visible");
            resultPanel.setAttribute(
                "aria-hidden",
                "false"
            );
        }, 350);
    }

    /* Small delay gives the terminal a polished entrance before typing. */
    window.setTimeout(
        typeNextCharacter,
        500
    );
}

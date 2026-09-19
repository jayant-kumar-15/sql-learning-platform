/*
 * ============================================================
 * FILE PATH: frontend/admin/admin-dashboard.js
 * ============================================================
 * PURPOSE
 * -------
 * Loads protected analytics and feedback data for the admin UI.
 *
 * DAILY / WEEKLY CHART FIXES
 * --------------------------
 * 1. Prevents older Daily/Weekly/Monthly requests from overwriting
 *    the most recently selected range.
 * 2. Daily traffic now shows every returned day label instead of
 *    showing only approximately six labels.
 * 3. Daily/Weekly charts can become wider than the mobile screen
 *    and use horizontal scrolling instead of compressing points.
 * 4. Touch/clicking a chart point highlights it and shows its
 *    date/week label plus the traffic count.
 * 5. Window resize redraws the current chart without making a
 *    second analytics request.
 *
 * IMPORTANT
 * ---------
 * All existing dashboard sections, feedback logic, authentication,
 * API endpoints and other admin functionality are preserved.
 * ============================================================
 */

(function () {
    "use strict";

    /*
     * The dashboard is a static GitHub Pages page, while analytics
     * and feedback are served by the Render backend. Keep the API
     * origin explicit so /api is never requested from GitHub Pages.
     */
    const ADMIN_API_BASE_URL =
        "https://sql-learning-platform-5fu8.onrender.com";

    const state = {
        range: "30d",
        feedbackFilter: "all",
        feedback: [],

        /*
         * Chart state.
         *
         * analyticsRequestId prevents a slower old request from
         * replacing the chart after the user has selected another
         * range.
         */
        analyticsRequestId: 0,
        chartRows: [],
        chartPoints: [],
        selectedPointIndex: -1
    };

    const $ = function (selector) {
        return document.querySelector(selector);
    };

    function formatNumber(value) {
        return Number(value || 0).toLocaleString("en-IN");
    }

    async function api(url, options) {
        const response = await fetch(ADMIN_API_BASE_URL + url, {
            credentials: "include",
            ...(options || {})
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = "admin-login.html";
            throw new Error("Admin authentication required.");
        }

        if (!response.ok) {
            throw new Error("Request failed.");
        }

        return response.json();
    }


    /* ============================================================
     * TRAFFIC CHART
     * ============================================================
     * The chart remains canvas-based so the existing visual style
     * is preserved. Only the sizing, labels and point interaction
     * are changed.
     * ============================================================
     */

    function getChartPointGap(rowCount) {
        /*
         * Daily data needs enough horizontal space for every date.
         * Weekly data gets slightly more room for week labels.
         * Other ranges remain readable without unnecessary width.
         */
        if (state.range === "30d") {
            /*
             * Give each day enough horizontal space to behave like a
             * trading-style timeline. The visible mobile viewport will
             * therefore contain only the latest few days.
             */
            return 115;
        }

        if (state.range === "12w") {
            return 150;
        }

        if (rowCount >= 12) {
            return 100;
        }

        return 90;
    }


    function drawChart(rows, resetScroll) {
        const canvas = $("#trafficChart");
        const empty = $("#chartEmpty");
        const wrapper = canvas.parentElement;

        const visibleWidth = wrapper.clientWidth;
        const height = wrapper.clientHeight;
        const ratio = window.devicePixelRatio || 1;

        state.chartRows = rows || [];

        if (!rows.length) {
            state.chartPoints = [];
            state.selectedPointIndex = -1;

            wrapper.style.overflowX = "hidden";
            wrapper.style.overflowY = "hidden";

            canvas.width = visibleWidth * ratio;
            canvas.height = height * ratio;
            canvas.style.width = visibleWidth + "px";
            canvas.style.height = height + "px";

            empty.classList.remove("hidden");
            return;
        }

        empty.classList.add("hidden");

        const padding = {
            top: 20,
            right: 24,
            bottom: 52,
            left: 48
        };

        /*
         * Important:
         * The canvas itself becomes wider when there are many points.
         * The chart wrapper remains the visible viewport and scrolls
         * horizontally on mobile/desktop.
         */
        const minimumChartWidth =
            Math.max(
                visibleWidth - padding.left - padding.right,
                (rows.length - 1) * getChartPointGap(rows.length)
            );

        const canvasWidth =
            padding.left +
            minimumChartWidth +
            padding.right;

        const chartWidth = minimumChartWidth;
        const chartHeight =
            height -
            padding.top -
            padding.bottom;

        wrapper.style.overflowX =
            canvasWidth > visibleWidth
                ? "auto"
                : "hidden";

        wrapper.style.overflowY = "hidden";

        canvas.width = canvasWidth * ratio;
        canvas.height = height * ratio;
        canvas.style.width = canvasWidth + "px";
        canvas.style.height = height + "px";

        /*
         * Reset the selected point only when a new range is loaded.
         * A resize redraw keeps the current selection.
         */
        if (resetScroll) {
            state.selectedPointIndex = -1;

            /*
             * Latest-first timeline behavior:
             *
             * The complete 30-day series is kept in chronological order.
             * The canvas is intentionally wider than the viewport.
             *
             * We do NOT reverse the data because that would make the
             * timeline run backwards. Instead, we move the viewport to
             * the far right after the canvas has been laid out.
             *
             * Initial view:
             *     latest / today / yesterday / previous few days
             *
             * Swipe/scroll LEFT:
             *     older days -> older weeks -> beginning of range
             */
            const scrollToLatest = function () {
                const maxScroll =
                    Math.max(
                        0,
                        wrapper.scrollWidth -
                        wrapper.clientWidth
                    );

                wrapper.scrollLeft = maxScroll;

                /*
                 * Some mobile Chrome versions update scrollWidth one
                 * layout pass after the canvas dimensions are assigned.
                 * Re-read it immediately after forcing layout.
                 */
                void wrapper.offsetWidth;

                const finalMaxScroll =
                    Math.max(
                        0,
                        wrapper.scrollWidth -
                        wrapper.clientWidth
                    );

                wrapper.scrollLeft =
                    finalMaxScroll;
            };

            /*
             * Run after paint and once more shortly afterward so the
             * initial viewport is reliably positioned on the newest data.
             */
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    scrollToLatest();

                    setTimeout(
                        scrollToLatest,
                        150
                    );

                    setTimeout(
                        scrollToLatest,
                        500
                    );
                });
            });
        }

        const ctx = canvas.getContext("2d");

        ctx.setTransform(
            ratio,
            0,
            0,
            ratio,
            0,
            0
        );

        ctx.clearRect(
            0,
            0,
            canvasWidth,
            height
        );

        const values = rows.map(function (row) {
            return Number(row.unique_sessions || 0);
        });

        const maxValue = Math.max(...values, 1);

        ctx.font = "12px system-ui";
        ctx.lineWidth = 1;

        /*
         * Horizontal guide lines.
         */
        for (let i = 0; i <= 4; i += 1) {
            const y =
                padding.top +
                chartHeight -
                (chartHeight * i / 4);

            ctx.strokeStyle = "rgba(255,255,255,0.08)";
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(canvasWidth - padding.right, y);
            ctx.stroke();

            ctx.fillStyle = "#9fb0c5";
            ctx.textAlign = "left";

            ctx.fillText(
                Math.round(
                    maxValue * i / 4
                ).toLocaleString("en-IN"),
                5,
                y + 4
            );
        }

        /*
         * Calculate every point. No data points are removed or
         * sampled, regardless of the selected range.
         */
        const points = rows.map(function (row, index) {
            const x =
                rows.length === 1
                    ? padding.left + chartWidth / 2
                    : padding.left +
                      (
                          chartWidth *
                          index /
                          (rows.length - 1)
                      );

            const value =
                Number(row.unique_sessions || 0);

            const y =
                padding.top +
                chartHeight -
                (
                    value /
                    maxValue
                ) *
                chartHeight;

            return {
                x: x,
                y: y,
                value: value
            };
        });

        state.chartPoints = points;

        /*
         * Draw line.
         */
        ctx.strokeStyle = "#55c7ff";
        ctx.lineWidth = 3;
        ctx.beginPath();

        points.forEach(function (point, index) {
            if (index === 0) {
                ctx.moveTo(
                    point.x,
                    point.y
                );
            } else {
                ctx.lineTo(
                    point.x,
                    point.y
                );
            }
        });

        ctx.stroke();

        /*
         * Draw all points.
         */
        ctx.fillStyle = "#55c7ff";

        points.forEach(function (point) {
            ctx.beginPath();
            ctx.arc(
                point.x,
                point.y,
                3.5,
                0,
                Math.PI * 2
            );
            ctx.fill();
        });

        /*
         * Draw every label for Daily and Weekly views.
         *
         * The previous code deliberately displayed only about
         * six labels. That is why a 30-day Daily chart showed
         * labels such as Sep 3, Sep 6, Sep 9, etc.
         *
         * The chart is now horizontally scrollable, so every
         * returned point can have its own label.
         */
        ctx.fillStyle = "#9fb0c5";
        ctx.textAlign = "center";

        rows.forEach(function (row, index) {
            const point = points[index];
            const label = String(row.label || "");

            ctx.fillText(
                label,
                point.x,
                height - 16
            );
        });

        /*
         * Highlight the selected point and show its details.
         */
        if (
            state.selectedPointIndex >= 0 &&
            state.selectedPointIndex < points.length
        ) {
            drawSelectedPoint(
                ctx,
                points[state.selectedPointIndex],
                rows[state.selectedPointIndex],
                canvasWidth,
                height
            );
        }
    }


    function drawSelectedPoint(
        ctx,
        point,
        row,
        canvasWidth,
        height
    ) {
        /*
         * Outer selection ring.
         */
        ctx.beginPath();
        ctx.arc(
            point.x,
            point.y,
            8,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        /*
         * Tooltip content.
         */
        const label = String(
            row.label || ""
        );

        const count = formatNumber(
            row.unique_sessions || 0
        );

        const title =
            state.range === "12w"
                ? "Week: " + label
                : label;

        const pageViews =
            formatNumber(
                row.page_visits || 0
            );

        const detail =
            "Page views: " +
            pageViews;

        const detail2 =
            "Unique sessions: " +
            count;

        ctx.font = "12px system-ui";

        const titleWidth =
            ctx.measureText(title).width;

        const detailWidth =
            ctx.measureText(detail).width;

        const detail2Width =
            ctx.measureText(detail2).width;

        const tooltipWidth =
            Math.max(
                170,
                Math.max(
                    titleWidth,
                    detailWidth,
                    detail2Width
                ) + 28
            );

        const tooltipHeight = 76;
        const gap = 12;

        /*
         * Keep the tooltip inside the canvas.
         */
        let tooltipX =
            point.x -
            tooltipWidth / 2;

        if (tooltipX < 4) {
            tooltipX = 4;
        }

        if (
            tooltipX +
            tooltipWidth >
            canvasWidth - 4
        ) {
            tooltipX =
                canvasWidth -
                tooltipWidth -
                4;
        }

        let tooltipY =
            point.y -
            tooltipHeight -
            gap;

        if (tooltipY < 4) {
            tooltipY =
                point.y +
                gap;
        }

        ctx.fillStyle = "#0b1626";
        ctx.strokeStyle =
            "rgba(85,199,255,0.55)";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.roundRect(
            tooltipX,
            tooltipY,
            tooltipWidth,
            tooltipHeight,
            8
        );
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";

        ctx.font =
            "600 12px system-ui";

        ctx.fillText(
            title,
            tooltipX + 12,
            tooltipY + 20
        );

        ctx.fillStyle = "#9fb0c5";

        ctx.font =
            "12px system-ui";

        ctx.fillText(
            detail,
            tooltipX + 12,
            tooltipY + 40
        );

        ctx.fillText(
            detail2,
            tooltipX + 12,
            tooltipY + 60
        );
    }


    function selectChartPoint(event) {
        const canvas = $("#trafficChart");

        if (
            !canvas ||
            !state.chartPoints.length
        ) {
            return;
        }

        const rect =
            canvas.getBoundingClientRect();

        const x =
            event.clientX -
            rect.left;

        const y =
            event.clientY -
            rect.top;

        let closestIndex = -1;
        let closestDistance = Infinity;

        state.chartPoints.forEach(
            function (point, index) {
                const dx = point.x - x;
                const dy = point.y - y;

                const distance =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );

                if (
                    distance < closestDistance
                ) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            }
        );

        /*
         * Only select a point when the touch/click is reasonably
         * close to it. This keeps normal horizontal scrolling
         * comfortable on mobile.
         */
        if (
            closestIndex >= 0 &&
            closestDistance <= 36
        ) {
            state.selectedPointIndex =
                closestIndex;

            drawChart(
                state.chartRows,
                false
            );
        }
    }


    function bindChartInteraction() {
        const canvas = $("#trafficChart");

        if (!canvas) {
            return;
        }

        let pointerDownX = 0;
        let pointerDownY = 0;

        canvas.addEventListener(
            "pointerdown",
            function (event) {
                pointerDownX =
                    event.clientX;

                pointerDownY =
                    event.clientY;
            }
        );

        canvas.addEventListener(
            "pointerup",
            function (event) {
                const movedX =
                    Math.abs(
                        event.clientX -
                        pointerDownX
                    );

                const movedY =
                    Math.abs(
                        event.clientY -
                        pointerDownY
                    );

                /*
                 * If the user dragged the chart, allow the browser's
                 * horizontal scrolling behavior and do not select
                 * a point.
                 */
                if (
                    movedX > 10 ||
                    movedY > 10
                ) {
                    return;
                }

                selectChartPoint(event);
            }
        );
    }


    /* ============================================================
     * ANALYTICS LOADING
     * ============================================================
     */

    async function loadAnalytics() {
        /*
         * Every request receives a unique ID.
         *
         * Example:
         *   Daily request starts
         *   Weekly request starts
         *   Weekly finishes first -> displayed
         *   Daily finishes later -> ignored
         *
         * This fixes the exact issue where the graph appeared to
         * show Daily or Monthly data after selecting Weekly.
         */
        const requestId =
            ++state.analyticsRequestId;

        const requestedRange =
            state.range;

        /*
         * Always request a fresh analytics response when the range
         * changes. This prevents a cached Daily response from being
         * displayed after selecting Weekly.
         */
        const data = await api(
            "/api/admin/analytics?range=" +
            encodeURIComponent(requestedRange) +
            "&_=" +
            Date.now()
        );

        /*
         * Ignore stale responses.
         */
        if (
            requestId !==
            state.analyticsRequestId
        ) {
            return;
        }

        /*
         * If the user changed range while this request was running,
         * also ignore this response.
         */
        if (
            requestedRange !==
            state.range
        ) {
            return;
        }

        $("#uniqueSessions").textContent =
            formatNumber(
                data.totals.unique_sessions
            );

        $("#pageVisits").textContent =
            formatNumber(
                data.totals.page_visits
            );

        $("#activeDays").textContent =
            formatNumber(
                data.totals.active_days
            );

        const list =
            $("#popularPages");

        list.innerHTML = "";

        if (!data.popularPages.length) {
            list.innerHTML =
                "<p class='empty-state'>" +
                "No traffic yet." +
                "</p>";
        } else {
            data.popularPages.forEach(
                function (page) {
                    const row =
                        document.createElement(
                            "div"
                        );

                    row.className =
                        "page-row";

                    row.innerHTML =
                        "<span title='" +
                        escapeHtml(
                            page.page_path
                        ) +
                        "'>" +
                        escapeHtml(
                            page.page_path
                        ) +
                        "</span><strong>" +
                        formatNumber(
                            page.visits
                        ) +
                        "</strong>";

                    list.appendChild(row);
                }
            );
        }

        /*
         * Only this latest valid response can replace the chart.
         */
        drawChart(
            data.series || [],
            true
        );
    }


    async function loadFeedback() {
        const data = await api(
            "/api/admin/feedback"
        );

        state.feedback =
            data.rows ||
            data.feedback ||
            data.items ||
            [];

        renderFeedback();

        const unread =
            state.feedback.filter(
                function (item) {
                    return (
                        item.status ===
                        "new"
                    );
                }
            ).length;

        $("#newFeedback").textContent =
            formatNumber(unread);
    }


    function renderFeedback() {
        const list =
            $("#feedbackList");

        list.innerHTML = "";

        const items =
            state.feedback.filter(
                function (item) {
                    return (
                        state.feedbackFilter ===
                            "all" ||
                        item.category ===
                            state.feedbackFilter
                    );
                }
            );

        if (!items.length) {
            list.innerHTML =
                "<p class='empty-state'>" +
                "No messages found." +
                "</p>";

            return;
        }

        items.forEach(
            function (item) {
                const card =
                    document.createElement(
                        "article"
                    );

                card.className =
                    "feedback-card";

                card.innerHTML =
                    "<div class='feedback-meta'>" +
                    "<strong>" +
                    escapeHtml(
                        item.category
                    ) +
                    "</strong><span>" +
                    escapeHtml(
                        item.created_at || ""
                    ) +
                    "</span></div>" +
                    "<div class='feedback-meta'>" +
                    "<span>" +
                    escapeHtml(
                        item.name ||
                        "Anonymous"
                    ) +
                    "</span><span>" +
                    escapeHtml(
                        item.email || ""
                    ) +
                    "</span></div>" +
                    "<p>" +
                    escapeHtml(
                        item.message || ""
                    ) +
                    "</p>";

                list.appendChild(card);
            }
        );
    }


    function escapeHtml(value) {
        return String(value || "")
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );
    }


    /* ============================================================
     * EVENT BINDING
     * ============================================================
     */

    function bindEvents() {
        document
            .querySelectorAll(".nav-item")
            .forEach(
                function (button) {
                    button.addEventListener(
                        "click",
                        function () {
                            document
                                .querySelectorAll(
                                    ".nav-item"
                                )
                                .forEach(
                                    item => {
                                        item.classList
                                            .remove(
                                                "active"
                                            );
                                    }
                                );

                            button.classList.add(
                                "active"
                            );

                            const section =
                                button.dataset
                                    .section;

                            $("#overviewSection")
                                .classList
                                .toggle(
                                    "hidden",
                                    section !==
                                        "overview"
                                );

                            $("#feedbackSection")
                                .classList
                                .toggle(
                                    "hidden",
                                    section !==
                                        "feedback"
                                );
                        }
                    );
                }
            );


        document
            .querySelectorAll(
                ".range-button"
            )
            .forEach(
                function (button) {
                    button.addEventListener(
                        "click",
                        async function () {
                            /*
                             * Update the selected range immediately.
                             * loadAnalytics() creates a new request ID,
                             * so older responses cannot overwrite it.
                             */
                            state.range =
                                button.dataset
                                    .range;

                            document
                                .querySelectorAll(
                                    ".range-button"
                                )
                                .forEach(
                                    item => {
                                        item.classList
                                            .remove(
                                                "active"
                                            );
                                    }
                                );

                            button.classList.add(
                                "active"
                            );

                            try {
                                await loadAnalytics();
                            } catch (error) {
                                console.error(
                                    error
                                );
                            }
                        }
                    );
                }
            );


        document
            .querySelectorAll(
                ".filter-button"
            )
            .forEach(
                function (button) {
                    button.addEventListener(
                        "click",
                        function () {
                            state.feedbackFilter =
                                button.dataset
                                    .filter;

                            document
                                .querySelectorAll(
                                    ".filter-button"
                                )
                                .forEach(
                                    item => {
                                        item.classList
                                            .remove(
                                                "active"
                                            );
                                    }
                                );

                            button.classList.add(
                                "active"
                            );

                            renderFeedback();
                        }
                    );
                }
            );


        $("#logoutButton")
            .addEventListener(
                "click",
                async function () {
                    await fetch(
                        ADMIN_API_BASE_URL +
                        "/api/auth/logout",
                        {
                            method: "POST",
                            credentials:
                                "include"
                        }
                    );

                    window.location.href =
                        "admin-login.html";
                }
            );


        /*
         * Chart point selection works with mouse, touch and pen.
         */
        bindChartInteraction();


        /*
         * Do not refetch analytics on resize.
         *
         * Refetching here could create another race between range
         * requests. The already-loaded series is enough; only the
         * canvas dimensions need to be recalculated.
         */
        window.addEventListener(
            "resize",
            function () {
                if (
                    state.chartRows.length
                ) {
                    drawChart(
                        state.chartRows,
                        false
                    );
                }
            }
        );
    }


    async function initialise() {
        bindEvents();

        try {
            const me = await api(
                "/api/auth/me"
            );

            if (
                !me.user ||
                me.user.role !== "admin"
            ) {
                window.location.href =
                    "admin-login.html";

                return;
            }

            $("#welcomeHeading").textContent =
                "Welcome, " +
                (
                    me.user.name ||
                    "Admin"
                );

            await Promise.all([
                loadAnalytics(),
                loadFeedback()
            ]);
        } catch (error) {
            console.error(error);
        }
    }


    initialise();

})();

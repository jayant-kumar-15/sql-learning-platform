/*
 * ============================================================
 * FILE PATH: frontend/admin/admin-dashboard.js
 * ============================================================
 * PURPOSE
 * -------
 * Loads protected analytics and feedback data for the admin UI.
 * No public user authentication is required by the website; this
 * page is protected by the backend admin session.
 *
 * CHART REVISION
 * --------------
 * The traffic chart keeps the complete series but opens at the
 * newest/rightmost dates. Older dates are revealed by scrolling LEFT.
 * Point selection shows date/week, page views and unique sessions.
 * All feedback and Data Management functionality remains unchanged.
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
         * Analytics request protection:
         * if the administrator clicks Daily -> Weekly quickly,
         * an older response must never overwrite the newer range.
         */
        analyticsRequestId: 0,

        /* Current chart data/selection for touch interaction. */
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

    function getChartPointGap(rowCount) {
        /*
         * Give daily points enough horizontal space that the mobile
         * viewport shows only the newest few days.
         *
         * The complete timeline remains available by scrolling LEFT.
         */
        if (state.range === "30d") {
            return 115;
        }

        if (state.range === "12w") {
            return 150;
        }

        return rowCount >= 12 ? 100 : 90;
    }


    function drawChart(rows, resetScroll = false) {
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

            canvas.width = visibleWidth * ratio;
            canvas.height = height * ratio;
            canvas.style.width = visibleWidth + "px";
            canvas.style.height = height + "px";

            wrapper.style.overflowX = "hidden";
            wrapper.style.overflowY = "hidden";

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
         * The canvas is deliberately wider than the visible wrapper.
         * This creates the TradingView-style horizontal timeline.
         */
        const chartWidth = Math.max(
            visibleWidth - padding.left - padding.right,
            (rows.length - 1) * getChartPointGap(rows.length)
        );

        const canvasWidth =
            padding.left +
            chartWidth +
            padding.right;

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

        if (resetScroll) {
            state.selectedPointIndex = -1;
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

        /* Horizontal guide lines. */
        for (let i = 0; i <= 4; i += 1) {
            const y =
                padding.top +
                chartHeight -
                (chartHeight * i / 4);

            ctx.strokeStyle =
                "rgba(255,255,255,0.08)";

            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(
                canvasWidth - padding.right,
                y
            );
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
                x,
                y,
                value
            };
        });

        state.chartPoints = points;

        /* Line. */
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

        /* Points. */
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
         * Do not thin the timeline labels.
         * The chart is scrollable, so every returned day/week can
         * have its own label.
         */
        ctx.fillStyle = "#9fb0c5";

        rows.forEach(function (row, index) {
            const point = points[index];
            const label = String(row.label || "");

            /*
             * Keep the first and last labels fully inside the canvas.
             *
             * The last point is intentionally near the right edge because
             * the chart opens on the newest data. Centering the final label
             * on that point would clip "2026-09-19" to "2026-09-1".
             */
            if (index === 0) {
                ctx.textAlign = "left";

                ctx.fillText(
                    label,
                    point.x,
                    height - 16
                );
            } else if (index === rows.length - 1) {
                ctx.textAlign = "right";

                ctx.fillText(
                    label,
                    point.x,
                    height - 16
                );
            } else {
                ctx.textAlign = "center";

                ctx.fillText(
                    label,
                    point.x,
                    height - 16
                );
            }
        });

        /*
         * Redraw the selected point and its traffic details.
         */
        if (
            state.selectedPointIndex >= 0 &&
            state.selectedPointIndex < rows.length
        ) {
            drawSelectedPoint(
                ctx,
                points[state.selectedPointIndex],
                rows[state.selectedPointIndex],
                canvasWidth,
                height
            );
        }

        /*
         * IMPORTANT:
         * The first viewport MUST open on the newest/rightmost
         * dates. Older days/weeks are revealed by scrolling LEFT.
         *
         * Mobile Chrome can clamp scrollLeft to 0 if the canvas has
         * not completed its layout pass yet. Therefore we verify the
         * maximum scroll position and retry after layout/paint.
         */
        if (resetScroll) {
            const scrollToLatest = function () {
                const maxScroll = Math.max(
                    0,
                    wrapper.scrollWidth -
                    wrapper.clientWidth
                );

                if (maxScroll <= 0) {
                    return;
                }

                /*
                 * Use both assignment and scrollTo because different
                 * mobile browsers handle a dynamically-sized canvas
                 * differently during the first layout pass.
                 */
                wrapper.scrollLeft = maxScroll;

                if (
                    typeof wrapper.scrollTo === "function"
                ) {
                    wrapper.scrollTo({
                        left: maxScroll,
                        top: 0,
                        behavior: "auto"
                    });
                }
            };

            const ensureLatestViewport = function () {
                scrollToLatest();

                const maxScroll = Math.max(
                    0,
                    wrapper.scrollWidth -
                    wrapper.clientWidth
                );

                /*
                 * If the browser still opened at the old/left side,
                 * force it again after the layout has settled.
                 */
                if (
                    maxScroll > 0 &&
                    wrapper.scrollLeft <
                    maxScroll - 2
                ) {
                    wrapper.scrollLeft =
                        maxScroll;

                    if (
                        typeof wrapper.scrollTo ===
                        "function"
                    ) {
                        wrapper.scrollTo(
                            maxScroll,
                            0
                        );
                    }
                }
            };

            requestAnimationFrame(
                function () {
                    requestAnimationFrame(
                        function () {
                            ensureLatestViewport();

                            setTimeout(
                                ensureLatestViewport,
                                100
                            );

                            setTimeout(
                                ensureLatestViewport,
                                300
                            );

                            setTimeout(
                                ensureLatestViewport,
                                700
                            );

                            setTimeout(
                                ensureLatestViewport,
                                1200
                            );
                        }
                    );
                }
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
        /* Selection ring. */
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

        const rawLabel =
            String(row.label || "");

        const title =
            state.range === "12w"
                ? "Week: " + rawLabel
                : rawLabel;

        const pageViews =
            formatNumber(
                row.page_visits || 0
            );

        const uniqueSessions =
            formatNumber(
                row.unique_sessions || 0
            );

        const detail =
            "Page views: " +
            pageViews;

        const detail2 =
            "Unique sessions: " +
            uniqueSessions;

        ctx.font =
            "600 12px system-ui";

        const titleWidth =
            ctx.measureText(title).width;

        ctx.font =
            "12px system-ui";

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

        ctx.textAlign = "left";

        ctx.fillStyle = "#ffffff";
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
                const dx =
                    point.x - x;

                const dy =
                    point.y - y;

                const distance =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );

                if (
                    distance <
                    closestDistance
                ) {
                    closestDistance =
                        distance;

                    closestIndex =
                        index;
                }
            }
        );

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
        const canvas =
            $("#trafficChart");

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
                 * A drag is scrolling, not point selection.
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


    async function loadAnalytics() {
        /*
         * Request sequencing prevents:
         * Daily -> Weekly -> Daily, etc. from allowing an older
         * response to overwrite the currently selected range.
         */
        const requestId =
            ++state.analyticsRequestId;

        const requestedRange =
            state.range;

        /*
         * Always fetch a fresh response when the range changes.
         *
         * Without a cache-buster, a browser/proxy can reuse an older
         * /api/admin/analytics response. That is exactly what can make
         * Weekly display the Daily series even though the button says
         * Weekly.
         */
        const data = await api(
            "/api/admin/analytics?range=" +
            encodeURIComponent(
                requestedRange
            ) +
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

        if (
            requestedRange !==
            state.range
        ) {
            return;
        }

        $("#liveVisitors").textContent =
            formatNumber(
                data.liveVisitors || 0
            );

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

        const series =
            data.series || [];

        if (
            requestedRange === "12w" &&
            series.length &&
            series.some(function (row) {
                return !String(
                    row.label || ""
                ).includes("-W");
            })
        ) {
            console.error(
                "Weekly analytics response is not weekly.",
                series
            );
        }

        drawChart(
            series,
            true
        );

        /*
         * Final mobile-safe positioning pass.
         * This runs after the canvas has been inserted/sized and
         * guarantees that the newest dates are the initial view.
         */
        setTimeout(function () {
            const chartCanvas = $("#trafficChart");

            if (!chartCanvas) {
                return;
            }

            const chartWrapper =
                chartCanvas.parentElement;

            const latestScroll =
                Math.max(
                    0,
                    chartWrapper.scrollWidth -
                    chartWrapper.clientWidth
                );

            if (latestScroll > 0) {
                chartWrapper.scrollLeft =
                    latestScroll;

                if (
                    typeof chartWrapper.scrollTo ===
                    "function"
                ) {
                    chartWrapper.scrollTo({
                        left: latestScroll,
                        top: 0,
                        behavior: "auto"
                    });
                }
            }
        }, 50);
    }


    async function loadFeedback() {
        const data = await api(
            "/api/admin/feedback"
        );

        state.feedback = data.rows || data.feedback || data.items || [];
        renderFeedback();

        const unread = state.feedback.filter(function (item) {
            return item.status === "new";
        }).length;

        $("#newFeedback").textContent = formatNumber(unread);
    }

    function renderFeedback() {
        const list = $("#feedbackList");
        list.innerHTML = "";

        const items = state.feedback.filter(function (item) {
            return state.feedbackFilter === "all" ||
                item.category === state.feedbackFilter;
        });

        if (!items.length) {
            list.innerHTML = "<p class='empty-state'>No messages found.</p>";
            return;
        }

        items.forEach(function (item) {
            const card = document.createElement("article");
            card.className = "feedback-card";
            card.innerHTML =
                "<div class='feedback-meta'><strong>" +
                escapeHtml(item.category) +
                "</strong><span>" +
                escapeHtml(item.created_at || "") +
                "</span></div>" +
                "<div class='feedback-meta'><span>" +
                escapeHtml(item.name || "Anonymous") +
                "</span><span>" +
                escapeHtml(item.email || "") +
                "</span></div>" +
                "<p>" +
                escapeHtml(item.message || "") +
                "</p>";

            list.appendChild(card);
        });
    }

    function escapeHtml(value) {
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    async function deleteByEndpoint(endpoint, label) {
        if (!confirm("This will permanently delete " + label + ". Continue?")) return;
        const response = await api(endpoint, { method: "DELETE" });
        setCleanupStatus(response.message || (label + " deleted."));
        await Promise.all([loadAnalytics(), loadFeedback()]);
    }

    function setCleanupStatus(message, isError) {
        const status = $("#cleanupStatus");
        if (!status) return;
        status.textContent = message || "";
        status.classList.toggle("error", Boolean(isError));
    }

    async function deleteTrafficOlderThanMonths() {
        const months = Number($("#trafficDeleteMonths").value);
        await deleteByEndpoint("/api/admin/analytics/cleanup?months=" + months, "traffic older than " + months + " month(s)");
    }

    async function deleteFeedbackOlderThanMonths() {
        const months = Number($("#feedbackDeleteMonths").value);
        await deleteByEndpoint("/api/admin/feedback/cleanup?months=" + months, "feedback older than " + months + " month(s)");
    }

    async function deleteDateRange(type) {
        const from = $("#cleanupFromDate").value;
        const to = $("#cleanupToDate").value;
        if (!from || !to) {
            setCleanupStatus("Please select both From and To dates.", true);
            return;
        }
        if (from > to) {
            setCleanupStatus("From date cannot be after To date.", true);
            return;
        }
        const endpoint = type === "traffic"
            ? "/api/admin/analytics/cleanup?from=" + encodeURIComponent(from) + "&to=" + encodeURIComponent(to)
            : "/api/admin/feedback/cleanup?from=" + encodeURIComponent(from) + "&to=" + encodeURIComponent(to);
        await deleteByEndpoint(endpoint, type + " data from " + from + " through " + to);
    }

    function bindEvents() {
        document.querySelectorAll(".nav-item").forEach(function (button) {
            button.addEventListener("click", function () {
                document.querySelectorAll(".nav-item").forEach(item => {
                    item.classList.remove("active");
                });

                button.classList.add("active");

                const section = button.dataset.section;

                $("#overviewSection").classList.toggle(
                    "hidden",
                    section !== "overview"
                );

                $("#feedbackSection").classList.toggle(
                    "hidden",
                    section !== "feedback"
                );

                $("#dataManagementSection").classList.toggle(
                    "hidden",
                    section !== "data-management"
                );

                /* Refresh feedback whenever the Feedback section is opened. */
                if (section === "feedback") {
                    loadFeedback().catch(function (error) {
                        console.error("Unable to refresh feedback:", error);
                    });
                }
            });
        });

        document.querySelectorAll(".range-button").forEach(function (button) {
            button.addEventListener("click", async function () {
                state.range = button.dataset.range;

                document.querySelectorAll(".range-button").forEach(item => {
                    item.classList.remove("active");
                });

                button.classList.add("active");

                try {
                    await loadAnalytics();
                } catch (error) {
                    console.error(error);
                }
            });
        });

        document.querySelectorAll(".filter-button").forEach(function (button) {
            button.addEventListener("click", function () {
                state.feedbackFilter = button.dataset.filter;

                document.querySelectorAll(".filter-button").forEach(item => {
                    item.classList.remove("active");
                });

                button.classList.add("active");
                renderFeedback();
            });
        });

        $("#deleteTrafficButton").addEventListener("click", function () {
            deleteTrafficOlderThanMonths().catch(function (error) {
                setCleanupStatus(error.message, true);
            });
        });

        $("#deleteFeedbackButton").addEventListener("click", function () {
            deleteFeedbackOlderThanMonths().catch(function (error) {
                setCleanupStatus(error.message, true);
            });
        });

        $("#deleteTrafficRangeButton").addEventListener("click", function () {
            deleteDateRange("traffic").catch(function (error) {
                setCleanupStatus(error.message, true);
            });
        });

        $("#deleteFeedbackRangeButton").addEventListener("click", function () {
            deleteDateRange("feedback").catch(function (error) {
                setCleanupStatus(error.message, true);
            });
        });

        $("#logoutButton").addEventListener("click", async function () {
            await fetch(ADMIN_API_BASE_URL + "/api/logout", {
                method: "POST",
                credentials: "include"
            });

            window.location.href = "admin-login.html";
        });

        /*
         * Chart point touch/click interaction.
         */
        bindChartInteraction();

        window.addEventListener("resize", function () {
            /*
             * Redraw the already-loaded series rather than issuing
             * another API request on every resize.
             */
            if (state.chartRows.length) {
                drawChart(
                    state.chartRows,
                    false
                );
            }
        });
    }

    /*
     * Keep the admin overview and feedback list reasonably fresh while
     * the dashboard remains open. This does not change stored data.
     */
    window.setInterval(function () {
        loadAnalytics().catch(function () {});
        loadFeedback().catch(function () {});
    }, 30000);

    async function initialise() {
        bindEvents();

        try {
            const me = await api("/api/me");

            if (!me.user || me.user.role !== "admin") {
                window.location.href = "admin-login.html";
                return;
            }

            $("#welcomeHeading").textContent =
                "Welcome, " + (me.user.name || "Admin");

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

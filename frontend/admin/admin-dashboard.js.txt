/*
 * ============================================================
 * FILE PATH: frontend/admin/admin-dashboard.js
 * ============================================================
 * PURPOSE
 * -------
 * Loads protected analytics and feedback data for the admin UI.
 * No public user authentication is required by the website; this
 * page is protected by the backend admin session.
 * ============================================================
 */

(function () {
    "use strict";

    const state = {
        range: "30d",
        feedbackFilter: "all",
        feedback: []
    };

    const $ = function (selector) {
        return document.querySelector(selector);
    };

    function formatNumber(value) {
        return Number(value || 0).toLocaleString("en-IN");
    }

    async function api(url, options) {
        const response = await fetch(url, {
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

    function drawChart(rows) {
        const canvas = $("#trafficChart");
        const empty = $("#chartEmpty");
        const wrapper = canvas.parentElement;
        const width = wrapper.clientWidth;
        const height = wrapper.clientHeight;
        const ratio = window.devicePixelRatio || 1;

        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        const ctx = canvas.getContext("2d");
        ctx.scale(ratio, ratio);
        ctx.clearRect(0, 0, width, height);

        if (!rows.length) {
            empty.classList.remove("hidden");
            return;
        }

        empty.classList.add("hidden");

        const padding = {
            top: 20,
            right: 20,
            bottom: 40,
            left: 48
        };

        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const values = rows.map(row => Number(row.unique_sessions || 0));
        const maxValue = Math.max(...values, 1);

        ctx.font = "12px system-ui";
        ctx.lineWidth = 1;

        // Horizontal guide lines.
        for (let i = 0; i <= 4; i += 1) {
            const y = padding.top + chartHeight - (chartHeight * i / 4);
            ctx.strokeStyle = "rgba(255,255,255,0.08)";
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            ctx.fillStyle = "#9fb0c5";
            ctx.fillText(
                Math.round(maxValue * i / 4).toLocaleString("en-IN"),
                5,
                y + 4
            );
        }

        const points = rows.map(function (row, index) {
            const x = rows.length === 1
                ? padding.left + chartWidth / 2
                : padding.left + (chartWidth * index / (rows.length - 1));

            const y = padding.top + chartHeight -
                (Number(row.unique_sessions || 0) / maxValue) * chartHeight;

            return { x, y, value: Number(row.unique_sessions || 0) };
        });

        ctx.strokeStyle = "#55c7ff";
        ctx.lineWidth = 3;
        ctx.beginPath();

        points.forEach(function (point, index) {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });

        ctx.stroke();

        ctx.fillStyle = "#55c7ff";
        points.forEach(function (point) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3.5, 0, Math.PI * 2);
            ctx.fill();
        });

        const labelEvery = Math.max(
            1,
            Math.ceil(rows.length / 6)
        );

        ctx.fillStyle = "#9fb0c5";
        rows.forEach(function (row, index) {
            if (
                index % labelEvery !== 0 &&
                index !== rows.length - 1
            ) {
                return;
            }

            const point = points[index];
            const label = String(row.label || "");
            ctx.fillText(
                label,
                Math.max(0, point.x - 24),
                height - 12
            );
        });
    }

    async function loadAnalytics() {
        const data = await api(
            "/api/admin/analytics?range=" + state.range
        );

        $("#uniqueSessions").textContent = formatNumber(
            data.totals.unique_sessions
        );

        $("#pageVisits").textContent = formatNumber(
            data.totals.page_visits
        );

        $("#activeDays").textContent = formatNumber(
            data.totals.active_days
        );

        const list = $("#popularPages");
        list.innerHTML = "";

        if (!data.popularPages.length) {
            list.innerHTML = "<p class='empty-state'>No traffic yet.</p>";
        } else {
            data.popularPages.forEach(function (page) {
                const row = document.createElement("div");
                row.className = "page-row";
                row.innerHTML =
                    "<span title='" + escapeHtml(page.page_path) + "'>" +
                    escapeHtml(page.page_path) +
                    "</span><strong>" +
                    formatNumber(page.visits) +
                    "</strong>";
                list.appendChild(row);
            });
        }

        drawChart(data.series || []);
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

        $("#logoutButton").addEventListener("click", async function () {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include"
            });

            window.location.href = "admin-login.html";
        });

        window.addEventListener("resize", function () {
            loadAnalytics().catch(function () {});
        });
    }

    async function initialise() {
        bindEvents();

        try {
            const me = await api("/api/auth/me");

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

/*
 * ============================================================
 * FILE PATH: frontend/admin/admin-login.js
 * ============================================================
 * PURPOSE
 * -------
 * Admin-only login. There is intentionally NO public signup form.
 * The backend decides whether the authenticated account has the
 * admin role; the browser never grants administrator privileges.
 * ============================================================
 */

(function () {
    "use strict";

    /*
     * GitHub Pages hosts this file; the private API is hosted on
     * Render. Never use a relative /api URL from this page.
     */
    const ADMIN_API_BASE_URL =
        "https://sql-learning-platform-5fu8.onrender.com";

    const form = document.getElementById("adminLoginForm");
    const identifier = document.getElementById("identifier");
    const password = document.getElementById("password");
    const status = document.getElementById("loginStatus");
    const submitButton = form.querySelector(".submit-button");
    const togglePassword = document.getElementById("togglePassword");

    togglePassword.addEventListener("click", function () {
        const visible = password.type === "text";
        password.type = visible ? "password" : "text";
        togglePassword.textContent = visible ? "Show" : "Hide";
        togglePassword.setAttribute(
            "aria-label",
            visible ? "Show password" : "Hide password"
        );
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        status.textContent = "";
        submitButton.disabled = true;
        submitButton.textContent = "Signing in...";

        try {
            const response = await fetch(ADMIN_API_BASE_URL + "/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    identifier: identifier.value.trim(),
                    password: password.value
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to sign in."
                );
            }

            if (!data.user || data.user.role !== "admin") {
                await fetch(ADMIN_API_BASE_URL + "/api/auth/logout", {
                    method: "POST",
                    credentials: "include"
                });

                throw new Error(
                    "This account is not authorised for administrator access."
                );
            }

            window.location.href = "admin-dashboard.html";
        } catch (error) {
            status.textContent = error.message;
            submitButton.disabled = false;
            submitButton.textContent = "Sign in to Admin";
        }
    });
})();

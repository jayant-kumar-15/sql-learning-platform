/*
 * ============================================================
 * FILE PATH: Backend/routes/authRoutes.js
 * ============================================================
 * PURPOSE
 * -------
 * Authentication API for the SQL Learning Platform.
 *
 * ENDPOINTS
 * ---------
 * POST /api/auth/signup
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 *
 * SECURITY
 * --------
 * Passwords are hashed using Node.js built-in scrypt.
 * Sessions use random opaque tokens stored only as hashes in
 * SQLite. The browser receives the raw session token only through
 * an HttpOnly cookie.
 *
 * Admin assignment is controlled by server environment variables:
 *
 * ADMIN_EMAILS="your@email.com,another@email.com"
 * ADMIN_PHONES="+919999999999"
 *
 * Never put these values in frontend JavaScript.
 *
 * ============================================================
 */

const express =
    require("express");

const crypto =
    require("crypto");

const db =
    require("../config/db");

const router =
    express.Router();


/* ============================================================
 * CONFIGURATION
 * ============================================================ */

const SESSION_DAYS = 7;

const PASSWORD_MIN_LENGTH = 8;


/* ============================================================
 * PASSWORD HELPERS
 * ============================================================ */

function hashPassword(password) {

    const salt =
        crypto.randomBytes(16);

    const derivedKey =
        crypto.scryptSync(
            password,
            salt,
            64
        );

    return (
        "scrypt$" +
        salt.toString("hex") +
        "$" +
        derivedKey.toString("hex")
    );

}


function verifyPassword(
    password,
    storedHash
) {

    const parts =
        String(storedHash).split("$");

    if (
        parts.length !== 3 ||
        parts[0] !== "scrypt"
    ) {

        return false;

    }


    const salt =
        Buffer.from(
            parts[1],
            "hex"
        );

    const expected =
        Buffer.from(
            parts[2],
            "hex"
        );

    const actual =
        crypto.scryptSync(
            password,
            salt,
            expected.length
        );


    return (
        actual.length === expected.length &&
        crypto.timingSafeEqual(
            actual,
            expected
        )
    );

}


/* ============================================================
 * SESSION HELPERS
 * ============================================================ */

function createSession(
    userId,
    callback
) {

    const rawToken =
        crypto.randomBytes(32)
            .toString("hex");

    const tokenHash =
        crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");


    const expiresAt =
        new Date(
            Date.now() +
            SESSION_DAYS *
            24 *
            60 *
            60 *
            1000
        ).toISOString();


    db.run(
        `
        INSERT INTO auth_sessions
            (user_id, token_hash, expires_at)
        VALUES
            (?, ?, ?)
        `,
        [
            userId,
            tokenHash,
            expiresAt
        ],
        function (error) {

            if (error) {
                return callback(
                    error
                );
            }

            callback(
                null,
                rawToken,
                expiresAt
            );

        }
    );

}


function setSessionCookie(
    res,
    token
) {

    const production =
        process.env.NODE_ENV ===
        "production";

    /*
     * GitHub Pages -> Render is cross-site.
     * SameSite=None is required in production.
     */

    const sameSite =
        production
            ? "None"
            : "Lax";


    const maxAge =
        SESSION_DAYS *
        24 *
        60 *
        60 *
        1000;

    const cookieParts = [
        "sql_learning_session=" + token,
        "Path=/",
        "Max-Age=" + Math.floor(maxAge / 1000),
        "HttpOnly",
        "SameSite=" + sameSite
    ];

    if (production) {
        cookieParts.push("Secure");
    }

    res.setHeader(
        "Set-Cookie",
        cookieParts.join("; ")
    );

}


function clearSessionCookie(
    res
) {

    const production =
        process.env.NODE_ENV ===
        "production";

    const cookieParts = [
        "sql_learning_session=",
        "Path=/",
        "Max-Age=0",
        "HttpOnly",
        "SameSite=" +
            (
                production
                    ? "None"
                    : "Lax"
            )
    ];

    if (production) {
        cookieParts.push("Secure");
    }

    res.setHeader(
        "Set-Cookie",
        cookieParts.join("; ")
    );

}


/* ============================================================
 * ADMIN ALLOWLIST
 * ============================================================ */

function csvValues(
    value
) {

    return String(
        value || ""
    )
        .split(",")
        .map(
            item =>
                item.trim()
        )
        .filter(Boolean);

}


function shouldBeAdmin(
    email,
    phone
) {

    const adminEmails =
        csvValues(
            process.env.ADMIN_EMAILS
        )
        .map(
            item =>
                item.toLowerCase()
        );


    const adminPhones =
        csvValues(
            process.env.ADMIN_PHONES
        );


    return (
        adminEmails.includes(
            String(email)
                .trim()
                .toLowerCase()
        ) ||

        (
            phone &&
            adminPhones.includes(
                String(phone).trim()
            )
        )
    );

}


/* ============================================================
 * COOKIE PARSING
 * ============================================================ */

function getCookie(
    req,
    cookieName
) {

    const header =
        req.headers.cookie || "";

    const cookies =
        header
            .split(";")
            .map(
                item => item.trim()
            );

    for (
        const cookie of cookies
    ) {

        const separator =
            cookie.indexOf("=");

        if (
            separator === -1
        ) {
            continue;
        }

        const name =
            cookie.slice(
                0,
                separator
            );

        const value =
            cookie.slice(
                separator + 1
            );

        if (
            name === cookieName
        ) {
            return decodeURIComponent(
                value
            );
        }

    }

    return null;
}


/* ============================================================
 * AUTHENTICATION MIDDLEWARE
 * ============================================================ */

function requireAuth(
    req,
    res,
    next
) {

    const rawToken =
        getCookie(
            req,
            "sql_learning_session"
        );


    if (!rawToken) {

        return res.status(401).json({
            success: false,
            message:
                "Authentication required."
        });

    }


    const tokenHash =
        crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");


    db.get(
        `
        SELECT
            s.user_id,
            s.expires_at,
            u.id,
            u.name,
            u.email,
            u.phone,
            u.role,
            u.is_active
        FROM auth_sessions s
        JOIN users u
            ON u.id = s.user_id
        WHERE
            s.token_hash = ?
            AND s.expires_at > CURRENT_TIMESTAMP
        `,
        [tokenHash],
        function (
            error,
            user
        ) {

            if (error) {

                console.error(
                    "Authentication lookup failed:",
                    error.message
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Authentication service unavailable."
                });

            }


            if (
                !user ||
                !user.is_active
            ) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Session expired or invalid."
                });

            }


            req.user = user;

            next();

        }
    );

}


/* ============================================================
 * ADMIN MIDDLEWARE
 * ============================================================ */

function requireAdmin(
    req,
    res,
    next
) {

    requireAuth(
        req,
        res,
        function () {

            if (
                req.user.role !==
                "admin"
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Administrator access required."
                });

            }

            next();

        }
    );

}


/* ============================================================
 * SIGN UP
 * ============================================================ */

router.post(
    "/signup",
    function (req, res) {

        const name =
            String(
                req.body.name || ""
            ).trim();

        const email =
            String(
                req.body.email || ""
            ).trim()
            .toLowerCase();

        const phone =
            String(
                req.body.phone || ""
            ).trim();

        const password =
            String(
                req.body.password || ""
            );


        if (
            !name ||
            !email ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Name, email and password are required."
            });

        }


        if (
            password.length <
            PASSWORD_MIN_LENGTH
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 8 characters."
            });

        }


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(email)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid email address."
            });

        }


        /*
         * V1 policy: public user accounts are disabled.
         * Only the configured administrator email/phone allowlist may
         * create an account through this endpoint. This keeps the public
         * website completely login-free while still allowing the owner
         * to bootstrap the private admin account.
         */
        if (!shouldBeAdmin(email, phone)) {
            return res.status(403).json({
                success: false,
                message:
                    "Public user signup is disabled. Administrator access requires an approved email or phone number."
            });
        }

        const role = "admin";


        const passwordHash =
            hashPassword(
                password
            );


        db.run(
            `
            INSERT INTO users
                (
                    name,
                    email,
                    phone,
                    password_hash,
                    role
                )
            VALUES
                (?, ?, ?, ?, ?)
            `,
            [
                name,
                email,
                phone || null,
                passwordHash,
                role
            ],
            function (error) {

                if (error) {

                    if (
                        error.message &&
                        error.message.includes(
                            "UNIQUE constraint failed"
                        )
                    ) {

                        return res.status(409).json({
                            success: false,
                            message:
                                "An account with this email already exists."
                        });

                    }


                    console.error(
                        "Signup failed:",
                        error.message
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to create account."
                    });

                }


                const userId =
                    this.lastID;


                createSession(
                    userId,
                    function (
                        sessionError,
                        rawToken
                    ) {

                        if (sessionError) {

                            console.error(
                                "Session creation failed:",
                                sessionError.message
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Account created, but session could not be created. Please login again."
                            });

                        }


                        setSessionCookie(
                            res,
                            rawToken
                        );


                        return res.status(201).json({
                            success: true,
                            message:
                                "Account created successfully.",
                            user: {
                                id:
                                    userId,
                                name,
                                email,
                                role
                            }
                        });

                    }
                );

            }
        );

    }
);


/* ============================================================
 * LOGIN
 * ============================================================ */

router.post(
    "/login",
    function (req, res) {

        const email =
            String(
                req.body.email || ""
            ).trim()
            .toLowerCase();

        const password =
            String(
                req.body.password || ""
            );


        if (
            !email ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required."
            });

        }


        db.get(
            `
            SELECT
                id,
                name,
                email,
                phone,
                password_hash,
                role,
                is_active
            FROM users
            WHERE
                email = ?
            `,
            [email],
            function (
                error,
                user
            ) {

                if (error) {

                    console.error(
                        "Login lookup failed:",
                        error.message
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Authentication service unavailable."
                    });

                }


                if (
                    !user ||
                    !user.is_active ||
                    !verifyPassword(
                        password,
                        user.password_hash
                    )
                ) {

                    return res.status(401).json({
                        success: false,
                        message:
                            "Invalid email or password."
                    });

                }


                db.run(
                    `
                    UPDATE users
                    SET last_login_at =
                        CURRENT_TIMESTAMP
                    WHERE id = ?
                    `,
                    [user.id]
                );


                createSession(
                    user.id,
                    function (
                        sessionError,
                        rawToken
                    ) {

                        if (sessionError) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Unable to create login session."
                            });

                        }


                        setSessionCookie(
                            res,
                            rawToken
                        );


                        return res.json({
                            success: true,
                            message:
                                "Login successful.",
                            user: {
                                id:
                                    user.id,
                                name:
                                    user.name,
                                email:
                                    user.email,
                                phone:
                                    user.phone,
                                role:
                                    user.role
                            }
                        });

                    }
                );

            }
        );

    }
);


/* ============================================================
 * CURRENT USER
 * ============================================================ */

router.get(
    "/me",
    requireAuth,
    function (req, res) {

        res.json({
            success: true,
            user: {
                id:
                    req.user.id,
                name:
                    req.user.name,
                email:
                    req.user.email,
                phone:
                    req.user.phone,
                role:
                    req.user.role
            }
        });

    }
);


/* ============================================================
 * LOGOUT
 * ============================================================ */

router.post(
    "/logout",
    function (req, res) {

        const rawToken =
            req.cookies &&
            req.cookies.sql_learning_session;


        if (rawToken) {

            const tokenHash =
                crypto
                    .createHash("sha256")
                    .update(rawToken)
                    .digest("hex");


            db.run(
                `
                DELETE FROM auth_sessions
                WHERE token_hash = ?
                `,
                [tokenHash]
            );

        }


        clearSessionCookie(
            res
        );


        res.json({
            success: true,
            message:
                "Logged out successfully."
        });

    }
);


/* ============================================================
 * EXPORTS
 * ============================================================ */

/* ============================================================
 * INITIAL ADMIN BOOTSTRAP
 * ============================================================
 *
 * Set these server-side environment variables on Render/backend:
 *
 * ADMIN_EMAILS=your-email@example.com
 * ADMIN_PHONES=+91XXXXXXXXXX
 * ADMIN_NAME=Platform Admin
 * ADMIN_INITIAL_PASSWORD=<strong-secret>
 *
 * If ADMIN_INITIAL_PASSWORD is present, the server creates the
 * allowlisted admin account when it does not already exist.
 * No admin password is stored in source control.
 */

function ensureInitialAdmin(callback) {

    const adminEmail = String(
        process.env.ADMIN_EMAILS || ""
    )
        .split(",")
        .map(value => value.trim().toLowerCase())
        .find(Boolean);

    const adminPhone = String(
        process.env.ADMIN_PHONES || ""
    )
        .split(",")
        .map(value => value.trim())
        .find(Boolean) || null;

    const initialPassword = String(
        process.env.ADMIN_INITIAL_PASSWORD || ""
    );

    if (!adminEmail || !initialPassword) {
        return callback(null);
    }

    if (initialPassword.length < PASSWORD_MIN_LENGTH) {
        return callback(
            new Error(
                "ADMIN_INITIAL_PASSWORD must contain at least 8 characters."
            )
        );
    }

    const name = String(
        process.env.ADMIN_NAME || "Platform Admin"
    ).trim().slice(0, 120);

    const passwordHash = hashPassword(initialPassword);

    db.run(
        `
        INSERT OR IGNORE INTO users (
            name,
            email,
            phone,
            password_hash,
            role,
            is_active
        )
        VALUES (?, ?, ?, ?, 'admin', 1)
        `,
        [
            name || "Platform Admin",
            adminEmail,
            adminPhone,
            passwordHash
        ],
        function (insertError) {

            if (insertError) {
                return callback(insertError);
            }

            db.run(
                `
                UPDATE users
                SET
                    role = 'admin',
                    is_active = 1
                WHERE email = ?
                `,
                [adminEmail],
                function (updateError) {

                    if (updateError) {
                        return callback(updateError);
                    }

                    console.log(
                        "✅ Initial administrator account verified for:",
                        adminEmail
                    );

                    callback(null);
                }
            );
        }
    );
}


module.exports = {
    router,
    requireAuth,
    requireAdmin,
    ensureInitialAdmin
};

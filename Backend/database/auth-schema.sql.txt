/*
 * ============================================================
 * FILE PATH: Backend/database/auth-schema.sql
 * ============================================================
 * PURPOSE
 * -------
 * Incremental schema for authentication, sessions and feedback.
 *
 * IMPORTANT
 * ---------
 * This file intentionally does NOT recreate the existing
 * Healthcare/Banking learning tables.
 *
 * Every statement is idempotent so the migration can safely run
 * during backend startup without destroying existing data.
 *
 * ============================================================
 */


/* ============================================================
 * USERS
 * ============================================================ */

CREATE TABLE IF NOT EXISTS users (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,

    email TEXT NOT NULL UNIQUE COLLATE NOCASE,

    phone TEXT,

    password_hash TEXT NOT NULL,

    role TEXT NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin')),

    is_active INTEGER NOT NULL DEFAULT 1
        CHECK (is_active IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    last_login_at TEXT

);


/* ============================================================
 * AUTHENTICATION SESSIONS
 * ============================================================ */

CREATE TABLE IF NOT EXISTS auth_sessions (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


/* ============================================================
 * FEEDBACK / APPRECIATION / OTHER QUERY
 * ============================================================ */

CREATE TABLE IF NOT EXISTS feedback (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER,

    category TEXT NOT NULL
        CHECK (
            category IN (
                'appreciation',
                'feedback',
                'query'
            )
        ),

    name TEXT,

    email TEXT,

    message TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'new'
        CHECK (
            status IN (
                'new',
                'read',
                'resolved'
            )
        ),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL

);


/* ============================================================
 * INDEXES
 * ============================================================ */

CREATE INDEX IF NOT EXISTS
    idx_auth_sessions_token_hash
ON auth_sessions(token_hash);


CREATE INDEX IF NOT EXISTS
    idx_auth_sessions_user_id
ON auth_sessions(user_id);


CREATE INDEX IF NOT EXISTS
    idx_feedback_created_at
ON feedback(created_at);


CREATE INDEX IF NOT EXISTS
    idx_feedback_category
ON feedback(category);

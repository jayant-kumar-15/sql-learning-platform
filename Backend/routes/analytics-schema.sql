/*
 * ============================================================
 * FILE PATH: Backend/database/analytics-schema.sql
 * ============================================================
 * PURPOSE
 * -------
 * Stores anonymous traffic events for the public SQL Learning
 * Platform and supports daily, weekly, monthly and yearly reports.
 *
 * PRIVACY / COST DESIGN
 * ---------------------
 * - No raw IP address is stored.
 * - The browser's random session ID is hashed before storage.
 * - A unique constraint prevents repeated refreshes from creating
 *   multiple unique-session records for the same page on one day.
 * - Raw rows are retained so reporting can be changed later without
 *   rebuilding the analytics architecture.
 * ============================================================
 */

CREATE TABLE IF NOT EXISTS traffic_events (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    session_hash TEXT NOT NULL,

    page_path TEXT NOT NULL,

    page_title TEXT,

    referrer TEXT,

    visit_date TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP

);


CREATE UNIQUE INDEX IF NOT EXISTS
    ux_traffic_session_page_day
ON traffic_events(
    session_hash,
    page_path,
    visit_date
);


CREATE INDEX IF NOT EXISTS
    idx_traffic_visit_date
ON traffic_events(visit_date);


CREATE INDEX IF NOT EXISTS
    idx_traffic_page_path
ON traffic_events(page_path);

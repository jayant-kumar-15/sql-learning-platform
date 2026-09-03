/*
 * ============================================================
 * FILE PATH: Backend/database/analytics-schema.sql
 * ============================================================
 * PURPOSE
 * -------
 * Persistent PostgreSQL schema for anonymous public traffic.
 *
 * IMPORTANT TRAFFIC RULE
 * ----------------------
 * There is intentionally NO unique constraint on
 * (session_hash, page_path, visit_date).
 *
 * Every genuine page load is one traffic event, while the same
 * anonymous session can still be counted only once by the
 * dashboard's COUNT(DISTINCT session_hash) calculation.
 *
 * Heartbeat/live-presence information is kept separately in
 * analytics_sessions and does not increase historical page visits.
 * ============================================================
 */

CREATE TABLE IF NOT EXISTS traffic_events (
    id BIGSERIAL PRIMARY KEY,
    session_hash TEXT NOT NULL,
    page_path TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    visit_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_traffic_visit_date
ON traffic_events(visit_date);

CREATE INDEX IF NOT EXISTS idx_traffic_page_path
ON traffic_events(page_path);

CREATE INDEX IF NOT EXISTS idx_traffic_session_hash
ON traffic_events(session_hash);

CREATE INDEX IF NOT EXISTS idx_traffic_session_page_date
ON traffic_events(session_hash, page_path, visit_date);

CREATE TABLE IF NOT EXISTS analytics_sessions (
    session_hash TEXT PRIMARY KEY,
    page_path TEXT,
    page_title TEXT,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_last_seen
ON analytics_sessions(last_seen_at);

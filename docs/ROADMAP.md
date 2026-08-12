# Roadmap

## Phase 1

- Setup repository
- Freeze requirements
- Design homepage
- Design database explorer
- Design SQL editor UI

## Phase 2

- Build SQL editor
- Build query execution engine
- Build query history

## Phase 3

- Create healthcare database
- Create banking database

## Phase 4

- Create beginner to Advanced level tutorials
- Create SQL challenges
- Create hints and solutions system
- Create discussion section

## Phase 5

- Build admin dashboard

## Phase 6

- Deploy application

## Phase 7

- Testing
- Bug fixing
- GitHub deployment

## Phase 8

- Performance optimization
- Documentation
- Release v1.0

- current scope 10 Aug 2026
-                  CURRENT
                    │
                    ▼
        ┌─────────────────────┐
        │ Challenge UI        │ ✅
        │ 9 questions         │ ✅
        │ Difficulty system   │ ✅
        │ Expected output     │ ✅
        │ Schema viewer       │ ✅
        │ Result tables       │ ✅
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ SQLite WASM         │ 🚀 NEXT
        │ Browser SQL engine  │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Schema caching      │
        │ + faster loading    │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Better result       │
        │ comparison/validation│
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Expand questions    │
        │ 3 → 20/30 per level │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Query history       │
        │ Saved queries       │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Login + user        │
        │ progress            │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ User Sandbox        │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Admin + security    │
        └─────────────────────┘
for 12 Aug 2026

Sandbox UI — Snowflake-style layout you described:
Left: databases → tables
Right: SQL editor
Run Query
Results below
Download CSV
Browser-side SQLite Sandbox engine
Create database
Create tables
Insert/update/delete/select
IndexedDB persistence
Create Database/Table UI
Tutorial pages
Home/navigation polish
Guest-mode experience
Security limits + query protection
SEO
Final testing + deployment 

                    sqllearning.com
                          │
                          ▼
                    GitHub Pages
                          │
        ┌─────────────────┼──────────────────┐
        │                 │                  │
    Tutorials         Challenges          Sandbox
        │                 │                  │
   Static content    Browser SQLite     Browser SQLite
                          │                  │
                          └─────────┬────────┘
                                    │
                              Render Backend
                              (only when needed)



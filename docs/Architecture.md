Frontend:
- Next.js
- Tailwind CSS

Backend:
- Node.js
- Express

Database:
- PostgreSQL/SQL lite

Cache:
- Redis

Authentication:
- JWT

Deployment:
- Vercel + Railway

Storage:
- AWS S3


recent architecture for upto 500 users with 0 cost:

                    SQL Learning Platform
                           │
             ┌─────────────┴─────────────┐
             │                           │
       Practice Engine             Persistent Backend
             │                           │
        SQLite WASM                  API / Express
       runs in browser                   │
             │                    ┌──────┴──────┐
     Healthcare DB             Users / Progress
      Banking DB               Saved Queries
     Challenges                Comments / Admin
             │                       │
             │                 SQLite initially
             │                       ↓
             │              PostgreSQL later
             │
             └────────────── Frontend

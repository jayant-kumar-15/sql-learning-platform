SQL LEARNING PLATFORM — HOME + ADMIN ANALYTICS V1
=================================================

WHAT THIS VERSION CHANGES
-------------------------
1. Public users do NOT see Login / Sign Up anywhere on the homepage.
2. Public users can use the learning platform without creating an account.
3. Feedback / Appreciation / Other Query remains public.
4. Authentication is now intended only for the private administrator area.
5. Real anonymous traffic is collected and stored in SQLite.
6. Admin can view daily, weekly, monthly and yearly traffic.
7. Admin can view popular pages and public feedback.
8. Admin dashboard is marked noindex/nofollow.

FOLDER PLACEMENT
----------------
frontend/
├── home/
│   ├── home.html
│   ├── home.css              (keep your current existing CSS)
│   ├── home.js
│   └── learner-count.js
├── scripts/
│   └── traffic-tracker.js
└── admin/
    ├── admin-login.html
    ├── admin-login.css
    ├── admin-login.js
    ├── admin-dashboard.html
    ├── admin-dashboard.css
    └── admin-dashboard.js

Backend/
├── api/
│   └── server.js
├── routes/
│   ├── authRoutes.js
│   ├── feedbackRoutes.js
│   └── analyticsRoutes.js
└── database/
    ├── auth-schema.sql
    └── analytics-schema.sql

IMPORTANT EXISTING FILES
------------------------
Do NOT replace your existing queryRoutes.js, schemaRoutes.js,
db.js, main.css, Playground, Challenge, Tutorial or Sandbox files
with this package. The supplied server.js is based on the backend
version previously prepared for the Home/Auth work and adds the
analytics route/schema initialization.

PUBLIC USER AUTHENTICATION
--------------------------
There is intentionally no public login/signup UI.

The /api/auth/signup endpoint has also been restricted so that only
an email/phone matching the configured admin allowlist can create an
account. A normal public visitor cannot create a user account through
that endpoint.

ADMIN ENVIRONMENT VARIABLES
---------------------------
Configure these on the backend/Render environment, NOT in GitHub code:

ADMIN_EMAILS=your-admin-email@example.com
ADMIN_PHONES=+91XXXXXXXXXX
ADMIN_NAME=Platform Admin
ADMIN_INITIAL_PASSWORD=your-strong-admin-password

ADMIN_EMAILS may contain multiple comma-separated addresses.
ADMIN_PHONES may contain multiple comma-separated numbers.

On backend startup, if ADMIN_INITIAL_PASSWORD is supplied, the server
creates/verifies the allowlisted admin account. The password itself is
never written into the source code.

ADMIN URL
---------
After deployment, the private login page is:

frontend/admin/admin-login.html

The dashboard is:

frontend/admin/admin-dashboard.html

Do not add either page to the public homepage navigation.

TRAFFIC ANALYTICS
-----------------
Public pages load:

../scripts/traffic-tracker.js

The tracker sends an anonymous session identifier and page information
to:

POST /api/analytics/track

The backend hashes the browser session identifier before storing it.
No raw IP address is stored by this implementation.

The database table is:

traffic_events

A unique index prevents the same browser session from being counted
more than once for the same page on the same day.

The admin dashboard can request:

30d = daily
12w = weekly
12m = monthly
5y  = yearly

The underlying SQLite traffic rows remain the source of truth, so the
aggregation can be changed later without rebuilding the tracker.

COST / PERFORMANCE APPROACH
----------------------------
The public site does not call the backend for every normal learning
operation. The tracker makes only a lightweight analytics request.
Analytics failures are deliberately ignored by the browser so that a
traffic-service problem cannot stop Tutorial, Playground or Challenge
pages from working.

FEEDBACK
--------
Existing public feedback categories remain:

appreciation
feedback
query

The admin dashboard reads the existing /api/admin/feedback endpoint.

SEO
---
Public learning pages remain indexable.
The private admin login/dashboard use:

<meta name="robots" content="noindex, nofollow">

This prevents the private administration pages from becoming search
results.

TEST CHECKLIST
--------------
1. Open Home: no Login / Sign Up button should appear.
2. Open Home: traffic-tracker.js should load without blocking the page.
3. Visit Home and other public pages.
4. Check traffic_events in SQLite.
5. Configure admin environment variables.
6. Open admin-login.html and sign in.
7. Verify admin-dashboard.html opens.
8. Verify Daily / Weekly / Monthly / Yearly buttons change the chart.
9. Verify popular pages appear after traffic exists.
10. Verify feedback appears in the admin dashboard.
11. Verify a non-admin account cannot access /api/admin/*.
12. Verify public users can continue using the platform without login.

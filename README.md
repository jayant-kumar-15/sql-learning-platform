SQL Learning Platform — Deployment & Infrastructure Handover
Last reviewed: 5 September 2026
Production domain: sql-platform.com
1. Production architecture
Your current architecture is:
                         INTERNET
                            │
                            ▼
                 ┌─────────────────────┐
                 │   Cloudflare DNS     │
                 │   sql-platform.com   │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │     GitHub Pages    │
                 │   Frontend / Static │
                 └──────────┬──────────┘
                            │
              Browser API requests
                            │
                            ▼
                 ┌─────────────────────┐
                 │       Render        │
                 │   Express Backend   │
                 └──────────┬──────────┘
                            │
                            ▼
                 Persistent application
                       database
There are actually two database concepts in the application:
A. Browser SQLite
Used by the learning engine for:
Healthcare database
Banking database
Playground
Challenges
The browser loads:
frontend/assets/banking-schema.sql
frontend/assets/banking-seed.sql

frontend/assets/healthcare-schema.sql
frontend/assets/healthcare-seed.sql
The browser SQL engine initializes these locally using SQLite WASM. The backend does not need to load these fixed learning databases. This separation is explicitly documented in the backend code. �
server-cors-fixed-v2.js.txt
B. Backend persistent database
Used for application functionality such as:
Authentication
Sessions
Feedback
Analytics
Admin-related persistent information
The backend code describes these as persistent application services rather than the Healthcare/Banking learning engine. �
server-cors-fixed-v2.js.txt
2. Domain configuration
Production domain
https://sql-platform.com/
This is the domain users should use publicly.
DNS
The Cloudflare configuration we established is:
A     @     185.199.111.153
A     @     185.199.110.153
A     @     185.199.109.153
A     @     185.199.108.153

CNAME www   jayant-kumar-15.github.io
Cloudflare DNS is being used.
The records are configured as DNS only with TTL Auto.
Why the four A records matter
These are GitHub Pages' apex-domain addresses. They allow:
sql-platform.com
to resolve directly to GitHub Pages.
www
www.sql-platform.com
        ↓
jayant-kumar-15.github.io
3. GitHub Pages
Production frontend repository:
jayant-kumar-15/sql-learning-platform
Old GitHub Pages URL:
https://jayant-kumar-15.github.io/sql-learning-platform/
Production custom-domain URL:
https://sql-platform.com/
GitHub Pages custom domain was configured as:
sql-platform.com
HTTPS was enabled/enforced.
4. Root index.html
Your repository does not have the Home page directly at the root.
The actual Home currently lives at:
frontend/home/home.html
The root:
index.html
was configured as a redirect/entry point.
An earlier incorrect path was:
frontend/pages/home.html
That was corrected to:
frontend/home/home.html
This correction was what allowed the custom-domain site to work correctly.
Important
Do not casually reorganize the repository to move Home to root.
Your existing architecture is intentional.
5. Current important repository structure
The project currently follows this general architecture:
sql-learning-platform/
│
├── Backend/
│
├── Datasets/
│
├── docs/
│
├── frontend/
│   ├── admin/
│   ├── assets/
│   ├── authentication/
│   ├── home/
│   ├── js/
│   ├── pages/
│   ├── playground/
│   ├── sandbox/
│   ├── scripts/
│   ├── services/
│   ├── styles/
│   └── tutorial/
│
├── CNAME
├── Folder_structure.txt
├── README.md
├── README_missing_files.txt
├── index.html
├── robots.txt
├── sitemap.xml
└── favicon.ico
This architecture should be treated as the current production baseline.
6. Render backend
Production backend:
https://sql-learning-platform-5fu8.onrender.com
The frontend communicates with this backend.
For example, queryApi.js stores the backend URL centrally:
https://sql-learning-platform-5fu8.onrender.com
and sends SQL requests to:
/api/query
The API helper also supports the optional expectedOutput used by Challenges. � �
queryApi (1).js
queryApi (1).js
7. Backend API structure
The main server is:
Backend/api/server.js
Important route groups currently mounted:
/api
/api/schema
/api/auth...
/api/feedback...
/api/analytics...
The server explicitly mounts:
app.use("/api", queryRoutes);
app.use("/api/schema", schemaRoutes);

app.use("/api", authRoutes);
app.use("/api", feedbackRoutes);
app.use("/api", analyticsRoutes);
These routes are deliberately kept separate from the browser SQLite learning engine. �
server-cors-fixed-v2.js.txt
8. Health check
Backend health endpoint:
/api/health
It returns:
success: true
message: "SQL Learning API is running"
This endpoint is specifically intended to confirm that the Render backend is responding. �
server-cors-fixed-v2.js.txt
So in future, one of the first things to test if the website has backend problems is:
https://sql-learning-platform-5fu8.onrender.com/api/health
9. Database test
There is also:
/api/db-test
This checks the backend application's database connection. �
server-cors-fixed-v2.js.txt
This is useful when diagnosing:
Frontend works
        ↓
Backend responds
        ↓
Database connection?
10. CORS configuration — VERY IMPORTANT
This caused an actual production issue recently.
Originally the backend allowed only:
https://jayant-kumar-15.github.io
Therefore the custom domain:
https://sql-platform.com
was blocked by CORS.
We fixed this.
Current allowed origins are:
https://sql-platform.com
https://www.sql-platform.com
https://jayant-kumar-15.github.io
The old GitHub Pages origin was intentionally retained for compatibility. �
server-cors-fixed-v2.js.txt
Current CORS also permits:
GET
POST
PUT
DELETE
OPTIONS
and:
Content-Type
Authorization
with credentials enabled. �
server-cors-fixed-v2.js.txt
Critical future warning
If the domain changes again, remember:
Update the backend CORS whitelist.
Otherwise the frontend may work visually but API calls can fail.
11. Backend database — important correction about PostgreSQL
This is the most important thing I found while reviewing the saved backend files.
The current verified backend database configuration is still:
SQLite
Backend/config/db.js uses:
sqlite3
and connects to:
../database/sql-learning.db
The saved file explicitly creates a SQLite database connection. �
db(4).js
The backend server documentation also explicitly says the backend application database is SQLite. �
server(4).js
So I cannot honestly record this as:
PostgreSQL migration completed.
What this means
If we previously discussed creating a Render Persistent PostgreSQL database, that may have been part of the planned migration, but the current repository files I can verify do not show that migration being completed.
I don't want you to accidentally rely on incorrect deployment documentation.
12. What the backend SQLite database currently represents
The current architecture uses the backend database for persistent application functionality such as:
Authentication
Sessions
Feedback
Analytics
Admin-related application data
The server startup comments explicitly say database initialization is now limited to application tables such as authentication, sessions, feedback and analytics. �
server-cors-fixed-v2.js.txt
The Healthcare and Banking learning datasets remain browser-side.
13. Healthcare & Banking databases
These are not currently dependent on the Render persistent database.
Browser SQLite loads:
Banking
frontend/assets/banking-schema.sql
frontend/assets/banking-seed.sql
Healthcare
frontend/assets/healthcare-schema.sql
frontend/assets/healthcare-seed.sql
The browser engine chooses the appropriate schema/seed according to the selected database. �
browserSqlEngine(2).js
It then executes the schema and seed locally in SQLite. �
browserSqlEngine(2).js
This is an important architectural decision because it keeps the fixed learning databases inexpensive and independent of backend database traffic.
14. Current backend files that matter
The important backend structure is approximately:
Backend/
│
├── api/
│   └── server.js
│
├── config/
│   └── db.js
│
├── database/
│   ├── init.js
│   ├── schema.sql
│   ├── seed.sql
│   └── sql-learning.db
│
├── routes/
│   ├── queryRoutes.js
│   ├── schemaRoutes.js
│   ├── authRoutes.js
│   ├── feedbackRoutes.js
│   └── analyticsRoutes.js
│
└── services/
    ├── queryService.js
    └── resultComparator.js
Some exact files may have received revisions over time, but these are the important logical components reflected in the saved backend code.
15. init.js
The older initialization process reads:
database/schema.sql
database/seed.sql
and initializes the backend database. �
init.js
The newer server architecture has deliberately moved the fixed Healthcare/Banking learning database initialization away from this backend process.
So we should be careful with these older backend:
schema.sql
seed.sql
They should not automatically be treated as the current Healthcare/Banking production datasets.
16. Query API
Current query flow:
User writes SQL
       ↓
Frontend
       ↓
queryApi.js
       ↓
POST /api/query
       ↓
Render backend
       ↓
queryRoutes
       ↓
queryService
       ↓
resultComparator (Challenge)
       ↓
Response
       ↓
Frontend result display
queryRoutes.js validates the query, executes it through queryService, optionally compares it against Challenge expected output, and returns:
columns
rows
rowCount
resultsTruncated
executionTime
isCorrect
� �
queryRoutes.js
queryRoutes.js
17. Feedback system
The Home page sends feedback to:
/api/feedback
The backend stores the selected category and message.
Categories currently include:
appreciation
feedback
query
The Home JavaScript explicitly documents this persistence behavior. �
home%20%281%29-updated.js.txt

18. Analytics
The platform has anonymous traffic analytics.
The Admin dashboard currently provides:
Unique sessions · 30 days
Page visits · 30 days
Active days
New feedback
and traffic views:
Daily
Weekly
Monthly
Yearly
�
admin-dashboard.html
The current analytics design states:
anonymous browser sessions
no public account required
no raw IP address stored
weekly/monthly/yearly views calculated from stored events
�
admin-dashboard.html
19. Admin bootstrap
The server contains a private administrator bootstrap.
The important security principle is:
Admin credentials come from Render/server environment variables rather than being placed in the public frontend.
The server code explicitly documents this. �
server-cors-fixed-v2.js.txt
Important
Do not put the actual admin password or secrets into:
GitHub
HTML
JavaScript
README
public documentation
Keep them in Render environment variables.
I have intentionally not listed any secret values here.
20. queryApi.js
Important frontend/backend integration file:
frontend/js/queryApi.js
Its main responsibility is to keep the backend API URL in one location:
https://sql-learning-platform-5fu8.onrender.com
and call:
/api/query
�
queryApi (1).js
This is useful because if you eventually move the backend to another host, this is one of the important frontend files to check.
21. Schema API
Challenge's "View Table Schema" functionality currently calls:
/api/schema/{database}/{tables}
through the Render backend. �
challenge.js
So:
Challenge
   ↓
View Table Schema
   ↓
Render /api/schema
This is different from the browser SQLite loading mechanism.
22. Browser SQL engine
The browser engine is a major component of the current architecture.
It:
identifies Banking or Healthcare
loads corresponding .sql schema
loads corresponding seed data
initializes SQLite
executes queries locally
This is why the platform can provide interactive SQL practice without putting the entire fixed learning database behind the Render API. �
browserSqlEngine(2).js
23. Robots.txt
Production file:
robots.txt
Current content:
User-agent: *
Allow: /

Sitemap: https://sql-platform.com/sitemap.xml
This tells search engines they can crawl the site and points them to the sitemap.
24. Sitemap
Production sitemap:
https://sql-platform.com/sitemap.xml
It includes the major public pages such as:
Home
Tutorials
Challenges
Explorer
Playground
Sandbox
About
Contact
Privacy Policy
Terms
Disclaimer
Search Console successfully accepted the full sitemap URL.
25. Google Search Console
Current status from our deployment work:
Sitemap
Successfully submitted:
https://sql-platform.com/sitemap.xml
Pages
Search Console was showing:
Processing data, please check again in a day or so.
Core Web Vitals
There was not enough traffic/usage data yet for meaningful Core Web Vitals reporting.
That is normal for a new/small site.
26. PageSpeed result
We tested:
https://sql-platform.com/frontend/home/home.html
Results were approximately:
Performance       100
Accessibility     100
Best Practices     96
SEO               100
Agentic Browsing    2/2
So the current Home page performance baseline is very strong.
27. Favicon
A root-level:
favicon.ico
was added because the browser was requesting:
https://sql-platform.com/favicon.ico
and previously receiving:
404
After adding the favicon to repository root, that actual error was resolved.
28. Remaining browser warning
The only remaining console item we encountered was a yellow warning, not an application error:
feature_collector.js:23

using deprecated parameters for the initialization function;
pass a single object instead
This appears to be associated with an external/third-party component rather than one of your normal project files.
We deliberately did not create or modify a random feature_collector.js.
Current state:
Actual application errors: 0
Favicon 404: fixed
CORS: fixed
Remaining warning: non-blocking / external-looking
29. Legal pages
Created under:
frontend/pages/
including:
privacy-policy.html
terms.html
disclaimer.html
about.html
contact.html
These were added to support:
transparency
user trust
SEO/site quality
future AdSense application requirements
No fake contact email/address was invented.
30. AdSense status
Important distinction:
Implemented
The site structure is prepared to support future AdSense.
Not yet done
We have not confirmed an AdSense approval and should not treat the site as monetized yet.
Approval remains Google's decision.
31. Current production URLs
Main
https://sql-platform.com/
Backend
https://sql-learning-platform-5fu8.onrender.com
Backend health
https://sql-learning-platform-5fu8.onrender.com/api/health
Backend DB test
https://sql-learning-platform-5fu8.onrender.com/api/db-test
Sitemap
https://sql-platform.com/sitemap.xml
Robots
https://sql-platform.com/robots.txt
32. What is DONE
I'd mark these as completed/working:
Area
Status
GitHub repository
✅
GitHub Pages
✅
Custom domain
✅
Cloudflare DNS
✅
HTTPS
✅
Root domain
✅
Render backend
✅
Frontend → Render API
✅
CORS for custom domain
✅
/api/health
✅
Backend DB test
✅
Browser SQLite engine
✅
Healthcare dataset
✅
Banking dataset
✅
Playground
✅
Challenges
✅
Schema API
✅
Feedback API
✅
Analytics
✅
Admin dashboard
✅
robots.txt
✅
sitemap.xml
✅
Search Console sitemap
✅
Favicon
✅
Legal pages
✅
Mobile/desktop UI work
✅
Production domain deployment
✅
33. What is NOT yet verified / should remain on the TODO list
🔴 1. PostgreSQL migration
This is the biggest item.
The files I reviewed still show:
sqlite3
↓
database/sql-learning.db
not:
PostgreSQL
↓
DATABASE_URL
↓
pg / PostgreSQL driver
Therefore PostgreSQL migration should currently be considered NOT COMPLETED unless you have a newer repository version that is not represented in the saved files I could retrieve.
This is actually good that we caught it now.
🟡 2. Decide the final persistent database architecture
Before migrating, we should decide exactly what belongs in PostgreSQL.
My recommendation would be:
PostgreSQL
│
├── users/auth
├── sessions
├── feedback
├── analytics
├── saved queries
├── progress
└── future persistent user data
while keeping:
Healthcare
Banking
as browser SQLite datasets unless/ until there is a strong reason to move them server-side.
🟡 3. Verify Render persistent storage
We should document exactly what Render currently provides:
Web Service
Database
Persistent Disk
Environment Variables
Auto Deploy
Branch
Build Command
Start Command
These should eventually be recorded in the handover.
🟡 4. PostgreSQL migration validation
When we actually migrate, we should verify:
PostgreSQL connection
        ↓
tables created
        ↓
existing data migrated
        ↓
auth works
        ↓
feedback works
        ↓
analytics works
        ↓
admin works
        ↓
restart Render
        ↓
data still exists
The restart test is particularly important because persistence is the whole reason for moving away from local SQLite storage.
34. Most important future troubleshooting sequence
If your website ever stops working, don't start changing random files.
Use this order:
1. Open sql-platform.com
        ↓
2. Check browser console
        ↓
3. Check /api/health
        ↓
4. Check /api/db-test
        ↓
5. Check CORS
        ↓
6. Check Render logs
        ↓
7. Check database
        ↓
8. Only then modify code
This will save us a lot of unnecessary changes.
35. VERY IMPORTANT production rule
For your project, I recommend we officially adopt:
PRODUCTION
──────────
GitHub main repository
        ↓
sql-platform.com

DO NOT EXPERIMENT HERE


DEVELOPMENT
───────────
Separate DEV repository
        ↓
Test changes
        ↓
Mobile test
        ↓
Desktop test
        ↓
Backend test
        ↓
Approve
        ↓
Move only approved changes
This fits perfectly with what you just asked me about creating a separate testing repository.
36. Future migration plan
When we're ready, I recommend:
CURRENT

GitHub Pages
     +
Render Express
     +
SQLite backend
     +
Browser SQLite
becomes:
GitHub Pages
     +
Render Express
     +
Persistent PostgreSQL
     +
Browser SQLite
The browser SQLite remains responsible for the fixed learning datasets.
PostgreSQL becomes responsible for persistent application/user data.
That gives us a clean hybrid architecture:
                  SQL LEARNING PLATFORM
                           │
             ┌─────────────┴─────────────┐
             │                           │
       LEARNING DATA              APPLICATION DATA
             │                           │
      Browser SQLite              PostgreSQL
             │                           │
   Healthcare / Banking       Users / Sessions
   Playground / Challenges   Feedback / Analytics
                             Saved data / Progress
That's the architecture I'd recommend keeping long-term.
🔐 One final security note
This document intentionally does not contain:
Render passwords
PostgreSQL passwords
API secrets
Admin passwords
Cloudflare credentials
GitHub tokens
Environment-variable secret values
Those should never be put into a public README or handover document.
The one thing I want you to remember
If in the future you tell me:
"Continue from our SQL Platform deployment."
this is the baseline we should use:
sql-platform.com → Cloudflare → GitHub Pages → Render API → persistent application DB, with Healthcare/Banking running through browser SQLite.
And importantly, PostgreSQL should be treated as pending/unverified rather than already migrated, based on the actual backend files I was able to retrieve. The current backend db.js still uses SQLite. �

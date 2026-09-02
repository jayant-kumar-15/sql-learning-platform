/*
 * ============================================================
 * FILE PATH: frontend/playground/playground.js
 * ============================================================
 * PURPOSE
 * -------
 * Controller for the read-only SQL Playground.
 *
 * This page uses the same browser SQLite engine already used by
 * the platform's learning/challenge functionality. Banking and
 * Healthcare are fixed learning databases; users cannot modify
 * their permanent structure or seed data from this page.
 *
 * FEATURES
 * --------
 * - Banking / Healthcare database explorer
 * - Fold / unfold databases
 * - Explorer scrollbar
 * - Active database persistence
 * - USE database_name
 * - Multiple persistent query tabs
 * - Rename / close query tabs
 * - Selected-statement / cursor-statement / full-script execution
 * - Styled Describe dialog
 * - Separate Schema dialog
 * - Visual relationship/data-model dialog
 * - Results hidden until execution
 * - Compact results panel
 * - Drag results vertically
 * - Minimize / maximize / close results
 * - CSV download
 *
 * IMPORTANT
 * ---------
 * This file intentionally does NOT modify Sandbox code.
 * It only controls elements inside frontend/playground/.
 * ============================================================
 */

"use strict";

/* ============================================================
 * CONFIGURATION
 * ============================================================ */

const PLAYGROUND_STORAGE_KEY = "sqlLearningPlaygroundQueries_v3";
const PLAYGROUND_ACTIVE_DB_KEY = "sqlPlaygroundActiveDatabase";
const DEFAULT_RESULTS_HEIGHT = 150;
const MIN_RESULTS_HEIGHT = 88;
const MAX_RESULTS_HEIGHT_RATIO = 0.88;
const LEARNING_DATABASES = ["Banking", "Healthcare"];

/* ============================================================
 * DOM REFERENCES
 * ============================================================ */

const sqlEditor = document.getElementById("sql-editor");
const runQueryButton = document.getElementById("run-query-button");
const statusElement = document.getElementById("playground-status");
const databaseTree = document.getElementById("database-tree");
const searchInput = document.getElementById("database-search-input");
const activeDbElement = document.getElementById("active-database-name");
const queryTabs = document.getElementById("query-tabs");
const newQueryButton = document.getElementById("new-query-button");

const resultsSection = document.getElementById("results-section");
const resultsContainer = document.getElementById("results-container");
const resultsSummary = document.getElementById("results-summary");
const downloadButton = document.getElementById("download-results-button");
const minimizeButton = document.getElementById("minimize-results-button");
const maximizeButton = document.getElementById("maximize-results-button");
const closeResultsButton = document.getElementById("close-results-button");
const resizeHandle = document.getElementById("results-resize-handle");

const selectorOverlay = document.getElementById("table-selector-overlay");
const selectorModal = document.getElementById("table-selector-modal");
const selectorTitle = document.getElementById("table-selector-title");
const selectorList = document.getElementById("table-selector-list");
const closeSelector = document.getElementById("close-table-selector");

const detailsOverlay = document.getElementById("table-details-overlay");
const detailsModal = document.getElementById("table-details-modal");
const detailsTitle = document.getElementById("table-details-title");
const detailsContainer = document.getElementById("table-details-container");
const closeDetails = document.getElementById("close-table-details");

const relationshipsOverlay = document.getElementById("relationships-overlay");
const relationshipsModal = document.getElementById("relationships-modal");
const relationshipsContainer = document.getElementById("relationships-container");
const closeRelationships = document.getElementById("close-relationships");

const closeSidebar = document.getElementById("close-sidebar-button");
const mobileSidebarButton = document.getElementById("mobile-sidebar-button");
const mobileSidebarOverlay = document.getElementById("mobile-sidebar-overlay");

/*
 * Remember the original Explorer-button location so the mobile-only
 * DOM relocation can be reversed if the viewport returns to desktop.
 */
const mobileSidebarOriginalParent = mobileSidebarButton?.parentElement || null;
const mobileSidebarOriginalNextSibling = mobileSidebarButton?.nextSibling || null;

/* Mobile-only navigation control. Hidden by CSS on desktop. */
const mobileNavButton = document.getElementById("mobile-nav-button");

/* ============================================================
 * APPLICATION STATE
 * ============================================================ */

let databases = [];
let activeDatabase = localStorage.getItem(PLAYGROUND_ACTIVE_DB_KEY) || null;
let activeTable = null;
let latestResults = null;
let resultsHeight = DEFAULT_RESULTS_HEIGHT;
let resultsDragging = false;
let dragStartY = 0;
let dragStartHeight = 0;

let queryCounter = 1;
let activeQueryId = 1;
const queryState = new Map();
queryState.set(1, { name: "Query 1", sql: "" });

/* Databases are collapsed by default. The active database is opened. */
const expandedDatabases = new Set();

/* ============================================================
 * STARTUP
 * ============================================================ */

document.addEventListener("DOMContentLoaded", initializePlayground);

async function initializePlayground() {
    try {
        showStatus("Loading Playground databases...", "info");

        loadPersistedQueries();
        await loadLearningDatabases();
        restoreActiveDatabase();
        expandedDatabases.clear();
        if (activeDatabase) {
            expandedDatabases.add(activeDatabase);
        }

        renderDatabaseTree();
        renderQueryTabs();
        updateActiveDatabaseUI();
        hideResults();

        /*
         * ------------------------------------------------------------
         * MOBILE DATABASE EXPLORER PLACEMENT
         * ------------------------------------------------------------
         * The Explorer button belongs beside Query 1 on mobile, not
         * inside/under the platform header. Moving the existing button
         * here keeps the HTML unchanged and prevents the header from
         * becoming unnecessarily tall. Desktop behavior is untouched.
         * ------------------------------------------------------------
         */
        positionMobileExplorerButton();

        initializeEvents();

        showStatus("SQL Playground ready.", "success");
    } catch (error) {
        console.error("Playground initialization failed:", error);
        showStatus("Unable to load Playground: " + error.message, "error");
    }
}

/* ============================================================
 * LOAD BANKING / HEALTHCARE FROM BROWSER SQLITE
 * ============================================================
 *
 * We deliberately do not depend on /api/schema/databases here.
 * The Playground already has the authoritative learning databases
 * in browserSqlEngine. This prevents backend route differences from
 * breaking the Explorer, Describe, Schema or Relationships buttons.
 * ============================================================ */

async function loadLearningDatabases() {
    if (!window.browserSqlEngine || typeof window.browserSqlEngine.initialize !== "function") {
        throw new Error("Browser SQL engine is unavailable. Refresh the Playground.");
    }

    const loaded = [];

    for (const databaseName of LEARNING_DATABASES) {
        const db = await window.browserSqlEngine.initialize(databaseName);
        const tables = readDatabaseTables(db);
        loaded.push({
            name: databaseName,
            tables
        });
    }

    databases = loaded;

    /* Re-open the selected database after inspecting both databases. */
    if (activeDatabase && databases.some(db => db.name === activeDatabase)) {
        await window.browserSqlEngine.initialize(activeDatabase);
    }
}

function readDatabaseTables(db) {
    const tableRows = db.exec({
        sql: `
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
              AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `,
        rowMode: "object",
        returnValue: "resultRows"
    }) || [];

    return tableRows.map(row => {
        const name = String(row.name || "");
        return {
            name,
            columns: readTableColumns(db, name),
            foreignKeys: readForeignKeys(db, name),
            schemaSql: readSchemaSql(db, name),
            indexes: readIndexes(db, name)
        };
    });
}

function readTableColumns(db, tableName) {
    const safe = quoteIdentifier(tableName);

    return db.exec({
        sql: `PRAGMA table_info(${safe})`,
        rowMode: "object",
        returnValue: "resultRows"
    }) || [];
}

function readForeignKeys(db, tableName) {
    const safe = quoteIdentifier(tableName);

    return db.exec({
        sql: `PRAGMA foreign_key_list(${safe})`,
        rowMode: "object",
        returnValue: "resultRows"
    }) || [];
}

function readSchemaSql(db, tableName) {
    const safe = quoteIdentifier(tableName);

    const rows = db.exec({
        sql: `
            SELECT sql
            FROM sqlite_master
            WHERE type = 'table'
              AND name = ${quoteString(tableName)}
        `,
        rowMode: "object",
        returnValue: "resultRows"
    }) || [];

    return rows[0]?.sql || `CREATE TABLE ${safe} (...);`;
}

function readIndexes(db, tableName) {
    const safe = quoteString(tableName);

    return db.exec({
        sql: `
            SELECT name, sql
            FROM sqlite_master
            WHERE type = 'index'
              AND tbl_name = ${safe}
            ORDER BY name
        `,
        rowMode: "object",
        returnValue: "resultRows"
    }) || [];
}

/* ============================================================
 * DATABASE STATE
 * ============================================================ */

function restoreActiveDatabase() {
    if (!activeDatabase || !databases.some(db => db.name === activeDatabase)) {
        activeDatabase = databases[0]?.name || null;
    }

    if (activeDatabase) {
        localStorage.setItem(PLAYGROUND_ACTIVE_DB_KEY, activeDatabase);
    }
}

async function setActiveDatabase(name, options = {}) {
    const database = databases.find(db => db.name.toLowerCase() === String(name).toLowerCase());

    if (!database) {
        throw new Error(`Database '${name}' is not available in Playground.`);
    }

    activeDatabase = database.name;
    activeTable = null;
    localStorage.setItem(PLAYGROUND_ACTIVE_DB_KEY, activeDatabase);

    expandedDatabases.add(activeDatabase);
    updateActiveDatabaseUI();

    /* Ensure the browser engine is on the same database. */
    if (window.browserSqlEngine && typeof window.browserSqlEngine.initialize === "function") {
        await window.browserSqlEngine.initialize(activeDatabase);
    }

    renderDatabaseTree();

    if (!options.silent) {
        showStatus(`Active database changed to ${activeDatabase}.`, "success");
    }

    return true;
}

function updateActiveDatabaseUI() {
    const name = activeDatabase || "None";

    if (activeDbElement) {
        activeDbElement.textContent = name;
    }


    if (sqlEditor) {
        sqlEditor.setAttribute(
            "placeholder",
            `-- Active database: ${name}\n-- To change database: USE database_name;\n\n-- Write your SQL query here.\n\n-- Example:\nSELECT *\nFROM Patients;`
        );
    }
}

/* ============================================================
 * DATABASE EXPLORER
 * ============================================================ */

function renderDatabaseTree() {
    if (!databaseTree) return;

    const query = (searchInput?.value || "").trim().toLowerCase();
    databaseTree.replaceChildren();

    databases.forEach(database => {
        const databaseMatches = database.name.toLowerCase().includes(query);
        const matchingTables = database.tables.filter(table =>
            table.name.toLowerCase().includes(query)
        );

        if (query && !databaseMatches && matchingTables.length === 0) {
            return;
        }

        const item = document.createElement("div");
        item.className = "database-item";
        item.dataset.database = database.name;
        item.setAttribute("role", "treeitem");

        const header = document.createElement("button");
        header.type = "button";
        header.className = "database-header";
        header.setAttribute("aria-expanded", String(expandedDatabases.has(database.name)));
        header.innerHTML = `
            <span class="database-arrow" role="button" tabindex="0" aria-label="Toggle ${escapeHTML(database.name)} database">
                ${expandedDatabases.has(database.name) ? "▼" : "▶"}
            </span>
            <span class="database-icon">🗄️</span>
            <span class="database-name">${escapeHTML(database.name)}</span>
            ${database.name === activeDatabase ? '<span class="database-active-badge">ACTIVE</span>' : ""}
        `;

        const tableList = document.createElement("div");
        tableList.className = "table-list";

        const shouldShowTables = expandedDatabases.has(database.name) ||
            (query && matchingTables.length > 0);
        tableList.style.display = shouldShowTables ? "block" : "none";

        database.tables.forEach(table => {
            if (query && !databaseMatches && !table.name.toLowerCase().includes(query)) {
                return;
            }

            const tableElement = document.createElement("button");
            tableElement.type = "button";
            tableElement.className = "table-item";
            tableElement.innerHTML = `
                <span class="table-item-icon">▦</span>
                <span class="table-item-name">${escapeHTML(table.name)}</span>
            `;

            /*
             * Keep table rows visually neutral. Selecting a table must NOT
             * create the white highlighted-table effect that was previously
             * appearing in the explorer.
             */
            tableElement.classList.remove("selected");

            tableElement.addEventListener("click", async event => {
                event.preventDefault();
                event.stopPropagation();

                try {
                    await setActiveDatabase(database.name, { silent: true });
                    activeTable = { database: database.name, table: table.name };
                    expandedDatabases.add(database.name);
                    renderDatabaseTree();
                    showStatus(`Selected table: ${database.name}.${table.name}`, "info");
                } catch (error) {
                    showStatus(error.message, "error");
                }
            });

            tableList.appendChild(tableElement);
        });

        const databaseArrow = header.querySelector(".database-arrow");

        /*
         * The arrow is an explicit fold/unfold control.
         *
         * We deliberately do NOT call setActiveDatabase() here. Clicking the
         * arrow is only a UI action; it must not change the active database.
         * The expanded state lives in expandedDatabases, so it survives the
         * re-render that occurs after other explorer actions.
         */
        const toggleDatabase = event => {
            event.preventDefault();
            event.stopPropagation();

            if (expandedDatabases.has(database.name)) {
                expandedDatabases.delete(database.name);
            } else {
                expandedDatabases.add(database.name);
            }

            renderDatabaseTree();
        };

        databaseArrow?.addEventListener("click", toggleDatabase);
        databaseArrow?.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                toggleDatabase(event);
            }
        });

        /*
         * Clicking the database name/header keeps the existing behavior:
         * open the database and make it active. The arrow itself is handled
         * separately above so it can reliably fold/unfold.
         */
        header.addEventListener("click", async event => {
            if (event.target.closest(".database-arrow")) {
                return;
            }

            try {
                await setActiveDatabase(database.name, { silent: true });
                expandedDatabases.add(database.name);
                renderDatabaseTree();
            } catch (error) {
                showStatus(error.message, "error");
            }
        });

        item.appendChild(header);
        item.appendChild(tableList);
        databaseTree.appendChild(item);
    });

    if (!databaseTree.children.length) {
        databaseTree.innerHTML = `
            <div class="database-empty-state">
                No matching database or table found.
            </div>
        `;
    }
}

/* ============================================================
 * SQL STATEMENT PARSING
 * ============================================================ */

function splitSqlStatements(sql) {
    const statements = [];
    let current = "";
    let quote = null;
    let lineComment = false;
    let blockComment = false;

    for (let i = 0; i < sql.length; i += 1) {
        const char = sql[i];
        const next = sql[i + 1];

        if (lineComment) {
            current += char;
            if (char === "\n") lineComment = false;
            continue;
        }

        if (blockComment) {
            current += char;
            if (char === "*" && next === "/") {
                current += next;
                i += 1;
                blockComment = false;
            }
            continue;
        }

        if (!quote && char === "-" && next === "-") {
            current += char + next;
            i += 1;
            lineComment = true;
            continue;
        }

        if (!quote && char === "/" && next === "*") {
            current += char + next;
            i += 1;
            blockComment = true;
            continue;
        }

        if (quote) {
            current += char;
            if (char === quote) {
                if (next === quote) {
                    current += next;
                    i += 1;
                } else {
                    quote = null;
                }
            }
            continue;
        }

        if (char === "'" || char === '"' || char === "`") {
            quote = char;
            current += char;
            continue;
        }

        if (char === ";") {
            if (current.trim()) statements.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    if (current.trim()) statements.push(current.trim());
    return statements;
}

function splitStatementsWithPositions(sql) {
    const statements = [];
    let start = 0;
    let quote = null;
    let lineComment = false;
    let blockComment = false;

    for (let i = 0; i < sql.length; i += 1) {
        const char = sql[i];
        const next = sql[i + 1];

        if (lineComment) {
            if (char === "\n") lineComment = false;
            continue;
        }

        if (blockComment) {
            if (char === "*" && next === "/") {
                i += 1;
                blockComment = false;
            }
            continue;
        }

        if (!quote && char === "-" && next === "-") {
            i += 1;
            lineComment = true;
            continue;
        }

        if (!quote && char === "/" && next === "*") {
            i += 1;
            blockComment = true;
            continue;
        }

        if (quote) {
            if (char === quote) {
                if (next === quote) i += 1;
                else quote = null;
            }
            continue;
        }

        if (char === "'" || char === '"' || char === "`") {
            quote = char;
            continue;
        }

        if (char === ";") {
            const text = sql.slice(start, i).trim();
            if (text) statements.push({ text, start, end: i });
            start = i + 1;
        }
    }

    const finalText = sql.slice(start).trim();
    if (finalText) {
        statements.push({ text: finalText, start, end: sql.length });
    }

    return statements;
}

function getExecutionTarget() {
    const fullSql = sqlEditor?.value || "";
    const selected = sqlEditor?.value.slice(
        sqlEditor.selectionStart,
        sqlEditor.selectionEnd
    ).trim();

    if (selected) {
        return { statements: [selected], description: "selected SQL" };
    }

    const statements = splitStatementsWithPositions(fullSql);

    if (statements.length <= 1) {
        return { statements: statements.map(item => item.text), description: "SQL statement" };
    }

    const cursor = sqlEditor.selectionStart;
    const current = statements.find(item => cursor >= item.start && cursor <= item.end);

    if (current) {
        return { statements: [current.text], description: "statement under cursor" };
    }

    return { statements: statements.map(item => item.text), description: "SQL worksheet" };
}

/* ============================================================
 * ACTIVE-DATABASE TABLE VALIDATION
 * ============================================================
 *
 * The browser SQL engine is intentionally shared by the learning
 * databases. Before execution we therefore validate table references
 * against the currently active database ourselves.
 *
 * Example:
 *   Active database: Banking
 *   SELECT * FROM doctors;
 *
 * Result:
 *   doctors table is not present in Banking db.
 *
 * This keeps the Playground behavior deterministic and prevents a table
 * belonging to Healthcare from being executed while Banking is active.
 * The lookup is dynamic: any future table added to the loaded database
 * metadata is automatically included.
 * ============================================================ */
function validateTableReferences(statement) {
    if (!activeDatabase) {
        throw new Error("Please select or USE a database first.");
    }

    const activeDb = databases.find(
        database => database.name.toLowerCase() === activeDatabase.toLowerCase()
    );

    if (!activeDb) {
        throw new Error(`Database '${activeDatabase}' is not available in Playground.`);
    }

    const activeTables = new Set(
        activeDb.tables.map(table => table.name.toLowerCase())
    );

    /*
     * Build the complete table list from every loaded learning database.
     * We only reject a reference when it is a known table in another
     * learning database. Unknown names are left to SQLite so normal SQL
     * errors continue to be reported by the engine.
     */
    const allTables = new Map();

    databases.forEach(database => {
        database.tables.forEach(table => {
            allTables.set(table.name.toLowerCase(), database.name);
        });
    });

    /*
     * Detect table references in the common SQL clauses that introduce a
     * table name. This covers SELECT/FROM/JOIN, UPDATE, INSERT INTO,
     * DELETE FROM and common UPSERT-style INSERT statements.
     */
    const tableReferenceRegex = /\b(?:FROM|JOIN|UPDATE|INTO)\s+(?!\()([`"']?)([A-Za-z_][A-Za-z0-9_$]*)(?:\1)(?=\s|;|,|$)/gi;
    const deleteFromRegex = /\bDELETE\s+FROM\s+([`"']?)([A-Za-z_][A-Za-z0-9_$]*)(?:\1)/gi;

    const references = [];
    let match;

    while ((match = tableReferenceRegex.exec(statement)) !== null) {
        references.push(match[2]);
    }

    while ((match = deleteFromRegex.exec(statement)) !== null) {
        references.push(match[2]);
    }

    for (const tableName of references) {
        const normalized = tableName.toLowerCase();
        const owningDatabase = allTables.get(normalized);

        if (owningDatabase && !activeTables.has(normalized)) {
            throw new Error(`${tableName} table is not present in ${activeDatabase} db.`);
        }
    }
}

/* ============================================================
 * QUERY EXECUTION
 * ============================================================ */

async function executeCurrentQuery(options = {}) {
    const sql = sqlEditor?.value.trim() || "";

    if (!sql) {
        showStatus("Please enter a SQL query.", "error");
        return;
    }

    const target = options.executeAll
        ? { statements: splitSqlStatements(sql), description: "SQL worksheet" }
        : getExecutionTarget();

    if (!target.statements.length) {
        showStatus("No executable SQL statement was found.", "error");
        return;
    }

    runQueryButton.disabled = true;
    showStatus(`Executing ${target.description}...`, "info");

    try {
        let lastResult = null;

        for (const statement of target.statements) {
            const useMatch = statement.match(
                /^USE\s+["'`]?([A-Za-z0-9_-]+)["'`]?\s*$/i
            );

            if (useMatch) {
                await setActiveDatabase(useMatch[1], { silent: true });
                lastResult = {
                    success: true,
                    columns: ["Message"],
                    rows: [{ Message: `Database changed to ${activeDatabase}` }],
                    rowCount: 1,
                    executionTime: 0
                };
                continue;
            }

            if (!activeDatabase) {
                throw new Error("Please select or USE a database first.");
            }

            if (!window.browserSqlEngine || typeof window.browserSqlEngine.execute !== "function") {
                throw new Error("Browser SQL engine is unavailable. Refresh the Playground.");
            }

            /* Reject tables that belong to another learning database. */
            validateTableReferences(statement);

            lastResult = await window.browserSqlEngine.execute(statement, {
                database: activeDatabase
            });
        }

        displayResults(normalizeResult(lastResult));
        showStatus("Query executed successfully.", "success");
    } catch (error) {
        displayResults({
            success: false,
            columns: ["Error"],
            rows: [{ Error: error.message }],
            rowCount: 1,
            executionTime: 0,
            isError: true
        });
        showStatus("Query failed: " + error.message, "error");
    } finally {
        runQueryButton.disabled = false;
    }
}

function normalizeResult(result) {
    if (!result) {
        return { columns: [], rows: [], rowCount: 0, executionTime: 0 };
    }

    const rows = Array.isArray(result.rows)
        ? result.rows
        : Array.isArray(result.data)
            ? result.data
            : [];

    let columns = Array.isArray(result.columns) ? result.columns : [];

    if (!columns.length && rows.length) {
        columns = Object.keys(rows[0]);
    }

    return {
        ...result,
        columns,
        rows,
        rowCount: Number.isFinite(result.rowCount) ? result.rowCount : rows.length,
        executionTime: Number(result.executionTime) || 0
    };
}

/* ============================================================
 * RESULTS PANEL
 * ============================================================ */

function displayResults(data) {
    latestResults = normalizeResult(data);

    const columns = latestResults.columns;
    const rows = latestResults.rows;

    resultsSummary.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"} · ${latestResults.executionTime} ms`;

    if (!rows.length) {
        resultsContainer.innerHTML = `
            <div class="empty-results">
                <div class="empty-results-icon">▦</div>
                <p>No rows returned.</p>
            </div>
        `;
    } else {
        const table = document.createElement("table");
        table.className = "results-table";

        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        columns.forEach(column => {
            const th = document.createElement("th");
            th.textContent = column;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);

        const tbody = document.createElement("tbody");
        rows.forEach(row => {
            const tr = document.createElement("tr");
            columns.forEach(column => {
                const td = document.createElement("td");
                const value = row?.[column];
                td.textContent = value === null || value === undefined ? "NULL" : String(value);
                if (value === null || value === undefined) td.className = "result-null";
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        table.append(thead, tbody);
        resultsContainer.replaceChildren(table);
    }

    downloadButton.disabled = rows.length === 0;
    showResults();
}

function showResults() {
    resultsSection.classList.remove("results-hidden", "results-maximized", "results-minimized");
    resultsSection.style.height = `${resultsHeight}px`;
    resultsSection.style.flexBasis = `${resultsHeight}px`;
    resultsSection.style.maxHeight = "calc(100% - 80px)";
}

function hideResults() {
    resultsSection.classList.add("results-hidden");
    resultsSection.classList.remove("results-maximized", "results-minimized");
}

function initializeResultsResize() {
    if (!resizeHandle) return;

    resizeHandle.addEventListener("pointerdown", event => {
        if (resultsSection.classList.contains("results-maximized")) return;
        if (resultsSection.classList.contains("results-hidden")) return;

        resultsDragging = true;
        dragStartY = event.clientY;
        dragStartHeight = resultsSection.getBoundingClientRect().height;

        document.body.classList.add("results-resizing");
        resultsSection.classList.add("is-resizing");

        resizeHandle.setPointerCapture?.(event.pointerId);
        event.preventDefault();
    });

    document.addEventListener("pointermove", event => {
        if (!resultsDragging) return;

        const workspace = document.getElementById("playground-workspace");
        const available = workspace?.getBoundingClientRect().height || window.innerHeight;
        const maximum = Math.max(
            MIN_RESULTS_HEIGHT,
            Math.floor(available * MAX_RESULTS_HEIGHT_RATIO)
        );

        const nextHeight = clamp(
            dragStartHeight + (dragStartY - event.clientY),
            MIN_RESULTS_HEIGHT,
            maximum
        );

        resultsHeight = nextHeight;
        resultsSection.style.height = `${nextHeight}px`;
        resultsSection.style.flexBasis = `${nextHeight}px`;
    });

    const stopDragging = () => {
        if (!resultsDragging) return;
        resultsDragging = false;
        document.body.classList.remove("results-resizing");
        resultsSection.classList.remove("is-resizing");
    };

    document.addEventListener("pointerup", stopDragging);
    document.addEventListener("pointercancel", stopDragging);
}

function minimizeResults() {
    resultsSection.classList.remove("results-maximized");
    resultsSection.classList.toggle("results-minimized");

    if (resultsSection.classList.contains("results-minimized")) {
        resultsSection.style.height = "46px";
        resultsSection.style.flexBasis = "46px";
    } else {
        resultsSection.style.height = `${resultsHeight}px`;
        resultsSection.style.flexBasis = `${resultsHeight}px`;
    }
}

function maximizeResults() {
    resultsSection.classList.remove("results-minimized");
    resultsSection.classList.toggle("results-maximized");

    if (resultsSection.classList.contains("results-maximized")) {
        resultsSection.style.height = "100%";
        resultsSection.style.flexBasis = "auto";
        resultsSection.style.maxHeight = "none";
    } else {
        resultsSection.style.height = `${resultsHeight}px`;
        resultsSection.style.flexBasis = `${resultsHeight}px`;
    }
}

/* ============================================================
 * DESCRIBE / SCHEMA
 * ============================================================ */

function openTableSelector(mode) {
    if (!activeDatabase) {
        showStatus("Please select or USE a database first.", "error");
        return;
    }

    const database = getDatabase(activeDatabase);

    if (!database?.tables.length) {
        showStatus(`No tables are available in ${activeDatabase}.`, "info");
        return;
    }

    selectorTitle.textContent = mode === "describe"
        ? `Describe table · ${activeDatabase}`
        : `Schema · ${activeDatabase}`;

    selectorList.replaceChildren();

    database.tables.forEach(table => {
        const row = document.createElement("div");
        row.className = "table-selector-item";

        const name = document.createElement("div");
        name.className = "table-selector-table-name";
        name.innerHTML = `<span class="table-selector-table-icon">▦</span><span>${escapeHTML(table.name)}</span>`;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "table-selector-describe-button";
        button.textContent = mode === "describe" ? "Describe" : "View Schema";

        button.addEventListener("click", () => {
            activeTable = { database: activeDatabase, table: table.name };
            closeTableSelector();

            if (mode === "describe") {
                renderDescribe(table);
            } else {
                renderSchema(table);
            }
        });

        row.append(name, button);
        selectorList.appendChild(row);
    });

    openModal(selectorModal, selectorOverlay);
}

function renderDescribe(table) {
    detailsTitle.textContent = `Describe: ${activeDatabase}.${table.name}`;

    const columns = table.columns || [];
    const foreignKeys = table.foreignKeys || [];
    const foreignKeyByColumn = new Map();

    foreignKeys.forEach(fk => {
        foreignKeyByColumn.set(String(fk.from), fk);
    });

    detailsContainer.innerHTML = `
        <div class="table-details-heading">
            <div>
                <strong>${escapeHTML(table.name)}</strong>
                <span>${escapeHTML(activeDatabase)} · ${columns.length} columns</span>
            </div>
            <span class="metadata-badge">DESCRIBE</span>
        </div>
        <div class="schema-table-wrapper">
            <table class="schema-table">
                <thead>
                    <tr>
                        <th>Column</th>
                        <th>Data Type</th>
                        <th>Nullable</th>
                        <th>Key</th>
                        <th>Default</th>
                        <th>References</th>
                    </tr>
                </thead>
                <tbody>
                    ${columns.map(column => {
                        const fk = foreignKeyByColumn.get(String(column.name));
                        return `
                            <tr>
                                <td class="schema-column-name">${escapeHTML(column.name)}</td>
                                <td class="schema-type">${escapeHTML(column.type || "")}</td>
                                <td>${Number(column.notnull) === 1 ? '<span class="schema-required">NO</span>' : '<span class="schema-nullable">YES</span>'}</td>
                                <td>${Number(column.pk) > 0 ? '<span class="schema-primary-key">PK</span>' : "—"}${fk ? ' <span class="schema-foreign-key">FK</span>' : ""}</td>
                                <td>${escapeHTML(column.dflt_value ?? "—")}</td>
                                <td>${fk ? `${escapeHTML(fk.table)}.${escapeHTML(fk.to)}` : "—"}</td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;

    openModal(detailsModal, detailsOverlay);
}

function renderSchema(table) {
    detailsTitle.textContent = `Schema: ${activeDatabase}.${table.name}`;

    const foreignKeys = table.foreignKeys || [];
    const indexes = table.indexes || [];

    detailsContainer.innerHTML = `
        <div class="table-details-heading">
            <div>
                <strong>${escapeHTML(table.name)}</strong>
                <span>${escapeHTML(activeDatabase)} · CREATE TABLE definition</span>
            </div>
            <span class="metadata-badge schema-badge">SCHEMA</span>
        </div>

        <section class="schema-definition-card">
            <div class="schema-section-title">CREATE TABLE</div>
            <pre class="schema-definition">${escapeHTML(table.schemaSql || "No CREATE TABLE statement available.")}</pre>
        </section>

        <section class="schema-extra-section">
            <div class="schema-section-title">FOREIGN KEYS</div>
            ${foreignKeys.length ? `
                <div class="schema-list-card">
                    ${foreignKeys.map(fk => `
                        <div class="schema-list-row">
                            <span>${escapeHTML(fk.from)}</span>
                            <span class="schema-arrow">→</span>
                            <strong>${escapeHTML(fk.table)}.${escapeHTML(fk.to)}</strong>
                        </div>
                    `).join("")}
                </div>
            ` : '<div class="schema-empty-note">No foreign keys defined for this table.</div>'}
        </section>

        <section class="schema-extra-section">
            <div class="schema-section-title">INDEXES</div>
            ${indexes.length ? `
                <div class="schema-list-card">
                    ${indexes.map(index => `
                        <div class="schema-list-row index-row">
                            <strong>${escapeHTML(index.name)}</strong>
                            <code>${escapeHTML(index.sql || "Index definition unavailable")}</code>
                        </div>
                    `).join("")}
                </div>
            ` : '<div class="schema-empty-note">No explicit indexes defined for this table.</div>'}
        </section>
    `;

    openModal(detailsModal, detailsOverlay);
}

/* ============================================================
 * RELATIONSHIP / DATA MODEL VIEWER
 * ============================================================ */

function showRelationships() {
    if (!activeDatabase) {
        showStatus("Please select or USE a database first.", "error");
        return;
    }

    const database = getDatabase(activeDatabase);
    if (!database) return;

    renderRelationshipDiagram(database);
    openModal(relationshipsModal, relationshipsOverlay);
}

function renderRelationshipDiagram(database) {
    const tables = database.tables;
    const relationships = [];

    tables.forEach(table => {
        (table.foreignKeys || []).forEach(fk => {
            relationships.push({
                fromTable: table.name,
                fromColumn: fk.from,
                toTable: fk.table,
                toColumn: fk.to
            });
        });
    });

    const columnsPerRow = tables.length <= 4 ? tables.length : 4;
    const cardWidth = 220;
    const cardGapX = 55;
    const cardGapY = 75;
    const cardHeightEstimate = 170;
    const rowCount = Math.max(1, Math.ceil(tables.length / columnsPerRow));
    const canvasWidth = Math.max(900, columnsPerRow * cardWidth + (columnsPerRow - 1) * cardGapX + 80);
    const canvasHeight = Math.max(540, rowCount * cardHeightEstimate + (rowCount - 1) * cardGapY + 80);

    const positions = new Map();

    tables.forEach((table, index) => {
        const row = Math.floor(index / columnsPerRow);
        const column = index % columnsPerRow;
        const x = 35 + column * (cardWidth + cardGapX);
        const y = 35 + row * (cardHeightEstimate + cardGapY);
        positions.set(table.name, { x, y, width: cardWidth, height: cardHeightEstimate });
    });

    relationshipsContainer.innerHTML = `
        <div class="relationship-model-toolbar">
            <div>
                <strong>${escapeHTML(database.name)} Data Model</strong>
                <span>${tables.length} tables · ${relationships.length} foreign-key relationship${relationships.length === 1 ? "" : "s"}</span>
            </div>
            <div class="relationship-legend">
                <span><b>PK</b> Primary Key</span>
                <span><b>FK</b> Foreign Key</span>
            </div>
        </div>
        <div class="relationship-canvas" style="width:${canvasWidth}px;height:${canvasHeight}px;">
            <svg class="relationship-svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" aria-hidden="true">
                <defs>
                    <marker id="relationship-arrow-${Date.now()}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                        <path d="M0,0 L8,4 L0,8 Z" fill="#60a5fa"></path>
                    </marker>
                </defs>
            </svg>
            ${tables.map(table => renderRelationshipTable(table, positions.get(table.name))).join("")}
        </div>
        ${relationships.length ? `
            <div class="relationship-list">
                <div class="schema-section-title">RELATIONSHIPS</div>
                ${relationships.map(rel => `
                    <div class="relationship-list-row">
                        <span>${escapeHTML(rel.fromTable)}.${escapeHTML(rel.fromColumn)}</span>
                        <span class="schema-arrow">→</span>
                        <strong>${escapeHTML(rel.toTable)}.${escapeHTML(rel.toColumn)}</strong>
                    </div>
                `).join("")}
            </div>
        ` : `
            <div class="relationships-empty-state compact">
                <div class="relationships-empty-icon">🔗</div>
                <strong>No foreign-key relationships found.</strong>
                <p>The database does not currently define FK links between its tables.</p>
            </div>
        `}
    `;

    drawRelationshipLines(database, positions, canvasWidth, canvasHeight);
}

function renderRelationshipTable(table, position) {
    if (!position) return "";

    const foreignColumns = new Set((table.foreignKeys || []).map(fk => String(fk.from)));

    return `
        <article class="relationship-table" style="left:${position.x}px;top:${position.y}px;">
            <div class="relationship-table-header">
                <span>▦</span>
                <span>${escapeHTML(table.name)}</span>
            </div>
            <div class="relationship-table-body">
                ${(table.columns || []).map(column => `
                    <div class="relationship-column">
                        <span class="relationship-column-name">
                            ${Number(column.pk) > 0 ? '<b class="relationship-key pk">PK</b>' : ""}
                            ${foreignColumns.has(String(column.name)) ? '<b class="relationship-key fk">FK</b>' : ""}
                            ${escapeHTML(column.name)}
                        </span>
                        <span class="relationship-column-type">${escapeHTML(column.type || "")}</span>
                    </div>
                `).join("")}
            </div>
        </article>
    `;
}

function drawRelationshipLines(database, positions) {
    const svg = relationshipsContainer.querySelector(".relationship-svg");
    if (!svg) return;

    const markerId = svg.querySelector("marker")?.id;
    const relationships = [];

    database.tables.forEach(table => {
        (table.foreignKeys || []).forEach(fk => {
            relationships.push({
                fromTable: table.name,
                toTable: fk.table
            });
        });
    });

    relationships.forEach(rel => {
        const from = positions.get(rel.fromTable);
        const to = positions.get(rel.toTable);
        if (!from || !to) return;

        const fromX = from.x + from.width / 2;
        const fromY = from.y + from.height / 2;
        const toX = to.x + to.width / 2;
        const toY = to.y + to.height / 2;

        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const startX = fromX + (dx / distance) * 90;
        const startY = fromY + (dy / distance) * 60;
        const endX = toX - (dx / distance) * 90;
        const endY = toY - (dy / distance) * 60;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(startX));
        line.setAttribute("y1", String(startY));
        line.setAttribute("x2", String(endX));
        line.setAttribute("y2", String(endY));
        line.setAttribute("class", "relationship-line-svg");
        if (markerId) line.setAttribute("marker-end", `url(#${markerId})`);
        svg.appendChild(line);
    });
}

/* ============================================================
 * MODAL HELPERS
 * ============================================================ */

function openModal(modal, overlay) {
    if (!modal) return;
    modal.classList.remove("hidden");
    overlay?.classList.remove("hidden");
    overlay?.setAttribute("aria-hidden", "false");
}

function closeModal(modal, overlay) {
    modal?.classList.add("hidden");
    overlay?.classList.add("hidden");
    overlay?.setAttribute("aria-hidden", "true");
}

function closeTableSelector() {
    closeModal(selectorModal, selectorOverlay);
}

/* ============================================================
 * QUERY TABS / PERSISTENCE
 * ============================================================ */

function loadPersistedQueries() {
    try {
        const saved = JSON.parse(localStorage.getItem(PLAYGROUND_STORAGE_KEY) || "null");
        if (!Array.isArray(saved) || !saved.length) return;

        queryState.clear();
        queryCounter = 0;

        saved.forEach(item => {
            const id = Number(item.id);
            if (!Number.isInteger(id) || id < 1) return;
            queryCounter = Math.max(queryCounter, id);
            queryState.set(id, {
                name: String(item.name || `Query ${id}`),
                sql: String(item.sql || "")
            });
        });

        if (!queryState.size) {
            queryCounter = 1;
            queryState.set(1, { name: "Query 1", sql: "" });
        }

        const firstId = [...queryState.keys()][0];
        activeQueryId = queryState.has(activeQueryId) ? activeQueryId : firstId;
    } catch (error) {
        console.warn("Could not restore Playground queries:", error);
    }
}

function savePersistedQueries() {
    try {
        const data = [...queryState.entries()].map(([id, state]) => ({
            id,
            name: state.name,
            sql: state.sql
        }));
        localStorage.setItem(PLAYGROUND_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.warn("Could not save Playground queries:", error);
    }
}

function renderQueryTabs() {
    if (!queryTabs) return;

    queryTabs.replaceChildren();

    queryState.forEach((state, id) => {
        const tab = document.createElement("div");
        tab.className = `query-tab ${id === activeQueryId ? "active" : ""}`;
        tab.dataset.queryId = String(id);
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-selected", String(id === activeQueryId));

        const nameButton = document.createElement("button");
        nameButton.type = "button";
        nameButton.className = "query-tab-name-button";
        nameButton.textContent = state.name;
        nameButton.title = "Double-click to rename query";

        nameButton.addEventListener("click", () => switchQuery(id));
        nameButton.addEventListener("dblclick", event => {
            event.stopPropagation();
            renameQuery(id);
        });

        const close = document.createElement("button");
        close.type = "button";
        close.className = "query-tab-close";
        close.textContent = "×";
        close.title = "Close query";
        close.setAttribute("aria-label", `Close ${state.name}`);
        close.addEventListener("click", event => {
            event.stopPropagation();
            closeQuery(id);
        });

        tab.append(nameButton, close);
        queryTabs.appendChild(tab);
    });

    queryTabs.appendChild(newQueryButton);
}

function createQueryTab() {
    saveCurrentQuery();
    queryCounter += 1;

    queryState.set(queryCounter, {
        name: `Query ${queryCounter}`,
        sql: ""
    });

    activeQueryId = queryCounter;
    savePersistedQueries();
    renderQueryTabs();
    sqlEditor.value = "";
    updateActiveDatabaseUI();
    hideResults();
    sqlEditor.focus();
}

function switchQuery(id) {
    if (!queryState.has(id)) return;

    saveCurrentQuery();
    activeQueryId = id;
    sqlEditor.value = queryState.get(id).sql || "";
    renderQueryTabs();
    hideResults();
    sqlEditor.focus();
}

function renameQuery(id) {
    const state = queryState.get(id);
    if (!state) return;

    const name = window.prompt("Rename query", state.name);
    if (name === null) return;

    const cleaned = name.trim();
    if (!cleaned) {
        showStatus("Query name cannot be empty.", "error");
        return;
    }

    state.name = cleaned.slice(0, 80);
    savePersistedQueries();
    renderQueryTabs();
}

function closeQuery(id) {
    if (queryState.size <= 1) {
        showStatus("At least one query sheet must remain open.", "info");
        return;
    }

    const state = queryState.get(id);
    if (!state) return;

    if (!window.confirm(`Close ${state.name}?`)) return;

    queryState.delete(id);

    if (activeQueryId === id) {
        activeQueryId = [...queryState.keys()][0];
        sqlEditor.value = queryState.get(activeQueryId)?.sql || "";
    }

    savePersistedQueries();
    renderQueryTabs();
    hideResults();
}

function saveCurrentQuery() {
    const state = queryState.get(activeQueryId);
    if (!state || !sqlEditor) return;
    state.sql = sqlEditor.value;
    savePersistedQueries();
}

/* ============================================================
 * CSV DOWNLOAD
 * ============================================================ */

function downloadCSV(data) {
    if (!data || !Array.isArray(data.columns) || !Array.isArray(data.rows)) return;

    const lines = [data.columns.map(csvEscape).join(",")];

    data.rows.forEach(row => {
        lines.push(data.columns.map(column => csvEscape(row?.[column])).join(","));
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `playground-${(activeDatabase || "results").toLowerCase()}-results.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function csvEscape(value) {
    if (value === null || value === undefined) return "";
    const text = String(value).replace(/"/g, '""');
    return `"${text}"`;
}

/* ============================================================
 * EVENTS
 * ============================================================ */

function initializeEvents() {
    runQueryButton?.addEventListener("click", () => executeCurrentQuery());
    newQueryButton?.addEventListener("click", createQueryTab);

    document.getElementById("describe-table-button")?.addEventListener("click", () => openTableSelector("describe"));
    document.getElementById("view-schema-button")?.addEventListener("click", () => openTableSelector("schema"));
    document.getElementById("view-relationships-button")?.addEventListener("click", showRelationships);

    downloadButton?.addEventListener("click", () => downloadCSV(latestResults));
    minimizeButton?.addEventListener("click", minimizeResults);
    maximizeButton?.addEventListener("click", maximizeResults);
    closeResultsButton?.addEventListener("click", hideResults);

    closeSelector?.addEventListener("click", closeTableSelector);
    selectorOverlay?.addEventListener("click", closeTableSelector);

    closeDetails?.addEventListener("click", () => closeModal(detailsModal, detailsOverlay));
    detailsOverlay?.addEventListener("click", () => closeModal(detailsModal, detailsOverlay));

    closeRelationships?.addEventListener("click", () => closeModal(relationshipsModal, relationshipsOverlay));
    relationshipsOverlay?.addEventListener("click", () => closeModal(relationshipsModal, relationshipsOverlay));

    searchInput?.addEventListener("input", renderDatabaseTree);

    sqlEditor?.addEventListener("input", saveCurrentQuery);

    sqlEditor?.addEventListener("keydown", event => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && event.shiftKey) {
            event.preventDefault();
            executeCurrentQuery({ executeAll: true });
            return;
        }

        if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
            event.preventDefault();
            executeCurrentQuery();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        closeTableSelector();
        closeModal(detailsModal, detailsOverlay);
        closeModal(relationshipsModal, relationshipsOverlay);
        closeMobileNavigation();
        closeMobileSidebar();
    });

    closeSidebar?.addEventListener("click", closeMobileSidebar);
    mobileSidebarButton?.addEventListener("click", openMobileSidebar);
    mobileSidebarOverlay?.addEventListener("click", closeMobileSidebar);

    /*
     * MOBILE NAVIGATION
     * ------------------------------------------------------------
     * IMPORTANT: This is deliberately separate from the Database
     * Explorer button. The two controls must never share the same
     * click handler.
     */
    mobileNavButton?.addEventListener("click", toggleMobileNavigation);

    document.querySelectorAll(".platform-nav a").forEach(link => {
        link.addEventListener("click", closeMobileNavigation);
    });

    initializeResultsResize();

    const initialState = queryState.get(activeQueryId);
    if (initialState) {
        sqlEditor.value = initialState.sql || "";
    }
}

/* ============================================================
 * MOBILE DATABASE EXPLORER PLACEMENT
 * ============================================================
 * Keeps the Database Explorer button directly beside Query 1 on
 * mobile by placing the existing button inside #query-tabs. This makes
 * the button part of the normal document flow, so it scrolls naturally
 * with the worksheet instead of overlapping the sticky header.
 */
function positionMobileExplorerButton() {
    const explorerButton = document.getElementById("mobile-sidebar-button");
    const queryTabsContainer = document.getElementById("query-tabs-container");

    if (!explorerButton || !queryTabsContainer) return;

    /*
     * Only relocate the button on mobile. On desktop it stays in its
     * original DOM location so the desktop layout remains unchanged.
     */
    if (window.matchMedia("(max-width: 760px)").matches) {
        const queryTabs = queryTabsContainer.querySelector("#query-tabs");

        if (queryTabs && explorerButton.parentElement !== queryTabs) {
            queryTabs.insertBefore(explorerButton, queryTabs.firstElementChild);
        }
        return;
    }

    /* Restore the original desktop location when leaving mobile. */
    if (
        mobileSidebarOriginalParent &&
        explorerButton.parentElement !== mobileSidebarOriginalParent
    ) {
        mobileSidebarOriginalParent.insertBefore(
            explorerButton,
            mobileSidebarOriginalNextSibling
        );
    }
}

function toggleMobileNavigation() {
    const header = document.querySelector(".platform-header");
    if (!header) return;

    const isOpen = header.classList.toggle("mobile-nav-open");

    mobileNavButton?.setAttribute("aria-expanded", String(isOpen));
    mobileNavButton?.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
    );
}

function closeMobileNavigation() {
    const header = document.querySelector(".platform-header");
    if (!header) return;

    header.classList.remove("mobile-nav-open");

    mobileNavButton?.setAttribute("aria-expanded", "false");
    mobileNavButton?.setAttribute("aria-label", "Open navigation");
}

/*
 * Close the expanded platform navbar as soon as the user scrolls on
 * a mobile device. This mirrors the working Tutorial/Challenges
 * behavior and does not close the Database Explorer sidebar.
 */
window.addEventListener(
    "scroll",
    function () {
        if (!window.matchMedia("(max-width: 760px)").matches) return;
        closeMobileNavigation();
    },
    { passive: true }
);

/*
 * Re-check the Explorer button placement when the viewport changes
 * between mobile and desktop widths.
 */
window.addEventListener(
    "resize",
    positionMobileExplorerButton
);

function openMobileSidebar() {
    document.getElementById("database-sidebar")?.classList.add("mobile-open");
    mobileSidebarOverlay?.classList.add("visible");
}

function closeMobileSidebar() {
    document.getElementById("database-sidebar")?.classList.remove("mobile-open");
    mobileSidebarOverlay?.classList.remove("visible");
}

/* ============================================================
 * HELPERS
 * ============================================================ */

function getDatabase(name) {
    return databases.find(db => db.name === name) || null;
}

function quoteIdentifier(value) {
    return `"${String(value).replace(/"/g, '""')}"`;
}

function quoteString(value) {
    return `'${String(value).replace(/'/g, "''")}'`;
}

function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showStatus(message, type = "") {
    if (!statusElement) return;
    statusElement.textContent = message;
    statusElement.className = `playground-status${type ? ` ${type}` : ""}`;
}

/* ============================================================
 * DEBUG HELPER
 * ============================================================ */

window.getPlaygroundState = function () {
    return {
        activeDatabase,
        activeTable,
        databaseCount: databases.length,
        databases: databases.map(db => ({
            name: db.name,
            tableCount: db.tables.length
        })),
        activeQuery: activeQueryId,
        queries: [...queryState.entries()].map(([id, query]) => ({
            id,
            name: query.name,
            sqlLength: query.sql.length
        }))
    };
};

console.log("✅ frontend/playground/playground.js loaded successfully.");

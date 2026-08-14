/ FILE PATH: frontend/playground/playground.js * PURPOSE: Read-only SQL
practice engine/UI. IMPORTANT: * - Playground databases are supplied by
the backend. * - USE database_name is handled locally so active-database
UI * behaves like Sandbox. * - Other SQL is sent to /api/query. * -
Describe/Schema/Relationships are database-aware. * - Results are hidden
until execution and support resize, * minimize, maximize, close and CSV
download. */

const
PLAYGROUND_API_BASE_URL=“https://sql-learning-platform-5fu8.onrender.com”;

const sqlEditor=document.getElementById(“sql-editor”); const
runQueryButton=document.getElementById(“run-query-button”); const
statusElement=document.getElementById(“playground-status”); const
databaseTree=document.getElementById(“database-tree”); const
searchInput=document.getElementById(“database-search-input”); const
activeDbElement=document.getElementById(“active-database-name”); const
queryTabs=document.getElementById(“query-tabs”); const
newQueryButton=document.getElementById(“new-query-button”);

const resultsSection=document.getElementById(“results-section”); const
resultsContainer=document.getElementById(“results-container”); const
resultsSummary=document.getElementById(“results-summary”); const
downloadButton=document.getElementById(“download-results-button”); const
minimizeButton=document.getElementById(“minimize-results-button”); const
maximizeButton=document.getElementById(“maximize-results-button”); const
closeResultsButton=document.getElementById(“close-results-button”);
const resizeHandle=document.getElementById(“results-resize-handle”);

const selectorModal=document.getElementById(“table-selector-modal”);
const selectorTitle=document.getElementById(“table-selector-title”);
const selectorList=document.getElementById(“table-selector-list”); const
closeSelector=document.getElementById(“close-table-selector”);

const detailsModal=document.getElementById(“table-details-modal”); const
detailsTitle=document.getElementById(“table-details-title”); const
detailsContainer=document.getElementById(“table-details-container”);
const closeDetails=document.getElementById(“close-table-details”);

const relationshipsModal=document.getElementById(“relationships-modal”);
const
relationshipsContainer=document.getElementById(“relationships-container”);
const closeRelationships=document.getElementById(“close-relationships”);

const closeSidebar=document.getElementById(“close-sidebar-button”);

let databases=[]; let
activeDatabase=localStorage.getItem(“sqlPlaygroundActiveDatabase”)||null;
let activeTable=null; let latestResults=null; let queryCounter=1; let
activeQueryId=1; const queryContents=new Map([[1,“”]]); let
resultsHeight=230;

document.addEventListener(“DOMContentLoaded”,initializePlayground);

async function initializePlayground(){ try{ showStatus(“⏳ Loading
Playground databases…”,“info”); await loadDatabases();
restoreActiveDatabase(); renderDatabaseTree(); initializeEvents();
hideResults(); showStatus(“✅ SQL Playground ready.”,“success”);
}catch(error){ console.error(error); showStatus(“❌ Unable to load
Playground databases:”+error.message,“error”); } }

async function loadDatabases(){ const response=await
fetch(PLAYGROUND_API_BASE_URL+“/api/schema/databases”); const data=await
response.json(); if(!response.ok)throw new Error(data.message||“Database
list request failed.”); const
list=Array.isArray(data)?data:(Array.isArray(data.databases)?data.databases:[]);
databases=list.map(db=>({
name:String(db.name||db.database||db.databaseName||““),
tables:(db.tables||db.tableNames||[]).map(t=>typeof
t===”string”?{name:t}:{name:String(t.name||t.tableName||““),columns:t.columns||[]})
})).filter(db=>db.name); }

function restoreActiveDatabase(){
if(!activeDatabase||!databases.some(db=>db.name===activeDatabase))
activeDatabase=databases[0]?.name||null; updateActiveDatabase(); }

function setActiveDatabase(name){
if(!databases.some(db=>db.name===name)){
showStatus(❌ Database '${name}' is not available in Playground.,“error”);
return false; } activeDatabase=name; activeTable=null;
localStorage.setItem(“sqlPlaygroundActiveDatabase”,name);
updateActiveDatabase(); return true; }

function updateActiveDatabase(){
if(activeDbElement)activeDbElement.textContent=activeDatabase||“None”; }

function renderDatabaseTree(){ if(!databaseTree)return;
databaseTree.innerHTML=““; databases.forEach(db=>{ const
item=document.createElement(”div”); item.className=“database-item”;

        const header=document.createElement("div");
        header.className="database-header";
        header.innerHTML=`<span class="database-arrow">▶</span><span>🗄️</span><span>${escapeHTML(db.name)}</span>`;

        const list=document.createElement("div");
        list.className="table-list";

        db.tables.forEach(table=>{
            const el=document.createElement("div");
            el.className="table-item";
            el.innerHTML=`<span>▦</span><span>${escapeHTML(table.name)}</span>`;
            el.addEventListener("click",e=>{
                e.stopPropagation();
                setActiveDatabase(db.name);
                activeTable={database:db.name,table:table.name};
                showStatus(`Selected table: ${db.name}.${table.name}`,"info");
            });
            list.appendChild(el);
        });

        header.addEventListener("click",()=>{
            setActiveDatabase(db.name);
            const open=list.style.display!=="block";
            list.style.display=open?"block":"none";
            header.querySelector(".database-arrow").textContent=open?"▼":"▶";
        });

        item.append(header,list);
        databaseTree.appendChild(item);
    });

}

function splitSqlStatements(sql){ const result=[];let current=““;let
quote=null; for(let i=0;i<sql.length;i++){ const c=sql[i]; if(quote){
current+=c; if(c===quote&&sql[i-1]!==”\“)quote=null; continue; }
if(c===”‘“||c===’”’||c===“`”){quote=c;current+=c;continue;} if(c===“;”){
if(current.trim())result.push(current.trim()); current=““;continue; }
current+=c; } if(current.trim())result.push(current.trim()); return
result; }

async function executeCurrentQuery(){ const sql=sqlEditor.value.trim();
if(!sql){showStatus(“❌ Please enter a SQL query.”,“error”);return;}

    try{
        let last=null;
        for(const statement of splitSqlStatements(sql)){
            const use=statement.match(/^USE\s+["'`]?([A-Za-z0-9_]+)["'`]?$/i);
            if(use){
                if(!setActiveDatabase(use[1]))throw new Error(`Database '${use[1]}' is not available.`);
                last={columns:["message"],rows:[{message:`Database changed to ${use[1]}`}],executionTime:0};
                continue;
            }

            if(!activeDatabase)throw new Error("Please select or USE a database first.");

            last=typeof window.executeSqlQuery==="function"
                ?await window.executeSqlQuery(statement)
                :await executeFallback(statement);
        }
        displayResults(last||{columns:[],rows:[],executionTime:0});
        showStatus("✅ Query executed successfully.","success");
    }catch(error){
        displayResults({columns:["Error"],rows:[{Error:error.message}],executionTime:0});
        showStatus("❌ "+error.message,"error");
    }

}

async function executeFallback(statement){ const response=await
fetch(PLAYGROUND_API_BASE_URL+“/api/query”,{ method:“POST”,
headers:{“Content-Type”:“application/json”},
body:JSON.stringify({query:statement,database:activeDatabase}) }); const
data=await response.json(); if(!response.ok)throw new
Error(data.message||“Query execution failed.”); return data; }

function displayResults(data){ latestResults=data||{columns:[],rows:[]};
const
columns=Array.isArray(latestResults.columns)?latestResults.columns:[];
const rows=Array.isArray(latestResults.rows)?latestResults.rows:[];

    resultsSummary.textContent=`${rows.length} row${rows.length===1?"":"s"} • ${latestResults.executionTime||0} ms`;
    resultsContainer.innerHTML=rows.length?`
        <table class="results-table">
            <thead><tr>${columns.map(c=>`<th>${escapeHTML(c)}</th>`).join("")}</tr></thead>
            <tbody>${rows.map(r=>`<tr>${columns.map(c=>`<td>${escapeHTML(r[c]??"NULL")}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>`:`<div class="empty-results">Query executed successfully. No rows returned.</div>`;

    downloadButton.disabled=rows.length===0;
    showResults();

}

function showResults(){
resultsSection.classList.remove(“results-hidden”,“results-maximized”,“results-minimized”);
resultsSection.style.flexBasis=resultsHeight+“px”; }

function hideResults(){resultsSection.classList.add(“results-hidden”);}

function initializeResultsResize(){ let
dragging=false,startY=0,startHeight=0;
resizeHandle.addEventListener(“pointerdown”,e=>{
if(resultsSection.classList.contains(“results-maximized”))return;
dragging=true;startY=e.clientY;startHeight=resultsSection.getBoundingClientRect().height;
resizeHandle.setPointerCapture(e.pointerId); });
resizeHandle.addEventListener(“pointermove”,e=>{ if(!dragging)return;
const
h=Math.min(Math.max(startHeight+(startY-e.clientY),90),window.innerHeight*.85);
resultsHeight=h;resultsSection.style.flexBasis=h+“px”; });
resizeHandle.addEventListener(“pointerup”,()=>dragging=false);
resizeHandle.addEventListener(“pointercancel”,()=>dragging=false); }

function createQueryTab(){ queryCounter++;
queryContents.set(queryCounter,““); const
tab=document.createElement(”button”);
tab.className=“query-tab”;tab.dataset.queryId=queryCounter;tab.type=“button”;
tab.innerHTML=<span class="query-tab-name">Query ${queryCounter}</span>;
tab.addEventListener(“click”,()=>switchQuery(queryCounter));
queryTabs.insertBefore(tab,newQueryButton); switchQuery(queryCounter); }

function switchQuery(id){
queryContents.set(activeQueryId,sqlEditor.value);
activeQueryId=id;sqlEditor.value=queryContents.get(id)||““;
document.querySelectorAll(”.query-tab”).forEach(t=>t.classList.toggle(“active”,Number(t.dataset.queryId)===id));
sqlEditor.focus(); }

function openTableSelector(title){ if(!activeDatabase){showStatus(“❌
Please select or USE a database first.”,“error”);return;} const
db=databases.find(d=>d.name===activeDatabase);
if(!db?.tables.length){showStatus(ℹ️ No tables are available in ${activeDatabase}.,“info”);return;}

    selectorTitle.textContent=title;selectorList.innerHTML="";
    db.tables.forEach(table=>{
        const row=document.createElement("div");row.className="table-selector-row";
        row.innerHTML=`<strong>${escapeHTML(table.name)}</strong><button type="button">${title}</button>`;
        row.querySelector("button").addEventListener("click",()=>{
            activeTable={database:activeDatabase,table:table.name};
            selectorModal.classList.add("hidden");
            loadTableDetails(table.name);
        });
        selectorList.appendChild(row);
    });
    selectorModal.classList.remove("hidden");

}

async function loadTableDetails(table){
detailsTitle.textContent=${activeDatabase}.${table};
detailsContainer.innerHTML=<div class="empty-results">Loading...</div>;
detailsModal.classList.remove(“hidden”);

    try{
        const response=await fetch(`${PLAYGROUND_API_BASE_URL}/api/schema/table/${encodeURIComponent(activeDatabase)}/${encodeURIComponent(table)}`);
        const data=await response.json();
        if(!response.ok)throw new Error(data.message||"Unable to load table structure.");
        const cols=data.columns||data.schema||[];
        detailsContainer.innerHTML=cols.length?`
            <table class="table-details-table">
                <thead><tr><th>Column</th><th>Data Type</th><th>Nullable</th><th>Key</th></tr></thead>
                <tbody>${cols.map(c=>`<tr><td>${escapeHTML(c.name||c.column_name||"")}</td><td>${escapeHTML(c.type||c.data_type||"")}</td><td>${escapeHTML(c.nullable??c.is_nullable??"")}</td><td>${escapeHTML(c.key||c.constraint||"")}</td></tr>`).join("")}</tbody>
            </table>`:`<div class="empty-results">No column metadata available.</div>`;
    }catch(error){
        detailsContainer.innerHTML=`<div class="empty-results">❌ ${escapeHTML(error.message)}</div>`;
    }

}

async function showRelationships(){ if(!activeDatabase){showStatus(“❌
Please select or USE a database first.”,“error”);return;}
relationshipsModal.classList.remove(“hidden”);
relationshipsContainer.innerHTML=<div class="empty-results">Loading relationships...</div>;
try{ const response=await
fetch(${PLAYGROUND_API_BASE_URL}/api/schema/relationships/${encodeURIComponent(activeDatabase)});
const data=await response.json(); if(!response.ok)throw new
Error(data.message||“Unable to load relationships.”); const
rel=data.relationships||[];
relationshipsContainer.innerHTML=rel.length?<div class="relationship-diagram">${rel.map(r=>
                    <strong>${escapeHTML(r.fromTable||r.table||"")}</strong>
                    <span class="relationship-link">
                        ${escapeHTML(r.fromColumn||r.column||"")} →
                        ${escapeHTML(r.toTable||r.referencesTable||"")}.
                        ${escapeHTML(r.toColumn||r.referencesColumn||"")}
                    </span>
                </div>`).join("")}</div>`
            :`<div class="empty-results">No foreign-key relationships found.</div>`;
    }catch(error){
        relationshipsContainer.innerHTML=`<div class="empty-results">❌ ${escapeHTML(error.message)}</div>`;
    }

}

function downloadCSV(data){ if(!data?.columns||!data?.rows)return; const
lines=[data.columns.map(csvEscape).join(“,”)];
data.rows.forEach(row=>lines.push(data.columns.map(c=>csvEscape(row[c])).join(“,”)));
const blob=new Blob([lines.join(“”)],{type:“text/csv;charset=utf-8;”});
const url=URL.createObjectURL(blob); const
link=document.createElement(“a”);
link.href=url;link.download=“playground-results.csv”;
document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
}

function csvEscape(v){return
v==null?““:"${String(v).replace(/"/g,'""')}";}

function showStatus(message,type){ statusElement.textContent=message;
statusElement.className=“playground-status”+(type||““); }

function escapeHTML(v){ return
String(v).replace(/&/g,“&”).replace(/</g,“<”).replace(/>/g,“>”).replace(/“/g,”"“).replace(/’/g,”'“);
}

function initializeEvents(){
runQueryButton?.addEventListener(“click”,executeCurrentQuery);
newQueryButton?.addEventListener(“click”,createQueryTab);
document.getElementById(“describe-table-button”)?.addEventListener(“click”,()=>openTableSelector(“Describe”));
document.getElementById(“view-schema-button”)?.addEventListener(“click”,()=>openTableSelector(“Schema”));
document.getElementById(“view-relationships-button”)?.addEventListener(“click”,showRelationships);
downloadButton?.addEventListener(“click”,()=>downloadCSV(latestResults));
minimizeButton?.addEventListener(“click”,()=>resultsSection.classList.toggle(“results-minimized”));
maximizeButton?.addEventListener(“click”,()=>resultsSection.classList.toggle(“results-maximized”));
closeResultsButton?.addEventListener(“click”,hideResults);
closeSelector?.addEventListener(“click”,()=>selectorModal.classList.add(“hidden”));
closeDetails?.addEventListener(“click”,()=>detailsModal.classList.add(“hidden”));
closeRelationships?.addEventListener(“click”,()=>relationshipsModal.classList.add(“hidden”));
closeSidebar?.addEventListener(“click”,()=>document.getElementById(“database-sidebar”).classList.remove(“mobile-open”));
searchInput?.addEventListener(“input”,()=>{ const
q=searchInput.value.toLowerCase().trim();
document.querySelectorAll(“.database-item”).forEach(i=>i.style.display=i.textContent.toLowerCase().includes(q)?““:”none”);
});
sqlEditor?.addEventListener(“input”,()=>queryContents.set(activeQueryId,sqlEditor.value));
sqlEditor?.addEventListener(“keydown”,e=>{
if(e.key===“Enter”&&(e.ctrlKey||e.metaKey)){e.preventDefault();executeCurrentQuery();}
}); initializeResultsResize(); }

window.getPlaygroundState=()=>({ activeDatabase, activeTable,
databases:databases.map(d=>({name:d.name,tableCount:d.tables.length})),
activeQuery:activeQueryId });

console.log(“✅ Playground JavaScript loaded.”);

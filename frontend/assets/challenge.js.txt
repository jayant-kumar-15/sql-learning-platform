/*
 * ============================================================
 * FILE PATH: frontend/assets/challenge.js
 * ============================================================
 * PURPOSE
 * -------
 * SQL Learning Platform module.
 *
 * DOCUMENTATION
 * -------------
 * Keep this path header during future revisions. Add section
 * comments before every new major feature, state object,
 * event group, API call, or validation rule.
 *
 * Existing functionality is preserved in this documentation
 * revision.
 * ============================================================
 */

/* ============================================================
 * CHALLENGE CONFIGURATION
 * ============================================================
 */

const BEGINNER_FILE =
    "../assets/questions-beginner.json";

const INTERMEDIATE_FILE =
    "../assets/questions-intermediate.json";

const EXPERT_FILE =
    "../assets/questions-expert.json";


/* ============================================================
 * CHALLENGE V1 PROGRESSION CONFIGURATION
 * ============================================================ */

const CHALLENGE_V1_TARGETS = {
    Beginner: 50,
    Intermediate: 100,
    Expert: 50
};

const INTERMEDIATE_STAR_MILESTONES = [
    { completed: 20, stars: 1, title: "⭐ SQL Explorer", message: "🎉 First star unlocked! Keep going — the SQL gets tougher from here." },
    { completed: 40, stars: 2, title: "⭐⭐ Query Builder", message: "🔥 Two stars! JOINs and business logic are starting to feel natural." },
    { completed: 60, stars: 3, title: "⭐⭐⭐ SQL Analyst", message: "🚀 Three stars! Your SQL reasoning is getting serious." },
    { completed: 80, stars: 4, title: "⭐⭐⭐⭐ SQL Master", message: "💪 Four stars! You're one step away from Intermediate Mastery." },
    { completed: 100, stars: 5, title: "⭐⭐⭐⭐⭐ Intermediate Master", message: "🏆 Five stars! Intermediate SQL mastered. Expert territory awaits." }
];

const EXPERT_RANK_MILESTONES = [
    { completed: 10, rank: "BOSS", badge: "💀", message: "💀 Hey Boss! You've entered the SQL danger zone." },
    { completed: 20, rank: "KILLER", badge: "🔪", message: "🔪 Hey SQL Killer! Queries don't survive you anymore." },
    { completed: 30, rank: "GANGSTER", badge: "😎", message: "😎 Hey Gangster! You're making databases nervous." },
    { completed: 40, rank: "MONSTER", badge: "👹", message: "👹 Hey Monster! Even complex queries are afraid of you." },
    { completed: 50, rank: "DON", badge: "🙏", message: "🙏 Namaste DON! 👑 SQL now runs in YOUR territory." }
];

const INTERMEDIATE_MILESTONE_STORAGE_KEY =
    "sqlChallenge_Intermediate_Milestones";

const EXPERT_MILESTONE_STORAGE_KEY =
    "sqlChallenge_Expert_Rank_Milestones";


/* ============================================================
 * IMPORTANT
 *
 * allChallenges and challenges are created by challenges.js.
 * DO NOT declare them again here.
 * ============================================================
 */

let currentQuestionList = [];
let currentQuestion = null;


/* ============================================================
 * DOM ELEMENTS
 * ============================================================
 */

const hintButton =
    document.getElementById("hint-btn");

const hintText =
    document.getElementById("hint-text");

const solutionButton =
    document.getElementById("solution-btn");

const solutionText =
    document.getElementById("solution-text");

const beginnerButton =
    document.getElementById("beginner-btn");

const intermediateButton =
    document.getElementById("intermediate-btn");

const expertButton =
    document.getElementById("expert-btn");

const allQuestionsButton =
    document.getElementById("all-questions-btn");

const questionsPopup =
    document.getElementById("questions-popup");

const closePopupButton =
    document.getElementById("close-popup");

const overlay =
    document.getElementById("overlay");

const questionsGrid =
    document.getElementById("questions-grid");

const questionFilters =
    document.getElementById("question-filters");

const filterAll =
    document.getElementById("filter-all");

const filterBeginner =
    document.getElementById("filter-beginner");

const filterIntermediate =
    document.getElementById("filter-intermediate");

const filterExpert =
    document.getElementById("filter-expert");


/* ============================================================
 * DIFFICULTY START BUTTONS
 * ============================================================
 */

if (beginnerButton) {

    beginnerButton.addEventListener(
        "click",
        function () {

            openDifficultyQuestions(
                "Beginner"
            );

        }
    );

}

if (intermediateButton) {

    intermediateButton.addEventListener(
        "click",
        function () {

            openDifficultyQuestions(
                "Intermediate"
            );

        }
    );

}

if (expertButton) {

    expertButton.addEventListener(
        "click",
        function () {

            openDifficultyQuestions(
                "Expert"
            );

        }
    );

}


/* ============================================================
 * QUESTION DETAILS
 * ============================================================
 */

const questionTitle =
    document.getElementById("question-title");

const databaseName =
    document.getElementById("database-name");

const tableName =
    document.getElementById("table-name");

const questionText =
    document.getElementById("question-text");

const expectedOutputTable =
    document.getElementById("expected-output");


/* ============================================================
 * SCORE BOARD
 * ============================================================
 */

const totalScore =
    document.getElementById("total-score");

const completedCount =
    document.getElementById("completed-count");

const skippedCount =
    document.getElementById("skipped-count");

const remainingCount =
    document.getElementById("remaining-count");


/* ============================================================
 * PROGRESS
 * ============================================================
 */

const beginnerProgress =
    document.getElementById("easy-progress");

const intermediateProgress =
    document.getElementById("medium-progress");

const expertProgress =
    document.getElementById("expert-progress");

const beginnerFill =
    document.getElementById("easy-fill");

const intermediateFill =
    document.getElementById("medium-fill");

const expertFill =
    document.getElementById("expert-fill");


/* ============================================================
 * ACTIVE LEVEL + MILESTONE CELEBRATION DOM
 * ------------------------------------------------------------
 * Only the highest currently active level is shown in the header.
 * Milestone messages are shown separately in an animated popup.
 * ============================================================
 */

const activeLevelStatus =
    document.getElementById("active-level-status");

const milestoneCelebrationOverlay =
    document.getElementById(
        "milestone-celebration-overlay"
    );

const milestoneCelebrationIcon =
    document.getElementById(
        "milestone-celebration-icon"
    );

const milestoneCelebrationTitle =
    document.getElementById(
        "milestone-celebration-title"
    );

const milestoneCelebrationMessage =
    document.getElementById(
        "milestone-celebration-message"
    );

const milestoneCelebrationClose =
    document.getElementById(
        "milestone-celebration-close"
    );


/* ============================================================
 * NAVIGATION
 * ============================================================
 */

const previousQuestionButton =
    document.getElementById(
        "previous-question-btn"
    );

const nextQuestionButton =
    document.getElementById(
        "next-question-btn"
    );


/* ============================================================
 * QUERY
 * ============================================================
 */

const runButton =
    document.getElementById("run-query-btn");


/* ============================================================
 * HINT
 * ============================================================
 */

if (hintButton) {

    hintButton.addEventListener(
        "click",
        function () {

            if (
                hintText.style.display ===
                "none"
            ) {

                hintText.style.display =
                    "block";

                hintButton.textContent =
                    "🙈 Hide Hint";

            } else {

                hintText.style.display =
                    "none";

                hintButton.textContent =
                    "🔒 Show Hint";

            }

        }
    );

}


/* ============================================================
 * SOLUTION
 * ============================================================
 */

if (solutionButton) {

    solutionButton.addEventListener(
        "click",
        function () {

            if (!currentQuestion) {
                return;
            }

            const confirmAnswer =
                confirm(
                    "⚠️ Viewing the solution will make this question ineligible for points.\n\nDo you want to continue?"
                );

            if (!confirmAnswer) {
                return;
            }

            currentQuestion.status =
                "skipped";

            saveDifficultyProgress(
                currentQuestion.difficulty
            );

            solutionText.textContent =
                currentQuestion.solution ||
                currentQuestion.solution_sql ||
                "";

            solutionText.style.display =
                "block";

            solutionButton.textContent =
                "👀 Solution Viewed";

            updateScoreBoard(
                allChallenges
            );

            loadQuestions(
                currentQuestionList
            );

        }
    );

}


/* ============================================================
 * EXPECTED OUTPUT
 * ============================================================
 */

function renderExpectedOutput(question) {

    if (!expectedOutputTable) {
        return;
    }

    expectedOutputTable.innerHTML = "";

    const output =
        question.expectedOutput;

    if (
        !Array.isArray(output) ||
        output.length === 0
    ) {

        const row =
            document.createElement("tr");

        const cell =
            document.createElement("td");

        cell.textContent =
            "No expected output available.";

        row.appendChild(cell);

        expectedOutputTable.appendChild(row);

        return;
    }


    /*
     * Get all columns from all rows.
     */

    const columns = [];

    output.forEach(function (row) {

        Object.keys(row).forEach(
            function (column) {

                if (
                    !columns.includes(column)
                ) {

                    columns.push(column);

                }

            }
        );

    });


    /*
     * Header
     */

    const thead =
        document.createElement("thead");

    const headerRow =
        document.createElement("tr");

    columns.forEach(function (column) {

        const th =
            document.createElement("th");

        th.textContent = column;

        headerRow.appendChild(th);

    });

    thead.appendChild(headerRow);


    /*
     * Body
     */

    const tbody =
        document.createElement("tbody");

    output.forEach(function (row) {

        const tr =
            document.createElement("tr");

        columns.forEach(function (column) {

            const td =
                document.createElement("td");

            const value =
                row[column];

            if (
                value === null ||
                value === undefined
            ) {

                td.textContent = "";

            } else {

                td.textContent =
                    String(value);

            }

            tr.appendChild(td);

        });

        tbody.appendChild(tr);

    });


    expectedOutputTable.appendChild(thead);

    expectedOutputTable.appendChild(tbody);

}


/* ============================================================
 * DYNAMIC EXPECTED OUTPUT
 * ============================================================
 * The visible Expected Output is refreshed from the trusted solution
 * against the CURRENT Banking/Healthcare dataset. This prevents stale
 * V1 sample output from becoming misleading after seed expansion.
 * The question ID guard prevents an older async response from replacing
 * the output of a newer question.
 * ============================================================
 */
async function refreshDynamicExpectedOutput(question) {

    if (
        !question ||
        !window.browserSqlEngine ||
        typeof window.browserSqlEngine.getReferenceResult !== "function"
    ) {
        return;
    }

    const solutionQuery =
        typeof question.solution === "string"
            ? question.solution.trim()
            : (
                typeof question.solution_sql === "string"
                    ? question.solution_sql.trim()
                    : ""
            );

    if (!solutionQuery) {
        return;
    }

    try {

        const referenceRows =
            await window.browserSqlEngine.getReferenceResult(
                question.database,
                solutionQuery
            );

        if (
            currentQuestion &&
            currentQuestion.id === question.id
        ) {

            renderExpectedOutput({
                ...question,
                expectedOutput: referenceRows
            });

        }

    } catch (error) {

        console.warn(
            "⚠️ Dynamic Expected Output refresh failed:",
            error
        );

        if (
            currentQuestion &&
            currentQuestion.id === question.id
        ) {
            renderExpectedOutput(question);
        }

    }
}


/* ============================================================
 * SHOW QUESTION
 * ============================================================
 */

function showQuestion(question) {

    if (!question) {
        return;
    }

    currentQuestion =
        question;


    console.log(
        "CURRENT QUESTION:",
        currentQuestion
    );

    if (
    currentQuestion &&
    typeof preloadChallengeDatabase ===
        "function"
) {

    preloadChallengeDatabase(
        currentQuestion.database
    );

    }


    questionTitle.textContent =
        "Question " +
        question.id;


    databaseName.textContent =
        question.database || "";


    tableName.textContent =
    question.tables
        ? question.tables.join(", ")
        : "";


    questionText.textContent =
        question.question || "";


    hintText.textContent =
        question.hint || "";


    solutionText.textContent =
        question.solution ||
        question.solution_sql ||
        "";


    /*
     * Expected output
     */

    renderExpectedOutput(
        question
    );

    /* Refresh stale static output using the live reference solution. */
    refreshDynamicExpectedOutput(
        question
    );


    /*
     * Reset hint/solution visibility
     */

    hintText.style.display =
        "none";

    solutionText.style.display =
        "none";


    hintButton.textContent =
        "🔒 Show Hint";


    if (
        question.status ===
        "skipped"
    ) {

        solutionButton.textContent =
            "👀 Solution Viewed";

    } else {

        solutionButton.textContent =
            "🔒 View Solution";

    }


    /*
     * Clear previous query
     */

    const sqlEditor =
        document.getElementById(
            "sql-editor"
        );

    if (sqlEditor) {

        sqlEditor.value = "";

    }


    /*
     * Hide previous results
     */

    const resultsContainer =
        document.getElementById(
            "query-results-container"
        );

    if (resultsContainer) {

        resultsContainer.style.display =
            "none";

    }


    const queryResultStatus =
        document.getElementById(
            "query-result-status"
        );

    if (queryResultStatus) {

        queryResultStatus.textContent = "";

    }

}


/* ============================================================
 * OPEN / CLOSE POPUP
 * ============================================================
 */

function openQuestionsPopup() {

    if (!questionsPopup) {
        return;
    }

    questionsPopup.style.display =
        "block";

    overlay.style.display =
        "block";

}


function closeQuestionsPopup() {

    if (!questionsPopup) {
        return;
    }

    questionsPopup.style.display =
        "none";

    overlay.style.display =
        "none";

}


/* ============================================================
 * ACTIVE FILTER
 * ============================================================
 */

function setActiveFilter(
    activeButton
) {

    [
        filterAll,
        filterBeginner,
        filterIntermediate,
        filterExpert
    ].forEach(function (button) {

        if (button) {

            button.classList.remove(
                "active"
            );

        }

    });


    if (activeButton) {

        activeButton.classList.add(
            "active"
        );

    }

}


/* ============================================================
 * LOAD QUESTIONS INTO POPUP
 * ============================================================
 */

function loadQuestions(
    questionList
) {

    if (!questionsGrid) {
        return;
    }


    if (!Array.isArray(questionList)) {

        questionList =
            [];

    }


    currentQuestionList =
        questionList;


    questionsGrid.innerHTML =
        "";


    questionList.forEach(
        function (challenge) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "question-popup-card";


            let statusIcon =
                "❌";


            if (
                challenge.status ===
                "completed"
            ) {

                statusIcon =
                    "✅";

            } else if (
                challenge.status ===
                "skipped"
            ) {

                statusIcon =
                    "⏭️";

            }


            card.innerHTML = `

                <div class="question-popup-text">

                    <strong>
                        ${challenge.id}.
                        ${challenge.question}
                    </strong>

                </div>

                <div class="question-popup-actions">

                    <span class="question-status">
                        ${statusIcon}
                    </span>

                    <button
                        type="button"
                        class="popup-start-btn"
                    >
                        Start
                    </button>

                </div>

            `;


            const startButton =
                card.querySelector(
                    ".popup-start-btn"
                );


            startButton.addEventListener(
                "click",
                function () {

                    showQuestion(
                        challenge
                    );

                    closeQuestionsPopup();

                }
            );


            questionsGrid.appendChild(
                card
            );

        }
    );

}


/* ============================================================
 * DIFFICULTY POPUP
 * ============================================================
 */

function openDifficultyQuestions(difficulty) {

    console.log(
        "Opening difficulty:",
        difficulty
    );

    const filteredQuestions =
        allChallenges.filter(function (question) {

            return question.difficulty
                .trim()
                .toLowerCase() ===
                difficulty
                    .trim()
                    .toLowerCase();

        });

    console.log(
        "Filtered questions:",
        filteredQuestions
    );

    console.log(
        "Number of questions:",
        filteredQuestions.length
    );

    currentQuestionList =
        filteredQuestions;

    // Populate only this difficulty
    loadQuestions(
        filteredQuestions
    );

    // Hide filters for specific difficulty
    if (questionFilters) {

        questionFilters.style.display =
            "none";

    }

    // Open popup
    openQuestionsPopup();

}


/* ============================================================
 * BEGINNER / INTERMEDIATE / EXPERT BUTTONS
 * ============================================================
 */

if (beginnerButton) {

    beginnerButton.addEventListener(
        "click",
        function () {

            openDifficultyQuestions(
                "Beginner"
            );

        }
    );

}


if (intermediateButton) {

    intermediateButton.addEventListener(
        "click",
        function () {

            openDifficultyQuestions(
                "Intermediate"
            );

        }
    );

}


if (expertButton) {

    expertButton.addEventListener(
        "click",
        function () {

            openDifficultyQuestions(
                "Expert"
            );

        }
    );

}


/* ============================================================
 * VIEW ALL QUESTIONS
 * ============================================================
 */

if (allQuestionsButton) {

    allQuestionsButton.addEventListener(
        "click",
        function () {

            loadQuestions(
                allChallenges
            );

            setActiveFilter(
                filterAll
            );

            if (questionFilters) {

                questionFilters.style.display =
                    "flex";

            }

            openQuestionsPopup();

        }
    );

}


/* ============================================================
 * CLOSE POPUP
 * ============================================================
 */

if (closePopupButton) {

    closePopupButton.addEventListener(
        "click",
        function () {

            closeQuestionsPopup();

        }
    );

}


if (overlay) {

    overlay.addEventListener(
        "click",
        function () {

            closeQuestionsPopup();

        }
    );

}


/* ============================================================
 * FILTERS
 * ============================================================
 */

function filterQuestions(
    difficulty
) {

    let filteredQuestions;


    if (difficulty === "All") {

        filteredQuestions =
            allChallenges;

    } else {

        filteredQuestions =
            allChallenges.filter(
                function (question) {

                    return (
                        question.difficulty ===
                        difficulty
                    );

                }
            );

    }


    loadQuestions(
        filteredQuestions
    );

}


if (filterAll) {

    filterAll.addEventListener(
        "click",
        function () {

            setActiveFilter(
                filterAll
            );

            filterQuestions(
                "All"
            );

        }
    );

}


if (filterBeginner) {

    filterBeginner.addEventListener(
        "click",
        function () {

            setActiveFilter(
                filterBeginner
            );

            filterQuestions(
                "Beginner"
            );

        }
    );

}


if (filterIntermediate) {

    filterIntermediate.addEventListener(
        "click",
        function () {

            setActiveFilter(
                filterIntermediate
            );

            filterQuestions(
                "Intermediate"
            );

        }
    );

}


if (filterExpert) {

    filterExpert.addEventListener(
        "click",
        function () {

            setActiveFilter(
                filterExpert
            );

            filterQuestions(
                "Expert"
            );

        }
    );

}


/* ============================================================
 * NAVIGATION
 * ============================================================
 */

if (previousQuestionButton) {

    previousQuestionButton.addEventListener(
        "click",
        function () {

            if (
                currentQuestionList.length ===
                0
            ) {

                return;

            }


            const currentIndex =
                currentQuestionList.findIndex(
                    function (question) {

                        return (
                            question.id ===
                            currentQuestion.id
                        );

                    }
                );


            if (currentIndex > 0) {

                showQuestion(
                    currentQuestionList[
                        currentIndex - 1
                    ]
                );

            }

        }
    );

}


if (nextQuestionButton) {

    nextQuestionButton.addEventListener(
        "click",
        function () {

            if (
                currentQuestionList.length ===
                0
            ) {

                return;

            }


            const currentIndex =
                currentQuestionList.findIndex(
                    function (question) {

                        return (
                            question.id ===
                            currentQuestion.id
                        );

                    }
                );


            if (
                currentIndex >= 0 &&
                currentIndex <
                    currentQuestionList.length - 1
            ) {

                showQuestion(
                    currentQuestionList[
                        currentIndex + 1
                    ]
                );

            }

        }
    );

}


/* ============================================================
 * SAVE PROGRESS
 * ============================================================
 */

function saveDifficultyProgress(
    difficulty
) {

    const questions =
        allChallenges.filter(
            function (question) {

                return (
                    question.difficulty ===
                    difficulty
                );

            }
        );


    localStorage.setItem(
        "sqlChallenges_" +
        difficulty,
        JSON.stringify(
            questions
        )
    );

}


/* ============================================================
 * SCORE BOARD
 *
 * Exposed on window so challenges.js can call it.
 * ============================================================
 */

window.updateScoreBoard =
    function updateScoreBoard(
        data = allChallenges,
        options = {}
    ) {

        if (!Array.isArray(data)) {
            return;
        }


        let score = 0;

        let completed = 0;

        let skipped = 0;

        let remaining = 0;


        let beginnerTotal = 0;
        let beginnerCompleted = 0;


        let intermediateTotal = 0;
        let intermediateCompleted = 0;


        let expertTotal = 0;
        let expertCompleted = 0;


        data.forEach(
            function (challenge) {

                if (
                    challenge.difficulty ===
                    "Beginner"
                ) {

                    beginnerTotal++;

                    if (
                        challenge.status ===
                        "completed"
                    ) {

                        beginnerCompleted++;

                    }

                }


                if (
                    challenge.difficulty ===
                    "Intermediate"
                ) {

                    intermediateTotal++;

                    if (
                        challenge.status ===
                        "completed"
                    ) {

                        intermediateCompleted++;

                    }

                }


                if (
                    challenge.difficulty ===
                    "Expert"
                ) {

                    expertTotal++;

                    if (
                        challenge.status ===
                        "completed"
                    ) {

                        expertCompleted++;

                    }

                }


                if (
                    challenge.status ===
                    "completed"
                ) {

                    completed++;

                    score +=
                        Number(
                            challenge.points
                        ) || 0;

                } else if (
                    challenge.status ===
                    "skipped"
                ) {

                    skipped++;

                } else {

                    remaining++;

                }

            }
        );


        if (totalScore) {

            totalScore.textContent =
                score;

        }


        if (completedCount) {

            completedCount.textContent =
                completed;

        }


        if (skippedCount) {

            skippedCount.textContent =
                skipped;

        }


        if (remainingCount) {

            remainingCount.textContent =
                remaining;

        }


        const beginnerPercentage =
            beginnerTotal === 0
                ? 0
                : Math.round(
                    (
                        beginnerCompleted /
                        beginnerTotal
                    ) * 100
                );


        const intermediatePercentage =
            intermediateTotal === 0
                ? 0
                : Math.round(
                    (
                        intermediateCompleted /
                        intermediateTotal
                    ) * 100
                );


        const expertPercentage =
            expertTotal === 0
                ? 0
                : Math.round(
                    (
                        expertCompleted /
                        expertTotal
                    ) * 100
                );


        if (beginnerProgress) {

            beginnerProgress.textContent =
                beginnerPercentage +
                "%";

        }


        if (intermediateProgress) {

            intermediateProgress.textContent =
                intermediatePercentage +
                "%";

        }


        if (expertProgress) {

            expertProgress.textContent =
                expertPercentage +
                "%";

        }


        if (beginnerFill) {

            beginnerFill.style.width =
                beginnerPercentage +
                "%";

        }


        if (intermediateFill) {

            intermediateFill.style.width =
                intermediatePercentage +
                "%";

        }


        if (expertFill) {

            expertFill.style.width =
                expertPercentage +
                "%";

        }


        updateActiveLevelStatus(
            options.celebrate === true,
            options.completedDifficulty || null
        );
    };



/* ============================================================

QUERY EXECUTION

============================================================
*/


if (runButton) {

runButton.addEventListener(    
    "click",    
    async function () {    

        if (!currentQuestion) {    

            return;    

        }    


        const sqlEditor =    
            document.getElementById(    
                "sql-editor"    
            );    


        const queryResultStatus =    
            document.getElementById(    
                "query-result-status"    
            );    


        const userQuery =    
            sqlEditor.value.trim();    


        queryResultStatus.textContent =    
            "";    


        if (    
            userQuery === ""    
        ) {    

            queryResultStatus.textContent =    
                "❌ Please enter a SQL query.";    

            return;    

        }    


        runButton.disabled =    
            true;    


        runButton.textContent =    
            "⏳ Running...";    


        try {    

            const data =    
await sqlEngine.execute(    
    userQuery,    
    {    
        database:    
            currentQuestion.database,    

        expectedOutput:    
            currentQuestion.expectedOutput,    

        challenge:    
            currentQuestion    
    }    
);    


            displayQueryResults(    
                data    
            );    


            if (    
                data.isCorrect ===    
                true    
            ) {    

                currentQuestion.status =    
                    "completed";    


                saveDifficultyProgress(    
                    currentQuestion.difficulty    
                );    


                queryResultStatus.textContent =    
                    "✅ Correct answer! +" +    
                    currentQuestion.points +    
                    " points";    


                queryResultStatus.className =    
                    "query-result-status success";    


                window.updateScoreBoard(
                    allChallenges,
                    {
                        celebrate: true,
                        completedDifficulty:
                            currentQuestion.difficulty
                    }
                );

                loadQuestions(
                    currentQuestionList
                );    


            } else {    

                queryResultStatus.textContent =    
                    "❌ Query executed successfully, but the result is incorrect. Try again.";    


                queryResultStatus.className =    
                    "query-result-status error";    

            }    


        } catch (error) {    

            const resultsContainer =    
                document.getElementById(    
                    "query-results-container"    
                );    


            if (resultsContainer) {    

                resultsContainer.style.display =    
                    "none";    

            }    


            queryResultStatus.textContent =    
                "❌ " +    
                error.message;    


            queryResultStatus.className =    
                "query-result-status error";    

        } finally {    

            runButton.disabled =    
                false;    


            runButton.textContent =    
                "▶️ Run Query";    

        }    

    }    
);

}




/* ============================================================
 * ACTIVE LEVEL + MILESTONE ENGINE
 * ============================================================
 *
 * Active-level rule:
 * 1. Expert is active once at least one Expert question is completed.
 * 2. Otherwise Intermediate is active once at least one Intermediate
 *    question is completed.
 * 3. Otherwise Beginner/Easy remains active.
 *
 * Only the highest active level is displayed in "Your Level".
 *
 * Milestone messages are intentionally NOT displayed inside the
 * active-level card. They appear as one-time animated celebrations.
 * ============================================================
 */

function getCompletedCountForDifficulty(difficulty) {

    if (!Array.isArray(allChallenges)) {
        return 0;
    }

    return allChallenges.filter(
        function (question) {

            return (
                question.difficulty === difficulty &&
                question.status === "completed"
            );

        }
    ).length;

}


function getMilestoneState(storageKey) {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(storageKey)
            );

        return Array.isArray(saved)
            ? saved
            : [];

    } catch (error) {

        return [];

    }

}


function saveMilestoneState(
    storageKey,
    state
) {

    localStorage.setItem(
        storageKey,
        JSON.stringify(state)
    );

}


/*
 * Display a milestone message in the animated popup.
 */
function showMilestoneCelebration(
    milestone,
    difficulty
) {

    if (
        !milestoneCelebrationOverlay ||
        !milestoneCelebrationIcon ||
        !milestoneCelebrationTitle ||
        !milestoneCelebrationMessage
    ) {
        return;
    }

    milestoneCelebrationIcon.textContent =
        milestone.badge || "🎉";

    milestoneCelebrationTitle.textContent =
        difficulty === "Expert"
            ? "Expert Rank Unlocked!"
            : "Intermediate Star Unlocked!";

    milestoneCelebrationMessage.textContent =
        milestone.message || "";

    milestoneCelebrationOverlay.style.display =
        "flex";

    milestoneCelebrationOverlay.classList.remove(
        "level-celebration-pop"
    );

    void milestoneCelebrationOverlay.offsetWidth;

    milestoneCelebrationOverlay.classList.add(
        "level-celebration-pop"
    );

}


function closeMilestoneCelebration() {

    if (!milestoneCelebrationOverlay) {
        return;
    }

    milestoneCelebrationOverlay.classList.remove(
        "level-celebration-pop"
    );

    milestoneCelebrationOverlay.style.display =
        "none";

}


if (milestoneCelebrationClose) {

    milestoneCelebrationClose.addEventListener(
        "click",
        closeMilestoneCelebration
    );

}


if (milestoneCelebrationOverlay) {

    milestoneCelebrationOverlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                milestoneCelebrationOverlay
            ) {

                closeMilestoneCelebration();

            }

        }
    );

}


function getCurrentIntermediateMilestone(
    completed
) {

    let current = null;

    INTERMEDIATE_STAR_MILESTONES.forEach(
        function (milestone) {

            if (
                completed >= milestone.completed
            ) {

                current = milestone;

            }

        }
    );

    return current;

}


function getCurrentExpertMilestone(
    completed
) {

    let current = null;

    EXPERT_RANK_MILESTONES.forEach(
        function (milestone) {

            if (
                completed >= milestone.completed
            ) {

                current = milestone;

            }

        }
    );

    return current;

}


/*
 * Update only the single active-level indicator.
 *
 * Examples:
 *   Easy - 10/50
 *   Intermediate - ⭐⭐⭐
 *   Expert - 💀 BOSS
 */
function updateActiveLevelStatus(
    allowCelebration = false,
    completedDifficulty = null
) {

    if (!activeLevelStatus) {
        return;
    }

    const beginnerCompleted =
        getCompletedCountForDifficulty(
            "Beginner"
        );

    const intermediateCompleted =
        getCompletedCountForDifficulty(
            "Intermediate"
        );

    const expertCompleted =
        getCompletedCountForDifficulty(
            "Expert"
        );

    let statusText = "";

    if (expertCompleted > 0) {

        const currentExpert =
            getCurrentExpertMilestone(
                expertCompleted
            );

        statusText =
            currentExpert
                ? (
                    "Expert - " +
                    currentExpert.badge +
                    " " +
                    currentExpert.rank
                )
                : "Expert - 🔒";

    }

    else if (intermediateCompleted > 0) {

        const currentIntermediate =
            getCurrentIntermediateMilestone(
                intermediateCompleted
            );

        const stars =
            currentIntermediate
                ? currentIntermediate.stars
                : 0;

        statusText =
            "Intermediate - " +
            (
                stars > 0
                    ? "⭐".repeat(stars)
                    : "0⭐"
            );

    }

    else {

        statusText =
            "Easy - " +
            beginnerCompleted +
            "/" +
            CHALLENGE_V1_TARGETS.Beginner;

    }

    activeLevelStatus.textContent =
        statusText;


    /*
     * Celebrate only the milestone created by the successful
     * query that just completed. Initial page load does not
     * trigger celebrations.
     */
    if (
        allowCelebration &&
        (
            completedDifficulty === "Intermediate" ||
            completedDifficulty === "Expert"
        )
    ) {

        const completed =
            getCompletedCountForDifficulty(
                completedDifficulty
            );

        const milestones =
            completedDifficulty === "Intermediate"
                ? INTERMEDIATE_STAR_MILESTONES
                : EXPERT_RANK_MILESTONES;

        const storageKey =
            completedDifficulty === "Intermediate"
                ? INTERMEDIATE_MILESTONE_STORAGE_KEY
                : EXPERT_MILESTONE_STORAGE_KEY;

        const reached =
            getMilestoneState(
                storageKey
            );

        const newlyReached =
            milestones.find(
                function (milestone) {

                    return (
                        completed === milestone.completed &&
                        !reached.includes(
                            milestone.completed
                        )
                    );

                }
            );

        if (newlyReached) {

            reached.push(
                newlyReached.completed
            );

            saveMilestoneState(
                storageKey,
                reached
            );

            showMilestoneCelebration(
                newlyReached,
                completedDifficulty
            );

        }

    }

}


/*
 * Compatibility wrapper retained so existing calls from the
 * Challenge page remain safe during this UI revision.
 */
function updateChallengeProgression() {

    updateActiveLevelStatus();

}


/* ============================================================
 * RESET PROGRESS
 * ============================================================
 */

const resetButton =
    document.getElementById(
        "reset-progress-btn"
    );


if (resetButton) {

    resetButton.addEventListener(
        "click",
        function () {

            const confirmReset =
                confirm(
                    "⚠️ Are you sure you want to reset your progress?"
                );


            if (!confirmReset) {

                return;

            }


            allChallenges.forEach(
                function (question) {

                    question.status =
                        "incomplete";

                }
            );


            localStorage.removeItem(
                "sqlChallenges_Beginner"
            );

            localStorage.removeItem(
                "sqlChallenges_Intermediate"
            );

            localStorage.removeItem(
                "sqlChallenges_Expert"
            );

            localStorage.removeItem(
                INTERMEDIATE_MILESTONE_STORAGE_KEY
            );

            localStorage.removeItem(
                EXPERT_MILESTONE_STORAGE_KEY
            );

            closeMilestoneCelebration();

            window.updateScoreBoard(
                allChallenges
            );


            if (
                currentQuestion
            ) {

                showQuestion(
                    currentQuestion
                );

            }


            alert(
                "✅ Progress has been reset."
            );

        }
    );

}


/* ============================================================
 * SEARCH QUESTIONS
 * ============================================================
 */

const searchBox =
    document.getElementById(
        "question-search"
    );


if (searchBox) {

    searchBox.addEventListener(
        "input",
        function () {

            const searchText =
                searchBox.value
                    .toLowerCase()
                    .trim();


            const cards =
                document.querySelectorAll(
                    "#questions-grid .question-popup-card"
                );


            cards.forEach(
                function (card) {

                    const text =
                        card.textContent
                            .toLowerCase();


                    card.style.display =
                        text.includes(
                            searchText
                        )
                            ? ""
                            : "none";

                }
            );

        }
    );

}


/* ============================================================
 * INITIAL QUESTION
 *
 * When challenges.js finishes loading all 200 questions,
 * automatically show Beginner #1.
 * ============================================================
 */

window.addEventListener(
    "allQuestionsLoaded",
    function () {

        if (
            Array.isArray(
                allChallenges
            ) &&
            allChallenges.length > 0
        ) {

            const beginnerQuestions =
                allChallenges.filter(
                    function (question) {

                        return (
                            question.difficulty ===
                            "Beginner"
                        );

                    }
                );


            if (
                beginnerQuestions.length > 0
            ) {

                currentQuestionList =
                    beginnerQuestions;

                showQuestion(
                    beginnerQuestions[0]
                );

            } else {

                currentQuestionList =
                    allChallenges;

                showQuestion(
                    allChallenges[0]
                );

            }


            window.updateScoreBoard(
                allChallenges
            );

        }

    }
);


/* ============================================================
 * INITIAL LOG
 * ============================================================
 */

console.log(
    "✅ challenge.js loaded successfully — Challenge Fix v31"
);

/* ============================================================
 * VIEW TABLE SCHEMA
 * ============================================================
 */

const viewSchemaButton =
    document.getElementById("view-schema-btn");

const schemaPopup =
    document.getElementById("schema-popup");

const schemaOverlay =
    document.getElementById("schema-overlay");

const closeSchemaButton =
    document.getElementById("close-schema-btn");

const schemaDatabaseName =
    document.getElementById("schema-database-name");

const schemaContent =
    document.getElementById("schema-content");


/*
 * Open schema popup
 */

function openSchemaPopup() {

    if (!schemaPopup || !schemaOverlay) {

        return;

    }

    schemaPopup.style.display =
        "block";

    schemaOverlay.style.display =
        "block";

}


/*
 * Close schema popup
 */

function closeSchemaPopup() {

    if (!schemaPopup || !schemaOverlay) {

        return;

    }

    schemaPopup.style.display =
        "none";

    schemaOverlay.style.display =
        "none";

}


/*
 * Render schema
 */

function renderTableSchema(schemaData) {

    if (!schemaContent) {

        return;

    }


    schemaContent.innerHTML = "";


    if (
        !schemaData ||
        !schemaData.tables ||
        schemaData.tables.length === 0
    ) {

        schemaContent.innerHTML = `

            <p>
                ❌ No schema information found.
            </p>

        `;

        return;

    }


    schemaData.tables.forEach(
        function (table) {

            const tableCard =
                document.createElement("div");

            tableCard.className =
                "schema-table-card";


            /*
             * Table title
             */

            const tableTitle =
                document.createElement("div");

            tableTitle.className =
                "schema-table-title";

            tableTitle.textContent =
                "📋 " + table.tableName;


            tableCard.appendChild(
                tableTitle
            );


            /*
             * Columns table
             */

            const columnsTable =
    document.createElement("table");

columnsTable.className =
    "schema-columns-table";
            
            table.className =
                "schema-columns-table";


            const thead =
                document.createElement("thead");

            thead.innerHTML = `

                <tr>

                    <th>Column</th>

                    <th>Type</th>

                    <th>Key</th>

                    <th>Required</th>

                </tr>

            `;


            columnsTable.appendChild(thead);


            const tbody =
                document.createElement("tbody");


            const columns =
    table.columns || [];


            columns.forEach(
                function (column) {

                    const row =
                        document.createElement("tr");


                    let keyText = "";

                    let keyClass = "";


                    if (column.pk === 1) {

                        keyText =
                            "🔑 Primary Key";

                        keyClass =
                            "schema-primary-key";

                    }


                    /*
                     * Check whether this column
                     * is used as a foreign key.
                     */

                    const foreignKey =
                        (
                            table.foreignKeys ||
                            []
                        ).find(
                            function (foreignKey) {

                                return (
                                    foreignKey.from ===
                                    column.name
                                );

                            }
                        );


                    if (foreignKey) {

                        keyText =
                            "🔗 Foreign Key";

                        keyClass =
                            "schema-foreign-key";

                    }


                    row.innerHTML = `

                        <td>
                            ${column.name}
                        </td>

                        <td>
                            ${column.type || "—"}
                        </td>

                        <td class="${keyClass}">
                            ${keyText || "—"}
                        </td>

                        <td>
                            ${
                                column.notnull === 1
                                    ? "Yes"
                                    : "No"
                            }
                        </td>

                    `;


                    tbody.appendChild(row);

                }
            );

            columnsTable.appendChild(tbody);

tableCard.appendChild(columnsTable);




            /*
             * Relationships
             */

            const foreignKeys =
                table.foreignKeys || [];


            if (foreignKeys.length > 0) {

                const relationships =
                    document.createElement("div");

                relationships.className =
                    "schema-relationships";


                const relationshipTitle =
                    document.createElement("h4");

                relationshipTitle.textContent =
                    "🔗 Relationships";

                relationships.appendChild(
                    relationshipTitle
                );


                foreignKeys.forEach(
                    function (foreignKey) {

                        const relationship =
                            document.createElement("div");

                        relationship.className =
                            "schema-relationship-item";


                        relationship.textContent =
                            `${table.tableName}.${foreignKey.from} → ${foreignKey.table}.${foreignKey.to}`;


                        relationships.appendChild(
                            relationship
                        );

                    }
                );


                tableCard.appendChild(
                    relationships
                );

            }


            schemaContent.appendChild(
                tableCard
            );

        }
    );

}


/*
 * ============================================================
 * VIEW TABLE SCHEMA — BROWSER SQLITE
 * ------------------------------------------------------------
 * The Challenge page uses the same browser SQLite database for:
 *   1. SQL execution
 *   2. Schema display
 *
 * No /api/schema backend request is made here.
 * This prevents the schema UI from drifting away from the
 * database actually used by the learner's query.
 * ============================================================
 */
async function loadTableSchema() {

    if (
        !currentQuestion ||
        !Array.isArray(currentQuestion.tables) ||
        currentQuestion.tables.length === 0
    ) {

        if (schemaContent) {
            schemaContent.innerHTML = `
                <p>
                    ❌ No table information available
                    for this question.
                </p>
            `;
        }

        openSchemaPopup();
        return;
    }

    const database =
        currentQuestion.database || "Banking";

    const tableNames =
        currentQuestion.tables;

    if (schemaDatabaseName) {
        schemaDatabaseName.textContent =
            database;
    }

    if (schemaContent) {
        schemaContent.innerHTML = `
            <p>
                ⏳ Loading schema from browser database...
            </p>
        `;
    }

    openSchemaPopup();

    try {

        /*
         * browserSqlEngine is loaded by challenge.html before
         * challenge.js. It loads the finalized Banking/Healthcare
         * schema and seed files from frontend/assets/.
         */
        if (
            !window.browserSqlEngine ||
            typeof window.browserSqlEngine.initialize !== "function"
        ) {
            throw new Error(
                "Browser SQL engine is unavailable."
            );
        }

        const db =
            await window.browserSqlEngine.initialize(
                database
            );

        if (!db) {
            throw new Error(
                "Challenge SQLite database is unavailable."
            );
        }

        const tables = [];

        for (const tableName of tableNames) {

            /*
             * Safely quote the SQLite identifier.
             */
            const quotedTableName =
                '"' +
                String(tableName)
                    .replace(/"/g, '""') +
                '"';

            /*
             * Read actual columns from SQLite.
             */
            const columnRows =
                db.exec({
                    sql:
                        `PRAGMA table_info(${quotedTableName});`,
                    rowMode: "object",
                    returnValue: "resultRows"
                }) || [];

            if (columnRows.length === 0) {
                throw new Error(
                    `Table "${tableName}" was not found in the ${database} challenge database.`
                );
            }

            /*
             * Read actual foreign-key relationships.
             */
            const foreignKeyRows =
                db.exec({
                    sql:
                        `PRAGMA foreign_key_list(${quotedTableName});`,
                    rowMode: "object",
                    returnValue: "resultRows"
                }) || [];

            tables.push({
                tableName: tableName,

                columns:
                    columnRows.map(
                        function (column) {
                            return {
                                cid: column.cid,
                                name: column.name,
                                type: column.type,
                                notnull: column.notnull,
                                dflt_value:
                                    column.dflt_value,
                                pk: column.pk
                            };
                        }
                    ),

                foreignKeys:
                    foreignKeyRows.map(
                        function (foreignKey) {
                            return {
                                id: foreignKey.id,
                                seq: foreignKey.seq,
                                table:
                                    foreignKey.table,
                                from:
                                    foreignKey.from,
                                to:
                                    foreignKey.to,
                                on_update:
                                    foreignKey.on_update,
                                on_delete:
                                    foreignKey.on_delete,
                                match:
                                    foreignKey.match
                            };
                        }
                    )
            });
        }

        renderTableSchema({
            success: true,
            database: database,
            tables: tables
        });

    } catch (error) {

        console.error(
            "❌ Browser schema loading failed:",
            error
        );

        if (schemaContent) {
            schemaContent.innerHTML = `
                <p>
                    ❌ Unable to load schema.
                </p>

                <p>
                    ${String(error.message || error)}
                </p>
            `;
        }
    }
}


/*
 * Button
 */

if (viewSchemaButton) {

    viewSchemaButton.addEventListener(
        "click",
        function () {

            loadTableSchema();

        }
    );

}


/*
 * Close button
 */

if (closeSchemaButton) {

    closeSchemaButton.addEventListener(
        "click",
        function () {

            closeSchemaPopup();

        }
    );

}


/*
 * Close when clicking overlay
 */

if (schemaOverlay) {

    schemaOverlay.addEventListener(
        "click",
        function () {

            closeSchemaPopup();

        }
    );

}

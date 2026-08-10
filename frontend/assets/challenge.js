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
                currentQuestion.solution || "";

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


    questionTitle.textContent =
        "Question " +
        question.id;


    databaseName.textContent =
        question.database || "";


    tableName.textContent =
        question.table || "";


    questionText.textContent =
        question.question || "";


    hintText.textContent =
        question.hint || "";


    solutionText.textContent =
        question.solution || "";


    /*
     * Expected output
     */

    renderExpectedOutput(
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

    console.log("Opening difficulty:", difficulty);

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

    currentQuestionList =
        filteredQuestions;

    // Populate ONLY this difficulty's questions
    loadQuestions(filteredQuestions);

    // IMPORTANT:
    // Hide filters for Beginner / Intermediate / Expert
    questionFilters.style.display = "none";

    // Open popup
    questionsPopup.style.display = "block";
    overlay.style.display = "block";
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
        data = allChallenges
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

    };


/* ============================================================
 * QUERY EXECUTION
 * ============================================================
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
                    await executeSqlQuery(
                        userQuery,
                        currentQuestion.expectedOutput
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
                        allChallenges
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
 * When challenges.js finishes loading all
 * 9 questions, automatically show Beginner #1.
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
    "✅ challenge.js loaded successfully"
);

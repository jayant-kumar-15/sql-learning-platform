/*
 * ============================================================
 * SQL LEARNING PLATFORM - CHALLENGE ENGINE
 * ============================================================
 */

const BEGINNER_FILE =
    "../assets/questions-beginner.json";

const INTERMEDIATE_FILE =
    "../assets/questions-intermediate.json";

const EXPERT_FILE =
    "../assets/questions-expert.json";


/* ============================================================
 * GLOBAL STATE
 * ============================================================
 */

let allChallenges = [];

let currentQuestionList = [];

let currentQuestion = null;


/*
 * This is kept for compatibility with existing code.
 */
let challenges = [];


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

const questionsPopup =
    document.getElementById("questions-popup");

const closePopupButton =
    document.getElementById("close-popup");

const overlay =
    document.getElementById("overlay");

const questionsGrid =
    document.getElementById("questions-grid");

const questionTitle =
    document.getElementById("question-title");

const databaseName =
    document.getElementById("database-name");

const tableName =
    document.getElementById("table-name");

const questionText =
    document.getElementById("question-text");

const questionFilters =
    document.getElementById("question-filters");

const allQuestionsButton =
    document.getElementById("all-questions-btn");

const previousQuestionButton =
    document.getElementById("previous-question-btn");

const nextQuestionButton =
    document.getElementById("next-question-btn");

const runButton =
    document.getElementById("run-query-btn");

const totalScore =
    document.getElementById("total-score");

const completedCount =
    document.getElementById("completed-count");

const skippedCount =
    document.getElementById("skipped-count");

const remainingCount =
    document.getElementById("remaining-count");

const resultMessage =
    document.getElementById("result-message");

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

const filterAll =
    document.getElementById("filter-all");

const filterBeginner =
    document.getElementById("filter-beginner");

const filterIntermediate =
    document.getElementById("filter-intermediate");

const filterExpert =
    document.getElementById("filter-expert");

const resetButton =
    document.getElementById("reset-progress-btn");

const searchBox =
    document.getElementById("question-search");


/* ============================================================
 * LOAD JSON QUESTION BANKS
 * ============================================================
 */

async function loadQuestionBanks() {

    try {

        const responses =
            await Promise.all([

                fetch(BEGINNER_FILE),

                fetch(INTERMEDIATE_FILE),

                fetch(EXPERT_FILE)

            ]);


        for (const response of responses) {

            if (!response.ok) {

                throw new Error(
                    "Unable to load question bank: " +
                    response.status
                );

            }

        }


        const beginnerQuestions =
            await responses[0].json();

        const intermediateQuestions =
            await responses[1].json();

        const expertQuestions =
            await responses[2].json();


        allChallenges = [

            ...beginnerQuestions,

            ...intermediateQuestions,

            ...expertQuestions

        ];


        /*
         * Restore saved progress.
         */
        restoreProgress();


        /*
         * Default state = Beginner.
         *
         * This means refreshing the page automatically
         * starts with Beginner Question #1.
         */
        currentQuestionList =
            getQuestionsByDifficulty("Beginner");

        challenges =
            currentQuestionList;


        if (currentQuestionList.length > 0) {

            currentQuestion =
                currentQuestionList[0];

            showQuestion(currentQuestion);

        }


        updateScoreBoard();


        /*
         * Notify other scripts if they depend on this event.
         */
        window.dispatchEvent(
            new Event("allQuestionsLoaded")
        );


        console.log(
            "✅ Question banks loaded:",
            allChallenges
        );

    } catch (error) {

        console.error(
            "❌ Question bank loading failed:",
            error
        );

        questionText.textContent =
            "Unable to load SQL challenges.";

    }

}


/* ============================================================
 * GET QUESTIONS BY DIFFICULTY
 * ============================================================
 */

function getQuestionsByDifficulty(difficulty) {

    return allChallenges.filter(
        function (question) {

            return question.difficulty === difficulty;

        }
    );

}


/* ============================================================
 * RESTORE PROGRESS
 * ============================================================
 */

function restoreProgress() {

    allChallenges.forEach(
        function (question) {

            const storageKey =
                "sqlChallenges_" +
                question.difficulty;

            const saved =
                localStorage.getItem(storageKey);


            if (!saved) {

                return;

            }


            try {

                const savedQuestions =
                    JSON.parse(saved);


                const savedQuestion =
                    savedQuestions.find(
                        function (item) {

                            return item.id ===
                                question.id;

                        }
                    );


                if (savedQuestion) {

                    question.status =
                        savedQuestion.status ||
                        "incomplete";

                }

            } catch (error) {

                console.error(
                    "Progress restore error:",
                    error
                );

            }

        }
    );

}


/* ============================================================
 * SAVE PROGRESS
 * ============================================================
 */

function saveProgress() {

    const difficulties = [
        "Beginner",
        "Intermediate",
        "Expert"
    ];


    difficulties.forEach(
        function (difficulty) {

            const questions =
                getQuestionsByDifficulty(
                    difficulty
                );


            localStorage.setItem(

                "sqlChallenges_" +
                difficulty,

                JSON.stringify(questions)

            );

        }
    );

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


    questionTitle.textContent =
        "Question " + question.id;


    databaseName.textContent =
        question.database;


    tableName.textContent =
        question.table;


    questionText.textContent =
        question.question;


    hintText.textContent =
        question.hint;


    solutionText.textContent =
        question.solution;


    hintText.style.display =
        "none";


    solutionText.style.display =
        "none";


    hintButton.textContent =
        "🔒 Show Hint";


    solutionButton.textContent =
        "🔒 View Solution";


    /*
     * Clear previous SQL result message.
     */
    if (resultMessage) {

        resultMessage.textContent = "";

    }

}


/* ============================================================
 * LOAD QUESTION POPUP
 * ============================================================
 */

function loadQuestions(questionList) {

    if (!questionList) {

        questionList =
            currentQuestionList;

    }


    currentQuestionList =
        questionList;


    challenges =
        questionList;


    questionsGrid.innerHTML = "";


    questionList.forEach(
        function (challenge) {

            const card =
                document.createElement("div");


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

                    showQuestion(challenge);

                    questionsPopup.style.display =
                        "none";

                    overlay.style.display =
                        "none";

                }
            );


            questionsGrid.appendChild(card);

        }
    );


    applySearchFilter();

}


/* ============================================================
 * DIFFICULTY LOADING
 * ============================================================
 */

function loadDifficulty(difficulty) {

    const questions =
        getQuestionsByDifficulty(
            difficulty
        );


    currentQuestionList =
        questions;


    challenges =
        questions;


    /*
     * IMPORTANT:
     * Always reset to the first question
     * when changing difficulty.
     */
    currentQuestion =
        questions.length > 0
            ? questions[0]
            : null;


    if (currentQuestion) {

        showQuestion(
            currentQuestion
        );

    }


    loadQuestions(questions);


    updateScoreBoard();

}


/* ============================================================
 * FILTER QUESTIONS
 * ============================================================
 */

function filterQuestions(difficulty) {

    if (difficulty === "All") {

        currentQuestionList =
            allChallenges;

    } else {

        currentQuestionList =
            getQuestionsByDifficulty(
                difficulty
            );

    }


    challenges =
        currentQuestionList;


    /*
     * Filtering also starts from
     * the first question in that filter.
     */
    currentQuestion =
        currentQuestionList.length > 0
            ? currentQuestionList[0]
            : null;


    if (currentQuestion) {

        showQuestion(
            currentQuestion
        );

    }


    loadQuestions(
        currentQuestionList
    );

}


/* ============================================================
 * FILTER BUTTON STATE
 * ============================================================
 */

function setActiveFilter(activeButton) {

    [
        filterAll,
        filterBeginner,
        filterIntermediate,
        filterExpert

    ].forEach(
        function (button) {

            if (button) {

                button.classList.remove(
                    "active"
                );

            }

        }
    );


    if (activeButton) {

        activeButton.classList.add(
            "active"
        );

    }

}


/* ============================================================
 * POPUP BUTTONS
 * ============================================================
 */

if (allQuestionsButton) {

    allQuestionsButton.addEventListener(
        "click",
        function () {

            currentQuestionList =
                allChallenges;

            challenges =
                allChallenges;


            currentQuestion =
                allChallenges.length > 0
                    ? allChallenges[0]
                    : null;


            if (currentQuestion) {

                showQuestion(
                    currentQuestion
                );

            }


            loadQuestions(
                allChallenges
            );


            questionsPopup.style.display =
                "block";

            overlay.style.display =
                "block";

            questionFilters.style.display =
                "flex";


            setActiveFilter(
                filterAll
            );

        }
    );

}


if (closePopupButton) {

    closePopupButton.addEventListener(
        "click",
        function () {

            questionsPopup.style.display =
                "none";

            overlay.style.display =
                "none";

        }
    );

}


/* ============================================================
 * BEGINNER / INTERMEDIATE / EXPERT BUTTONS
 * ============================================================
 */

const beginnerButton =
    document.getElementById(
        "beginner-btn"
    );


const intermediateButton =
    document.getElementById(
        "intermediate-btn"
    );


const expertButton =
    document.getElementById(
        "expert-btn"
    );


if (beginnerButton) {

    beginnerButton.addEventListener(
        "click",
        function () {

            loadDifficulty(
                "Beginner"
            );


            setActiveFilter(
                filterBeginner
            );


            questionFilters.style.display =
                "none";


            questionsPopup.style.display =
                "block";


            overlay.style.display =
                "block";

        }
    );

}


if (intermediateButton) {

    intermediateButton.addEventListener(
        "click",
        function () {

            loadDifficulty(
                "Intermediate"
            );


            setActiveFilter(
                filterIntermediate
            );


            questionFilters.style.display =
                "none";


            questionsPopup.style.display =
                "block";


            overlay.style.display =
                "block";

        }
    );

}


if (expertButton) {

    expertButton.addEventListener(
        "click",
        function () {

            loadDifficulty(
                "Expert"
            );


            setActiveFilter(
                filterExpert
            );


            questionFilters.style.display =
                "none";


            questionsPopup.style.display =
                "block";


            overlay.style.display =
                "block";

        }
    );

}


/* ============================================================
 * FILTER EVENTS
 * ============================================================
 */

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
 * NEXT QUESTION
 * ============================================================
 */

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

                        return question.id ===
                            currentQuestion.id;

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
 * PREVIOUS QUESTION
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

                        return question.id ===
                            currentQuestion.id;

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



alert("challenge.js loaded");

const hintButton = document.getElementById("hint-btn");

const hintText = document.getElementById("hint-text");

hintButton.addEventListener("click", function () {

    if (hintText.style.display === "none") {

        hintText.style.display = "block";

        hintButton.textContent = "🙈 Hide Hint";

    } else {

        hintText.style.display = "none";

        hintButton.textContent = "🔒 Show Hint";

    }

});

const solutionButton = document.getElementById("solution-btn");

const solutionText = document.getElementById("solution-text");

solutionButton.addEventListener("click", function () {

    const confirmAnswer = confirm(

        "⚠️ Viewing the solution will make this question ineligible for points.\n\nDo you want to continue?"

    );

    if (confirmAnswer) {

    currentQuestion.status = "skipped";

    localStorage.setItem(
        "sqlChallenges",
        JSON.stringify(challenges)
    );

    loadQuestions();

    updateScoreBoard();

    solutionText.style.display = "block";

    solutionButton.textContent = "👀 Solution Viewed";

    }

});

document.getElementById("easy-btn").addEventListener("click", function () {

    filterQuestions("Easy");

});

document.getElementById("medium-btn").addEventListener("click", function () {

    filterQuestions("Medium");

});

document.getElementById("hard-btn").addEventListener("click", function () {

    filterQuestions("Hard");

});

document.getElementById("expert-btn").addEventListener("click", function () {

    filterQuestions("Expert");

});


const allQuestionsButton = document.getElementById("all-questions-btn");

const questionsPopup = document.getElementById("questions-popup");

const closePopupButton = document.getElementById("close-popup");
const overlay = document.getElementById("overlay");

allQuestionsButton.addEventListener("click", function () {

    questionsPopup.style.display = "block";

overlay.style.display = "block";

});

closePopupButton.addEventListener("click", function () {

    questionsPopup.style.display = "none";

overlay.style.display = "none";

});

const questionsGrid = document.getElementById("questions-grid");
const questionTitle = document.getElementById("question-title");

const databaseName = document.getElementById("database-name");

const tableName = document.getElementById("table-name");

const questionText = document.getElementById("question-text");
let currentQuestion = challenges[0];

function loadQuestions() {

    questionsGrid.innerHTML = "";

    challenges.forEach(function (challenge) {

        const button = document.createElement("button");

        let statusIcon = "❌";

        if (challenge.status === "completed") {

            statusIcon = "✅";

        } else if (challenge.status === "skipped") {

            statusIcon = "⏭️";

        }

        button.innerHTML = `

            <strong>${challenge.id} ${statusIcon}</strong>

            <br><br>

            <small>${challenge.table}</small>

        `;

        console.log(challenge.table);
        
        button.addEventListener("click", function () {
            currentQuestion = challenge;

            questionTitle.textContent =
                "Question " + challenge.id;

            databaseName.textContent =
                challenge.database;

            tableName.textContent =
                challenge.table;

            questionText.textContent =
                challenge.question;

            hintText.textContent =
                challenge.hint;

            solutionText.textContent =
                challenge.solution;

            hintText.style.display = "none";

            solutionText.style.display = "none";

            hintButton.textContent =
                "🔒 Show Hint";

            solutionButton.textContent =
                "🔒 View Solution";

            questionsPopup.style.display =
                "none";

            overlay.style.display =
                "none";

        });

        questionsGrid.appendChild(button);

    });

}

const totalScore = document.getElementById("total-score");

const completedCount = document.getElementById("completed-count");

const skippedCount = document.getElementById("skipped-count");

const remainingCount = document.getElementById("remaining-count");

function updateScoreBoard() {
console.log(challenges);
    let score = 0;

    let completed = 0;

    let skipped = 0;

    let remaining = 0;
    
    challenges.forEach(function (challenge) {

        if (challenge.status === "completed") {

            completed++;

            score += challenge.points;

        } else if (challenge.status === "skipped") {

            skipped++;

        } else {

            remaining++;

        }

    });

    totalScore.textContent = score;

    completedCount.textContent = completed;

    skippedCount.textContent = skipped;

    remainingCount.textContent = remaining;

}
loadQuestions();

updateScoreBoard();
const runButton = document.getElementById("run-query-btn");

const resultMessage = document.getElementById("result-message");

runButton.addEventListener("click", function () {

    const userQuery = document
    .getElementById("sql-editor")
    .value
    .replace(/\s+/g, " ")
    .replace(/;+$/, "")
    .trim()
    .toLowerCase();

const expectedQuery = currentQuestion
    .solution
    .replace(/\s+/g, " ")
    .replace(/;+$/, "")
    .trim()
    .toLowerCase();

    if (userQuery === "") {

        resultMessage.textContent =
            "❌ Please enter a query.";

        return;
    }

    
    if (userQuery === expectedQuery) {

    currentQuestion.status = "completed";

    localStorage.setItem(
        "sqlChallenges",
        JSON.stringify(challenges)
    );

    resultMessage.textContent =
        "✅ Correct answer! +" +
        currentQuestion.points +
        " points";

    loadQuestions();

    updateScoreBoard();

} else {

    resultMessage.textContent =
        "❌ Wrong answer. Try again.";

    }

});
const savedChallenges = localStorage.getItem(
    "sqlChallenges"
);
console.log(savedChallenges);

if (savedChallenges) {

    const parsedChallenges = JSON.parse(
        savedChallenges
    );

    challenges.length = 0;

    challenges.push(...parsedChallenges);

}

function filterQuestions(difficulty) {

    questionsGrid.innerHTML = "";

    challenges.forEach(function (challenge) {

        if (challenge.difficulty !== difficulty) {

            return;

        }

        const button = document.createElement("button");

        let statusIcon = "❌";

        if (challenge.status === "completed") {

            statusIcon = "✅";

        } else if (challenge.status === "skipped") {

            statusIcon = "⏭️";

        }

        button.innerHTML = `

            <strong>${challenge.id} ${statusIcon}</strong>

            <br><br>

            <small>${challenge.table}</small>

        `;

        button.addEventListener("click", function () {

            currentQuestion = challenge;

            questionTitle.textContent =
                "Question " + challenge.id;

            databaseName.textContent =
                challenge.database;

            tableName.textContent =
                challenge.table;

            questionText.textContent =
                challenge.question;

            hintText.textContent =
                challenge.hint;

            solutionText.textContent =
                challenge.solution;

            hintText.style.display = "none";

            solutionText.style.display = "none";

            hintButton.textContent = "🔒 Show Hint";

            solutionButton.textContent = "🔒 View Solution";

            questionsPopup.style.display = "none";

            overlay.style.display = "none";

        });

        questionsGrid.appendChild(button);

    });

    questionsPopup.style.display = "block";

    overlay.style.display = "block";

}

loadQuestions();
updateScoreBoard();


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
    "sqlChallenges_" +
    currentQuestion.difficulty,
    JSON.stringify(challenges)
);
loadQuestions();

loadAllProgress();

    solutionText.style.display = "block";

    solutionButton.textContent = "👀 Solution Viewed";

    }

});

document
    .getElementById("beginner-btn")
    .addEventListener("click", function () {

        loadDifficulty("beginner");

        questionsPopup.style.display = "block";

        overlay.style.display = "block";

    });

document
    .getElementById("intermediate-btn")
    .addEventListener("click", function () {

        loadDifficulty("intermediate");

        questionsPopup.style.display = "block";

        overlay.style.display = "block";

    });

document
    .getElementById("expert-btn")
    .addEventListener("click", function () {

        loadDifficulty("expert");

        questionsPopup.style.display = "block";

        overlay.style.display = "block";

    });

console.log(
    document.getElementById("intermediate-btn")
);

console.log(
    document.getElementById("expert-btn")
);

const allQuestionsButton = document.getElementById("all-questions-btn");

const questionsPopup = document.getElementById("questions-popup");

const closePopupButton = document.getElementById("close-popup");
const overlay = document.getElementById("overlay");

allQuestionsButton.addEventListener("click", function () {

    loadQuestions();

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
let currentQuestion = null;

function showQuestion(question) {

    currentQuestion = question;

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

    hintText.style.display = "none";

    solutionText.style.display = "none";

    hintButton.textContent =
        "🔒 Show Hint";

    solutionButton.textContent =
        "🔒 View Solution";
}

function loadQuestions() {

    console.log("Challenges length:", challenges.length);
console.log(challenges);
    
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

        
        button.addEventListener("click", function () {

    showQuestion(challenge);

    questionsPopup.style.display =
        "none";

    overlay.style.display =
        "none";

});
        questionsGrid.appendChild(button);

});

        if (challenges.length > 0 && currentQuestion === null) {

        showQuestion(challenges[0]);
}
}
console.log("loadQuestions function ended");

const totalScore = document.getElementById("total-score");

const completedCount = document.getElementById("completed-count");

const skippedCount = document.getElementById("skipped-count");

const remainingCount = document.getElementById("remaining-count");

const beginnerProgress = document.getElementById(
    "easy-progress"
);

const intermediateProgress = document.getElementById(
    "medium-progress"
);

const expertProgress = document.getElementById(
    "expert-progress"
);

const beginnerFill = document.getElementById(
    "easy-fill"
);

const intermediateFill = document.getElementById(
    "medium-fill"
);

const expertFill = document.getElementById(
    "expert-fill"
);


function updateScoreBoard(data = allChallenges) {
console.log(data);
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
    
    data.forEach(function (challenge) {
        
if (challenge.difficulty === "Beginner") {

    beginnerTotal++;

    if (challenge.status === "completed") {

        beginnerCompleted++;

    }

}

if (challenge.difficulty === "Intermediate") {

    
    intermediateTotal++;

    if (challenge.status === "completed") {

        intermediateCompleted++;

    }

}


if (challenge.difficulty === "Expert") {

    expertTotal++;

    if (challenge.status === "completed") {

        expertCompleted++;

    }

}
        

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

console.log("Beginner total =", beginnerTotal);

console.log("Beginner completed =", beginnerCompleted);

beginnerProgress.textContent =

    beginnerTotal === 0
        ? "0%"
        : Math.round(
              (beginnerCompleted / beginnerTotal) * 100
          ) + "%";

intermediateProgress.textContent =

    intermediateTotal === 0
        ? "0%"
        : Math.round(
              (intermediateCompleted / intermediateTotal) * 100
          ) + "%";

expertProgress.textContent =

    expertTotal === 0
        ? "0%"
        : Math.round(
              (expertCompleted / expertTotal) * 100
          ) + "%";

const beginnerPercentage = beginnerTotal === 0
    ? 0
    : Math.round(
          (beginnerCompleted / beginnerTotal) * 100
      );

const intermediatePercentage = intermediateTotal === 0
    ? 0
    : Math.round(
          (intermediateCompleted / intermediateTotal) * 100
      );

const expertPercentage = expertTotal === 0
    ? 0
    : Math.round(
          (expertCompleted / expertTotal) * 100
      );

beginnerFill.style.width =
    beginnerPercentage + "%";

intermediateFill.style.width =
    intermediatePercentage + "%";

expertFill.style.width =
    expertPercentage + "%";
}
    
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
    "sqlChallenges_" +
    currentQuestion.difficulty,
    JSON.stringify(challenges)
);
        console.log(
    localStorage.getItem(
        "sqlChallenges_" +
        currentQuestion.difficulty
    )
);

    resultMessage.textContent =
        "✅ Correct answer! +" +
        currentQuestion.points +
        " points";

    loadQuestions();

loadAllProgress();

} else {

    resultMessage.textContent =
        "❌ Wrong answer. Try again.";

    }

});





const resetButton = document.getElementById(
    "reset-progress-btn"
);

resetButton.addEventListener("click", function () {

    const confirmReset = confirm(

        "⚠️ Are you sure you want to reset your progress?"

    );

    if (!confirmReset) {

        return;

    }

    challenges.forEach(function (challenge) {

        challenge.status = "incomplete";

    });

    localStorage.removeItem("sqlChallenges_Beginner");

localStorage.removeItem("sqlChallenges_Intermediate");

localStorage.removeItem("sqlChallenges_Expert");

    

    alert("✅ Progress has been reset.");

});
function filterQuestions(difficulty) {

    questionsGrid.innerHTML = "";

    let questionFound = false;

    challenges.forEach(function (challenge) {

        if (challenge.difficulty !== difficulty) {

            return;

        }

        questionFound = true;

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

            showQuestion(challenge);

            questionsPopup.style.display =
                "none";

            overlay.style.display =
                "none";

        });

        questionsGrid.appendChild(button);

    });

    if (!questionFound) {

        questionsGrid.innerHTML = `

            <p style="padding:20px; text-align:center;">

                No ${difficulty} questions available.

            </p>

        `;

    }

    questionsPopup.style.display = "block";

    overlay.style.display = "block";

}
const searchBox = document.getElementById("question-search");

if (searchBox) {

    searchBox.addEventListener("input", function () {

        const searchText = searchBox.value.toLowerCase();

        const buttons = document.querySelectorAll(
            "#questions-grid button"
        );

        buttons.forEach(function (button) {

            const text = button.textContent.toLowerCase();

            if (
                text.includes(searchText)
            ) {

                button.style.display = "";

            } else {

                button.style.display = "none";

            }

        });

    });

}

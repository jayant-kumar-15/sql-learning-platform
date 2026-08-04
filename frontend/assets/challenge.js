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

        solutionText.style.display = "block";

        solutionButton.textContent = "👀 Solution Viewed";

    }

});

document.getElementById("easy-btn").addEventListener("click", function () {

    alert("🟢 Easy questions will open here.");

});

document.getElementById("medium-btn").addEventListener("click", function () {

    alert("🟡 Medium questions will open here.");

});

document.getElementById("hard-btn").addEventListener("click", function () {

    alert("🟠 Hard questions will open here.");

});

document.getElementById("expert-btn").addEventListener("click", function () {

    alert("🔴 Expert questions will open here.");

});

document.getElementById("all-questions-btn").addEventListener("click", function () {

    alert(
        "📋 Question List\n\n" +
        "1. Completed ✅\n" +
        "2. Skipped ⏭️\n" +
        "3. Incomplete ❌"
    );

});

const allQuestionsButton = document.getElementById("all-questions-btn");

const questionsPopup = document.getElementById("questions-popup");

const closePopupButton = document.getElementById("close-popup");

allQuestionsButton.addEventListener("click", function () {

    questionsPopup.style.display = "block";

});

closePopupButton.addEventListener("click", function () {

    questionsPopup.style.display = "none";

});

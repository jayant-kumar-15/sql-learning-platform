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

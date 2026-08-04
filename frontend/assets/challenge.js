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

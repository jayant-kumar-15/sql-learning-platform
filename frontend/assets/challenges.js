let challenges = [];

function loadDifficulty(level) {

    fetch(`../assets/questions-${level}.json`)
        .then(response => response.json())
        .then(data => {

            challenges = data;
            console.log(challenges);
alert(
    "Loaded " +
    challenges.length +
    " questions"
);

            currentQuestion = challenges[0];

showQuestion(currentQuestion);

loadQuestions();

updateScoreBoard();

        })
        .catch(error => {

            console.error(error);

        });

}

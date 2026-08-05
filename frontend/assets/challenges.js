let challenges = [];

function loadDifficulty(level) {

    fetch(`../assets/questions-${level}.json`)
        .then(response => response.json())
        .then(data => {

            challenges = data;

            currentQuestion = challenges[0];

            loadQuestions();

            updateScoreBoard();

        })
        .catch(error => {

            console.error(error);

        });

}

let challenges = [];

function loadDifficulty(level) {

    fetch(`../assets/questions-${level}.json`)
        .then(response => response.json())
        .then(data => {

            challenges = data;

const savedChallenges = localStorage.getItem(
    "sqlChallenges"
);

if (savedChallenges) {

    const parsedChallenges = JSON.parse(
        savedChallenges
    );

    parsedChallenges.forEach(function(savedQuestion) {

        const current = challenges.find(function(question) {

            return question.id === savedQuestion.id;

        });

        if (current) {

            current.status = savedQuestion.status;

        }

    });

}

            console.log(challenges);

            alert(
                "Loaded " +
                challenges.length +
                " questions"
            );

            if (challenges.length > 0) {

                currentQuestion = challenges[0];

                showQuestion(currentQuestion);

            }

            loadQuestions();

            updateScoreBoard();

        })
        .catch(error => {

            console.error(error);

        });

}

let challenges = [];

fetch("../assets/questions.json")
    .then(response => response.json())
    .then(data => {

        challenges = data;

        currentQuestion = challenges[0];

        loadQuestions();

        updateScoreBoard();

    })
    .catch(error => {

        console.error(
            "Error loading questions:",
            error
        );

    });

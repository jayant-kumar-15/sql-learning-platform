let challenges = [];
let allChallenges = [];
function loadAllDifficultyQuestions() {

    const levels = [
        "beginner",
        "intermediate",
        "expert"
    ];

    const requests = levels.map(function (level) {

        return fetch(`../assets/questions-${level}.json`)
            .then(response => response.json());

    });

    Promise.all(requests)
        .then(function (results) {

            allChallenges = [];

            results.forEach(function (questions) {

                allChallenges.push(...questions);

            });

            console.log(
                "All questions loaded:",
                allChallenges.length
            );

        })
        .catch(function (error) {

            console.error(
                "Error loading all questions:",
                error
            );

        });

}


function loadDifficulty(level) {

    fetch(`../assets/questions-${level}.json`)
        .then(response => response.json())
        .then(data => {

            challenges = [];

            challenges.push(...data);

            currentQuestionList = challenges;

            const savedChallenges =
                JSON.parse(
                    localStorage.getItem(
                        "sqlChallenges_" +
                        level.charAt(0).toUpperCase() +
                        level.slice(1)
                    )
                ) || [];

            savedChallenges.forEach(function (savedQuestion) {

                const current = challenges.find(function (q) {

                    return q.id === savedQuestion.id;

                });

                if (current) {

                    current.status = savedQuestion.status;

                }

            });

            /*
             * Keep all questions available for
             * the View All Questions popup.
             */

            const existingIds = new Set(
                allChallenges.map(function (q) {
                    return q.id + "-" + q.difficulty;
                })
            );

            challenges.forEach(function (question) {

                const uniqueKey =
                    question.id + "-" + question.difficulty;

                if (!existingIds.has(uniqueKey)) {

                    allChallenges.push(question);

                }

            });

      if (challenges.length > 0) {

    currentQuestionList = challenges;

    currentQuestion = challenges[0];

    showQuestion(currentQuestion);

}

loadQuestions(challenges);

updateScoreBoard(allChallenges);

        })

        .catch(error => {

            console.error(
                "Error loading questions:",
                error
            );

        });

}

async function loadAllProgress() {

    const levels = [
        "beginner",
        "intermediate",
        "expert"
    ];
    allChallenges = [];

    for (const level of levels) {

        const response = await fetch(
            `../assets/questions-${level}.json`
        );

        const data = await response.json();

        const savedChallenges =
    JSON.parse(
        localStorage.getItem(
            "sqlChallenges_" +
            level.charAt(0).toUpperCase() +
            level.slice(1)
        )
    ) || [];

        data.forEach(function (question) {

            const saved = savedChallenges.find(
                function (q) {

                    return q.id === question.id;

                }
            );

            if (saved) {

                question.status = saved.status;

            }

        });

        allChallenges.push(...data);

    }

    updateScoreBoard(allChallenges);

}

window.addEventListener("load", async function () {

    await loadAllProgress();

});

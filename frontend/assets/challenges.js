let challenges = [];
let allChallenges = [];
function loadDifficulty(level) {

    alert("Loading " + level);

    fetch(`../assets/questions-${level}.json`)
        .then(response => response.json())
        .then(data => {

    challenges = [];

    challenges.push(...data);
        
            
challenges.push(...data);

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
            

            console.log(
    "Level:",
    level
);

console.log(
    "Questions loaded:",
    challenges
);
            alert(
    "Level = " +
    level +
    "\nQuestions = " +
    challenges.length
);


            if (challenges.length > 0) {

                currentQuestion = challenges[0];

                showQuestion(currentQuestion);

            }

            loadQuestions();

            updateScoreBoard(allChallenges);

        })
        .catch(error => {

            console.error(error);

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

alert(
    "Total questions loaded: " +
    allChallenges.length
);

}

loadAllProgress();

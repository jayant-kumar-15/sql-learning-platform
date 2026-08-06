function updateBadges() {

    const beginner = JSON.parse(

        localStorage.getItem(
            "sqlChallenges_Beginner"
        )

    ) || [];

    const intermediate = JSON.parse(

        localStorage.getItem(
            "sqlChallenges_Intermediate"
        )

    ) || [];

    const expert = JSON.parse(

        localStorage.getItem(
            "sqlChallenges_Expert"
        )

    ) || [];

    const beginnerCompleted = beginner.filter(

        q => q.status === "completed"

    ).length;

    const intermediateCompleted = intermediate.filter(

        q => q.status === "completed"

    ).length;

    const expertCompleted = expert.filter(

        q => q.status === "completed"

    ).length;

    const totalCompleted =

        beginnerCompleted +

        intermediateCompleted +

        expertCompleted;

    if (totalCompleted >= 1) {

        document

            .getElementById(

                "badge-first-query"

            )

            .classList.replace(

                "locked",

                "unlocked"

            );

    }

    if (

        beginner.length > 0 &&

        beginnerCompleted === beginner.length

    ) {

        document

            .getElementById(

                "badge-beginner"

            )

            .classList.replace(

                "locked",

                "unlocked"

            );

    }

    if (

        intermediate.length > 0 &&

        intermediateCompleted === intermediate.length

    ) {

        document

            .getElementById(

                "badge-intermediate"

            )

            .classList.replace(

                "locked",

                "unlocked"

            );

    }

    if (

        expert.length > 0 &&

        expertCompleted === expert.length

    ) {

        document

            .getElementById(

                "badge-expert"

            )

            .classList.replace(

                "locked",

                "unlocked"

            );

    }

}

window.addEventListener(

    "load",

    updateBadges

);

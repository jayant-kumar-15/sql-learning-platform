async function executeSqlQuery(query) {

    const response = await fetch(
        "/api/query",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                query: query
            })
        }
    );

    const data =
        await response.json();

    if (!response.ok) {

        throw new Error(
            data.message ||
            "Query execution failed."
        );

    }

    return data;

}

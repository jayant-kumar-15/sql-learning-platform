const API_BASE_URL = "https://sql-learning-platform-5fu8.onrender.com";

async function executeSqlQuery(
    query,
    expectedOutput = null
) {
    const response = await fetch(
        `${API_BASE_URL}/api/query`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                query: query,
                expectedOutput: expectedOutput
            })
        }
    );

    const contentType =
        response.headers.get("content-type") || "";

    let data;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        const text = await response.text();

        throw new Error(
            `Server returned non-JSON response (${response.status}): ${text.slice(0, 200)}`
        );
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Query execution failed."
        );
    }

    return data;
}

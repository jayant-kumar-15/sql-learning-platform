/*
 * ============================================================
 * QUERY API
 * ============================================================
 *
 * PATH
 * ----
 * frontend/js/queryApi.js
 *
 * PURPOSE
 * -------
 * Central client-side helper for sending SQL queries from the
 * frontend to the backend SQL API.
 *
 * CURRENT RESPONSIBILITIES
 * ------------------------
 * 1. Store the backend API base URL in one place.
 * 2. Send SQL query requests to the /api/query endpoint.
 * 3. Send the optional expected output used by Challenges.
 * 4. Convert the backend response to JSON.
 * 5. Convert backend HTTP errors into JavaScript Error objects.
 * 6. Return the successful API response to the caller.
 *
 * IMPORTANT
 * ---------
 * This file does NOT render query results.
 *
 * Result rendering is handled separately by:
 *
 *     frontend/js/queryResults.js
 *
 * This separation keeps API communication and UI rendering
 * independent, which makes future changes easier.
 *
 * ============================================================
 */


/* ============================================================
 * API CONFIGURATION
 * ============================================================ */

/*
 * Backend server used by the SQL Learning Platform.
 *
 * Keep the URL in one constant so changing the deployment
 * location later requires editing only this file.
 */
const API_BASE_URL =
    "https://sql-learning-platform-5fu8.onrender.com";


/* ============================================================
 * EXECUTE SQL QUERY
 * ============================================================ */

/*
 * Sends a SQL query to the backend.
 *
 * PARAMETERS
 * ----------
 * query:
 *     SQL statement/query to execute.
 *
 * expectedOutput:
 *     Optional expected result used by the Challenge page.
 *     Normal Playground/Sandbox calls can leave this null.
 *
 * RETURNS
 * -------
 * Promise resolving to the parsed backend response object.
 *
 * ERRORS
 * ------
 * If the backend returns a non-2xx response, an Error is thrown
 * so the calling page can handle it with its own UI.
 */
async function executeSqlQuery(
    query,
    expectedOutput = null
) {

    const response =
        await fetch(
            API_BASE_URL +
            "/api/query",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        query:
                            query,

                        expectedOutput:
                            expectedOutput
                    })
            }
        );


    /*
     * Parse the backend response.
     */
    const data =
        await response.json();


    /*
     * Convert backend HTTP errors into a normal JavaScript
     * Error object.
     *
     * The calling page can then show the message to the user.
     */
    if (!response.ok) {

        throw new Error(
            data.message ||
            "Query execution failed."
        );

    }


    /*
     * Return successful response data to the caller.
     */
    return data;

}

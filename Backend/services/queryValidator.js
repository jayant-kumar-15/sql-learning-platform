function validateQuery(query) {

    const trimmedQuery = query.trim();

    if (trimmedQuery === "") {

        return {
            valid: false,
            message: "SQL query cannot be empty."
        };

    }

    const normalizedQuery = trimmedQuery
        .toLowerCase()
        .replace(/\s+/g, " ");

    // Only SELECT is allowed on the shared database
    if (!normalizedQuery.startsWith("select")) {

        return {
            valid: false,
            message:
                "Only SELECT queries are allowed in the shared database."
        };

    }

    // Block multiple statements
    const queryWithoutTrailingSemicolon =
        normalizedQuery.replace(/;$/, "");

    if (
        queryWithoutTrailingSemicolon.includes(";")
    ) {

        return {
            valid: false,
            message:
                "Multiple SQL statements are not allowed."
        };

    }

    // Dangerous SQLite commands
    const blockedKeywords = [

        "drop ",
        "alter ",
        "attach ",
        "detach ",
        "pragma ",
        "vacuum ",
        "reindex ",
        "create ",
        "insert ",
        "update ",
        "delete ",
        "replace ",
        "truncate ",
        "grant ",
        "revoke "

    ];

    for (const keyword of blockedKeywords) {

        if (
            normalizedQuery.includes(keyword)
        ) {

            return {
                valid: false,
                message:
                    "This SQL operation is not allowed."
            };

        }

    }

    return {
        valid: true,
        message: "Query is valid."
    };

}

module.exports = {
    validateQuery
};

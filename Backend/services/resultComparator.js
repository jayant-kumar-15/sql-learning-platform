function normalizeValue(value) {

    if (value === null || value === undefined) {

        return null;

    }

    if (typeof value === "number") {

        return Number(value);

    }

    if (typeof value === "string") {

        const trimmed = value.trim();

        if (
            trimmed !== "" &&
            !isNaN(trimmed)
        ) {

            return Number(trimmed);

        }

        return trimmed;

    }

    return value;

}


function normalizeRow(row) {

    const normalized = {};

    Object.keys(row)
        .sort()
        .forEach(function (key) {

            normalized[key] =
                normalizeValue(row[key]);

        });

    return normalized;

}


function normalizeRows(rows) {

    return (rows || [])
        .map(function (row) {

            return normalizeRow(row);

        })
        .sort(function (a, b) {

            return JSON.stringify(a)
                .localeCompare(
                    JSON.stringify(b)
                );

        });

}


function compareResults(
    actualRows,
    expectedRows
) {

    const actual =
        normalizeRows(actualRows);

    const expected =
        normalizeRows(expectedRows);

    if (actual.length !== expected.length) {

        return false;

    }

    for (
        let i = 0;
        i < expected.length;
        i++
    ) {

        if (
            JSON.stringify(actual[i]) !==
            JSON.stringify(expected[i])
        ) {

            return false;

        }

    }

    return true;

}


module.exports = {
    compareResults
};

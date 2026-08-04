const challenges = [

    {
        id: 1,

        difficulty: "Easy",

        database: "Banking",

        table: "customers",

        points: 10,

        status: "incomplete",

        question: "Find all customers whose balance is greater than 50000.",

        expectedOutput: [
            {
                customer_name: "Rahul",
                balance: 75000
            },
            {
                customer_name: "Priya",
                balance: 90000
            }
        ],

        hint: "Use the WHERE clause.",

        solution: "SELECT * FROM customers WHERE balance > 50000;"
    },

    {
        id: 2,

        difficulty: "Easy",

        database: "Healthcare",

        table: "patients",

        points: 10,

        status: "incomplete",

        question: "Display all patients.",

        expectedOutput: [
            {
                patient_name: "John"
            },
            {
                patient_name: "Emma"
            }
        ],

        hint: "Use SELECT *.",

        solution: "SELECT * FROM patients;"
    },

    {
        id: 3,

        difficulty: "Easy",

        database: "Healthcare",

        table: "patients",

        points: 10,

        status: "incomplete",

        question: "Display all patients whose age is greater than 30.",

        expectedOutput: [
            {
                patient_name: "Emma",
                age: 35
            },
            {
                patient_name: "Sophia",
                age: 42
            }
        ],

        hint: "Use WHERE age > 30.",

        solution: "SELECT * FROM patients WHERE age > 30;"
    }

];

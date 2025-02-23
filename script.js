import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyC7ukSYaUnmGYYPSDV4TLboeGCofEHsYQA",
    authDomain: "budget-planner-fab32.firebaseapp.com",
    projectId: "budget-planner-fab32",
    storageBucket: "budget-planner-fab32.firebasestorage.app",
    messagingSenderId: "296915913870",
    appId: "1:296915913870:web:7962aa4ad834d2b96f0ddf",
    measurementId: "G-EY5VY5L52Q"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const transactionsRef = ref(database, 'transactions');

transactionForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;

    if (description !== '' && !isNaN(amount)) {
        console.log("Adding transaction:", { description, amount, category }); // Debugging
        push(transactionsRef, { description, amount, category })
            .then(() => {
                console.log("Transaction added successfully!"); // Debugging
            })
            .catch((error) => {
                console.error("Error adding transaction:", error); // Debugging
            });
        descriptionInput.value = '';
        amountInput.value = '';
    } else {
        console.error("Invalid input: Description or amount is missing."); // Debugging
    }
});

onValue(transactionsRef, (snapshot) => {
    transactions = [];
    snapshot.forEach((childSnapshot) => {
        const transaction = childSnapshot.val();
        transaction.id = childSnapshot.key;
        transactions.push(transaction);
        console.log("Fetched transaction:", transaction); // Debugging
    });
    updateUI();
});

function updateUI() {
    transactionList.innerHTML = '';
    let income = 0;
    let expenses = 0;

    transactions.forEach((transaction) => {
        console.log("Rendering transaction:", transaction); // Debugging

        const li = document.createElement('li');
        li.textContent = `${transaction.description}: $${transaction.amount} (${transaction.category})`;
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        li.appendChild(editButton);
        li.appendChild(deleteButton);
        transactionList.appendChild(li);

        deleteButton.addEventListener('click', function () {
            console.log("Deleting transaction:", transaction.id); // Debugging
            remove(ref(database, `transactions/${transaction.id}`));
        });

        editButton.addEventListener('click', function () {
            const newDescription = prompt('Edit description:', transaction.description);
            const newAmount = prompt('Edit amount:', transaction.amount);
            if (newDescription !== null && newAmount !== null) {
                console.log("Updating transaction:", transaction.id, { description: newDescription, amount: newAmount }); // Debugging
                update(ref(database, `transactions/${transaction.id}`), {
                    description: newDescription.trim(),
                    amount: parseFloat(newAmount)
                });
            }
        });

        if (transaction.category === 'income') {
            income += transaction.amount;
        } else {
            expenses += transaction.amount;
        }
    });

    console.log("Total Income:", income); // Debugging
    console.log("Total Expenses:", expenses); // Debugging
    console.log("Net Balance:", income - expenses); // Debugging

    totalIncome.textContent = income;
    totalExpenses.textContent = expenses;
    netBalance.textContent = income - expenses;
}
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyC7ukSYaUnmGYYPSDV4TLboeGCofEHsYQA",
    authDomain: "budget-planner-fab32.firebaseapp.com",
    databaseURL: "https://budget-planner-fab32-default-rtdb.firebaseio.com/", // Ensure this is correct
    projectId: "budget-planner-fab32",
    storageBucket: "budget-planner-fab32.firebasestorage.app",
    messagingSenderId: "296915913870",
    appId: "1:296915913870:web:7962aa4ad834d2b96f0ddf",
    measurementId: "G-EY5VY5L52Q"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const transactionsRef = ref(database, 'transactions');

document.addEventListener('DOMContentLoaded', function () {
    const transactionForm = document.getElementById('transaction-form');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const categoryInput = document.getElementById('category');
    const transactionList = document.getElementById('transaction-list');
    const totalIncome = document.getElementById('total-income');
    const totalExpenses = document.getElementById('total-expenses');
    const netBalance = document.getElementById('net-balance');

    let transactions = [];

    transactionForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const description = descriptionInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const category = categoryInput.value;

        if (description !== '' && !isNaN(amount)) {
            push(transactionsRef, { description, amount, category })
                .then(() => {
                    console.log("Transaction added successfully!");
                })
                .catch((error) => {
                    console.error("Error adding transaction:", error);
                });
            descriptionInput.value = '';
            amountInput.value = '';
        } else {
            console.error("Invalid input: Description or amount is missing.");
        }
    });

    onValue(transactionsRef, (snapshot) => {
        transactions = [];
        snapshot.forEach((childSnapshot) => {
            const transaction = childSnapshot.val();
            transaction.id = childSnapshot.key;
            transactions.push(transaction);
        });
        updateUI();
    });

    function updateUI() {
        transactionList.innerHTML = '';
        let income = 0;
        let expenses = 0;

        transactions.forEach((transaction) => {
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
                remove(ref(database, `transactions/${transaction.id}`));
            });

            editButton.addEventListener('click', function () {
                const newDescription = prompt('Edit description:', transaction.description);
                const newAmount = prompt('Edit amount:', transaction.amount);
                if (newDescription !== null && newAmount !== null) {
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

        totalIncome.textContent = income;
        totalExpenses.textContent = expenses;
        netBalance.textContent = income - expenses;
    }
});
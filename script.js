import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC7ukSYaUnmGYYPSDV4TLboeGCofEHsYQA",
    authDomain: "budget-planner-fab32.firebaseapp.com",
    databaseURL: "https://budget-planner-fab32-default-rtdb.firebaseio.com/",
    projectId: "budget-planner-fab32",
    storageBucket: "budget-planner-fab32.firebasestorage.app",
    messagingSenderId: "296915913870",
    appId: "1:296915913870:web:7962aa4ad834d2b96f0ddf",
    measurementId: "G-EY5VY5L52Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const transactionsRef = ref(database, 'transactions');

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function () {
    const transactionForm = document.getElementById('transaction-form');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const categoryInput = document.getElementById('category');
    const transactionList = document.getElementById('transaction-list');
    const totalIncome = document.getElementById('total-income');
    const totalExpenses = document.getElementById('total-expenses');
    const netBalance = document.getElementById('net-balance');

    // Add a new transaction
    transactionForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const description = descriptionInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const category = categoryInput.value;

        if (description && !isNaN(amount)) {
            push(transactionsRef, { description, amount, category });
            descriptionInput.value = '';
            amountInput.value = '';
        } else {
            alert("Please enter a valid description and amount.");
        }
    });

    // Listen for changes in the database
    onValue(transactionsRef, (snapshot) => {
        let income = 0;
        let expenses = 0;
        transactionList.innerHTML = '';

        snapshot.forEach((childSnapshot) => {
            const transaction = childSnapshot.val();
            transaction.id = childSnapshot.key;

            // Create list item for each transaction
            const li = document.createElement('li');
            li.textContent = `${transaction.description}: $${transaction.amount} (${transaction.category})`;

            // Add Edit button
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => {
                const newDescription = prompt('Edit description:', transaction.description);
                const newAmount = prompt('Edit amount:', transaction.amount);
                if (newDescription && newAmount) {
                    update(ref(database, `transactions/${transaction.id}`), {
                        description: newDescription.trim(),
                        amount: parseFloat(newAmount)
                    });
                }
            });

            // Add Delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
                alert ('Are you sure you want to delete this transaction?');
                remove(ref(database, `transactions/${transaction.id}`));
            });

            // Append buttons to the list item
            li.appendChild(editButton);
            li.appendChild(deleteButton);
            transactionList.appendChild(li);

            // Calculate totals
            if (transaction.category === 'income') {
                income += transaction.amount;
            } else {
                expenses += transaction.amount;
            }
        });

        // Update summary
        totalIncome.textContent = income;
        totalExpenses.textContent = expenses;
        netBalance.textContent = income - expenses;
    });
});
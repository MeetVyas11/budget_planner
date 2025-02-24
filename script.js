import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const auth = getAuth(app);
const transactionsRef = ref(database, 'transactions');

// DOM Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const toggleSignup = document.getElementById('toggle-signup');
const toggleLogin = document.getElementById('toggle-login');
const logoutButton = document.getElementById('logout-button');

const transactionForm = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const transactionList = document.getElementById('transaction-list');
const totalIncome = document.getElementById('total-income');
const totalExpenses = document.getElementById('total-expenses');
const netBalance = document.getElementById('net-balance');

// Toggle between Login and Signup forms
toggleSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
});

toggleLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
});

// Handle User Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email-login').value.trim();
    const password = document.getElementById('password-login').value.trim();

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert('Logged in successfully!');
            loginForm.reset();
        })
        .catch((error) => {
            alert(`Error: ${error.message}`);
        });
});

// Handle User Signup
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email-signup').value.trim();
    const password = document.getElementById('password-signup').value.trim();

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert('User created successfully!');
            signupForm.reset();
        })
        .catch((error) => {
            alert(`Error: ${error.message}`);
        });
});

// Handle User Logout
logoutButton.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            alert('Logged out successfully!');
        })
        .catch((error) => {
            alert(`Error: ${error.message}`);
        });
});

// Monitor Authentication State
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        loadTransactions(); // Load transactions for the logged-in user
    } else {
        // User is logged out
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
        transactionList.innerHTML = ''; // Clear transaction list
        totalIncome.textContent = '0';
        totalExpenses.textContent = '0';
        netBalance.textContent = '0';
    }
});

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

// Load transactions from the database
function loadTransactions() {
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
            editButton.className = 'edit'; // Add class for styling
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
            deleteButton.className = 'delete'; // Add class for styling
            deleteButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this transaction?')) {
                    remove(ref(database, `transactions/${transaction.id}`));
                }
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
}
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

// API Key
const OPENAI_API_KEY = "AIzaSyApO_9jX01687KgQpZweOKNNb7nF-7_DuI"; 

document.addEventListener('DOMContentLoaded', function () {
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

    // Chatbot Elements
    const chatbotHeader = document.getElementById('chatbot-header');
    const chatbotBody = document.getElementById('chatbot-body');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotUserInput = document.getElementById('chatbot-user-input');

    // Toggle Chatbot Visibility
    chatbotHeader.addEventListener('click', () => {
        if (chatbotBody.style.display === 'none') {
            chatbotBody.style.display = 'block';
            chatbotInput.style.display = 'block';
        } else {
            chatbotBody.style.display = 'none';
            chatbotInput.style.display = 'none';
        }
    });

    // Handle Chatbot User Input
    chatbotUserInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const userMessage = chatbotUserInput.value.trim();
            if (userMessage) {
                // Display user message
                appendMessage('user', userMessage);
                chatbotUserInput.value = '';

                // Show loading indicator
                appendMessage('ai', 'Thinking...');

                // Handle specific commands
                if (!handleBudgetCommands(userMessage)) {
                    // Get AI response for general queries
                    const aiResponse = await getAIResponse(userMessage);
                    // Remove the "Thinking..." message
                    chatbotMessages.lastChild.remove();
                    appendMessage('ai', aiResponse);
                }
            }
        }
    });

    // Function to append messages to the chat
    function appendMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender}`;
        messageElement.textContent = `${sender === 'user' ? 'You: ' : 'AI: '}${message}`;
        chatbotMessages.appendChild(messageElement);
        chatbotBody.scrollTop = chatbotBody.scrollHeight; // Auto-scroll to bottom
    }

    // Function to handle budget-specific commands
    function handleBudgetCommands(request) {
        if (request.startsWith("add transaction")) {
            const parts = request.replace("add transaction", "").trim().split(" ");
            const amount = parseFloat(parts[0]);
            const category = parts[1];
            const description = parts.slice(2).join(" ");

            if (amount && category && description) {
                addTransaction(description, amount, category);
                appendMessage('ai', `Added transaction: $${amount} for ${category} (${description})`);
            } else {
                appendMessage('ai', "Please provide a valid transaction format: 'add transaction [amount] [category] [description]'");
            }
            return true;
        } else if (request.startsWith("show summary")) {
            appendMessage('ai', `Total Income: $${totalIncome.textContent}, Total Expenses: $${totalExpenses.textContent}, Net Balance: $${netBalance.textContent}`);
            return true;
        }

        return false;
    }

    // Function to get AI response using OpenAI API
    async function getAIResponse(request) {
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo", // Use GPT-3.5 Turbo
                    messages: [{ role: "user", content: request }],
                }),
            });

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error("Error fetching AI response:", error);
            return "Sorry, I couldn't process your request. Please try again.";
        }
    }

    // Add a new transaction
    function addTransaction(description, amount, category) {
        const user = auth.currentUser;
        if (user) {
            const userTransactionsRef = ref(database, `users/${user.uid}/transactions`);
            push(userTransactionsRef, { description, amount, category });
        } else {
            alert("User not logged in.");
        }
    }

    // Monitor Authentication State
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is logged in
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';

            // Load transactions for the logged-in user
            const userTransactionsRef = ref(database, `users/${user.uid}/transactions`);
            loadTransactions(userTransactionsRef);
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

    // Load transactions from the database
    function loadTransactions(transactionsRef) {
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
                editButton.className = 'edit';
                editButton.addEventListener('click', () => {
                    const newDescription = prompt('Edit description:', transaction.description);
                    const newAmount = prompt('Edit amount:', transaction.amount);
                    if (newDescription && newAmount) {
                        update(ref(database, `users/${auth.currentUser.uid}/transactions/${transaction.id}`), {
                            description: newDescription.trim(),
                            amount: parseFloat(newAmount)
                        });
                    }
                });

                // Add Delete button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'delete';
                deleteButton.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this transaction?')) {
                        remove(ref(database, `users/${auth.currentUser.uid}/transactions/${transaction.id}`));
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

    // Add a new transaction via form
    transactionForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const description = descriptionInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const category = categoryInput.value;

        if (description && !isNaN(amount)) {
            addTransaction(description, amount, category);
            descriptionInput.value = '';
            amountInput.value = '';
        } else {
            alert("Please enter a valid description and amount.");
        }
    });
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
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
        push(transactionsRef, { description, amount, category });
        descriptionInput.value = '';
        amountInput.value = '';
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
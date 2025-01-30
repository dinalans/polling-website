// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBUb5bbOS8HltAP7YNyGh6skX2AeuNHO5E",
    authDomain: "pollingwebsite-31302.firebaseapp.com",
    databaseURL: "https://pollingwebsite-31302-default-rtdb.firebaseio.com",
    projectId: "pollingwebsite-31302",
    storageBucket: "pollingwebsite-31302.firebasestorage.app",
    messagingSenderId: "249329617494",
    appId: "1:249329617494:web:e5330f7c4460bfdcc689f7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Reference to the "votes" path in your database
const votesRef = ref(database, 'votes');

// Handle form submission
const pollForm = document.getElementById('pollForm');
pollForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const vote = document.querySelector('input[name="vote"]:checked').value;

    if (username && vote) {
        const newVoteRef = push(votesRef);
        newVoteRef.set({
            username: username,
            vote: vote,
            timestamp: Date.now()
        })
            .then(() => {
                alert('Your vote has been recorded!');
                pollForm.reset();
            })
            .catch((error) => {
                console.error('Error saving vote:', error);
                alert('Error saving vote. Please try again.');
            });
    } else {
        alert('Please enter your name and select a vote.');
    }
});

// Display votes in order received
const resultsList = document.getElementById('results');
onChildAdded(votesRef, (data) => {
    const voteData = data.val();
    const listItem = document.createElement('li');
    listItem.textContent = `${voteData.username}: ${voteData.vote}`;
    resultsList.appendChild(listItem);
});

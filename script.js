// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getDatabase, ref, push, set, onChildAdded, onValue, get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

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
const votesRef = ref(database, 'votes');
const settingsRef = ref(database, 'settings/votingEnabled');

// State to track voting status
let votingEnabled = false;

// Fetch initial voting status and update UI
onValue(settingsRef, (snapshot) => {
    votingEnabled = snapshot.val();
    const votingStatusMessage = document.getElementById('votingStatusMessage');
    const pollForm = document.getElementById('pollForm');

    if (votingEnabled) {
        votingStatusMessage.textContent = "Voting is enabled. Please cast your vote.";
        pollForm.style.display = "block";
        pollResults.style.display = "block";
    } else {
        votingStatusMessage.textContent = "Voting is currently disabled.";
        pollForm.style.display = "none";
        pollResults.style.display = "none";
    }
});

// Handle form submission
const pollForm = document.getElementById('pollForm');
pollForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Re-check the voting status before submitting the vote
    const snapshot = await get(settingsRef);
    votingEnabled = snapshot.val();

    if (!votingEnabled) {
        alert("Voting is currently disabled.");
        return;
    }

    const username = document.getElementById('username').value.trim();
    const vote = document.querySelector('input[name="vote"]:checked').value;

    if (username && vote) {
        const newVoteRef = push(votesRef);
        set(newVoteRef, {
            username: username,
            vote: vote,
            timestamp: Date.now(),
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
    // Display votes in order received
  
});


const resultsList = document.getElementById('results');
let voteIndex = 1;
onChildAdded(votesRef, (data) => {
    const voteData = data.val();
    const listItem = document.createElement('li');
    listItem.textContent = `${voteIndex++}.${voteData.username}: ${voteData.vote}`;
    resultsList.appendChild(listItem);
});


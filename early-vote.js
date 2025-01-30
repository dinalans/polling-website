// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getDatabase, ref, push, set, onChildAdded, onValue, get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

// Your Firebase configuration object
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
const auth = getAuth(app);
const database = getDatabase(app);

// References to the relevant paths in the database
const earlySettingsRef = ref(database, 'settings/earlyVotingEnabled');
const earlyVotesRef = ref(database, 'votes');

// Handle early login form submission
document.getElementById('earlyLoginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('earlyEmail').value;
    const password = document.getElementById('earlyPassword').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            // Signed in
            document.getElementById('earlyLoginDiv').style.display = 'none';
            document.getElementById('earlyVoteDiv').style.display = 'block';
            loadEarlyVotingStatus();
        })
        .catch(error => {
            console.error('Error signing in:', error);
            alert('Error signing in. Please try again.');
        });
});

// Check if user is already signed in for early voting
onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById('earlyLoginDiv').style.display = 'none';
        document.getElementById('earlyVoteDiv').style.display = 'block';
        loadEarlyVotingStatus();
    } else {
        document.getElementById('earlyLoginDiv').style.display = 'block';
        document.getElementById('earlyVoteDiv').style.display = 'none';
    }
});

// Load early voting status and update UI
function loadEarlyVotingStatus() {
    onValue(earlySettingsRef, (snapshot) => {
        const earlyVotingEnabled = snapshot.val();
        const earlyVotingStatusMessage = document.getElementById('earlyVotingStatusMessage');
        const earlyPollForm = document.getElementById('earlyPollForm');

        if (earlyVotingEnabled) {
            earlyVotingStatusMessage.textContent = "Early voting is enabled. Please cast your vote.";
            earlyPollForm.style.display = "block";
        } else {
            earlyVotingStatusMessage.textContent = "Early voting is currently disabled.";
            earlyPollForm.style.display = "none";
        }
    });
}

// Handle early form submission
document.getElementById('earlyPollForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Re-check the early voting status before submitting the vote
    const snapshot = await get(earlySettingsRef);
    const earlyVotingEnabled = snapshot.val();

    if (!earlyVotingEnabled) {
        alert("Early voting is currently disabled.");
        return;
    }

    const username = document.getElementById('earlyUsername').value.trim();
    const vote = document.querySelector('input[name="earlyVote"]:checked').value;

    if (username && vote) {
        const newVoteRef = push(earlyVotesRef);
        set(newVoteRef, {
            username: username,
            vote: vote,
            timestamp: Date.now(),
        })
            .then(() => {
                alert('Your vote has been recorded!');
                document.getElementById('earlyPollForm').reset();
            })
            .catch((error) => {
                console.error('Error saving vote:', error);
                alert('Error saving vote. Please try again.');
            });
    } else {
        alert('Please enter your name and select a vote.');
    }
});

// Display early votes in order received
const earlyResultsList = document.getElementById('results');
let voteIndex = 1;
onChildAdded(earlyVotesRef, (data) => {
    const voteData = data.val();
    const listItem = document.createElement('li');
    listItem.textContent = `${voteIndex++}.${voteData.username}: ${voteData.vote}`;
    earlyResultsList.appendChild(listItem);
});

// Logout function for early voting
window.earlyLogout = function () {
    signOut(auth)
        .then(() => {
            document.getElementById('earlyLoginDiv').style.display = 'block';
            document.getElementById('earlyVoteDiv').style.display = 'none';
        })
        .catch((error) => {
            console.error('Error signing out:', error);
            alert('Error signing out. Please try again.');
        });
}

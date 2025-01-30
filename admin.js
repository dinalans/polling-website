import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js';
import {
    getDatabase,
    ref,
    set,
    remove,
    onValue,
    onChildAdded,
    child,
    get,
} from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-functions.js';

// Your Firebase configuration object
const firebaseConfig = {
    // Your Firebase configuration
    apiKey: "AIzaSyBUb5bbOS8HltAP7YNyGh6skX2AeuNHO5E",
    authDomain: "pollingwebsite-31302.firebaseapp.com",
    databaseURL: "https://pollingwebsite-31302-default-rtdb.firebaseio.com",
    projectId: "pollingwebsite-31302",
    storageBucket: "pollingwebsite-31302.firebasestorage.app",
    messagingSenderId: "249329617494",
    appId: "1:249329617494:web:e5330f7c4460bfdcc689f7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const functions = getFunctions(app);

// References to database paths
const settingsRef = ref(database, 'settings');
const votingEnabledRef = ref(database, 'settings/votingEnabled');
const earlyVotingEnabledRef = ref(database, 'settings/earlyVotingEnabled');
const votesRef = ref(database, 'votes');
const earlyVotesRef = ref(database, 'earlyVotes');
const adminUsersRef = ref(database, 'adminUsers');

// Check if the user is admin
async function checkIfAdmin(uid) {
    try {
        const snapshot = await get(child(adminUsersRef, uid));
        if (snapshot.exists()) {
            // User is an admin
            loadAdminFunctions();
        } else {
            alert('Access denied: You are not an admin.');
            await signOut(auth);
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        alert('Error checking admin status. Please try again.');
        await signOut(auth);
        window.location.href = 'index.html';
    }
}

// Authenticate admin
onAuthStateChanged(auth, (user) => {
    if (user) {
        checkIfAdmin(user.uid);
    } else {
        alert('You must be signed in to access the admin panel.');
        window.location.href = 'admin.html';
    }
});

function loadAdminFunctions() {
    // Display the admin content
    document.getElementById('adminFunctions').style.display = 'block';

    // Fetch initial voting statuses
    onValue(votingEnabledRef, (snapshot) => {
        const votingEnabled = snapshot.val();
        document.getElementById('votingStatus').textContent = votingEnabled
            ? 'Voting is enabled'
            : 'Voting is disabled';
    });

    onValue(earlyVotingEnabledRef, (snapshot) => {
        const earlyVotingEnabled = snapshot.val();
        document.getElementById('earlyVotingStatus').textContent = earlyVotingEnabled
            ? 'Early Voting is enabled'
            : 'Early Voting is disabled';
    });

    // Function to toggle voting
    window.toggleVoting = async function () {
        try {
            const snapshot = await get(votingEnabledRef);
            const votingEnabled = snapshot.val();
            await set(votingEnabledRef, !votingEnabled);
            document.getElementById('votingStatus').textContent = !votingEnabled
                ? 'Voting is enabled'
                : 'Voting is disabled';
        } catch (error) {
            console.error('Error toggling voting:', error);
            alert('Error toggling voting. Please try again.');
        }
    };

    // Function to toggle early voting
    window.toggleEarlyVoting = async function () {
        try {
            const snapshot = await get(earlyVotingEnabledRef);
            const earlyVotingEnabled = snapshot.val();
            await set(earlyVotingEnabledRef, !earlyVotingEnabled);
            document.getElementById('earlyVotingStatus').textContent = !earlyVotingEnabled
                ? 'Early Voting is enabled'
                : 'Early Voting is disabled';
        } catch (error) {
            console.error('Error toggling early voting:', error);
            alert('Error toggling early voting. Please try again.');
        }
    };

    // Function to clear all votes
    window.clearVotes = async function () {
        try {
            await remove(votesRef);
            await remove(earlyVotesRef);
            alert('All votes have been cleared.');
            // Clear the votes lists
            document.getElementById('combinedVotesList').innerHTML = '';
        } catch (error) {
            console.error('Error clearing votes:', error);
            alert('Error clearing votes. Please try again.');
        }
    };

    // Function to log out
    window.logout = async function () {
        try {
            await signOut(auth);
            document.getElementById('adminFunctions').style.display = 'none';
            window.location.href = 'admin.html';
        } catch (error) {
            console.error('Error signing out:', error);
            alert('Error signing out. Please try again.');
        }
    };

    // Display combined poll results
    displayCombinedResults();
}

// Function to display combined poll results
function displayCombinedResults() {
    const combinedVotesList = document.getElementById('combinedVotesList');
    const combinedVotes = [];

    // Fetch regular votes
    get(votesRef)
        .then((snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const voteData = childSnapshot.val();
                combinedVotes.push({
                    username: voteData.username,
                    vote: voteData.vote,
                    timestamp: voteData.timestamp,
                });
            });

            // Fetch early votes
            return get(earlyVotesRef);
        })
        .then((earlySnapshot) => {
            earlySnapshot.forEach((childSnapshot) => {
                const voteData = childSnapshot.val();
                combinedVotes.push({
                    username: voteData.username,
                    vote: voteData.vote,
                    timestamp: voteData.timestamp,
                });
            });

            // Sort combined votes by timestamp
            combinedVotes.sort((a, b) => a.timestamp - b.timestamp);

            // Display combined votes
            combinedVotesList.innerHTML = ''; // Clear list before displaying
            combinedVotes.forEach((voteData) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${voteData.username}: ${voteData.vote}`;
                combinedVotesList.appendChild(listItem);
            });
        })
        .catch((error) => {
            console.error('Error fetching votes:', error);
            alert('Error fetching votes. Please try again.');
        });
}

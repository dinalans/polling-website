import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getDatabase, ref, set, remove, onValue, onChildAdded, child, get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-functions.js';

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
const adminUsersRef = ref(database, 'adminUsers');

// References to the relevant paths in the database
const settingsRef = ref(database, 'settings/votingEnabled');
const earlySettingsRef = ref(database, 'settings/earlyVotingEnabled');
const votesRef = ref(database, 'votes');
const earlyVotesRef = ref(database, 'earlyVotes');

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            // Signed in
            checkIfAdmin(userCredential.user.uid);
        })
        .catch(error => {
            console.error('Error signing in:', error);
            alert('Error signing in. Please try again.');
        });
});

// Check if user is already signed in
onAuthStateChanged(auth, (user) => {
    if (user) {
        checkIfAdmin(user.uid);
    } else {
        document.getElementById('loginDiv').style.display = 'block';
        document.getElementById('adminFunctions').style.display = 'none';
    }
});

async function checkIfAdmin(uid) {
    try {
        // Access child node correctly
        const snapshot = await get(child(adminUsersRef, uid));
        if (snapshot.exists()) {
            // User is an admin
            document.getElementById('loginDiv').style.display = 'none';
            document.getElementById('adminFunctions').style.display = 'block';
            loadAdminFunctions();
        } else {
            alert('Access denied: You are not an admin.');
            await signOut(auth);
            window.location.href = 'admin.html'; // Redirect to the same page
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        alert('Error checking admin status. Please try again.');
        await signOut(auth);
        window.location.href = 'admin.html'; // Redirect to the same page
    }
}

function loadAdminFunctions() {
    // Function to toggle voting
    window.toggleVoting = function () {
        onValue(settingsRef, (snapshot) => {
            const votingEnabled = snapshot.val();
            set(settingsRef, !votingEnabled)
                .then(() => {
                    document.getElementById('votingStatus').textContent = !votingEnabled ? "Voting is enabled" : "Voting is disabled";
                })
                .catch((error) => {
                    console.error('Error toggling voting:', error);
                    alert('Error toggling voting. Please try again.');
                });
        }, { onlyOnce: true });
    };

    // Function to toggle early voting
    window.toggleEarlyVoting = function () {
        onValue(earlySettingsRef, (snapshot) => {
            const earlyVotingEnabled = snapshot.val();
            set(earlySettingsRef, !earlyVotingEnabled)
                .then(() => {
                    document.getElementById('earlyVotingStatus').textContent = !earlyVotingEnabled ? "Early Voting is enabled" : "Early Voting is disabled";
                })
                .catch((error) => {
                    console.error('Error toggling early voting:', error);
                    alert('Error toggling early voting. Please try again.');
                });
        }, { onlyOnce: true });
    };

    // Function to clear all votes
    window.clearVotes = function () {
        remove(votesRef)
            .then(() => {
                alert('All votes have been cleared.');
                // Clear the votes list
                document.getElementById('votesList').innerHTML = '';
            })
            .catch((error) => {
                console.error('Error clearing votes:', error);
                alert('Error clearing votes. Please try again.');
            });
        remove(earlyVotesRef)
            .then(() => {
                alert('All early votes have been cleared.');
                // Clear the early votes list
                document.getElementById('earlyVotesList').innerHTML = '';
            })
            .catch((error) => {
                console.error('Error clearing early votes:', error);
                alert('Error clearing early votes. Please try again.');
            });
    };

    // Fetch initial voting statuses
    onValue(settingsRef, (snapshot) => {
        const votingEnabled = snapshot.val();
        document.getElementById('votingStatus').textContent = votingEnabled ? "Voting is enabled" : "Voting is disabled";
    });

    onValue(earlySettingsRef, (snapshot) => {
        const earlyVotingEnabled = snapshot.val();
        document.getElementById('earlyVotingStatus').textContent = earlyVotingEnabled ? "Early Voting is enabled" : "Early Voting is disabled";
    });

    // Logout function
    window.logout = function () {
        signOut(auth)
            .then(() => {
                document.getElementById('loginDiv').style.display = 'block';
                document.getElementById('adminFunctions').style.display = 'none';
            })
            .catch((error) => {
                console.error('Error signing out:', error);
                alert('Error signing out. Please try again.');
            });
    };

    // Display votes in order received
  
    // Display early votes in order received

    // Display votes in order received
    const resultsList = document.getElementById('results');
    onChildAdded(votesRef, (data) => {
        const voteData = data.val();
        const listItem = document.createElement('li');
        listItem.textContent = `${voteData.username}: ${voteData.vote}`;
        resultsList.appendChild(listItem);
    });
}
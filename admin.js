// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getDatabase, ref, set, remove, onValue } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

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
const settingsRef = ref(database, 'settings/votingEnabled');
const votesRef = ref(database, 'votes');

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            // Signed in
            document.getElementById('loginDiv').style.display = 'none';
            document.getElementById('adminFunctions').style.display = 'block';
            loadAdminFunctions();
        })
        .catch(error => {
            console.error('Error signing in:', error);
            alert('Error signing in. Please try again.');
        });
});

// Check if user is already signed in
onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById('loginDiv').style.display = 'none';
        document.getElementById('adminFunctions').style.display = 'block';
        loadAdminFunctions();
    } else {
        document.getElementById('loginDiv').style.display = 'block';
        document.getElementById('adminFunctions').style.display = 'none';
    }
});

// Load admin functions
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
    }

    // Function to clear all votes
    window.clearVotes = function () {
        remove(votesRef)
            .then(() => {
                alert('All votes have been cleared.');
            })
            .catch((error) => {
                console.error('Error clearing votes:', error);
                alert('Error clearing votes. Please try again.');
            });
    }

    // Fetch initial voting status
    onValue(settingsRef, (snapshot) => {
        const votingEnabled = snapshot.val();
        document.getElementById('votingStatus').textContent = votingEnabled ? "Voting is enabled" : "Voting is disabled";
    }, { onlyOnce: true });

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
    }
}

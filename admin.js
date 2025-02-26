import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getDatabase, ref, set, remove, onValue, onChildAdded, child, get,update } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
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
//const earlyVotesRef = ref(database, 'earlyVotes');

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
            setupAdminFunctions();
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

function setupAdminFunctions() {
    // Load users when admin panel is opened
    loadUsers();
}
async function loadUsers() {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
        const usersData = snapshot.val();
        if (usersData) {
            // Use Object.entries to get an array of [uid, userData] pairs
            const usersArray = Object.entries(usersData);
            populateUserTable(usersArray);
        } else {
            alert('No users found.');
        }
    }, (error) => {
        console.error('Error fetching users:', error);
        alert('Error fetching users. Please try again.');
    });
}

function populateUserTable(usersArray) {
    const userTableBody = document.querySelector('#userTable tbody');
    userTableBody.innerHTML = ''; // Clear existing rows

    usersArray.forEach(([uid, user]) => {
        const tr = document.createElement('tr');

        // UID
        const uidTd = document.createElement('td');
        uidTd.textContent = uid;
        tr.appendChild(uidTd);

        // Email
        const emailTd = document.createElement('td');
        emailTd.textContent = user.email || '';
        tr.appendChild(emailTd);

        // Display Name
        const nameTd = document.createElement('td');
        nameTd.textContent = user.username || '';
        tr.appendChild(nameTd);

        // Early Voting Status
        const statusTd = document.createElement('td');
        const isEligible = user.eligibleForEarlyVoting === true;
        statusTd.textContent = isEligible ? 'Enabled' : 'Disabled';
        tr.appendChild(statusTd);

        // Toggle Early Voting Button
        const toggleTd = document.createElement('td');
        const toggleButton = document.createElement('button');
        toggleButton.textContent = isEligible ? 'Disable' : 'Enable';
        toggleButton.addEventListener('click', () => {
            toggleEarlyVotingStatus(uid, !isEligible, statusTd, toggleButton);
        });
        toggleTd.appendChild(toggleButton);
        tr.appendChild(toggleTd);

        userTableBody.appendChild(tr);
    });
}

async function toggleEarlyVotingStatus(uid, enable, statusTd, toggleButton) {
    try {
        // Update 'eligibleForEarlyVoting' in the user's data
        const userRef = ref(database, `users/${uid}`);
        await update(userRef, { eligibleForEarlyVoting: enable });
        // Update UI
        statusTd.textContent = enable ? 'Enabled' : 'Disabled';
        toggleButton.textContent = enable ? 'Disable' : 'Enable';
    } catch (error) {
        console.error('Error updating early voting status:', error);
        alert('Error updating early voting status. Please try again.');
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
                document.getElementById('results').innerHTML = '';
            })
            .catch((error) => {
                console.error('Error clearing votes:', error);
                alert('Error clearing votes. Please try again.');
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


   

}
// Display votes in order received
const resultsList = document.getElementById('results');
let votesArray = [];

// Listen for child added events to detect new votes
onChildAdded(votesRef, (data) => {
    const voteData = data.val();
    votesArray.push(voteData);
    
    // Sort the array by timestamp
    votesArray.sort((a, b) => a.timestamp - b.timestamp);
    
    // Display the sorted votes
    displayVotes(votesArray);
});

function displayVotes(votesArray) {
    resultsList.innerHTML = '';
    let voteIndex = 1;
    votesArray.forEach((voteData) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${voteIndex++}. ${voteData.username}`;
        resultsList.appendChild(listItem);
    });
}


/* let voteIndex = 1;
onChildAdded(votesRef, (data) => {
    const voteData = data.val();
    const listItem = document.createElement('li');
    listItem.textContent = `${voteIndex++}.${voteData.username}: ${voteData.vote}`;
    resultsList.appendChild(listItem);
});
 */
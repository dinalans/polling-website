import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

// Your Firebase configuration
const firebaseConfig = {
    // Your configuration details
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

// Ensure the user is logged in
onAuthStateChanged(auth, user => {
    if (!user) {
        alert('Please log in to update your profile.');
        window.location.href = 'index.html';
    }
});

// Handle Profile Update
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const newDisplayName = document.getElementById('newDisplayName').value.trim();
    if (newDisplayName === '') {
        alert('Display name cannot be empty.');
        return;
    }

    try {
        // Update the display name in Firebase Auth
        await updateProfile(auth.currentUser, {
            displayName: newDisplayName
        });

        // Update the user's name in the database
        const userRef = ref(database, `users/${auth.currentUser.uid}`);
        await update(userRef, {
            username: newDisplayName
        });

        alert('Display name updated successfully!');
        window.location.href = 'index.html'; // Redirect to main page

    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile. Please try again.');
    }
});

function logout() {
    signOut(auth)
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch(error => {
            console.error('Logout Error:', error);
            alert('Error logging out. Please try again.');
        });
}

window.logout = logout;

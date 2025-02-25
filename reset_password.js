// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Your Firebase configuration object
const firebaseConfig = {
    // Your Firebase configuration details
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

// Handle Password Reset Form Submission
document.getElementById('resetPasswordForm').addEventListener('submit', handlePasswordReset);

function handlePasswordReset(event) {
    event.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();

    sendPasswordResetEmail(auth, email)
        .then(() => {
            alert('Password reset email sent! Please check your inbox.');
            // Optionally, redirect the user back to the login page
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Error sending password reset email:', error);
            let errorMessage = 'An error occurred while sending password reset email. Please try again.';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No user found with this email address.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            }
            alert(errorMessage);
        });
}

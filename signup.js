// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

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

// Initialize Firebase and references
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Handle Signup
// ... other code ...

// Handle Signup
async function handleSignup(event) {
  event.preventDefault();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const username = document.getElementById('username').value.trim();

  if (username === '') {
    alert('Please enter your name.');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update User Profile
    await updateProfile(user, {
      displayName: username,
    });

    // Store User Details in Database
    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, {
      uid: user.uid,
      username: username,
      email: email,
      joinedAt: Date.now(),
      eligibleForEarlyVoting: false, // Default to false
    });

    alert('Registration successful! Redirecting to login page.');
    window.location.href = 'index.html';

  } catch (error) {
    console.error('Signup Error:', error);
    alert('Unable to sign up. Please check your details and try again.');
  }
}

// ... other code ...


// Event Listener
document.getElementById('signupForm').addEventListener('submit', handleSignup);

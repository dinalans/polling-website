// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getDatabase, ref, set, onValue, get, update } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";


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

// Initialize Firebase and references
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const votingEnabledRef = ref(database, 'settings/votingEnabled');
const votesRef = ref(database, 'votes');

// Handle Login Form Submission
document.getElementById('loginForm').addEventListener('submit', handleLogin);

// UI Elements
const navbarUsername = document.getElementById('navbarUsername');
const userDropdown = document.getElementById('userDropdown');
const signinNavItem = document.getElementById('signinNavItem');
const signupNavItem = document.getElementById('signupNavItem');
const updateProfileLink = document.getElementById('updateProfileLink');
const passwordResetLink = document.getElementById('passwordResetLink');


function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      $('#signinModal').modal('hide');
      // The auth state listener will handle the rest
    })
    .catch(error => {
      console.error('Login Error:', error);
      alert('Incorrect email or password. Please try again.');
    });
}

// Handle Signup Form Submission
document.getElementById('signupForm').addEventListener('submit', handleSignup);

function handleSignup(event) {
    event.preventDefault();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const username = document.getElementById('signupUsername').value.trim();

    if (username === '') {
        alert('Please enter your name.');
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            // Update User Profile
            updateProfile(auth.currentUser, {
                displayName: username
            }).then(() => {
                // Store user details in the database
                const userRef = ref(database, `users/${auth.currentUser.uid}`);
                set(userRef, {
                    uid: auth.currentUser.uid,
                    username: username,
                    email: email,
                    joinedAt: Date.now(),
                    eligibleForEarlyVoting: false // Default value
                });
                $('#signupModal').modal('hide');
                alert('Registration successful! Please log in.');
            });
        })
        .catch(error => {
            console.error('Signup Error:', error);
            alert('Unable to sign up. Please check your details and try again.');
        });
}


// Monitor Authentication State
// Monitor Authentication State
function setupAuthListener() {
  onAuthStateChanged(auth, async (user) => {
    console.log('Auth state changed. User:', user ? user.email : 'null');

    if (user) {
      console.log('User is signed in:', user.email);

      try {
        // Force refresh the ID token
        await user.getIdToken(true);
        console.log('ID token refreshed successfully.');
      } catch (tokenError) {
        console.error('Error refreshing ID token:', tokenError);
        // Optionally, handle token refresh failure
        // await signOut(auth);
        // return; // Exit the function if needed
      }

      toggleDisplay(true);
      displayUserName(); // Ensure this line is present

      try {
        await checkUserEligibilityAndVotingStatus(user.uid);
      } catch (error) {
        console.error('Error during auth state change:', error);
      }
    } else {
      console.log('User is signed out.');
      toggleDisplay(false);
      displayUserName(); // Clear username display
    }
  });
}






async function checkUserEligibilityAndVotingStatus(uid) {
  console.log('Checking eligibility for UID:', uid);
  try {
    const userRef = ref(database, `users/${uid}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      console.error('User data not found in database.');
      alert('Your user data was not found. Please contact support.');
      return;
    }

    const userData = userSnapshot.val();
    console.log('User data found:', userData);
    displayUserName();
    // Fetch the global voting status
    const votingEnabledSnapshot = await get(votingEnabledRef);
    const votingEnabled = votingEnabledSnapshot.val();
    console.log('Voting enabled:', votingEnabled);
    
    if (votingEnabled || userData.eligibleForEarlyVoting) {
      // Voting is enabled for all users or user is eligible for early voting
      showVotingOptions(userData.eligibleForEarlyVoting);
    } else {
      // Voting is disabled, and user is not eligible for early voting
      console.log('User is not eligible for early voting and voting is disabled.');
      showVotingClosedMessage();
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    alert('An error occurred while fetching your data. Please try again later.');
  }
}

window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled Promise Rejection:', event.reason);
});

// Listen for changes in voting status
onValue(votingEnabledRef, (snapshot) => {
  const votingEnabled = snapshot.val();
  console.log('Voting status updated:', votingEnabled);
  // Update the UI or state as needed
});


// Modify showVotingOptions function
function showVotingOptions(isEarlyVoter = false) {
  // No need to hide the carousel
  const votingStatusMessage = document.getElementById('votingStatusMessage');
  const pollForm = document.getElementById('pollForm');

  if (isEarlyVoter) {
      votingStatusMessage.textContent = "Early voting is open. Please cast your vote.";
      displayVotes();
  } else {
      votingStatusMessage.textContent = "Voting is open. Please cast your vote.";
      displayVotes();
  }
  pollForm.style.display = "block";


}

function showVotingClosedMessage() {
  const votingStatusMessage = document.getElementById('votingStatusMessage');
  const pollForm = document.getElementById('pollForm');
  const pollResultsDiv = document.getElementById('pollResults');
  const user = auth.currentUser;

  votingStatusMessage.textContent = "Voting is currently closed. Please check back later.";
  pollForm.style.display = "none";

  if (user) {
    const userId = user.uid;
    const userRef = ref(database, `users/${userId}`);
    get(userRef).then((userSnapshot) => {
      const userData = userSnapshot.val();
      if (!userData.eligibleForEarlyVoting) {
        pollResultsDiv.style.display = "none";
      }
    }).catch((error) => {
      console.error('Error fetching user data:', error);
    });
  } else {
    pollResultsDiv.style.display = "none";
  }
}


function toggleDisplay(isLoggedIn) {
  console.log('toggleDisplay called with isLoggedIn:', isLoggedIn);

  // Toggle navbar items
 
  signinNavItem.classList.toggle('d-none', isLoggedIn);
  signupNavItem.classList.toggle('d-none', isLoggedIn);
  userDropdown.classList.toggle('d-none', !isLoggedIn);

  // Toggle sections
  if (isLoggedIn) {
    console.log('User is logged in. Showing poll section.');
    document.getElementById('signInPrompt').classList.add('d-none');
    document.getElementById('pollSection').classList.remove('d-none');
  } else {
    console.log('User is not logged in. Showing sign-in prompt.');
    document.getElementById('signInPrompt').classList.remove('d-none');
    document.getElementById('pollSection').classList.add('d-none');
  }
}


function displayUserName() {
  const user = auth.currentUser;
  if (user) {
    const username = user.displayName || user.email;
    navbarUsername.textContent = username;
    // Also update the welcome message in the polling section
    document.getElementById('welcomeMessageCard').textContent = `Welcome, ${username}!`;
  } else {
    navbarUsername.textContent = 'User';
    document.getElementById('welcomeMessageCard').textContent = '';
  }
}
document.getElementById('logoutLink').addEventListener('click', logout);
// Handle Vote Submission
document.getElementById('pollForm').addEventListener('submit', handleVoteSubmission);
// Event listener for Update Profile link
updateProfileLink.addEventListener('click', () => {
  $('#profileModal').modal('show');
});

// Event listener for Password Reset link
passwordResetLink.addEventListener('click', () => {
  $('#passwordResetModal').modal('show');
});
document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
async function handleProfileUpdate(event) {
  event.preventDefault();
  const newDisplayName = document.getElementById('profileUsername').value.trim();
  if (newDisplayName === '') {
    alert('Display name cannot be empty.');
    return;
  }

  const user = auth.currentUser;
  if (user) {
    try {
      // Update the display name in Firebase Auth
      await updateProfile(user, {
        displayName: newDisplayName
      });

      // Update the username in the Realtime Database
      const userRef = ref(database, `users/${user.uid}`);

      // Ensure 'update' is imported from Firebase Database
      await update(userRef, {
        username: newDisplayName
      });

      displayUserName(); // Update the displayed username
      $('#profileModal').modal('hide');
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  } else {
    alert('No user is currently signed in.');
  }
}

document.getElementById('passwordResetForm').addEventListener('submit', handlePasswordReset);

function handlePasswordReset(event) {
  event.preventDefault();
  
  const email = document.getElementById('resetEmail').value.trim();
  if (email === '') {
    alert('Please enter your email address.');
    return;
  }
  
  sendPasswordResetEmail(auth, email)
    .then(() => {
      $('#passwordResetModal').modal('hide');
      alert('Password reset email sent! Please check your inbox.');
    })
    .catch(error => {
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

// Handle Vote Submission (Updated)
async function handleVoteSubmission(event) {
  event.preventDefault();

  const user = auth.currentUser;

  if (user) {
    const userId = user.uid;
    const username = user.displayName || user.email;
    const voteValue = "Yes"; // Since there's only one option

    try {
      // Check if user has already voted
      const userVoteRef = ref(database, `votes/${userId}`);
      const userVoteSnapshot = await get(userVoteRef);
      if (userVoteSnapshot.exists()) {
        alert('You have already indicated your availability. Thank you!');
        return;
      }

      // Check if voting is enabled or if the user is eligible for early voting
      const [votingEnabledSnapshot, userDataSnapshot] = await Promise.all([
        get(votingEnabledRef),
        get(ref(database, `users/${userId}`))
      ]);

      const votingEnabled = votingEnabledSnapshot.val();
      const userData = userDataSnapshot.val();

      if (votingEnabled || (userData && userData.eligibleForEarlyVoting)) {
        // Allow the vote
        await set(userVoteRef, {
          username: username,
          timestamp: Date.now(),
        });

        alert('Your availability has been recorded!');
        document.getElementById('pollForm').reset();
      } else {
        alert("Voting is currently closed.");
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('An error occurred while submitting your availability. Please try again later.');
    }
  } else {
    alert('Please sign in to submit your availability.');
  }
}

// Display Poll Results (Updated)
function displayVotes() {
  const totalYesVotesHeader = document.getElementById('totalYesVotes');
  const voterNamesContainer = document.getElementById('voterNames');
  const pollResultsDiv = document.getElementById('pollResults');

  onValue(votesRef, (snapshot) => {
    console.log('displayVotes called');
    voterNamesContainer.innerHTML = '';
    const votes = snapshot.val();
    console.log('Votes retrieved from database:', votes);

    if (votes) {
      pollResultsDiv.style.display = 'block'; // Show the poll results div
      const voteEntries = Object.values(votes);

      // Total number of Yes votes
      const totalYesVotes = voteEntries.length;
      totalYesVotesHeader.textContent = `Total Available: ${totalYesVotes}`;

      // Display voter names horizontally in the order they voted
      // Sort by timestamp
      voteEntries.sort((a, b) => a.timestamp - b.timestamp);

      voteEntries.forEach((voteData) => {
        const voterItem = document.createElement('div');
        voterItem.classList.add('voter-item', 'm-2');
        voterItem.textContent = voteData.username;
        voterNamesContainer.appendChild(voterItem);
      });
    } else {
      pollResultsDiv.style.display = 'none';
      console.log('No availability has been indicated yet.');
    }
  });
}
// Logout Functionality
function logout() {
    signOut(auth)
        .then(() => {
            toggleDisplay(false);
            alert('You have been logged out.');
        })
        .catch(error => {
            console.error('Logout Error:', error);
            alert('Error logging out. Please try again.');
        });
}

// Initialize App
setupAuthListener();


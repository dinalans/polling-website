// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

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
const earlyVotingEnabledRef = ref(database, 'settings/earlyVotingEnabled');
const settingsRef = ref(database, 'settings/votingEnabled');
const votesRef = ref(database, 'votes');


// Handle Login
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            toggleDisplay(true);
            loadVotingStatus();
        })
        .catch(error => {
            console.error('Login Error:', error);
            alert('Incorrect email or password. Please try again.');
        });
}

// Monitor Authentication State
function setupAuthListener() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('User is signed in:', user.email);
      try {
        await checkUserEligibilityAndVotingStatus(user.uid);
        displayVotes();
      } catch (error) {
        console.error('Error during auth state change:', error);
        // Do not sign out the user
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
  const userRef = ref(database, `users/${uid}`);
  try {
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

    if (votingEnabled) {
      showVotingOptions();
    } else if (userData.eligibleForEarlyVoting) {
      showVotingOptions(true);
    } else {
      console.log('User is not eligible for early voting and voting is disabled.');
      showVotingClosedMessage();
    }
  } catch (error) {
    console.error('Error in checkUserEligibilityAndVotingStatus:', error);
    alert('An error occurred while checking your eligibility. Please try again later.');

    // Handle potential authentication errors
    if (error.code === 'PERMISSION_DENIED') {
      console.error('Permission denied error:', error);
      // Optionally, refresh the auth token
      await auth.currentUser.getIdToken(true);
    }
  }
}


window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled Promise Rejection:', event.reason);
});


function showVotingClosedMessage() {
  console.log(' showVotingClosedMessage User is not eligible for early voting and voting is disabled.');
  document.getElementById('pollDiv').style.display = 'block';
  document.getElementById('loginDiv').style.display = 'none';
  document.getElementById('votingStatusMessage').textContent = "Voting is currently closed. Please check back later.";
  document.getElementById('pollForm').style.display = "none";
}


  
function showVotingOptions(isEarlyVoter = false) {
  document.getElementById('pollDiv').style.display = 'block';
  document.getElementById('loginDiv').style.display = 'none';

  const votingStatusMessage = document.getElementById('votingStatusMessage');
  const pollForm = document.getElementById('pollForm');

  if (isEarlyVoter) {
      votingStatusMessage.textContent = "Early voting is open. Please cast your vote.";
  } else {
      votingStatusMessage.textContent = "Voting is open. Please cast your vote.";
  }
  pollForm.style.display = "block";

  // Call displayVotes to show the poll results
  displayVotes();
}


function toggleDisplay(isLoggedIn) {
  document.getElementById('loginDiv').style.display = isLoggedIn ? 'none' : 'block';
  if (!isLoggedIn) {
    document.getElementById('pollDiv').style.display = 'none';
  }
}


// Load Voting Status and Update UI
function loadVotingStatus() {
    onValue(settingsRef, snapshot => {
        const votingEnabled = snapshot.val();
        const votingStatusMessage = document.getElementById('votingStatusMessage');
        const pollForm = document.getElementById('pollForm');
        

        if (votingEnabled) {
            votingStatusMessage.textContent = "Voting is open! Please cast your vote.";
            pollForm.style.display = "block";
        } else {
            votingStatusMessage.textContent = "Voting is currently closed.";
            pollForm.style.display = "none";
        }
    });
}

// Handle Vote Submission
async function handleVoteSubmission(event) {
  event.preventDefault();

  const user = auth.currentUser;
  const voteElement = document.querySelector('input[name="vote"]:checked');

  if (user && voteElement) {
    const userId = user.uid;
    const username = user.displayName || user.email;
    const voteValue = voteElement.value;

    try {
      // Check if user has already voted
      const userVoteRef = ref(database, `votes/${userId}`);
      const userVoteSnapshot = await get(userVoteRef);
      if (userVoteSnapshot.exists()) {
        alert('You have already voted. Thank you!');
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
          vote: voteValue,
          timestamp: Date.now(),
        });

        alert('Your vote has been recorded!');
        document.getElementById('pollForm').reset();
      } else {
        alert("Voting is currently closed.");
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('An error occurred while submitting your vote. Please try again later.');
    }
  } else {
    alert('Please select an option before submitting.');
  }
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

// Display Poll Results
function displayVotes() {
  const resultsList = document.getElementById('results');
  const pollResultsDiv = document.getElementById('pollResults');

  onValue(votesRef, (snapshot) => {
      resultsList.innerHTML = '';
      const votes = snapshot.val();

      if (votes) {
          pollResultsDiv.style.display = 'block'; // Show the poll results div
          const voteEntries = Object.values(votes);

          voteEntries.forEach((voteData, index) => {
              const listItem = document.createElement('li');
              listItem.textContent = `${index + 1}. ${voteData.username}: ${voteData.vote}`;
              resultsList.appendChild(listItem);
          });
      } else {
          resultsList.innerHTML = '<li>No votes have been cast yet.</li>';
          // Optionally, you can hide the poll results div if there are no votes
          // pollResultsDiv.style.display = 'none';
      }
  });
}



function displayUserName() {
    const user = auth.currentUser;
    const welcomeMessageDiv = document.getElementById('welcomeMessage');

    if (user) {
        const username = user.displayName || user.email;
        welcomeMessageDiv.textContent = `Welcome, ${username}!`;
    } else {
        welcomeMessageDiv.textContent = '';
    }
}



// Event Listeners
document.getElementById('loginForm').addEventListener('submit', handleLogin);
document.getElementById('pollForm').addEventListener('submit', handleVoteSubmission);

window.logout = logout;

// Initialize App
setupAuthListener();
displayVotes();

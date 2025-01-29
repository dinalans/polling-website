document.getElementById('pollForm').addEventListener('submit', function (event) {
    event.preventDefault();

    let username = document.getElementById('username').value;
    let vote = document.querySelector('input[name="poll"]:checked').value;

    let resultList = document.getElementById('resultList');
    let listItem = document.createElement('li');
    listItem.textContent = `${username}: ${vote}`;

    resultList.appendChild(listItem);

    // Clear the form
    document.getElementById('pollForm').reset();
});

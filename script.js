document.getElementById('pollForm').addEventListener('submit', function (event) {
    event.preventDefault();
    let selected = document.querySelector('input[name="poll"]:checked').value;
    document.getElementById('results').innerText = `You voted for: ${selected}`;
});

// This is JavaScript code that would run in the user's browser

async function registerNewUser() {
    const registrationData = {
        username: "frontend_user",
        email: "frontend@email.com",
        password: "a_strong_password"
    };

    const response = await fetch('http://127.0.0.1:5000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
    });

    const result = await response.json();
    console.log(result); // This will log the message from your Flask API
}

// Call the function to test it
registerNewUser();
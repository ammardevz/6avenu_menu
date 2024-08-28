document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');

    // Extract redirect_url from the current URL if it exists
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('red_from');

    // Function to check if the user is already logged in
    const checkIfLoggedIn = async () => {
        try {
            const response = await fetch('http://localhost:8080/check-login', {
                method: 'GET',
                credentials: 'include' // Ensure cookies are included
            });

            if (response.ok) {
                const data = await response.json();
                if (data.loggedIn) {
                    if (redirectUrl) {
                        window.location.href = `/${redirectUrl}`;
                    } else {
                        window.location.href = '/staff_nav.html';
                    }
                }
            }
        } catch (error) {
            console.error("Error checking login status:", error);
        }
    };

    // Check login status when the page loads
    await checkIfLoggedIn();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!name || !password) {
            loginMessage.textContent = "Username and password are required.";
            loginMessage.style.color = "red";
            return;
        }

        try {
            // Send the login request directly via fetch
            const response = await fetch('http://localhost:8080/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    name: name,
                    password: password
                }),
                credentials: 'include' // Ensure cookies are included
            });

            console.log('Login response status:', response.status);
            console.log('Login response headers:', Object.fromEntries(response.headers.entries()));

            if (response.ok) {
                const data = await response.json();
                console.log('Login response data:', data);
                loginMessage.textContent = `Logged in as ${data.name}`;
                loginMessage.style.color = "green";
                
                // Redirect to the original page if redirectUrl is provided
                if (redirectUrl) {
                    window.location.href = `/${redirectUrl}`;
                } else {
                    // Handle the case where no redirect URL is provided
                    window.location.href = '/staff_nav.html';
                }

            } else if (response.status === 401) {
                loginMessage.textContent = "Invalid username or password.";
                loginMessage.style.color = "red";
            } else {
                loginMessage.textContent = `Error: Unknown error`;
                loginMessage.style.color = "red";
            }

        } catch (error) {
            loginMessage.textContent = "An error occurred. Please try again.";
            loginMessage.style.color = "red";
            console.error("Login failed:", error);
        }
    });
});

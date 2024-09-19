console.log("Protected area");

document.addEventListener("DOMContentLoaded", () => {
    // Define the base URL for the API
    const BASE_URL = 'https://coffee-api-bold-moon-8315.fly.dev';

    // Function to fetch with timeout
    function fetchWithTimeout(url, options, timeout = 8000) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), timeout)
            )
        ]);
    }

    // Function to check authentication status
    async function checkAuth() {
        const url = `${BASE_URL}/login`; // Use BASE_URL for API endpoint

        try {
            const response = await fetchWithTimeout(url, {
                method: 'GET',
                credentials: 'include', // Send cookies/session
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Response status:', response.status); // Log the response status

            if (response.ok) {
                // If the response is OK (status 200), we can parse the user data
                const data = await response.json();
                console.log('User authenticated, data received:', data); // Log data received
                
                // Check if user data has the "name" field
                if (data && data.name) {
                    return data; // Return user information if authenticated
                } else {
                    throw new Error('Invalid user data received');
                }
            } else if (response.status === 401) {
                // If 401 Unauthorized, redirect to login page
                console.log('User not authenticated, redirecting...');
                const currentPage = window.location.pathname.split('/').pop().split('.')[0];
                window.location.href = `login.html?from=${currentPage}`;
                return null;
            } else {
                throw new Error(`Unexpected error: ${response.statusText}`);
            }

        } catch (error) {
            console.error('Authentication check failed:', error.message);
            return null; // Return null if unauthenticated or an error occurs
        }
    }

    // Example usage of checkAuth function
    checkAuth().then((user) => {
        if (user) {
            console.log(`Welcome, ${user.name}`);
        } else {
            console.log('No user authenticated, possible redirect...');
        }
    });
});

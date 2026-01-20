const axios = require('axios');

const BASE_URL = 'http://localhost:5200/api';

async function run() {
    try {
        // 1. Register 'm' user if not exists
        const username = 'm';
        const email = 'm@example.com';
        const password = 'Password123!';

        console.log(`Checking user: ${username}`);
        
        let token = '';
        let user = null;

        // Try login first
        try {
            const loginRes = await axios.post(`${BASE_URL}/Auth/login`, {
                username,
                password
            });
            token = loginRes.data.token;
            user = loginRes.data.user;
            console.log("Login successful. User:", user);
        } catch (e) {
            console.log("Login failed, trying to register...");
            try {
                await axios.post(`${BASE_URL}/Auth/register`, {
                    username,
                    email,
                    password
                });
                console.log("Registration successful. Please restart the backend to promote this user to Owner.");
                
                // Login again
                const loginRes = await axios.post(`${BASE_URL}/Auth/login`, {
                    username,
                    password
                });
                token = loginRes.data.token;
                user = loginRes.data.user;
                console.log("Login successful after registration. User:", user);
            } catch (regErr) {
                console.error("Registration failed:", regErr.response ? regErr.response.data : regErr.message);
                return;
            }
        }

        // 2. Check Access Level
        if (user.accessLevel < 2) {
            console.warn("User is not admin yet! AccessLevel:", user.accessLevel);
            console.log("You must restart the backend server to trigger the promotion logic in Program.cs.");
            return;
        }

        // 3. Create Channel
        console.log("Attempting to create channel...");
        try {
            const channelRes = await axios.post(`${BASE_URL}/Community/channels`, {
                name: "Admin Channel",
                description: "Created by local admin",
                type: "Chat"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Channel created successfully:", channelRes.data);
        } catch (e) {
            console.error("Create Channel failed:", e.response ? e.response.data : e.message);
        }

    } catch (e) {
        console.error("Script failed:", e.message);
    }
}

run();

// endpoint for API calls between frontend to backend

const API_BASE = process.env.API_BASE || 'http://localhost:3001';

// create function to read saved token and build Authorisation header
function authHeaders() {
    const token = localStorage.getItem('token')
    return token ? { Authorization: 'Bearer ' + token } : {};
}

export async function fetchUsers() {
    const res = await fetch(`${API_BASE}/api/users`, { headers: {...authHeaders() } }); // changed to added in authenctication
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
}

// need to add a password. to enable me to add users. 
export async function createUsers(username) {
    const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() }, //changed to support authentication
        body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
}



export async function login(username,password) {
    const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('login failed');
    return res.json();
}


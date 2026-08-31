// endpoint for API calls between frontend to backend
const API_BASE = process.env.API_BASE || 'http://localhost:3001';

// authHeaders
// create function to read saved token and build Authorisation header
function authHeaders() {
    const token = sessionStorage.getItem('token');
    return token ? { Authorization: 'Bearer ' + token } : {};
}

// fetchUsers
export async function fetchUsers() {
    const res = await fetch(`${API_BASE}/api/users`, { headers: {...authHeaders() } }); // changed to added in authenctication
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
}

// createUser
export async function createUser(username, password, role, employer_username) {
    const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() }, //changed to support authentication
        body: JSON.stringify({ username, password, role, employer_username }),
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
}

// fetchEmployers
export async function fetchEmployers() {
    const res = await fetch(`${API_BASE}/api/users/employers`, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error('failed to fetch employers');
    return res.json();
}


// login
export async function login(username,password) {
    const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('login failed');
    return res.json();
}


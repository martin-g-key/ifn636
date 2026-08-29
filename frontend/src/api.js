// talk to back end API


const API_BASE = process.env.API_BASE || 'http://localhost:3001';

export async function fetchUsers() {
    const res = await fetch(`${API_BASE}/api/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
}

export async function createUsers(username) {
    const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
}

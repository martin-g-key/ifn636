// home page -- skeleton

import React, { useState, useEffect } from 'react';

// Import componenets and API calls
import UserList from '../components/userList';
import AddUser from '../components/addUser';
import { fetchUsers, createUser } from '../api';


export default function HomePage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers()
            .then((data) => setUsers(data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleAdd = async (username, password, role, employer_username) => {
        try {
            const created = await createUser(username, password, role, employer_username);
            // show new user record
            setUsers((prev) => [created, ...prev]); 
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h1>skeleton app</h1>
            {error && <p style={{color: 'red' }}>Error: {error}</p>}
            <AddUser onAdd={handleAdd} />
            <UserList users={users} />
        </div>
    );

} 
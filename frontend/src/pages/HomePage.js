// home page -- skeleton

import React, { useState, useEffect } from 'react';

// Import componenets and API calls
import UserList from '../components/userList';
import AddUser from '../components/addUser';
import { fetchUsers, createUser } from '../api';


export default function HomePage() {
    const role = sessionStorage.getItem('role');
    const isEmployer = role === 'Employer';
   
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(isEmployer);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isEmployer) return;
        fetchUsers()
            .then((data) => setUsers(data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [isEmployer]);

    const handleAdd = async (username, password, role, employer_username) => {
        try {
            const created = await createUser(username, password, role, employer_username);
            // show new user record
            setUsers((prev) => [created, ...prev]); 
        } catch (err) {
            setError(err.message);
        }
    };

    // Employee view (no user management)
    if (!isEmployer) {
        return (
            <div>
                <h1>Tracker App</h1>
                <h2>Trips</h2>
                {/* Placholder buttons */}
                <div>
                    <button type="button">Add Trip</button>
                </div>
                <div>
                    <button type="button">View Trip List</button>
                </div>
            </div>
        );
    }

    // Employer view (user management, no trip management)
    if (loading) return <p>Loading...</p>;
    
    return (
        <div>
            <h1>TrackerMate</h1>
            <h2>User Management</h2>
            {error && <p style={{color: 'red' }}>Error: {error}</p>}
            <div>
                <AddUser onAdd={handleAdd} /> 
            </div>
            <div>
                <UserList users={users} />
            </div>
        </div>
    );

} 
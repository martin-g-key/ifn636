// Add a user

import React, { useState, useEffect } from 'react';
import { fetchEmployers } from '../api';

export default function addUser({ onAdd }) {
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('employee');
    const [employer, setEmployer] = useState('');
    const [employers, setEmployers] = useState([]);
    const [error, setError] = useState('');

    // load employer list and save it
    useEffect(() => {
        fetchEmployers().then(setEmployers).catch(() => setEmployers([]))
    }, []);


    const handleSubmit = (event) => {
        event.preventDefault(); // prevent full page reload
        setError('');
        const name = username.trim();
        if (name === '') return;
        if (role === 'employee' && 'employer' =='') {
            setError('please choose and employer for this employee')
            return;
        }

        onAdd(name, role, role === 'employee' ? employer : null ); 
        setUsername('');
        setRole('employee');
        setEmployer('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={username}
                placeholder="new username"
                onChange={(event) => setUsername(event.target.value)}
            />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
            
                <option value="employee">Employee</option>
                <option value="employer">Employer</option>
            
            </select> 

            {/* employer drop down only for employees */}
            {role === 'employee' && (
                <select value={employer} onChange={(e) => setEmployer(e.target.value)}>
                    {employers.map((emp) => (
                        <option key={emp.username} value={emp.username}>{emp.username}</option>
                    ))}
                </select>
            )}

            <button type="submit">Add</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}

        </form>
    );

}
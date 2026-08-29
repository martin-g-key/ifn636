// Add a user

import React, { useState } from 'react';

export default function addUser({ onAdd }) {
    const [username, setUsername] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault(); // prevent full page reload

        const trimmed = username.trim();
        if (trimmed === '') return;
        onAdd(trimmed); 
        setUsername('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={username}
                placeholder="new username"
                onChange={(event) => setUsername(event.target.value)}
            />
            <button type="submit">Add</button>

        </form>
    );

}
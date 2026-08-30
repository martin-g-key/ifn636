// User List -- all records for each user

import React, { useState } from 'react';

export default function userList({ users }) {
    return (
        <div>
            <h2>Users</h2>
            {users.length === 0 ? (
                <p>No users yet. Please add one.</p>
            ) : (
                <ul>
                    {users.map((user) => (
                        <li key={user.id}>{user.username}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
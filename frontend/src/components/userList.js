// User List -- all records for each user

import React, { useState } from 'react';

export default function UserList({ users, onUpdate, onDelete }) {
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ username: '', role: 'Employee', employer_username: '' });
    
    const startEdit = (user) => {
        setEditingId(user.id);
        setForm({ username: user.username, role: user.role, employer_username: user.employer_username || '' });
    }

    const saveEdit = async (id) => {
        await onUpdate(id, {
            username: form.username,
            role: form.role,
            employer_username: form.role === 'Employee' ? form.employer_username: null
        });
        setEditingId(null);
    };
    
    

    return (
        <div>
            <h2>Users</h2>
            {users.length === 0 ? (
                <p>No users yet. Please add one.</p>
            ) : (
                <ul>
                    {users.map((user) => (
                        <li key={user.id}>
                            {editingId === user.id ? (
                                <span>
                                    <input value={form.username} 
                                        onChange={(e) => setForm({ ...form, username: e.target.value })} />
                                    
                                    <select value={form.role} 
                                        onChange={(e) => setForm({ ...form, role: e.target.value })} >
                                        <option value="Employee">Employee</option>
                                        <option value="Employer">Employer</option>
                                    </select>

                                    {form.role === 'Employee' && (
                                        <input placeholder="employer username" value={form.employer_username}
                                            onChange={(e) => setForm({ ...form, employer_username: e.target.value})} /> 
                                    )}

                                    <button type="button" onClick={() => saveEdit(user.id)}>Save</button>
                                    <button type="button" onClick={() => setEditingId(null)}>Cancel</button>

                                </span>

                            ) : (
                                <span>
                                    {user.username} | {user.role}
                                    
                                    {user.role === 'Employee' && user.employer_username
                                        ? ` | employer: ${user.employer_username}`: ''}
                                    
                                    {onUpdate && (
                                        <button type="button" style={{ marginLeft: '0.5rem' }}
                                            onClick={() => startEdit(user)}>Edit</button>
                                    )}
                                    {onDelete && (
                                        <button type="button" style={{ marginLeft: '0.5rem' }}
                                            onClick={() => onDelete(user.id)}>Delete</button>
                                    )}
                                </span>
                            )} 
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
} 
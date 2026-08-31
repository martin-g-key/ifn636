// login page

import React, { useState } from 'react';
import { login } from '../api';

export default function LoginPage({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            const { token, user } = await login(username, password);
            sessionStorage.setItem('token', token); // check this
            sessionStorage.setItem('role', user.role); // check this
            onLogin(user);
        } catch(err) {
            setError('invalid password or username')
        }
    };

    //html

    return(
        <div>
            <h1>Log in</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <input type="text" value={username} placeholder="Username" 
                        onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div>
                    <input type="text" value={password} placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)} />
                </div>

                <button type="submit">Log in</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );

}


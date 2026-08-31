// React Router

import React, { useState } from 'react';
import { BrowserRouter,Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage'
import TripsPage from './pages/TripsPage'
import LoginPage from './pages/LoginPage'

export default function App() {
    // logged in or logged out based on whether a token is there
    const [token, setToken] = useState(sessionStorage.getItem('token'));
    const role = sessionStorage.getItem('role');
    const handleLogin = () => setToken(sessionStorage.getItem('token'));
    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
        setToken(null)
    }

    // bring up the login page if there's no token. 
    if (!token) {
        return <LoginPage onLogin={handleLogin} />; 
    } 
    return (
        <BrowserRouter>
            <nav style = {{ marginBottom: '1rem' }}> 
                <Link to="/">Home</Link> | <Link to="/trips">Trips</Link>{' '}
                {role === 'employer' && <span>| (employer) </span>}
                | <button onClick={handleLogout}>Log out</button>
            </nav>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/trips" element={<TripsPage />} /> 
            </Routes>
        </BrowserRouter>
    );
}
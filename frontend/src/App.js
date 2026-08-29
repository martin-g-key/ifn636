// React Router

import React from 'react';
import { BrowserRouter,Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage'
import TripsPage from './pages/TripsPage'

export default function App() {
    return (
        <BrowserRouter>
            <nav style = {{ marginBottom: '1rem' }}> 
                <Link to="/">Home</Link> | <Link to="/trips">Trips</Link>
            </nav>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/trips" element={<TripsPage />} /> 
            </Routes>
        </BrowserRouter>
    );
}
// home page -- skeleton

import React, { useState, useEffect } from 'react';

// TODO:
// Import componenets and API calls
// import TripList from '../components/TripList';
// import AddTrip from '../components/AddTrip'
// import { fetchTrips, createTrips } from '../api';


export default function TripsPage() {
    // const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

/*
    useEffect(() => {
        fetchUsers()
            .then((data) => setUsers(data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);


    const handleAdd = async (username) => {
        try {
            const created = await createUser(username);
            // show new user record
            setUsers((prev) => [created, ...prev]); 
        } catch (err) {
            setError(err.message);
        }
    };

*/ 

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h1>skeleton app</h1>
            {error && <p style={{color: 'red' }}>Error: {error}</p>}
        </div>
    );

} 
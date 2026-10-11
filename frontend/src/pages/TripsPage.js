import React, { useState, useEffect } from 'react';
import TripList from '../components/tripList';
import { fetchTrips } from '../api';

export default function TripsPage() {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 

    // runs once when the page loads
    useEffect(() => {
        fetchTrips()
            .then((data) => setTrips(data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h2>Trips</h2>
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            <TripList trips={trips} />
        </div>
    );
}
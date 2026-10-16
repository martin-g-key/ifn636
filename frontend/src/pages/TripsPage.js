import React, { useState, useEffect } from 'react';
import TripList from '../components/tripList';
import { fetchTrips, fetchFinYears } from '../api';

export default function TripsPage() {
    const [trips, setTrips] = useState([]);
    const [finYears, setFinYears] = useState([]);
    const [finYear, setFinYear] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load financial years and select the current year
    useEffect(() => {
        fetchFinYears()
            .then(({ fin_years, current }) => {
                setFinYears(fin_years);
                setFinYear(current);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // Reload trips when the selected financial year changes
    useEffect(() => {
        if (finYear === null) return undefined;

        let ignore = false;
        setLoading(true);
        setError(null);

        fetchTrips(finYear)
            .then((data) => {
                if (!ignore) setTrips(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                if (!ignore) setError(err.message);
            })
            .finally(() => {
                if (!ignore) setLoading(false);
            });

        return () => { ignore = true; };
    }, [finYear]);

    return (
        <div>
            <h2>Trips</h2>

            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            {finYear !== null && (
                <div>
                    <label htmlFor="fin-year">Financial Year: </label>
                    <select
                        id="fin-year"
                        value={finYear}
                        onChange={(e) => setFinYear(e.target.value)}
                    >
                        {finYears.map((fy) => (
                            <option key={fy} value={fy}>{fy}</option>
                        ))}
                    </select>
                </div>
            )}

            {loading ? <p>Loading...</p> : <TripList trips={trips} />}
        </div>
    );
}
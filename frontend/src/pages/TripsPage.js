import React, { useState, useEffect } from 'react';
import TripList from '../components/tripList';
import { fetchTrips, fetchFinYears, updateTrip, deleteTrip } from '../api';
import AddTrip from '../components/addTrip';

export default function TripsPage() {
    const [trips, setTrips] = useState([]);
    const [finYears, setFinYears] = useState([]);
    const [finYear, setFinYear] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);


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

    const canEdit = sessionStorage.getItem('role') === 'Employee';

    async function handleDelete(id) {
        if (!window.confirm('Delete this trip?')) return;
        try {
            await deleteTrip(id);
            setTrips((prev) => prev.filter((t) => t.id !== id));
        } catch (err) { setError(err.message); }
    }

    async function handleSave(id, fields) {
        try {
            setError(null);
            const updated = await updateTrip(id, fields);
            setTrips((prev) => prev
                .map((t) => (t.id === id ? updated : t))
                .filter((t) => t.fin_year === finYear));
                return true
        } catch (err) {
            setError(err.message);
            return false;
        }
    }

    function handleTripCreated(trip) {
        setFinYears((current) => (current.includes(trip.fin_year) ? current :
        [...current, trip.fin_year].sort().reverse()));

        if (trip.fin_year === finYear) {
            setTrips((prev) => [trip, ...prev]
            .sort((a,b) => new Date(b.trip_date) - new Date(a.trip_date)));
        } else {
            setFinYear(trip.fin_year);
        }
        setShowAddForm(false);
    }

    return (
        <div>
            <h2>Trips</h2>

            {canEdit && !showAddForm && (
                <button type="button" onClick={() => setShowAddForm(true)}>Add Trip</button>
            )}

            {canEdit && showAddForm && (
                <AddTrip 
                    onCreated={handleTripCreated}
                    onCancel={() => setShowAddForm(false)}
                    />
            )}

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

            {loading ? <p>Loading...</p> : <TripList trips={trips} canEdit={canEdit} onSave={handleSave} onDelete={handleDelete}/>}
        </div>
    );
}
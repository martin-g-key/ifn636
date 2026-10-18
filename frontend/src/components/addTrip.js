import React, { useState } from 'react';
import { createTrip } from '../api';

function today() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Australia/Brisbane',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

export default function AddTrip({ onCreated, onCancel }) {
    const [tripDate, setTripDate] = useState(today());
    const [startOdometer, setStartOdometer] = useState('');
    const [endOdometer, setEndOdometer] = useState('');
    const [purpose, setPurpose] = useState('Business');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSaving(true);

        try {
            // inputs hold strings, the API expects whole numbers
            const created = await createTrip({
                trip_date: tripDate,
                start_odometer: Number(startOdometer),
                end_odometer: Number(endOdometer),
                purpose,
            });
            onCreated(created);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };


    return (
        <form onSubmit={handleSubmit}>
            <label htmlFor="trip_date">Trip date</label>
            <input
                id="trip_date"
                type="date"
                value={tripDate}
                max={today()}
                required
                onChange={(event) => setTripDate(event.target.value)}
            />

            <label htmlFor="start_odometer">Start odometer (km)</label>
            <input
                id="start_odometer"
                type="number"
                min="0"
                step="1"
                value={startOdometer}
                required
                onChange={(event) => setStartOdometer(event.target.value)}
            />

            <label htmlFor="end_odometer">End odometer (km)</label>
            <input
                id="end_odometer"
                type="number"
                min="0"
                step="1"
                value={endOdometer}
                required
                onChange={(event) => setEndOdometer(event.target.value)}
            />

            <label htmlFor="trip_purpose">Purpose</label>
            <select
                id="trip_purpose"
                value={purpose}
                required
                onChange={(event) => setPurpose(event.target.value)}
            >
                <option value="Business">Business</option>
                <option value="Private">Private</option>
            </select>

            <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Trip'}
            </button>
            <button type="button" onClick={onCancel} disabled={saving}>Cancel</button>
            {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
        </form>
    );
}

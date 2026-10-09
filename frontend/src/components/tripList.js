import React from 'react';

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-AU', { timeZone: 'UTC' });
}

// fin_year 2027 -> "2026–27"
function formatFinYear(fy) {
    return fy ? `${fy - 1}–${String(fy).slice(-2)}` : '';
}

export default function TripList({ trips }) {
    if (trips.length === 0) return <p>No trips yet.</p>;

    return (
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Driver</th>
                    <th>Start odometer</th>
                    <th>End odometer</th>
                    <th>Distance (km)</th>
                    <th>Purpose</th>
                    <th>Financial year</th>
                </tr>
            </thead>
            <tbody>
                {trips.map((trip) => (
                    <tr key={trip.id}>
                        <td>{formatDate(trip.trip_date)}</td>
                        <td>{trip.user?.username}</td>
                        <td>{trip.start_odometer}</td>
                        <td>{trip.end_odometer}</td>
                        <td>{trip.distance_km}</td>
                        <td>{trip.purpose}</td>
                        <td>{formatFinYear(trip.fin_year)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
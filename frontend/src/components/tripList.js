import React, {useState} from 'react';

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-AU', { timeZone: 'UTC' });
}

function toForm(trip) {
    return {
        trip_date: trip.trip_date.slice(0,10),
        start_odometer: String(trip.start_odometer),
        end_odometer: String(trip.end_odometer),
        purpose: trip.purpose,
    };
}

export default function TripList({ trips, canEdit=false, onSave, onDelete }) {
    
    // hook to manage ids for trips that are being edited
    const [editingId, setEditingId] = useState(null);
    // hook to manage user inputs into form
    const [form, setForm] = useState(null);

    if (trips.length === 0) return <p>No trips yet.</p>;

    function startEdit(trip) {
        setEditingId(trip.id);
        setForm(toForm(trip));
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(null)
    }

    function change(e) {
        setForm({...form, [e.target.name]: e.target.value });
    }

    async function save(id) {
        const ok = await onSave(id, {
            ...form,
            start_odometer: Number(form.start_odometer),
            end_odometer: Number(form.end_odometer),
        });
        if (ok) cancelEdit();
    }

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
                    {canEdit && <th>Actions</th>}
                </tr>
            </thead>
            <tbody>
                {trips.map((trip) => (trip.id === editingId ? (
                    // for an editing row
                    <tr key={trip.id}>
                        <td><input type="date" name="trip_date" value={form.trip_date} onChange={change} /></td>
                        <td>{trip.user_id?.username}</td>
                        <td><input type="number" name="start_odometer" min="0" value={form.start_odometer} onChange={change} /></td>
                        <td><input type="number" name="end_odometer" min="0" value={form.end_odometer} onChange={change} /></td>
                        <td>{trip.distance_km}</td>
                        <td>
                            <select name="purpose" value={form.purpose} onChange={change}>
                                <option value="Business">Business</option>
                                <option value="Private">Private</option>

                            </select>
                        </td>
                        <td>{trip.fin_year}</td>
                        <td>
                            <button type="button" onClick={() => save(trip.id)}>Save</button>
                            <button type="button" onClick={cancelEdit}>Cancel</button>
                        </td>                        
                    </tr>
                ) : (
                    // for a normal row
                    <tr key={trip.id}>
                        <td>{formatDate(trip.trip_date)}</td>
                        <td>{trip.user_id?.username}</td>
                        <td>{trip.start_odometer}</td>
                        <td>{trip.end_odometer}</td>
                        <td>{trip.distance_km}</td>
                        <td>{trip.purpose}</td>
                        <td>{trip.fin_year}</td>
                        {canEdit && (
                            <td>
                                <button type="button" onClick={() => startEdit(trip)}>Edit</button>
                                <button type="button" onClick={() => onDelete(trip.id)}>Delete</button>
                            </td>
                        )}
                    </tr>
                )))}
            </tbody>
        </table>
    );
}
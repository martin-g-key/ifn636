class TripsCsvExporter {
    static #COLUMNS = [
        'trip_date',
        'start_odometer',
        'end_odometer',
        'distance_km',
        'purpose',
        'fin_year'
    ];

    static #escape(value) {
        const text = String(value ?? '');

        if (/[",\r\n]/.test(text)) {
            return '"' + text.replace(/"/g, '""') + '"';
        }

        return text;
    }

    static #format(value) {
        if (value instanceof Date) {
            return value.toISOString().slice(0, 10);
        }
        return value;
    }

    static export(rows) {
        const columns = TripsCsvExporter.#COLUMNS;
        const lines = [columns.join(',')];

        for (const row of rows) {
            const values = columns.map(column =>
                TripsCsvExporter.#escape(
                    TripsCsvExporter.#format(row[column])
                )
            );

            lines.push(values.join(','));
        }

        return '\uFEFF' + lines.join('\r\n');
    }
}

module.exports = TripsCsvExporter;
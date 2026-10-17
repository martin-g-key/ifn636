class TripsCsvExporter {
    static #COLUMNS = [
        'trip_id',
        'user_id',
        'trip_date',
        'start_odometer',
        'end_odometer',
        'distance_km',
        'purpose',
        'fin_year',
        'created_at',
        'updated_at'
    ];

    static getFileName() {
        const now = new Date();

        const date = [
            String(now.getDate()).padStart(2, '0'),
            String(now.getMonth() + 1).padStart(2, '0'),
            now.getFullYear()
        ].join('');

        const time = [
            String(now.getHours()).padStart(2, '0'),
            String(now.getMinutes()).padStart(2, '0')
        ].join('-');

        return `trips_${date}_${time}.csv`;
    }

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
            const values = columns.map(column => {
                let value = row[column];

                if (column === 'trip_id') value = row._id;
                if (column === 'created_at') value = row.createdAt;
                if (column === 'updated_at') value = row.updatedAt;

                return TripsCsvExporter.#escape(
                    TripsCsvExporter.#format(value)
                );
            });

            lines.push(values.join(','));
        }

        return '\uFEFF' + lines.join('\r\n');
    }
}

module.exports = TripsCsvExporter;
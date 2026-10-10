const ReportExporter = require('./ReportExporter');

class CsvExporter extends ReportExporter {
    constructor(rows) {
        super(rows);
        this.contentType = 'text/csv';
        this.fileName = 'expenses.csv';
    }

    // a comma inside a field would shift the columns, so quote those ones
    escape(value) {
        const text = String(value === null || value === undefined ? '' : value);
        if (text.includes(',') || text.includes('"')) {
            return '"' + text.replace(/"/g, '""') + '"';
        }
        return text;
    }

    export() {
        const lines = ['Date,Amount,Purpose,Status,Financial Year'];

        for (const row of this.rows) {
            lines.push([
                this.formatDate(row.expense_date),
                this.formatAmount(row.amount),
                this.escape(row.purpose),
                this.escape(row.status),
                this.escape(row.fin_year),
            ].join(','));
        }

        return lines.join('\n');
    }
}

module.exports = CsvExporter;

const ReportExporter = require('./ReportExporter');

class JsonExporter extends ReportExporter {
    constructor(rows) {
        super(rows);
        this.contentType = 'application/json';
        this.fileName = 'expenses.json';
    }

    export() {
        const data = this.rows.map((row) => ({
            date: this.formatDate(row.expense_date),
            amount: this.formatAmount(row.amount),
            purpose: row.purpose,
            status: row.status,
            fin_year: row.fin_year,
        }));

        return JSON.stringify(data, null, 2);
    }
}

module.exports = JsonExporter;

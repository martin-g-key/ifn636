// base class for report exports
// formatting is shared so each format only deals with its own output

class ReportExporter {
    constructor(rows) {
        this.rows = rows || [];
        this.contentType = 'text/plain';
        this.fileName = 'report.txt';
    }

    // dd/mm/yyyy, which is what the ATO and australian accounting software use
    formatDate(value) {
        if (!value) return '';
        const d = new Date(value);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return day + '/' + month + '/' + d.getFullYear();
    }

    formatAmount(value) {
        return Number(value || 0).toFixed(2);
    }

    export() {
        throw new Error('subclass must implement export()');
    }
}

module.exports = ReportExporter;

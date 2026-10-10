const CsvExporter = require('./CsvExporter');
const JsonExporter = require('./JsonExporter');

// the route asks for a format and gets back an exporter
// it does not need to know which class it is using
class ReportExporterFactory {
    static create(format, rows) {
        const type = (format || 'csv').toLowerCase();

        if (type === 'csv') {
            return new CsvExporter(rows);
        } else if (type === 'json') {
            return new JsonExporter(rows);
        } else {
            throw new Error('Unsupported export format: ' + format);
        }
    }
}

module.exports = ReportExporterFactory;

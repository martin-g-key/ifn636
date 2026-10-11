// routes for expense reporting - IA-29, IA-30, IA-31

const express = require('express');
const UsersModel = require('./models/Users');
const Expense = require('./models/Expense');
const ReportExporterFactory = require('./services/ReportExporterFactory');

const router = express.Router();

// work out which expenses this user is allowed to see
// employees only see their own, employers see their own employees' work expenses
async function buildScope(user) {
    if (user.role === 'Employee') {
        return { user_id: user.sub };
    }

    const employees = await UsersModel.find({ employer_username: user.username }).select('_id');
    return {
        user_id: { $in: employees.map((e) => e._id) },
        purpose: 'Business',   // private expenses are not the employer's business
    };
}

// GET /api/reports/expenses?fin_year=2026-27
router.get('/expenses', async (req, res, next) => {
    try {
        const filter = await buildScope(req.user);

        if (req.query.fin_year) {
            filter.fin_year = req.query.fin_year;
        }

        const rows = await Expense.find(filter).sort({ expense_date: 1 });
        res.json(rows);
    } catch (err) {
        next(err);
    }
});

// GET /api/reports/expenses/export?fin_year=2026-27&format=csv
router.get('/expenses/export', async (req, res, next) => {
    try {
        const filter = await buildScope(req.user);

        if (req.query.fin_year) {
            filter.fin_year = req.query.fin_year;
        }

        const rows = await Expense.find(filter).sort({ expense_date: 1 });

        let exporter;
        try {
            exporter = ReportExporterFactory.create(req.query.format, rows);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        res.type(exporter.contentType);
        res.attachment(exporter.fileName);
        res.send(exporter.export());
    } catch (err) {
        next(err);
    }
});

// GET /api/reports/financial-years - for the dropdown on the reports page
router.get('/financial-years', async (req, res, next) => {
    try {
        const filter = await buildScope(req.user);
        const years = await Expense.distinct('fin_year', filter);
        res.json(years.sort().reverse());
    } catch (err) {
        next(err);
    }
});

module.exports = router;

// router using express module
// Thin HTTP layer: every route delegates to TripsFacade.

const express = require('express');
const TripsFacade = require('./services/TripsFacade');
const TripsCsvExporter = require('./services/TripsCsvExporter');

const router = express.Router();

// known errors become 4xx responses, anything else goes to the default handler
function fail(err, res, next) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    if (err.name === 'ValidationError' || err.name === 'CastError') {
        return res.status(400).json({ error: err.message });
    }
    return next(err);
}

// GET /api/trips?fin_year=2025-26
router.get('/', async (req, res, next) => {
    try {
        res.json(await TripsFacade.listTrips(req.user, { finYear: req.query.fin_year }));
    } catch (err) { fail(err, res, next); }
});

// GET /api/trips/fin-years - for the dropdown on the trips page
// NOTE: keep fixed paths above any '/:id' routes
router.get('/fin-years', async (req, res, next) => {
    try {
        res.json(await TripsFacade.listFinYearOptions(req.user));
    } catch (err) { fail(err, res, next); }
});

// GET /api/trips/export?fin_year=2025-26
router.get('/export', async (req, res, next) => {
    try {
        const csv = await TripsFacade.createExport(
            req.user,
            { finYear: req.query.fin_year }
        );

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.attachment(TripsCsvExporter.getFileName());
        res.send(csv);
    } catch (err) {
        fail(err, res, next);
    }
});

// POST /api/trips
router.post('/', async (req, res, next) => {
    try {
        res.status(201).json(await TripsFacade.createTrip(req.user, req.body));
    } catch (err) { fail(err, res, next); }
});

// PUT /api/trips/:id
router.put('/:id', async (req, res, next) => {
    try {
        res.json(await TripsFacade.updateTrip(req.user, req.params.id, req.body));
    } catch (err) {
        fail(err, res, next); 
    }
});

// DELETE /api/trips/:id
router.delete('/:id', async (req, res, next) => {
    try {
        await TripsFacade.deleteTrip(req.user, req.params.id);
        res.status(204).end();
    } catch (err) { fail(err, res, next); }
});


module.exports = router;

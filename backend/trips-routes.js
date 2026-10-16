// router using express module
// Thin HTTP layer: every route delegates to TripsFacade.

const express = require('express');
const TripsFacade = require('./services/TripsFacade');

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

// POST /api/trips
router.post('/', async (req, res, next) => {
    try {
        res.status(201).json(await TripsFacade.createTrip(req.user, req.body));
    } catch (err) { fail(err, res, next); }
});

module.exports = router;

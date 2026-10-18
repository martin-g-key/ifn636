// backend/services/TripsFacade.js
//
// FACADE: one simple interface in front of several subsystems
//   - TripVisibility        (role rules + financial-year filter)
//   - FinancialYear         (what a financial year is)
//   - Trips / Users models
//
// Routes call only the public methods. Everything marked # is private.

const TripsModel = require('../models/Trips');
const UsersModel = require('../models/Users');
const TripVisibility = require('./TripVisibility');
const FinancialYear = require('./FinancialYear');
const TripsCsvExporter = require('./TripsCsvExporter');

// add tripChain for validation checks
const { tripChain } = require('./TripsChecks');

class TripsFacade {
    // private

    static #EDITABLE_FIELDS = Object.freeze(['trip_date', 'start_odometer', 'end_odometer', 'purpose']);

    static #httpError(status, message) {
        const err = new Error(message);
        err.status = status;
        return err;
    }

    static #pickEditable(body = {}) {
        const out = {};
        for (const field of TripsFacade.#EDITABLE_FIELDS) {
            if (body[field] !== undefined) out[field] = body[field];
        }
        return out;
    }

    // the one place a visibility filter is built for a request
    static async #filterFor(user, finYear) {
        if (finYear && !FinancialYear.isValid(finYear)) {
            throw TripsFacade.#httpError(400, 'fin_year must look like 2025-26');
        }
        return TripVisibility.buildFilter(user, { finYear });
    }

    //  public

    // trips the user can see, optionally for one financial year
    static async listTrips(user, { finYear } = {}) {
        const filter = await TripsFacade.#filterFor(user, finYear);
        return TripsModel.find(filter)
            .populate('user_id', 'username')
            .sort({ trip_date: -1 });
    }

    // dropdown data: financial years with at least one visible trip, plus the current FY
    // so the default selection always exists. Newest first.
    static async listFinYearOptions(user) {
        const filter = await TripVisibility.buildFilter(user); // role rules only
        const years = await TripsModel.distinct('fin_year', filter);
        const current = FinancialYear.current();
        const fin_years = [...new Set([...years.filter(Boolean), current])].sort().reverse();
        return { fin_years, current };
    }

    static async createTrip(user, body) {
        // no foreign keys in NoSQL, so confirm the owner still exists
        const owner = await UsersModel.exists({ _id: user.sub });
        if (!owner) throw TripsFacade.#httpError(401, 'user no longer exists');

        const created = await TripsModel.create({
            ...TripsFacade.#pickEditable(body),
            user_id: user.sub, // from the token, never from the request body
        });
        await created.populate('user_id', 'username');
        return created;
    }

    // edit a trip --> use TripsChain, Trip Facade
    static async updateTrip(user, tripId, body ) {
        const {trip} = await tripChain.handle({user, tripId });
        trip.set(TripsFacade.#pickEditable(body));
        await trip.save();
        return trip.populate('user_id', 'username');
    }

    // delete a trip --> use TripsChain, Trip Facade
    static async deleteTrip(user, tripId) {
        const {trip} = await tripChain.handle({ user, tripId});
        await trip.deleteOne();
    }


    // Export visible trips as CSV
    static async createExport(user, { finYear } = {}) {
        const filter = await TripsFacade.#filterFor(user, finYear);

        const rows = await TripsModel.find(filter)
        .sort({ trip_date: -1 })
        .lean();

        return TripsCsvExporter.export(rows);
    }
}

module.exports = TripsFacade;

// TripsChecks

const TripsModel = require('../models/Trips');

// OOP Principle: Abstraction
class TripCheck {
    constructor() {
        if (new.target === TripCheck) throw new Error('TripCheck is abstract');
    }

    // Pattern: Chain of Responsibilities
    // a sequence of checks to determine flow

    // returns the next check
    setNext(next) {
        this.next = next;
        return next;
    }

    // do the check and then pass it the request on
    async handle(ctx) {
        await this.check(ctx);
        if (this.next) await this.next.handle(ctx);
    }

    // each subclass to provicde its own check
    async check(ctx){
        throw new Error('check() not implemented');
    }
}


// subclasses for each check
// check if the trip exists
class TripExists extends TripCheck {
    async check(ctx) {
        ctx.trip = await TripsModel.findById(ctx.tripId);
        if (!ctx.trip) throw Object.assign(new Error('trip not found'), {status: 404});
    }
}

// check owner of trip
class OwnsTrip extends TripCheck {
    async check(ctx) {
        if (ctx.trip.user_id.toString() !== ctx.user.sub) {
            throw Object.assign(new Error('Only the user changer their own trip'), {status: 403});
        }
    }
}

const tripChain = new TripExists();
tripChain.setNext(new OwnsTrip());

module.exports = { tripChain, TripCheck, TripExists, OwnsTrip };


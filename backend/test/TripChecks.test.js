// testing for Trips Checks as part of Trips Management epic

const { expect } = require('chai');
const sinon = require('sinon');
const express = require('express');
const request = require('supertest');
const Trips = require('../models/Trips');
const Facade = require('../services/TripsFacade');
const { tripChain, TripCheck, TripExists } = require('../services/TripsChecks');
const router = require('../trips-routes');

const employee = { sub: 'employee', role: 'Employee' };


async function expectStatus(action, status) {
    let error;
    try { await action(); } catch (err) { error = err; }
    expect(error).to.be.instanceOf(Error);
    expect(error.status).to.equal(status);
}

// a fake trip document owned by `owner`
function fakeTrip(owner = 'employee') {
    const trip = { user_id: owner, set: sinon.spy(), save: sinon.stub().resolves(), deleteOne: sinon.stub().resolves() };
    trip.populate = sinon.stub().resolves(trip);
    return trip;
}

function appFor(user) {
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => { req.user = user; next(); });
    app.use('/api/trips', router);
    return app;
}


// Chain of responsibilty -- test for sequence of checks
describe('Trip checks (chain of responsibility)', () => {
    afterEach(() => sinon.restore());

    it('the abstract base class cannot be created directly', () => {
        expect(() => new TripCheck()).to.throw('abstract');
    });

    it('returns 404 and stops the chain when the trip does not exist', async () => {
        sinon.stub(Trips, 'findById').resolves(null);
        await expectStatus(() => tripChain.handle({ user: employee, tripId: 'x' }), 404);
    });

    it('returns 403 when the trip belongs to someone else', async () => {
        sinon.stub(Trips, 'findById').resolves(fakeTrip('someone-else'));
        await expectStatus(() => tripChain.handle({ user: employee, tripId: 'x' }), 403);
    });

    it('a new check can be added without changing the others', async () => {
        class AlwaysBlocks extends TripCheck {
            async check() { throw Object.assign(new Error('blocked'), { status: 423 }); }
        }
        sinon.stub(Trips, 'findById').resolves(fakeTrip());
        const chain = new TripExists();
        chain.setNext(new AlwaysBlocks());
        await expectStatus(() => chain.handle({ user: employee, tripId: 'x' }), 423);
    });
});


// trip facade --> tests edit and delete behaviour
describe('Trip Facade edit and delete', () => {
    afterEach(() => sinon.restore());

    it('updates only editable fields and saves', async () => {
        const trip = fakeTrip();
        sinon.stub(Trips, 'findById').resolves(trip);
        await Facade.updateTrip(employee, 'x', { end_odometer: 200, user_id: 'outsider' });
        expect(trip.set.firstCall.args[0]).to.deep.equal({ end_odometer: 200 });
        expect(trip.save.calledOnce).to.equal(true);
    });

    it('does not delete a trip the user does not own', async () => {
        const trip = fakeTrip('someone-else');
        sinon.stub(Trips, 'findById').resolves(trip);
        await expectStatus(() => Facade.deleteTrip(employee, 'x'), 403);
        expect(trip.deleteOne.called).to.equal(false);
    });
});


describe('Trip API edit and delete routes', () => {
    afterEach(() => sinon.restore());

    it('DELETE returns 204', async () => {
        sinon.stub(Trips, 'findById').resolves(fakeTrip());
        const res = await request(appFor(employee)).delete('/api/trips/abc');
        expect(res.status).to.equal(204);
    });

    it('a malformed id returns 400', async () => {
        const res = await request(appFor(employee)).delete('/api/trips/not-an-id');
        expect(res.status).to.equal(400);
    });
});



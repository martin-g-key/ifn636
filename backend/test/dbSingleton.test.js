const { expect } = require('chai');
const mongoose = require('mongoose');
const sinon = require('sinon');

const DatabaseConnection = require('../config/dbSingleton');

describe('DatabaseConnection Singleton', () => {
    afterEach(() => {
        sinon.restore();
    });

    it('returns the same instance every time', () => {
        const first = DatabaseConnection.getInstance();
        const second = DatabaseConnection.getInstance();

        expect(first).to.equal(second);
        expect(new DatabaseConnection()).to.equal(first);
    });

    it('shares a single in-progress MongoDB connection attempt', async () => {
        const connectionManager = DatabaseConnection.getInstance();
        let resolveConnection;
        const connectStub = sinon.stub(mongoose, 'connect').returns(
            new Promise((resolve) => {
                resolveConnection = resolve;
            })
        );

        const firstConnection = connectionManager.connect('mongodb://localhost/test');
        const secondConnection = connectionManager.connect('mongodb://localhost/test');

        expect(firstConnection).to.equal(secondConnection);
        expect(connectStub.calledOnce).to.equal(true);

        resolveConnection(mongoose.connection);
        const [firstResult, secondResult] = await Promise.all([
            firstConnection,
            secondConnection,
        ]);

        expect(firstResult).to.equal(mongoose.connection);
        expect(secondResult).to.equal(mongoose.connection);
        expect(connectStub.calledOnce).to.equal(true);
    });
});

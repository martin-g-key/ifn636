// Testing using Mocha, Chai, Supertest

// Create a separate testing database
process.env.DB_PATH = ':memory:';

const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');

const app = require('../server');
const { initDB } = require('../db');

describe('Users API', () => {
    before(async () => {
        await initDB(); // create db in test database
    });

    it('GET /api/health returns ok', async() => {
        const res = await request(app).get('/api/health');
        expect(res.status).to.equal(200);
        expect(res.body).to.deep.equal({ status: 'ok'});
    });

    it('GET /api/users starts empty', async () => {
        const res = await request(app).get('/api/users');
        expect(res.status).to.equal(200);
        expect(res.body).to.be.an('array').that.is.empty;
    });

    // each username has an id
    it('POST /api/users creates a user', async () => {
        const res = await request(app).post('/api/users').send({ username: 'Martin.Keylock' });
        expect(res.status).to.equal(201);
        expect(res.body).to.include({ username: 'Martin.Keylock' });
        expect(res.body).to.have.property('id');
    });

    it('POST /api/users rejects a missing username with 400', async () => {
        const res = await request(app).post('/api/users').send({});
        expect(res.status).to.equal(400);
    });

    it('Sinon: a spy records how many times it was called', () => {
        const callback = sinon.spy();
        [1, 2, 3].forEach(callback);
        expect(callback.callCount).to.equal(3);
    });
});

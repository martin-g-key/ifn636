// Testing using Mocha, Chai, Supertest

// create test inputs that would otherwise live in .env
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test_JWT_SECRET';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'admin_123';


const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');

const app = require('../server');
const { initDB } = require('../db');

describe('Users API', () => {
    let token;

    before(async () => {
        await initDB(); // create db in test database
    });


    // test 1 -- api health check
    it('GET /api/health returns ok', async() => {
        const res = await request(app).get('/api/health');
        expect(res.status).to.equal(200);
        expect(res.body).to.deep.equal({ status: 'ok'});
    });

    // test 2 -- token
    it('GET /api/users without a token is rejected with 401. ', async () => {
        const res = await request(app).get('/api/users');
        expect(res.status).to.equal(401);
    });

    // test 3 -- login
    it('POST /api/login with seeded admin / employer returns a token', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({username: 'admin', password: 'admin_123'});
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('token');
        token = res.body.token
    });

    // test 4 -- create a user
    it('POST /api/users (authed) creates an Employee', async () => {
        const res = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'Vida', password: 'pw123', role: 'Employee', employer_username: 'admin' });
        expect(res.status).to.equal(201);
        expect(res.body).to.include({ username: 'Vida', role: 'Employee' });
        expect(res.body).to.have.property('id');
        expect(res.body).to.not.have.property('password_hash');
    });

    // test 5 -- reject an auth attempt without a pasword
    it('POST /api/users (authed), rejects a missing password with a 400 message', async () => {
        const res = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'Jean', role: 'Employer' });
        expect(res.status).to.equal(400);
    });


    it('Sinon: a spy records how many times it was called', () => {
        const callback = sinon.spy();
        [1, 2, 3].forEach(callback);
        expect(callback.callCount).to.equal(3);
    });
});

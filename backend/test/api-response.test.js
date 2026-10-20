const { expect } = require('chai');
const request = require('supertest');
const app = require('../server');

describe('standard API error responses', () => {
    it('returns a JSON error envelope for unknown API endpoints', async () => {
        const response = await request(app)
            .get('/api/not-a-real-endpoint')
            .expect(404)
            .expect('Content-Type', /application\/json/);

        expect(response.body).to.deep.equal({ error: 'API endpoint not found' });
    });

    it('returns a JSON error envelope when authentication is missing', async () => {
        const response = await request(app)
            .get('/api/auth/validate')
            .expect(401)
            .expect('Content-Type', /application\/json/);

        expect(response.body).to.deep.equal({ error: 'Missing token' });
    });

    it('returns a JSON error envelope for malformed JSON', async () => {
        const response = await request(app)
            .post('/api/login')
            .set('Content-Type', 'application/json')
            .send('{"username":')
            .expect(400)
            .expect('Content-Type', /application\/json/);

        expect(response.body).to.deep.equal({ error: 'Invalid JSON body' });
    });
});

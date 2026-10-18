process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { expect } = require('chai');
const app = require('../server');

describe('GET /api/auth/validate', () => {
    it('rejects requests without a valid JWT', async () => {
        await request(app)
            .get('/api/auth/validate')
            .expect(401);

        await request(app)
            .get('/api/auth/validate')
            .set('Authorization', 'Bearer invalid-token')
            .expect(401);
    });

    it('returns the user represented by a valid JWT', async () => {
        const token = jwt.sign(
            { sub: 'user-1', username: 'employee', role: 'Employee' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const response = await request(app)
            .get('/api/auth/validate')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body.user).to.include({
            sub: 'user-1',
            username: 'employee',
            role: 'Employee',
        });
    });
});

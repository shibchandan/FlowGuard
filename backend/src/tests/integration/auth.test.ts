// src/tests/integration/auth.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Auth & System API Integration', () => {
  it('GET /api/v1/health returns status UP', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
  });

  it('POST /api/v1/auth/login rejects missing credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me rejects request without Bearer token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/auth/me rejects request with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token-string');
    expect(res.status).toBe(401);
  });
});

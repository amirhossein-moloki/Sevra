import request from 'supertest';
import app from '../app';

describe('Swagger Documentation', () => {
  it('should serve the Swagger UI at /api-docs/', async () => {
    const response = await request(app).get('/api-docs/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('<!-- HTML for static distribution bundle build -->');
  });

  it('should redirect /api-docs to /api-docs/', async () => {
    const response = await request(app).get('/api-docs');
    expect(response.status).toBe(301);
  });
});

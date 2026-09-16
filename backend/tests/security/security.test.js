const request = require('supertest');
const app = require('../../src/app');

describe('Security & Input Validation Tests', () => {
  describe('NoSQL Injection Protection & Sanitization', () => {
    it('should sanitize NoSQL operators like $gt from req.body', async () => {
      // Attacker attempts to bypass login using NoSQL injection
      const res = await request(app)
        .post('/api/auth/login')
        .set('x-test-client-id', 'nosql-tester-' + Date.now())
        .send({
          email: { $gt: '' },
          password: 'password123'
        });

      // Since $gt is stripped in-place by sanitizeInput, email becomes empty or non-string,
      // which fails validation and is rejected with 400
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });

    it('should sanitize keys starting with $ or containing . recursively', async () => {
      const { sanitizeInPlace } = require('../../src/middlewares/sanitize.middleware');
      const maliciousPayload = {
        title: 'Safe Title',
        $where: 'sleep(5000)',
        'nested.field': 'malicious',
        filters: {
          $gt: 10,
          normalKey: 'ok'
        },
        items: [{ $ne: null, name: 'Valid Item' }]
      };

      sanitizeInPlace(maliciousPayload);

      expect(maliciousPayload.$where).toBeUndefined();
      expect(maliciousPayload['nested.field']).toBeUndefined();
      expect(maliciousPayload.filters.$gt).toBeUndefined();
      expect(maliciousPayload.filters.normalKey).toBe('ok');
      expect(maliciousPayload.items[0].$ne).toBeUndefined();
      expect(maliciousPayload.items[0].name).toBe('Valid Item');
    });
  });

  describe('XSS Sanitization & Whitespace Trimming', () => {
    it('should strip script tags and javascript pseudo protocols from string inputs', () => {
      const { sanitizeXSS, sanitizeInPlace } = require('../../src/middlewares/sanitize.middleware');
      
      const dirty = '<script>alert("xss")</script>Hello <iframe src="evil.com"></iframe>World <img src=x onerror="alert(1)">';
      const clean = sanitizeXSS(dirty);

      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('</script>');
      expect(clean).not.toContain('<iframe');
      expect(clean).not.toContain('onerror=');
      expect(clean).toContain('Hello');
      expect(clean).toContain('World');

      const userObject = {
        name: '   John Doe <script>alert(1)</script>   ',
        email: '  TEST@EXAMPLE.COM  ',
        password: '  secret123  ' // Password whitespace must be preserved
      };

      sanitizeInPlace(userObject);
      expect(userObject.name).toBe('John Doe');
      expect(userObject.email).toBe('test@example.com');
      expect(userObject.password).toBe('  secret123  ');
    });
  });

  describe('Request Size & Format Validation', () => {
    it('should reject malformed JSON with HTTP 400 and MALFORMED_JSON', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "broken-json", missingBracket');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.errorCode).toBe('MALFORMED_JSON');
    });

    it('should reject requests exceeding body size limit (50KB) with HTTP 413 PAYLOAD_TOO_LARGE', async () => {
      // Create a large body (> 50KB)
      const largeString = 'a'.repeat(60 * 1024);
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ email: 'test@example.com', payload: largeString }));

      expect(res.status).toBe(413);
      expect(res.body.status).toBe('fail');
      expect(res.body.errorCode).toBe('PAYLOAD_TOO_LARGE');
    });

    it('should reject requests with unsupported Content-Type for POST/PUT with body', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/xml')
        .send('<xml>login</xml>');

      expect(res.status).toBe(415);
      expect(res.body.status).toBe('fail');
      expect(res.body.errorCode).toBe('UNSUPPORTED_MEDIA_TYPE');
    });

    it('should reject requests with URL / query length > 2048 characters with HTTP 414', async () => {
      const longQuery = 'x'.repeat(2100);
      const res = await request(app).get(`/api/courses?dummy=${longQuery}`);

      expect(res.status).toBe(414);
      expect(res.body.status).toBe('fail');
      expect(res.body.errorCode).toBe('URI_TOO_LONG');
    });

    it('should reject requests with excessive pagination limit (> 100) with HTTP 400 LIMIT_EXCEEDED', async () => {
      const res = await request(app).get('/api/courses?limit=999999');
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(['LIMIT_EXCEEDED', 'VALIDATION_ERROR']).toContain(res.body.errorCode);
    });

    it('should accept requests with valid pagination limit (<= 100)', async () => {
      const res = await request(app).get('/api/courses?limit=20');
      expect(res.status).toBe(200);
    });
  });

  describe('Invalid ID Format Rejection', () => {
    it('should reject invalid MongoDB ObjectId in route params with HTTP 400', async () => {
      const res = await request(app).get('/api/courses/not-a-valid-objectid');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toMatch(/ObjectId|Mã định danh/i);
    });
  });

  describe('Schema Input Validation (Joi)', () => {
    it('should reject registration when required fields are missing or invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('x-test-client-id', 'schema-tester-' + Date.now())
        .send({
          name: '', // Empty name
          email: 'invalid-email-format',
          password: '123' // Too short (< 6)
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.details).toBeDefined();
      expect(Array.isArray(res.body.details)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate-limit headers on general API endpoints', async () => {
      const response = await request(app).get('/api/courses');
      
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('should enforce a strict maximum of 5 attempts for authentication routes within 15 minutes', async () => {
      const testClientId = 'attacker-test-ip-' + Date.now();

      // Send 5 attempts (each rejected by validation or bad auth)
      for (let i = 1; i <= 5; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .set('x-test-client-id', testClientId)
          .send({ email: 'nobody@example.com', password: 'wrongpassword' });

        expect(res.status).not.toBe(429);
        expect(res.headers['x-ratelimit-limit']).toBe('5');
      }

      // The 6th attempt MUST be blocked by authLimiter with HTTP 429
      const blockedRes = await request(app)
        .post('/api/auth/login')
        .set('x-test-client-id', testClientId)
        .send({ email: 'nobody@example.com', password: 'wrongpassword' });

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.status).toBe('fail');
      expect(blockedRes.body.message).toMatch(/quá nhiều lần thử xác thực/i);
    });
  });
});

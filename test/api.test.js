const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');

describe('Backend API Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Start test server on random free port
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('GET /sayHello returns 200 and {"message": "Hello User."}', async () => {
    const response = await fetch(`${baseUrl}/sayHello`);
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.equal(data.message, 'Hello User.');
  });

  test('GET / returns 200 with online status', async () => {
    const response = await fetch(`${baseUrl}/`);
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.equal(data.status, 'online');
  });
});

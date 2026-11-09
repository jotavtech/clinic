import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest, ApiError, responseList } from '../client/src/lib/api-request';

test('API client handles HTML errors, invalid JSON, empty responses and network failures', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('<html>Proxy failure</html>', { status: 502 });
    await assert.rejects(apiRequest('GET', '/api/test'), error => error instanceof ApiError && error.status === 502);
    globalThis.fetch = async () => new Response('<html>Wrong deployment</html>');
    await assert.rejects(apiRequest('GET', '/api/test'), /resposta inválida/);
    globalThis.fetch = async () => new Response(null, { status: 204 });
    assert.equal(await apiRequest('DELETE', '/api/test'), null);
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
    await assert.rejects(apiRequest('GET', '/api/test'), /conectar ao servidor/);
    globalThis.fetch = async () => { throw new DOMException('Aborted', 'AbortError'); };
    await assert.rejects(apiRequest('GET', '/api/test'), /demorou para responder/);
    assert.throws(() => responseList({}, 'appointments'), /lista inválida/);
  } finally { globalThis.fetch = original; }
});

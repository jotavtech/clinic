import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'node:http';
import bcrypt from 'bcrypt';
import { registerRoutes } from '../server/routes';
import { storage } from '../server/storage';
import { errorHandler } from '../server/error-handler';

test('administrative API requires sessions; public bookings validate input; logout revokes access', async () => {
  // Storage is replaced with fixtures: this suite never connects to a database.
  const originals = { getUserByUsername: storage.getUserByUsername, updateUserPassword: storage.updateUserPassword, getAppointments: storage.getAppointments, createAppointment: storage.createAppointment };
  let savedHash = '';
  let created: any;
  storage.getUserByUsername = async () => ({ id: 1, username: 'tester', password: savedHash || 'test-password' });
  storage.updateUserPassword = async (_id, hash) => { savedHash = hash; };
  storage.getAppointments = async () => [];
  storage.createAppointment = async data => { created = data; return { ...data, id: 1 } as any; };
  const app = express();
  app.use(express.json());
  await registerRoutes(app);
  app.use(errorHandler);
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}/api`;
  const json = (body: unknown) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    for (const [method, path] of [['GET', '/appointments'], ['GET', '/appointments/1'], ['PUT', '/appointments/1'], ['DELETE', '/appointments/1'], ['PUT', '/appointments/1/confirm'], ['GET', '/referrals'], ['GET', '/stats/monthly'], ['GET', '/stats/client-history'], ['POST', '/massagistas'], ['POST', '/referrals/generate']]) {
      assert.equal((await fetch(base + path, { method })).status, 401, `${method} ${path}`);
    }
    assert.equal((await fetch(base + '/login', json({ username: {} }))).status, 400);
    assert.equal((await fetch(base + '/login', json({ username: 'tester', password: 'incorrect' }))).status, 401);
    assert.equal((await fetch(base + '/appointments', json({}))).status, 400);
    const booking = { clientName: 'Cliente Teste', clientPhone: '(83) 99999-1234', service: 'suite-padrao', date: '2099-11-07', time: '09:00', duration: 60, status: 'realizado', referralCode: 'FORGED' };
    assert.equal((await fetch(base + '/appointments', json(booking))).status, 201);
    assert.equal(created.status, 'agendado');
    assert.equal(created.referralCode, undefined);
    assert.equal(created.clientPhone, '83999991234');
    const login = await fetch(base + '/login', json({ username: 'tester', password: 'test-password' }));
    assert.equal(login.status, 200);
    assert.ok(await bcrypt.compare('test-password', savedHash));
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    assert.equal((await fetch(base + '/appointments', { headers: { cookie } })).status, 200);
    assert.equal((await fetch(base + '/appointments/1abc', { headers: { cookie } })).status, 400);
    assert.equal((await fetch(base + '/upload-image', { method: 'POST', headers: { cookie } })).status, 400);
    const file = new FormData();
    file.append('image', new Blob(['not an image'], { type: 'text/plain' }), 'bad.txt');
    assert.equal((await fetch(base + '/upload-image', { method: 'POST', headers: { cookie }, body: file })).status, 400);
    assert.equal((await fetch(base + '/not-real')).status, 404);
    assert.equal((await fetch(base + '/logout', { method: 'POST', headers: { cookie } })).status, 200);
    assert.equal((await fetch(base + '/appointments', { headers: { cookie } })).status, 401);
    const hashedLogin = await fetch(base + '/login', json({ username: 'tester', password: 'test-password' }));
    assert.equal(hashedLogin.status, 200);
  } finally {
    Object.assign(storage, originals);
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

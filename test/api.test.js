import test from 'node:test';
import assert from 'node:assert/strict';
process.env.PAIR_SECRET = 'x'.repeat(40);
const { store } = await import('../api/_lib/store.js');
const register = (await import('../api/device/register.js')).default;
const poll = (await import('../api/device/poll.js')).default;
const trial = (await import('../api/device/trial.js')).default;
const pair = (await import('../api/pair.js')).default;
const { validatePlaylist, encrypt, decrypt } = await import('../api/_lib/util.js');

function call(h, { method = 'POST', body, query, ip = '1.1.1.1' } = {}) {
  return new Promise((resolve) => {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(t) { resolve({ status: this.statusCode, body: JSON.parse(t) }); } };
    h({ method, body, query, headers: { 'x-forwarded-for': ip }, socket: {} }, res);
  });
}
const DEV = 'ABCDEF0123456789ABCDEF0123456789';

test.beforeEach(() => store._reset());

test('fluxo completo: registrar → enviar lista → receber uma única vez', async () => {
  const r = await call(register, { body: { deviceId: DEV } });
  assert.equal(r.status, 200);
  const { code } = r.body;
  assert.match(code, /^[A-Z2-9]{6}$/);
  assert.equal((await call(poll, { method: 'GET', query: { deviceId: DEV, code } })).body.status, 'waiting');
  const p = await call(pair, { body: { code, type: 'xtream', server: 'http://srv.com:8080/', username: 'u', password: 'p@ss', name: 'Casa' } });
  assert.equal(p.status, 200);
  const got = await call(poll, { method: 'GET', query: { deviceId: DEV, code } });
  assert.equal(got.body.status, 'ready');
  assert.deepEqual(got.body.playlist, { type: 'xtream', name: 'Casa', server: 'http://srv.com:8080', username: 'u', password: 'p@ss' });
  assert.equal((await call(poll, { method: 'GET', query: { deviceId: DEV, code } })).body.status, 'expired'); // apagado
});

test('outro dispositivo não consegue ler a lista', async () => {
  const { code } = (await call(register, { body: { deviceId: DEV } })).body;
  await call(pair, { body: { code, type: 'm3u', url: 'https://a.com/l.m3u' } });
  const r = await call(poll, { method: 'GET', query: { deviceId: 'ZZZZZZZZZZZZZZZZZZZZ', code } });
  assert.equal(r.status, 403);
});

test('código inexistente e entrada inválida são recusados', async () => {
  assert.equal((await call(pair, { body: { code: 'ABCDEF', type: 'm3u', url: 'https://a.com/l.m3u' } })).status, 404);
  assert.equal((await call(pair, { body: { code: 'ab', type: 'm3u', url: 'https://a.com' } })).status, 400);
  const { code } = (await call(register, { body: { deviceId: DEV } })).body;
  assert.equal((await call(pair, { body: { code, type: 'm3u', url: 'javascript:alert(1)' } })).status, 400);
  assert.equal((await call(pair, { body: { code, type: 'xtream', server: 'http://a.com', username: '', password: 'x' } })).status, 400);
  assert.equal((await call(register, { body: { deviceId: 'curto' } })).status, 400);
  assert.equal((await call(register, { method: 'GET' })).status, 405);
});

test('limite de tentativas por IP', async () => {
  let last;
  for (let i = 0; i < 17; i++) last = await call(pair, { body: { code: 'ABCDEF', type: 'm3u', url: 'https://a.com' }, ip: '9.9.9.9' });
  assert.equal(last.status, 429);
});

test('teste grátis: 10 dias, não reinicia, ID bruto não é gravado', async () => {
  const a = (await call(trial, { body: { deviceId: DEV } })).body;
  assert.equal(a.daysLeft, 10);
  assert.equal(a.expired, false);
  const b = (await call(trial, { body: { deviceId: DEV } })).body;
  assert.equal(b.startedAt, a.startedAt);
  // simula passagem do tempo
  const { hashDevice } = await import('../api/_lib/util.js');
  await store.set(`trial:${hashDevice(DEV)}`, String(Date.now() - 11 * 86400000));
  const c = (await call(trial, { body: { deviceId: DEV } })).body;
  assert.equal(c.expired, true);
  assert.equal(c.daysLeft, 0);
});

test('criptografia ida e volta e validação', () => {
  assert.deepEqual(decrypt(encrypt({ a: 1, senha: 'x' })), { a: 1, senha: 'x' });
  assert.equal(validatePlaylist({ type: 'm3u', url: 'ftp://x' }).ok, false);
  assert.equal(validatePlaylist({ type: 'm3u', url: 'http://x.com/a.m3u8' }).ok, true);
});

test('QR em PNG para o site com o código', async () => {
  const qr = (await import('../api/qr.js')).default;
  const chunks = [];
  const out = await new Promise((resolve) => {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { resolve({ status: this.statusCode, type: this.headers['Content-Type'], b }); } };
    qr({ method: 'GET', query: { c: 'ABC234' }, headers: { host: 'meu-site.vercel.app', 'x-forwarded-for': '2.2.2.2' }, socket: {} }, res);
  });
  assert.equal(out.status, 200);
  assert.equal(out.type, 'image/png');
  assert.equal(out.b.subarray(1, 4).toString(), 'PNG');
});


const info = (await import('../api/pair-info.js')).default;
const premove = (await import('../api/pair-remove.js')).default;
const dlist = (await import('../api/device/list.js')).default;
const dremove = (await import('../api/device/remove.js')).default;

test('lista fica salva só para o aparelho dono e sobrevive à entrega', async () => {
  const { code } = (await call(register, { body: { deviceId: DEV } })).body;
  await call(pair, { body: { code, type: 'xtream', server: 'http://srv.com:8080', username: 'u', password: 'segredo', name: 'Casa' } });
  assert.equal((await call(poll, { method: 'GET', query: { deviceId: DEV, code } })).body.status, 'ready');
  // continua salva depois da entrega
  const mine = await call(dlist, { body: { deviceId: DEV } });
  assert.equal(mine.body.playlist.password, 'segredo');
  // outro aparelho não recebe nada
  const other = await call(dlist, { body: { deviceId: 'OTHERDEVICE0123456789ABCDEF012345' } });
  assert.equal(other.body.playlist, null);
});

test('"minha lista": informa sem senha e remove', async () => {
  const { code } = (await call(register, { body: { deviceId: DEV } })).body;
  await call(pair, { body: { code, type: 'xtream', server: 'http://srv.com:8080', username: 'u', password: 'segredo', name: 'Casa' } });
  const { code: code2 } = (await call(register, { body: { deviceId: DEV } })).body;
  const i = await call(info, { body: { code: code2 } });
  assert.deepEqual(i.body, { has: true, type: 'xtream', name: 'Casa', host: 'srv.com:8080' });
  assert.ok(!JSON.stringify(i.body).includes('segredo'));
  assert.equal((await call(premove, { body: { code: code2 } })).status, 200);
  assert.equal((await call(dlist, { body: { deviceId: DEV } })).body.playlist, null);
  assert.equal((await call(info, { body: { code: 'ZZZZZZ' } })).status, 404);
});

test('TV remove a própria lista', async () => {
  const { code } = (await call(register, { body: { deviceId: DEV } })).body;
  await call(pair, { body: { code, type: 'm3u', url: 'https://a.com/l.m3u' } });
  await call(dremove, { body: { deviceId: DEV } });
  assert.equal((await call(dlist, { body: { deviceId: DEV } })).body.playlist, null);
});

test('acesso livre só para a referência configurada', async () => {
  const t1 = (await call(trial, { body: { deviceId: DEV } })).body;
  assert.equal(t1.free, false);
  assert.match(t1.ref, /^[0-9a-f]{10}$/);
  process.env.FREE_DEVICES = `abc, ${t1.ref}`;
  assert.equal((await call(trial, { body: { deviceId: DEV } })).body.free, true);
  assert.equal((await call(trial, { body: { deviceId: 'OTHERDEVICE0123456789ABCDEF012345' } })).body.free, false);
  delete process.env.FREE_DEVICES;
});

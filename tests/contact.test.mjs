import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleContact } from '../api/contact.js';
import { normalizePhone } from '../shared/contact.js';

const env = { TELEGRAM_BOT_TOKEN: 'test-credential', TELEGRAM_CHAT_ID: '123' };
const data = { name: 'Мар’яна-Олена', phone: '099 123 45 67', website: '' };
const request = (body = data, headers = {}, method = 'POST') => new Request('https://clinic.example/api/contact', {
  method, headers: { 'Content-Type': 'application/json', Origin: 'https://clinic.example', ...headers },
  ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
});
const delivered = { ok: true, result: { message_id: 1, chat: { id: 123 } } };
const run = (r, fetchImpl = async () => Response.json(delivered), credentials = env) => handleContact(r, { env: credentials, fetchImpl });

test('phone normalization accepts local/UA/international formats without accepting letters or incomplete UA numbers', () => {
  for (const value of ['099 123 45 67', '+380 (99) 123-45-67', '380991234567']) assert.equal(normalizePhone(value), '+380991234567');
  assert.equal(normalizePhone('+48 501 234 567'), '+48501234567');
  for (const value of [null, 123, 'abc0991234567', '+38099123456', '09912', '+48+501234567']) assert.equal(normalizePhone(value), null);
});

test('rejects method, content type, cross-origin and malformed input before calling Telegram', async () => {
  let calls = 0;
  const transport = async () => { calls++; return Response.json(delivered); };
  const cases = [
    [request(undefined, {}, 'GET'), 405],
    [request(data, { 'Content-Type': 'text/plain' }), 415],
    [request(data, { Origin: 'https://other.example' }), 403],
    [request(data, { 'Sec-Fetch-Site': 'cross-site' }), 403],
    [request('{bad'), 400], [request(null), 400], [request([]), 400],
    [request({ ...data, website: 'spam' }), 400],
    [request({ ...data, phone: '+38099123456' }), 422],
    [request({ ...data, name: 'x'.repeat(81) }), 422],
    [request({ ...data, name: 'Name\nForged entry' }), 422],
    ...['', null, 123, {}, [], 'unknown', '__proto__', 'implants\nForged entry'].map(category => [request({ ...data, category }), 422]),
    [request('x'.repeat(2049)), 413],
    [request(data, { 'Content-Length': '4096' }), 413],
  ];
  for (const [r, expected] of cases) assert.equal((await run(r, transport)).status, expected);
  assert.equal(calls, 0);
});

test('requires both server-only credentials', async () => {
  for (const credentials of [{}, { TELEGRAM_BOT_TOKEN: 'test-credential' }, { TELEGRAM_CHAT_ID: '123' }]) assert.equal((await run(request(), undefined, credentials)).status, 503);
});

test('sends only normalized, bounded plain-text contact fields to the configured chat', async () => {
  let message;
  const result = await run(request(), async (url, options) => {
    assert.equal(url, 'https://api.telegram.org/bottest-credential/sendMessage');
    assert.equal(options.method, 'POST');
    message = JSON.parse(options.body);
    assert.equal(message.chat_id, '123');
    assert.equal(message.parse_mode, undefined);
    assert.ok(message.text.includes('Мар’яна-Олена'));
    assert.ok(message.text.includes('+380991234567'));
    assert.ok(message.text.includes('Напрям: Потрібна консультація'));
    return Response.json(delivered);
  });
  const response = await result.json();
  assert.equal(response.ok, true);
  assert.match(response.requestId, /^[a-f0-9-]{36}$/);
  assert.equal(result.headers.get('Cache-Control'), 'no-store');
  assert.ok(!JSON.stringify(response).includes('1234567'));
  await run(request({ ...data, name: '' }), async (_, options) => {
    assert.ok(JSON.parse(options.body).text.includes('Не вказано'));
    return Response.json(delivered);
  });
  assert.equal((await run(request({ phone: data.phone, website: '' }))).status, 200);
});

test('delivers each selected treatment as its trusted label and defaults for older clients', async () => {
  for (const [category, label] of [
    ['consultation', 'Потрібна консультація'],
    ['treatment', 'Лікування зубів'],
    ['implants', 'Імплантація'],
    ['crowns', 'Коронки та вініри'],
    ['ortho', 'Брекети та елайнери'],
    ['surgery', 'Хірургія та видалення'],
    [undefined, 'Потрібна консультація'],
  ]) {
    let calls = 0;
    const result = await run(request({ ...data, name: '', category, categoryTitle: 'Injected title' }), async (_, options) => {
      calls++;
      const { text } = JSON.parse(options.body);
      assert.ok(text.includes(`Напрям: ${label}\n`));
      assert.ok(text.includes('Ім’я: Не вказано'));
      assert.ok(!text.includes('Injected title'));
      return Response.json(delivered);
    });
    assert.equal(result.status, 200);
    assert.equal(calls, 1);
  }
});

test('never reports success without provider acknowledgement and correct recipient', async () => {
  const cases = [
    async () => Response.json({ ok: false }, { status: 400 }),
    async () => Response.json({ ok: false }),
    async () => Response.json({ ok: true }),
    async () => Response.json({ ok: true, result: { message_id: 1, chat: { id: 999 } } }),
    async () => new Response('not json'),
    async () => { throw new Error('Transport failure'); },
  ];
  for (const transport of cases) assert.equal((await run(request(), transport)).status, 502);
});

test('surfaces provider throttling without exposing provider details', async () => {
  const result = await run(request(), async () => Response.json({ ok: false, parameters: { retry_after: 30 }, description: 'Provider detail' }, { status: 429 }));
  assert.equal(result.status, 429);
  assert.equal(result.headers.get('Retry-After'), '30');
  assert.deepEqual(await result.json(), { ok: false });
});

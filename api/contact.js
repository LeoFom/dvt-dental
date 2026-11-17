import { randomUUID } from 'node:crypto';
import { normalizeCategory, normalizePhone } from '../shared/contact.js';

const maxBodyBytes = 2048;
function reply(status, body, headers = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

async function readBody(request) {
  if (Number(request.headers.get('content-length')) > maxBodyBytes) throw new Error('body_too_large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid_body');
  let length = 0;
  const parts = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maxBodyBytes) {
      await reader.cancel();
      throw new Error('body_too_large');
    }
    parts.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function handleContact(request, { env = process.env, fetchImpl = fetch } = {}) {
  if (request.method !== 'POST') return reply(405, { ok: false }, { Allow: 'POST' });
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return reply(415, { ok: false });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return reply(403, { ok: false });
  if (request.headers.get('sec-fetch-site') === 'cross-site') return reply(403, { ok: false });

  let data;
  try { data = await readBody(request); }
  catch (error) { return reply(error.message === 'body_too_large' ? 413 : 400, { ok: false }); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(400, { ok: false });
  if (typeof data.website !== 'string' || data.website.length) return reply(400, { ok: false });
  const phone = normalizePhone(data.phone);
  if (!phone) return reply(422, { ok: false, field: 'phone' });
  const rawName = data.name ?? '';
  if (typeof rawName !== 'string' || rawName.length > 80 || /[\u0000-\u001f\u007f]/.test(rawName)) return reply(422, { ok: false, field: 'name' });
  const name = rawName.trim();
  const category = normalizeCategory(data.category);
  if (!category) return reply(422, { ok: false, field: 'category' });
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return reply(503, { ok: false });

  const requestId = randomUUID();
  const receivedAt = new Intl.DateTimeFormat('uk-UA', { timeZone: 'Europe/Kyiv', dateStyle: 'short', timeStyle: 'short' }).format(new Date());
  const text = `Нова заявка з сайту DVT Denta\n\nІм’я: ${name || 'Не вказано'}\nТелефон: ${phone}\nНапрям: ${category.title}\n\nЧас: ${receivedAt}\nЗаявка: ${requestId}`;
  try {
    const response = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json();
    if (!response.ok || !result.ok || !Number.isInteger(result.result?.message_id) || String(result.result?.chat?.id) !== String(chatId)) {
      console.error('contact_delivery_rejected', { requestId, upstreamStatus: response.status });
      const retryAfter = result.parameters?.retry_after;
      if (response.status === 429 && Number.isInteger(retryAfter)) return reply(429, { ok: false }, { 'Retry-After': String(retryAfter) });
      return reply(502, { ok: false });
    }
    console.info('contact_delivered', { requestId });
    return reply(200, { ok: true, requestId });
  } catch {
    // Never log the fetch error or provider response: either may contain credentials or personal data.
    console.error('contact_delivery_unavailable', { requestId });
    return reply(502, { ok: false });
  }
}

export default { fetch(request) { return handleContact(request); } };

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildContactMessage } from '../server/telegram-message.js';

const contact = {
  name: 'Мар’яна-Олена', phone: '+380991234567', categoryTitle: 'Імплантація',
  receivedAt: new Date('2026-11-18T09:35:00Z'),
};

test('notification highlights a new request, contact details and the next step without technical identifiers', () => {
  const message = buildContactMessage(contact);
  assert.equal(message.parse_mode, 'HTML');
  assert.ok(message.text.startsWith('<b>🦷 Нова заявка на прийом</b>\n<i>З сайту DVT Denta</i>\n\n'));
  for (const field of ['<b>Ім’я:</b> Мар’яна-Олена', '<b>Телефон:</b> +380991234567', '<b>Послуга:</b> Імплантація']) assert.ok(message.text.includes(field));
  assert.ok(message.text.includes('Зв’яжіться з пацієнтом, щоб узгодити дату й час прийому.'));
  assert.ok(!/requestId|chat_id|Заявка:|[a-f0-9]{8}-[a-f0-9-]{27}/.test(message.text));
  assert.deepEqual(message.reply_markup.inline_keyboard, [[{ text: 'Скопіювати номер', copy_text: { text: contact.phone } }]]);
});

test('escapes patient-supplied HTML and entities so names cannot break formatting or create links', () => {
  const message = buildContactMessage({ ...contact, name: 'Ірина & <b>"Анна"</b> <a href=\'x\'>', categoryTitle: 'Коронки & вініри' });
  assert.ok(message.text.includes('Ірина &amp; &lt;b&gt;&quot;Анна&quot;&lt;/b&gt; &lt;a href=&#39;x&#39;&gt;'));
  assert.ok(message.text.includes('Коронки &amp; вініри'));
  assert.equal(message.text.includes('<a href='), false);
  assert.equal(message.text.includes('<b>"Анна"</b>'), false);
});

test('handles an omitted name and retains an international number in the copy action', () => {
  const message = buildContactMessage({ ...contact, name: '', phone: '+48501234567', categoryTitle: 'Потрібна консультація' });
  assert.ok(message.text.includes('<b>Ім’я:</b> Не вказано'));
  assert.equal(message.reply_markup.inline_keyboard[0][0].copy_text.text, '+48501234567');
});

test('labels receipt time in Kyiv and follows winter and summer time independently of server timezone', () => {
  assert.ok(buildContactMessage(contact).text.endsWith('<i>Отримано 18.11.2026, 11:35 · час Києва</i>'));
  const summer = buildContactMessage({ ...contact, receivedAt: new Date('2026-07-18T09:35:00Z') });
  assert.ok(summer.text.endsWith('<i>Отримано 18.07.2026, 12:35 · час Києва</i>'));
});

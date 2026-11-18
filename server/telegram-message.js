function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return value.replace(/[&<>"']/g, character => entities[character]);
}

export function buildContactMessage({ name, phone, categoryTitle, receivedAt = new Date() }) {
  const received = new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(receivedAt);

  return {
    parse_mode: 'HTML',
    text: [
      '<b>🦷 Нова заявка на прийом</b>',
      '<i>З сайту DVT Denta</i>',
      '',
      `<b>Ім’я:</b> ${escapeHtml(name || 'Не вказано')}`,
      `<b>Телефон:</b> ${escapeHtml(phone)}`,
      `<b>Послуга:</b> ${escapeHtml(categoryTitle)}`,
      '',
      'Зв’яжіться з пацієнтом, щоб узгодити дату й час прийому.',
      '',
      `<i>Отримано ${escapeHtml(received)} · час Києва</i>`,
    ].join('\n'),
    reply_markup: {
      inline_keyboard: [[{ text: 'Скопіювати номер', copy_text: { text: phone } }]],
    },
  };
}

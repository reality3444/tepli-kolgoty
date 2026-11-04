function page(title, message, backLabel, status) {
  const html = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>body{font-family:Arial,sans-serif;background:#f4f4f4;color:#222;margin:0;padding:24px}.card{max-width:440px;margin:12vh auto;background:#fff;padding:32px 24px;text-align:center;border-radius:12px;box-shadow:0 5px 30px #0001}h1{color:#c91d25;font-size:26px}p{line-height:1.5}a{display:inline-block;background:#c91d25;color:#fff;padding:14px 24px;border-radius:30px;text-decoration:none;font-weight:bold}</style></head><body><main class="card"><h1>${title}</h1><p>${message}</p><a href="/#order_form">${backLabel}</a></main></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
const errorPage = (message, status) => page('Щось пішло не так', message, 'Спробувати ще раз', status);
export default {
  async fetch(request) {
    if (request.method !== 'POST') return Response.redirect(new URL('/#order_form', request.url), 303);
    let data;
    try { data = await request.formData(); }
    catch { return errorPage('Не вдалося прочитати дані форми. Спробуйте ще раз.', 400); }
    const name = typeof data.get('name') === 'string' ? data.get('name').trim() : '';
    const phone = typeof data.get('phone') === 'string' ? data.get('phone').trim() : '';
    const digits = phone.replace(/\D/g, '');
    if (!name || [...name].length > 100 || /[\x00-\x1f\x7f]/u.test(name) || !/^[+\d\s()\-]+$/u.test(phone) || digits.length < 10 || digits.length > 15 || phone.length > 30) {
      return errorPage('Перевірте ім’я та номер телефону і спробуйте ще раз.', 422);
    }
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
    if (!token || !chatId) {
      console.error('Telegram delivery is not configured');
      return errorPage('Не вдалося надіслати замовлення. Спробуйте пізніше.', 503);
    }
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: `Нове замовлення: термоколготки\nІм’я: ${name}\nТелефон: ${phone}` }),
        signal: AbortSignal.timeout(12000),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        const description = typeof result.description === 'string' ? result.description.toLowerCase() : '';
        const category = response.status === 401 ? 'invalid_token'
          : description.includes('chat not found') ? 'chat_not_found'
          : description.includes('forbidden') ? 'bot_forbidden'
          : response.status === 429 ? 'rate_limited' : 'telegram_rejected';
        console.error(`Telegram delivery rejected: ${category}; HTTP ${response.status}`);
        return errorPage('Не вдалося надіслати замовлення. Будь ласка, спробуйте ще раз.', 502);
      }
    } catch (error) {
      const category = error?.name === 'TimeoutError' ? 'timeout' : 'network_or_response_error';
      console.error(`Telegram delivery failed: ${category}`);
      return errorPage('Не вдалося надіслати замовлення. Будь ласка, спробуйте ще раз.', 502);
    }
    return page('Дякуємо за замовлення!', 'Ми отримали вашу заявку. Менеджер зв’яжеться з вами для уточнення деталей.', 'Повернутися на сайт', 200);
  },
};

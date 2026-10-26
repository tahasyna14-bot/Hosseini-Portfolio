export function validateContact(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'اطلاعات ارسالی معتبر نیست.' };
  }
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  // Honeypot field: bots often fill hidden fields; reject without accepting the message.
  if (typeof body.website === 'string' && body.website.trim()) {
    return { ok: false, error: 'درخواست معتبر نیست.' };
  }
  if (name.length < 2 || name.length > 80) return { ok: false, error: 'نام باید بین ۲ تا ۸۰ نویسه باشد.' };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, error: 'ایمیل معتبر وارد کنید.' };
  }
  if (message.length < 10 || message.length > 3000) {
    return { ok: false, error: 'پیام باید بین ۱۰ تا ۳۰۰۰ نویسه باشد.' };
  }
  return { ok: true, data: { name, email, message } };
}

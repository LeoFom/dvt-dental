import { useEffect, useRef, useState } from 'react';
import { clinic } from './content';
import { normalizePhone } from '../shared/contact.js';

type Submission = 'idle' | 'pending' | 'success' | 'error';

export function ContactRequestForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [status, setStatus] = useState<Submission>('idle');
  const [submitError, setSubmitError] = useState('');
  const phoneRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const hasUnsentInput = status !== 'success' && Boolean(name.trim() || phone.trim());

  useEffect(() => {
    if (!hasUnsentInput) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [hasUnsentInput]);

  useEffect(() => {
    if (status === 'success') successRef.current?.focus({ preventScroll: true });
  }, [status]);

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || status === 'success') return;
    const normalizedPhone = normalizePhone(phone);
    setSubmitError('');
    if (!normalizedPhone) {
      setPhoneError('Перевірте номер: наприклад, +380 99 123 45 67.');
      phoneRef.current?.focus();
      return;
    }
    const website = new FormData(event.currentTarget).get('website') ?? '';
    setPhoneError('');
    setStatus('pending');
    inFlight.current = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: normalizedPhone, website }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        if (response.status === 422 && result.field === 'phone') {
          setPhoneError('Перевірте номер: наприклад, +380 99 123 45 67.');
          setStatus('idle');
          requestAnimationFrame(() => phoneRef.current?.focus());
          return;
        }
        if (response.status === 429) {
          setSubmitError('Забагато спроб. Зачекайте трохи та спробуйте ще раз.');
          setStatus('error');
          return;
        }
        throw new Error('Submission unavailable');
      }
      setName('');
      setPhone('');
      setStatus('success');
    } catch {
      setStatus('error');
      setSubmitError('Не вдалося підтвердити надсилання. Спробуйте ще раз або зателефонуйте');
    } finally {
      window.clearTimeout(timeout);
      inFlight.current = false;
    }
  }

  if (status === 'success') return <div ref={successRef} className="request-form request-confirmation" tabIndex={-1} role="status" aria-live="polite">
    <svg className="request-check" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="20" cy="20" r="19" stroke="currentColor"/><path d="m12 20 5 5 11-11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <h3>Заявку надіслано</h3><p>Зв’яжемося з вами, щоб узгодити час і деталі візиту.</p>
  </div>;

  return <form className="request-form" aria-labelledby="request-title" aria-busy={status === 'pending'} onSubmit={submitRequest} noValidate>
    <div className="request-trap" aria-hidden="true"><label htmlFor="request-website">Website</label><input id="request-website" name="website" type="text" tabIndex={-1} autoComplete="off" maxLength={128}/></div>
    <div className="request-field"><label htmlFor="request-name">Ім’я <span className="request-optional">необов’язково</span></label><input id="request-name" name="name" type="text" autoComplete="given-name" maxLength={80} disabled={status === 'pending'} value={name} onChange={event => { setName(event.target.value); setStatus('idle'); setSubmitError(''); }}/></div>
    <div className="request-field"><label htmlFor="request-phone">Телефон</label><input ref={phoneRef} id="request-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+380 99 123 45 67…" maxLength={40} required disabled={status === 'pending'} aria-invalid={phoneError ? true : undefined} aria-describedby={phoneError ? 'request-phone-error' : undefined} value={phone} onChange={event => { setPhone(event.target.value); setPhoneError(''); setStatus('idle'); setSubmitError(''); }}/>{phoneError ? <p id="request-phone-error" className="request-field-error" role="alert">{phoneError}</p> : null}</div>
    <button type="submit" className="button button-dark request-submit" disabled={status === 'pending'}>{status === 'pending' ? <><span className="request-spinner" aria-hidden="true"/>Надсилаємо…</> : 'Надіслати заявку'}</button>
    {submitError ? <p className="request-status" role="alert">{submitError}{status === 'error' && !submitError.startsWith('Забагато') ? <> <a href={clinic.phoneHref}>{clinic.phone}</a>.</> : null}</p> : null}
  </form>;
}

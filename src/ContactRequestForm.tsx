import { useEffect, useRef, useState } from 'react';
import { clinic } from './content';

function isPhoneValid(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, '');
  if (compact.startsWith('+380')) return /^\+380\d{9}$/.test(compact);
  return /^0\d{9}$/.test(compact)
    || /^380\d{9}$/.test(compact)
    || /^\+[1-9]\d{7,14}$/.test(compact);
}

export function ContactRequestForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const hasUnsentInput = Boolean(name.trim() || phone.trim());

  useEffect(() => {
    if (!hasUnsentInput) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [hasUnsentInput]);

  function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUnavailable(false);
    if (!isPhoneValid(phone)) {
      setPhoneError('Перевірте номер: наприклад, +380 99 123 45 67.');
      phoneRef.current?.focus();
      return;
    }
    setPhoneError('');
    // Stage 2 will add server-side delivery. Never confirm receipt without it.
    setUnavailable(true);
  }

  return <form className="request-form" aria-labelledby="request-title" onSubmit={submitRequest} noValidate>
    <div className="request-field"><label htmlFor="request-name">Ім’я <span className="request-optional">необов’язково</span></label><input id="request-name" name="name" type="text" autoComplete="given-name" maxLength={80} value={name} onChange={event => { setName(event.target.value); setUnavailable(false); }}/></div>
    <div className="request-field"><label htmlFor="request-phone">Телефон</label><input ref={phoneRef} id="request-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+380 99 123 45 67…" maxLength={40} required aria-invalid={phoneError ? true : undefined} aria-describedby={phoneError ? 'request-phone-error' : undefined} value={phone} onChange={event => { setPhone(event.target.value); setPhoneError(''); setUnavailable(false); }}/>{phoneError ? <p id="request-phone-error" className="request-field-error" role="alert">{phoneError}</p> : null}</div>
    <button type="submit" className="button button-dark request-submit">Надіслати заявку</button>
    {unavailable ? <p className="request-status" role="status">Онлайн-заявки поки недоступні. Зателефонуйте <a href={clinic.phoneHref}>{clinic.phone}</a>, щоб узгодити візит.</p> : null}
  </form>;
}

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { clinic } from './content';
import { defaultCategoryId, normalizePhone, requestCategories, type RequestCategoryId } from '../shared/contact.js';

type Submission = 'idle' | 'pending' | 'success' | 'error';
export type OpenRequest = (category?: RequestCategoryId) => void;
export type RequestModalHandle = { open: OpenRequest };

export function ContactRequestModal({ ref }: { ref: Ref<RequestModalHandle> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const backdropPress = useRef(false);
  const closing = useRef(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const revealFrame = useRef<number | undefined>(undefined);
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>('closed');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<RequestCategoryId>(defaultCategoryId);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [status, setStatus] = useState<Submission>('idle');
  const [submitError, setSubmitError] = useState('');
  const hasUnsentInput = status !== 'success' && Boolean(name.trim() || phone.trim());

  useImperativeHandle(ref, () => ({
    open(nextCategory = defaultCategoryId) {
      cancelMotion();
      closing.current = false;
      // A request can finish while the dialog is closed. Keep its submitted
      // category visible and prevent starting another request until it settles.
      if (!inFlight.current) {
        setCategory(nextCategory);
        setCategoryError('');
        if (status === 'success') {
          setStatus('idle');
          setNameError('');
          setPhoneError('');
          setSubmitError('');
        }
      }
      const dialog = dialogRef.current;
      if (dialog) dialog.style.height = '';
      if (dialog && !dialog.open) {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setPhase(reducedMotion ? 'open' : 'closed');
        dialog.showModal();
        dialog.scrollTop = 0;
        if (!reducedMotion) {
          // Paint the starting position before transitioning the native dialog.
          revealFrame.current = requestAnimationFrame(() => {
            revealFrame.current = requestAnimationFrame(() => {
              revealFrame.current = undefined;
              if (dialog.open && !closing.current) setPhase('open');
            });
          });
        }
      } else if (dialog?.open) {
        // A new request can reverse an exit already in progress.
        setPhase('open');
      }
    },
  }), [status]);

  useEffect(() => () => cancelMotion(), []);

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
    if (status === 'success' && dialogRef.current?.open) successRef.current?.focus({ preventScroll: true });
  }, [status]);

  function cancelMotion() {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = undefined;
    if (revealFrame.current !== undefined) cancelAnimationFrame(revealFrame.current);
    revealFrame.current = undefined;
  }

  function finishClose() {
    cancelMotion();
    closing.current = false;
    const dialog = dialogRef.current;
    dialog?.close();
    if (dialog) dialog.style.height = '';
    setPhase('closed');
  }

  function close() {
    const dialog = dialogRef.current;
    if (!dialog?.open || closing.current) return;
    cancelMotion();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishClose();
      return;
    }
    // An arriving response must not resize the panel during its exit.
    if (inFlight.current) dialog.style.height = `${dialog.offsetHeight}px`;
    closing.current = true;
    setPhase('closing');
    // Keep focus trapping and scroll locking until the exit finishes.
    // The timeout also closes the dialog if transitionend never fires.
    closeTimer.current = window.setTimeout(finishClose, 260);
  }

  function isBackdrop(event: React.MouseEvent<HTMLDialogElement> | React.PointerEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return false;
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  }

  function clearSubmitError() {
    setStatus('idle');
    setSubmitError('');
  }

  function cycleFocus(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    if (closing.current) { event.preventDefault(); return; }
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([tabindex="-1"]), select:not(:disabled), a[href]')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (closing.current || inFlight.current || status === 'success') return;
    setSubmitError('');
    if (/[\u0000-\u001f\u007f]/.test(name)) {
      setNameError('Вкажіть ім’я без спеціальних символів або залиште поле порожнім.');
      nameRef.current?.focus();
      return;
    }
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      setPhoneError('Перевірте номер: наприклад, +380 99 123 45 67.');
      phoneRef.current?.focus();
      return;
    }
    const website = new FormData(event.currentTarget).get('website') ?? '';
    setNameError('');
    setPhoneError('');
    setCategoryError('');
    setStatus('pending');
    inFlight.current = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: normalizedPhone, category, website }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        if (response.status === 422) {
          if (result.field === 'phone') {
            setPhoneError('Перевірте номер: наприклад, +380 99 123 45 67.');
            requestAnimationFrame(() => { if (dialogRef.current?.open) phoneRef.current?.focus(); });
          } else if (result.field === 'name') {
            setNameError('Скоротіть ім’я або залиште поле порожнім.');
            requestAnimationFrame(() => { if (dialogRef.current?.open) nameRef.current?.focus(); });
          } else if (result.field === 'category') {
            setCategoryError('Оберіть напрям зі списку або «Потрібна консультація».');
            requestAnimationFrame(() => { if (dialogRef.current?.open) categoryRef.current?.focus(); });
          } else throw new Error('Submission unavailable');
          setStatus('idle');
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

  return <dialog ref={dialogRef} id="request-dialog" className="request-dialog" data-phase={phase} aria-labelledby="request-dialog-title" aria-describedby="request-dialog-description"
    onKeyDown={cycleFocus}
    onCancel={event => { event.preventDefault(); close(); }}
    onTransitionEnd={event => { if (closing.current && event.target === event.currentTarget && event.propertyName === 'opacity') finishClose(); }}
    onPointerDown={event => { backdropPress.current = isBackdrop(event); }}
    onClick={event => { if (backdropPress.current && isBackdrop(event)) close(); backdropPress.current = false; }}>
    <div className="request-dialog-content">
      <button type="button" className="request-close" onClick={close} aria-label="Закрити форму"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
      <h2 id="request-dialog-title" className="request-dialog-title">Обговорімо ваш візит</h2>
      <p id="request-dialog-description" className="request-dialog-description">{status === 'success' ? 'Ми отримали ваше звернення.' : 'Залиште телефон — зв’яжемося з вами, щоб узгодити час і деталі прийому.'}</p>
      {status === 'success' ? <div ref={successRef} className="request-confirmation" tabIndex={-1} role="status" aria-live="polite">
        <div className="request-confirmation-heading"><h3>Заявку надіслано</h3><svg className="request-check" width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="20" cy="20" r="19" stroke="currentColor"/><path d="m12 20 5 5 11-11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        <p>Дякуємо! Узгодимо час і відповімо на ваші запитання під час розмови.</p>
        <button type="button" className="button button-dark request-submit" onClick={close}>Повернутися до сайту</button>
      </div> : <form className="request-form" aria-labelledby="request-dialog-title" aria-busy={status === 'pending'} onSubmit={submitRequest} noValidate>
        <div className="request-trap" aria-hidden="true"><label htmlFor="request-website">Website</label><input id="request-website" name="website" type="text" tabIndex={-1} autoComplete="off" maxLength={128}/></div>
        <div className="request-fields">
        <div className="request-field"><label htmlFor="request-name">Ім’я <span className="request-optional">необов’язково</span></label><input ref={nameRef} id="request-name" name="name" type="text" autoComplete="given-name" maxLength={80} disabled={status === 'pending'} aria-invalid={nameError ? true : undefined} aria-describedby={nameError ? 'request-name-error' : undefined} value={name} onChange={event => { setName(event.target.value); setNameError(''); clearSubmitError(); }}/>{nameError ? <p id="request-name-error" className="request-field-error" role="alert">{nameError}</p> : null}</div>
        <div className="request-field"><label htmlFor="request-phone">Телефон</label><input ref={phoneRef} id="request-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+380 99 123 45 67…" maxLength={40} required disabled={status === 'pending'} aria-invalid={phoneError ? true : undefined} aria-describedby={phoneError ? 'request-phone-error' : undefined} value={phone} onChange={event => { setPhone(event.target.value); setPhoneError(''); clearSubmitError(); }}/>{phoneError ? <p id="request-phone-error" className="request-field-error" role="alert">{phoneError}</p> : null}</div>
        <div className="request-field"><label htmlFor="request-category">Напрям лікування</label><select ref={categoryRef} id="request-category" name="category" autoComplete="off" disabled={status === 'pending'} aria-invalid={categoryError ? true : undefined} aria-describedby={categoryError ? 'request-category-error' : undefined} value={category} onChange={event => { setCategory(event.target.value as RequestCategoryId); setCategoryError(''); clearSubmitError(); }}>{requestCategories.map(option => <option key={option.id} value={option.id}>{option.title}</option>)}</select>{categoryError ? <p id="request-category-error" className="request-field-error" role="alert">{categoryError}</p> : null}</div>
        </div>
        <button type="submit" className="button button-dark request-submit" disabled={status === 'pending'}>{status === 'pending' ? <><span className="request-spinner" aria-hidden="true"/>Надсилаємо…</> : 'Надіслати заявку'}</button>
        {submitError ? <p className="request-status" role="alert">{submitError}{status === 'error' && !submitError.startsWith('Забагато') ? <> <a href={clinic.phoneHref}>{clinic.phone}</a>.</> : null}</p> : null}
      </form>}
    </div>
  </dialog>;
}

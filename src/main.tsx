import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { clinic, questions, services } from './content';
import { HeroVideo } from './HeroVideo';
import './styles.css';

type IconName = 'arrow' | 'phone' | 'pin' | 'plus' | 'instagram' | 'tooth' | 'implant' | 'spark' | 'align' | 'cross';
function Icon({ name, className = '' }: { name: IconName | string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    phone: <path d="m8 3 3 5-3 3c1.5 2.5 3.5 4.5 6 6l3-3 4 3c-1 4-3 5-6 3C8 17 4 13 3 7c0-2 2-4 5-4Z" />,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17 7h.01"/></>,
    tooth: <path d="M12 4c-4-3-9-1-9 4 0 4 3 13 5 13 2 0 1-7 4-7s2 7 4 7c2 0 5-9 5-13 0-5-5-7-9-4Z"/>,
    implant: <><path d="M7 10h10l-2-7H9l-2 7ZM9 13h6l-1 8h-4l-1-8ZM8 15h8M9 18h6"/></>,
    spark: <><path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3ZM20 2v4M18 4h4"/></>,
    align: <><path d="M3 7c6-4 12-4 18 0M3 17c6 4 12 4 18 0M3 12h18"/><rect x="6" y="9" width="4" height="6" rx="1"/><rect x="14" y="9" width="4" height="6" rx="1"/></>,
    cross: <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z"/>,
  };
  return <svg className={`icon ${className}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.tooth}</svg>;
}

function Brand() {
  return <a className="brand" href="#top" aria-label="DVT Denta — на початок"><img src="./images/logo.webp" width="120" height="48" alt="DVT — стоматологія"/></a>;
}

function SectionHeading({ label, title, children }: { label: string; title: React.ReactNode; children?: React.ReactNode }) {
  return <div className="section-heading"><div><p className="eyebrow">{label}</p><h2>{title}</h2></div>{children}</div>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  return <header className="header" onKeyDown={e => { if (e.key === 'Escape' && open) { setOpen(false); menuButton.current?.focus(); } }}><div className="wrap header-inner">
    <Brand/>
    <nav className="desktop-nav" aria-label="Основна навігація"><a href="#services">Послуги</a><a href="#clinic">Клініка</a><a href="#questions">Запитання</a><a href="#contacts">Контакти</a></nav>
    <a className="header-call" href={clinic.phoneHref} aria-label={`Зателефонувати ${clinic.phone}`}><Icon name="phone"/><span>{clinic.phone}</span></a>
    <button ref={menuButton} className="menu-button" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Закрити меню' : 'Відкрити меню'} onClick={() => setOpen(!open)}><span>{open ? 'Закрити' : 'Меню'}</span><span aria-hidden="true">{open ? '×' : '☰'}</span></button>
  </div>
  {open ? <nav id="mobile-menu" className="mobile-nav wrap" aria-label="Мобільна навігація" onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); menuButton.current?.focus(); } }}>
    {[['services', 'Послуги'], ['clinic', 'Клініка'], ['questions', 'Запитання'], ['contacts', 'Контакти']].map(([id, title]) => <a href={`#${id}`} key={id} onClick={() => setOpen(false)}>{title}<Icon name="arrow"/></a>)}
  </nav> : null}</header>;
}

function Hero() {
  return <section className="hero wrap" aria-labelledby="hero-title">
    <div className="hero-stage">
      <HeroVideo/>
      <div className="hero-copy"><p className="eyebrow"><span className="status-dot"/> СТОМАТОЛОГІЯ В ІВАНО-ФРАНКІВСЬКУ</p>
        <h1 id="hero-title">Здорові зуби.<br/><span>Впевнена</span><br/>усмішка.</h1>
        <p className="hero-description">Лікування й відновлення зубів, корекція прикусу. DVT Denta на Довженка, 31.</p>
        <div className="hero-actions"><a className="button button-dark" href="#contacts">Обговорити візит<Icon name="arrow"/></a><a className="text-link" href="#services">Обрати послугу<span aria-hidden="true">↗</span></a></div>
        <div className="hero-foot"><Icon name="pin"/><span>Івано-Франківськ<br/><strong>{clinic.address}</strong></span></div>
      </div>
    </div>
  </section>;
}

function Services() {
  function selectService(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set('service', id);
    url.hash = 'request';
    window.history.pushState(null, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
    const target = document.getElementById('request');
    target?.scrollIntoView();
    target?.focus({ preventScroll: true });
  }
  return <section id="services" className="wrap section services">
    <SectionHeading label="01 / НАПРЯМИ ЛІКУВАННЯ" title={<>Для здоров’я.<br/><span className="muted-title">Для вашої усмішки.</span></>}><p className="section-description">Знайдіть напрям, який відповідає вашій потребі. Конкретний план лікування визначає лікар після огляду.</p></SectionHeading>
    <div className="services-grid">{services.map(service => <article className="service-card" key={service.id}>
      <div className="service-top"><span>{service.number} / {service.tag}</span><Icon name={service.icon}/></div><h3>{service.title}</h3><p>{service.description}</p>
      <details><summary>Про напрям<Icon name="plus"/></summary><div className="service-detail"><p>{service.detail}</p><a className="text-link" href={`?service=${service.id}#request`} onClick={event => selectService(event, service.id)}>Підготувати запит<Icon name="arrow"/></a></div></details>
    </article>)}
    <article className="service-help"><span className="eyebrow">ПОЧНІМО ЗІ ЗНАЙОМСТВА</span><h3>Почніть<br/>з огляду</h3><p>Розкажіть, що вас турбує.<br/>Уточніть наступний крок у клініки.</p><a className="button button-dark" href={clinic.phoneHref}>Зателефонувати<Icon name="phone"/></a></article></div>
  </section>;
}

function Clinic() {
  return <section id="clinic" className="clinic-section section"><div className="wrap clinic-layout">
    <div className="clinic-photos"><img className="clinic-main-photo" src="./images/team.webp" width="360" height="640" loading="lazy" alt="Команда на фото з Instagram DVT Denta"/><div className="clinic-photo-caption"><span>DVT DENTA / ЗНАЙОМСТВО</span><a href={clinic.instagram} target="_blank" rel="noreferrer" aria-label="Instagram DVT Denta, у новій вкладці"><Icon name="instagram"/></a></div></div>
    <div className="clinic-copy"><p className="eyebrow">02 / БЛИЖЧЕ ДО ВАС</p><h2>Знайома клініка.<br/><span className="muted-title">Особиста розмова.</span></h2><p className="clinic-lead">Почніть із того, що важливо саме вам. Розкажіть про свої побажання до лікування.</p><p>Збереження зуба, відновлення усмішки чи корекція прикусу: обговоріть свою мету та можливі варіанти на прийомі.</p>
    <div className="clinic-points"><div><span>01</span><p>Озвучте побажання<br/><strong>і те, що вас непокоїть</strong></p></div><div><span>02</span><p>Обговоріть план<br/><strong>й вартість до початку</strong></p></div><div><span>03</span><p>Уточніть етапи<br/><strong>та подальший догляд</strong></p></div></div>
    <a className="text-link" href={clinic.instagram} target="_blank" rel="noreferrer">Більше про DVT в Instagram<Icon name="arrow"/></a></div>
  </div></section>;
}

function RequestBuilder() {
  const initial = new URLSearchParams(window.location.search).get('service') ?? '';
  const [selected, setSelected] = useState(services.some(s => s.id === initial) ? initial : '');
  const [copyState, setCopyState] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const topic = services.find(s => s.id === selected)?.title;
  const message = `Добрий день! ${topic ? `Хочу обговорити послугу «${topic}».` : 'Хочу узгодити огляд у DVT Denta.'} Підкажіть, будь ласка, доступний час і вартість першого прийому.`;
  useEffect(() => {
    const onPop = () => { const id = new URLSearchParams(window.location.search).get('service') ?? ''; setSelected(services.some(s => s.id === id) ? id : ''); setCopyState('idle'); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  function updateService(value: string) {
    setSelected(value); setCopyState('idle');
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('service', value); else url.searchParams.delete('service');
    window.history.pushState(null, '', url);
  }
  async function copyMessage() {
    setCopyState('pending');
    try { await navigator.clipboard.writeText(message); setCopyState('success'); }
    catch { setCopyState('error'); messageRef.current?.focus(); messageRef.current?.select(); }
  }
  return <section id="request" tabIndex={-1} className="wrap section request-section"><div className="request-card">
    <div><p className="eyebrow">03 / ВАШ НАСТУПНИЙ КРОК</p><h2>Підготуйте запит<br/>до першого<br/><span className="muted-title">візиту.</span></h2><p className="section-description">Оберіть тему та скопіюйте запит для Instagram. Надішліть його самостійно, коли будете готові.</p><a className="text-link" href={clinic.phoneHref}>Або зателефонуйте {clinic.phone}<Icon name="phone"/></a></div>
    <div className="message-builder"><label htmlFor="service">Про що хочете поговорити?</label><select id="service" name="service" value={selected} onChange={e => updateService(e.target.value)}><option value="">Хочу почати з огляду</option>{services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select><label htmlFor="message">Ваш текст для звернення</label><textarea ref={messageRef} id="message" name="message" value={message} readOnly rows={5} aria-describedby="copy-feedback"/><button type="button" className="button button-dark" onClick={copyMessage} disabled={copyState === 'pending'}>{copyState === 'pending' ? 'Копіюємо…' : copyState === 'success' ? 'Текст скопійовано' : 'Скопіювати текст'}<Icon name="arrow"/></button><p id="copy-feedback" className="copy-feedback" role="status">{copyState === 'success' ? 'Вставте текст у повідомлення @dvt_denta та надішліть його.' : copyState === 'error' ? 'Не вдалося скопіювати. Текст виділено — скопіюйте його вручну.' : 'Копіювання зберігає текст у буфері. Запит ще не надіслано.'}</p><a className="text-link" href={clinic.instagram} target="_blank" rel="noreferrer">Відкрити Instagram<Icon name="instagram"/></a></div>
  </div></section>;
}

function FAQ() {
  return <section id="questions" className="wrap section faq-section"><div><p className="eyebrow">04 / ПЕРЕД ВІЗИТОМ</p><h2>Менше невідомого.<br/><span className="muted-title">Більше ясності.</span></h2><p className="section-description">Відповіді, що допоможуть підготуватися до першого звернення.</p></div><div className="faq-list">{questions.map((q, i) => <details key={q.title}><summary><span className="faq-number">0{i+1}</span><h3>{q.title}</h3><Icon name="plus"/></summary><p>{q.answer}</p></details>)}</div></section>;
}

function Contacts() {
  return <section id="contacts" className="contacts-section"><div className="wrap section"><p className="eyebrow">05 / ДО ЗУСТРІЧІ В DVT DENTA</p><div className="contacts-heading"><h2>Зробіть крок<br/>до своєї <span>усмішки.</span></h2><a className="round-arrow" href={clinic.phoneHref} aria-label={`Зателефонувати ${clinic.phone}`}><Icon name="arrow"/></a></div><div className="contacts-grid"><div><p className="contact-label">ЗАТЕЛЕФОНУЙТЕ</p><a className="contact-phone" href={clinic.phoneHref}>{clinic.phone}</a><p>Узгодьте час і вартість прийому.</p></div><div><p className="contact-label">ЗАВІТАЙТЕ</p><address>{clinic.city}<br/>{clinic.address}</address><a className="text-link" href={clinic.maps} target="_blank" rel="noreferrer">Прокласти маршрут<Icon name="arrow"/></a></div><div><p className="contact-label">НАПИШІТЬ</p><a className="instagram-handle" href={clinic.instagram} target="_blank" rel="noreferrer">@dvt_denta <Icon name="instagram"/></a><p>Час візиту та графік роботи<br/>уточніть під час звернення.</p></div></div></div></section>;
}

function App() {
  return <><a className="skip-link" href="#main">Перейти до вмісту</a><Header/><main id="main" tabIndex={-1}><div id="top"/><Hero/><div className="wrap discipline-strip"><span>ЛІКУВАННЯ</span><span aria-hidden="true">✳</span><span>ВІДНОВЛЕННЯ</span><span aria-hidden="true">✳</span><span>ОРТОДОНТІЯ</span><span aria-hidden="true">✳</span><span>ЕСТЕТИКА УСМІШКИ</span></div><Services/><Clinic/><RequestBuilder/><FAQ/><Contacts/></main><footer className="wrap footer"><Brand/><p>© {new Date().getFullYear()} DVT Denta</p><a href="#top" className="text-link">На початок<span aria-hidden="true">↑</span></a></footer></>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);

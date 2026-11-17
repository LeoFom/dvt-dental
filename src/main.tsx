import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { clinic, questions, services } from './content';
import { HeroVideo } from './HeroVideo';
import { ContactRequestForm } from './ContactRequestForm';
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
      <div className="hero-copy">
        <h1 id="hero-title" className="hero-title">Здорова усмішка</h1>
        <p className="hero-description">Лікуємо й відновлюємо зуби, вирівнюємо прикус. Почніть з огляду та плану лікування.</p>
        <div className="hero-actions"><a className="button button-dark" href="#request">Обговорити візит<Icon name="arrow"/></a><a className="text-link" href="#services">Обрати послугу<span aria-hidden="true">↗</span></a></div>
        <a className="hero-foot" href={clinic.maps} target="_blank" rel="noreferrer" aria-label={`${clinic.city}, ${clinic.address}. Відкрити у Google Maps, у новій вкладці`}><Icon name="pin"/><span>{clinic.city}<br/><strong>{clinic.address}</strong></span><span className="hero-location-arrow" aria-hidden="true">↗</span></a>
      </div>
    </div>
  </section>;
}

function Services() {
  return <section id="services" className="wrap section services" aria-labelledby="services-title">
    <h2 id="services-title">Напрями лікування</h2>
    <div className="services-grid">{services.map(service => <article className="service-card" key={service.id}>
      <div className="service-heading"><Icon name={service.icon}/><h3>{service.title}</h3></div><p>{service.description}</p>
    </article>)}
    <article className="service-help"><h3>Почніть з огляду</h3><a className="button button-dark" href={clinic.phoneHref}>Зателефонувати<Icon name="phone"/></a></article></div>
  </section>;
}

function Clinic() {
  function focusRequest(event: React.MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    document.getElementById('request')?.focus({ preventScroll: true });
  }
  return <section id="clinic" className="clinic-section" aria-labelledby="clinic-title"><div className="wrap clinic-layout">
    <div className="clinic-intro"><h2 id="clinic-title">Перший візит до <span translate="no">DVT Denta</span></h2><p className="clinic-lead">Почніть з огляду. На прийомі обговоріть із лікарем:</p></div>
    <figure className="clinic-photos"><img className="clinic-main-photo" src="./images/team.webp" width="1122" height="1402" loading="lazy" alt="Команда DVT Denta у стоматологічному кабінеті"/></figure>
    <div className="clinic-details"><dl className="clinic-topics" aria-label="Що обговорити на першому огляді">
      <div><dt>Ваш запит</dt><dd>Що вас турбує та що хочеться змінити в усмішці.</dd></div>
      <div><dt>Можливі рішення</dt><dd>Які варіанти лікування можна розглянути у вашій ситуації.</dd></div>
      <div><dt>План і вартість</dt><dd>Які етапи, строки та витрати передбачає лікування.</dd></div>
    </dl><a className="button button-dark" href="#request" onClick={focusRequest}>Залишити заявку<Icon name="arrow"/></a></div>
  </div></section>;
}

function RequestForm() {
  return <section id="request" tabIndex={-1} className="wrap section request-section" aria-labelledby="request-title"><div className="request-card">
    <div className="request-intro"><h2 id="request-title">Обговорімо ваш візит</h2><p className="request-description">Залиште номер телефону, щоб узгодити час прийому та поставити свої запитання.</p></div>
    <ContactRequestForm/>
  </div></section>;
}

function FAQ() {
  return <section id="questions" className="wrap section faq-section" aria-labelledby="questions-title">
    <div className="faq-intro"><h2 id="questions-title">Перед візитом</h2><p className="section-description">Запис, вартість і підготовка до прийому.</p></div>
    <div className="faq-list">{questions.map(q => <details key={q.id} id={`faq-${q.id}`} open={q.id === 'cost'}>
      <summary><h3>{q.title}</h3><span className="faq-toggle" aria-hidden="true"/></summary>
      <div className="faq-answer"><p>{q.answer}</p>{q.action ? <a className="text-link" href={q.action.href}>{q.action.label}<Icon name="arrow"/></a> : null}</div>
    </details>)}</div>
  </section>;
}

function Contacts() {
  return <section id="contacts" className="contacts-section" aria-labelledby="contacts-title"><div className="wrap section contacts-layout">
    <div className="contacts-info"><h2 id="contacts-title">Як нас знайти</h2>
      <address className="contacts-address"><span className="contact-street">{clinic.address}</span><span className="contact-locality">{clinic.mapLocality}</span></address>
      <a className="button contacts-route" href={clinic.directions} target="_blank" rel="noreferrer" aria-label="Прокласти маршрут у Google Maps, у новій вкладці">Прокласти маршрут<Icon name="arrow"/></a>
      <div className="contacts-phone"><p className="contact-label">Телефон</p><a className="contact-phone" href={clinic.phoneHref}>{clinic.phone}</a><p className="contacts-note">Час візиту узгодьте заздалегідь.</p></div>
      <a className="text-link contacts-request" href="#request">Залишити заявку<Icon name="arrow"/></a>
    </div>
    <div className="contacts-map"><div className="contacts-map-frame"><iframe title="Карта: стоматологія DVT на вулиці Олександра Довженка, 31" src={clinic.mapEmbed} width="800" height="500" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/></div><a className="text-link contacts-map-link" href={clinic.maps} target="_blank" rel="noreferrer" aria-label="Відкрити картку DVT у Google Maps, у новій вкладці">Відкрити Google Maps<Icon name="arrow"/></a></div>
  </div></section>;
}

function App() {
  return <><a className="skip-link" href="#main">Перейти до вмісту</a><Header/><main id="main" tabIndex={-1}><div id="top"/><Hero/><div className="wrap discipline-strip"><span>ЛІКУВАННЯ</span><span aria-hidden="true">✳</span><span>ВІДНОВЛЕННЯ</span><span aria-hidden="true">✳</span><span>ОРТОДОНТІЯ</span><span aria-hidden="true">✳</span><span>ЕСТЕТИКА УСМІШКИ</span></div><Services/><Clinic/><RequestForm/><FAQ/><Contacts/></main><footer className="wrap footer"><Brand/><p>© {new Date().getFullYear()} DVT Denta</p><a href="#top" className="text-link">На початок<span aria-hidden="true">↑</span></a></footer></>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);

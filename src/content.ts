export const clinic = {
  name: 'DVT Denta',
  phone: '099 202 21 22',
  phoneHref: 'tel:+380992022122',
  instagram: 'https://www.instagram.com/dvt_denta/',
  address: 'вул. Олександра Довженка, 31',
  city: 'Івано-Франківськ',
  maps: 'https://maps.app.goo.gl/nZCB6XXD6sASKpYA7?g_st=ic',
  mapLocality: 'Крихівці, Івано-Франківська область',
  mapEmbed: 'https://www.google.com/maps/embed?pb=!1m4!3m2!1m1!4s2353964689618784697!6i16!3m1!1suk!5m1!1suk',
  directions: 'https://www.google.com/maps/dir/?api=1&destination=48.9031043%2C24.6841498&destination_place_id=ChIJvcs-dTHBMEcRuVGK0mn2qiA',
};

export const services = [
  { id: 'treatment', title: 'Лікування зубів', description: 'Коли зуб турбує або настав час подбати про його здоров’я.', icon: 'tooth' },
  { id: 'implants', title: 'Імплантація', description: 'Обговоріть можливість відновлення втрачених зубів.', icon: 'implant' },
  { id: 'crowns', title: 'Коронки та вініри', description: 'Відновлення зубів і робота з естетикою усмішки.', icon: 'spark' },
  { id: 'ortho', title: 'Брекети та елайнери', description: 'Варіанти корекції положення зубів і прикусу.', icon: 'align' },
  { id: 'surgery', title: 'Хірургія та видалення', description: 'Звернення щодо видалення зубів і хірургічного лікування.', icon: 'cross' },
];

type Question = { id: string; title: string; answer: string; action?: { href: string; label: string } };

export const questions: Question[] = [
  { id: 'cost', title: 'Скільки коштуватиме лікування?', answer: 'Вартість залежить від обсягу лікування та обраного варіанта. Ціну огляду уточніть під час запису. До початку лікування обговоріть із лікарем повний кошторис і що до нього входить.' },
  { id: 'booking', title: 'Як записатися на прийом?', answer: 'Залиште телефон у формі на сайті. Ми зв’яжемося з вами, щоб узгодити дату й час. Повідомлення «Заявку надіслано» підтверджує отримання звернення; сам запис узгодимо під час розмови.', action: { href: '#request', label: 'Залишити заявку' } },
  { id: 'first-exam', title: 'Не знаю, яку послугу обрати. Як бути?', answer: 'Почніть з огляду. Під час запису розкажіть, що вас турбує або що хочеться змінити в усмішці. Це допоможе узгодити, до якого спеціаліста звернутися.' },
  { id: 'preparation', title: 'Що взяти на перший прийом?', answer: 'За наявності — попередні знімки та план лікування. Чи потрібна додаткова підготовка саме до вашого прийому, уточніть під час запису.' },
];

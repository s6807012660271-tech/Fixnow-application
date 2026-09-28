/* =========================================================================
   FixNow — app.js  (แก้บั๊กครบชุด)
   ========================================================================= */
'use strict';

/* ===================== HELPERS ===================== */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const baht  = (n) => '฿' + Math.round(Number(n) || 0).toLocaleString('th-TH');
const num   = (n) => (Number(n) || 0).toLocaleString('th-TH');
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const esc   = (s) => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

const warn = (sel) => console.warn('[FixNow] ไม่พบ element:', sel);
function on(sel, evt, fn){ const el = $(sel); el ? el.addEventListener(evt, fn) : warn(sel); }
function setText(sel, v){ const el = $(sel); if (el) el.textContent = v; else warn(sel); }
function setHTML(sel, v){ const el = $(sel); if (el) el.innerHTML = v; else warn(sel); }
function setHidden(sel, v){ const el = $(sel); if (el) el.hidden = !!v; else warn(sel); }
function safe(label, fn){
  try { fn(); } catch (err) { console.error('[FixNow] render error @' + label, err); }
}
const initialOf  = (s) => ([...String(s || '').trim()][0] || 'U').toUpperCase();
/* FIX: เดิมใช้ name.charAt(4) ตัดชื่อช่างแบบ hard-code → เปราะมาก */
const techAvatar = (s) => [...String(s || '').replace(/^ช่าง/, '').trim()][0] || 'ช';

function toast(msg){
  const t = $('#toast');
  if (!t) return console.info('[FixNow]', msg);
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ===================== DATA ===================== */
const SERVICES = [
  { id:'fridge', icon:'🧊', name:'ตู้เย็น',       rate:600  },
  { id:'ac',     icon:'❄️', name:'แอร์',          rate:700 },
  { id:'washer', icon:'🌀', name:'เครื่องซักผ้า', rate:550  },
  { id:'plumb',  icon:'🚰', name:'ซิงค์/ท่อ',     rate:450  },
  { id:'kettle', icon:'🫖', name:'กาต้มน้ำ',      rate:250  },
  { id:'tv',     icon:'📺', name:'ทีวี/จอ',       rate:600 },
  { id:'micro',  icon:'🍲', name:'ไมโครเวฟ',      rate:400  },
  { id:'fan',    icon:'💨', name:'พัดลม/ดูดควัน', rate:350  },
  { id:'elec',   icon:'⚡', name:'ไฟฟ้าบ้าน',     rate:500  },
];
const SEVERITY = [
  { id:'minor',    name:'เล็กน้อย', mult:1.0  },
  { id:'moderate', name:'ปานกลาง', mult:1.30 },
  { id:'severe',   name:'รุนแรง',  mult:1.50  },
];
const FEES  = { inspection:200, urgent:.15, afterHours:.20, memberDiscount:.10, pointsPerBaht:20 };
const TECHS = [
  { name:'ช่างต้น', rating:4.9, jobs:412, skill:'แอร์ / ตู้เย็น' },
  { name:'ช่างบอย', rating:4.8, jobs:287, skill:'เครื่องซักผ้า / ไฟฟ้า' },
  { name:'ช่างเอก', rating:4.7, jobs:198, skill:'ประปา / ท่อตัน' },
];
const REWARDS = [
  { id:'d100', name:'ส่วนลด 100 บาท',        cost:200, note:'ใช้ได้กับงานซ่อมทุกประเภท' },
  { id:'d300', name:'ส่วนลด 300 บาท',        cost:550, note:'ขั้นต่ำ 1,000 บาท' },
  { id:'acw',  name:'ล้างแอร์ฟรี 1 เครื่อง', cost:900, note:'แอร์ผนังไม่เกิน 18,000 BTU' },
];
const TIERS = [
  { name:'Bronze',   min:0,  fee:10, bonus:'—' },
  { name:'Silver',   min:200, fee:8,  bonus:'฿400 / ปี' },
  { name:'Gold',     min:500, fee:6,  bonus:'฿1,500 / ปี' },
  { name:'Platinum', min:1000, fee:5,  bonus:'฿3,500 / ปี + ประกันอุบัติเหตุ' },
];
const TRACK_STEPS = ['ช่างรับงาน','ช่างกำลังเดินทาง','ตรวจเช็ค / ประเมินราคา','กำลังซ่อม','ปิดงาน / ชำระเงิน'];
const TABS = {
  customer:[ {id:'home',icon:'🏠',label:'หน้าแรก'}, {id:'book',icon:'🛠️',label:'จองช่าง'},
             {id:'track',icon:'📍',label:'ติดตาม'}, {id:'review',icon:'⭐',label:'รีวิว'},
             {id:'rewards',icon:'🎁',label:'รางวัล'} ],
  tech:[ {id:'jobs',icon:'📋',label:'งานของฉัน'}, {id:'partner',icon:'🏅',label:'Partner'} ],
};
const INCOMING = [
  { id:1, name:'ซ่อมแอร์ไม่เย็น',      area:'ลาดพร้าว 71', sev:'ปานกลาง', price:1100 },
  { id:2, name:'เครื่องซักผ้าไม่ปั่น', area:'รัชดา 32',    sev:'รุนแรง',  price:1350 },
  { id:3, name:'ท่อซิงค์ตัน',          area:'พระราม 9',    sev:'เล็กน้อย', price:650  },
];
/* j.status = จำนวนขั้นที่ทำไปแล้ว (0–3) */
const JOB_ACTIONS  = ['ถึงหน้างาน','เริ่มซ่อม','ปิดงาน'];
const JOB_STATUSES = ['รอเดินทาง','ถึงหน้างานแล้ว','กำลังซ่อม','✅ เสร็จสิ้น'];

/* ===================== STORAGE (FIX #4/#5) ===================== */
const LS = { users:'fixnow_users', session:'fixnow_session', state:'fixnow_state:' };

function readJSON(key, fallback){
  try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
  catch (e){ console.warn('[FixNow] อ่าน localStorage ไม่สำเร็จ:', key, e); return fallback; }
}
function writeJSON(key, val){
  try {
    if (val === null || val === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(val));
  } catch (e){ console.warn('[FixNow] เขียน localStorage ไม่สำเร็จ:', key, e); }
}
const store = {
  get users(){ const v = readJSON(LS.users, []); return Array.isArray(v) ? v : []; },
  set users(v){ writeJSON(LS.users, v); },
  get session(){ return readJSON(LS.session, null); },
  set session(v){ writeJSON(LS.session, v); },
};

function clearPreviousSession(){
  try {
    localStorage.removeItem(LS.users);
    localStorage.removeItem(LS.session);
    Object.keys(localStorage)
      .filter(key => key.startsWith(LS.state))
      .forEach(key => localStorage.removeItem(key));
  } catch (e){ console.warn('[FixNow] ล้าง session เดิมไม่สำเร็จ:', e); }
}

/* ===================== STATE ===================== */
const DEFAULT_STATE = {
  mode:'customer', tab:'home',
  job:'ac', sev:'moderate', isPlus:false, points:340,
  hours:1, parts:0, urgent:false, afterHours:false, desc:'',
  rating:0, trackStep:-1, currentJob:null,
  techMonthlyJobs:26, acceptedJobs:[],
};
let state = { user:null, ...structuredCloneSafe(DEFAULT_STATE) };

function structuredCloneSafe(o){ return JSON.parse(JSON.stringify(o)); }
const stateKey = () => LS.state + (state.user?.email || state.user?.phone || 'guest');

function saveState(){
  if (!state.user) return;
  const { user, ...rest } = state;
  writeJSON(stateKey(), rest);
}
function loadState(){
  const saved = readJSON(stateKey(), null);
  state = { ...structuredCloneSafe(DEFAULT_STATE), ...(saved && typeof saved === 'object' ? saved : {}), user: state.user };
  /* sanitize — กัน data เก่า/เพี้ยนทำให้ render ตาย */
  if (!TABS[state.mode]) state.mode = 'customer';
  if (!TABS[state.mode].some(t => t.id === state.tab)) state.tab = TABS[state.mode][0].id;
  if (!SERVICES.some(s => s.id === state.job)) state.job = SERVICES[0].id;
  if (!SEVERITY.some(s => s.id === state.sev)) state.sev = SEVERITY[1].id;
  if (!Array.isArray(state.acceptedJobs)) state.acceptedJobs = [];
  state.acceptedJobs = state.acceptedJobs.filter(j => j && typeof j.id === 'number');
  state.points = Math.max(0, Number(state.points) || 0);
  state.techMonthlyJobs = Math.max(0, Number(state.techMonthlyJobs) || 0);
  state.trackStep = clamp(Number(state.trackStep ?? -1), -1, TRACK_STEPS.length - 1);
}

/* ===================== AUTH UI ===================== */
function initAuthUI(){
  $$('#authTabs .seg-btn').forEach(b => b.addEventListener('click', () => {
    $$('#authTabs .seg-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    const isLogin = b.dataset.auth === 'login';
    setHidden('#loginForm',  !isLogin);
    setHidden('#signupForm',  isLogin);
  }));

  $$('#roleChips .chip').forEach(c => c.addEventListener('click', () => {
    $$('#roleChips .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
  }));

  /* FIX #2/#3: ผูก handler ที่เดียว ไม่มี stub ว่างซ้ำอีกแล้ว */
  on('#loginForm',  'submit', handleLogin);
  on('#signupForm', 'submit', handleSignup);
  on('#demoBtn',    'click',  () => login(
    { name:'คุณ DEMO', email:'demo@fixnow.app', phone:'0812345678', role:'customer' }, false));
  on('#forgotBtn',  'click',  () => toast('ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว (เดโม)'));
}

const normPhone = (s) => String(s || '').replace(/[-\s()]/g, '');
const normMail  = (s) => String(s || '').trim().toLowerCase();

function handleLogin(e){
  e.preventDefault();
  const err  = $('#loginErr'); if (err) err.textContent = '';
  const fail = (m) => { if (err) err.textContent = m; };

  const id = ($('#loginId')?.value || '').trim();
  const pw = $('#loginPw')?.value || '';
  if (!id || !pw) return fail('กรุณากรอกข้อมูลให้ครบถ้วน');

  /* FIX #9: เทียบอีเมลแบบ case-insensitive และเบอร์แบบตัดขีด/ช่องว่าง */
  const mail = normMail(id), phone = normPhone(id);
  const u = store.users.find(x =>
    (normMail(x.email) === mail || (phone && normPhone(x.phone) === phone)) && x.password === pw);
  if (!u) return fail('อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง');

  login(u, false);
}

function handleSignup(e){
  e.preventDefault();
  const err  = $('#suErr'); if (err) err.textContent = '';
  const fail = (m) => { if (err) err.textContent = m; };

  const u = {
    name    : ($('#suName')?.value  || '').trim(),
    email   : normMail($('#suEmail')?.value),
    phone   : ($('#suPhone')?.value || '').trim(),
    password: $('#suPw')?.value || '',
    role    : $('#roleChips .chip.active')?.dataset.role || 'customer',
  };
  if (!u.name || !u.email || !u.phone || !u.password) return fail('กรุณากรอกข้อมูลให้ครบถ้วน');
  if (!/^\S+@\S+\.\S+$/.test(u.email))                return fail('รูปแบบอีเมลไม่ถูกต้อง');
  if (!/^0\d{8,9}$/.test(normPhone(u.phone)))         return fail('เบอร์โทรไม่ถูกต้อง (ขึ้นต้น 0 และมี 9–10 หลัก)');
  if (u.password.length < 6)                          return fail('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
  if (u.password !== ($('#suPw2')?.value || ''))      return fail('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
  if (!$('#suAgree')?.checked)                        return fail('กรุณายอมรับเงื่อนไขการใช้งาน');

  const users = store.users;
  if (users.some(x => normMail(x.email) === u.email))        return fail('อีเมลนี้ถูกใช้ไปแล้ว');
  if (users.some(x => normPhone(x.phone) === normPhone(u.phone))) return fail('เบอร์โทรนี้ถูกใช้ไปแล้ว');

  store.users = [...users, u];     // ✅ สมัครแล้วจำไว้จริง
  toast('สมัครสมาชิกสำเร็จ 🎉');
  login(u, true);
}

function login(user, remember = true){
  if (!user) return;
  const u = { name:'ผู้ใช้', role:'customer', email:'', phone:'', ...user };
  delete u.password;                       // FIX #5: ไม่เก็บรหัสผ่านลง session

  state.user = u;
  state.mode = u.role === 'tech' ? 'tech' : 'customer';
  state.tab  = state.mode === 'tech' ? 'jobs' : 'home';
  loadState();                             // FIX #4: คืนค่าทุกอย่างของ user คนนี้

  store.session = null;

  setHidden('#authScreen', true);
  setHidden('#appScreen',  false);
  setText('#helloName', u.name);
  setText('#userChip',  initialOf(u.name));

  /* 🔴 FIX #1 (บั๊กหลัก): เดิมเป็น $(...) .forEach → TypeError ทำให้ renderAll() ไม่ถูกเรียก */
  $$('#modeSwitch .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === state.mode));

  renderAll();
  saveState();
}

/* ===================== APP UI BINDINGS ===================== */
function initAppUI(){
  $$('#modeSwitch .seg-btn').forEach(b => b.addEventListener('click', () => {
    $$('#modeSwitch .seg-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    state.mode = TABS[b.dataset.mode] ? b.dataset.mode : 'customer';
    state.tab  = TABS[state.mode][0].id;
    renderTabs(); showView(state.tab); saveState();
  }));

  on('#logoutBtn', 'click', () => {
    store.session = null;        // ล้างแค่ session — ข้อมูลผู้ใช้/แต้มยังอยู่
    location.reload();
  });

  on('#userChip', 'click', () => {
    const u = state.user;
    toast(u ? `${u.name} · ${u.role === 'tech' ? 'บัญชีช่าง' : 'บัญชีผู้ใช้'}` : 'ยังไม่ได้เข้าสู่ระบบ');
  });

  on('#togglePlus', 'click', () => {
    state.isPlus = !state.isPlus;
    setText('#togglePlus', state.isPlus ? '✓ เป็นสมาชิก FixNow+ แล้ว' : 'เปิดใช้งาน FixNow+');
    toast(state.isPlus ? 'เปิดใช้งาน FixNow+ เรียบร้อย' : 'ยกเลิก FixNow+ แล้ว');
    safe('quote', calcQuote); saveState();
  });

  on('#confirmBtn', 'click', confirmBooking);
  on('#sendReview', 'click', sendReview);

  /* FIX #7: listener เดียวจบ + ฟังทั้ง input และ change (checkbox) */
  const QUOTE_SEL = '#hours, #parts, #urgent, #afterHours';
  const onQuoteChange = (e) => { if (e.target.matches?.(QUOTE_SEL)) { safe('quote', calcQuote); saveState(); } };
  document.addEventListener('input',  onQuoteChange);
  document.addEventListener('change', onQuoteChange);
  on('#desc', 'input', (e) => { state.desc = e.target.value; saveState(); });

  /* tooltip (i) */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.info');
    $$('.info.open').forEach(i => { if (i !== btn) i.classList.remove('open'); });
    if (btn){ e.preventDefault(); e.stopPropagation(); btn.classList.toggle('open'); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $$('.info.open').forEach(i => i.classList.remove('open'));
  });

  window.addEventListener('beforeunload', saveState);
}

/* ===================== NAV ===================== */
function renderTabs(){
  const bar = $('#tabbar'); if (!bar) return warn('#tabbar');
  bar.innerHTML = (TABS[state.mode] || TABS.customer).map(t =>
    `<button type="button" class="tab ${t.id === state.tab ? 'active' : ''}" data-tab="${t.id}">
       <b>${t.icon}</b>${esc(t.label)}</button>`).join('');
  $$('.tab', bar).forEach(t => t.addEventListener('click', () => showView(t.dataset.tab)));
}
function showView(id){
  state.tab = id;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + id));
  $$('#tabbar .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
  /* FIX #10: ตัวที่เลื่อนจริงคือ .main ไม่ใช่ window */
  $('#mainScroll')?.scrollTo({ top:0, behavior:'smooth' });
  saveState();
}

/* ===================== RENDER: CUSTOMER ===================== */
function renderHome(){
  setText('#homePoints', num(state.points));
  /* FIX #8: sync ข้อความปุ่ม FixNow+ กับ state ที่กู้คืนมา */
  setText('#togglePlus', state.isPlus ? '✓ เป็นสมาชิก FixNow+ แล้ว' : 'เปิดใช้งาน FixNow+');

  const grid = $('#serviceGrid'); if (!grid) return warn('#serviceGrid');
  grid.innerHTML = SERVICES.map(s =>
    `<button class="service" type="button" data-job="${s.id}">
       <span>${s.icon}</span>${esc(s.name)}<b>${baht(s.rate)}</b>
     </button>`).join('');
  $$('.service', grid).forEach(el => el.addEventListener('click', () => {
    state.job = el.dataset.job; renderBook(); showView('book');
  }));

  setHTML('#priceTable', SERVICES.map(s =>
    `<tr><td>${s.icon} ${esc(s.name)}</td>${
      SEVERITY.map(v => `<td>${baht(s.rate * v.mult)}</td>`).join('')}</tr>`).join(''));
}

function renderBook(){
  const jobBox = $('#jobChips'), sevBox = $('#sevChips');
  if (!jobBox || !sevBox) return warn('#jobChips / #sevChips');

  jobBox.innerHTML = SERVICES.map(s =>
    `<button type="button" class="chip ${s.id === state.job ? 'active' : ''}" data-job="${s.id}">${s.icon} ${esc(s.name)}</button>`).join('');
  sevBox.innerHTML = SEVERITY.map(v =>
    `<button type="button" class="chip ${v.id === state.sev ? 'active' : ''}" data-sev="${v.id}">${esc(v.name)}<small>x${v.mult}</small></button>`).join('');

  $$('.chip', jobBox).forEach(c => c.addEventListener('click', () => { state.job = c.dataset.job; renderBook(); saveState(); }));
  $$('.chip', sevBox).forEach(c => c.addEventListener('click', () => { state.sev = c.dataset.sev; renderBook(); saveState(); }));

  /* คืนค่าฟอร์มจาก state (จำของเดิมไว้ให้) */
  const h = $('#hours'); if (h) h.value = state.hours;
  const p = $('#parts'); if (p) p.value = state.parts;
  const u = $('#urgent'); if (u) u.checked = !!state.urgent;
  const a = $('#afterHours'); if (a) a.checked = !!state.afterHours;
  const d = $('#desc'); if (d) d.value = state.desc || '';

  calcQuote();
}

function calcQuote(){
  const svc = SERVICES.find(s => s.id === state.job) || SERVICES[0];
  const sev = SEVERITY.find(s => s.id === state.sev) || SEVERITY[0];
  state.job = svc.id; state.sev = sev.id;

  const hrs   = clamp(parseFloat($('#hours')?.value) || 1, 1, 8);
  const parts = Math.max(0, parseFloat($('#parts')?.value) || 0);
  state.hours = hrs; state.parts = parts;
  state.urgent     = !!$('#urgent')?.checked;
  state.afterHours = !!$('#afterHours')?.checked;

  const labor      = svc.rate * hrs * sev.mult;
  const inspection = state.isPlus ? 0 : FEES.inspection;
  const base       = labor + parts;
  const urgent     = state.urgent     ? base * FEES.urgent     : 0;
  const after      = state.afterHours ? base * FEES.afterHours : 0;
  const discount   = state.isPlus ? (labor + urgent + after) * FEES.memberDiscount : 0;
  const total      = Math.max(0, base + inspection + urgent + after - discount);

  const rows = [
    [`ค่าแรง ${svc.name} (${hrs} ชม. × ${sev.name} x${sev.mult})`, labor],
    ['ค่าอะไหล่', parts],
    [state.isPlus ? 'ค่าตรวจเช็คหน้างาน (FixNow+ ฟรี)' : 'ค่าตรวจเช็คหน้างาน', inspection],
  ];
  if (urgent) rows.push(['ค่าบริการเร่งด่วน (+20%)', urgent]);
  if (after)  rows.push(['ค่าบริการนอกเวลา (+30%)', after]);

  setHTML('#quoteList',
    rows.map(([l, v]) => `<li><span>${esc(l)}</span><span>${baht(v)}</span></li>`).join('') +
    (discount ? `<li class="discount"><span>ส่วนลดสมาชิก FixNow+ (10%)</span><span>-${baht(discount)}</span></li>` : ''));
  setText('#quoteTotal', baht(total));
  setText('#quotePoints', `รับ ${Math.floor(total / FEES.pointsPerBaht)} แต้ม เมื่อชำระเงินสำเร็จ`);
  return { svc, sev, total };
}

function confirmBooking(){
  const q = calcQuote();
  const earned = Math.floor(q.total / FEES.pointsPerBaht);
  state.points += earned;
  state.currentJob = {
    code : 'FN' + Date.now().toString().slice(-6),
    name : q.svc.name,
    total: q.total,
    desc : state.desc || '',
    tech : TECHS[Math.floor(Math.random() * TECHS.length)],
  };
  state.trackStep = 0;
  renderHome(); renderRewards(); renderTrack();
  toast(`จองสำเร็จ! ได้รับ ${earned} แต้ม`);
  showView('track');
  saveState();
}

function renderTrack(){
  const j = state.currentJob;
  setText('#trackJob',  j ? `ซ่อม${j.name} · ${baht(j.total)}` : 'ยังไม่มีงานที่กำลังดำเนินการ');
  setText('#trackCode', j ? j.code : '—');
  setHTML('#trackSteps', TRACK_STEPS.map((s, i) =>
    `<li class="${i < state.trackStep ? 'done' : i === state.trackStep ? 'now' : ''}">${esc(s)}</li>`).join(''));

  const done = j && state.trackStep >= TRACK_STEPS.length - 1;
  setHTML('#trackTech', j
    ? `<div class="tech" style="flex:1;border:0">
         <div class="ava">${techAvatar(j.tech?.name)}</div>
         <div class="meta"><b>${esc(j.tech?.name)}</b><span>${esc(j.tech?.skill)} · ${num(j.tech?.jobs)} งาน</span></div>
         <div class="rate">★ ${j.tech?.rating}</div>
       </div>
       <button type="button" class="btn btn-ghost sm" id="nextStep">${done ? 'งานเสร็จแล้ว' : 'อัปเดตสถานะ'}</button>`
    : '<p class="muted sm">กดจองช่างเพื่อเริ่มติดตามงาน</p>');

  on('#nextStep', 'click', () => {
    if (state.trackStep < TRACK_STEPS.length - 1){
      state.trackStep++; renderTrack();
      toast(TRACK_STEPS[state.trackStep]);
    } else toast('งานนี้เสร็จสมบูรณ์แล้ว ✅ รับประกัน 30 วัน');
    saveState();
  });
}

function renderReview(){
  const box = $('#stars'); if (!box) return warn('#stars');
  box.innerHTML = [1,2,3,4,5].map(n =>
    `<span class="star ${n <= state.rating ? 'on' : ''}" data-n="${n}" role="button" tabindex="0">★</span>`).join('');
  $$('.star', box).forEach(s => s.addEventListener('click', () => {
    state.rating = +s.dataset.n; renderReview(); saveState();
  }));
  setHTML('#techList', TECHS.map(t =>
    `<div class="tech">
       <div class="ava">${techAvatar(t.name)}</div>
       <div class="meta"><b>${esc(t.name)}</b><span>${esc(t.skill)} · ${num(t.jobs)} งาน</span></div>
       <div class="rate">★ ${t.rating}</div>
     </div>`).join(''));
}

function sendReview(){
  if (!state.rating) return toast('กรุณาให้คะแนนก่อนส่งรีวิว');
  toast(`ขอบคุณสำหรับรีวิว ${state.rating} ดาว ⭐`);
  state.rating = 0;
  const t = $('#reviewText'); if (t) t.value = '';
  renderReview(); saveState();
}

function renderRewards(){
  setText('#rewardPoints', num(state.points));
  const box = $('#rewardList'); if (!box) return warn('#rewardList');
  box.innerHTML = REWARDS.map(r =>
    `<div class="reward">
       <div><b>${esc(r.name)}</b><span>${esc(r.note)}</span></div>
       <button type="button" class="btn ${state.points >= r.cost ? 'btn-primary' : 'btn-ghost'} sm"
         data-reward="${r.id}" ${state.points < r.cost ? 'disabled' : ''}>${r.cost} แต้ม</button>
     </div>`).join('');
  $$('[data-reward]', box).forEach(b => b.addEventListener('click', () => {
    const r = REWARDS.find(x => x.id === b.dataset.reward);
    if (!r || state.points < r.cost) return toast('แต้มไม่พอสำหรับรางวัลนี้');
    state.points -= r.cost;
    renderRewards(); renderHome();
    toast(`แลก "${r.name}" สำเร็จ 🎁`);
    saveState();
  }));
}

/* ===================== RENDER: TECHNICIAN (FIX #6) ===================== */
function tierOf(n){ return [...TIERS].reverse().find(t => n >= t.min) || TIERS[0]; }

function renderJobs(){
  const fee  = tierOf(state.techMonthlyJobs).fee;
  const open = INCOMING.filter(j => !state.acceptedJobs.some(a => a.id === j.id));

  const inbox = $('#incomingJobs'); if (!inbox) return warn('#incomingJobs');
  inbox.innerHTML = open.length ? open.map(j =>
    `<div class="job">
       <div class="job-top"><b>${esc(j.name)}</b><span class="job-price">${baht(j.price)}</span></div>
       <p>📍 ${esc(j.area)} · ความรุนแรง: ${esc(j.sev)} · รายได้สุทธิ ${baht(j.price * (1 - fee / 100))} (หัก ${fee}%)</p>
       <div class="job-actions"><button type="button" class="btn btn-primary sm" data-accept="${j.id}">รับงาน</button></div>
     </div>`).join('') : '<p class="muted sm">ยังไม่มีงานเข้าใหม่ในขณะนี้</p>';

  $$('[data-accept]', inbox).forEach(b => b.addEventListener('click', () => {
    const j = INCOMING.find(x => x.id === +b.dataset.accept);
    if (!j || state.acceptedJobs.some(a => a.id === j.id)) return;
    state.acceptedJobs.push({ ...j, status:0 });
    renderJobs(); renderPartner();
    toast(`รับงาน "${j.name}" แล้ว`);
    saveState();
  }));

  const mine = $('#myJobs'); if (!mine) return warn('#myJobs');
  mine.innerHTML = state.acceptedJobs.length ? state.acceptedJobs.map(j => {
    const finished = j.status >= JOB_ACTIONS.length;
    return `<div class="job ${finished ? 'done' : ''}">
       <div class="job-top"><b>${esc(j.name)}</b><span class="job-price">${baht(j.price * (1 - fee / 100))}</span></div>
       <p>📍 ${esc(j.area)} · สถานะ: ${esc(JOB_STATUSES[j.status] || JOB_STATUSES[0])}</p>
       ${finished ? '' :
         `<div class="job-actions">
            <button type="button" class="btn btn-ghost sm" data-step="${j.id}">${esc(JOB_ACTIONS[j.status])}</button>
          </div>`}
     </div>`;
  }).join('') : '<p class="muted sm">ยังไม่มีงานที่รับ</p>';

  $$('[data-step]', mine).forEach(b => b.addEventListener('click', () => {
    const j = state.acceptedJobs.find(x => x.id === +b.dataset.step);
    if (!j || j.status >= JOB_ACTIONS.length) return;
    const action = JOB_ACTIONS[j.status];
    j.status++;
    /* นับเป็นงานสำเร็จของเดือนตอน "ปิดงาน" เท่านั้น → Tier ขยับถูกต้อง */
    if (j.status >= JOB_ACTIONS.length) state.techMonthlyJobs++;
    renderJobs(); renderPartner();               // ✅ เดิมลืมเรียก renderPartner()
    toast(`${j.name} → ${action}`);
    saveState();
  }));
}

function renderPartner(){
  const n    = state.techMonthlyJobs;
  const cur  = tierOf(n);
  const next = TIERS[TIERS.indexOf(cur) + 1];

  setText('#tierName', cur.name);
  setText('#tierFee',  `ค่าธรรมเนียม ${cur.fee}% · ${n} งานเดือนนี้`);

  const bar = $('#tierBar');
  if (bar){
    const span = next ? Math.max(1, next.min - cur.min) : 1;   // กันหารด้วย 0
    bar.style.width = next ? clamp((n - cur.min) / span * 100, 0, 100) + '%' : '100%';
  }
  setText('#tierHint', next
    ? `อีก ${Math.max(0, next.min - n)} งาน เลื่อนเป็น ${next.name} (ค่าธรรมเนียมเหลือ ${next.fee}%)`
    : 'คุณอยู่ระดับสูงสุดแล้ว 🏆');

  setHTML('#tierTable', TIERS.map(t =>
    `<tr style="${t.name === cur.name ? 'background:#eff6ff;font-weight:600' : ''}">
       <td>${t.name}</td><td>${t.min}+</td><td>${t.fee}%</td><td>${esc(t.bonus)}</td></tr>`).join(''));

  setHTML('#missions', [
    'รับงานครบ 5 งานในสัปดาห์นี้ → โบนัส ฿300',
    'รักษาคะแนนรีวิว 4.8+ ตลอดเดือน → โบนัส ฿500',
    'ตอบรับงานภายใน 3 นาที 20 ครั้ง → ปลดล็อกคิวงานพรีเมียม',
  ].map(m => `<li>${esc(m)}</li>`).join(''));
}

/* ===================== INIT ===================== */
function renderAll(){
  safe('tabs',    renderTabs);
  safe('home',    renderHome);
  safe('book',    renderBook);
  safe('track',   renderTrack);
  safe('review',  renderReview);
  safe('rewards', renderRewards);
  safe('jobs',    renderJobs);
  safe('partner', renderPartner);
  showView(state.tab);
}

function validSession(s){
  return !!s && typeof s === 'object' && typeof s.name === 'string' && s.name.trim().length > 0;
}

function showAuth(){
  setHidden('#authScreen', false);
  setHidden('#appScreen',  true);
  safe('preload-tabs', renderTabs);
}

function boot(){
  clearPreviousSession();
  safe('init-auth', initAuthUI);
  safe('init-app',  initAppUI);
  showAuth();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

/* ============================================================
   FixNow — Profile menu + TH/EN language switch
   ============================================================ */
(function () {
  'use strict';
  if (window.__fixnowI18n) return;
  window.__fixnowI18n = true;

  var LANG_KEY = 'fixnow_lang';
  var lang = 'th';
  try { lang = localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'th'; } catch (e) {}

  /* ---------- 1) พจนานุกรม TH -> EN ---------- */
  var DICT = {
    // ---- Auth ----
    'บริการถึงบ้านภายใน 2 ชั่วโมง': 'On-site service within 2 hours',
    'เข้าสู่ระบบ': 'Log in',
    'สมัครสมาชิก': 'Sign up',
    'อีเมล หรือ เบอร์โทร': 'Email or phone',
    'รหัสผ่าน': 'Password',
    'ลืมรหัสผ่าน?': 'Forgot password?',
    'ลองใช้บัญชีทดลอง (Demo)': 'Try a demo account',
    'ชื่อ–นามสกุล': 'Full name',
    'อีเมล': 'Email',
    'เบอร์โทร': 'Phone',
    'อย่างน้อย 6 ตัวอักษร': 'At least 6 characters',
    'ยืนยันรหัสผ่าน': 'Confirm password',
    'ประเภทบัญชี': 'Account type',
    'ผู้ใช้': 'Customer',
    'ช่าง': 'Technician',
    'ยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว': 'I accept the Terms of Use and Privacy Policy',
    'สร้างบัญชี': 'Create account',
    'สมชาย ใจดี': 'John Smith',
    'ออกจากระบบ': 'Log out',
    'บัญชีของฉัน': 'My account',
    'ข้อมูลเพิ่มเติม': 'More info',
    'กรุณาเปิดใช้งาน JavaScript เพื่อใช้ FixNow': 'Please enable JavaScript to use FixNow',

    // ---- Home ----
    'สวัสดี 👋': 'Hello 👋',
    'แต้มสะสม': 'Points',
    'บริการยอดนิยม': 'Popular services',
    'รับประกัน 30 วัน': '30-day warranty',
    'ตารางเปรียบเทียบราคาค่าบริการ': 'Service price comparison',
    'บริการ': 'Service',
    'เล็กน้อย': 'Minor',
    'ปานกลาง': 'Moderate',
    'รุนแรง': 'Severe',
    'FixNow+ สมาชิกรายเดือน': 'FixNow+ Monthly membership',
    'ฟรีค่าตรวจเช็คหน้างาน (ปกติ 250 บาท)': 'Free on-site inspection (normally 250 THB)',
    'ส่วนลดสมาชิก 10% ทุกงานซ่อม': '10% member discount on every repair',
    'คิวจองก่อนใคร ในช่วงงานแน่น': 'Priority booking during busy periods',
    'เปิดใช้งาน FixNow+': 'Activate FixNow+',
    '✓ เป็นสมาชิก FixNow+ แล้ว': '✓ FixNow+ member',
    'เปิดใช้งาน FixNow+ เรียบร้อย': 'FixNow+ activated',
    'ยกเลิก FixNow+ แล้ว': 'FixNow+ cancelled',

    // ---- Services ----
    'ตู้เย็น': 'Refrigerator',
    'แอร์': 'Air conditioner',
    'เครื่องซักผ้า': 'Washing machine',
    'ซิงค์/ท่อ': 'Sink / Pipes',
    'กาต้มน้ำ': 'Kettle',
    'ทีวี/จอ': 'TV / Monitor',
    'ไมโครเวฟ': 'Microwave',
    'พัดลม/ดูดควัน': 'Fan / Range hood',
    'ไฟฟ้าบ้าน': 'Home electrical',

    // ---- Booking ----
    'จองช่าง': 'Book',
    '1. เลือกบริการ': '1. Choose a service',
    '2. ระดับความรุนแรง': '2. Severity level',
    'ชั่วโมงที่คาดว่าใช้': 'Estimated hours',
    'ค่าอะไหล่ (บาท)': 'Parts cost (THB)',
    'งานเร่งด่วน ภายใน 2 ชม. (+20%)': 'Urgent — within 2 hrs (+20%)',
    'นอกเวลาทำการ 20:00–07:00 (+30%)': 'After hours 20:00–07:00 (+30%)',
    'รายละเอียดอาการเสีย': 'Problem description',
    'เช่น แอร์ไม่เย็น มีน้ำหยดจากคอยล์เย็น ใช้งานมา 5 ปี':
      'e.g. AC not cooling, water dripping from the coil, 5 years old',
    '3. สรุปราคา': '3. Price summary',
    'ยอดรวมโดยประมาณ': 'Estimated total',
    'ยืนยันการจอง': 'Confirm booking',
    'ค่าแรง': 'Labour',
    'ค่าอะไหล่': 'Parts',
    'ค่าตรวจเช็คหน้างาน (FixNow+ ฟรี)': 'On-site inspection (free with FixNow+)',
    'ค่าตรวจเช็คหน้างาน': 'On-site inspection fee',
    'ค่าบริการเร่งด่วน (+20%)': 'Urgent surcharge (+20%)',
    'ค่าบริการนอกเวลา (+30%)': 'After-hours surcharge (+30%)',
    'ส่วนลดสมาชิก FixNow+ (10%)': 'FixNow+ member discount (10%)',

    // ---- Track ----
    'ติดตาม': 'Track',
    'ติดตามงาน': 'Track job',
    'ยังไม่มีงานที่กำลังดำเนินการ': 'No job in progress',
    'กดจองช่างเพื่อเริ่มติดตามงาน': 'Book a technician to start tracking',
    'ช่างรับงาน': 'Technician accepted',
    'ช่างกำลังเดินทาง': 'Technician on the way',
    'ตรวจเช็ค / ประเมินราคา': 'Inspection / quotation',
    'กำลังซ่อม': 'Repairing',
    'ปิดงาน / ชำระเงิน': 'Job closed / payment',
    'อัปเดตสถานะ': 'Update status',
    'งานเสร็จแล้ว': 'Job completed',
    'งานนี้เสร็จสมบูรณ์แล้ว ✅ รับประกัน 30 วัน': 'This job is complete ✅ 30-day warranty',

    // ---- Review ----
    'รีวิว': 'Review',
    'รีวิวช่าง': 'Rate your technician',
    'ให้คะแนนงานล่าสุด': 'Rate your latest job',
    'เล่าประสบการณ์ของคุณ...': 'Tell us about your experience...',
    'ส่งรีวิว': 'Submit review',
    'ช่างยอดนิยม': 'Top technicians',
    'กรุณาให้คะแนนก่อนส่งรีวิว': 'Please give a rating first',
    'ช่างต้น': 'Tech Thon',
    'ช่างบอย': 'Tech Boy',
    'ช่างเอก': 'Tech Ake',
    'แอร์ / ตู้เย็น': 'AC / Refrigerator',
    'เครื่องซักผ้า / ไฟฟ้า': 'Washing machine / Electrical',
    'ประปา / ท่อตัน': 'Plumbing / Clogged pipes',

    // ---- Rewards ----
    'รางวัล': 'Rewards',
    'รางวัลของฉัน': 'My rewards',
    'แต้มคงเหลือ': 'Points balance',
    'แลกของรางวัล': 'Redeem rewards',
    'ล้างแอร์ฟรี 1 เครื่อง': 'Free AC cleaning (1 unit)',
    'ใช้ได้กับงานซ่อมทุกประเภท': 'Valid for all repair types',
    'แอร์ผนังไม่เกิน 18,000 BTU': 'Wall-type AC up to 18,000 BTU',
    'แต้มไม่พอสำหรับรางวัลนี้': 'Not enough points for this reward',

    // ---- Tech ----
    'งานของฉัน': 'My jobs',
    'งานเข้าใหม่': 'New incoming jobs',
    'งานที่รับแล้ว': 'Accepted jobs',
    'รับงาน': 'Accept job',
    'ยังไม่มีงานเข้าใหม่ในขณะนี้': 'No new jobs right now',
    'ยังไม่มีงานที่รับ': 'No accepted jobs yet',
    'ถึงหน้างาน': 'Arrived',
    'เริ่มซ่อม': 'Start repair',
    'ปิดงาน': 'Close job',
    'รอเดินทาง': 'Awaiting travel',
    'ถึงหน้างานแล้ว': 'Arrived on site',
    '✅ เสร็จสิ้น': '✅ Completed',
    'ซ่อมแอร์ไม่เย็น': 'AC not cooling',
    'เครื่องซักผ้าไม่ปั่น': 'Washer not spinning',
    'ท่อซิงค์ตัน': 'Clogged sink pipe',

    // ---- Partner ----
    'ระดับของคุณ': 'Your tier',
    'ระดับ': 'Tier',
    'งาน': 'Jobs',
    'ค่าธรรมเนียม': 'Fee',
    'โบนัส': 'Bonus',
    'ภารกิจโบนัส': 'Bonus missions',
    'คุณอยู่ระดับสูงสุดแล้ว 🏆': "You're at the top tier 🏆",
    'รับงานครบ 5 งานในสัปดาห์นี้ → โบนัส ฿300': 'Complete 5 jobs this week → ฿300 bonus',
    'รักษาคะแนนรีวิว 4.8+ ตลอดเดือน → โบนัส ฿500': 'Keep a 4.8+ rating all month → ฿500 bonus',
    'ตอบรับงานภายใน 3 นาที 20 ครั้ง → ปลดล็อกคิวงานพรีเมียม':
      'Accept 20 jobs within 3 minutes → unlock premium job queue',

    // ---- Tabs / misc ----
    'หน้าแรก': 'Home',
    'คุณ DEMO': 'DEMO User',
    'บัญชีช่าง': 'Technician account',
    'บัญชีผู้ใช้': 'Customer account',
    'ยังไม่ได้เข้าสู่ระบบ': 'Not signed in',
    'สมัครสมาชิกสำเร็จ 🎉': 'Account created 🎉',

    // ---- Errors ----
    'กรุณากรอกข้อมูลให้ครบถ้วน': 'Please fill in all fields',
    'รูปแบบอีเมลไม่ถูกต้อง': 'Invalid email format',
    'เบอร์โทรไม่ถูกต้อง (ขึ้นต้น 0 และมี 9–10 หลัก)': 'Invalid phone number (must start with 0, 9–10 digits)',
    'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร': 'Password must be at least 6 characters',
    'รหัสผ่านทั้งสองช่องไม่ตรงกัน': 'Passwords do not match',
    'กรุณายอมรับเงื่อนไขการใช้งาน': 'Please accept the Terms of Use',
    'อีเมลนี้ถูกใช้ไปแล้ว': 'This email is already registered',
    'เบอร์โทรนี้ถูกใช้ไปแล้ว': 'This phone number is already registered',
    'อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง': 'Incorrect email/phone or password',

    // ---- Tooltips ----
    'บัญชีผู้ใช้ = เรียกช่างมาซ่อมที่บ้าน / บัญชีช่าง = รับงานซ่อมและเข้าร่วม Partner Program':
      'Customer account = book technicians to your home / Technician account = accept jobs and join the Partner Program',
    'ทุกการใช้จ่าย 20 บาท = 1 แต้ม นำไปแลกส่วนลดหรือบริการล้างแอร์ฟรีได้':
      'Every 20 THB spent = 1 point, redeemable for discounts or free AC cleaning',
    'งานซ่อมทุกชิ้นรับประกัน 30 วัน หากอาการเดิมกลับมา ช่างกลับไปแก้ให้ฟรี':
      'Every repair is covered for 30 days. If the same issue returns, the technician fixes it free.',
    'ราคาเริ่มต้นคือค่าแรง 1 ชั่วโมง ยังไม่รวมค่าอะไหล่ และจะคูณเพิ่มตามระดับความรุนแรงของงาน':
      'The starting price is 1 hour of labour, excluding parts, and scales with job severity.',
    'สมาชิก FixNow+ : ฟรีค่าตรวจเช็คหน้างาน 250 บาท และรับส่วนลดสมาชิก 10% ทุกบิล':
      'FixNow+ members: free 250 THB on-site inspection and 10% off every bill',
    "ระดับความรุนแรง คือ คุณคิดว่าของชิ้นนี้เสียหายขนาดไหนถ้าไม่แน่ใจให้เลือก'เล็กน้อย'ทางระบบจะประเมินราคาให้":
      "Severity means how badly you think the item is damaged. If unsure, pick 'Minor' and the system will estimate for you.",
    'ประเมินเวลาทำงานของช่าง คิดขั้นต่ำ 1 ชั่วโมง หากหน้างานใช้เวลาน้อยกว่า ระบบจะคืนส่วนต่างให้':
      'Estimated working time, 1 hour minimum. If the job takes less, the difference is refunded.',
    'ค่าอะไหล่ที่คาดว่าต้องเปลี่ยน เช่น คอมเพรสเซอร์ ลูกลอย หลอดไฟ ราคาจริงยืนยันอีกครั้งหน้างาน':
      'Estimated parts cost (compressor, float valve, light bulb, etc.). The final price is confirmed on site.',
    'ช่างจะตัดคิวเข้าหางานของคุณภายใน 2 ชั่วโมง คิดค่าบริการเพิ่ม 20% ของค่าแรง+ค่าอะไหล่':
      'A technician jumps the queue to reach you within 2 hours, for +20% of labour + parts.',
    'งานที่นัดหมายช่วง 20:00–07:00 หรือวันหยุดนักขัตฤกษ์ คิดค่าบริการนอกเวลาเพิ่ม 30%':
      'Jobs booked between 20:00–07:00 or on public holidays carry a 30% after-hours surcharge.',
    'คะแนนรีวิวมีผลต่อระดับ Tier ของช่าง ช่างที่ได้ต่ำกว่า 4.0 ติดกัน 3 งานจะถูกทบทวนสถานะ':
      "Ratings affect a technician's tier. Below 4.0 for 3 jobs in a row triggers a status review.",
    'แต้มมีอายุ 12 เดือนนับจากวันที่ได้รับ และใช้ได้เฉพาะกับงานซ่อมในแอปเท่านั้น':
      'Points expire 12 months after they are earned and apply only to in-app repairs.',
    'รายได้สุทธิ = ยอดงาน − ค่าธรรมเนียมแพลตฟอร์มตามระดับ Tier ของคุณ (5–10%)':
      'Net income = job total − platform fee based on your tier (5–10%)',
    'Tier คำนวณจากจำนวนงานที่ทำสำเร็จในเดือนนั้น: Bronze 0+ (fee 10%), Silver 20+ (8%), Gold 40+ (6%), Platinum 70+ (5%)':
      'Tier is based on jobs completed that month: Bronze 0+ (10% fee), Silver 20+ (8%), Gold 40+ (6%), Platinum 70+ (5%)',

    // ---- Document title ----
    'FixNow — เรียกช่างซ่อมถึงบ้าน': 'FixNow — On-demand home repair'
  };

  /* ---------- 2) รูปแบบข้อความที่มีตัวเลขแปรผัน ---------- */
  var RULES = [
    { re: /^ค่าแรง\s+([\s\S]+?)\s*\(\s*([\d.,]+)\s*ชม\.?\s*[×xX]\s*([\s\S]+?)\s*[×xX]\s*([\d.]+)\s*\)$/,
      fn: function (m) {
        var svc = lookup(m[1].trim()) || m[1].trim();
        var sev = lookup(m[3].trim()) || m[3].trim();
        return 'Labour — ' + svc + ' (' + m[2] + ' hr × ' + sev + ' ×' + m[4] + ')';
      } },
    { re: /^รับ\s*([\d.,]+)\s*แต้ม\s*เมื่อชำระเงินสำเร็จ$/, en: 'Earn $1 points on successful payment' },
    { re: /^รับ\s*([\d.,]+)\s*แต้ม$/,                       en: 'Earn $1 points' },
    { re: /^([\d.,]+)\s*แต้ม$/,                              en: '$1 points' },
    { re: /^ค่าแรง\s*([\d.,]+)\s*ชม\.?$/,                    en: 'Labour $1 hr' },
    { re: /^จองสำเร็จ!\s*ได้รับ\s*([\d.,]+)\s*แต้ม$/,        en: 'Booking confirmed! You earned $1 points' },
    { re: /^ขอบคุณสำหรับรีวิว\s*([\d.]+)\s*ดาว\s*⭐?$/,      en: 'Thanks for your $1-star review ⭐' },
    { re: /^ค่าธรรมเนียม\s*([\d.]+)%$/,                      en: 'Fee $1%' },
    { re: /^งานเดือนนี้\s*([\d.,]+)$/,                       en: 'Jobs this month $1' },
    { re: /^ส่วนลด\s*([\d.,]+)\s*บาท$/,                      en: '$1 THB discount' },
    { re: /^ขั้นต่ำ\s*([\d.,]+)\s*บาท$/,                     en: 'Minimum $1 THB' },
    { re: /^฿([\d.,]+)\s*\/\s*ปี\s*\+\s*ประกันอุบัติเหตุ$/,  en: '฿$1 / year + accident insurance' },
    { re: /^฿([\d.,]+)\s*\/\s*ปี$/,                          en: '฿$1 / year' },
    { re: /^สถานะ:\s*([\s\S]+)$/,      fn: function (m) { return 'Status: ' + (lookup(m[1].trim()) || m[1].trim()); } },
    { re: /^รับงาน\s*([\s\S]+?)\s*แล้ว$/, fn: function (m) { return 'Accepted job: ' + (lookup(m[1].trim()) || m[1].trim()); } },
    { re: /^รับ\s*([\d.,]+)\s*แต้ม\s*เมื่อชำระเงินสำเร็จ$/, en: 'Earn $1 points on successful payment' },
    { re: /^แลก\s*([\s\S]+?)\s*สำเร็จ\s*🎁?$/, fn: function (m) { return 'Redeemed ' + (lookup(m[1].trim()) || m[1].trim()) + ' 🎁'; } },
    { re: /^อีก\s*([\d.,]+)\s*งาน\s*เลื่อนเป็น\s*([\s\S]+?)\s*\(ค่าธรรมเนียมเหลือ\s*([\d.]+)%\)$/,
      fn: function (m) { return m[1] + ' more jobs to reach ' + m[2] + ' (fee drops to ' + m[3] + '%)'; } }
  ];

  /* ---------- คำแปลเฉพาะจุด (override DICT) ---------- */
  var SPECIAL = [
    { sel: '#modeSwitch .seg-btn', map: { 'ผู้ใช้': 'User', 'ช่าง': 'Tech' } }
  ];

  function specialFor(node) {
    var el = node.parentElement;
    if (!el || !el.closest) return null;
    for (var i = 0; i < SPECIAL.length; i++) {
      if (el.closest(SPECIAL[i].sel)) return SPECIAL[i].map;
    }
    return null;
  }

  /* ---------- 3) เอนจินแปลภาษา ---------- */
  var textOrig = new WeakMap();
  var attrOrig = new WeakMap();
  var applying = false;
  var ATTRS = ['placeholder', 'title', 'data-tip', 'aria-label'];

  function core(k) {
    if (Object.prototype.hasOwnProperty.call(DICT, k)) return DICT[k];
    for (var i = 0; i < RULES.length; i++) {
      var m = k.match(RULES[i].re);
      if (m) return RULES[i].fn ? RULES[i].fn(m) : k.replace(RULES[i].re, RULES[i].en);
    }
    return null;
  }

  function lookup(k) {
    if (!k) return null;
    var hit = core(k);
    if (hit != null) return hit;
    // ตัด emoji / สัญลักษณ์หัว-ท้ายออกแล้วลองใหม่ เช่น "🧊 ตู้เย็น"
    var p = k.match(/^([^\u0E00-\u0E7FA-Za-z0-9฿]*)([\s\S]*?)([^\u0E00-\u0E7FA-Za-z0-9฿%)]*)$/);
    if (p && p[2] && p[2] !== k) {
      var inner = core(p[2]);
      if (inner != null) return p[1] + inner + p[3];
    }
    return null;
  }

  function translate(raw) {
    var m = String(raw).match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!m || !m[2]) return null;
    var out = lookup(m[2]);
    return out == null ? null : m[1] + out + m[3];
  }

    function applyText(node) {
    var cur = node.nodeValue;
    if (!cur || !cur.trim()) return;

    if (lang === 'en') {
      var base = textOrig.has(node) ? textOrig.get(node) : cur;
      var out = null;
      var sp = specialFor(node);
      if (sp) {
        var k = base.trim();
        if (Object.prototype.hasOwnProperty.call(sp, k)) out = base.replace(k, sp[k]);
      }
      if (out == null) out = translate(base);
      if (out != null && out !== cur) {
        if (!textOrig.has(node)) textOrig.set(node, cur);
        node.nodeValue = out;
      }
    } else if (textOrig.has(node)) {
      node.nodeValue = textOrig.get(node);
      textOrig['delete'](node);
    }
  }

  function applyAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute(a)) continue;
      var store = attrOrig.get(el) || {};
      if (lang === 'en') {
        var base = store[a] != null ? store[a] : el.getAttribute(a);
        var out = translate(base);
        if (out != null && out !== el.getAttribute(a)) {
          if (store[a] == null) { store[a] = el.getAttribute(a); attrOrig.set(el, store); }
          el.setAttribute(a, out);
        }
      } else if (store[a] != null) {
        el.setAttribute(a, store[a]);
        store[a] = null;
      }
    }
  }

  function applyAll() {
    applying = true;
    try {
      var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      var nodes = [], n;
      while ((n = w.nextNode())) {
        var p = n.parentNode;
        if (p && (p.tagName === 'SCRIPT' || p.tagName === 'STYLE')) continue;
        nodes.push(n);
      }
      nodes.forEach(applyText);

      var els = document.body.querySelectorAll('[placeholder],[title],[data-tip],[aria-label]');
      for (var i = 0; i < els.length; i++) applyAttrs(els[i]);

      document.documentElement.lang = lang;
      var t = lang === 'en' ? translate(document.title) : null;
      if (lang === 'en' && t) { if (!window.__docTitleTh) window.__docTitleTh = document.title; document.title = t; }
      if (lang === 'th' && window.__docTitleTh) document.title = window.__docTitleTh;

      syncMenu();
    } catch (e) {
      console.warn('i18n error:', e);
    }
    applying = false;
  }

  /* ---------- 4) เมนูโปรไฟล์ ---------- */
  var menu, backdrop, chip;

  function buildMenu() {
    chip = document.getElementById('userChip');
    if (!chip) return false;
    var host = document.querySelector('.phone-screen') || document.body;

    backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';

    menu = document.createElement('div');
    menu.className = 'profile-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML =
      '<div class="pm-head">' +
        '<div class="pm-ava" id="pmAva">U</div>' +
        '<div class="pm-id"><strong id="pmName">-</strong><span id="pmRole">-</span></div>' +
      '</div>' +
      '<div class="pm-sec">' +
        '<span class="pm-label">ภาษา / Language</span>' +
        '<div class="pm-lang">' +
          '<button type="button" class="pm-lang-btn" data-lang="th">ไทย</button>' +
          '<button type="button" class="pm-lang-btn" data-lang="en">English</button>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="pm-item" id="pmLogout">ออกจากระบบ</button>';

    host.appendChild(backdrop);
    host.appendChild(menu);

    chip.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(); });
    backdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

    menu.addEventListener('click', function (e) {
      var b = e.target.closest('.pm-lang-btn');
      if (b) { setLang(b.getAttribute('data-lang')); return; }
      if (e.target.closest('#pmLogout')) {
        closeMenu();
        var lo = document.getElementById('logoutBtn');
        if (lo) lo.click();
      }
    });
    return true;
  }

  function syncMenu() {
    if (!menu) return;
    var name = document.getElementById('helloName');
    var seg = document.querySelector('#modeSwitch .seg-btn.active');
    var nm = menu.querySelector('#pmName');
    var rl = menu.querySelector('#pmRole');
    var av = menu.querySelector('#pmAva');
    if (nm) nm.textContent = name ? name.textContent.trim() : '-';
    if (rl) rl.textContent = seg ? seg.textContent.trim() : '';
    if (av && chip) av.textContent = (chip.textContent || 'U').trim().charAt(0).toUpperCase();
    var btns = menu.querySelectorAll('.pm-lang-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-lang') === lang);
    }
  }

  function openMenu()  { syncMenu(); menu.classList.add('open'); backdrop.classList.add('open'); chip.classList.add('menu-open'); }
  function closeMenu() { if (!menu) return; menu.classList.remove('open'); backdrop.classList.remove('open'); chip.classList.remove('menu-open'); }
  function toggleMenu(){ menu.classList.contains('open') ? closeMenu() : openMenu(); }

  function setLang(next) {
    if (next !== 'th' && next !== 'en') return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    applyAll();
    if (typeof window.toast === 'function') {
      window.toast(lang === 'th' ? 'เปลี่ยนเป็นภาษาไทยแล้ว' : 'Switched to English');
    }
  }

  /* ---------- 5) เริ่มทำงาน + เฝ้าดู DOM ที่ render ใหม่ ---------- */
  function start() {
    buildMenu();
    applyAll();

    var pending = false;
    var obs = new MutationObserver(function () {
      if (applying || pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; applyAll(); });
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 0); });
  } else {
    setTimeout(start, 0);
  }
})();
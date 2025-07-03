// main.js  -----------------------------------------------------------
// ponto de entrada da aplicação SPA

/* ------------ imports base ------------ */
import { initAuth }       from './auth.js';
import { getUserProfile } from './profile.js';

/* ------------ módulos de negócio ------- */
import { initCenters }    from './centers.js';
import { initStudents }   from './students.js';
import { initDefaulters } from './defaulters.js';
import { loadTotals }     from './totals.js';

/* ------------ utilidades --------------- */
import { $ }              from './utils.js';
import { signOut }        from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* ================================================================== */
/* 0. Estado compartilhado                                             */
/* ================================================================== */
let firebaseUser      = null;              // objeto Firebase User
let userProfile       = null;              // { role, centerId, centerName? }
let centersMap        = new Map();         // Map<id,{name}> preenchido pelo módulo centers

/* helper para registrar onclicks de forma concisa */
const on = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };

/* ================================================================== */
/* 1. Bootstrap – dispara assim que o usuário loga                     */
/* ================================================================== */
initAuth(async (user) => {
  /* ---- 1.1 perfil do usuário ---- */
  firebaseUser = user;
  userProfile  = await getUserProfile(user.uid);

  if (!userProfile?.role) {
    console.error('main: perfil de usuário sem role; abortando.');
    return;
  }

  /* ---- 1.2 carrega centros (aguarda) ---- */
  centersMap = await initCenters(firebaseUser, userProfile); // devolve Map

  /* ---- 1.3 módulos que dependem de centros ---- */
  initStudents  (firebaseUser, userProfile, centersMap);
  initDefaulters(firebaseUser, userProfile, centersMap);     // ← agora 3 args

  /* ---- 1.4 navegação & tela inicial ---- */
  setupHomeNav();
  showSection('home');
});

/* ================================================================== */
/* 2. Home – botões principais                                         */
/* ================================================================== */
function setupHomeNav() {
  on('btn-nav-search'    , () => showSection('students'));
  on('btn-nav-add'       , () => showSection('students', /*openForm=*/true));

  on('btn-nav-totals'    , async () => {
    await loadTotals(firebaseUser);
    showSection('totals');
  });

  on('btn-nav-defaulters', () => showSection('defaulters'));
  on('btn-nav-centers'   , () => showSection('centers'));

  /* apenas admin vê “Cadastro de Centro” */
  if (userProfile.role !== 'admin') {
    $('btn-nav-centers')?.classList.add('hidden');
  }

  on('logout-btn', () => signOut());
}

/* ================================================================== */
/* 3. Botões “Voltar” das sub-telas                                     */
/* ================================================================== */
[
  ['back-home-students',   'home'],
  ['back-home-totals',     'home'],
  ['back-home-centers',    'home'],
  ['back-home-defaulters', 'home']
].forEach(([id, target]) => on(id, () => showSection(target)));

/* ================================================================== */
/* 4. Router super-simples (mostrar / esconder seções)                 */
/* ================================================================== */
function showSection(target, openStudentForm = false) {
  /* mapa id-lógico → id-HTML */
  const sectionId = {
    auth      : 'auth-section',
    home      : 'home-section',
    students  : 'dashboard-section',
    totals    : 'totals-section',
    centers   : 'centers-section',
    defaulters: 'defaulters-section'
  };

  /* esconde todas as seções */
  Object.values(sectionId).forEach(id => $(id)?.classList.add('hidden'));

  /* mostra a desejada */
  $(sectionId[target])?.classList.remove('hidden');

  /* se vier de “Adicionar Aluno”, expande o <details> do formulário */
  if (target === 'students' && openStudentForm) {
    $('student-form-wrapper')?.setAttribute('open', '');
  }
}

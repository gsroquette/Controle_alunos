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
import { signOut }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* ================================================================== */
/* 0. Estado compartilhado                                             */
/* ================================================================== */
let firebaseUser = null;         // Firebase User
let userProfile  = null;         // { role, centerId, … }
let centersMap   = new Map();    // Map<id,{name}>

/* helper onclick */
const on = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };

/* ================================================================== */
/* 1. Bootstrap – dispara depois do login                              */
/* ================================================================== */
initAuth(async (user) => {
  firebaseUser = user;
  userProfile  = await getUserProfile(user.uid);

  if (!userProfile?.role) {
    console.error('main: perfil sem role – abortado.');
    return;
  }

  centersMap = await initCenters(firebaseUser, userProfile);

  initStudents  (firebaseUser, userProfile, centersMap);
  initDefaulters(firebaseUser, userProfile, centersMap);

  setupHomeNav();
  showSection('home');
});

/* ================================================================== */
/* 2. Home – botões principais                                         */
/* ================================================================== */
function setupHomeNav() {
  on('btn-nav-search'    , () => showSection('students'));
  on('btn-nav-add'       , () => showSection('addStudent'));   // ← ALTERADO

  on('btn-nav-totals'    , async () => {
    await loadTotals(firebaseUser);
    showSection('totals');
  });

  on('btn-nav-defaulters', () => showSection('defaulters'));
  on('btn-nav-centers'   , () => showSection('centers'));

  if (userProfile.role !== 'admin') {
    $('btn-nav-centers')?.classList.add('hidden');
  }

  on('logout-btn', () => signOut());
}

/* ================================================================== */
/* 3. Botões “Voltar”                                                  */
/* ================================================================== */
[
  ['back-home-students' , 'home'],
  ['back-home-add'      , 'home'],  // ← botão da tela de cadastro
  ['back-home-totals'   , 'home'],
  ['back-home-centers'  , 'home'],
  ['back-home-defaulters','home']
].forEach(([id, tgt]) => on(id, () => showSection(tgt)));

/* ================================================================== */
/* 4. Router – mostra / esconde sections                               */
/* ================================================================== */
function showSection(target, openStudentForm = false) {
  const sectionId = {
    auth      : 'auth-section',
    home      : 'home-section',
    students  : 'dashboard-section',   // lista / pesquisa
    addStudent: 'add-student-section', // formulário
    totals    : 'totals-section',
    centers   : 'centers-section',
    defaulters: 'defaulters-section'
  };

  Object.values(sectionId).forEach(id => $(id)?.classList.add('hidden'));
  $(sectionId[target])?.classList.remove('hidden');

  /* se quisermos abrir <details> quando ficar na mesma página */
  if (target === 'students' && openStudentForm) {
    $('student-form-wrapper')?.setAttribute('open', '');
  }
}

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
import { $ } from './utils.js';
import {
  signOut,
  getAuth
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* ===================================================================
 * 0.  Registro do Service-Worker (+ instalação PWA)
 * =================================================================*/
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('/service-worker.js')
      .catch(err => console.error('SW registration failed:', err))
  );
}

/* “Add to Home Screen” – botão próprio */
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();               // impede o banner autom.
  deferredPrompt = e;               // guarda o evento
  $('btn-install-app')?.classList.remove('hidden');
});

$('btn-install-app')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;  // aguarda escolha do usuário
  deferredPrompt = null;
  $('btn-install-app')?.classList.add('hidden');
});

/* ===================================================================
 * 1.  Estado compartilhado
 * =================================================================*/
let firebaseUser = null;        // Firebase Auth user
let userProfile  = null;        // { role, centerId, centerName? }
let centersMap   = new Map();   // Map<id,{name}>

const on = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };

/* ===================================================================
 * 2. Bootstrap – dispara assim que o usuário loga
 * =================================================================*/
initAuth(async (user) => {

  /* 2-A. dados do usuário / perfil -------------------------------- */
  firebaseUser = user;
  userProfile  = await getUserProfile(user.uid);

  if (!userProfile?.role) {
    console.error('main: perfil sem role – abortando.');
    return;
  }

  /* 2-B. carrega centros ------------------------------------------ */
  centersMap = await initCenters(userProfile);   // devolve Map

  /* 2-C. inicia módulos dependentes ------------------------------- */
  initStudents  (firebaseUser, userProfile, centersMap);
  initDefaulters(userProfile, centersMap);

  /* 2-D. interface ------------------------------------------------ */
  setupHomeNav();
  showSection('home');
});

/* ===================================================================
 * 3. Home – botões principais
 * =================================================================*/
function setupHomeNav() {

  /* navegação */
  on('btn-nav-search'     , () => showSection('students'));
  on('btn-nav-add'        , () => showSection('addStudent'));
  on('btn-nav-defaulters' , () => showSection('defaulters'));
  on('btn-nav-centers'    , () => showSection('centers'));

  on('btn-nav-totals', async () => {
    await loadTotals(userProfile, centersMap);
    showSection('totals');
  });

  /* apenas admin vê “Cadastro de Centro” */
  if (userProfile.role !== 'admin') {
    $('btn-nav-centers')?.classList.add('hidden');
  }

  /* logout */
  on('logout-btn', () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => window.location.href = 'index.html')
      .catch((error) => console.error('Erro ao sair:', error));
  });
}

/* ===================================================================
 * 4. Botões “Voltar” das sub-telas
 * =================================================================*/
[
  ['back-home-students' , 'home'],
  ['back-home-add'      , 'home'],
  ['back-home-totals'   , 'home'],
  ['back-home-centers'  , 'home'],
  ['back-home-defaulters', 'home']
].forEach(([id, target]) => on(id, () => showSection(target)));

/* ===================================================================
 * 5. Router – mostra / esconde sections
 * =================================================================*/
function showSection(target) {
  const sectionId = {
    auth      : 'auth-section',
    home      : 'home-section',
    students  : 'dashboard-section',
    addStudent: 'add-student-section',
    totals    : 'totals-section',
    centers   : 'centers-section',
    defaulters: 'defaulters-section'
  };

  Object.values(sectionId).forEach(id => $(id)?.classList.add('hidden'));
  $(sectionId[target])?.classList.remove('hidden');
}

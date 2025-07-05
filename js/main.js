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
 * 0.  Estado compartilhado
 * =================================================================*/
let firebaseUser = null;        // Firebase Auth user
let userProfile  = null;        // { role, centerId, centerName? }
let centersMap   = new Map();   // Map<id,{name}>

/* atalho para registrar onclicks com segurança */
const on = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };

/* ===================================================================
 * 1. Bootstrap – dispara assim que o usuário loga
 * =================================================================*/
initAuth(async (user) => {

  /* 1-A. dados do usuário / perfil -------------------------------- */
  firebaseUser = user;
  userProfile  = await getUserProfile(user.uid);

  if (!userProfile?.role) {
    console.error('main: perfil sem role – abortando.');
    return;
  }

  /* 1-B. carrega centros ------------------------------------------ */
  //  ⚠️  initCenters agora recebe **apenas** o profile
  centersMap = await initCenters(userProfile);   // devolve Map

  /* 1-C. inicia módulos dependentes ------------------------------- */
  initStudents  (firebaseUser, userProfile, centersMap);
  initDefaulters(userProfile, centersMap);

  /* 1-D. interface ------------------------------------------------ */
  setupHomeNav();
  showSection('home');
});

/* ===================================================================
 * 2. Home – botões principais
 * =================================================================*/
function setupHomeNav() {

  /* navegação ----------------------------------------------------- */
  on('btn-nav-search'     , () => showSection('students'));
  on('btn-nav-add'        , () => showSection('addStudent'));
  on('btn-nav-defaulters' , () => showSection('defaulters'));
  on('btn-nav-centers'    , () => showSection('centers'));

  on('btn-nav-totals', async () => {
    await loadTotals(userProfile, centersMap);   // passa profile + Map
    showSection('totals');
  });

  /* apenas admin vê “Cadastro de Centro” -------------------------- */
  if (userProfile.role !== 'admin') {
    $('btn-nav-centers')?.classList.add('hidden');
  }

  /* logout -------------------------------------------------------- */
  on('logout-btn', () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => window.location.href = 'index.html')
      .catch((error) => console.error('Erro ao sair:', error));
  });
}

/* ===================================================================
 * 3. Botões “Voltar” das sub-telas
 * =================================================================*/
[
  ['back-home-students' , 'home'],
  ['back-home-add'      , 'home'],
  ['back-home-totals'   , 'home'],
  ['back-home-centers'  , 'home'],
  ['back-home-defaulters', 'home']
].forEach(([id, target]) => on(id, () => showSection(target)));

/* ===================================================================
 * 4. Router – mostra / esconde sections
 * =================================================================*/
function showSection(target) {
  const sectionId = {
    auth      : 'auth-section',
    home      : 'home-section',
    students  : 'dashboard-section',   // lista / pesquisa
    addStudent: 'add-student-section', // formulário de cadastro
    totals    : 'totals-section',
    centers   : 'centers-section',
    defaulters: 'defaulters-section'
  };

  /* esconde todas */
  Object.values(sectionId).forEach(id => $(id)?.classList.add('hidden'));

  /* mostra a desejada */
  $(sectionId[target])?.classList.remove('hidden');
}

/* ===================================================================
 * 5. (OPCIONAL) Botão “Instalar App” – suporte PWA
 * ===================================================================
 * Se quiser exibir um botão para instalação nativa (Android/desktop),
 * basta acrescentar no HTML algo como:
 *
 *   <button id="btn-install" class="hidden ...">Instalar App</button>
 *
 * e manter o código abaixo.  Caso não deseje, apague este bloco.
 * ------------------------------------------------------------------ */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = $('btn-install');
  if (btn) {
    btn.classList.remove('hidden');
    btn.onclick = async () => {
      btn.setAttribute('disabled', '');
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    };
  }
});

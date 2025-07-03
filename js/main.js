// main.js --------------------------------------------------------------
// ponto de entrada da aplicação

import { initAuth }       from './auth.js';
import { getUserProfile } from './profile.js';

import { initCenters }    from './centers.js';
import { initStudents }   from './students.js';
import { initDefaulters } from './defaulters.js';
import { loadTotals }     from './totals.js';

import { $ }              from './utils.js';
import { signOut }        from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* ---------------- estado global ---------------- */
let curUser    = null;
let curProfile = null;
/** @type {Map<string,{name:string}>} */
let centersMap = new Map();

/* ---------------- helper onclick ---------------- */
const on = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };

/* -------------------------------------------------
 * 1. INICIALIZA APÓS LOGIN
 * ------------------------------------------------- */
initAuth(async (user) => {
  curUser    = user;
  curProfile = await getUserProfile(user.uid);

  if (!curProfile || !curProfile.role) {
    console.error('Perfil inválido ou ausente.');
    return;
  }

  /* se for secretaria, anexa info do centro ao objeto user */
  if (curProfile.role !== 'admin') {
    curUser.centerId   = curProfile.centerId;
    curUser.centerName = curProfile.centerName || 'Centro Local';
  }

  /* carrega centros e, na sequência, módulos dependentes */
  centersMap = await initCenters(curUser, curProfile);

  initStudents  (curUser, curProfile, centersMap);
  initDefaulters(curUser, curProfile, centersMap);

  setupHomeNav();
  show('home');
});

/* -------------------------------------------------
 * 2. HOME – botões de navegação
 * ------------------------------------------------- */
function setupHomeNav() {
  on('btn-nav-search'    , () => show('students'));
  on('btn-nav-add'       , () => show('students', true));
  on('btn-nav-totals'    , async () => {
    await loadTotals(curUser);
    show('totals');
  });
  on('btn-nav-defaulters', () => show('defaulters'));
  on('btn-nav-centers'   , () => show('centers'));

  /* somente admins enxergam cadastro de centro */
  if (curProfile.role !== 'admin') {
    const b = $('btn-nav-centers');
    if (b) b.classList.add('hidden');
  }

  on('logout-btn', () => signOut());
}

/* -------------------------------------------------
 * 3. BOTÕES “Voltar”
 * ------------------------------------------------- */
[
  ['back-home-students',   'home'],
  ['back-home-totals',     'home'],
  ['back-home-centers',    'home'],
  ['back-home-defaulters', 'home']
].forEach(([id, target]) => on(id, () => show(target)));

/* -------------------------------------------------
 * 4. SHOW – troca de seções
 * ------------------------------------------------- */
function show(target, openForm = false) {
  const map = {
    auth       : 'auth-section',
    home       : 'home-section',
    students   : 'dashboard-section',
    totals     : 'totals-section',
    centers    : 'centers-section',
    defaulters : 'defaulters-section'
  };

  Object.values(map).forEach(id => $(id)?.classList.add('hidden'));
  $(map[target])?.classList.remove('hidden');

  /* se veio de “Adicionar Aluno”, expande o <details> do formulário */
  if (target === 'students' && openForm) {
    $('student-form-wrapper')?.setAttribute('open', '');
  }
}

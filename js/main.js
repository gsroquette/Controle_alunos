/* ------------- imports ------------- */
import { initAuth }       from './auth.js';
import { getUserProfile } from './profile.js';

import { initCenters }    from './centers.js';
import { initStudents }   from './students.js';
import { initDefaulters } from './defaulters.js';
import { loadTotals }     from './totals.js';

import { $ }              from './utils.js';
import { signOut }        from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* estado global simples */
let curUser     = null;
let curProfile  = null;
let centersMap  = new Map();

/* ------------------------------------------------- */
/* BOOTSTRAP – roda assim que o usuário faz login    */
/* ------------------------------------------------- */
initAuth(async (user) => {

  // 1. pega perfil (role, centerId etc.)
  curUser    = user;
  curProfile = await getUserProfile(user.uid);

  // 2. inicia centros e recebe Map via callback
  await initCenters(user, curProfile, (map) => {
    centersMap = map;

    // 3. inicia os módulos dependentes dos centros
    initStudents  (user, curProfile, centersMap);
    initDefaulters(user, curProfile, centersMap);
  });

  // 4. configura navegação Home
  setupHomeNav();

  // 5. mostra tela inicial
  show('home');
});

/* ------------------------------------------------- */
/* HOME – botões de navegação                        */
/* ------------------------------------------------- */
function setupHomeNav () {
  $('btn-nav-search'    ).onclick = () => show('students');
  $('btn-nav-add'       ).onclick = () => show('students', true);
  $('btn-nav-totals'    ).onclick = async () => {
    await loadTotals(curUser);
    show('totals');
  };
  $('btn-nav-defaulters').onclick = () => show('defaulters');
  $('btn-nav-centers'   ).onclick = () => show('centers');

  if (curProfile.role !== 'admin') {
    $('btn-nav-centers')?.classList.add('hidden');
  }

  $('logout-btn').onclick = () => signOut();
}

/* ------------------------------------------------- */
/* BOTÕES “Voltar”                                   */
/* ------------------------------------------------- */
[
  ['back-home-students',   'home'],
  ['back-home-totals',     'home'],
  ['back-home-centers',    'home'],
  ['back-home-defaulters', 'home']
].forEach(([id, target]) => {
  const el = $(id);
  if (el) el.onclick = () => show(target);
});

/* ------------------------------------------------- */
/* SHOW helper                                       */
/* ------------------------------------------------- */
function show(target, openForm = false) {
  const map = {
    auth:        'auth-section',
    home:        'home-section',
    students:    'dashboard-section',
    totals:      'totals-section',
    centers:     'centers-section',
    defaulters:  'defaulters-section'
  };

  Object.values(map).forEach(id => $(id)?.classList.add('hidden'));
  $(map[target])?.classList.remove('hidden');

  if (target === 'students' && openForm) {
    $('student-form-wrapper')?.setAttribute('open', '');
  }
}

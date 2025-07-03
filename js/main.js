// main.js --------------------------------------------------------------

import { initAuth }       from './auth.js';
import { getUserProfile } from './profile.js';

import { initCenters }    from './centers.js';
import { initStudents }   from './students.js';
import { initDefaulters } from './defaulters.js';
import { loadTotals }     from './totals.js';

import { $ }              from './utils.js';
import { signOut }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* ---------- estado global ---------- */
let curUser    = null;
let curProfile = null;
let centersMap = new Map();

/* ---------- inicia assim que o usuário loga ---------- */
initAuth(async (user) => {
  curUser    = user;
  curProfile = await getUserProfile(user.uid);

  if (!curProfile || !curProfile.role) {
    console.error('Perfil do usuário não encontrado ou sem role.');
    return;
  }

  /* se não for admin guarda o centro no próprio objeto usuário          */
  if (curProfile.role !== 'admin') {
    curUser.centerId   = curProfile.centerId;
    curUser.centerName = curProfile.centerName || 'Centro Local';
  }

  /* 1. centros → devolve Map<id,{name}> -------------------------------- */
  centersMap = await initCenters(curUser, curProfile);

  /* 2. módulos que dependem dos centros ------------------------------- */
  initStudents  (curUser, curProfile, centersMap);
  initDefaulters(curUser, curProfile, centersMap);

  /* 3. navegação e tela inicial --------------------------------------- */
  setupHomeNav();
  show('home');
});

/* ---------- botões da Home ---------- */
function setupHomeNav() {
  $('btn-nav-search')    ?.onclick = () => show('students');
  $('btn-nav-add')       ?.onclick = () => show('students', true);

  $('btn-nav-totals')    ?.onclick = async () => {
    await loadTotals(curUser);
    show('totals');
  };

  $('btn-nav-defaulters')?.onclick = () => show('defaulters');
  $('btn-nav-centers')   ?.onclick = () => show('centers');

  /* menu Centros só para admin */
  if (curProfile.role !== 'admin') {
    $('btn-nav-centers')?.classList.add('hidden');
  }

  /* logout */
  $('logout-btn')?.onclick = () => signOut();
}

/* ---------- botões “voltar” ---------- */
[
  ['back-home-students',   'home'],
  ['back-home-totals',     'home'],
  ['back-home-centers',    'home'],
  ['back-home-defaulters', 'home']
].forEach(([id, target]) => {
  const el = $(id);
  if (el) {
    el.onclick = () => show(target);
  }
});

/* ---------- router simples ---------- */
function show(target, openForm = false) {
  const map = {
    auth:       'auth-section',
    home:       'home-section',
    students:   'dashboard-section',
    totals:     'totals-section',
    centers:    'centers-section',
    defaulters: 'defaulters-section'
  };

  /* esconde tudo */
  Object.values(map).forEach(id => $(id)?.classList.add('hidden'));

  /* mostra solicitada */
  $(map[target])?.classList.remove('hidden');

  /* se veio de “Adicionar Aluno” */
  if (target === 'students' && openForm) {
    $('student-form-wrapper')?.setAttribute('open', '');
  }
}

// main.js

import { initAuth }       from './auth.js';
import { getUserProfile } from './profile.js';

import { initCenters }    from './centers.js';
import { initStudents }   from './students.js';
import { initDefaulters } from './defaulters.js';
import { loadTotals }     from './totals.js';

import { $ }              from './utils.js';
import { signOut }        from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

let curUser     = null;
let curProfile  = null;
let centersMap  = new Map();

/* ------------------------------------------------- */
/* INICIALIZA APÓS LOGIN                             */
/* ------------------------------------------------- */
initAuth(async (user) => {
  curUser = user;
  curProfile = await getUserProfile(user.uid);

  // 🔒 Garante que o perfil está correto
  if (!curProfile || !curProfile.role) {
    console.error('Erro: perfil do usuário inválido.');
    return;
  }

  // 🔧 Se não for admin, atribui dados do centro no usuário
  if (curProfile.role !== 'admin') {
    curUser.centerId   = curProfile.centerId;
    curUser.centerName = curProfile.centerName || 'Centro Local';
  }

  // ⏳ Carrega centros antes de usar em módulos
  centersMap = await initCenters(curUser, curProfile);

  // ✅ Inicializa os módulos que usam os dados carregados
  initStudents  (curUser, curProfile, centersMap);
  initDefaulters(curUser, curProfile, centersMap);

  // 🧭 Configura navegação e mostra tela inicial
  setupHomeNav();
  show('home');
});

/* ------------------------------------------------- */
/* BOTÕES DA TELA HOME                               */
/* ------------------------------------------------- */
function setupHomeNav () {
  $('btn-nav-search'    )?.onclick = () => show('students');
  $('btn-nav-add'       )?.onclick = () => show('students', true);
  $('btn-nav-totals'    )?.onclick = async () => {
    await loadTotals(curUser);
    show('totals');
  };
  $('btn-nav-defaulters')?.onclick = () => show('defaulters');
  $('btn-nav-centers'   )?.onclick = () => show('centers');

  // 🔒 Apenas admins podem acessar cadastro de centros
  if (curProfile.role !== 'admin') {
    $('btn-nav-centers')?.classList.add('hidden');
  }

  $('logout-btn')?.onclick = () => signOut();
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
/* SHOW – Navegação entre seções                     */
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

  // esconde tudo
  Object.values(map).forEach(id => $(id)?.classList.add('hidden'));

  // mostra a seção desejada
  $(map[target])?.classList.remove('hidden');

  // se abriu para adicionar aluno
  if (target === 'students' && openForm) {
    $('student-form-wrapper')?.setAttribute('open', '');
  }
}

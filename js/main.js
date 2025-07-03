// main.js

import { initAuth }       from './auth.js';
import { getUserProfile } from './profile.js';

import { initCenters }    from './centers.js';
import { initStudents }   from './students.js';
import { initDefaulters } from './defaulters.js';
import { loadTotals }     from './totals.js';

import { $ }              from './utils.js';
import { signOut }        from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* ---------------- VARIÁVEIS GLOBAIS ---------------- */
let curUser     = null;
let curProfile  = null;
let centersMap  = new Map();

/* ---------------- INICIALIZA APÓS LOGIN ---------------- */
initAuth(async (user) => {
  curUser = user;
  curProfile = await getUserProfile(user.uid);

  // 🚫 Verificação de segurança
  if (!curProfile || !curProfile.role) {
    console.error('Erro: perfil do usuário inválido.');
    return;
  }

  // 🔒 Se não for admin, define centro no usuário
  if (curProfile.role !== 'admin') {
    curUser.centerId   = curProfile.centerId;
    curUser.centerName = curProfile.centerName || 'Centro Local';
  }

  // ⏳ Carrega centros antes de iniciar os módulos
  centersMap = await initCenters(curUser, curProfile);

  // ✅ Inicializa módulos dependentes
  initStudents  (curUser, curProfile, centersMap);
  initDefaulters(curUser, curProfile, centersMap);

  // 🧭 Configura navegação
  setupHomeNav();

  // 🏠 Mostra página inicial
  show('home');
});

/* ---------------- BOTÕES DA HOME ---------------- */
function setupHomeNav() {
  $('btn-nav-search')     ?.onclick = () => show('students');
  $('btn-nav-add')        ?.onclick = () => show('students', true);
  $('btn-nav-totals')     ?.onclick = async () => {
    await loadTotals(curUser);
    show('totals');
  };
  $('btn-nav-defaulters') ?.onclick = () => show('defaulters');
  $('btn-nav-centers')    ?.onclick = () => show('centers');

  // 🔒 Restrição de acesso ao menu Centros
  if (curProfile.role !== 'admin') {
    $('btn-nav-centers')?.classList.add('hidden');
  }

  // 🔐 Logout
  $('logout-btn')?.onclick = () => signOut();
}

/* ---------------- BOTÕES “Voltar” ---------------- */
[
  ['back-home-students',   'home'],
  ['back-home-totals',     'home'],
  ['back-home-centers',    'home'],
  ['back-home-defaulters', 'home']
].forEach(([id, target]) => {
  const el = $(id);
  if (el) {
    el.onclick = () => show(target); // ✅ Aqui estava o erro na versão anterior
  }
});

/* ---------------- NAVEGAÇÃO ENTRE SEÇÕES ---------------- */
function show(target, openForm = false) {
  const map = {
    auth:        'auth-section',
    home:        'home-section',
    students:    'dashboard-section',
    totals:      'totals-section',
    centers:     'centers-section',
    defaulters:  'defaulters-section'
  };

  // Oculta todas
  Object.values(map).forEach(id => $(id)?.classList.add('hidden'));

  // Mostra a selecionada
  $(map[target])?.classList.remove('hidden');

  // Abre o formulário se indicado
  if (target === 'students' && openForm) {
    $('student-form-wrapper')?.setAttribute('open', '');
  }
}

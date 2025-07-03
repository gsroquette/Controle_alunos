/* ------------- imports ------------- */
import { initAuth }       from './auth.js';
import { getUserProfile } from './profile.js';

import { initCenters }    from './centers.js';
import { initStudents }   from './students.js';
import { initDefaulters } from './defaulters.js';
import { loadTotals }     from './totals.js';

import { $ }              from './utils.js';
import { signOut }        from
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* estado global simples */
let curUser     = null;
let curProfile  = null;
let centersMap  = new Map();

/* ------------------------------------------------- */
/* BOOTSTRAP – roda assim que o usuário faz login    */
/* ------------------------------------------------- */
initAuth(async (user) => {

  /* 1. perfil do usuário (role, centerId etc.) */
  curUser    = user;
  curProfile = await getUserProfile(user.uid);

  /* 2. carrega centros  (aguarda) */
  centersMap = await initCenters(user);          // devolve Map

  /* 3. inicia módulos que precisam dos centros */
  initStudents  (user, curProfile, centersMap);
  initDefaulters(user, curProfile, centersMap);

  /* 4. configura navegação Home */
  setupHomeNav();

  /* 5. mostra tela inicial */
  show('home');
});

/* ------------------------------------------------- */
/* HOME – botões de navegação                        */
/* ------------------------------------------------- */
function setupHomeNav () {

  /* pesquisa */
  $('btn-nav-search'    ).onclick = () => show('students');

  /* adicionar aluno = abre lista já com <details> aberto */
  $('btn-nav-add').onclick = () => show('students', /*openForm=*/true);

  /* totais mensais (carrega antes) */
  $('btn-nav-totals').onclick = async () => {
    await loadTotals(curUser);
    show('totals');
  };

  /* inadimplentes e centros */
  $('btn-nav-defaulters').onclick = () => show('defaulters');
  $('btn-nav-centers'   ).onclick = () => show('centers');

  /* se não for admin, esconde Cadastro de Centro */
  if (curProfile.role !== 'admin') {
    $('btn-nav-centers')?.classList.add('hidden');
  }

  /* sair */
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

  /* esconde todas as seções */
  Object.values(map).forEach(id => $(id)?.classList.add('hidden'));

  /* mostra a desejada */
  $(map[target])?.classList.remove('hidden');

  /* se veio de “Adicionar Aluno” abre o <details> do formulário */
  if (target === 'students' && openForm) {
    $('student-form-wrapper')?.setAttribute('open', '');
  }
}

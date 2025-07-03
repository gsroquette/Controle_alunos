import { initAuth }      from './auth.js';
import { getUserProfile } from './profile.js';
import { initCenters }   from './centers.js';
import { initStudents }  from './students.js';
import { initDefaulters }from './defaulters.js';
import { loadTotals }    from './totals.js';
import { $, }            from './utils.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let curUser = null;
let curRole = 'admin';

initAuth(async user => {
  curUser = user;
  const profile = await getUserProfile(user.uid);
  curRole = profile.role;

  /* Inicia módulos */
  initCenters(user, profile, (centersMap) => {
    initStudents(user, profile, centersMap);
    initDefaulters(user, profile, centersMap);
    setupHomeNav();          // só depois
    show('home');            // abre Home
  });
});

/* ---------- navegação Home ---------- */
function setupHomeNav() {
  $('btn-nav-search').onclick = () => { show('students'); };
  $('btn-nav-add').onclick = () => {
    show('students');
    $('student-form-wrapper').open = true;
  };
  $('btn-nav-totals').onclick = async () => {
    await loadTotals(curUser);
    show('totals');
  };
  $('btn-nav-defaulters').onclick = () => { show('defaulters'); };
  $('btn-nav-centers').onclick = () => { show('centers'); };

  // botão Centers somente para admin
  if (curRole !== 'admin') $('btn-nav-centers').classList.add('hidden');

  // LOGOUT
  $('logout-btn').onclick = () => signOut();
}

/* ---------- botões Voltar ---------- */
[
  ['back-home-students',   'home'],
  ['back-to-students',     'students'],
  ['back-home-totals',     'home'],
  ['back-home-centers',    'home'],
  ['back-home-defaulters', 'home']
].forEach(([id, target]) => {
  $(id).onclick = () => show(target);
});

/* ---------- show helper ---------- */
function show(target){
  const map={
    home:        'home-section',
    students:    'dashboard-section',
    addStudent:  'add-student-section',
    totals:      'totals-section',
    centers:     'centers-section',
    defaulters:  'defaulters-section',
    auth:        'auth-section'
  };
  Object.values(map).forEach(id=>$(id)?.classList.add('hidden'));
  $(map[target])?.classList.remove('hidden');
}

/* --- dentro de setupHomeNav() --- */
$('btn-nav-search').onclick   = ()=>show('students');
$('btn-nav-add').onclick      = ()=>show('addStudent');
/* ...resto igual... */

/* --- botões voltar --- */
[
 ['back-home-students','home'],
 ['back-home-add'    ,'home'],
 ['back-home-totals' ,'home'],
 ['back-home-centers','home'],
 ['back-home-defaulters','home']
].forEach(([id,tar])=>$(id).onclick=()=>show(tar));

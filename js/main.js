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

initAuth(async (user) => {
  curUser    = user;
  curProfile = await getUserProfile(user.uid);

  // 🔧 Garante que perfil tem centro (se não for admin)
  if (curProfile.role !== 'admin') {
    curUser.centerId   = curProfile.centerId;
    curUser.centerName = curProfile.centerName || 'Centro Local';
  }

  centersMap = await initCenters(user, curProfile);

  initStudents  (user, curProfile, centersMap);
  initDefaulters(user, centersMap);   // ATENÇÃO: user e centersMap

  setupHomeNav();
  show('home');
});

function setupHomeNav () {
  $('btn-nav-search').onclick    = () => show('students');
  $('btn-nav-add').onclick       = () => show('students', true);
  $('btn-nav-totals').onclick    = async () => {
    await loadTotals(curUser);
    show('totals');
  };
  $('btn-nav-defaulters').onclick = () => show('defaulters');
  $('btn-nav-centers').onclick    = () => show('centers');

  if (curProfile.role !== 'admin') {
    $('btn-nav-centers')?.classList.add('hidden');
  }

  $('logout-btn').onclick = () => signOut();
}

[
  ['back-home-students',   'home'],
  ['back-home-totals',     'home'],
  ['back-home-centers',    'home'],
  ['back-home-defaulters', 'home']
].forEach(([id, target]) => {
  const el = $(id);
  if (el) el.onclick = () => show(target);
});

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

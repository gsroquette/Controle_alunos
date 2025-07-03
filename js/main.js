import { initAuth }      from './auth.js';
import { getUserProfile } from './profile.js';
import { initCenters }   from './centers.js';
import { initStudents }  from './students.js';
import { initDefaulters }from './defaulters.js';
import { loadTotals }    from './totals.js';
import { $, }            from './utils.js';
import { showTotals, showDashboard } from './ui.js';

initAuth(async user=>{
  const profile = await getUserProfile(user.uid);

  /* Centros → depois alunos → depois inadimplentes */
  initCenters(user, profile, (centersMap)=>{
    initStudents   (user, profile, centersMap);
    initDefaulters (user, profile, centersMap);
  });

  /* Totais */
  $('btn-show-totals').onclick = async ()=>{
    await loadTotals(user);
    showTotals();
  };
  $('back-dashboard-2').onclick = ()=>showDashboard();

  /* Inadimplentes */
  $('btn-show-defaulters').onclick = ()=>{
    showSection('defaulters-section');
  };
  $('back-dashboard-3').onclick = ()=>showDashboard();
});

/* helper simples */
function showSection(id){
  ['dashboard-section','student-section',
   'totals-section','defaulters-section'
  ].forEach(sec=>$(sec).classList.toggle('hidden', sec!==id));
}

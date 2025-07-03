import { initAuth }      from './auth.js';
import { getUserProfile } from './profile.js';
import { initCenters }   from './centers.js';
import { initStudents }  from './students.js';
import { initDefaulters }from './defaulters.js';
import { loadTotals }    from './totals.js';
import { $, }            from './utils.js';
import { showTotals, showDashboard } from './ui.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let currentUser=null;     // para loadTotals etc.

initAuth(async user=>{
  currentUser = user;
  const profile = await getUserProfile(user.uid);

  /* Centros → alunos → inadimplentes */
  initCenters(user, profile, (centersMap)=>{
    initStudents   (user, profile, centersMap);
    initDefaulters (user, profile, centersMap);
    setupHomeNav(profile.role);
    showSection('home-section');            // abre Home após tudo pronto
  });
});

/* ========== navegação Home ========= */
function setupHomeNav(role){
  $('btn-nav-search').onclick = ()=>{ showDashboard(); };
  $('btn-nav-add').onclick = ()=>{
    showDashboard();
    // abre o <details> do formulário aluno
    document.querySelector('#dashboard-section details[open]')?.removeAttribute('open');
    document.querySelector('#dashboard-section details summary').click();
  };
  $('btn-nav-totals').onclick = async ()=>{
    await loadTotals(currentUser);
    showTotals();
  };
  $('btn-nav-defaulters').onclick = ()=>{
    showSection('defaulters-section');
  };
  $('btn-nav-logout').onclick = ()=>signOut();

  // secretaria não pode cadastrar aluno em outro centro, mas botão é ok
  // (admin e secretaria têm acesso igual nos botões atuais)
}

/* ========== botões dentro das telas ========= */
$('btn-show-totals').onclick = async ()=>{
  await loadTotals(currentUser);
  showTotals();
};
$('back-dashboard-2').onclick = ()=>showDashboard();

$('btn-show-defaulters').onclick = ()=>showSection('defaulters-section');
$('back-dashboard-3').onclick = ()=>showDashboard();

/* controla visibilidade das seções */
function showSection(id){
  ['home-section','dashboard-section','student-section',
   'totals-section','defaulters-section'
  ].forEach(sec=>$(sec).classList.toggle('hidden', sec!==id));
}

import { initAuth }     from './auth.js';
import { getUserProfile } from './profile.js';
import { initCenters }  from './centers.js';
import { initStudents } from './students.js';
import { loadTotals }   from './totals.js';
import { $, }           from './utils.js';
import { showTotals, showDashboard } from './ui.js';

/* ---------- Autenticação ---------- */
initAuth(async (user)=>{
  const profile = await getUserProfile(user.uid);          // {role:'admin'|'secretaria', centerId?}

  /* 1. Centros */
  initCenters(user, profile, async (centersMap)=>{
    /* 2. Alunos (depende dos Centros) */
    await initStudents(user, profile, centersMap);
  });

  /* Totais Mensais */
  $('btn-show-totals').onclick = async ()=>{
    await loadTotals(user);
    showTotals();
  };
  $('back-dashboard-2').onclick = ()=>showDashboard();
});

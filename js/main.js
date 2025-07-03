import { initAuth }    from './auth.js';
import { initCenters } from './centers.js';
import { initStudents } from './students.js';
import { loadTotals }  from './totals.js';
import { $, }         from './utils.js';
import { showTotals, showDashboard } from './ui.js';

let currentUser=null;

/* Inicia autenticação */
initAuth(async (user)=>{
  currentUser=user;

  /* 1. Carrega Centros → depois alunos */
  initCenters(user, ()=>initStudents(user));

  /* Totais mensais */
  $('btn-show-totals').onclick = async ()=>{
    await loadTotals(user);
    showTotals();
  };
  $('back-dashboard-2').onclick = ()=>showDashboard();
});

import { initAuth }   from './auth.js';
import { initStudents } from './students.js';
import { loadTotals } from './totals.js';
import { $, } from './utils.js';
import { showTotals } from './ui.js';

let currentUser=null;

/* inicia Auth; quando logar, carrega módulos */
initAuth(user=>{
  currentUser=user;
  initStudents(user);

  $('btn-show-totals').onclick = async ()=>{
    await loadTotals(user);
    showTotals();
  };
  $('back-dashboard-2').onclick = ()=> import('./ui.js').then(m=>m.showDashboard());
});

/* defaulters.js – lista alunos sem pagamento em mês/ano */
import { db } from './firebase.js';
import { $, sleep } from './utils.js';
import {
  collection, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let user=null, role='admin', userCenterId='', centersMap={};

/* ---------- init ---------- */
export function initDefaulters(u, profile, map){
  user         = u;
  role         = profile.role;
  userCenterId = profile.centerId || '';
  centersMap   = map;

  // popula select Centro
  const sel = $('defaulters-center');
  sel.length = 1;
  Object.entries(map).forEach(([id,name])=>{
    sel.appendChild(new Option(name,id));
  });

  // restrição secretaria
  if(role!=='admin'){
    sel.value    = userCenterId;
    sel.disabled = true;
  }

  $('btn-load-defaulters').onclick = () => loadDefaulters();
}

/* ---------- buscar inadimplentes ---------- */
async function loadDefaulters(){
  const tbody = $('defaulters-body');
  tbody.innerHTML =
    '<tr><td class="p-2" colspan="2">Carregando…</td></tr>';

  const monthInput = $('defaulters-month').value;
  if(!monthInput) return alert('Selecione o Mês/Ano.');

  const [year,monthStr] = monthInput.split('-');
  const month = +monthStr;

  const centerFilter = role!=='admin'
    ? userCenterId
    : $('defaulters-center').value;

  /* 1. Busca todos alunos (opcionalmente filtrados por centro) */
  let q = collection(db,'users',user.uid,'students');
  if(centerFilter){
    q = query(q, where('centerId','==',centerFilter));
  }
  const studentsSnap = await getDocs(q);

  /* 2. Para cada aluno, verifica se existe pagamento do mês */
  const results = [];
  for(const stu of studentsSnap.docs){
    const payCol = collection(db,'users',user.uid,'students',stu.id,'payments');
    const pSnap  = await getDocs(
      query(payCol,
            where('month','==',month),
            where('year','==',+year))
    );
    if(pSnap.empty){
      results.push(stu.data());
    }
  }

  /* 3. Exibe */
  tbody.innerHTML = '';
  if(!results.length){
    tbody.innerHTML =
      '<tr><td class="p-2" colspan="2">Nenhum inadimplente 🎉</td></tr>';
    return;
  }
  results.forEach(r=>{
    tbody.insertAdjacentHTML('beforeend',
      `<tr>
         <td class="p-2 border-t">${r.name}</td>
         <td class="p-2 border-t">${r.centerName}</td>
       </tr>`);
  });
}

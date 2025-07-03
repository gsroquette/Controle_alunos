import {
  collection, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase.js';
import { $ } from './utils.js';

/* -------------------------------------------------- */
/* 1. INICIALIZAÇÃO – conecta UI                      */
/* -------------------------------------------------- */
export function initDefaulters(currentUser, profile, centersMap){

  /* preenche select de centros */
  const selCenter = $('defaulters-center');
  selCenter.innerHTML = '<option value="">Todos os Centros</option>';
  centersMap.forEach( (c,id) =>{
    const opt=document.createElement('option');
    opt.value=id; opt.textContent=c.name;
    selCenter.appendChild(opt);
  });

  /* restrição para secretaria: só vê o próprio centro */
  if(profile.role==='secretaria'){
    selCenter.value = profile.centerId;
    selCenter.disabled = true;
  }

  /* botão buscar */
  $('btn-load-defaulters').onclick = async ()=>{
    const ym   = $('defaulters-month').value;
    if(!ym){ alert('Escolha mês/ano'); return; }

    const [yearStr,monthStr] = ym.split('-');
    const month = Number(monthStr);
    const year  = Number(yearStr);

    await loadDefaulters(
      currentUser,
      month,
      year,
      selCenter.value
    );
  };
}

/* -------------------------------------------------- */
/* 2. CARREGA INADIMPLENTES                           */
/* -------------------------------------------------- */
export async function loadDefaulters(user, month, year, centerId){
  const tbody=$('defaulters-body');
  tbody.innerHTML='<tr><td class="p-2">Carregando...</td></tr>';

  /* alunos do usuário */
  let stQuery=query(collection(db,'users',user.uid,'students'));
  if(centerId) stQuery=query(stQuery, where('centerId','==',centerId));

  const students=await getDocs(stQuery);
  tbody.innerHTML='';

  for(const st of students.docs){
    const s=st.data();
    if(s.isScholarship) continue;          // ignora bolsistas

    const paySnap=await getDocs(query(
      collection(db,'users',user.uid,'students',st.id,'payments'),
      where('month','==',month),
      where('year' ,'==',year)
    ));
    if(paySnap.empty){
      tbody.insertAdjacentHTML('beforeend',
        `<tr><td class="p-2 border-t">${s.name}</td>
             <td class="p-2 border-t">${centerId ? '' : (centersMap.get(s.centerId)?.name || '')}</td></tr>`);
    }
  }

  if(!tbody.children.length){
    tbody.innerHTML='<tr><td class="p-2">Nenhum inadimplente.</td></tr>';
  }
}

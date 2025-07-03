/* centers.js */
import { db } from './firebase.js';
import { $ }  from './utils.js';
import {
  collection, addDoc, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let user=null, role='admin', userCenterId='';

/* ---------- INIT ---------- */
export async function initCenters(u, profile, onReady){
  user = u;
  role = profile.role;
  userCenterId = profile.centerId || '';

  if(role !== 'admin'){
    // esconde todo o bloco de criar Centro
    $('center-wrapper').classList.add('hidden');
  }else{
    $('center-form').addEventListener('submit', saveCenter);
  }

  const map = await loadCenters();   // preenche select & filtro
  onReady(map);
}

/* ---------- Salvar Centro ---------- */
async function saveCenter(e){
  e.preventDefault();
  const name    = $('center-name').value.trim();
  const address = $('center-address').value.trim();
  const manager = $('center-manager').value.trim();
  if(!name||!address||!manager) return alert('Preencha todos os campos!');

  await addDoc(collection(db,'users',user.uid,'centers'),{ name,address,manager });
  $('center-form').reset();
  await loadCenters();
  alert('Centro salvo!');
}

/* ---------- Carregar Centros ---------- */
export async function loadCenters(){
  const selStudent = $('student-center');
  const selFilter  = $('filter-center');

  selStudent.length = 1;
  selFilter.length  = 1;

  const q = query(
    collection(db,'users',user.uid,'centers'),
    orderBy('name')
  );
  const snap = await getDocs(q);

  snap.forEach(doc=>{
    const { name } = doc.data();
    const opt1 = new Option(name, doc.id);
    const opt2 = new Option(name, doc.id);
    selStudent.appendChild(opt1);
    selFilter.appendChild(opt2);
  });

  // restrições para secretaria
  if(role !== 'admin'){
    selFilter.value       = userCenterId;   // filtro fixo
    selFilter.disabled    = true;

    selStudent.value      = userCenterId;   // select fixo
    selStudent.disabled   = true;
  }

  return Object.fromEntries(snap.docs.map(d=>[d.id,d.data().name]));
}

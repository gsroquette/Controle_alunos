/* centers.js ---------------------------------------------------------- */
import { db } from './firebase.js';
import { $ }  from './utils.js';
import {
  collection, addDoc, getDocs, query, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

let user          = null;
let role          = 'admin';
let userCenterId  = '';

/* ---------------- INIT ---------------- */
export async function initCenters(u, profile){
  user         = u;
  role         = profile.role;
  userCenterId = profile.centerId || '';

  if (role !== 'admin'){
    $('center-wrapper')?.classList.add('hidden');
  } else {
    $('center-form')?.addEventListener('submit', saveCenter);
  }

  /* devolve Map<id,{name}> */
  return await loadCenters();
}

/* ---------- Salvar Centro ---------- */
async function saveCenter(e){
  e.preventDefault();
  const name    = $('center-name').value.trim();
  const address = $('center-address').value.trim();
  const manager = $('center-manager').value.trim();
  if(!name || !address || !manager){
    alert('Preencha todos os campos!');
    return;
  }

  await addDoc(collection(db,'users',user.uid,'centers'), {name,address,manager});
  e.target.reset();
  await loadCenters();              // repopula selects
  alert('Centro salvo!');
}

/* ---------- Carregar Centros ---------- */
export async function loadCenters(){
  const selStudent = $('student-center');
  const selFilter  = $('filter-center');

  /* mantém o 1º option */
  if (selStudent) selStudent.length = 1;
  if (selFilter)  selFilter.length  = 1;

  const q = query(
    collection(db,'users',user.uid,'centers'),
    orderBy('name')
  );
  const snap = await getDocs(q);

  snap.forEach(doc=>{
    const {name} = doc.data();
    const opt1 = new Option(name, doc.id);
    const opt2 = new Option(name, doc.id);
    selStudent?.appendChild(opt1);
    selFilter ?.appendChild(opt2);
  });

  /* secretaria restrita ao seu centro */
  if (role !== 'admin'){
    selFilter ?.setAttribute('disabled','');
    selStudent?.setAttribute('disabled','');
    selFilter .value = userCenterId;
    selStudent.value = userCenterId;
  }

  /* devolve Map */
  return new Map(snap.docs.map(d => [d.id, {name: d.data().name}]));
}

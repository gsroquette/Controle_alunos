/* centers.js */
import { db } from './firebase.js';
import { $ }  from './utils.js';
import {
  collection, addDoc, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let user = null;

/* ---------- Init ---------- */
export function initCenters(u, onCentersLoaded){
  user = u;

  $('center-form').addEventListener('submit', saveCenter);

  loadCenters().then(onCentersLoaded);   // carrega d-pois popula selects
}

/* ---------- Salvar ---------- */
async function saveCenter(e){
  e.preventDefault();
  const name = $('center-name').value.trim();
  if(!name) return;

  await addDoc(collection(db,'users',user.uid,'centers'),{ name });
  $('center-form').reset();
  await loadCenters();
  alert('Centro salvo!');
}

/* ---------- Carregar ---------- */
export async function loadCenters(){
  const selectStudent = $('student-center');
  const selectFilter  = $('filter-center');

  // zera as opções (deixa 1ª linha)
  selectStudent.length = 1;
  selectFilter.length  = 1;

  const q = query(
    collection(db,'users',user.uid,'centers'),
    orderBy('name')
  );
  const snap = await getDocs(q);
  snap.forEach(doc=>{
    const { name } = doc.data();
    const opt1 = new Option(name, doc.id);
    const opt2 = new Option(name, doc.id);
    selectStudent.appendChild(opt1);
    selectFilter.appendChild(opt2);
  });

  // retorna mapa id->name
  return Object.fromEntries(snap.docs.map(d=>[d.id,d.data().name]));
}

/* centers.js */
import { db } from './firebase.js';
import { $ }  from './utils.js';
import {
  collection, addDoc, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let user = null;

/* ---------- INIT ---------- */
export function initCenters(u, onReady){
  user = u;
  $('center-form').addEventListener('submit', saveCenter);
  loadCenters().then(onReady);      // popula selects e devolve mapa
}

/* ---------- Salvar ---------- */
async function saveCenter(e){
  e.preventDefault();

  const name      = $('center-name').value.trim();
  const address   = $('center-address').value.trim();
  const manager   = $('center-manager').value.trim();
  if(!name || !address || !manager) return alert('Preencha todos os campos!');

  await addDoc(collection(db,'users',user.uid,'centers'),{
    name, address, manager
  });

  $('center-form').reset();
  await loadCenters();
  alert('Centro salvo!');
}

/* ---------- Carregar ---------- */
export async function loadCenters(){
  const selStudent = $('student-center');
  const selFilter  = $('filter-center');

  selStudent.length = 1;  // mantém 1ª opção
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

  /* devolve {id: name} */
  return Object.fromEntries(snap.docs.map(d=>[d.id,d.data().name]));
}

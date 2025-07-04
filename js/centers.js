/* centers.js ------------------------------------------------------- */
import { db } from './firebase.js';
import { $  } from './utils.js';
import {
  collection, addDoc, getDoc,
  getDocs, query, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

let role = 'admin';
let userCenterId = '';

export async function initCenters(profile = { role:'admin', centerId:'' }) {
  role         = profile.role;
  userCenterId = profile.centerId || '';

  if (role !== 'admin') {
    $('center-wrapper')?.classList.add('hidden');
  } else {
    /* listener só 1 vez ― evita duplicar ao navegar */
    const form = $('center-form');
    if (form && !form.dataset.bound) {
      form.addEventListener('submit', saveCenter, { once:false });
      form.dataset.bound = 'true';
    }
  }
  return await loadCenters();
}

/* ---------- SALVAR ---------- */
let saving = false;

async function saveCenter(e) {
  e.preventDefault();
  if (saving) return;               // bloqueia duplo-clique
  saving = true;

console.clear();                               // limpa o console
console.log('%cSUBMIT disparado', 'color:gold');
console.trace();                               // mostra a pilha

  const name    = $('center-name').value.trim();
  const address = $('center-address').value.trim();
  const manager = $('center-manager').value.trim();

  if (!name || !address || !manager) {
    alert('Preencha todos os campos!');
    saving = false;
    return;
  }

  try {
    const ref = await addDoc(collection(db,'centers'), { name, address, manager });
    console.log('Centro salvo → ID:', ref.id);
    alert('Centro salvo!');
    e.target.reset();
    await loadCenters();
  } catch (err) {
    console.error('Falha ao gravar centro:', err);
    alert('Erro ao salvar centro:\n' + err.message);
  } finally {
    saving = false;
  }
}

/* ---------- CARREGAR / POPULAR SELECTS ---------- */
export async function loadCenters() {
  const selStudent = $('student-center');
  const selFilter  = $('filter-center');
  selStudent && (selStudent.length = 1);
  selFilter  && (selFilter.length  = 1);

  const snap = await getDocs(query(collection(db,'centers'), orderBy('name')));
  snap.forEach(d => {
    const { name } = d.data();
    selStudent?.appendChild(new Option(name, d.id));
    selFilter ?.appendChild(new Option(name, d.id));
  });

  /* secretaria: trava selects */
  if (role !== 'admin' && userCenterId) {
    if (!snap.docs.some(d=>d.id===userCenterId)) {
      const solo = await getDoc(collection(db,'centers'), userCenterId);
      if (solo.exists()) {
        const { name } = solo.data();
        selStudent?.appendChild(new Option(name,userCenterId));
        selFilter ?.appendChild(new Option(name,userCenterId));
      }
    }
    selStudent?.setAttribute('disabled','');
    selFilter ?.setAttribute('disabled','');
    selStudent && (selStudent.value = userCenterId);
    selFilter  && (selFilter.value  = userCenterId);
  }
  return new Map(snap.docs.map(d=>[d.id,{ name:d.data().name }]));
}

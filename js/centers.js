/* centers.js ---------------------------------------------------------- */
import { db } from './firebase.js';
import { $ }  from './utils.js';
import {
  collection, addDoc, getDocs, query, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

let user = null;
let role = 'admin';
let userCenterId = '';

/* ---------------- INIT ---------------- */
export async function initCenters(
  u,
  profile = { role: 'admin', centerId: '' }
) {
  user         = u;
  role         = profile.role;
  userCenterId = profile.centerId || '';

  if (role !== 'admin') {
    $('center-wrapper')?.classList.add('hidden');
  } else {
    $('center-form')?.addEventListener('submit', saveCenter);
  }

  return await loadCenters();         // devolve Map<id,{name}>
}

/* ---------- salvar novo centro ---------- */
async function saveCenter(e) {
  e.preventDefault();
  const name    = $('center-name').value.trim();
  const address = $('center-address').value.trim();
  const manager = $('center-manager').value.trim();

  if (!name || !address || !manager) {
    alert('Preencha todos os campos!');
    return;
  }

  await addDoc(
    collection(db, 'users', user.uid, 'centers'),
    { name, address, manager }
  );

  e.target.reset();
  await loadCenters();
  alert('Centro salvo!');
}

/* ---------- carregar & popular selects ---------- */
export async function loadCenters() {
  const selStudent = $('student-center');
  const selFilter  = $('filter-center');

  selStudent && (selStudent.length = 1);
  selFilter  && (selFilter.length  = 1);

  const snap = await getDocs(
    query(collection(db, 'users', user.uid, 'centers'), orderBy('name'))
  );

  snap.forEach((d) => {
    const { name } = d.data();
    selStudent?.appendChild(new Option(name, d.id));
    selFilter ?.appendChild(new Option(name, d.id));
  });

  /* restrições secretaria */
  if (role !== 'admin') {
    selFilter ?.setAttribute('disabled', '');
    selStudent?.setAttribute('disabled', '');
    selFilter .value = userCenterId;
    selStudent.value = userCenterId;
  }

  /* ------ retorno: Map<id,{name}> ------ */
  return new Map(
    snap.docs.map((d) => [d.id, { name: d.data().name }]) // <<< aqui estava o erro
  );
}

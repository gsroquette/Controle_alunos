/* centers.js -------------------------------------------------------
 *  Cadastro e listagem de Centros (coleção raiz /centers)
 * ---------------------------------------------------------------- */
import { db } from './firebase.js';
import { $  } from './utils.js';
import {
  collection, addDoc, getDoc,
  getDocs, query, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

let role = 'admin';
let userCenterId = '';

/* ================================================================ */
/*  INIT – chamado por main.js                                      */
/* ================================================================ */
export async function initCenters(profile = { role: 'admin', centerId: '' }) {
  role         = profile.role;
  userCenterId = profile.centerId || '';

  if (role !== 'admin') {
    $('center-wrapper')?.classList.add('hidden');
  } else {
    /* garante um único listener, ligado quando o form já existe */
    const form = $('center-form');
    if (form && !form.dataset.bound) {
      form.addEventListener('submit', saveCenter, { once: false });
      form.dataset.bound = 'true';
    }
  }
  return await loadCenters();
}

/* ================================================================ */
/*  SALVAR CENTRO                                                   */
/* ================================================================ */
let saving = false;

async function saveCenter(e) {
  e.preventDefault();
  if (saving) return;                 // bloqueia duplo-clique
  saving = true;

  /* ------------ lê via FormData (sempre pega o form certo) ------- */
  const fd      = new FormData(e.target);
  const name    = (fd.get('center-name')    || '').trim();
  const address = (fd.get('center-address') || '').trim();
  const manager = (fd.get('center-manager') || '').trim();

  if (!name || !address || !manager) {
    alert('Preencha todos os campos!');
    saving = false;
    return;
  }

  try {
    await addDoc(collection(db, 'centers'), { name, address, manager });
    alert('Centro salvo!');
    await loadCenters();              // repopula selects
    e.target.reset();                 // limpa só depois de gravar
  } catch (err) {
    console.error('Falha ao gravar centro:', err);
    alert('Erro ao salvar centro:\n' + err.message);
  } finally {
    saving = false;
  }
}

/* ================================================================ */
/*  LOAD CENTERS – popular selects & devolver Map<id,{name}>        */
/* ================================================================ */
export async function loadCenters() {
  const selStudent = $('student-center');
  const selFilter  = $('filter-center');
  selStudent && (selStudent.length = 1);
  selFilter  && (selFilter.length  = 1);

  const snap = await getDocs(
    query(collection(db, 'centers'), orderBy('name'))
  );

  snap.forEach(docSnap => {
    const { name } = docSnap.data();
    selStudent?.appendChild(new Option(name, docSnap.id));
    selFilter ?.appendChild(new Option(name, docSnap.id));
  });

  /* secretaria: trava selects */
  if (role !== 'admin' && userCenterId) {
    if (!snap.docs.some(d => d.id === userCenterId)) {
      const solo = await getDoc(collection(db, 'centers'), userCenterId);
      if (solo.exists()) {
        const { name } = solo.data();
        selStudent?.appendChild(new Option(name, userCenterId));
        selFilter ?.appendChild(new Option(name, userCenterId));
      }
    }
    selStudent?.setAttribute('disabled', '');
    selFilter ?.setAttribute('disabled', '');
    selStudent && (selStudent.value = userCenterId);
    selFilter  && (selFilter.value  = userCenterId);
  }

  return new Map(snap.docs.map(d => [d.id, { name: d.data().name }]));
}

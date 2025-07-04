/* centers.js -------------------------------------------------------
 *  Cadastro e listagem de Centros
 *  Estrutura centralizada: /centers/{centerId}
 * ----------------------------------------------------------------- */
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
    /* garante um único listener, adicionado quando o form já existe */
    setTimeout(() => {
      const form = $('center-form');
      if (form && !form.dataset.bound) {
        form.addEventListener('submit', saveCenter, { once: true }); // ← evita duplos
        form.dataset.bound = 'true';
      }
    }, 0);                          // 0 ms já basta para o DOM estar renderizado
  }
  return await loadCenters();
}

/* ================================================================ */
/*  SALVAR CENTRO                                                   */
/* ================================================================ */
let saving = false;

async function saveCenter(e) {
  e.preventDefault();
  if (saving) return;               // bloqueia duplo-clique
  saving = true;

  const name    = $('center-name')   ?.value.trim() || '';
  const address = $('center-address')?.value.trim() || '';
  const manager = $('center-manager')?.value.trim() || '';

  if (!name || !address || !manager) {
    alert('Preencha todos os campos!');
    saving = false;
    return;
  }

  try {
    await addDoc(collection(db, 'centers'), { name, address, manager });
    alert('Centro salvo!');
    await loadCenters();            // repopula selects
    e.target.reset();               // só limpa depois de gravar
  } catch (err) {
    console.error('Falha ao gravar centro:', err);
    alert('Erro ao salvar centro:\n' + err.message);
  } finally {
    saving = false;
  }
}

/* ================================================================ */
/*  LOAD CENTERS — popular selects & devolver Map<id,{name}>        */
/* ================================================================ */
export async function loadCenters() {
  const selStudent = $('student-center');
  const selFilter  = $('filter-center');

  selStudent && (selStudent.length = 1);   // mantém placeholder
  selFilter  && (selFilter.length  = 1);

  /* lista completa, ordenada */
  const snap = await getDocs(
    query(collection(db, 'centers'), orderBy('name'))
  );

  snap.forEach(docSnap => {
    const { name } = docSnap.data();
    selStudent?.appendChild(new Option(name, docSnap.id));
    selFilter ?.appendChild(new Option(name, docSnap.id));
  });

  /* ajustes se o usuário for secretaria */
  if (role !== 'admin' && userCenterId) {

    /* se o centro da secretaria não veio na lista (inconsistência rara) */
    if (!snap.docs.some(d => d.id === userCenterId)) {
      const solo = await getDoc(collection(db, 'centers'), userCenterId);
      if (solo.exists()) {
        const { name } = solo.data();
        selStudent?.appendChild(new Option(name, userCenterId));
        selFilter ?.appendChild(new Option(name, userCenterId));
      }
    }

    /* trava selects */
    selStudent?.setAttribute('disabled', '');
    selFilter ?.setAttribute('disabled', '');
    selStudent && (selStudent.value = userCenterId);
    selFilter  && (selFilter.value  = userCenterId);
  }

  /* devolve Map com id → { name } */
  return new Map(
    snap.docs.map(d => [d.id, { name: d.data().name }])
  );
}

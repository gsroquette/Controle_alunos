/* centers.js  ------------------------------------------------------- */
import { db } from './firebase.js';
import { $  } from './utils.js';
import {
  collection, doc, addDoc, getDoc,
  getDocs, query, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

let role          = 'admin';   // 'admin' | 'secretaria'
let userCenterId  = '';        // centro vinculado ao usuário (se secretaria)

/* ====================================================================
 * INIT  ──────────────────────────────────────────────────────────────
 * Chamado pelo main.js:       centersMap = await initCenters(profile)
 * Retorna Map<id,{name}>
 * ================================================================== */
export async function initCenters(profile = { role: 'admin', centerId: '' })
{
  role         = profile.role;
  userCenterId = profile.centerId || '';

  // Se não for admin, oculta o formulário "Novo Centro"
  if (role !== 'admin') {
    $('center-wrapper')?.classList.add('hidden');
  } else {
    $('center-form')?.addEventListener('submit', saveCenter);
  }

  // Carrega a lista (e popula selects) — devolve Map
  return await loadCenters();
}

/* ====================================================================
 * SALVAR NOVO CENTRO  (apenas admin)
 * ================================================================== */
async function saveCenter(e) {
  e.preventDefault();

  const name    = $('center-name').value.trim();
  const address = $('center-address').value.trim();
  const manager = $('center-manager').value.trim();

  if (!name || !address || !manager) {
    alert('Preencha todos os campos!');
    return;
  }

  // ► agora grava DIRECT na coleção raiz "centers"
  await addDoc(collection(db, 'centers'), { name, address, manager });

  e.target.reset();
  await loadCenters();          // repopula selects
  alert('Centro salvo!');
}

/* ====================================================================
 * CARREGAR CENTROS  ➜  popular selects  ➜  retornar Map<id,{name}>
 * ================================================================== */
export async function loadCenters() {

  const selStudent = $('student-center');
  const selFilter  = $('filter-center');

  // limpa selects (mantém placeholder)
  selStudent && (selStudent.length = 1);
  selFilter  && (selFilter.length  = 1);

  /* ---------- lista completa (admin) ---------- */
  const snap = await getDocs(
    query(collection(db, 'centers'), orderBy('name'))
  );

  snap.forEach(docSnap => {
    const { name } = docSnap.data();
    selStudent?.appendChild(new Option(name, docSnap.id));
    selFilter ?.appendChild(new Option(name, docSnap.id));
  });

  /* ---------- ajustes p/ secretaria ---------- */
  if (role !== 'admin' && userCenterId) {

    // Se o centro da secretaria não apareceu, busca individualmente
    if (!snap.docs.some(d => d.id === userCenterId)) {
      try {
        const solo = await getDoc(doc(db, 'centers', userCenterId));
        if (solo.exists()) {
          const { name } = solo.data();
          selStudent?.appendChild(new Option(name, userCenterId));
          selFilter ?.appendChild(new Option(name, userCenterId));
        }
      } catch (err) {
        console.warn('Falha ao buscar centro da secretaria:', err);
      }
    }

    // trava selects
    selStudent?.setAttribute('disabled', '');
    selFilter ?.setAttribute('disabled', '');
    selStudent && (selStudent.value = userCenterId);
    selFilter  && (selFilter.value  = userCenterId);
  }

  /* ---------- devolve Map<id,{name}> ---------- */
  return new Map(
    snap.docs.map(d => [d.id, { name: d.data().name }])
  );
}

/* students.js  ------------------------------------------------------ */
import {
  collection, collectionGroup, query, where, orderBy, limit,
  startAfter, getDocs, addDoc, updateDoc, doc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db }                 from './firebase.js';
import { $, uploadImage }     from './utils.js';
import { showStudentDetail }  from './ui.js';

/* ---------------- estado ---------------- */
const PAGE = 20;
let lastDoc = null;
let reachedEnd = false;

let currentUser, centersMap, currentProfile;
let isAdmin = false;

/* ===================================================================
 * 1. INIT
 * =================================================================*/
export function initStudents(user, profile, cMap) {

  currentUser    = user;
  currentProfile = profile;
  isAdmin        = profile.role === 'admin';
  centersMap     = (cMap instanceof Map) ? cMap : new Map(Object.entries(cMap));

  /* … (todo o código de inicialização permanece igual) … */

  refresh(true);
}

/* ===================================================================
 * 3. LISTAGEM + paginação
 * =================================================================*/
function buildQuery() {

  const centerId = $('filter-center').value;

  /* ---------- ADMIN: busca em TODAS as contas ---------- */
  if (isAdmin) {
    let q = collectionGroup(db, 'students');

    if (centerId) q = query(q, where('centerId', '==', centerId));
    // sem paginação: datasets costumam ser pequenos; simplifica índices
    return { q, paginated: false };
  }

  /* ---------- USUÁRIO / SECRETARIA: apenas próprio UID ---------- */
  if (!centerId) {
    let q = query(
      collection(db, 'users', currentUser.uid, 'students'),
      orderBy('name'),
      limit(PAGE)
    );
    if (lastDoc) q = query(q, startAfter(lastDoc));
    return { q, paginated: true };
  }

  /* filtrando centro (sem paginação) */
  const q = query(
    collection(db, 'users', currentUser.uid, 'students'),
    where('centerId', '==', centerId)
  );
  return { q, paginated: false };
}

/* ===================================================================
 * 4. SALVAR (add / update)
 * =================================================================*/
async function saveStudent() {
  /* payload permanece igual … */

  const baseCol = isAdmin
    ? collection(db, 'users', currentUser.uid, 'students')  // admin cria no próprio UID
    : collection(db, 'users', currentUser.uid, 'students');

  if (editingId) {
    await updateDoc(doc(db, baseCol.path, editingId), payload);
  } else {
    await addDoc(baseCol, { ...payload, createdAt: serverTimestamp() });
  }
}

/* ===================================================================
 * 3. LISTAGEM + paginação
 * =================================================================*/
function buildQuery() {

  const centerId = $('filter-center').value;

  /* -----------------------------------------------------------------
   * CASO 1 – sem filtro de centro → usa orderBy + paginação
   * ----------------------------------------------------------------*/
  if (!centerId) {
    let q = query(
      collection(db, 'users', currentUser.uid, 'students'),
      orderBy('name'),
      limit(PAGE)
    );
    if (lastDoc) q = query(q, startAfter(lastDoc));
    return { q, paginated:true };
  }

  /* -----------------------------------------------------------------
   * CASO 2 – filtrando por centro
   *         → Firestore exige índice composto se usar orderBy.
   *           Para simplificar (e evitar erros) buscamos tudo do
   *           centro e fazemos paginação/ordenação no cliente.
   * ----------------------------------------------------------------*/
  const q = query(
    collection(db, 'users', currentUser.uid, 'students'),
    where('centerId', '==', centerId)
  );
  return { q, paginated:false };
}

async function refresh(reset = false) {

  if (reset) {
    lastDoc     = null;
    reachedEnd  = false;
    $('btn-prev').disabled = true;
  }
  if (reachedEnd) return;

  const { q, paginated } = buildQuery();
  const snap = await getDocs(q);

  renderList(snap.docs, reset, !paginated);

  if (paginated) {
    if (snap.size < PAGE) reachedEnd = true;
    else                  lastDoc = snap.docs[snap.docs.length - 1];
    $('btn-next').disabled = reachedEnd;
  } else {
    // sem paginação quando filtrado por centro
    reachedEnd = true;
    $('btn-next').disabled = true;
  }
}

function renderList(docs, reset, sortClientSide) {

  const term        = $('search-input').value.trim().toLowerCase();
  const onlyScholar = $('filter-scholar').checked;
  const list        = $('student-list');

  if (reset) list.innerHTML = '';

  let arr = docs;
  if (sortClientSide) {
    // ordena alfabeticamente no cliente
    arr = [...docs].sort((a,b) =>
      a.data().name.localeCompare(b.data().name,'pt-BR')
    );
  }

  arr.forEach(doc => {

    const s = doc.data();

    if (onlyScholar && !s.isScholarship) return;
    if (term && !s.name.toLowerCase().includes(term)) return;

    const li = document.createElement('li');
    li.className =
      'bg-white p-3 rounded shadow flex justify-between cursor-pointer';

    li.innerHTML = `
      <span>
        ${s.name}
        ${s.isScholarship
          ? '<span class="text-xs text-violet-700 font-semibold"> (Bolsista)</span>'
          : ''}
      </span>
      <span class="text-sm text-gray-500">
        ${centersMap.get(s.centerId)?.name || ''}
      </span>`;

    li.onclick = () => {
      currentDetailId   = doc.id;
      currentDetailData = s;
      showStudentDetail(doc.id, s);
    };

    list.appendChild(li);
  });
}

/* ---------------- paginação simples ---------------- */
function pagePrev() { lastDoc = null; refresh(true); }
function pageNext() { refresh(false); }

/* exporta helper para ui.js */
export { fillCenterSelects };

/* students.js ------------------------------------------------------
 *  Lista, cadastro e edição de alunos + integração com pagamentos
 *  Estrutura centralizada:
 *    centers/{centerId}
 *    students/{studentId}
 *    students/{studentId}/payments/{paymentId}
 * ----------------------------------------------------------------- */

import {
  collection, query, where, orderBy, limit,
  startAfter, getDocs, addDoc, updateDoc, doc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db }                 from './firebase.js';
import { $, uploadImage }     from './utils.js';
import { showStudentDetail,
         hideStudentDetail }  from './ui.js';
import { listPayments }       from './payments.js';

/* ---------------- estado ---------------- */
const PAGE = 20;
let lastDoc = null;
let reachedEnd = false;
let currentUser, currentProfile, centersMap;
let isAdmin = false;
let editingId = null;
let currentDetailId = null;
let currentDetailData = null;

/* helper para eventos seguros */
const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };

/* ===================================================================
 * 1. INIT — chamado por main.js
 * =================================================================*/
export function initStudents(user, profile, cMap) {
  currentUser    = user;
  currentProfile = profile;
  isAdmin        = profile.role === 'admin';
  centersMap     = cMap instanceof Map ? cMap : new Map(Object.entries(cMap));

  fillCenterSelects();

  $('search-input') ?.addEventListener('input',  () => refresh(true));
  $('filter-center')?.addEventListener('change', () => refresh(true));
  $('filter-scholar')?.addEventListener('change', () => refresh(true));
  on('btn-prev', () => { lastDoc = null; refresh(true); });
  on('btn-next', () => refresh(false));

  /* ===== Botões de navegação dentro da UI de alunos ===== */
  on('back-to-students', hideStudentDetail);

  on('btn-edit-student', () => {
    if (!currentDetailId || !currentDetailData) return;

    // 1. Pré-preenche o formulário
    const s = currentDetailData;
    $('student-center').value    = s.centerId;
    $('student-name').value      = s.name;
    $('student-contact').value   = s.contact;
    $('student-class').value     = s.class;
    $('student-guardian').value  = s.guardian;
    $('student-notes').value     = s.notes;
    $('student-scholar').checked = !!s.isScholarship;
    $('student-fee').value       = s.fee ?? '';

    if (s.photoURL) {
      $('preview-photo').src = s.photoURL;
      $('preview-photo').classList.remove('hidden');
    } else {
      $('preview-photo').classList.add('hidden');
    }

    // 2. Marca para update
    editingId = currentDetailId;

    // 3. Mostra a tela de edição
    $('student-section')      ?.classList.add   ('hidden');
    $('dashboard-section')    ?.classList.add   ('hidden');
    $('add-student-section')  ?.classList.remove('hidden');
  });

  /* ===== formulário ===== */
  const form = $('student-form');
  if (form) form.onsubmit = async e => {
    e.preventDefault();

    /* botão de submit — tolera ausência de type="submit" */
    const btn =
      form.querySelector('button[type="submit"]') ||
      form.querySelector('button');
    const spinner = $('saving-spinner');

    btn && (btn.disabled = true);
    spinner?.classList.remove('hidden');

    try {
      await saveStudent();
      form.reset();
      editingId = null;
      refresh(true);
      alert('Aluno salvo!');
      // volta para a lista
      $('add-student-section')?.classList.add   ('hidden');
      $('dashboard-section')  ?.classList.remove('hidden');
    } catch (err) {
      alert('Erro ao salvar aluno:\n' + err.message);
    } finally {
      spinner?.classList.add('hidden');
      btn && (btn.disabled = false);
    }
  };

  /* foto preview */
  $('student-photo')?.addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) {
      $('preview-photo').src = URL.createObjectURL(f);
      $('preview-photo').classList.remove('hidden');
    }
  });

  /* botão pagamento */
  on('btn-add-payment', () => {
    if (!currentDetailId || !currentDetailData) return;
    import('./payments.js').then(({ addPayment }) => {
      addPayment(
        currentDetailId,                // studentId
        currentDetailData.centerId,     // centerId (regras)
        currentDetailData.fee || 0      // valor da mensalidade
      );
    });
  });

  refresh(true);
}

/* ===================================================================
 * 2. CONSULTA — monta query
 * =================================================================*/
function buildQuery() {
  const centerFilter = $('filter-center')?.value || '';

  /* ADMIN */
  if (isAdmin) {
    let q = collection(db, 'students');
    if (centerFilter) q = query(q, where('centerId', '==', centerFilter));
    return { q, paginated: false };
  }

  /* SECRETARIA */
  const secCenter = currentProfile.centerId;
  let q = query(collection(db, 'students'), where('centerId', '==', secCenter));
  q = query(q, orderBy('name'), limit(PAGE));
  if (lastDoc) q = query(q, startAfter(lastDoc));
  return { q, paginated: true };
}

/* ===================================================================
 * 3. LISTAGEM
 * =================================================================*/
async function refresh(reset = false) {
  if (reset) {
    lastDoc = null;
    reachedEnd = false;
    $('btn-prev')?.setAttribute('disabled', '');
  }
  if (reachedEnd) return;

  const { q, paginated } = buildQuery();
  const snap = await getDocs(q);
  renderList(snap.docs, reset, !paginated);

  if (paginated) {
    if (snap.size < PAGE) reachedEnd = true;
    else lastDoc = snap.docs[snap.docs.length - 1];
    $('btn-next').disabled = reachedEnd;
  } else {
    reachedEnd = true;
    $('btn-next').disabled = true;
  }
}

function renderList(docs, reset, sortClient) {
  const term  = $('search-input')?.value.trim().toLowerCase() || '';
  const onlyScholar = $('filter-scholar')?.checked;
  const list = $('student-list');
  if (!list) return;
  if (reset) list.innerHTML = '';

  const arr = sortClient
    ? [...docs].sort((a,b)=>a.data().name.localeCompare(b.data().name,'pt-BR'))
    : docs;

  arr.forEach(d => {
    const s = d.data();
    if (onlyScholar && !s.isScholarship) return;
    if (term && !s.name.toLowerCase().includes(term)) return;

    const li = document.createElement('li');
    li.className = 'bg-white p-3 rounded shadow flex justify-between cursor-pointer';
    li.innerHTML = `
      <span>${s.name}${s.isScholarship ? ' <span class="text-xs text-violet-700 font-semibold">(Bolsista)</span>' : ''}</span>
      <span class="text-sm text-gray-500">${centersMap.get(s.centerId)?.name || ''}</span>`;
    li.onclick = () => {
      currentDetailId   = d.id;
      currentDetailData = s;
      showStudentDetail(d.id, s);
      listPayments(d.id);      // studentId
    };
    list.appendChild(li);
  });
}

/* ===================================================================
 * 4. SALVAR
 * =================================================================*/
async function saveStudent() {
  const payload = {
    ownerUid       : currentUser.uid,
    name           : $('student-name').value.trim(),
    contact        : $('student-contact').value.trim(),
    centerId       : $('student-center').value,
    fee            : $('student-scholar').checked ? 0 : Number($('student-fee').value || 0),
    class          : $('student-class').value.trim(),
    guardian       : $('student-guardian').value.trim(),
    notes          : $('student-notes').value.trim(),
    isScholarship  : $('student-scholar').checked
  };

  const photoFile = $('student-photo').files[0];
  if (photoFile) payload.photoURL = await uploadImage(photoFile, currentUser.uid);

  const col = collection(db, 'students');

  if (editingId) {
    await updateDoc(doc(col, editingId), payload);
  } else {
    await addDoc(col, { ...payload, createdAt: serverTimestamp() });
  }
}

/* ===================================================================
 * 5. SELECTS por centro
 * =================================================================*/
export function fillCenterSelects() {
  const selFilter = $('filter-center');
  const selForm   = $('student-center');
  if (!selFilter || !selForm) return;

  selFilter.length = 1;
  selForm.length   = 1;

  centersMap.forEach((c, id) => {
    selFilter.appendChild(new Option(c.name, id));
    selForm  .appendChild(new Option(c.name, id));
  });

  if (currentProfile.role === 'secretaria') {
    selFilter.value  = currentProfile.centerId;
    selForm.value    = currentProfile.centerId;
    selFilter.setAttribute('disabled', '');
    selForm  .setAttribute('disabled', '');
  }
}

/* paginação p/ ui.js se precisar */
export function pagePrev() { lastDoc = null; refresh(true); }
export function pageNext() { refresh(false); }

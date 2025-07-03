/* students.js ------------------------------------------------------ */
import {
  collection, query, where, orderBy, limit, startAfter,
  getDocs, addDoc, updateDoc, doc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { db }                 from './firebase.js';
import { $, uploadImage }     from './utils.js';
import { showStudentDetail }  from './ui.js';

/* ---------------- estado ---------------- */
const PAGE = 20;                // paginação padrão
let lastDoc   = null;
let reachedEnd= false;

let currentUser, centersMap, currentProfile;

/* flags de controle de UI / edição */
let editingId         = null;
let currentDetailId   = null;
let currentDetailData = null;

/* ===================================================================
 * 1. INIT – chamado por main.js
 * =================================================================*/
export function initStudents(user, profile, cMap) {

  currentUser     = user;
  currentProfile  = profile;
  centersMap      = (cMap instanceof Map)
      ? cMap
      : new Map(Object.entries(cMap));

  /* ---------- popula selects de centro ---------- */
  fillCenterSelects();

  const selForm = $('student-center');
  if (selForm) {
    selForm.innerHTML = '';
    centersMap.forEach((c, id) =>
      selForm.appendChild(new Option(c.name, id))
    );
  }

  /* ---------- restrições para secretaria ---------- */
  if (profile.role === 'secretaria') {
    ensureSecretaryCenterExists(profile, selForm);
  }

  /* ---------- listeners da lista / filtros ---------- */
  $('search-input'  ).oninput   = () => refresh(true);
  $('filter-center' ).onchange  = () => refresh(true);
  $('filter-scholar').onchange  = () => refresh(true);
  $('btn-prev').onclick = () => pagePrev();
  $('btn-next').onclick = () => pageNext();

  /* ---------- formulário ---------- */
  const chkScholar = $('student-scholar');
  const feeInput   = $('student-fee');
  chkScholar.onchange = () => {
    feeInput.disabled = chkScholar.checked;
    if (chkScholar.checked) feeInput.value = '';
  };

  $('student-photo').onchange = e => {
    const f = e.target.files[0];
    if (f) {
      $('preview-photo').src = URL.createObjectURL(f);
      $('preview-photo').classList.remove('hidden');
    }
  };

  $('student-form').onsubmit = async e => {
    e.preventDefault();
    $('upload-spinner').classList.remove('hidden');
    try {
      await saveStudent();
      e.target.reset();
      $('preview-photo').classList.add('hidden');
      editingId = null;
      refresh(true);
      alert('Aluno salvo!');
    } catch (err) {
      alert(err.message);
    }
    $('upload-spinner').classList.add('hidden');
  };

  /* ---------- botão “Editar” (detalhe) ---------- */
  $('btn-edit-student')?.addEventListener('click', () => {
    if (!currentDetailData) return;
    fillFormForEdit(currentDetailId, currentDetailData);

    /* navega para a tela de cadastro */
    $('student-section')    ?.classList.add   ('hidden');
    $('dashboard-section')  ?.classList.add   ('hidden');
    $('add-student-section')?.classList.remove('hidden');
    $('student-form-wrapper')?.scrollIntoView({ behavior: 'smooth' });
  });

  refresh(true);
}

/* ===================================================================
 * 1-A. popula select de filtro de centros (lista)
 * =================================================================*/
function fillCenterSelects() {
  const selFilter = $('filter-center');
  if (!selFilter) return;

  selFilter.innerHTML =
    '<option value="">Todos os Centros</option>';

  centersMap.forEach((c, id) =>
    selFilter.appendChild(new Option(c.name, id))
  );
}

/* ===================================================================
 * 1-B. garante que o centro da secretaria existe (caso tenha sido
 *      criado manualmente antes do primeiro aluno)
 * =================================================================*/
function ensureSecretaryCenterExists(profile, selForm) {
  const { centerId, centerName = 'Centro' } = profile;

  if (!centersMap.has(centerId)) {
    centersMap.set(centerId, { name: centerName });
    selForm?.appendChild(new Option(centerName, centerId));
    $('filter-center')?.appendChild(new Option(centerName, centerId));
  }

  // fixa centro
  $('filter-center').value    = centerId;
  $('filter-center').disabled = true;
  selForm.value               = centerId;
  selForm.disabled            = true;
}

/* ===================================================================
 * 1-C. preenche formulário em modo edição
 * =================================================================*/
function fillFormForEdit(id, data) {
  editingId = id;

  $('student-name').value      = data.name;
  $('student-contact').value   = data.contact;
  $('student-center').value    = data.centerId;
  $('student-class').value     = data.class     || '';
  $('student-guardian').value  = data.guardian  || '';
  $('student-notes').value     = data.notes     || '';
  $('student-fee').value       = data.fee       || 0;
  $('student-scholar').checked = !!data.isScholarship;
  $('student-scholar').dispatchEvent(new Event('change'));
}

/* ===================================================================
 * 2. SALVAR (add ou update)
 * =================================================================*/
async function saveStudent() {
  const payload = {
    name           : $('student-name').value.trim(),
    contact        : $('student-contact').value.trim(),
    centerId       : $('student-center').value,
    fee            : $('student-scholar').checked
                       ? 0
                       : parseFloat($('student-fee').value || 0),
    class          : $('student-class').value.trim(),
    guardian       : $('student-guardian').value.trim(),
    notes          : $('student-notes').value.trim(),
    isScholarship  : $('student-scholar').checked
  };

  const photoFile = $('student-photo').files[0];
  if (photoFile) {
    payload.photoURL = await uploadImage(photoFile, currentUser.uid);
  }

  if (editingId) {
    // update
    await updateDoc(
      doc(db, 'users', currentUser.uid, 'students', editingId),
      payload
    );
  } else {
    // add
    await addDoc(
      collection(db, 'users', currentUser.uid, 'students'),
      { ...payload, createdAt: serverTimestamp() }
    );
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

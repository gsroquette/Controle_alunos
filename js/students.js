/* students.js ------------------------------------------------------ */
import {
  collection, query, where, orderBy, limit, startAfter,
  getDocs, addDoc, updateDoc, doc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { db }                 from './firebase.js';
import { $, uploadImage }     from './utils.js';
import { showStudentDetail }  from './ui.js';

/* ---------------- estado ----------------- */
const PAGE = 20;
let lastDoc = null;
let reachedEnd = false;

let currentUser    = null;         // firebase.User
let centersMap     = new Map();    // Map<id,{name}>
let currentProfile = { role: 'admin', centerId: '' };

let editingId      = null;         // ← se !== null estamos no modo edição
let currentDetailId   = null;      // id do aluno aberto no detalhe
let currentDetailData = null;      // dados do aluno aberto

/* ------------------------------------------------------------------ */
/* 1. INIT – chamado por main.js                                       */
/* ------------------------------------------------------------------ */
export function initStudents(user, profile, cMap) {

  currentUser     = user;
  currentProfile  = profile;
  centersMap      = (cMap instanceof Map) ? cMap
                   : new Map(Object.entries(cMap));

  /* popula selects de Centro (filtro + form) */
  fillCenterSelects();

  const selForm = $('student-center');
  selForm.innerHTML = '';
  centersMap.forEach((c, id) =>
    selForm.appendChild(new Option(c.name, id))
  );

  /* secretaria só vê o próprio centro */
  if (profile.role === 'secretaria') {
    $('filter-center').value    = profile.centerId;
    $('filter-center').disabled = true;
    selForm.value               = profile.centerId;
    selForm.disabled            = true;
  }

  /* listeners lista / filtro */
  $('search-input').oninput      = () => refresh(true);
  $('filter-center').onchange    = () => refresh(true);
  $('filter-scholar').onchange   = () => refresh(true);

  $('btn-prev').onclick = () => pagePrev();
  $('btn-next').onclick = () => pageNext();

  /* --- form aluno --- */
  const chkScholar = $('student-scholar');
  const feeInput   = $('student-fee');
  chkScholar.onchange = () => {
    feeInput.disabled = chkScholar.checked;
    if (chkScholar.checked) feeInput.value = '';
  };

  $('student-photo').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const img = $('preview-photo');
    img.src   = URL.createObjectURL(f);
    img.classList.remove('hidden');
  };

  $('student-form').onsubmit = async e => {
    e.preventDefault();
    $('upload-spinner').classList.remove('hidden');
    try {
      await saveStudent();
      e.target.reset();
      $('preview-photo').classList.add('hidden');
      editingId = null;                       // limpa modo edição
      refresh(true);
      alert('Aluno salvo!');
    } catch (err) {
      alert(err.message);
    }
    $('upload-spinner').classList.add('hidden');
  };

  /* botão Editar (fica na página de detalhe) */
  /* botão Editar (na página de detalhe) */
$('btn-edit-student')?.addEventListener('click', () => {
  if (!currentDetailData || !currentDetailId) return;

  fillFormForEdit(currentDetailId, currentDetailData);   // preenche form

  /* --- navega para a tela de cadastro --- */
  $('student-section')     ?.classList.add   ('hidden');   // esconde detalhe
  $('dashboard-section')   ?.classList.add   ('hidden');   // esconde lista
  $('add-student-section') ?.classList.remove('hidden');   // mostra form

  /* garante que o form esteja visível (caso use <details>) */
  $('student-form-wrapper')?.setAttribute('open', '');
  $('student-form-wrapper')?.scrollIntoView({ behavior: 'smooth' });
});

  refresh(true);
}

/* ------------------------------------------------------------------ */
/* 1-A. (re)popula o filtro de centros                                */
/* ------------------------------------------------------------------ */
function fillCenterSelects() {
  const selFilter = $('filter-center');
  if (!selFilter) return;
  selFilter.innerHTML = '<option value="">Todos os Centros</option>';

  centersMap.forEach((c, id) =>
    selFilter.appendChild(new Option(c.name, id))
  );

  if (currentProfile.role === 'secretaria') {
    selFilter.value    = currentProfile.centerId;
    selFilter.disabled = true;
  }
}

/* ------------------------------------------------------------------ */
/* 1-B. carrega dados no formulário para edição                       */
/* ------------------------------------------------------------------ */
function fillFormForEdit(id, data){
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

/* ------------------------------------------------------------------ */
/* 2. SALVAR ALUNO (add ou update)                                    */
/* ------------------------------------------------------------------ */
async function saveStudent() {
  const name      = $('student-name').value.trim();
  const contact   = $('student-contact').value.trim();
  const centerId  = $('student-center').value;
  const fee       = $('student-scholar').checked
                      ? 0
                      : parseFloat($('student-fee').value || 0);
  const cls       = $('student-class').value.trim();
  const guardian  = $('student-guardian').value.trim();
  const notes     = $('student-notes').value.trim();
  const isScholar = $('student-scholar').checked;
  const photoFile = $('student-photo').files[0];

  let photoURL = '';
  if (photoFile) {
    photoURL = await uploadImage(photoFile, currentUser.uid);
  }

  const payload = {
    name, contact, centerId, fee,
    class: cls, guardian, notes,
    isScholarship: isScholar,
    photoURL
  };

  if (editingId) {
    /* -------- UPDATE -------- */
    await updateDoc(
      doc(db, 'users', currentUser.uid, 'students', editingId),
      payload
    );
  } else {
    /* -------- ADD ----------- */
    await addDoc(
      collection(db, 'users', currentUser.uid, 'students'),
      { ...payload, createdAt: serverTimestamp() }
    );
  }
}

/* ------------------------------------------------------------------ */
/* 3. LISTAGEM + PAGINAÇÃO                                            */
/* ------------------------------------------------------------------ */
function buildQuery() {
  const centerId = $('filter-center').value;
  let q = query(
    collection(db, 'users', currentUser.uid, 'students'),
    orderBy('name'),
    limit(PAGE)
  );
  if (centerId) q = query(q, where('centerId', '==', centerId));
  if (lastDoc)  q = query(q, startAfter(lastDoc));
  return q;
}

async function refresh(reset = false) {
  if (reset) {
    lastDoc     = null;
    reachedEnd  = false;
    $('btn-prev').disabled = true;
  }
  if (reachedEnd) return;

  const snap = await getDocs(buildQuery());
  renderList(snap.docs, reset);

  if (snap.size < PAGE) reachedEnd = true;
  $('btn-next').disabled = reachedEnd;
}

function renderList(docs, reset) {
  const term        = $('search-input').value.trim().toLowerCase();
  const onlyScholar = $('filter-scholar').checked;
  const list        = $('student-list');
  if (reset) list.innerHTML = '';

  docs.forEach(doc => {
    const s = doc.data();

    /* filtros extra no cliente */
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
      currentDetailId   = doc.id;   // ← guarda para edição
      currentDetailData = s;
      showStudentDetail(doc.id, s);
    };
    list.appendChild(li);
  });

  if (docs.length) lastDoc = docs[docs.length - 1];
}

/* paginação --------------------------------------------------------- */
function pagePrev() { lastDoc = null; refresh(true); }
function pageNext() { refresh(false); }

/* exporta helper para o ui.js -------------------------------------- */
export { fillCenterSelects };

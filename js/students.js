/* ------------- imports ------------- */
import {
  collection, query, where, orderBy, limit, startAfter,
  getDocs, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase.js';
import { $, uploadImage, formatMoney } from './utils.js';

/* paginação */
const PAGE = 20;
let lastDoc = null;
let reachedEnd = false;
let currentUser;
let centersMap;

/* ------------------------------------------------------------------ */
/* 1. INIT – chamado por main.js                                       */
/* ------------------------------------------------------------------ */
export function initStudents(user, profile, cMap) {
  currentUser = user;
  centersMap  = cMap;

  /* --- Popula selects de centro --- */
  const selFilter = $('filter-center');
  const selForm   = $('student-center');
  selFilter.innerHTML = '<option value="">Todos os Centros</option>';
  cMap.forEach((c, id) => {
    selFilter.appendChild(new Option(c.name, id));
    selForm  .appendChild(new Option(c.name, id));
  });

  /* secretaria só enxerga seu centro */
  if (profile.role === 'secretaria') {
    selFilter.value   = profile.centerId;
    selFilter.disabled = true;
    selForm.value     = profile.centerId;
    selForm.disabled  = true;
  }

  /* --- listeners de filtro/pesquisa --- */
  $('search-input').oninput    = () => refresh();
  selFilter.onchange           = () => refresh();
  $('filter-scholar').onchange = () => refresh();

  /* --- paginação --- */
  $('btn-prev').onclick = () => pagePrev();
  $('btn-next').onclick = () => pageNext();

  /* --- formulário novo aluno --- */
  const chkScholar = $('student-scholar');
  const feeInput   = $('student-fee');
  chkScholar.onchange = () => {
    if (chkScholar.checked) {
      feeInput.value    = '';
      feeInput.disabled = true;
    } else {
      feeInput.disabled = false;
    }
  };

  /* preview da foto */
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
      refresh(true);          // volta à 1ª página
      alert('Aluno salvo!');
    } catch (err) {
      alert(err.message);
    }
    $('upload-spinner').classList.add('hidden');
  };

  /* carregamento inicial */
  refresh(true);
}

/* ------------------------------------------------------------------ */
/* 2. SALVAR ALUNO                                                     */
/* ------------------------------------------------------------------ */
async function saveStudent() {
  const name      = $('student-name').value.trim();
  const contact   = $('student-contact').value.trim();
  const centerId  = $('student-center').value;
  const fee       = $('student-scholar').checked ? 0 :
                    parseFloat($('student-fee').value || 0);
  const cls       = $('student-class').value.trim();
  const guardian  = $('student-guardian').value.trim();
  const notes     = $('student-notes').value.trim();
  const isScholar = $('student-scholar').checked;
  const photoFile = $('student-photo').files[0];
  let   photoURL  = '';

  if (photoFile) photoURL = await uploadImage(photoFile, currentUser.uid);

  await addDoc(
    collection(db, 'users', currentUser.uid, 'students'), {
      name, contact, centerId, fee,
      class: cls, guardian, notes,
      isScholarship: isScholar,
      photoURL,
      createdAt: serverTimestamp()
    }
  );
}

/* ------------------------------------------------------------------ */
/* 3. LISTAGEM + PAGINAÇÃO                                             */
/* ------------------------------------------------------------------ */
function buildQuery() {
  const cen   = $('filter-center').value;
  const schol = $('filter-scholar').checked;

  let q = query(
    collection(db, 'users', currentUser.uid, 'students'),
    orderBy('name'),
    limit(PAGE)
  );

  if (cen)   q = query(q, where('centerId',      '==', cen));
  if (schol) q = query(q, where('isScholarship', '==', true));
  if (lastDoc) q = query(q, startAfter(lastDoc));

  return q;
}

async function refresh(reset = false) {
  if (reset) {
    lastDoc = null;
    reachedEnd = false;
    $('btn-prev').disabled = true;
  }
  if (reachedEnd) return;

  const snap = await getDocs(buildQuery());
  renderList(snap.docs, reset);
  if (snap.size < PAGE) reachedEnd = true;
  $('btn-next').disabled = reachedEnd;
}

function renderList(docs, reset) {
  const list = $('student-list');
  if (reset) list.innerHTML = '';
  docs.forEach(doc => {
    const s  = doc.data();
    const li = document.createElement('li');
    li.className =
      'bg-white p-3 rounded shadow flex justify-between cursor-pointer';
    li.innerHTML = `
      <span>${s.name}${s.isScholarship
        ? '<span class="text-xs text-violet-700 font-semibold"> (Bolsista)</span>'
        : ''}</span>
      <span class="text-sm text-gray-500">
        ${centersMap.get(s.centerId)?.name || ''}
      </span>`;
    list.appendChild(li);
  });
  lastDoc = docs[docs.length - 1];
}

function pagePrev() {
  lastDoc = null;
  refresh(true);
}
function pageNext() { refresh(false); }

/* ------------------------------------------------------------------ */

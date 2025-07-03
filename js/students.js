import {
  collection, addDoc, query, orderBy, getDocs,
  where, doc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { uploadImage } from './utils.js';
import { db } from './firebase.js';
import { $, formatMoney } from './utils.js';

/* ---------- salvar novo aluno ---------- */
export async function saveStudent(currentUser){
  const name       = $('student-name').value.trim();
  const contact    = $('student-contact').value.trim();
  const feeInput   = $('student-fee');
  const isScholar  = $('student-scholar').checked;
  const fee        = isScholar ? 0 : parseFloat(feeInput.value);
  const photoFile  = $('student-photo').files[0];
  const centerId   = $('student-center').value;
  const cls        = $('student-class').value.trim();
  const guardian   = $('student-guardian').value.trim();
  const notes      = $('student-notes').value.trim();

  let photoURL = '';
  if(photoFile){
    photoURL = await uploadImage(photoFile, currentUser.uid);
  }

  await addDoc(
    collection(db,'users',currentUser.uid,'students'),{
      name, contact, fee, photoURL,
      centerId, class:cls, guardian, notes,
      isScholarship:isScholar,
      createdAt: serverTimestamp()
    });
}

/* ---------- lista de alunos ---------- */
export async function loadStudents(currentUser, centersMap){
  const list = $('student-list');
  list.innerHTML = '<li>Carregando...</li>';

  const centerFilter = $('filter-center').value;
  const scholarOnly  = $('filter-scholar').checked;

  let q = query(collection(db,'users',currentUser.uid,'students'), orderBy('name'));
  if(centerFilter) q = query(q, where('centerId','==',centerFilter));
  if(scholarOnly)  q = query(q, where('isScholarship','==',true));

  const snap = await getDocs(q);
  list.innerHTML = '';
  snap.forEach(docSnap=>{
    const s = docSnap.data();
    const li = document.createElement('li');
    li.className = 'bg-white p-3 rounded shadow flex justify-between cursor-pointer';
    li.innerHTML = `
      <span>${s.name}${s.isScholarship?' <span class="text-xs text-violet-700 font-semibold">(Bolsista)</span>':''}</span>
      <span class="text-sm text-gray-500">${centersMap.get(s.centerId)?.name||''}</span>
    `;
    li.addEventListener('click',()=>openStudent(docSnap.id,s,centersMap));
    list.appendChild(li);
  });
}

/* ---------- detalhe ---------- */
function openStudent(id,data,centersMap){
  $('detail-name').textContent = data.name;
  $('detail-contact').textContent  = 'Contato: '+data.contact;
  $('detail-class').textContent    = data.class? 'Turma: '+data.class : '';
  $('detail-guardian').textContent = data.guardian? 'Resp.: '+data.guardian : '';
  $('detail-fee').textContent      = data.isScholarship ? 'Bolsista' : 'Mens.: '+formatMoney(data.fee);
  $('detail-notes').textContent    = data.notes;
  $('detail-photo').src            = data.photoURL || 'https://via.placeholder.com/96x96?text=Foto';
}

import { db }        from './firebase.js';
import { $, sleep }  from './utils.js';
import { showStudentDetail, showDashboard } from './ui.js';
import {
  collection, addDoc, getDocs,
  query, orderBy, serverTimestamp,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* Cloudinary */
const CLOUD   = 'dqa8jupnh';
const PRESET  = 'unsigned';

let user   = null;
let curStu = '';

export function initStudents(u){
  user = u;
  $('student-form').addEventListener('submit', saveStudent);
  $('search-input').addEventListener('input',filterList);
  $('back-dashboard').addEventListener('click',()=>showDashboard());
  loadStudents();
}

/* ---------- lista ---------- */
async function loadStudents(){
  const UL = $('student-list');
  UL.innerHTML='<li>Carregando...</li>';
  const q = query(collection(db,'users',user.uid,'students'),orderBy('name'));
  const snap = await getDocs(q);
  UL.innerHTML='';
  snap.forEach(doc=>{
    const d = doc.data();
    const li=document.createElement('li');
    li.className='bg-white p-3 rounded shadow flex justify-between items-center cursor-pointer';
    li.innerHTML = `<span>${d.name}</span><span class="text-sm text-gray-500">${d.contact}</span>`;
    li.onclick   = ()=>openDetail(doc.id,d);
    UL.appendChild(li);
  });
}

function filterList(){
  const term = $('search-input').value.toLowerCase();
  [...$('student-list').children].forEach(li=>{
    const name = li.firstElementChild.textContent.toLowerCase();
    li.style.display = name.includes(term)?'':'none';
  });
}

/* ---------- salvar ---------- */
async function saveStudent(e){
  e.preventDefault();
  const name    = $('student-name').value.trim();
  const contact = $('student-contact').value.trim();
  const fee     = +$('student-fee').value;
  const file    = $('student-photo').files[0];

  let photoURL='';
  if(file){
    try{
      const fd = new FormData();
      fd.append('file',file);
      fd.append('upload_preset',PRESET);
      fd.append('folder',`students/${user.uid}`);
      const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,{method:'POST',body:fd});
      const j = await r.json();
      if(j.secure_url) photoURL=j.secure_url; else throw new Error(j.error?.message);
    }catch(err){
      console.error(err);
      alert('Falha no upload; salvando sem foto.');
    }
  }

  await addDoc(collection(db,'users',user.uid,'students'),{name,contact,fee,photoURL});
  $('student-form').reset();
  await loadStudents();
  alert('Aluno salvo!');
}

/* ---------- detalhe ---------- */
import {
  query as qy, orderBy as ob,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { addPayment, listPayments } from './payments.js';

function openDetail(id,data){
  curStu=id;
  $('detail-photo').src = data.photoURL||'https://via.placeholder.com/96x96?text=Foto';
  $('detail-name').textContent    = data.name;
  $('detail-contact').textContent = 'Contato: '+data.contact;
  $('detail-fee').textContent     = 'Mensalidade: R$ '+data.fee.toFixed(2);
  listPayments(user,curStu,data.fee);
  $('btn-add-payment').onclick = ()=>addPayment(user,curStu,data.fee);
  showStudentDetail();
}

export { user };

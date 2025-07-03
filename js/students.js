/* students.js */
import { db }     from './firebase.js';
import { $, }     from './utils.js';
import {
  collection, addDoc, getDocs,
  query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showStudentDetail, showDashboard } from './ui.js';
import { listPayments, addPayment } from './payments.js';
import { loadCenters } from './centers.js';

/* Cloudinary */
const CLOUD = 'dqa8jupnh';
const PRESET= 'unsigned';

let user=null;
let currentId='';
let centersMap={};

/* -------- INIT -------- */
export async function initStudents(u){
  user=u;

  $('student-form').addEventListener('submit', saveStudent);
  $('student-photo').addEventListener('change', previewPhoto);
  $('search-input').addEventListener('input', filterList);
  $('filter-center').addEventListener('change', loadStudents);
  $('back-dashboard').addEventListener('click', ()=>showDashboard());

  // carrega Centros e depois alunos
  centersMap = await loadCenters();
  await loadStudents();
}

/* preview */
function previewPhoto(){
  const f=$('student-photo').files[0];
  const img=$('preview-photo');
  if(f){ img.src=URL.createObjectURL(f); img.classList.remove('hidden');}
  else  { img.classList.add('hidden'); }
}

/* salvar aluno */
async function saveStudent(e){
  e.preventDefault();
  const centerId=$('student-center').value;
  if(!centerId) return alert('Selecione o Centro.');

  const name   =$('student-name').value.trim();
  const contact=$('student-contact').value.trim();
  const fee    =+$('student-fee').value;
  const file   =$('student-photo').files[0];

  let photoURL=''; const spin=$('upload-spinner');
  if(file){
    spin.classList.remove('hidden');
    try{
      const fd=new FormData();
      fd.append('file',file);
      fd.append('upload_preset',PRESET);
      fd.append('folder',`students/${user.uid}`);
      const r =await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
        {method:'POST',body:fd});
      const j=await r.json();
      if(j.secure_url) photoURL=j.secure_url; else throw new Error(j.error?.message);
    }catch(err){ console.error(err); alert('Upload falhou.'); }
    spin.classList.add('hidden');
  }

  await addDoc(collection(db,'users',user.uid,'students'),{
    centerId,
    centerName: centersMap[centerId],
    name, contact, fee, photoURL
  });
  $('student-form').reset();
  $('preview-photo').classList.add('hidden');
  await loadStudents();
  alert('Aluno salvo!');
}

/* listar alunos */
async function loadStudents(){
  const UL=$('student-list');
  UL.innerHTML='<li>Carregando…</li>';

  const filterCenter=$('filter-center').value;
  let q=query(collection(db,'users',user.uid,'students'),orderBy('name'));
  if(filterCenter){
    q=query(q, where('centerId','==',filterCenter));
  }
  const snap=await getDocs(q);

  UL.innerHTML='';
  snap.forEach(doc=>{
    const d=doc.data();
    const li=document.createElement('li');
    li.className='bg-white p-3 rounded shadow flex justify-between items-center cursor-pointer';
    li.innerHTML=`<span>${d.name}</span><span class="text-sm text-gray-500">${d.centerName}</span>`;
    li.onclick=()=>openDetail(doc.id,d);
    UL.appendChild(li);
  });
}

function filterList(){
  const term=$('search-input').value.toLowerCase();
  [...$('student-list').children].forEach(li=>{
    const name=li.firstElementChild.textContent.toLowerCase();
    li.style.display=name.includes(term)?'':'none';
  });
}

/* detalhe */
function openDetail(id,data){
  currentId=id;
  $('detail-photo').src = data.photoURL||'https://via.placeholder.com/96?text=Foto';
  $('detail-name').textContent    = data.name;
  $('detail-contact').textContent = 'Contato: '+data.contact;
  $('detail-fee').textContent     = `Mensalidade: R$ ${data.fee.toFixed(2)}`;
  listPayments(user,currentId);
  $('btn-add-payment').onclick=()=>addPayment(user,currentId,data.fee);
  showStudentDetail();
}

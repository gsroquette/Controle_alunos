import { db } from './firebase.js';
import { $ }  from './utils.js';
import {
  collection, addDoc, getDocs,
  query, where, orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ---- listar ---- */
export async function listPayments(user,stuId){
  const UL = $('payments-list');
  UL.innerHTML='<li>Carregando...</li>';
  const col = collection(db,'users',user.uid,'students',stuId,'payments');
  const snap = await getDocs(query(col,orderBy('year','desc'),orderBy('month','desc')));
  UL.innerHTML='';
  snap.forEach(p=>{
    const d=p.data();
    UL.insertAdjacentHTML('beforeend',
      `<li>${d.month}/${d.year} – ${new Date(d.timestamp.seconds*1000).toLocaleString()}</li>`);
  });
  if(!UL.children.length) UL.innerHTML='<li>Nenhum pagamento ainda.</li>';
}

/* ---- add ---- */
export async function addPayment(user,stuId,fee){
  const now   = new Date();
  const month = now.getMonth()+1;
  const year  = now.getFullYear();
  const col   = collection(db,'users',user.uid,'students',stuId,'payments');
  const q     = query(col,where('month','==',month),where('year','==',year));
  if(!(await getDocs(q)).empty) return alert('Pagamento deste mês já existe.');

  await addDoc(col,{month,year,timestamp:serverTimestamp(),value:fee});
  await listPayments(user,stuId);
  alert('Pagamento registrado!');
}

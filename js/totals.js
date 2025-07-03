import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase.js';

export async function loadTotals(user){
  const body = $('totals-body');
  body.innerHTML = '<tr><td class="p-2">Carregando...</td></tr>';

  const students = await getDocs(collection(db,'users',user.uid,'students'));
  const totals = new Map();

  for(const st of students.docs){
    const sData = st.data();
    if(sData.isScholarship) continue;          // ignora bolsistas

    const pays = await getDocs(collection(db,'users',user.uid,'students',st.id,'payments'));
    pays.forEach(p=>{
      const {month,year}=p.data();
      const key=`${month.toString().padStart(2,'0')}/${year}`;
      totals.set(key,(totals.get(key)||0)+sData.fee);
    });
  }

  body.innerHTML='';
  [...totals.entries()].sort((a,b)=>{
    const [ma,ya]=a[0].split('/').map(Number);
    const [mb,yb]=b[0].split('/').map(Number);
    return yb-ya || mb-ma;
  }).forEach(([k,tot])=>{
    body.insertAdjacentHTML('beforeend',`<tr><td class="p-2">${k}</td><td class="p-2">R$ ${tot.toFixed(2)}</td></tr>`);
  });
}

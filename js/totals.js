import { db } from './firebase.js';
import { $ }  from './utils.js';
import {
  collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadTotals(user){
  const body = $('totals-body');
  body.innerHTML='<tr><td class="p-2">Carregando...</td></tr>';

  const map = new Map();
  const studentsSnap = await getDocs(collection(db,'users',user.uid,'students'));
  for(const stu of studentsSnap.docs){
    const fee = stu.data().fee;
    const paySnap = await getDocs(collection(db,'users',user.uid,'students',stu.id,'payments'));
    paySnap.forEach(p=>{
      const {month,year}=p.data();
      const key=`${month.toString().padStart(2,'0')}/${year}`;
      map.set(key,(map.get(key)||0)+fee);
    });
  }

  body.innerHTML='';
  [...map.entries()].sort((a,b)=>{
    const [ma,ya]=a[0].split('/').map(Number);
    const [mb,yb]=b[0].split('/').map(Number);
    return yb-ya || mb-ma;
  }).forEach(([key,total])=>{
    body.insertAdjacentHTML('beforeend',
      `<tr><td class="p-2 border-t">${key}</td><td class="p-2 border-t">R$ ${total.toFixed(2)}</td></tr>`);
  });
  if(!body.children.length) body.innerHTML='<tr><td class="p-2">Sem dados.</td></tr>';
}

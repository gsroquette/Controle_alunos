import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase.js';

export async function loadDefaulters(user, month, year, centerId){
  const tbody=$('defaulters-body');
  tbody.innerHTML='<tr><td class="p-2">Carregando...</td></tr>';

  let stQuery=query(collection(db,'users',user.uid,'students'));
  if(centerId) stQuery=query(stQuery,where('centerId','==',centerId));

  const students=await getDocs(stQuery);
  tbody.innerHTML='';

  for(const st of students.docs){
    const s=st.data();
    if(s.isScholarship) continue;          // ignora bolsistas

    const paySnap=await getDocs(query(
      collection(db,'users',user.uid,'students',st.id,'payments'),
      where('month','==',month),
      where('year','==',year)
    ));
    if(paySnap.empty){
      tbody.insertAdjacentHTML('beforeend',
        `<tr><td class="p-2 border-t">${s.name}</td><td class="p-2 border-t">${centerId||''}</td></tr>`);
    }
  }
}

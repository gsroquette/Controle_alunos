/* profile.js – obtém papel e centro do usuário */
import { db } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function getUserProfile(uid){
  const snap = await getDoc(doc(db, 'profiles', uid));
  if(!snap.exists()){
    // padrão: secretaria sem centro (bloqueado)
    return { role: 'secretaria', centerId: '' };
  }
  return snap.data();   // { role: 'admin' } ou { role:'secretaria', centerId:'...' }
}

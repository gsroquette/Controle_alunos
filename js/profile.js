/* profile.js ------------------------------------------------------- */
/* Responsável por obter (ou criar) o perfil do usuário logado.
 *
 * Estrutura esperada:
 *   Admin        → { role: 'admin' }
 *   Secretaria   → { role: 'secretaria', centerId: '<ID>', centerName?: '<nome>' }
 *
 * Se o documento não existir, o usuário é tratado como **admin** por padrão.
 * Para secretarias sem `centerName`, tenta-se buscar o nome do centro.
 * ------------------------------------------------------------------ */

import { db } from './firebase.js';
import {
  doc, getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/**
 * Retorna o perfil do usuário.
 * @param {string} uid – uid Firebase Auth
 * @returns {Promise<{role:string,centerId?:string,centerName?:string}>}
 */
export async function getUserProfile(uid) {

  /* --------------------------------------------------------------
   * 1. Procura o doc em /profiles/{uid}
   * -------------------------------------------------------------- */
  const profSnap = await getDoc(doc(db, 'profiles', uid));

  /* -------- documento não existe → default admin -------- */
  if (!profSnap.exists()) {
    return { role: 'admin' };
  }

  const profile = profSnap.data();   // { role,... }

  /* --------------------------------------------------------------
   * 2. Se for secretaria, tenta preencher centerName (caso falte)
   *    O centro está em /users/{uid}/centers/{centerId}
   * -------------------------------------------------------------- */
  if (profile.role === 'secretaria' && profile.centerId && !profile.centerName) {
    try {
      const centerSnap = await getDoc(
        doc(db, 'users', uid, 'centers', profile.centerId)
      );
      if (centerSnap.exists()) {
        profile.centerName = centerSnap.data().name || '';
      }
    } catch {/* ignora falha; fica sem centerName */}
  }

  return profile;           // já no formato esperado
}

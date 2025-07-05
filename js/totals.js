/* totals.js --------------------------------------------------------
 *  Soma total recebido por mês
 *  Estrutura centralizada:
 *    students/{studentId}
 *    students/{studentId}/payments/{paymentId}
 * ----------------------------------------------------------------- */
import {
  collection, getDocs, query, where
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { db } from './firebase.js';
import { $  } from './utils.js';

/**
 * Carrega totais recebidos por mês.
 * @param {{role:string, centerId?:string}} profile – perfil (admin | secretaria)
 */
export async function loadTotals(profile = { role: 'admin' }) {

  const TBODY = $('totals-body');
  if (!TBODY) return;

  TBODY.innerHTML =
    '<tr><td class="p-2" colspan="2">Carregando…</td></tr>';

  /* --------------------------------------------------------------
   * 1. Buscar alunos (filtra por centro se secretaria)
   * -------------------------------------------------------------- */
  let stuQuery = collection(db, 'students');
  if (profile.role === 'secretaria' && profile.centerId) {
    stuQuery = query(stuQuery, where('centerId', '==', profile.centerId));
  }
  const stuSnap = await getDocs(stuQuery);

  /* mapa "mm/aaaa" -> total R$ */
  const totals = new Map();

  /* --------------------------------------------------------------
   * 2. Para cada aluno: soma mensalidades pagas
   * -------------------------------------------------------------- */
  for (const stu of stuSnap.docs) {
    const sData = stu.data();
    if (sData.isScholarship) continue;          // ignora bolsistas

    const paySnap = await getDocs(
      collection(db, 'students', stu.id, 'payments')
    );

    paySnap.forEach(p => {
      const { month, year } = p.data();
      const key = `${String(month).padStart(2, '0')}/${year}`;
      totals.set(key, (totals.get(key) || 0) + (Number(sData.fee) || 0));
    });
  }

  /* --------------------------------------------------------------
   * 3. Renderiza tabela ordenada (ano ↓  /  mês ↓)
   * -------------------------------------------------------------- */
  TBODY.innerHTML = '';

  [...totals.entries()]
    .sort((a, b) => {
      const [ma, ya] = a[0].split('/').map(Number);
      const [mb, yb] = b[0].split('/').map(Number);
      return yb - ya || mb - ma;           // ano desc, mês desc
    })
    .forEach(([key, total]) => {
      TBODY.insertAdjacentHTML(
        'beforeend',
        `<tr>
           <td class="p-2 border-t">${key}</td>
           <td class="p-2 border-t">${total.toFixed(2)}</td>
         </tr>`
      );
    });

  if (!TBODY.children.length) {
    TBODY.innerHTML =
      '<tr><td class="p-2" colspan="2">Nenhum pagamento registrado.</td></tr>';
  }
}

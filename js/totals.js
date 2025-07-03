/* totals.js -------------------------------------------------------- */
import {
  collection, getDocs, query, where
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { db } from './firebase.js';
import { $  } from './utils.js';

/**
 * Carrega totais recebidos por mês.
 * @param {firebase.User} user      – usuário logado (para path / segurança)
 * @param {{role:string, centerId?:string}} profile – perfil (admin | secretaria)
 */
export async function loadTotals(user, profile = { role: 'admin' }) {

  const TBODY = $('totals-body');
  if (!TBODY) return;

  TBODY.innerHTML =
    '<tr><td class="p-2" colspan="2">Carregando…</td></tr>';

  /* --------------------------------------------------------------
   * 1. Busca alunos (com filtro de centro se secretaria)
   * -------------------------------------------------------------- */
  const stuBase = collection(db, 'users', user.uid, 'students');
  const stuSnap = await getDocs(
    profile.role === 'secretaria' && profile.centerId
      ? query(stuBase, where('centerId', '==', profile.centerId))
      : stuBase
  );

  /* mapa "mm/aaaa" -> total R$ */
  const totals = new Map();

  /* --------------------------------------------------------------
   * 2. Para cada aluno: soma mensalidades pagas
   *    • ignora bolsistas
   *    • cada pagamento conta 1×fee (permite múltiplos pagamentos / mês)
   * -------------------------------------------------------------- */
  for (const stu of stuSnap.docs) {
    const sData = stu.data();
    if (sData.isScholarship) continue;

    const paySnap = await getDocs(
      collection(db, 'users', user.uid,
                 'students', stu.id, 'payments')
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
           <td class="p-2 border-t">R$ ${total.toFixed(2)}</td>
         </tr>`
      );
    });

  if (!TBODY.children.length) {
    TBODY.innerHTML =
      '<tr><td class="p-2" colspan="2">Nenhum pagamento registrado.</td></tr>';
  }
}

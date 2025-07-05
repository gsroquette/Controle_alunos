/* totals.js --------------------------------------------------------
 *  Soma total recebido por mês — agora com seletor de centro p/ admin
 * ----------------------------------------------------------------- */
import {
  collection, getDocs, query, where
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { db } from './firebase.js';
import { $  } from './utils.js';

/**
 * Carrega totais recebidos por mês.
 * @param {{role:string, centerId?:string}} profile
 * @param {Map<string,{name:string}>} centersMap  – passado pelo main
 */
export async function loadTotals(
  profile = { role: 'admin' },
  centersMap = new Map()
) {
  const TBODY  = $('totals-body');
  const SEL    = $('totals-center');
  if (!TBODY || !SEL) return;

  /* --------------------------------------------------------------
   * 0. Preenche seletor de centros (apenas 1ª vez)
   * -------------------------------------------------------------- */
  if (!SEL.dataset.populated) {
    // admin vê todos
    if (profile.role === 'admin') {
      centersMap.forEach((c, id) =>
        SEL.appendChild(new Option(c.name, id))
      );
    } else {
      // secretaria: trava no próprio centro
      const name =
        centersMap.get(profile.centerId)?.name || profile.centerName || 'Centro';
      SEL.appendChild(new Option(name, profile.centerId));
      SEL.value    = profile.centerId;
      SEL.disabled = true;
    }
    SEL.dataset.populated = 'true';
  }

  /* recarrega totais sempre que mudar o select (admin) */
  SEL.onchange = () => loadTotals(profile, centersMap);

  /* --------------------------------------------------------------
   * 1. Buscar alunos (filtra por centro se secretaria ou se admin
   *    escolheu um centro específico)
   * -------------------------------------------------------------- */
  TBODY.innerHTML =
    '<tr><td class="p-2" colspan="2">Carregando…</td></tr>';

  const centerFilter =
    profile.role === 'admin' ? SEL.value : profile.centerId;

  let stuQuery = collection(db, 'students');
  if (centerFilter) {
    stuQuery = query(stuQuery, where('centerId', '==', centerFilter));
  }
  const stuSnap = await getDocs(stuQuery);

  /* mapa "mm/aaaa" -> total  */
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

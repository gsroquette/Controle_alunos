/* ---------- imports ---------- */
import {
  collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase.js';
import { $ } from './utils.js';

let currentUser;
let centersMap;

/* ------------------------------------------------------------------ */
/* INICIALIZA – chamada por main.js                                   */
/* ------------------------------------------------------------------ */
export function initDefaulters(user, cMap) {
  if (!user || !user.role) {
    console.warn('Usuário inválido ou sem role em initDefaulters');
    return;
  }

  if (!cMap || !(cMap instanceof Map || typeof cMap === 'object')) {
    console.warn('centersMap inválido em initDefaulters');
    return;
  }

  centersMap = (cMap instanceof Map) ? cMap : new Map(Object.entries(cMap));
  currentUser = user;

  const sel = $('defaulters-center');
  sel.innerHTML = '<option value="">Todos os Centros</option>';

  if (user.role === 'admin') {
    centersMap.forEach((c, id) =>
      sel.appendChild(new Option(c.name, id))
    );
  } else {
    sel.appendChild(new Option(user.centerName, user.centerId));
    sel.value = user.centerId;
    sel.disabled = true;
  }

  $('btn-load-defaulters').onclick = () => loadDefaulters();
}

/* ------------------------------------------------------------------ */
/* BUSCA INADIMPLENTES                                                */
/* ------------------------------------------------------------------ */
async function loadDefaulters() {
  const tbody   = $('defaulters-body');
  const monthIn = $('defaulters-month').value;
  const center  = $('defaulters-center').value;

  if (!monthIn) {
    alert('Escolha o mês!');
    return;
  }

  const [y, m] = monthIn.split('-').map(Number);
  tbody.innerHTML = '<tr><td class="p-2">Carregando...</td></tr>';

  // Monta a query dos alunos
  const qStu = center
    ? query(collection(db, 'users', currentUser.uid, 'students'),
            where('centerId', '==', center))
    : collection(db, 'users', currentUser.uid, 'students');

  const snapStu = await getDocs(qStu);
  const rows = [];

  for (const stuDoc of snapStu.docs) {
    const s = stuDoc.data();
    if (s.isScholarship) continue;  // ignora bolsistas

    const payCol = collection(
      db, 'users', currentUser.uid, 'students', stuDoc.id, 'payments'
    );
    const payQ = query(payCol,
      where('month', '==', m), where('year', '==', y));
    const paySnap = await getDocs(payQ);

    if (paySnap.empty) {
      rows.push(`
        <tr>
          <td class="p-2 border-t">${s.name}</td>
          <td class="p-2 border-t">${centersMap.get(s.centerId)?.name || ''}</td>
        </tr>`);
    }
  }

  tbody.innerHTML = rows.length
    ? rows.join('')
    : '<tr><td class="p-2">Nenhum inadimplente 🎉</td></tr>';
}

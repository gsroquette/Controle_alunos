/* defaulters.js ---------------------------------------------------- */
import {
  collection, query, where, getDocs
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from './firebase.js';
import { $  } from './utils.js';

/* ---------- estado interno ---------- */
let firebaseUser;          // Firebase User (tem .uid)
let centersMap   = new Map();
let role         = 'admin';   // 'admin' | 'secretaria'
let centerId     = '';        // se secretaria

/* ================================================================== */
/* INIT – chamado por main.js  ►  initDefaulters(user, profile, map)  */
/* ================================================================== */
export function initDefaulters(user, profile, cMap) {

  /* — sanity checks — */
  if (!user?.uid) {
    console.warn('defaulters: Firebase-User ausente ou sem uid');
    return;
  }
  if (!profile?.role) {
    console.warn('defaulters: profile ausente/sem role');
    return;
  }
  if (!(cMap instanceof Map) && typeof cMap !== 'object') {
    console.warn('defaulters: centersMap inválido');
    return;
  }

  /* — guarda estado — */
  firebaseUser = user;          // ← precisamos do uid para as queries
  role         = profile.role;  // 'admin' | 'secretaria'
  centerId     = profile.centerId || '';
  centersMap   = (cMap instanceof Map) ? cMap
               : new Map(Object.entries(cMap));

  /* — monta o <select> de centros — */
  const sel = $('defaulters-center');
  if (!sel) return;

  sel.innerHTML = '<option value="">Todos os Centros</option>';

  if (role === 'admin') {
    centersMap.forEach((c, id) =>
      sel.appendChild(new Option(c.name, id))
    );
  } else {
    const name =
      centersMap.get(centerId)?.name || profile.centerName || 'Centro';
    sel.appendChild(new Option(name, centerId));
    sel.value    = centerId;
    sel.disabled = true;
  }

  $('btn-load-defaulters')?.addEventListener('click', loadDefaulters);
}

/* ================================================================== */
/* BUSCA INADIMPLENTES                                                */
/* ================================================================== */
async function loadDefaulters() {
  const tbody   = $('defaulters-body');
  const monthIn = $('defaulters-month')?.value;      // yyyy-mm
  const center  = $('defaulters-center')?.value;

  if (!tbody || !monthIn) {
    alert('Escolha o mês!');
    return;
  }

  const [year, month] = monthIn.split('-').map(Number);
  tbody.innerHTML = '<tr><td class="p-2">Carregando…</td></tr>';

  /* — alunos (com ou sem filtro de centro) — */
  const base = collection(db, 'users', firebaseUser.uid, 'students');
  const qStu = center ? query(base, where('centerId', '==', center)) : base;

  const snapStu = await getDocs(qStu);
  const rows = [];

  for (const stuDoc of snapStu.docs) {
    const s = stuDoc.data();
    if (s.isScholarship) continue;                 // bolsista não conta

    const paySnap = await getDocs(
      query(
        collection(db, 'users', firebaseUser.uid,
                   'students', stuDoc.id, 'payments'),
        where('month', '==', month),
        where('year',  '==', year)
      )
    );

    if (paySnap.empty) {                           // inadimplente
      rows.push(`
        <tr>
          <td class="p-2 border-t">${s.name}</td>
          <td class="p-2 border-t">
            ${centersMap.get(s.centerId)?.name || ''}
          </td>
        </tr>`);
    }
  }

  tbody.innerHTML = rows.length
    ? rows.join('')
    : '<tr><td class="p-2">Nenhum inadimplente 🎉</td></tr>';
}

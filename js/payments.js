/* payments.js ------------------------------------------------------
 *  Listagem e registro de pagamentos
 *  Estrutura centralizada:
 *    students/{studentId}/payments/{paymentId}
 * ----------------------------------------------------------------- */

import { db, auth } from './firebase.js';
import { $ }        from './utils.js';
import {
  collection, addDoc, getDocs, query, where, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ------------------------------------------------------------------
 * 1. LISTAR PAGAMENTOS
 * ----------------------------------------------------------------*/
export async function listPayments(stuId) {
  const UL = $('payments-list');
  if (!UL) return;

  UL.innerHTML = '<li>Carregando…</li>';
  try {
    const col  = collection(db, 'students', stuId, 'payments');
    const snap = await getDocs(col);

    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    rows.sort((a,b)=>
      b.year - a.year ||
      b.month - a.month ||
      (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
    );

    UL.innerHTML = rows.length ? '' : '<li>Nenhum pagamento ainda.</li>';
    rows.forEach(p => {
      const ts = p.timestamp?.seconds
        ? new Date(p.timestamp.seconds * 1000).toLocaleString('pt-BR')
        : '—';
      UL.insertAdjacentHTML(
        'beforeend',
        `<li>${String(p.month).padStart(2,'0')}/${p.year} — ${ts}</li>`
      );
    });

  } catch (err) {
    console.error('Erro ao carregar pagamentos:', err);
    UL.innerHTML =
      '<li class="text-red-600">Erro ao carregar pagamentos.</li>';
  }
}

/* ------------------------------------------------------------------
 * 2. ADICIONAR PAGAMENTO
 * ----------------------------------------------------------------*/
export async function addPayment(stuId, centerId, fee = 0) {
  const agora   = new Date();
  const month   = agora.getMonth() + 1;
  const year    = agora.getFullYear();
  const userUid = auth.currentUser?.uid || '';

  const col = collection(db, 'students', stuId, 'payments');

  /* evitar duplicidade */
  const dup = await getDocs(
    query(col, where('month','==',month), where('year','==',year))
  );
  if (!dup.empty) {
    alert('Pagamento deste mês já registrado.');
    return;
  }

  await addDoc(col, {
    centerId,
    month,
    year,
    value       : Number(fee) || 0,
    requestorUid: userUid,        // 🔸 novo campo
    createdBy   : userUid,        // (back-compat)
    timestamp   : serverTimestamp()
  });

  await listPayments(stuId);
  alert('Pagamento registrado com sucesso!');
}

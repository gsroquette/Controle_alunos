/* payments.js ------------------------------------------------------
 *  Gerenciamento de pagamentos de alunos
 *  - listPayments(ownerUid, stuId)
 *  - addPayment(ownerUid, stuId, fee)
 * --------------------------------------------------------------- */

import { db } from './firebase.js';
import { $  } from './utils.js';

import {
  collection, addDoc, getDocs, query, where,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ================================================================
 * 1. LISTAR PAGAMENTOS                                              
 * ----------------------------------------------------------------
 *  - ownerUid  → uid do proprietário do documento "student"
 *  - stuId     → id do documento do aluno                       
 *  - sem orderBy para evitar índices compostos; ordenamos no JS  
 * ================================================================ */
export async function listPayments(ownerUid, stuId) {
  const UL = $('payments-list');
  if (!UL) return;

  UL.innerHTML = '<li>Carregando…</li>';

  try {
    const col  = collection(db, 'users', ownerUid, 'students', stuId, 'payments');
    const snap = await getDocs(col);

    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    /* ordena: ano ↓, mês ↓, timestamp ↓ */
    rows.sort((a, b) =>
      b.year  - a.year  ||
      b.month - a.month ||
      (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
    );

    UL.innerHTML = '';
    rows.forEach(p => {
      const ts = p.timestamp?.seconds
        ? new Date(p.timestamp.seconds * 1000).toLocaleString('pt-BR')
        : '—';
      UL.insertAdjacentHTML(
        'beforeend',
        `<li>${String(p.month).padStart(2, '0')}/${p.year} &nbsp;–&nbsp; ${ts}</li>`
      );
    });

    if (!rows.length) UL.innerHTML = '<li>Nenhum pagamento ainda.</li>';
  } catch (err) {
    console.error('Erro ao carregar pagamentos:', err);
    UL.innerHTML = '<li class="text-red-600">Erro ao carregar pagamentos.</li>';
  }
}

/* ================================================================
 * 2. ADICIONAR PAGAMENTO                                            
 * ----------------------------------------------------------------
 *  - ownerUid  → uid do proprietário do documento "student"       
 *  - stuId     → id do documento do aluno                          
 *  - fee       → valor da mensalidade                              
 * ================================================================ */
export async function addPayment(ownerUid, stuId, fee = 0) {
  const agora = new Date();
  const month = agora.getMonth() + 1; // 0‑based → 1‑based
  const year  = agora.getFullYear();

  const col = collection(db, 'users', ownerUid, 'students', stuId, 'payments');

  /* --- evita duplicidade mês/ano --- */
  const dupSnap = await getDocs(
    query(col, where('month', '==', month), where('year', '==', year))
  );
  if (!dupSnap.empty) {
    alert('Pagamento deste mês já está registrado.');
    return;
  }

  /* --- grava --- */
  await addDoc(col, {
    month,
    year,
    value     : Number(fee) || 0,
    timestamp : serverTimestamp()
  });

  /* --- feedback + recarrega lista --- */
  await listPayments(ownerUid, stuId);
  alert('Pagamento registrado com sucesso!');
}

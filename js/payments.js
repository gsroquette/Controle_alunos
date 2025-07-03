/* payments.js ------------------------------------------------------ */
import { db } from './firebase.js';
import { $  } from './utils.js';

import {
  collection, addDoc, getDocs, query, where,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ================================================================ */
/* 1. LISTAR PAGAMENTOS                                              */
/*    → sem `orderBy` para evitar necessidade de índice composto.    */
/*      Ordenação é feita no cliente (ano ↓, mês ↓).                */
/* ================================================================ */
export async function listPayments(user, stuId) {

  const UL = $('payments-list');
  UL.innerHTML = '<li>Carregando…</li>';

  try {
    const col   = collection(db, 'users', user.uid, 'students', stuId, 'payments');
    const snap  = await getDocs(col);           // sem filtros/ordenadores
    const rows  = snap.docs.map(d => ({ id:d.id, ...d.data() }));

    /* ----- ordena: ano desc | mês desc | timestamp desc ----- */
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
        `<li>${String(p.month).padStart(2,'0')}/${p.year} &nbsp;–&nbsp; ${ts}</li>`
      );
    });

    if (!rows.length) {
      UL.innerHTML = '<li>Nenhum pagamento ainda.</li>';
    }

  } catch (err) {
    console.error('Erro ao carregar pagamentos:', err);
    UL.innerHTML =
      '<li class="text-red-600">Erro ao carregar pagamentos.</li>';
  }
}

/* ================================================================ */
/* 2. ADICIONAR PAGAMENTO                                            */
/*    • evita duplicidade (mês/ano)                                  */
/*    • valor padrão é a mensalidade; pode vir zerado p/ bolsista    */
/* ================================================================ */
export async function addPayment(user, stuId, fee = 0) {

  const agora = new Date();
  const month = agora.getMonth() + 1;   // 0-based → 1-based
  const year  = agora.getFullYear();

  const col = collection(db, 'users', user.uid, 'students', stuId, 'payments');

  /* ---- já existe pagamento deste mês? ---- */
  const dupSnap = await getDocs(
    query(col,
      where('month', '==', month),
      where('year',  '==', year)
    )
  );
  if (!dupSnap.empty) {
    alert('Pagamento deste mês já está registrado.');
    return;
  }

  /* ---- grava ---- */
  await addDoc(col, {
    month,
    year,
    value     : Number(fee) || 0,
    timestamp : serverTimestamp()
  });

  /* ---- atualiza lista e feedback ---- */
  await listPayments(user, stuId);
  alert('Pagamento registrado com sucesso!');
}

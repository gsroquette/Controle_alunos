/*  payments.js  */
import { db } from './firebase.js';
import { $ }  from './utils.js';
import {
  collection, addDoc, getDocs,
  query, where, orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ---------- listar ---------- */
export async function listPayments(user, stuId) {
  const UL = $('payments-list');
  UL.innerHTML = '<li>Carregando…</li>';

  try {
    const col = collection(db, 'users', user.uid, 'students', stuId, 'payments');
    /* ordena apenas pelo timestamp (não exige índice composto) */
    const snap = await getDocs(query(col, orderBy('timestamp', 'desc')));

    UL.innerHTML = '';
    snap.forEach(p => {
      const d = p.data();
      const ts = d.timestamp?.seconds
        ? new Date(d.timestamp.seconds * 1000).toLocaleString()
        : '—';
      UL.insertAdjacentHTML(
        'beforeend',
        `<li>${d.month}/${d.year} – ${ts}</li>`
      );
    });

    if (!UL.children.length) {
      UL.innerHTML = '<li>Nenhum pagamento ainda.</li>';
    }
  } catch (err) {
    console.error('Erro ao carregar pagamentos:', err);
    UL.innerHTML = '<li class="text-red-600">Erro ao carregar pagamentos.</li>';
  }
}

/* ---------- adicionar ---------- */
export async function addPayment(user, stuId, fee) {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  const col = collection(db, 'users', user.uid, 'students', stuId, 'payments');
  const q   = query(col,
    where('month', '==', month),
    where('year',  '==', year)
  );

  if (!(await getDocs(q)).empty) {
    return alert('Pagamento deste mês já existe.');
  }

  await addDoc(col, {
    month,
    year,
    value: fee,
    timestamp: serverTimestamp()
  });

  await listPayments(user, stuId);
  alert('Pagamento registrado!');
}

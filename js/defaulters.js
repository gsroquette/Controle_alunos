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
  // Verificações de segurança
  if (!user || !user.role) {
    console.warn('Usuário inválido ou sem role em initDefaulters');
    return;
  }

  if (!cMap || !(cMap instanceof Map || typeof cMap === 'object')) {
    console.warn('centersMap inválido em initDefaulters');
    return;
  }

  // Garante que seja um Map
  centersMap = (cMap instanceof Map) ? cMap : new Map(Object.entries(cMap));
  currentUser = user;

  // Preenche o select de centros
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
  const monthIn = $('defaulters-month').value;          // yyyy-mm
  const center  = $('defaulters-center').value;

  if (!monthIn) {
    alert('Escolha o mês!');
    return;
  }

  const [y, m] = monthIn.split('-').map(Number);
  tbody.innerHTML = '<tr><td class="p-2">Carregando...</td></tr>';

  // Filtra alunos por centro se selecionado
  const qStu

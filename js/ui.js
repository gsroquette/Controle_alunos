/* ui.js -----------------------------------------------------------
 * Funções auxiliares de interface
 * ----------------------------------------------------------------*/

/* ========== utilitário ========= */
import { $ } from './utils.js';
import { formatMoney } from './utils.js';   // se precisar

/* ================================================================ */
/* 1. Detalhe do aluno                                              */
/* ================================================================ */
export function showStudentDetail(id, s) {
  // preenche os campos do "student-section"
  $('detail-name')    .textContent = s.name;
  $('detail-contact') .textContent = s.contact   || '—';
  $('detail-class')   .textContent = s.class     || '—';
  $('detail-guardian').textContent = s.guardian  || '—';
  $('detail-fee')     .textContent = s.fee != null ? formatMoney(s.fee) : '—';
  $('detail-notes')   .textContent = s.notes     || '';
  $('detail-created') .textContent =
    s.createdAt ? new Date(s.createdAt.seconds * 1000).toLocaleString('pt-BR')
                : '—';

  const photo = $('detail-photo');
  if (s.photoURL) {
    photo.src = s.photoURL;
    photo.classList.remove('hidden');
  } else {
    photo.classList.add('hidden');
  }

  // mostra section
  $('dashboard-section')?.classList.add   ('hidden');
  $('student-section')  ?.classList.remove('hidden');
}

/* ================================================================ */
/* 2. Ocultar section de detalhe                                    */
/* ================================================================ */
export function hideStudentDetail() {
  $('student-section' )?.classList.add   ('hidden');
  $('dashboard-section')?.classList.remove('hidden');
}

/* ================================================================ */
/* 3. Outros helpers de UI (se existirem)                           */
/* ================================================================ */
/* … adicione aqui se precisar … */

/* -----------------------------------------------------------------
 *  ⚠️ Atenção
 *  A antiga rotina que ficava aqui ouvindo "submit" em #center-form
 *  foi removida. O salvamento de centros é feito exclusivamente
 *  pelo módulo centers.js, evitando dupla submissão e campos vazios.
 * ----------------------------------------------------------------*/

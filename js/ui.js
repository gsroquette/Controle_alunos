/* utilitário simples */
export const $ = id => document.getElementById(id);

/* ----------------- referências das seções ----------------- */
const sections = {
  auth      : $('auth-section'),
  home      : $('home-section'),
  students  : $('dashboard-section'),
  detail    : $('student-section'),
  totals    : $('totals-section'),
  centers   : $('centers-section'),
  defaulters: $('defaulters-section')
};

/* esconde tudo antes de mostrar algo específico */
function hideAll() {
  Object.values(sections).forEach(sec => sec.classList.add('hidden'));
}

/* ------------------ navegação base ------------------ */
export function showAuth()        { hideAll(); sections.auth     .classList.remove('hidden'); }
export function showHome()        { hideAll(); sections.home     .classList.remove('hidden'); }
export function showStudents()    { hideAll(); sections.students .classList.remove('hidden'); }
export function showTotals()      { hideAll(); sections.totals   .classList.remove('hidden'); }
export function showCenters()     { hideAll(); sections.centers  .classList.remove('hidden'); }
export function showDefaulters()  { hideAll(); sections.defaulters.classList.remove('hidden'); }

/* --------------- detalhe do aluno ------------------- */
export function showStudentDetail(id, data) {
  /* preenche campos */
  $('detail-photo').src         = data.photoURL || '';
  $('detail-name').textContent  = data.name;
  $('detail-contact').textContent  = data.contact    || '';
  $('detail-class').textContent    = data.class      || '';
  $('detail-guardian').textContent = data.guardian   || '';
  $('detail-fee').textContent      = data.fee
      ? `Mensalidade: R$ ${data.fee.toFixed(2)}`
      : 'Bolsista';
  $('detail-notes').textContent    = data.notes      || '';
  $('detail-created').textContent  =
      data.createdAt ? new Date(data.createdAt.seconds*1000).toLocaleDateString() : '';

  /* mostra seção de detalhe */
  hideAll();
  sections.detail.classList.remove('hidden');
}

/* ---------- botões de “voltar” ---------- */
$('back-dashboard')    .onclick = showStudents;   // do detalhe → lista
$('back-to-students')  .onclick = showStudents;   // alias (caso id usado no HTML)
$('back-dashboard-2')  .onclick = showStudents;   // dos totals → lista
$('back-home-students').onclick = showHome;
$('back-home-totals')  .onclick = showHome;
$('back-home-centers') .onclick = showHome;
$('back-home-defaulters').onclick = showHome;

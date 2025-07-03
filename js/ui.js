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
  Object.values(sections).forEach(sec => sec?.classList.add('hidden'));
}

/* ------------------ navegação base ------------------ */
export function showAuth()       { hideAll(); sections.auth?.classList.remove('hidden'); }
export function showHome()       { hideAll(); sections.home?.classList.remove('hidden'); }
export function showStudents()   { hideAll(); sections.students?.classList.remove('hidden'); }
export function showTotals()     { hideAll(); sections.totals?.classList.remove('hidden'); }
export function showCenters()    { hideAll(); sections.centers?.classList.remove('hidden'); }
export function showDefaulters() { hideAll(); sections.defaulters?.classList.remove('hidden'); }

/* --------------- detalhe do aluno ------------------- */
export function showStudentDetail(id, data) {
  $('detail-photo')   ?.setAttribute('src', data.photoURL || '');
  $('detail-name')    ?.textContent = data.name;
  $('detail-contact') ?.textContent = data.contact  || '';
  $('detail-class')   ?.textContent = data.class    || '';
  $('detail-guardian')?.textContent = data.guardian || '';
  $('detail-fee')     ?.textContent = data.fee
        ? `Mensalidade: R$ ${data.fee.toFixed(2)}`
        : 'Bolsista';
  $('detail-notes')   ?.textContent = data.notes    || '';
  $('detail-created') ?.textContent =
        data.createdAt ? new Date(data.createdAt.seconds*1000)
                           .toLocaleDateString() : '';

  hideAll();
  sections.detail?.classList.remove('hidden');
}

/* ---------- helper seguro ---------- */
function bind(id, fn) {
  const el = $(id);
  if (el) el.onclick = fn;
}

/* ---------- botões de “voltar” ---------- */
bind('back-dashboard',          showStudents); // detalhe → lista
bind('back-to-students',        showStudents); // alias
bind('back-dashboard-2',        showStudents); // totals → lista
bind('back-home-students',      showHome);
bind('back-home-totals',        showHome);
bind('back-home-centers',       showHome);
bind('back-home-defaulters',    showHome);

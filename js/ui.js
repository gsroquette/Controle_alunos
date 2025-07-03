/* ui.js ------------------------------------------------------------------ */
import { $ }                    from './utils.js';
import { fillCenterSelects }    from './students.js';   // ✅ agora existe

/* ---------- refs das seções ---------- */
const sections = {
  auth      : $('auth-section'),
  home      : $('home-section'),
  students  : $('dashboard-section'),
  addForm   : $('add-student-section'),  // se usar split de telas
  detail    : $('student-section'),
  totals    : $('totals-section'),
  centers   : $('centers-section'),
  defaulters: $('defaulters-section')
};

/* helpers */
const hideAll  = () => Object.values(sections).forEach(el => el && el.classList.add('hidden'));
const showOnly = key => { hideAll(); sections[key] && sections[key].classList.remove('hidden'); };

/* exportadas para outros módulos */
export const showAuth       = () => showOnly('auth');
export const showHome       = () => showOnly('home');
export const showStudents   = () => showOnly('students');
export const showTotals     = () => showOnly('totals');
export const showCenters    = () => showOnly('centers');
export const showDefaulters = () => showOnly('defaulters');

/* ---------- detalhe do aluno ---------- */
export function showStudentDetail(id, data) {
  if (!sections.detail) return;         // segurança

  $('detail-photo')   && ( $('detail-photo').src         = data.photoURL || '' );
  $('detail-name')    && ( $('detail-name').textContent  = data.name );
  $('detail-contact') && ( $('detail-contact').textContent  = data.contact  || '' );
  $('detail-class')   && ( $('detail-class').textContent    = data.class    || '' );
  $('detail-guardian')&& ( $('detail-guardian').textContent = data.guardian || '' );
  $('detail-fee')     && ( $('detail-fee').textContent      =
        data.fee ? `Mensalidade: R$ ${data.fee.toFixed(2)}` : 'Bolsista' );
  $('detail-notes')   && ( $('detail-notes').textContent    = data.notes    || '' );
  $('detail-created') && ( $('detail-created').textContent  =
        data.createdAt ? new Date(data.createdAt.seconds * 1000)
                           .toLocaleDateString() : '' );

  showOnly('detail');
}

/* ---------- botões “voltar” ---------- */
[
  ['back-dashboard'       , showStudents],
  ['back-to-students'     , showStudents],
  ['back-dashboard-2'     , showStudents],
  ['back-home-students'   , showHome],
  ['back-home-totals'     , showHome],
  ['back-home-centers'    , showHome],
  ['back-home-defaulters' , showHome]
].forEach(([id, fn]) => {
  const el = $(id);
  if (el) el.onclick = fn;
});

/* ---------- formulário de Centros (atualiza selects) ---------- */
const centerForm = $('center-form');
if (centerForm) {
  centerForm.onsubmit = async e => {
    e.preventDefault();
    // ... salvar no Firestore (já deve existir em centers.js) ...
    // Depois de salvo:
    fillCenterSelects();          // ← mantém filtros/ formulário sincronizados
    alert('Centro salvo!');
    e.target.reset();
  };
}

/* inicia na Auth por padrão */
showAuth();

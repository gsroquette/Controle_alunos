/* ui.js ============================================================ */
import { $ }                   from './utils.js';
import { fillCenterSelects }   from './students.js';   // mantém selects sincronizados

/* -------- referências das seções -------- */
const sections = {
  auth      : $('auth-section'),
  home      : $('home-section'),
  students  : $('dashboard-section'),
  addForm   : $('add-student-section'), 
  detail    : $('student-section'),
  totals    : $('totals-section'),
  centers   : $('centers-section'),
  defaulters: $('defaulters-section')
};

/* helpers show / hide ---------------------------------------------- */
const hideAll  = () => Object.values(sections)
  .forEach(el => el && el.classList.add('hidden'));

const showOnly = key => {
  hideAll();
  sections[key]?.classList.remove('hidden');
};

/* ---------- exportados para outros módulos ---------- */
export const showAuth       = () => showOnly('auth');
export const showHome       = () => showOnly('home');
export const showStudents   = () => { showOnly('students'); };
export const showTotals     = () => showOnly('totals');
export const showCenters    = () => showOnly('centers');
export const showDefaulters = () => showOnly('defaulters');

/* ==================================================== */
/*   Detalhe do aluno                                   */
/* ==================================================== */
export function showStudentDetail(id, data) {
  if (!sections.detail) return;               // segurança

  $('detail-photo')   && ( $('detail-photo').src        = data.photoURL || '' );
  $('detail-name')    && ( $('detail-name').textContent = data.name );
  $('detail-contact') && ( $('detail-contact').textContent  = data.contact  || '' );
  $('detail-class')   && ( $('detail-class').textContent    = data.class    || '' );
  $('detail-guardian')&& ( $('detail-guardian').textContent = data.guardian || '' );
  $('detail-fee')     && ( $('detail-fee').textContent =
        data.fee ? `Mensalidade: R$ ${data.fee.toFixed(2)}` : 'Bolsista' );
  $('detail-notes')   && ( $('detail-notes').textContent   = data.notes    || '' );
  $('detail-created') && ( $('detail-created').textContent =
        data.createdAt ? new Date(data.createdAt.seconds * 1000)
                           .toLocaleDateString() : '' );

  showOnly('detail');
}

/* ---------- botões “voltar” ---------- */
[
  ['back-dashboard'        , showStudents],
  ['back-to-students'      , showStudents],
  ['back-dashboard-2'      , showStudents],
  ['back-home-students'    , showHome    ],
  ['back-home-totals'      , showHome    ],
  ['back-home-centers'     , showHome    ],
  ['back-home-defaulters'  , showHome    ]
].forEach(([id, fn]) => {
  const el = $(id);
  if (el) el.onclick = fn;
});

/* ==================================================== */
/*  Formulário de Centros – repopula selects após salvar */
/* ==================================================== */
const centerForm = $('center-form');
if (centerForm) {
  centerForm.addEventListener('submit', async e => {
    e.preventDefault();
    /* a lógica real de salvar fica em centers.js;
       aqui só aguardamos e repopulamos filtros */
    // -> centers.js já intercepta o submit e salva

    await fillCenterSelects();       // sincroniza filtros / formulário
    alert('Centro salvo!');
    e.target.reset();
  });
}

/* exibe login por padrão até onAuthStateChanged trocar para Home */
showAuth();

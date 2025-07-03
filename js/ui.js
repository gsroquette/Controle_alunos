/* utilitário curto --------------------------------------------------*/
export const $ = id => document.getElementById(id);

/* importa helper para repopular centros -----------------------------*/
import { fillCenterSelects } from './students.js';

/* helpers seguros ---------------------------------------------------*/
const safeShow = el => { if (el) el.classList.remove('hidden'); };
const safeHide = el => { if (el) el.classList.add   ('hidden'); };

/* referências das seções ------------------------------------------- */
const sections = {
  auth      : $('auth-section'),
  home      : $('home-section'),
  students  : $('dashboard-section'),
  detail    : $('student-section'),
  totals    : $('totals-section'),
  centers   : $('centers-section'),
  defaulters: $('defaulters-section')
};

/* esconde tudo antes de mostrar algo específico -------------------- */
function hideAll() {
  Object.values(sections).forEach(safeHide);
}

/* navegação base ---------------------------------------------------- */
export function showAuth()       { hideAll(); safeShow(sections.auth);       }
export function showHome()       { hideAll(); safeShow(sections.home);       }
export function showStudents()   {
  hideAll();
  safeShow(sections.students);
  fillCenterSelects();                 // ← repopula o select de centros
}
export function showTotals()     { hideAll(); safeShow(sections.totals);     }
export function showCenters()    { hideAll(); safeShow(sections.centers);    }
export function showDefaulters() { hideAll(); safeShow(sections.defaulters); }

/* detalhe do aluno -------------------------------------------------- */
export function showStudentDetail(id, data) {
  hideAll(); safeShow(sections.detail);

  $('detail-photo')    && ($('detail-photo').src          = data.photoURL || '');
  $('detail-name')     && ( $('detail-name').textContent  = data.name );
  $('detail-contact')  && ( $('detail-contact').textContent  = data.contact  || '' );
  $('detail-class')    && ( $('detail-class').textContent    = data.class    || '' );
  $('detail-guardian') && ( $('detail-guardian').textContent = data.guardian || '' );
  $('detail-fee')      && ( $('detail-fee').textContent =
      data.fee ? `Mensalidade: R$ ${data.fee.toFixed(2)}` : 'Bolsista' );
  $('detail-notes')    && ( $('detail-notes').textContent    = data.notes    || '' );
  $('detail-created')  && ( $('detail-created').textContent  =
      data.createdAt ? new Date(data.createdAt.seconds * 1000)
                         .toLocaleDateString() : '' );
}

/* botões “voltar” (só registra se o elemento existir) --------------- */
[
  ['back-dashboard'       , showStudents ],
  ['back-to-students'     , showStudents ],
  ['back-dashboard-2'     , showStudents ],
  ['back-home-students'   , showHome     ],
  ['back-home-totals'     , showHome     ],
  ['back-home-centers'    , showHome     ],
  ['back-home-defaulters' , showHome     ]
].forEach(([id, fn]) => {
  const el = $(id);
  if (el) el.onclick = fn;
});

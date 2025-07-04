// auth.js
import { auth }  from './firebase.js';
import { $ }     from './utils.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let isLogin = true;

export function initAuth(callbackLogged) {

  const toggleAuth = $('toggle-auth');
  const authTitle  = $('auth-title');
  const authBtn    = $('auth-btn');
  const toggleMsg  = $('toggle-msg');
  const authForm   = $('auth-form');
  const logoutBtn  = $('logout-btn');

  /* alterna login / cadastro */
  toggleAuth.addEventListener('click', () => {
    isLogin = !isLogin;
    authTitle.textContent  = isLogin ? 'Login' : 'Cadastro';
    authBtn.textContent    = isLogin ? 'Entrar' : 'Cadastrar';
    toggleMsg.textContent  = isLogin ? 'Não tem conta?' : 'Já tem conta?';
    toggleAuth.textContent = isLogin ? 'Cadastre-se' : 'Entrar';
  });

  /* submit */
  authForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('email').value.trim();
    const pwd   = $('password').value.trim();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, pwd);
      } else {
        await createUserWithEmailAndPassword(auth, email, pwd);
      }
    } catch (err) {
      alert(err.message);
    }
  });

  /* logout */
  logoutBtn.addEventListener('click', () => signOut(auth));

  /* listener global */
  onAuthStateChanged(auth, user => {
    if (user) {
      callbackLogged(user);  // main.js exibe a Home
    } else {
      // Mostra login e oculta todas as outras seções
      $('auth-section')?.classList.remove('hidden');
      $('home-section')?.classList.add('hidden');
      $('dashboard-section')?.classList.add('hidden');
      $('add-student-section')?.classList.add('hidden');
      $('student-section')?.classList.add('hidden');
      $('totals-section')?.classList.add('hidden');
      $('centers-section')?.classList.add('hidden');
      $('defaulters-section')?.classList.add('hidden');
    }
  });
}

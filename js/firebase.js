import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth      }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCMj7GTYkXHldMwQS_ub_wKal-D_8Fdgmc",
  authDomain:        "controlealunos-d635a.firebaseapp.com",
  projectId:         "controlealunos-d635a",
  storageBucket:     "controlealunos-d635a.appspot.com",
  messagingSenderId: "246922345039",
  appId:             "1:246922345039:web:71f6d0ee2dbf824b38483a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

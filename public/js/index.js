import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCi7b6kmzFfZyV8Nrcg_73MbwuvPeBs6sc",
  authDomain: "fir-project-a57d5.firebaseapp.com",
  databaseURL: "https://fir-project-a57d5-default-rtdb.firebaseio.com",
  projectId: "fir-project-a57d5",
  storageBucket: "fir-project-a57d5.appspot.com",
  messagingSenderId: "1033787572285",
  appId: "1:1033787572285:web:2cd657e2acc7a7a652aa54",
  measurementId: "G-L97BN83E2Z"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
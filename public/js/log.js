import { auth } from "./index.js"
import { createUserWithEmailAndPassword,  signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const showToast = (message) => {
    document.querySelector('#liveToast .toast-body').innerText = message;
    const toast = new bootstrap.Toast(document.getElementById('liveToast'));
    toast.show();
}

const SignUp = (event) => {
      
    event.preventDefault();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const firstName = document.getElementById('fname').value.trim();
    const lastName = document.getElementById('lname').value.trim();
  
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        showToast('Account Created Successfully');
        updateProfile(userCredential.user, {
            displayName: firstName + ' ' + lastName,
        }).then(() => window.location.href= 'index.html' )
            .catch((error) => console.log(error))
    })
    .catch((error) => {
        document.getElementById('error1').innerText = error.code.replace('auth/', '').replace('-', ' ') + error.message.replace(/\(.*?\)/g, '').replace('Firebase:', ' ');
    })
}
  
const Login = (event) => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
  
    signInWithEmailAndPassword(auth, email, password)
    .then(() => window.location.href='home.html')
    .catch((error) => {
        if (error.code === 'auth/invalid-credential') {
          document.getElementById('error2').innerText = "Incorrect Email or Password."
        }
        else {
          document.getElementById('error2').innerText = "Error: " + error.code.replace('auth/', '');
        }
    })
}
  
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('submits').addEventListener('submit', (event) => SignUp(event));
    document.getElementById('submiti').addEventListener('submit', (event) => Login(event));
});
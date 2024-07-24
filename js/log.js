import {db, auth, createUserWithEmailAndPassword, doc, setDoc, signInWithEmailAndPassword} from "./index.js"

const showToast = (message) => {
    document.querySelector('#liveToast .toast-body').innerText = message;
    const toast = new bootstrap.Toast(document.getElementById('liveToast'));
    toast.show();
}

const Login = (event) => {
      
    event.preventDefault();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const firstName = document.getElementById('fname').value.trim();
    const lastName = document.getElementById('lname').value.trim();
  
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
           const user = userCredential.user;
           const userData = {
               email: email,
               firstName: firstName,
               lastName:lastName
           };
           showToast('Account Created Successfully');
           const docRef = doc(db, "users", user.uid);
           setDoc(docRef,userData)
           .then(() => {
               window.location.href= 'index.html';
           })
           .catch((error)=>{
               console.error("error writing document: ", error);
           });
       })
       .catch((error) => {
        console.error('Error registering user:', error.code, error.message);
        document.getElementById('error1').innerText = "Error: " + error.code.replace('auth/', '').replace('-', ' ');  
       })
}
  
const SignUp = (event) => {
      
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
  
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        localStorage.setItem('loggedInUserId', userCredential.user.uid);
        window.location.href='home.html';})
    .catch((error) => {
        console.error('Error registering user:', error.code);
        if (error.code === 'auth/invalid-credential') {
          document.getElementById('error2').innerText = "Incorrect Email or Password."
        }
        else {
          document.getElementById('error2').innerText = "Error: " + error.code.replace('auth/', '').replace('-', ' ');  
        }
    })
  
}
  
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('submiti').addEventListener('click', (event) => SignUp(event));
    document.getElementById('submits').addEventListener('click', (event) => Login(event));
});
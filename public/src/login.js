import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { CONFIG } from "../src/config.js";

const firebaseConfig = {
  apiKey: CONFIG.apiKey,
  authDomain: CONFIG.authDomain,
  databaseURL: CONFIG.databaseURL,
  projectId: CONFIG.projectId,
  storageBucket: CONFIG.storageBucket,
  messagingSenderId: CONFIG.messagingSenderId,
  appId: CONFIG.appId,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();

const password = document.getElementById("password");
const email = document.getElementById("email");
const submitBtn = document.getElementById("submit");

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]{8,}$/;

const loggedInUser = sessionStorage.getItem("username");
const passEye = document.getElementById("passeye");
let showPassword = false;

passEye.addEventListener("click", () => {
  if (!showPassword) {
    passEye.src = "assets/icons8-show-password-24.png";
    password.type = "text";
    showPassword = true;
  } else {
    passEye.src = "assets/icons8-hide-password-24.png";
    password.type = "password";
    showPassword = false;
  }
});

submitBtn.addEventListener("click", () => {
  if (email.value === "" || password.value === "") {
    alert("Fill all inputs!!!");
  } else if (!emailRegex.test(email.value)) {
    alert("check mail");
  } else if (!passwordRegex.test(password.value)) {
    alert("check password");
  } else {
    signInWithEmailAndPassword(auth, email.value, password.value)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log(user);
        if (user.emailVerified) {
          updateProfile(auth.currentUser, {
            displayName: loggedInUser,
          })
            .then((res) => {
              console.log(res);
            })
            .catch((error) => {
              alert(error.message);
            });
          showSuccess("Email verified! You're now signed in.").then(() => {
            login();
          });
        } else {
          Swal.fire({
            text: "Please verify your email before signing in.",
            timer: "2000",
            timerProgressBar: true,
          });
          auth.signOut();
        }
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
      });
  }
});

function login() {
  window.location.href = sessionStorage.getItem("prevUrl");
}

async function showSuccess(message) {
  return new Promise((resolve) => {
    Swal.fire({
      background: "#28a745",
      color: "#fff",
      height: "fit-content",
      padding: "0 0",
      position: "top",
      showConfirmButton: false,
      text: `${message}`,
      timer: 1500,
      timerProgressBar: true,
    }).then(() => {
      resolve();
    });
  });
}

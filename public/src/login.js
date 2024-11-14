import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { CONFIG } from "../src/config.js";
import { showSuccess, showError } from "./utils/customAlerts.js";

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
const gProvider = new GoogleAuthProvider();

const password = document.getElementById("password");
const email = document.getElementById("email");
const submitBtn = document.getElementById("submit");
const googleBtn = document.getElementById("signwithgg");
const openDialogBtn = document.getElementById("openDialogBtn");
const dialog = document.getElementById("myDialog");
const forgotBtn = document.getElementById("forgotbtn");

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
  submitBtn.style.position = "relative";
  submitBtn.style.height = "3rem";
  submitBtn.innerHTML = `<div class="loader-overlay">
          <div class="loader"></div>
        </div>`;
  if (email.value === "" || password.value === "") {
    showError("Please fill all inputs").then(() => {
      submitBtn.innerHTML = "Login";
    });
  } else if (!emailRegex.test(email.value)) {
    showError("Wrong email format").then(() => {
      submitBtn.innerHTML = "Login";
    });
  } else if (!passwordRegex.test(password.value)) {
    showError("Wrong password format").then(() => {
      submitBtn.innerHTML = "Login";
    });
  } else {
    signInWithEmailAndPassword(auth, email.value, password.value)
      .then((userCredential) => {
        const user = userCredential.user;
        if (user.emailVerified) {
          updateProfile(auth.currentUser, {
            displayName: loggedInUser,
          })
            .then((res) => {
              console.log(res);
            })
            .catch((error) => {
              showError(error.message);
            });
          showSuccess("Login Successful").then(() => {
            login();
          });
        } else {
          showSuccess("Please verify your email before signing in.").then(
            () => {
              auth.signOut();
            }
          );
        }
      })
      .catch((error) => {
        submitBtn.innerHTML = "Login";
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
        if (errorCode === "auth/invalid-credential") {
          showError("Incorrect Email or Password");
        } else if (errorCode === "auth/too-many-requests") {
          showError("Too many failed requests, please try again later");
        }
      });
  }
});

googleBtn.addEventListener("click", () => {
  signInWithPopup(auth, gProvider)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      login();
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode);
      console.log(errorMessage);
      showError(errorMessage);
    });
});

openDialogBtn.addEventListener("click", () => {
  dialog.showModal();
});

dialog.addEventListener("click", (e) => {
  if (e.target.tagName === "DIALOG") {
    dialog.close();
  }
});

forgotBtn.addEventListener("click", () => {
  const resetEmail = document.getElementById("resetemail");
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (resetEmail.value === "") {
    showError("Email field can't be empty");
  } else if (!emailRegex.test(resetEmail.value)) {
    showError("check mail");
  } else {
    sendPasswordResetEmail(auth, resetEmail.value)
      .then(() => {
        showSuccess("Password reset email sent. Please check your email.");
        location.reload();
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
        showError(errorMessage);
      });
  }
});

function login() {
  const prevUrl = sessionStorage.getItem("prevUrl");
  sessionStorage.removeItem("prevUrl");
  window.location.href = prevUrl || "index.html";
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
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
const gProvider = new GoogleAuthProvider();

const email = document.getElementById("email");
const theName = document.getElementById("thename");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmpassword");
const submitBtn = document.getElementById("submit");
const errors = document.querySelectorAll("#err");
const inputs = document.querySelectorAll(".field-wrapper");
const googleBtn = document.getElementById("signwithgg");
const passEyes = document.querySelectorAll("#passeye");
let showPassword = false;

const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[-'\s][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]{8,}$/;

passEyes[0].addEventListener("click", () => {
  if (!showPassword) {
    passEyes[0].src = "assets/icons8-show-password-24.png";
    password.type = "text";
    showPassword = true;
  } else {
    passEyes[0].src = "assets/icons8-hide-password-24.png";
    password.type = "password";
    showPassword = false;
  }
});

passEyes[1].addEventListener("click", () => {
  if (!showPassword) {
    passEyes[1].src = "assets/icons8-show-password-24.png";
    confirmPassword.type = "text";
    showPassword = true;
  } else {
    passEyes[1].src = "assets/icons8-hide-password-24.png";
    confirmPassword.type = "password";
    showPassword = false;
  }
});

submitBtn.addEventListener("click", () => {
  if (
    theName.value === "" ||
    email.value === "" ||
    password.value == "" ||
    confirmPassword.value === ""
  ) {
    errors.forEach((error) => {
      error.innerHTML = "Required!!!";
    });
    inputs.forEach((input) => {
      input.style.borderColor = "red";
    });
    setTimeout(() => {
      errors.forEach((error) => {
        error.innerHTML = "";
      });
      inputs.forEach((input) => {
        input.style.borderColor = "#999";
      });
    }, 2000);
  } else if (!nameRegex.test(theName.value)) {
    alert("check name");
  } else if (!emailRegex.test(email.value)) {
    alert("check mail");
  } else if (password.value !== confirmPassword.value) {
    alert("passwords do not match");
  } else if (!passwordRegex.test(password.value)) {
    alert("check password");
  } else {
    createUserWithEmailAndPassword(auth, email.value, password.value)
      .then((userCredential) => {
        sendEmailVerification(userCredential.user)
          .then(() => {
            alert(
              "Verification email sent. Please verify your email before proceeding."
            );
            auth.signOut();
            sessionStorage.setItem("username", `${theName.value}`);
            location.replace("login.html");
          })
          .catch((error) => {
            console.error("Error sending verification email:", error);
          });
        const user = userCredential.user;
        console.table(user);
      })
      .catch((error) => {
        const errorCode = error.code;
        showError(errorCode);
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
      const email = error.customData.email;
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.log(credential);
      console.log(email);
      console.log(errorCode);
      console.log(errorMessage);
      showError(errorMessage);
    });
});

function login() {
  window.location.href = sessionStorage.getItem("prevUrl");
}

async function showError(message) {
  Swal.fire({
    background: "#DC3545",
    borderRadius: "0px",
    color: "#fff",
    height: "fit-content",
    padding: "0",
    position: "top",
    showConfirmButton: false,
    text: `${message}`,
    timer: 1500,
    timerProgressBar: true,
    width: "fit-content",
  });
}

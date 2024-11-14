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
  submitBtn.style.position = "relative";
  submitBtn.style.height = "3rem";
  submitBtn.innerHTML = `<div class="loader-overlay">
          <div class="loader"></div>
        </div>`;
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
    showError("check name").then(() => {
      submitBtn.innerHTML = "Sign up";
    });
  } else if (!emailRegex.test(email.value)) {
    showError("check mail").then(() => {
      submitBtn.innerHTML = "Sign up";
    });
  } else if (password.value !== confirmPassword.value) {
    showError("passwords do not match").then(() => {
      submitBtn.innerHTML = "Sign up";
    });
  } else if (!passwordRegex.test(password.value)) {
    showError("check password").then(() => {
      submitBtn.innerHTML = "Sign up";
    });
  } else {
    createUserWithEmailAndPassword(auth, email.value, password.value)
      .then((userCredential) => {
        sendEmailVerification(userCredential.user)
          .then(() => {
            showSuccess(
              "Verification email sent. Please verify your email before proceeding."
            ).then(() => {
              submitBtn.innerHTML = "Sign up";
              auth.signOut();
              sessionStorage.setItem("username", `${theName.value}`);
              location.replace("login.html");
            });
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
      console.log(errorCode);
      console.log(errorMessage);
      showError(errorMessage);
    });
});

function login() {
  const prevUrl = sessionStorage.getItem("prevUrl");
  if (prevUrl) {
    sessionStorage.removeItem("prevUrl");
  }
  window.location.href = prevUrl || "index.html";
}

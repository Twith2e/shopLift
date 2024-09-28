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
const urlParams = new URLSearchParams(window.location.search);
const redirectParam = urlParams.get("redirect");
const redirectUrl =
  redirectParam && isValidRedirectUrl(redirectParam)
    ? redirectParam
    : "index.html";

const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[-'\s][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]{8,}$/;

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
    alert("Success!!!");
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
        const errorMessage = error.message;
        console.table(errorCode);
        console.table(errorMessage);
        console.log(error);
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
      alert(errorMessage);
    });
});

function isValidRedirectUrl(url) {
  try {
    const redirectPath = new URL(url).pathname;
    const allowedPaths = ["/checkout.html", "/index.html", "/sell.html"];
    return allowedPaths.includes(redirectPath);
  } catch (e) {
    return false;
  }
}

function login() {
  // Perform login logic here

  // Redirect back to the originating page
  window.location.href = redirectUrl;
}
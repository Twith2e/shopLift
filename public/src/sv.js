import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { CONFIG } from "./config.js";

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
const database = getFirestore();
const auth = getAuth();
auth.languageCode = "it";

const phoneNum = document.getElementById("phonenum");
const otpBtn = document.getElementById("otpbtn");

const phoneNumber = getPhoneNumberFromUserInput();
const code = getCodeFromUserInput();

const phoneRegex = /^(?:\+234)(?:70|80|81|90|91)[0-9]{8}$/;

window.recaptchaVerifier = new RecaptchaVerifier(auth, "otpbtn", {
  size: "invisible",
  hl: "en",
  // callback: (response) => {
  //   console.log(response);

  //   onSignInSubmit();
  // },
});

window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptchacontainer", {
  hl: "en",
});

const appVerifier = window.recaptchaVerifier;

otpBtn.addEventListener("click", () => {
  signInWithPhoneNumber(auth, phonenum.value, appVerifier)
    .then((confirmationResult) => {
      window.confirmationResult = confirmationResult;
      alert(confirmationResult);
    })
    .catch((error) => {
      console.log("signin" + error);

      alert("signin" + error.message);
    });
});

confirmotp.addEventListener("click", () => {
  confirmationResult
    .confirm(otpinput.value)
    .then((result) => {
      // auth.signOut();
      updateUser();
      const user = result.user;
      console.log(user);

      // location.replace("sell.html");
    })
    .catch((error) => {
      alert("confirm" + error);
    });
});

phoneNum.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^0-9+]/g, "");
});

otpinput.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^0-9]/g, "");
});

async function updateUser() {
  try {
    const docRef = doc(database, "users/" + auth.currentUser.uid);

    console.table();
    try {
      await updateDoc(docRef, {
        sellerVerified: "true",
      });
      console.log("added back to db");
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    alert(error.message);
  }
}

function getPhoneNumberFromUserInput() {
  if (phoneNum.value) {
    return phoneNum.value;
  }
}

function getCodeFromUserInput() {
  if (otpinput.value) {
    return otpinput.value;
  }
}

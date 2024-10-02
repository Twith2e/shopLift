import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
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
const database = getFirestore();
const auth = getAuth();

const searchInput = document.getElementById("searchinput");
const clearInputBtn = document.getElementById("clearinputbtn");
const searchBtn = document.querySelector(".searchbtn");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.warn("No user is signed in");
  }
});

searchInput.addEventListener("input", () => {
  if (searchInput.value !== "") {
    clearInputBtn.style.display = "block";
    searchBtn.style.backgroundColor = "#fb8d28";
  } else {
    clearInputBtn.style.display = "none";
    searchBtn.style.backgroundColor = "#777";
  }
});

clearInputBtn.addEventListener("click", () => {
  searchInput.value = "";
});

searchBtn.addEventListener("click", () => {
  if (searchInput.value.trim() !== "") {
    let productDetails = {
      productName: searchInput.value.trim(),
    };
    sessionStorage.setItem("productDets", JSON.stringify(productDetails));
    location.replace("category.html");
  } else {
    showError("input field cant be empty");
  }
});

document.body.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (searchInput.value.trim() !== "") {
      let productDetails = {
        productName: searchInput.value.trim(),
      };
      sessionStorage.setItem("productDets", JSON.stringify(productDetails));
      location.replace("category.html");
    } else {
      showError("input field cant be empty");
    }
  }
});

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

async function showError(message) {
  Swal.fire({
    background: "#DC3545",
    borderRadius: "0px",
    color: "#fff",
    height: "fit-content",
    position: "top-end",
    showConfirmButton: false,
    text: `${message}`,
    timer: 1500,
    timerProgressBar: true,
    width: "fit-content",
  });
}

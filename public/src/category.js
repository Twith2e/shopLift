import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { CONFIG } from "../src/config.js";
import { setupNetworkMonitoring } from "./utils/networkUtils.js";

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
setupNetworkMonitoring(app);
const auth = getAuth();
const database = getFirestore();

const categoryInput = document.getElementById("catinput");
const doneBtn = document.getElementById("done");
const categoryList = document.getElementById("categorylist");

document.addEventListener("DOMContentLoaded", () => {
  var myModal = new bootstrap.Modal(document.getElementById("myModal"));
  myModal.show();
});

let productDetails = JSON.parse(sessionStorage.getItem("productDets"));

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.body.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (categoryInput.value.trim() !== "") {
          productDetails.category = categoryInput.value.trim();
          sessionStorage.setItem("productDets", JSON.stringify(productDetails));
          createCategory();
        } else {
          showError("input field cant be empty");
        }
        categoryInput.value = "";
      }
    });

    doneBtn.addEventListener("click", () => {
      if (categoryInput.value.trim() !== "") {
        productDetails.category = categoryInput.value.trim();
        sessionStorage.setItem("productDets", JSON.stringify(productDetails));
        createCategory();
      } else {
        showError("input field cant be empty");
      }
      categoryInput.value = "";
    });
  } else {
    showError("Login bitch").then(() => {
      sessionStorage.setItem("prevUrl", window.location.href);
      location.replace("login.html");
    });
  }
});

async function renderCategory() {
  const categoriesRef = collection(database, "categories");
  const querySnapshot = await getDocs(categoriesRef);

  let categoryNames = [];

  querySnapshot.forEach((doc) => {
    categoryNames.push(doc.data().name);
  });

  categoryNames.sort();

  categoryNames.forEach((name) => {
    const listButton = document.createElement("button");
    listButton.value = name;
    listButton.textContent = name;
    listButton.id = "listbtn";
    listButton.classList.add(
      "text-start",
      "w-100",
      "border-0",
      "border-bottom",
      "p-3",
      "bg-transparent",
      "custom-focus"
    );
    listButton.addEventListener("click", () => {
      categoryInput.value = listButton.value;
    });
    categoryList.appendChild(listButton);
  });
}
renderCategory();

async function createCategory() {
  try {
    const categoryName = categoryInput.value.trim();
    const q = query(
      collection(database, "categories"),
      where("name", "==", toTitleCase(categoryName))
    );
    const querySnapshot = await getDocs(q);

    const existingCategory = querySnapshot.docs.find(
      (doc) => doc.data().name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!existingCategory) {
      const docRef = await addDoc(collection(database, "categories"), {
        name: toTitleCase(categoryName),
        createdAt: serverTimestamp(),
      });
      if (!docRef) {
        showError("Category creation failed");
      }
    }
    location.replace("completelist.html");
  } catch (error) {
    showError(error.message);
    console.log(error);
  }
}

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

async function showError(message) {
  Swal.fire({
    icon: "error",
    title: "Error",
    text: message,
    background: "#DC3545",
    color: "#fff",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    customClass: {
      popup: "animated fadeInDown swal-wide",
      title: "swal-title",
      content: "swal-text",
    },
  });
}

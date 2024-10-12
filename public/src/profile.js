import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDoc,
  getDocs,
  doc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getStorage,
  getDownloadURL,
  ref,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";
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
const auth = getAuth();
const database = getFirestore();
const storage = getStorage();
const formatter = Intl.NumberFormat("en-NG");

const searchBar = document.getElementById("seachbar");
const searchIcon = document.getElementById("searchicon");
const searchBtns = document.querySelectorAll("#searchbtn");
const searchInputs = document.querySelectorAll("#searchinput");
const profileBtns = document.querySelectorAll("#profilebtn");
const profileDropdowns = document.querySelectorAll("#profiledropdown");
const userNames = document.querySelectorAll("#username");
const signOutBtn = document.getElementById("signoutbtn");
const profileInfo = document.getElementById("profile-info");
const ddList = document.getElementById("dd-list");
const cardwrapperTemp = document.getElementById("cardwrappertemp");
const cardwrapper = document.getElementById("cardwrapper");
let dropdownShown = false;
let seeSearchBar = false;

onAuthStateChanged(auth, (user) => {
  if (user) {
    userNames.forEach((name) => {
      name.textContent = user.displayName.split(" ")[0];
    });
    signOutBtn.addEventListener("click", () => {
      confirm("Do you want to sign out?");
      const confirmButton = document.querySelector(".swal2-confirm");
      if (confirmButton) {
        confirmButton.addEventListener("click", () => {
          signOut(auth)
            .then(() => {
              Swal.fire({
                text: "Sign out successful",
                showConfirmButton: false,
                timer: 1500,
                position: "top",
              }).then(() => {
                location.reload();
              });
            })
            .catch((error) => {
              Swal.fire({
                title: "Error!",
                text: error.message,
                icon: "error",
                showConfirmButton: false,
                timer: 1500,
              });
            });
        });
      }
    });
  } else {
    profileInfo.style.display = "none";
    ddList.innerHTML = `<li id="signup">Create Account</li>
    <li id="login">Login</li>`;
    const loginBtn = document.getElementById("login");
    const signupBtn = document.getElementById("signup");

    loginBtn.addEventListener("click", () => {
      sessionStorage.setItem("prevUrl", window.location.href);
      location.href = "login.html";
    });

    signupBtn.addEventListener("click", () => {
      sessionStorage.setItem("prevUrl", window.location.href);
      location.href = "signup.html";
    });

    location.href = "login.html";
  }
});

document.body.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchInputs.forEach((input) => {
      const searchValue = input.value.trim();
      searchProductsByInput(searchValue);
    });
  }
});

searchBtns.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    const searchValue = searchInputs[index].value.trim();
    searchProductsByInput(searchValue);
    searchInputs[index].value = "";
  });
});

async function searchProductsByInput(searchTerm) {
  const lowercaseSearchTerm = searchTerm.toLowerCase();

  const productsRef = collection(database, "products");
  const querySnapshot = await getDocs(productsRef);

  const matchingProducts = [];

  querySnapshot.forEach((doc) => {
    const product = doc.data();
    const productName = product.productName.toLowerCase();
    const brand = product.brand.toLowerCase();
    const category = product.category.toLowerCase();

    if (
      productName.includes(lowercaseSearchTerm) ||
      brand.includes(lowercaseSearchTerm) ||
      category.includes(lowercaseSearchTerm)
    ) {
      matchingProducts.push(doc.id);
    }
  });

  localStorage.setItem("searchTerm", searchTerm);
  console.log(searchTerm);

  console.log(matchingProducts);
  location.href = "search.html?searchTerm=" + matchingProducts;
  return matchingProducts;
}

profileBtns.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    if (!dropdownShown) {
      if (seeSearchBar) {
        searchBar.style.display = "none";
        seeSearchBar = false;
      }
      profileDropdowns[index].style.display = "block";
      dropdownShown = true;
    } else {
      profileDropdowns[index].style.display = "none";
      dropdownShown = false;
    }
  });
});

searchIcon.addEventListener("click", () => {
  if (!seeSearchBar) {
    if (dropdownShown) {
      profileDropdown.style.display = "none";
      dropdownShown = false;
    }
    searchBar.style.display = "block";
    seeSearchBar = true;
  } else {
    searchBar.style.display = "none";
    seeSearchBar = false;
  }
});

function confirm(message) {
  Swal.fire({
    title: "<strong>Sign Out</strong>",
    icon: "info",
    html: `
    ${message}
  `,
    showCloseButton: true,
    showCancelButton: true,
    focusConfirm: false,
    confirmButtonText: `
    Yes
  `,
    confirmButtonAriaLabel: "Thumbs up, great!",
    cancelButtonText: `
    No
  `,
    cancelButtonAriaLabel: "Thumbs down",
  });
}

async function showError(message) {
  Swal.fire({
    background: "#DC3545",
    borderRadius: "0px",
    color: "#fff",
    height: "fit-content",
    padding: "0",
    position: "top-end",
    showConfirmButton: false,
    text: `${message}`,
    timer: 1500,
    timerProgressBar: true,
    width: "fit-content",
  });
}

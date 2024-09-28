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
  setDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getStorage,
  getDownloadURL,
  ref,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

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
const database = getFirestore();
const storage = getStorage();

const formatter = Intl.NumberFormat("en-NG");
const authDisplay = document.getElementById("authdisplay");
const loginBtn = document.getElementById("login");
const productsContainer = document.getElementById("products-container");
const searchBtn = document.getElementById("searchbtn");
const categoryLinks = document.getElementById("categorylinks");

let uid;
let isDropped = false;
let isShown = false;

onAuthStateChanged(auth, (user) => {
  if (user) {
    uid = user.uid;
    saveUser();
    authDisplay.innerHTML = `
    <p id="userDd">Hi ${user.displayName.split(" ")[0]}</p>
    <div class="sign-out">
      <button id="signOut">Sign out</button>
    </div>
    `;
    userDd.style.cursor = "pointer";
    userDd.addEventListener("click", () => {
      if (!isShown) {
        document.querySelector(".sign-out").style.display = "flex";
        isShown = true;
      } else {
        document.querySelector(".sign-out").style.display = "none";
        isShown = false;
      }
    });
    const signOutBtn = document.getElementById("signOut");
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
  }
});

function renderCategories() {
  const categoryRef = collection(database, "categories");
  getDocs(categoryRef).then((snapshot) => {
    snapshot.forEach((doc) => {
      const div = document.createElement("div");
      div.classList.add("category-link");
      const link = document.createElement("a");
      link.href = `search.html?category=${doc.data().name}`;
      link.textContent = doc.data().name;
      div.appendChild(link);
      categoryLinks.appendChild(div);
    });
  });
}

renderCategories();

async function saveUser() {
  const userRef = doc(database, "users/" + uid);

  try {
    const docSnapshot = await getDoc(userRef);

    if (!docSnapshot.exists()) {
      let users = {
        userName: auth.currentUser.displayName,
        userMail: auth.currentUser.email,
        userId: uid,
        dateJoined: generateDate(),
      };
      await setDoc(userRef, users);
      console.log("Document written with ID: ", uid);
    }
  } catch (e) {
    console.error("Error checking or adding document: ", e);
  }
}

function generateDate() {
  let theDate = new Date();
  return new Intl.DateTimeFormat("en-NG").format(theDate);
}

if (loginBtn) {
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("clicked");

    window.location.href = `login.html?redirect=${encodeURIComponent(
      window.location.pathname
    )}`;
  });
}

if (document.getElementById("sddmenu")) {
  document.getElementById("sddmenu").addEventListener("click", () => {
    isDropped
      ? (document.getElementById("shopliftdd").style.display = "none")
      : (document.getElementById("shopliftdd").style.display = "flex");
    isDropped = !isDropped;
  });
}

async function renderLaptops() {
  try {
    const q = query(
      collection(database, "products"),
      where("category", "==", "Laptops")
    );
    const querySnapshot = await getDocs(q);
    const productTray = document.createElement("div");
    productTray.className = "product-tray";
    const productCategoryWrapper = document.createElement("div");
    const productCategory = document.createElement("h1");
    productCategory.textContent = "Laptops";
    productCategoryWrapper.appendChild(productCategory);
    productTray.appendChild(productCategoryWrapper);
    const productWrapper = document.createElement("div");
    productWrapper.className = "product-wrapper";
    querySnapshot.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.style.cursor = "pointer";
      productCard.className = "product-card";
      productCard.addEventListener("click", () => {
        location.href = `product.html?productId=${product.id}`;
      });
      productCard.classList.add("product-card");
      const productImg = document.createElement("img");
      productImg.className = "product-img";
      const imgRef = ref(storage, `${product.data().productImg}`);
      getDownloadURL(imgRef)
        .then((ref) => {
          productImg.src = ref;
          productImg.loading = "lazy";
        })
        .catch((error) => {
          console.log(error);
        });
      productImg.alt = product.data().productName;
      productCard.appendChild(productImg);
      const productName = document.createElement("span");
      productName.textContent = product.data().productName;
      productName.style.fontSize = "0.875rem";
      productCard.appendChild(productName);
      const productPrice = document.createElement("h4");
      productPrice.textContent = `NGN ₦${formatter.format(
        product.data().price
      )}`;
      productCard.appendChild(productPrice);
      productWrapper.appendChild(productCard);
    });
    productTray.appendChild(productWrapper);
    productsContainer.appendChild(productTray);
  } catch (error) {
    console.log(error);
  }
}

renderLaptops();

async function renderPhones() {
  try {
    const q = query(
      collection(database, "products"),
      where("category", "==", "Mobile Phones")
    );
    const querySnapshot = await getDocs(q);
    const productTray = document.createElement("div");
    productTray.className = "product-tray";
    const productCategoryWrapper = document.createElement("div");
    const productCategory = document.createElement("h1");
    productCategory.textContent = "Mobile Phones";
    productCategoryWrapper.appendChild(productCategory);
    productTray.appendChild(productCategoryWrapper);
    const productWrapper = document.createElement("div");
    productWrapper.className = "product-wrapper";
    querySnapshot.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.className = "product-card";
      productCard.dataset.id = product.id;
      productCard.addEventListener("click", () => {
        location.href = `product.html?productId=${product.id}`;
      });
      productCard.classList.add("product-card");
      const productImg = document.createElement("img");
      productImg.className = "product-img";
      const imgRef = ref(storage, `${product.data().productImages[0]}`);
      getDownloadURL(imgRef)
        .then((ref) => {
          productImg.src = ref;
          productImg.loading = "lazy";
        })
        .catch((error) => {
          console.log(error);
        });
      productImg.alt = product.data().productName;
      productCard.appendChild(productImg);
      const productName = document.createElement("span");
      productName.textContent = product.data().productName;
      productCard.appendChild(productName);
      const productPrice = document.createElement("h4");
      productPrice.textContent = `NGN ₦${formatter.format(
        product.data().price
      )}`;
      productCard.appendChild(productPrice);
      productWrapper.appendChild(productCard);
    });
    productTray.appendChild(productWrapper);
    productsContainer.appendChild(productTray);
  } catch (error) {
    console.log(error);
  }
}

renderPhones();

document.body.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const searchInput = document.getElementById("search");
    const searchValue = searchInput.value.trim();
    searchProductsByInput(searchValue);
  }
});

searchBtn.addEventListener("click", () => {
  const searchInput = document.getElementById("search");
  const searchValue = searchInput.value.trim();
  searchProductsByInput(searchValue);
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

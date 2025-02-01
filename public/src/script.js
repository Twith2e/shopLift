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

import { CONFIG } from "./config.js";
import { setupNetworkMonitoring } from "./utils/networkUtils.js";
import { showSuccess, showError, confirm } from "./utils/customAlerts.js";

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
const storage = getStorage();

const formatter = Intl.NumberFormat("en-NG");
const authDisplay = document.getElementById("authdisplay");
const loginBtn = document.getElementById("login");
const signupBtn = document.getElementById("signup");
const productsContainer = document.getElementById("products-container");
const searchBtns = document.querySelectorAll("#searchbtn");
const categoryLinks = document.getElementById("categorylinks");
const searchInput = document.getElementById("search");
const searchMatch = document.getElementById("searchmatch");

let uid;
let isDropped = false;
let isShown = false;

onAuthStateChanged(auth, (user) => {
  if (user) {
    uid = user.uid;
    cartIconCount(uid);
    saveUser();
    authDisplay.innerHTML = `
    <p id="userDd">Hi <span class="logged-user">${
      user.displayName.split(" ")[0]
    }</span></p><i class="fa-solid fa-chevron-down"></i>
    <div class="sign-out">
      <button id="profile">Profile</button>
      <button id="myprod" style="white-space: nowrap;">My Products</button>
      <button id="dashboard">Dashboard</button>
      <button id="signOut">Sign out</button>
    </div>
    `;

    document.querySelector(".authlinkwrapper").style.gap = "10px";
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
              showSuccess("Sign out successful").then(() => {
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
    const profileBtn = document.getElementById("profile");
    profileBtn.addEventListener("click", () => {
      location.href = "profile.html";
    });
    const dashboardBtn = document.getElementById("dashboard");
    dashboardBtn.addEventListener("click", () => {
      location.href = "dashboard.html";
    });
    const myProdBtn = document.getElementById("myprod");
    myProdBtn.addEventListener("click", () => {
      location.href = "listedProducts.html";
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
      link.style.color = "#fb8d28";
      div.appendChild(link);
      categoryLinks.appendChild(div);
    });
  });
}
if (categoryLinks) {
  renderCategories();
}

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
        businessName: "null",
      };
      await setDoc(userRef, users);
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
    sessionStorage.setItem("prevUrl", window.location.href);
    location.replace("login.html");
  });
}

if (signupBtn) {
  signupBtn.addEventListener("click", (e) => {
    e.preventDefault();
    sessionStorage.setItem("prevUrl", window.location.href);
    location.href = "signup.html";
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

for (let i = 0; i < 9; i++) {
  document.querySelectorAll(".product-wrapper").forEach((wrapper) => {
    wrapper.append(document.getElementById("cardTemplate").cloneNode(true));
  });
}

searchInput.addEventListener("input", () => {
  if (searchInput.value === "") {
    searchMatch.style.display = "none";
    return;
  }
  searchMatch.style.display = "block";
  showSearchMatch(searchInput.value);
});

async function showSearchMatch(searchTerm) {
  const lowercaseSearchTerm = searchTerm.toLowerCase();

  const productsRef = collection(database, "products");
  const querySnapshot = await getDocs(productsRef);

  // const searchMatch = document.getElementById("searchMatch"); // Assuming searchMatch is the element ID
  searchMatch.innerHTML = ""; // Clear previous results

  const searchResults = [];

  querySnapshot.forEach((doc) => {
    const product = doc.data();
    const productName = product.productName.toLowerCase();

    // Check if the productName contains the searchTerm
    if (productName.includes(lowercaseSearchTerm.trim())) {
      searchResults.push({
        name: productName,
        id: doc.id,
      });
    }
  });

  // Display the matched results
  if (searchResults.length > 0) {
    searchResults.forEach((result) => {
      const resultElement = document.createElement("div"); // Create a new element for each result
      resultElement.classList.add("result");
      const button = document.createElement("button");
      button.classList.add("result-button");
      button.textContent = result.name;
      button.setAttribute("data-id", result.id);
      button.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        location.href = `product.html?productId=` + id;
      });
      resultElement.appendChild(button);
      searchMatch.appendChild(resultElement);
    });
  } else {
    const errorDiv = document.createElement("div");
    errorDiv.classList.add("error-message-wrapper");
    const errorMessage = document.createElement("p");
    errorMessage.textContent = "No Match💔";
    errorDiv.appendChild(errorMessage);
    searchMatch.appendChild(errorDiv);
  }
}

async function renderLaptops() {
  try {
    const q = query(
      collection(database, "products"),
      where("category", "==", "Laptops")
    );
    const querySnapshot = await getDocs(q);
    const productTray = document.createElement("div");
    productTray.style.display = "none";
    productTray.className = "product-tray";
    const productCategoryWrapper = document.createElement("div");
    const productCategory = document.createElement("h1");
    productCategory.textContent = "Laptops";
    productCategory.style.fontSize = "1.5rem";
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
      const productImgCard = document.createElement("div");
      productImgCard.className = "product-img-card";
      const productImg = document.createElement("img");
      productImg.className = "product-img";
      productImgCard.appendChild(productImg);

      const imgRef = ref(storage, `${product.data().productImages[0]}`);
      getDownloadURL(imgRef)
        .then((ref) => {
          productImg.src = ref;
          productImg.loading = "lazy";
          if (lTemplate) {
            lTemplate.remove();
            productTray.style.display = "flex";
          }
        })
        .catch((error) => {
          console.log(error);
        });
      productImg.alt = product.data().productName;
      productCard.appendChild(productImgCard);
      const productName = document.createElement("span");
      productName.textContent = product.data().productName;
      productName.style.fontSize = "0.875rem";
      productName.style.paddingInline = "10px";
      productCard.appendChild(productName);
      const productPrice = document.createElement("h1");
      productPrice.style.fontSize = "1rem";
      productPrice.style.paddingInline = "10px";
      productPrice.style.paddingBottom = "10px";
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

async function cartIconCount(uid) {
  try {
    const q = query(collection(database, "users/" + uid + "/cart"));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs;
    let count = 0;

    for (let i = 0; i < items.length; i++) {
      count++;
    }
    if (count > 0) {
      document.querySelector(".cart-count").style.display = "flex";
      cartcount.textContent = count;
      return;
    }
  } catch (error) {
    console.log(error);
  }
}

if (productsContainer) {
  renderLaptops();
}

async function renderPhones() {
  try {
    const q = query(
      collection(database, "products"),
      where("category", "==", "Mobile Phones")
    );
    const querySnapshot = await getDocs(q);
    const productTray = document.createElement("div");
    productTray.style.display = "none";
    productTray.className = "product-tray";
    const productCategoryWrapper = document.createElement("div");
    const productCategory = document.createElement("h1");
    productCategory.textContent = "Mobile Phones";
    productCategory.style.fontSize = "1.5rem";
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
      const productImgCard = document.createElement("div");
      productImgCard.className = "product-img-card";
      const productImg = document.createElement("img");
      productImgCard.appendChild(productImg);
      productImg.className = "product-img";
      const imgRef = ref(storage, `${product.data().productImages[0]}`);
      getDownloadURL(imgRef)
        .then((ref) => {
          productImg.src = ref;
          productImg.loading = "lazy";
          if (mTemplate) {
            mTemplate.remove();
            productTray.style.display = "flex";
          }
        })
        .catch((error) => {
          console.log(error);
        });
      productImg.alt = product.data().productName;
      productCard.appendChild(productImgCard);
      const productName = document.createElement("span");
      productName.style.fontSize = "0.875rem";
      productName.style.paddingInline = "10px";
      productName.textContent = product.data().productName;
      productCard.appendChild(productName);
      const productPrice = document.createElement("h4");
      productPrice.style.fontSize = "1rem";
      productPrice.style.paddingInline = "10px";
      productPrice.style.paddingBottom = "10px";
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

if (productsContainer) {
  renderPhones();
}

document.body.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const searchInput = document.getElementById("search");
    const searchValue = searchInput.value.trim();
    searchProductsByInput(searchValue);
  }
});

searchBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const searchInput = document.getElementById("search");
    const searchValue = searchInput.value.trim();
    searchProductsByInput(searchValue);
  });
});

async function searchProductsByInput(searchTerm) {
  const lowercaseSearchTerm = searchTerm.toLowerCase();

  if (searchTerm === "") {
    showError("Please enter a search term.");
    return;
  }

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
  location.href = "search.html?searchTerm=" + matchingProducts;
  return matchingProducts;
}

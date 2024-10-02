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

let isShown = false;
let isCategory = false;
const searchTerm = localStorage.getItem("searchTerm");
const searchedItems = document.getElementById("searcheditems");
const searchParams = getProductIdFromUrl();
const menuBtn = document.getElementById("menubtn");
const sideMenu = document.getElementById("sidemenu");
const closeBtn = document.getElementById("closebtn");
const authWrapper = document.getElementById("auth");
const searchBtn = document.getElementById("searchbtn");

sideMenu.style.transition = "left 0.5s ease";

document.querySelector("title").textContent = `${searchTerm} | ShopLift`;

onAuthStateChanged(auth, (user) => {
  if (user) {
    authWrapper.innerHTML = `<button id="signoutbtn" class="sign-out-btn">Sign Out</button>`;
    authlinkwrapper.innerHTML = `<button id="userDd">Hi ${
      user.displayName.split(" ")[0]
    }</button>
    <div class="sign-out">
      <button id="signOut">Sign out</button>
    </div>
    `;
    document.getElementById("signOut").addEventListener("click", () => {
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
    const signOutBtn = document.getElementById("signoutbtn");
    signOutBtn.addEventListener("click", () => {
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

function getProductIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const searchTerm = urlParams.get("searchTerm");
  const category = urlParams.get("category");

  if (searchTerm) {
    return searchTerm.split(",");
  } else if (category) {
    isCategory = true;
    return category;
  } else {
    return "";
  }
}

function renderSearchedItems() {
  if (!isCategory && searchParams.length > 0) {
    searchParams.forEach((params) => {
      console.log(params);
      fetchItems(params);
    });
  } else {
    fetchCategory(searchParams);
  }
}

renderSearchedItems();

function fetchItems(productID) {
  const productRef = doc(database, "products", productID);
  getDoc(productRef)
    .then((docSnap) => {
      if (docSnap.exists()) {
        const mainDiv = document.createElement("div");
        mainDiv.className = "product-wrapper";
        mainDiv.addEventListener("click", () => {
          location.href = `product.html?productId=${productRef.id}`;
        });
        const imgDiv = document.createElement("div");
        imgDiv.style.height = "250px";
        imgDiv.style.borderRadius = "5px";
        const descDiv = document.createElement("div");
        descDiv.style.display = "flex";
        descDiv.style.flexDirection = "column";
        descDiv.style.gap = "20px";
        const header = document.createElement("p");
        header.style.fontSize = "1rem";
        const features = document.createElement("span");
        features.style.display = "flex";
        features.style.gap = "10px";
        const price = document.createElement("p");
        price.style.fontSize = "1.5rem";
        price.style.fontWeight = "700";
        price.classList.add("price");

        const img = document.createElement("img");
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.borderRadius = "10px";
        const imgRef = ref(storage, `${docSnap.data().productImages[0]}`);
        getDownloadURL(imgRef)
          .then((ref) => {
            img.src = ref;
            img.loading = "lazy";
          })
          .catch((error) => {
            console.log(error);
          });
        header.textContent = docSnap.data().productName;
        features.textContent = docSnap.data().condition;
        features.style.marginTop = "10px";
        price.textContent = `₦${formatter.format(docSnap.data().price)}`;
        price.style.marginTop = "20px";
        descDiv.appendChild(header);
        descDiv.appendChild(features);
        descDiv.appendChild(price);
        imgDiv.appendChild(img);
        mainDiv.appendChild(imgDiv);
        mainDiv.appendChild(descDiv);
        document.querySelector(".loader-overlay").style.display = "none";
        searchedItems.appendChild(mainDiv);
      } else {
        console.log("No such document!");
        const errorDiv = document.createElement("div");
        const p = document.createElement("p");
        p.textContent = "No products found";
        errorDiv.style.textAlign = "center";
        errorDiv.style.backgroundColor = "red";
        p.style.fontSize = "20px";
        p.style.margin = "20px auto";
        errorDiv.style.width = "100%";
        errorDiv.appendChild(p);
        searchedItems.innerHTML = "";
        searchedItems.appendChild(errorDiv);
      }
    })
    .catch((error) => {
      console.log("Error getting document:", error);
    });
}

function fetchCategory(category) {
  const q = query(
    collection(database, "products"),
    where("category", "==", category)
  );
  getDocs(q)
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        console.log("No matching documents.");
        const errorDiv = document.createElement("div");
        const p = document.createElement("p");
        p.textContent = "No products found";
        p.style.textAlign = "center";
        p.style.fontSize = "20px";
        p.style.margin = "20px";
        errorDiv.style.width = "100%";
        errorDiv.appendChild(p);
        searchedItems.innerHTML = "";
        searchedItems.style.width = "100%";
        searchedItems.appendChild(errorDiv);
        return;
      }
      searchedItems.innerHTML = "";
      querySnapshot.forEach((doc) => {
        const mainDiv = document.createElement("div");
        mainDiv.className = "product-wrapper";
        mainDiv.addEventListener("click", () => {
          location.href = `product.html?productId=${doc.id}`;
        });
        const imgDiv = document.createElement("div");
        imgDiv.style.height = "150px";
        imgDiv.style.borderRadius = "5px";
        const descDiv = document.createElement("div");
        const header = document.createElement("h2");
        const features = document.createElement("span");
        features.style.display = "flex";
        features.style.gap = "10px";
        const price = document.createElement("h1");

        const img = document.createElement("img");
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.borderRadius = "10px";
        const imgRef = ref(storage, `${doc.data().productImages[0]}`);
        getDownloadURL(imgRef)
          .then((ref) => {
            img.src = ref;
            img.loading = "lazy";
          })
          .catch((error) => {
            console.log(error);
          });
        header.textContent = doc.data().productName;
        features.textContent = doc.data().condition;
        features.style.marginTop = "10px";
        price.textContent = `₦${formatter.format(doc.data().price)}`;
        price.style.marginTop = "20px";
        descDiv.appendChild(header);
        descDiv.appendChild(features);
        descDiv.appendChild(price);
        imgDiv.appendChild(img);
        mainDiv.appendChild(imgDiv);
        mainDiv.appendChild(descDiv);
        searchedItems.appendChild(mainDiv);
      });
    })
    .catch((error) => {
      console.log(error);
    });
}

document.body.addEventListener("keypress", (e) => {
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

menuBtn.addEventListener("click", () => {
  sideMenu.style.left = "0";
});

closeBtn.addEventListener("click", () => {
  sideMenu.style.left = "-100%";
});

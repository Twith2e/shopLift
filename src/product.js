import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
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
import { CONFIG } from "../src/config.js";

const firebaseConfig = {
  apiKey: CONFIG.apiKey,
  authDomain: CONFIG.authDomain,
  projectId: CONFIG.projectId,
  storageBucket: CONFIG.storageBucket,
  messagingSenderId: CONFIG.messagingSenderId,
  appId: CONFIG.appId,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getFirestore();
const storage = getStorage();

let isInCart = false;
const formatter = Intl.NumberFormat("en-NG");
const productId = getProductIdFromUrl();
const productName = document.getElementById("productname");
const productPrice = document.getElementById("productprice");
const condition = document.getElementById("condition");
const cartBtn = document.getElementById("cartbtn");
const searchBtn = document.getElementById("searchbtn");
const searchInput = document.getElementById("search");

onAuthStateChanged(auth, (user) => {
  if (user) {
    cartBtn.addEventListener("click", (e) => {
      e.preventDefault();
      addToCart();
    });
    checkCart();
    cartIconCount(user.uid);
    authDisplay.innerHTML = `
    <p>welcome ${user.displayName.split(" ")[0]}</p>
    <button id="signOut">Sign out</button>
    `;
    const signOutBtn = document.getElementById("signOut");
    signOutBtn.addEventListener("click", () => {
      if (confirm("Do you want to sign out")) {
        signOut(auth)
          .then(() => {
            alert("Sign out successful");
            location.reload();
          })
          .catch((error) => {
            alert(error);
          });
      }
    });
  }
});

renderProduct();

async function renderProduct() {
  try {
    const productRef = doc(database, "products/" + productId);
    const productSnapshot = await getDoc(productRef);
    if (productSnapshot.exists()) {
      const product = productSnapshot.data();
      const images = product.productImages;

      const carouselInner = document.querySelector(".carousel-inner");
      const imagePromises = images.map((image, index) => {
        return new Promise((resolve) => {
          const imgRef = ref(storage, image);
          getDownloadURL(imgRef).then((url) => {
            const imgElement = document.createElement("img");
            imgElement.src = url;
            imgElement.classList.add("carousel-item");
            if (index === 0) imgElement.classList.add("active");
            carouselInner.appendChild(imgElement);
            resolve();
          });
        });
      });

      await Promise.all(imagePromises);
      initCarousel();

      productName.textContent = product.productName;
      productPrice.textContent = `NGN ₦${formatter.format(product.price)}`;
      condition.textContent = product.condition;
      brand.textContent = product.brand;
      description.textContent = product.description;
      quantity.textContent = `${product.quantity} available`;
    } else {
      alert("product does not exist");
    }
  } catch (error) {
    console.log(error);
  }
}
function initCarousel() {
  const carousel = document.getElementById("productCarousel");
  const items = carousel.querySelectorAll(".carousel-item");
  let currentIndex = 0; // Initialize currentIndex to 0

  function showItem(index) {
    items.forEach((item) => item.classList.remove("active"));
    items[index].classList.add("active");
  }

  const prevBtn = carousel.querySelector(".carousel-prev");
  const nextBtn = carousel.querySelector(".carousel-next");

  prevBtn.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    showItem(currentIndex);
  });

  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % items.length;
    showItem(currentIndex);
  });

  showItem(currentIndex);
}
async function checkCart() {
  try {
    const q = query(
      collection(database, "users/" + auth.currentUser.uid + "/cart"),
      where("productId", "==", productId)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      addcart.textContent = "View in Cart";
      isInCart = true;
    }
  } catch (error) {
    console.log(error);
  }
}

async function addToCart() {
  const user = auth.currentUser;
  if (!isInCart) {
    if (user) {
      console.log(user);

      const userId = user.uid;
      try {
        const productId = getProductIdFromUrl();
        const productRef = doc(database, "products/" + productId);
        const productSnapshot = await getDoc(productRef);
        const product = productSnapshot.data();
        console.log(`%c${productId}`, "color: red");

        const q = query(
          collection(database, "users/" + userId + "/cart"),
          where("productId", "==", productId)
        );
        const querySnapshot = await getDocs(q);
        console.log(querySnapshot);
        if (!querySnapshot.empty) {
          console.log("product already in cart");
          return;
        } else {
          isInCart = true;
          const cartRef = collection(database, "users/" + userId + "/cart");
          const cartItem = {
            productId: productId,
            productName: product.productName,
            productPrice: product.price,
            productImg: product.productImages[0],
            condition: product.condition,
          };
          addDoc(cartRef, cartItem)
            .then(() => {
              setInterval(() => {
                location.href = "cart.html";
              }, 1000);
              showSuccess("product added to cart");
            })
            .catch((error) => {
              console.log(error);
              alert("error");
            });
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log("please login to add to cart");
    }
  } else {
    location.href = `cart.html`;
  }
}

document.body.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
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

function getProductIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("productId");
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
    cartcount.textContent = count;
  } catch (error) {
    console.log(error);
  }
}

function showSuccess(message) {
  Swal.fire({
    background: "#28a745",
    color: "#fff",
    position: "top",
    showConfirmButton: false,
    text: `${message}`,
  });
}

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

const similarProducts = [];
let isInCart = false;
let isShown = false;
const formatter = Intl.NumberFormat("en-NG");
const productName = document.getElementById("productname");
const productPrice = document.getElementById("productprice");
const condition = document.getElementById("condition");
const cartBtn = document.getElementById("cartbtn");
const searchBtn = document.getElementById("searchbtn");
const searchInput = document.getElementById("search");
const seller = document.getElementById("seller");
const delivery = document.getElementById("delivery");
const productTemp = document.getElementById("productTemp");
const similarItemsContainer = document.getElementById("s-i-tray");

onAuthStateChanged(auth, (user) => {
  if (user) {
    cartBtn.addEventListener("click", (e) => {
      e.preventDefault();
      addToCart();
    });
    checkCart();
    cartIconCount(user.uid);
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

renderProduct();

for (let i = 0; i < 9; i++) {
  similarItemsContainer.append(
    document.getElementById("cardTemplate").cloneNode(true)
  );
}

async function renderProduct() {
  try {
    const productId = getProductIdFromUrl();
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
            imgElement.style.height = "550px";
            imgElement.style.width = "100%";
            imgElement.style.objectFit = "cover";
            imgElement.classList.add("carousel-item");
            if (index === 0) imgElement.classList.add("active");
            carouselInner.appendChild(imgElement);
            resolve();
            if (productTemp) {
              productTemp.remove();
            }
          });
        });
      });

      initCarousel();
      await Promise.all(imagePromises);

      const q = query(
        collection(database, "products"),
        where("category", "==", `${product.category}`)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const similarProduct = doc.data();
        if (similarProduct.productID !== product.productID) {
          similarProducts.push(similarProduct);
        }
      });

      similarProducts.forEach((similarProduct) => {
        const similarItem = document.createElement("div");
        similarItem.classList.add("product-card");
        const img = document.createElement("img");
        const imgRef = ref(storage, similarProduct.productImages[0]);
        getDownloadURL(imgRef).then((url) => {
          img.src = url;
          img.className = "product-img";
          const skeletonItem =
            similarItemsContainer.querySelectorAll("#cardTemplate");
          if (skeletonItem) {
            skeletonItem.forEach((temp) => {
              temp.remove();
            });
          }
        });
        similarItem.appendChild(img);
        const name = document.createElement("p");
        name.textContent = similarProduct.productName;
        similarItem.appendChild(name);
        const price = document.createElement("h4");
        price.textContent = `NGN ₦${formatter.format(similarProduct.price)}`;
        similarItem.appendChild(price);
        similarItem.addEventListener("click", () => {
          console.log("Product clicked:", similarProduct.productID);
          location.href = `product.html?productId=${similarProduct.productID.trim()}`;
        });

        similarItemsContainer.appendChild(similarItem);
      });

      const userRef = doc(database, "users", product.owner);
      const userSnapshot = await getDoc(userRef);
      const user = userSnapshot.data();
      seller.textContent = user.userName;
      productName.textContent = product.productName;
      productPrice.textContent = `NGN ₦${formatter.format(product.price)}`;
      condition.textContent = product.condition;
      brand.textContent = product.brand;
      quantity.textContent = `${product.quantity} available`;
      console.log(product.additionalFeatures);

      product.additionalFeatures.forEach((feature) => {
        const featureTitle = document.createElement("div");
        const featureDesc = document.createElement(
          feature.desc.length > 1 ? "select" : "div"
        );

        featureTitle.textContent = `${feature.title}:`;

        if (feature.desc.length > 1) {
          feature.desc.forEach((desc) => {
            const option = document.createElement("option");
            option.value = desc;
            option.classList.add("option");
            option.textContent = desc;
            featureDesc.appendChild(option);
          });
        } else {
          featureDesc.textContent = feature.desc[0];
        }
        aboutItemGrid.appendChild(featureTitle);
        aboutItemGrid.appendChild(featureDesc);
      });
      aboutItemGrid.innerHTML += `<div>Seller Note:</div>
            <div id="description" style="width: 80%; line-height: 25px">${product.description}</div>`;

      if (mdTemplate) {
        mdTemplate.remove();
        mainData.style.display = "flex";
      }
      if (pdTemplate) {
        pdTemplate.remove();
        addData.style.display = "grid";
      }

      if (aboutItemTemplate) {
        aboutItemTemplate.remove();
        aboutItem.style.display = "grid";
      }
    } else {
      showError("product does not exist").then(() => {
        window.location.href = "index.html";
      });
    }
  } catch (error) {
    console.log(error.message);
  }
}

function initCarousel() {
  const carousel = document.getElementById("productCarousel");
  const items = carousel.querySelectorAll(".carousel-item");
  let currentIndex = 0;

  function showItem(index) {
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
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
    const productId = getProductIdFromUrl();
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
      const userId = user.uid;
      try {
        const productId = getProductIdFromUrl();
        const productRef = doc(database, "products/" + productId);
        const productSnapshot = await getDoc(productRef);
        const product = productSnapshot.data();
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
            quantity: product.quantity,
          };
          addDoc(cartRef, cartItem)
            .then(() => {
              showSuccess("product added to cart").then(() => {
                location.replace("cart.html");
              });
            })
            .catch((error) => {
              showError(error.message).then(() => {
                location.replace("index.html");
              });
            });
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      showError("please login to add to cart").then(() => {
        location.replace("index.html");
      });
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
    if (count > 0) {
      document.querySelector(".cart-count").style.display = "flex";
      cartcount.textContent = count;
      return;
    }
  } catch (error) {
    console.log(error);
  }
}

function getEstimatedDeliveryDates() {
  const today = new Date();
  const threeDaysLater = new Date(today.setDate(today.getDate() + 3));
  const fourDaysLater = new Date(today.setDate(today.getDate() + 1));

  const options = { weekday: "short", month: "short", day: "numeric" };

  return {
    threeDays: threeDaysLater.toLocaleDateString("en-NG", options),
    fourDays: fourDaysLater.toLocaleDateString("en-NG", options),
  };
}

delivery.textContent =
  "Estimated between" +
  " " +
  getEstimatedDeliveryDates().threeDays +
  " - " +
  getEstimatedDeliveryDates().fourDays;

async function showError(message) {
  return new Promise((resolve) => {
    Swal.fire({
      background: "#dc3",
      color: "#fff",
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

async function showSuccess(message) {
  return new Promise((resolve) => {
    Swal.fire({
      background: "#28a745",
      color: "#fff",
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

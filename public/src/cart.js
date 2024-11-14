import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getStorage,
  getDownloadURL,
  ref,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

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
const storage = getStorage();

let isShown = false;
let itemCount = 0;
let priceArray = [];
let productArray = [];
let productObject;
let total = 0;
const formatter = Intl.NumberFormat("en-NG");
const aIC = document.getElementById("aic");
const checkoutBtns = document.querySelectorAll("#checkout");
const authDisplay = document.getElementById("authdisplay");
const menuBtn = document.getElementById("menu");
const closeBtn = document.getElementById("closebtn");
const sideMenu = document.getElementById("sidemenu");
const authWrapper = document.getElementById("auth");
const searchBtn = document.getElementById("searchbtn");
const searchIcon = document.getElementById("searchicon");
const loginBtns = document.querySelectorAll("#login");
const signupBtns = document.querySelectorAll("#signup");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.href = "signup.html";
  } else {
    authWrapper.innerHTML = `<button id="signoutbtn" class="sign-out-btn">Sign Out</button>`;
    authDisplay.innerHTML = `
    <p id="userDd">Hi <span class="logged-user">${
      user.displayName.split(" ")[0]
    }</span></p><i class="fa-solid fa-chevron-down"></i>
    <div class="sign-out">
      <button id="profile">Profile</button>
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
                text: error.code,
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
    updateItemCount(auth.currentUser.uid);
    renderItems(auth.currentUser.uid);
    sessionStorage.setItem("mail", auth.currentUser.email);
  }
});

loginBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    sessionStorage.setItem("prevUrl", window.location.href);
    location.replace("login.html");
  });
});

signupBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    sessionStorage.setItem("prevUrl", window.location.href);
    location.replace("signup.html");
  });
});

searchIcon.addEventListener("click", () => {
  document.querySelector(".sm-search-nav").style.display = "block";
});

document.getElementById("close").addEventListener("click", () => {
  document.querySelector(".sm-search-nav").style.display = "none";
});

async function updateItemCount(uid) {
  try {
    const q = query(collection(database, "users/" + uid + "/cart"));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs;

    if (items) {
      for (let index = 0; index < items.length; index++) {
        itemCount++;
      }
      cartitemcount.textContent = ` (${itemCount} items)`;
      item.textContent = ` (${itemCount})`;
    } else {
      cartitemcount.textContent = " (0)";
    }
  } catch (error) {
    console.log(error);
  }
}

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
  location.href = "search.html?searchTerm=" + matchingProducts;
  return matchingProducts;
}

async function renderItems(uid) {
  try {
    const q = query(collection(database, "users/" + uid + "/cart"));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs;

    if (items.length > 0) {
      let totalDesiredQty = 1;
      items.forEach((doc) => {
        const mainWrapper = document.createElement("div");
        mainWrapper.className = "main-wrapper";
        const itemWrapper = document.createElement("div");
        itemWrapper.className = "about-item";
        const itemImg = document.createElement("img");
        const imgRef = ref(storage, doc.data().productImg);
        getDownloadURL(imgRef).then((url) => {
          itemImg.src = url;
        });
        const user = auth.currentUser;
        productObject = {
          productID: doc.data().productId,
          qtyBought: 1,
          owner: user.displayName,
          seller: doc.data().seller,
        };
        productArray.push(productObject);

        itemWrapper.appendChild(itemImg);
        const div = document.createElement("div");
        div.className = "item-details";
        const itemName = document.createElement("span");
        itemName.textContent = doc.data().productName;
        const condition = document.createElement("span");
        condition.textContent = doc.data().condition;
        const qty = document.createElement("div");
        qty.classList.add("qty");
        const qtyElement = `<button id="minus" class="qty-btn"><svg xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 -960 960 960" width="15" fill="#fb8d28"><path d="M200-440v-80h560v80H200Z"/></svg></button>
                            <span id="dqty">1</span>
                            <button id="plus" class="qty-btn" disabled="true">
                              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15" height="12" viewBox="0 0 24 24" fill="#fb8d28">
                                <path fill-rule="evenodd" d="M 11 2 L 11 11 L 2 11 L 2 13 L 11 13 L 11 22 L 13 22 L 13 13 L 22 13 L 22 11 L 13 11 L 13 2 Z"></path>
                              </svg>
                            </button>
                            `;
        qty.innerHTML = qtyElement;
        const desiredQty = qty.querySelector("#dqty");
        const plus = qty.querySelector("#plus");
        const minus = qty.querySelector("#minus");

        plus.style.cursor = "pointer";
        minus.style.cursor = "pointer";

        plus.disabled = false; // Enable the plus button initially

        plus.addEventListener("click", () => {
          let currentQty = parseInt(desiredQty.textContent);
          let totalQty = doc.data().quantity;
          if (currentQty < totalQty) {
            currentQty++;
            desiredQty.textContent = currentQty;
            totalDesiredQty = currentQty;
            minus.disabled = false;
            updatePrice();
            updateTotalCartPrice();
          }
          if (currentQty >= totalQty) {
            plus.disabled = true;
          }
        });

        minus.addEventListener("click", () => {
          let currentQty = parseInt(desiredQty.textContent);
          if (currentQty > 1) {
            currentQty--;
            desiredQty.textContent = currentQty;
            totalDesiredQty = currentQty;
            plus.disabled = false;
            updatePrice();
            updateTotalCartPrice();
          }
          if (currentQty <= 1) {
            minus.disabled = true;
          }
        });

        function updatePrice() {
          const PRICE_AS_INT = Number(doc.data().productPrice);
          const totalPrice = PRICE_AS_INT * totalDesiredQty;
          price.textContent = `NGN ₦${formatter.format(totalPrice)}`;
        }

        function updateTotalCartPrice() {
          const priceElements = document.querySelectorAll(
            ".about-item span:last-child"
          );
          total = Array.from(priceElements).reduce((acc, priceElement) => {
            const priceText = priceElement.textContent.replace(/[^0-9]/g, "");
            return acc + parseInt(priceText, 10);
          }, 0);
          sessionStorage.setItem("price", total);
          document.getElementById("price").innerHTML = `NGN ₦${formatter.format(
            total
          )}`;
        }
        const price = document.createElement("span");
        updatePrice();
        div.appendChild(itemName);
        div.appendChild(condition);
        div.appendChild(qty);
        div.appendChild(price);
        itemWrapper.appendChild(div);
        const removeWrapper = document.createElement("div");
        removeWrapper.className = "remove";
        const remove = document.createElement("span");
        remove.textContent = "Remove";
        remove.setAttribute("data-doc-id", doc.data().productId);

        remove.addEventListener("click", async (event) => {
          const productId = event.target.getAttribute("data-doc-id");
          const uid = auth.currentUser.uid;

          try {
            const q = query(
              collection(database, "users/" + uid + "/cart"),
              where("productId", "==", productId)
            );
            const querySnapshot = await getDocs(q);

            await Promise.all(
              querySnapshot.docs.map((doc) => deleteDoc(doc.ref))
            );

            Swal.fire({
              icon: "success",
              title: "Item Removed",
              text: "The item has been successfully removed from your cart.",
              background: "#28a745",
              color: "#fff",
              position: "top",
              showConfirmButton: false,
              timer: 2000,
            });

            event.target.closest(".main-wrapper").remove();

            itemCount--;
            cartitemcount.textContent = ` (${itemCount} items)`;
            item.textContent = ` (${itemCount})`;

            const removedPrice = parseFloat(doc.data().productPrice);
            total -= removedPrice;

            cartitemtotalprice.textContent = `NGN ₦${formatter.format(total)}`;
            price.textContent = `NGN ₦${formatter.format(total)}`;
            location.reload();
            sessionStorage.setItem("price", total.toString());
          } catch (error) {
            console.error("Error removing document: ", error);
          }
        });
        removeWrapper.appendChild(remove);
        mainWrapper.appendChild(itemWrapper);
        mainWrapper.appendChild(removeWrapper);
        aIC.appendChild(mainWrapper);
        updateTotalCartPrice();
      });

      checkoutBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          location.href = "checkout.html";
          sessionStorage.setItem("productInfo", JSON.stringify(productArray));
        });
      });
    } else {
      const tag = document.createElement("h1");
      tag.textContent = "Your cart is empty";
      tag.style.display = "flex";
      tag.style.justifyContent = "center";
      tag.style.alignItems = "center";
      tag.style.height = "500px";
      aIC.appendChild(tag);
    }
  } catch (error) {
    console.log(error);
  }
}

sideMenu.style.transition = "left 0.5s ease";

menuBtn.addEventListener("click", () => {
  sideMenu.style.left = "0";
});

closeBtn.addEventListener("click", () => {
  sideMenu.style.left = "-100%";
});

function confirm(message = "Confirmation", icon = "question") {
  return new Promise((resolve) => {
    Swal.fire({
      text: message,
      icon: icon,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#4CAF50",
      cancelButtonColor: "#f44336",
      reverseButtons: true,
      width: "300px",
      toast: true,
      position: "top",
      background: "#2b2b2b",
      color: "#ffffff",
      customClass: {
        popup: "animated fadeInDown",
      },
    }).then((result) => {
      resolve(result.isConfirmed);
    });
  });
}

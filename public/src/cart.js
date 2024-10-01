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

let isShown = false;
let itemCount = 0;
let priceArray = [];
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

onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.href = "signup.html";
  } else {
    checkoutBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (user) {
          location.replace("checkout.html");
        } else {
          location.replace("login.html");
        }
      });
    });
    authWrapper.innerHTML = `<button id="signoutbtn" class="sign-out-btn">Sign Out</button>`;
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
    updateItemCount(auth.currentUser.uid);
    renderItems(auth.currentUser.uid);
    sessionStorage.setItem("mail", auth.currentUser.email);
  }
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
    console.log(querySnapshot);

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
  console.log(searchTerm);

  console.log(matchingProducts);
  location.href = "search.html?searchTerm=" + matchingProducts;
  return matchingProducts;
}

async function renderItems(uid) {
  try {
    const q = query(collection(database, "users/" + uid + "/cart"));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs;

    console.log(items);
    console.log(querySnapshot);

    if (items) {
      let totalDesiredQty = 1;
      items.forEach((doc) => {
        console.log(doc.data());
        const mainWrapper = document.createElement("div");
        mainWrapper.className = "main-wrapper";
        const itemWrapper = document.createElement("div");
        itemWrapper.className = "about-item";
        const itemImg = document.createElement("img");
        const imgRef = ref(storage, doc.data().productImg);
        getDownloadURL(imgRef).then((url) => {
          itemImg.src = url;
        });
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
          console.log(total);
          console.log(cartitemtotalprice);
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
          console.log(productId);

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
    }
  } catch (error) {
    console.log(error);
  }
}

async function getPrice(uid) {
  try {
    const q = query(collection(database, "users/" + uid + "/cart"));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs;

    if (items.length > 0) {
      const total = items.reduce((acc, doc) => {
        const price = parseFloat(doc.data().productPrice);
        return acc + (isNaN(price) ? 0 : price);
      }, 0);
      console.log("Calculated total:", total);
      return total;
    } else {
      console.log("No items found in cart");
      return 0;
    }
  } catch (error) {
    console.error("Error getting price:", error);
    return 0;
  }
}

sideMenu.style.transition = "left 0.5s ease";

menuBtn.addEventListener("click", () => {
  sideMenu.style.left = "0";
});

closeBtn.addEventListener("click", () => {
  sideMenu.style.left = "-100%";
});

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
  setDoc,
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

let itemCount = 0;
let priceArray = [];
let total = 0;
const formatter = Intl.NumberFormat("en-NG");
const aIC = document.getElementById("aic");
const checkoutBtns = document.querySelectorAll("#checkout");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.href = "signup.html";
  } else {
    console.log(auth.currentUser.uid);

    updateItemCount(auth.currentUser.uid);
    renderItems(auth.currentUser.uid);
    getPrice(auth.currentUser.uid).then((price) => {
      sessionStorage.setItem("price", price);
    });
    sessionStorage.setItem("mail", auth.currentUser.email);
  }
});

async function updateItemCount(uid) {
  try {
    const q = query(collection(database, "users/" + uid + "/cart"));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs;

    console.log(items);
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

async function renderItems(uid) {
  try {
    const q = query(collection(database, "users/" + uid + "/cart"));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs;

    console.log(items);
    console.log(querySnapshot);

    if (items) {
      items.forEach((doc) => {
        console.log(doc.data());
        priceArray.push(doc.data().productPrice);
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
        const qty = document.createElement("span");
        const price = document.createElement("span");
        price.textContent = `NGN ₦${formatter.format(doc.data().productPrice)}`;
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

            sessionStorage.setItem("price", total.toString());
          } catch (error) {
            console.error("Error removing document: ", error);
          }
        });
        removeWrapper.appendChild(remove);
        mainWrapper.appendChild(itemWrapper);
        mainWrapper.appendChild(removeWrapper);
        aIC.appendChild(mainWrapper);
      });
      priceArray.forEach((price) => {
        total = +price + total;
      });
      cartitemtotalprice.textContent = `NGN ₦${formatter.format(total)}`;
      price.textContent = `NGN ₦${formatter.format(total)}`;
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

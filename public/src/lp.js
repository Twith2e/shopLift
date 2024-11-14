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
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getStorage,
  getDownloadURL,
  ref,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";
import { CONFIG } from "./config.js";
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
const auth = getAuth();
const database = getFirestore();
const storage = getStorage();

setupNetworkMonitoring(app);

const loadingTemps = document.querySelectorAll("#loadingTemp");
const mainContainer = document.getElementById("main");
const profileBtns = document.querySelectorAll("#profilebtn");
const searchIcon = document.getElementById("searchicon");
const profileDropdowns = document.querySelectorAll("#profiledropdown");
const signOutBtns = document.querySelectorAll("#signoutbtn");
const userNames = document.querySelectorAll("#username");
const searchBar = document.getElementById("seachbar");
const searchBtns = document.querySelectorAll("#searchbtn");
const searchInputs = document.querySelectorAll("#searchinput");

let dropdownShown = false;
let seeSearchBar = false;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.replace("login.html");
  } else {
    userNames.forEach((name) => {
      name.textContent = user.displayName.split(" ")[0];
    });
    loadProfilePic(user);
    loadProducts(user.uid);
    signOutBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
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
    });
  }
});

console.log(searchInputs);
console.log(searchBtns);

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
    const searchValue = searchinput.value.trim() || sminput.value.trim();
    searchProductsByInput(searchValue);
    searchinput.value = "";
    sminput.value = "";
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
      profileDropdowns.forEach((profile) => {
        profile.style.display = "none";
      });
      dropdownShown = false;
    }
    searchBar.style.display = "block";
    seeSearchBar = true;
  } else {
    searchBar.style.display = "none";
    seeSearchBar = false;
  }
});

async function loadProfilePic(user) {
  try {
    const userRef = doc(database, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const imgRef = ref(storage, userData.userPic);
      const imgUrl = await getDownloadURL(imgRef);
      pfp.src = imgUrl;
      pfp1.src = imgUrl;
      if (pfpTemplate && pfpTemplate1) {
        pfpTemplate.style.display = "none";
        pfpTemplate1.style.display = "none";
        profileBtns.forEach((btn) => {
          btn.style.display = "block";
        });
      }
    }
  } catch (error) {
    console.log(error.message);
    showError(error.message);
  }
}

async function loadProducts(uid) {
  try {
    const q = query(
      collection(database, "products"),
      where("owner", "==", `${uid}`)
    );
    const snap = await getDocs(q);
    for (const [index, s] of snap.docs.entries()) {
      try {
        const imgRef = ref(storage, s.data().productImages[0]);
        try {
          const imgUrl = await getDownloadURL(imgRef);
          loadingTemps.forEach((temp) => {
            temp.style.display = "none";
          });
          mainContainer.style.display = "block";
          document.querySelector(
            ".main"
          ).innerHTML += `<div class="product-container" id="productsContainer">
          <div class="product-image-container">
            <h2>Product Image</h2>
            <img height="200" width="300" src="${imgUrl}" alt="" />
          </div>
          <div class="product-info-container">
            <div class="item-input-container">
              <div class="item-input">
                <label for="productName">Product Name</label>
                <input
                  id="productName${index}"
                  placeholder="Product Name"
                  type="text"
                  value='${s.data().productName}'
                />
              </div>
              <div class="item-input">
                <label for="productBrand">Product Brand</label>
                <input
                  id="productBrand${index}"
                  placeholder="Product Brand"
                  type="text"
                  value='${s.data().brand}'
                />
              </div>
            </div>
            <div class="item-input-container">
              <div class="item-input">
                <label for="productPrice">Product Price</label>
                <input
                  id="productPrice${index}"
                  placeholder="Product Price"
                  type="text"
                  value='${s.data().price}'
                />
              </div>
              <div class="item-input">
                <label for="productQuantity">Product Quantity</label>
                <input
                  id="productQuantity${index}"
                  min="0"
                  placeholder="Product Quantity"
                  type="number"
                  value='${s.data().quantity}'
                />
              </div>
            </div>
            <div>
              <label for="productDesc">
                <textarea
                  cols="70"
                  id="productDesc${index}"
                  rows="15"
                  type="text"
                >${s.data().description}</textarea>
              </label>
            </div>
          </div>
        </div>
        <div class='savebtn'>
          <button id="saveBtn${index}" data-index="${index}" data-id = "${
            s.id
          }" class="list-save-btn">Save</button>
        </div>
        `;
        } catch (error) {
          console.log(error);
          showError(error.message);
        }
      } catch (error) {
        console.log(error);
        showError(error.message);
      }
    }
    document.querySelector("main").addEventListener("click", async (e) => {
      // Check if the clicked element is a button with the class 'list-save-btn'
      if (e.target && e.target.classList.contains("list-save-btn")) {
        const clickedIndex = e.target.getAttribute("data-index");
        const docId = e.target.getAttribute("data-id");
        const productName = document.getElementById(
          `productName${clickedIndex}`
        ).value;
        const productBrand = document.getElementById(
          `productBrand${clickedIndex}`
        ).value;
        const productPrice = document.getElementById(
          `productPrice${clickedIndex}`
        ).value;
        const productQuantity = document.getElementById(
          `productQuantity${clickedIndex}`
        ).value;
        const productDesc = document.getElementById(
          `productDesc${clickedIndex}`
        ).value;
        try {
          const productRef = doc(database, "products", docId); // Use correct document ID
          const productUpdate = {
            productName: productName,
            brand: productBrand,
            price: productPrice,
            quantity: productQuantity,
            description: productDesc,
          };
          await updateDoc(productRef, productUpdate)
            .then(() => {
              console.log("Product updated successfully");
              showSuccess("Product Info Updated");
            })
            .catch((error) => {
              console.log(error);
              showError(error.message);
            });
        } catch (error) {
          console.log(error);
          showError(error.message);
        }
      }
    });
  } catch (error) {
    console.log(error);
    showError(error.message);
  }
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

async function showSuccess(message) {
  return new Promise((resolve) => {
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: message,
      background: "#28a745",
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
    }).then(() => resolve());
  });
}

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

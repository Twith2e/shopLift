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
    console.log(user.displayName);

    renderInfo(user.displayName);
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

async function renderInfo(name) {
  let customers = new Set();
  let price = [];
  let qtyBought = [];
  let productIDs = [];
  try {
    const q = query(
      collection(database, "orders"),
      where("seller", "==", `${name}`)
    );
    const snap = await getDocs(q);

    snap.forEach((s) => {
      customers.add(s.data().owner);
      price.push(s.data().price);
      qtyBought.push(s.data().qtyBought);
      productIDs.push(s.data().productID);
    });
    const customersArray = Array.from(customers);
    salescount.textContent = price.length;
    console.log(price);
    const totalPrice = price.reduce((a, b) => +a + +b, 0);
    console.log(totalPrice);
    const totalQty = qtyBought.reduce((a, b) => a + b, 0);
    console.log(totalQty);
    const revenue = Number(totalPrice) * Number(totalQty);
    revCount.textContent = `₦${formatter.format(revenue)}`;
    custCount.textContent = customersArray.length;

    const tableBody = document.querySelector("#table tbody");

    productIDs.forEach(async (id, index) => {
      const productRef = doc(database, "products/", id);
      const productSnap = await getDoc(productRef);
      const productData = productSnap.data();

      const row = document.createElement("tr");
      const imgCell = document.createElement("td");
      const img = document.createElement("img");
      const imgRef = ref(storage, productData.productImages[0]);
      const imgUrl = await getDownloadURL(imgRef);
      img.src = imgUrl;
      img.style.width = "50px";
      img.style.height = "50px";
      img.style.borderRadius = "5px";
      imgCell.appendChild(img);
      row.appendChild(imgCell);

      const nameCell = document.createElement("td");
      nameCell.textContent = productData.productName;
      nameCell.style.color = "#fb8d28";
      row.appendChild(nameCell);

      const priceCell = document.createElement("td");
      priceCell.textContent = `₦${formatter.format(productData.price)}`;
      row.appendChild(priceCell);

      const qtyCell = document.createElement("td");
      qtyCell.textContent = qtyBought[index];
      row.appendChild(qtyCell);

      const totalPriceCell = document.createElement("td");
      totalPriceCell.textContent = `₦${formatter.format(
        +price[index] * qtyBought[index]
      )}`;
      row.appendChild(totalPriceCell);

      tableBody.appendChild(row);
    });
    cardwrapperTemp.style.display = "none";
    dashheaderTemp.style.display = "none";
    cardwrapper.style.display = "flex";
    dashheader.style.display = "flex";
  } catch (error) {
    console.log(error);

    showError(error.message);
  }
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

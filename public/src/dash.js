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
const myProducts = document.getElementById("myproducts");

let dropdownShown = false;
let seeSearchBar = false;

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadProfilePic(user);
    renderInfo(user);
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

async function renderInfo(user) {
  const userId = user.uid;
  const userRef = doc(database, "users", userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();
  const businessName = userData.businessName;
  let customers = new Set();
  let price = [];
  let qtyBought = [];
  let productIDs = [];
  try {
    const q = query(
      collection(database, "orders"),
      where("seller", "==", userId)
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

    const calcRevenue = price.map((price, index) => {
      return Number(price) * Number(qtyBought[index]);
    });

    const revenue = calcRevenue.reduce((a, b) => +a + +b, 0);

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
    if (cardwrapperTemp && dashheaderTemp) {
      cardwrapperTemp.style.display = "none";
      dashheaderTemp.style.display = "none";
      cardwrapper.style.display = "flex";
      dashheader.style.display = "flex";
    }
  } catch (error) {
    console.log(error);

    showError(error.message);
  }
}

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

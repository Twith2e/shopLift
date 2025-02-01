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
import { setupNetworkMonitoring } from "./utils/networkUtils.js";
import { showSuccess, showError, confirm } from "./utils/customAlerts.js";

const firebaseConfig = {
  apiKey: CONFIG.apiKey,
  authDomain: CONFIG.authDomain,
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

const similarProducts = [];
let isInCart = false;
let isShown = false;
let userEmail;
const formatter = Intl.NumberFormat("en-NG");
const productName = document.getElementById("productname");
const productPrice = document.getElementById("productprice");
const condition = document.getElementById("condition");
const cartBtn = document.getElementById("cartbtn");
const buyBtn = document.getElementById("buybtn");
const searchBtn = document.getElementById("searchbtn");
const searchInput = document.getElementById("search");
const seller = document.getElementById("seller");
const delivery = document.getElementById("delivery");
const productTemp = document.getElementById("productTemp");
const similarItemsContainer = document.getElementById("s-i-tray");
const searchMatch = document.getElementById("searchmatch");
let userInfo;

onAuthStateChanged(auth, (user) => {
  if (user) {
    userInfo = user;
    userEmail = user.email;

    checkCart();
    cartIconCount(user.uid);
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

cartBtn.addEventListener("click", (e) => {
  e.preventDefault();
  cartBtn.style.position = "relative";
  cartBtn.style.height = "3rem";
  cartBtn.innerHTML = `<div class="loader-overlay">
          <div class="loader"></div>
        </div>`;

  addToCart(e);
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
            imgElement.style.objectFit = "contain";
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

      if (product.quantity < 1) {
        const option = document.createElement("option");
        option.value = 0;
        option.textContent = "Out of Stock";
        qty.appendChild(option);
      } else {
        for (let i = 0; i < product.quantity; i++) {
          const option = document.createElement("option");
          option.value = i + 1;
          option.textContent = i + 1;
          qty.appendChild(option);
        }
      }

      await Promise.all(imagePromises);
      initCarousel();
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

      if (similarProducts.length > 0) {
        similarProducts.forEach((similarProduct) => {
          const similarItem = document.createElement("div");
          similarItem.classList.add("product-card");
          const img = document.createElement("img");
          img.style.borderBlockEnd = "3px solid #fd8d28";
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
          name.style.paddingInline = "10px";
          name.textContent = similarProduct.productName;
          similarItem.appendChild(name);
          const price = document.createElement("h4");
          price.textContent = `NGN ₦${formatter.format(similarProduct.price)}`;
          similarItem.appendChild(price);
          price.style.paddingInline = "10px";
          price.style.paddingBottom = "10px";
          similarItem.addEventListener("click", () => {
            location.href = `product.html?productId=${similarProduct.productID.trim()}`;
          });

          similarItemsContainer.appendChild(similarItem);
        });
      } else {
        similarItemsContainer.innerHTML =
          "<h1 style='width:50%; margin:auto'>No Similar Products Found</h1>";
        similarItemsContainer.style.width = "100%";
      }

      let businessName;
      const userRef = doc(database, "users", product.owner);
      const userSnapshot = await getDoc(userRef);
      const user = userSnapshot.data();
      if (user.businessName !== null) {
        businessName = user.businessName;
      } else {
        businessName = user.userName;
      }
      seller.textContent = businessName;
      const imgRef = ref(storage, `${user.userPic}`);
      getDownloadURL(imgRef)
        .then((ref) => {
          sellerimg.src = ref;
          sellerimg.loading = "lazy";
        })
        .catch((error) => {
          sellerimg.src = "assets/default-pfp.jpg";
        });
      productName.textContent = product.productName;
      productPrice.textContent = `NGN ₦${formatter.format(product.price)}`;
      condition.textContent = product.condition;
      brand.textContent = product.brand;
      if (product.quantity == 0) {
        quantity.textContent = "Out of Stock";
        quantity.style.color = "red";
      } else {
        quantity.textContent = `${product.quantity} available`;
      }
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

      buyBtn.addEventListener("click", (e) => {
        e.preventDefault();
        try {
          if (product.quantity == 0) {
            showError("Product is out of Stock").then(() => {
              location.replace("index.html");
            });
            return;
          }
          sessionStorage.setItem(
            "price",
            Number(product.price) * Number(qty.value)
          );
          sessionStorage.setItem("mail", userEmail);
          const user = auth.currentUser;
          sessionStorage.setItem(
            "productInfo",
            JSON.stringify([
              {
                productID: product.productID,
                qtyBought: document.getElementById("qty").value,
                owner: user.displayName,
                seller: product.owner,
              },
            ])
          );
          location.href = "checkout.html";
        } catch (error) {
          showError("Please Login to continue").then(() => {
            sessionStorage.setItem("prevUrl", window.location.href);
            location.replace("login.html");
          });
        }
      });

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
    showError(error.message);
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
    showError(error.message);
    console.log(error);
  }
}

async function addToCart(event) {
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

        if (product.quantity < 1) {
          showError("Product is out of stock").then(() => {
            window.location.href = "index.html";
          });
        } else if (!querySnapshot.empty) {
          return;
        } else {
          const cartRef = collection(database, "users/" + userId + "/cart");

          const cartItem = {
            productId,
            productName: product.productName,
            productPrice: product.price,
            productImg: product.productImages[0],
            condition: product.condition,
            quantity: product.quantity,
            seller: product.owner,
            owner: user.displayName,
          };
          addDoc(cartRef, cartItem)
            .then(() => {
              isInCart = true;
              cartBtn.innerHTML = "View in Cart";
              showSuccess("product added to cart").then(() => {
                cartIconCount(userId);
              });
            })
            .catch((error) => {
              showError(error.message).then(() => {
                location.replace("index.html");
              });
            });
        }
      } catch (error) {
        showError(error.message);
      }
    } else {
      showError("please login to add to cart").then(() => {
        sessionStorage.setItem("prevUrl", window.location.href);
        event.target.innerHTML = "Add to Cart";
        location.replace("login.html");
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
    showError(error.message);
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

deliv.textContent = `Est. delivery ${getEstimatedDeliveryDates().threeDays} - ${
  getEstimatedDeliveryDates().fourDays
}`;

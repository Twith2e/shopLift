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
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getStorage,
  getDownloadURL,
  ref,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";
import { CONFIG } from "./config.js";
import { setupNetworkMonitoring } from "./utils/networkUtils.js";
import { showSuccess, showError, confirm } from "./utils/customAlerts.js";

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

const searchBar = document.getElementById("seachbar");
const searchIcon = document.getElementById("searchicon");
const searchBtn = document.getElementById("searchbtn");
const smSearchBtn = document.getElementById("smsearchbtn");
const searchInput = document.getElementById("searchinput");
const smSearchInput = document.getElementById("smsearchinput");
const profileBtns = document.querySelectorAll("#profilebtn");
const profileDropdowns = document.querySelectorAll("#profiledropdown");
const userNames = document.querySelectorAll("#username");
const signOutBtns = document.querySelectorAll("#signoutbtn");
const profileInfo = document.getElementById("profile-info");
const ddList = document.getElementById("dd-list");
const profileImg = document.getElementById("profileimg");
const imgPickr = document.getElementById("imgpickr");
const editBtns = document.querySelectorAll("#edit");
const doneBtn = document.getElementById("donebtn");
const cancelBtn = document.getElementById("cancelbtn");
const searchMatch = document.getElementById("searchmatch");
let dropdownShown = false;
let seeSearchBar = false;
let currentUser = getAuth();

console.log(currentUser);

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadUserProfile(user);
    doneBtn.addEventListener("click", () => {
      doneBtn.disabled = true;
      doneBtn.style.background = "#f3b17b";
      document
        .getElementById("businessname")
        .setAttribute("readonly", "readonly");
      document
        .getElementById("profilename")
        .setAttribute("readonly", "readonly");
      document
        .getElementById("profilemail")
        .setAttribute("readonly", "readonly");
      updateUserProfile(user);
    });
    userNames.forEach((name) => {
      name.textContent = user.displayName.split(" ")[0];
    });
    imgPickr.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const fileReader = new FileReader();
      if (file) {
        fileReader.readAsDataURL(file);
      }

      fileReader.addEventListener("load", (e) => {
        let extractedData = e.target.result;
        profileImg.src = extractedData;
        saveProfileImg(user, file);
      });
    });
    signOutBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
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

    location.href = "login.html";
  }
});

document.body.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (smSearchInput) {
      const searchValue = smSearchInput.value.trim();
      searchProductsByInput(searchValue);
    } else if (searchInput) {
      const searchValue = searchInput.value.trim();
      searchProductsByInput(searchValue);
    }
  }
});

if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    const searchValue = searchInput.value.trim();
    searchProductsByInput(searchValue);
    searchInput.value = "";
  });
}

if (smSearchBtn) {
  smSearchBtn.addEventListener("click", () => {
    const searchValue = smSearchInput.value.trim();
    searchProductsByInput(searchValue);
    smSearchInput.value = "";
  });
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
      dropdownShown = false;
    }
    searchBar.style.display = "block";
    smSearchInput && smSearchInput.focus();
    seeSearchBar = true;
  } else {
    searchBar.style.display = "none";
    seeSearchBar = false;
  }
});

editBtns.forEach((editbtn) => {
  editbtn.addEventListener("click", (e) => {
    editInfo(e);
  });
});

function editInfo(event) {
  const dataAtrribute = event.target.getAttribute("data-span-id");
  const currentInput = document.getElementById(dataAtrribute);
  if (currentInput) {
    currentInput.removeAttribute("readonly");
    currentInput.focus();
    currentInput.setSelectionRange(0, 20000);
    currentInput.addEventListener("input", () => {
      doneBtn.disabled = false;
      doneBtn.style.background = "#fb8d28";
      doneBtn.style.color = "#fff";
    });
  }
}

function cancelEdit() {
  editBtns.forEach((editbtn) => {
    const dataAtrribute = editbtn.getAttribute("data-span-id");
    const currentInput = document.getElementById(dataAtrribute);
    if (currentInput) {
      currentInput.setAttribute("readonly", true);
      doneBtn.disabled = true;
      doneBtn.style.background = "#f3b17b";
    }
  });
}

cancelBtn.addEventListener("click", () => {
  cancelEdit();
});

async function updateUserProfile(user) {
  try {
    const userProfileRef = doc(database, "users", user.uid);
    const updateProfile = {
      userName: profilename.value,
      businessName: businessname.value,
      userMail: profilemail.value,
    };
    await updateDoc(userProfileRef, updateProfile);
    showSuccess("Profile Updated");
  } catch (error) {
    console.log(error.message);
  }
}

async function loadUserProfile(user) {
  try {
    const userRef = doc(database, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const user = userSnap.data();
      document.getElementById("businessname").value = user.businessName;
      document.getElementById("profilename").value = user.userName;
      document.getElementById("profilemail").value = user.userMail;
      document.getElementById("datejoined").value = user.dateJoined;
      const imgRef = ref(storage, `${user.userPic}`);
      getDownloadURL(imgRef)
        .then((ref) => {
          profileImg.src = ref;
          profileImg.loading = "lazy";
          topprofile.src = ref;
          topprofile1.src = ref;
        })
        .catch((error) => {
          console.log(error);
        });
      if (profileTemplate && pfpTemplate && pfpTemplate1) {
        profileTemplate.remove();
        pfpTemplate.remove();
        pfpTemplate1.remove();
        mainProfile.style.display = "grid";
        profileBtns.forEach((btn) => {
          btn.style.display = "flex";
        });
      }
      return;
    }

    document.getElementById("businessname").value = "Not Provided";
  } catch (error) {
    if (
      error.code === "unavailable" ||
      error.code === "network-request-failed"
    ) {
      showError(
        "You appear to be offline. Please check your internet connection."
      );
    }
    console.log(error.code, error.message);
  }
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    if (searchInput.value === "") {
      searchMatch.style.display = "none";
      return;
    }
    searchMatch.style.display = "block";
    showSearchMatch(searchInput.value);
  });
}

async function showSearchMatch(searchTerm) {
  const lowercaseSearchTerm = searchTerm.toLowerCase();

  const productsRef = collection(database, "products");
  const querySnapshot = await getDocs(productsRef);

  const searchMatch = document.getElementById("searchmatch");
  searchMatch.innerHTML = "";

  const searchResults = [];

  querySnapshot.forEach((doc) => {
    const product = doc.data();
    const productName = product.productName.toLowerCase();
    if (productName.includes(lowercaseSearchTerm.trim())) {
      searchResults.push({
        name: productName,
        id: doc.id,
      });
    }
  });

  if (searchResults.length > 0) {
    searchResults.forEach((result) => {
      const resultElement = document.createElement("div");
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

async function saveProfileImg(user, file) {
  try {
    const userRef = doc(database, "users", user.uid);
    const updateProfile = {
      userPic: file.name,
    };
    await updateDoc(userRef, updateProfile).then(() => {
      showSuccess("Profile image updated!");
    });
    loadUserProfile(getAuth().currentUser);
    const imageRef = ref(storage, `${file.name}`);
    uploadBytes(imageRef, file)
      .then((snapshot) => {})
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {}
}

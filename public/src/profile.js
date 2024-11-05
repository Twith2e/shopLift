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

const searchBar = document.getElementById("seachbar");
const searchIcon = document.getElementById("searchicon");
const searchBtn = document.getElementById("searchbtn");
const smSearchBtn = document.getElementById("smsearchbtn");
const searchInput = document.getElementById("searchinput");
const smSearchInput = document.getElementById("smsearchinput");
const profileBtns = document.querySelectorAll("#profilebtn");
const profileDropdowns = document.querySelectorAll("#profiledropdown");
const userNames = document.querySelectorAll("#username");
const signOutBtn = document.getElementById("signoutbtn");
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
let currentUser;

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log(user);
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
    console.log("searchBtn clicked");
    const searchValue = searchInput.value.trim();
    searchProductsByInput(searchValue);
    searchInput.value = "";
  });
}

if (smSearchBtn) {
  smSearchBtn.addEventListener("click", () => {
    console.log("smSearchBtn clicked");
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
      //   profileDropdowns[0].style.display = "none";
      //   profileDropdowns[1].style.display = "none";
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
    showError(error.message);
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
    showSuccess(error.message);
    console.log(error.message);
  }
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    console.log(searchInput.value);

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

async function saveProfileImg(user, file) {
  try {
    const userRef = doc(database, "users", user.uid);
    const updateProfile = {
      userPic: file.name,
    };
    await updateDoc(userRef, updateProfile).then(() => {
      showSuccess("Profile image updated!");
    });
    const imageRef = ref(storage, `${file.name}`);
    uploadBytes(imageRef, file)
      .then((snapshot) => {
        console.log("image uploaded");
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {}
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

async function showSuccess(message) {
  return new Promise((resolve) => {
    Swal.fire({
      background: "#28a745",
      color: "#fff",
      height: "fit-content",
      padding: "0 0",
      position: "top",
      showConfirmButton: false,
      text: `${message}`,
      timer: 1500,
      timerProgressBar: true,
      width: "fit-content",
    }).then(() => {
      resolve();
    });
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

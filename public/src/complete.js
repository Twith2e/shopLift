import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getStorage,
  ref,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
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
const storage = getStorage();
const database = getFirestore();
const auth = getAuth();

console.log(sessionStorage.getItem("productDets"));
let imgFile;
let btnPress = 0;
let btnPress1 = 0;
const descField = document.getElementById("descriptionfield");
const productImg = document.getElementById("mainProductimg");
const productImages = document.querySelectorAll("#productimg");
const photoCount = document.getElementById("photocount");
const editBtnWrapper = document.querySelector(".editbtn");
const uploadLabel = document.querySelector(".uploadlabel");
const delBtn = document.querySelector(".delbtn");
const wordCount = document.getElementById("wordcount");
const titleInput = document.getElementById("titleinput");
const categoryInput = document.getElementById("categoryinput");
const brandContainer1 = document.getElementById("brandcontainer1");
const addFieldBtn = document.getElementById("addf");
const addTileBtn = document.getElementById("addtile");
const digitInput = document.querySelectorAll("#digitinput");
const listBtn = document.getElementById("listbtn");
const priceInput = document.querySelector(".numberdigit");
const brandInput = document.getElementById("brandinput");
const qtyInput = document.getElementById("qty");

let picArray = [];
let photoCounter = 0;
let productDetails = JSON.parse(sessionStorage.getItem("productDets"));
const formatter = Intl.NumberFormat("en-NG");

titleInput.value = productDetails.productName;
categoryInput.value = productDetails.category;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.replace("signup.html");
  }
});

productImg.addEventListener("change", (e) => {
  let file = e.target.files[0];
  let fileReader = new FileReader();
  if (file) {
    fileReader.readAsDataURL(file);
  }
  fileReader.addEventListener("load", (e) => {
    photoCounter++;
    photoCount.innerText = `${photoCounter} of 4 photo`;
    let extractedFile = e.target.result;
    editBtnWrapper.style.display = "block";
    uploadLabel.style.display = "none";
    inputimg.src = extractedFile;
    console.log(extractedFile);

    const imageRef = ref(storage, `${file.name}`);
    uploadBytes(imageRef, file)
      .then((snapshot) => {
        console.log("image uploaded");
      })
      .catch((error) => {
        console.log(error);
      });

    picArray.push(file.name);
    productDetails.productImages = picArray;
    sessionStorage.setItem("productDets", JSON.stringify(productDetails));
  });
});
document.getElementById("productimg0").addEventListener("change", (e) => {
  addImg(e, 0);
});

document.getElementById("productimg1").addEventListener("change", (e) => {
  addImg(e, 1);
});

document.getElementById("productimg2").addEventListener("change", (e) => {
  addImg(e, 2);
});

function addImg(e, index) {
  let file = e.target.files[0];
  imgFile = file;
  let fileReader = new FileReader();
  if (file) {
    fileReader.readAsDataURL(file);
  }
  fileReader.addEventListener("load", (e) => {
    photoCounter++;
    photoCount.innerText = `${photoCounter} of 4 photo`;
    let extractedFile = e.target.result;
    document.querySelector(`.editbtn${index}`).style.display = "block";
    document.querySelector(`.uploadlabel${index}`).style.display = "none";
    const imgElement = document.getElementById(`inputimg${index}`);
    if (imgElement) {
      imgElement.src = extractedFile;
    } else {
      console.warn(`Element with id 'inputimg${index}' not found`);
    }
    const imageRef = ref(storage, `${file.name}`);
    uploadBytes(imageRef, file)
      .then((snapshot) => {
        console.log("image uploaded");
      })
      .catch((error) => {
        console.log(error);
      });
    picArray.push(file.name);
    productDetails.productImages = picArray;
    sessionStorage.setItem("productDets", JSON.stringify(productDetails));
  });
}

editBtnWrapper.addEventListener("mouseover", () => {
  delBtn.style.display = "inline-flex";
});

editBtnWrapper.addEventListener("mouseleave", () => {
  delBtn.style.display = "none";
});

document.querySelector(".editbtn0").addEventListener("mouseover", () => {
  document.querySelector(".delbtn0").style.display = "inline-flex";
});

document.querySelector(".editbtn0").addEventListener("mouseleave", () => {
  document.querySelector(".delbtn0").style.display = "none";
});

document.querySelector(".editbtn1").addEventListener("mouseover", () => {
  document.querySelector(".delbtn1").style.display = "inline-flex";
});

document.querySelector(".editbtn1").addEventListener("mouseleave", () => {
  document.querySelector(".delbtn1").style.display = "none";
});

document.querySelector(".editbtn2").addEventListener("mouseover", () => {
  document.querySelector(".delbtn2").style.display = "inline-flex";
});

document.querySelector(".editbtn2").addEventListener("mouseleave", () => {
  document.querySelector(".delbtn2").style.display = "none";
});

delBtn.addEventListener("click", () => {
  photoCounter--;
  photoCount.innerText = `${photoCounter} of 4 photo`;
  inputimg.src = "";
  uploadLabel.style.display = "flex";
  editBtnWrapper.style.display = "none";
});

document.querySelector(".delbtn0").addEventListener("click", () => {
  photoCounter--;
  photoCount.innerText = `${photoCounter} of 4 photo`;
  inputimg0.src = "";
  document.querySelector(".editbtn0").style.display = "none";
  document.querySelector(".uploadlabel0").style.display = "flex";
});

document.querySelector(".delbtn1").addEventListener("click", () => {
  photoCounter--;
  photoCount.innerText = `${photoCounter} of 4 photo`;
  inputimg1.src = "";
  document.querySelector(".editbtn1").style.display = "none";
  document.querySelector(".uploadlabel1").style.display = "flex";
});

document.querySelector(".delbtn2").addEventListener("click", () => {
  photoCounter--;
  photoCount.innerText = `${photoCounter} of 4 photo`;
  inputimg2.src = "";
  document.querySelector(".editbtn2").style.display = "none";
  document.querySelector(".uploadlabel2").style.display = "flex";
});

document.getElementById("delall").addEventListener("click", () => {
  photoCounter--;
  photoCount.innerText = `${photoCounter} of 4 photo`;
  inputimg.src = "";
  uploadLabel.style.display = "flex";
  editBtnWrapper.style.display = "none";
  photoCounter--;
  photoCount.innerText = `${photoCounter} of 4 photo`;
  inputimg0.src = "";
  document.querySelector(".editbtn0").style.display = "none";
  document.querySelector(".uploadlabel0").style.display = "flex";
  photoCounter--;
  photoCount.innerText = `${photoCounter} of 4 photo`;
  inputimg1.src = "";
  document.querySelector(".editbtn1").style.display = "none";
  document.querySelector(".uploadlabel1").style.display = "flex";
  photoCounter--;
  photoCount.innerText = `${photoCounter} of 4 photo`;
  inputimg2.src = "";
  document.querySelector(".editbtn2").style.display = "none";
  document.querySelector(".uploadlabel2").style.display = "flex";
});

titleInput.addEventListener("input", (e) => {
  console.log(e.key);
  console.log(titleInput.value);

  wordCount.innerText = `${titleInput.value.length}/80`;

  if (titleInput.value.length === 80) {
    e.preventDefault();
  }
});

digitInput.forEach((input) => {
  input.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  });
});

priceInput.addEventListener("input", () => {
  priceInput.value = formatter.format(priceInput.value);
});

function allImagesSelected() {
  return (
    document.getElementById("inputimg").src &&
    document.getElementById("inputimg0").src &&
    document.getElementById("inputimg1").src &&
    document.getElementById("inputimg2").src
  );
}

listBtn.addEventListener("click", () => {
  if (!allImagesSelected()) {
    showError("Please select all 4 required product images");
  } else if (
    document.getElementById("old").checked === false &&
    document.getElementById("new").checked === false
  ) {
    showError("Please select the product condition (new or pre-owned)");
  } else if (!priceInput.value) {
    showError("Please set a price for your product");
  } else if (!descField.value) {
    showError("Please fill in the product description");
  } else if (!brandInput.value) {
    showError("Please fill the brand");
  } else if (!qtyInput.value) {
    showError("please specify the quantity you are listing");
  } else {
    // Proceed with listing the product
    if (document.getElementById("new").checked) {
      productDetails.condition = "new";
    } else {
      productDetails.condition = "Pre-Owned";
    }

    productDetails.brand = brandInput.value;
    productDetails.price = unformat(priceInput.value);
    productDetails.owner = auth.currentUser.uid;
    productDetails.description = descField.value;
    productDetails.quantity = qtyInput.value;
    let tempStore = [];
    for (let i = 0; i <= btnPress; i++) {
      const div = document.getElementById(`incremental${i}`);
      const titleInput = document.getElementById(`ftitle${i}`);
      const inputs = div.getElementsByTagName("input");

      const title = titleInput.value;
      let descriptions = [];

      for (let j = 0; j < inputs.length; j++) {
        if (inputs[j].value) {
          descriptions.push(inputs[j].value);
        }
      }
      if (title !== "") {
        tempStore.push({
          title,
          desc: descriptions,
        });
      }
    }
    productDetails.additionalFeatures = tempStore;
    productDetails.searchableFields = [
      productDetails.brand.toLowerCase(),
      productDetails.category.toLowerCase(),
      productDetails.productName.toLowerCase(),
    ];
    sessionStorage.setItem("productDets", JSON.stringify(productDetails));
    console.log(sessionStorage.getItem("productDets"));

    addProduct();
    console.log(productImg.value);
  }
});
const addProduct = async () => {
  console.log(productDetails);

  const docRef = await addDoc(collection(database, "products"), productDetails);
  const newProductId = docRef.id;
  productDetails.productID = newProductId;
  await updateDoc(docRef, { productID: newProductId });

  console.log("Document written with ID: ", newProductId);
  showSuccess("Product added").then(() => {
    location.replace("index.html");
  });
};

function unformat(formattedNum) {
  return parseFloat(formattedNum.replace(/[^\d.-]/g, ""));
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

addFieldBtn.addEventListener("click", () => {
  document.querySelector(".remove-tile").style.display = "block";
  addField();
});

function addField() {
  btnPress++;
  const div1 = document.createElement("div");
  div1.className = `incremental${btnPress}`;
  const input1 = document.createElement("input");
  input1.type = "text";
  input1.id = `ftitle${btnPress}`;
  div1.appendChild(input1);
  const div2 = document.createElement("div");
  div2.id = `incremental${btnPress}`;
  const input2 = document.createElement("input");
  input2.type = "text";
  input2.id = `fdesc${btnPress}`;
  div2.appendChild(input2);
  const button = document.createElement("button");
  button.id = "addtile";
  button.setAttribute("data-div-id", `${div2.id}`);
  button.textContent = "add";
  button.addEventListener("click", (event) => {
    addTile(event);
  });
  brandContainer1.appendChild(div1);
  brandContainer1.appendChild(div2);
  brandContainer1.appendChild(button);
  console.log("%c" + div2.id, "color: green;");
  console.log("%c" + div1.className, "color: blue;");
  console.log(btnPress);
}

addTileBtn.addEventListener("click", (event) => {
  addTile(event);
});

function addTile(e) {
  btnPress1++;
  const id = e.target.getAttribute("data-div-id");
  const input = document.createElement("input");
  input.type = "text";
  input.id = `fdesc${btnPress}`;
  input.className = `increase${btnPress}`;
  input.style.marginTop = "10px";
  const button = document.createElement("button");
  button.textContent = "remove";
  button.setAttribute("data-input-class", input.className);
  const div = document.getElementById(id);
  button.addEventListener("click", (event) => {
    removeTile(event);
  });
  div.appendChild(input);
  div.appendChild(button);
  console.log(input.id);
}

function removeTile(e) {
  const inputClass = e.target.getAttribute("data-input-class");
  const input = document.querySelector(`.${inputClass}`);
  input.remove();
  e.target.remove();
}

let deleteCounter = btnPress;

document.querySelector(".remove-tile").addEventListener("click", () => {
  if (btnPress > 0) {
    document.querySelector(`.incremental${btnPress}`).remove();
    document.getElementById(`incremental${btnPress}`).remove();
    const lastAddTileBtn = brandContainer1.querySelector("#addtile:last-child");
    if (lastAddTileBtn) {
      lastAddTileBtn.remove();
    }
    btnPress--;
    if (btnPress === 0) {
      document.querySelector(".remove-tile").style.display = "none";
    }
  }
});

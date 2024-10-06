import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDoc,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
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

(function () {
  emailjs.init({ publicKey: "pZeVBA8Xt9mOrjobf" });
})();

const productInfo = JSON.parse(sessionStorage.getItem("productInfo"));
const paymentBtn = document.getElementById("paymentbtn");
const radio = document.getElementById("radio");
const prices = document.querySelectorAll("#price");
const formatter = Intl.NumberFormat("en-NG");
let userId;
let tempRef;

function checkStorage() {
  if (
    !sessionStorage.getItem("mail") ||
    !sessionStorage.getItem("price") ||
    !sessionStorage.getItem("productInfo")
  ) {
    showError("Invalid session data");
    return;
  }
}

checkStorage();

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    userId = user.uid;
  }
});

console.log("Quantity Bought:", productInfo.qtyBought);
console.log("Product ID:", productInfo.productID);

paymentBtn.addEventListener("click", payWithPaystack, false);

function payWithPaystack() {
  if (!radio.checked) {
    showError("Please select a payment method");
    return;
  }
  const email = sessionStorage.getItem("mail");
  const price = sessionStorage.getItem("price");
  const productInfo = JSON.parse(sessionStorage.getItem("productInfo"));
  if (!email || !price || !productInfo) {
    showError("Invalid session data");
    return;
  }
  let handler = PaystackPop.setup({
    key: "pk_test_c05702e7cf1cdedcdf4044fd7b97642551aaabb0",
    email: email,
    amount: price * 100,
    currency: "NGN",
    callback: function (response) {
      try {
        const orderRef = collection(database, "users/" + userId + "/order");
        const orderInfo = {
          productID: productInfo.productID,
          qtyBought: productInfo.qtyBought,
          owner: productInfo.owner,
          seller: productInfo.seller,
          date: new Date().toLocaleString(),
        };
        addDoc(orderRef, orderInfo)
          .then(() => {
            // Update product quantity
            console.log(productInfo.productID);

            const productRef = doc(
              database,
              "products/",
              productInfo.productID
            );
            tempRef = doc(database, "products/", productInfo.productID);
            return getDoc(productRef);
          })
          .then((productSnap) => {
            if (productSnap.exists()) {
              const currentQty = productSnap.data().quantity;
              console.log("Current Quantity:", currentQty);
              const newQty = Math.max(0, currentQty - productInfo.qtyBought);
              console.log("New Quantity:", newQty);
              return updateDoc(tempRef, { quantity: newQty });
            } else {
              showError("Product does not exist");
              return;
            }
          })
          .then(() => {
            showSuccess("Order placed successfully").then(() => {
              location.href = "index.html";
            });
            verifyTransaction(response.reference);
          })
          .catch((error) => {
            console.log(error.message);

            showError(error.message);
          });
      } catch (error) {
        console.log(error.message);

        showError(error.message);
      }
    },
    onClose: function () {
      showCanceled("Transaction was not completed, window closed.");
    },
  });
  handler.openIframe();
}

// async function updateProductQuantity(productID, qtyBought) {
//   const productRef = doc(database, "products", productID);
//   const productSnap = await getDoc(productRef);

//   if (productSnap.exists()) {
//     const currentQty = productSnap.data().quantity;
//     const newQty = currentQty - qtyBought;

//     await updateDoc(productRef, {
//       quantity: newQty,
//     });
//   }
// }

function verifyTransaction(reference) {
  fetch("https://api.paystack.co/transaction/verify/" + reference, {
    method: "GET",
    headers: {
      Authorization: "Bearer sk_test_69b3bd2708d419e10e1b5e8a891723da305666fd",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status) {
        console.log("Transaction Details:", data.data);
        generateReceipt(data.data);
      } else {
        console.error("Transaction verification failed:", data.message);
      }
    })
    .catch((error) => console.error("Error:", error));
}

function generateReceipt(transactionData) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Receipt", 105, 10, { align: "center" });
  doc.text("Transaction Reference: " + transactionData.reference, 10, 20);
  doc.text("Amount: ₦" + (transactionData.amount / 100).toFixed(2), 10, 30);
  doc.text("Email: " + transactionData.customer.email, 10, 40);
  doc.text(
    "Date: " + new Date(transactionData.paid_at).toLocaleString(),
    10,
    50
  );

  const pdfData = doc.output("datauristring");

  sendReceiptByEmail(transactionData.customer.email, pdfData);
}

function sendReceiptByEmail(email, pdfData) {
  emailjs
    .send("service_zfwgbmf", "template_pfuor4j", {
      user_email: email,
      message:
        "Thank you for your purchase! Please find your receipt attached.",
      attachment: pdfData,
    })
    .then(
      function (response) {
        showSuccess("Receipt sent successfully to " + email);
        location.href = "index.html";
      },
      function (error) {
        console.error("Failed to send email:", error);
      }
    );
}

prices.forEach((price) => {
  const priceValue = sessionStorage.getItem("price");
  price.textContent = `NGN ₦${formatter.format(priceValue)}`;
});

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

async function showCanceled(message) {
  Swal.fire({
    background: "#DC3545",
    borderRadius: "0px",
    color: "#fff",
    height: "fit-content",
    padding: "0",
    position: "top",
    showConfirmButton: false,
    text: `${message}`,
    timer: 1500,
    timerProgressBar: true,
    width: "fit-content",
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

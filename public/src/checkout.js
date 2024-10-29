import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  collection,
  query,
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
const user = auth.currentUser;
console.log(user);

(function () {
  emailjs.init({ publicKey: "pZeVBA8Xt9mOrjobf" });
})();

const productInfo = JSON.parse(sessionStorage.getItem("productInfo"));
const paymentBtn = document.getElementById("paymentbtn");
const radio = document.getElementById("radio");
const prices = document.querySelectorAll("#price");
const formatter = Intl.NumberFormat("en-NG");
let userId;
console.log(userId);

payinput.addEventListener("click", () => {
  radio.checked = "true";
});

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
    console.log(user.uid);

    paymentBtn.addEventListener("click", payWithPaystack, false);
  }
});

console.log("Quantity Bought:", productInfo.qtyBought);
console.log("Product ID:", productInfo.productID);

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
        const orderRef = collection(database, `orders`);
        const newOrderRef = doc(orderRef);
        const productPromises = productInfo.map((product) => {
          const user = auth.currentUser;
          const orderInfo = {
            productID: product.productID,
            qtyBought: product.qtyBought,
            owner: user.uid,
            seller: product.seller,
            date: new Date().toLocaleString(),
            price,
          };

          const newOrderRef = doc(database, "orders", product.productID); // Unique order ref for each product
          const productRef = doc(database, "products", product.productID); // Unique product ref

          // Return the promise chain for each product
          return setDoc(newOrderRef, orderInfo)
            .then(() => {
              return getDoc(productRef);
            })
            .then((productSnap) => {
              if (productSnap.exists()) {
                const currentQty = productSnap.data().quantity;
                const newQty = Math.max(0, currentQty - product.qtyBought);
                return updateDoc(productRef, { quantity: newQty });
              } else {
                throw new Error("Product does not exist");
              }
            });
        });

        // Use Promise.all() to wait for all product promises to complete
        Promise.all(productPromises)
          .then(() => {
            // Show success message once after all promises are resolved
            showSuccess("Order placed successfully").then(() => {
              clearCartAfterPurchase()
                .then(() => {
                  location.href = "index.html";
                })
                .catch((error) => {
                  showError(error.message);
                  console.log(error.message);
                });
            });
            verifyTransaction(response.reference);
          })
          .catch((error) => {
            // Handle errors from any of the promises
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
        generateReceipt(data.data);
      } else {
        showError(data.message);
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

async function clearCartAfterPurchase() {
  const user = auth.currentUser;
  const cartRef = collection(database, "users/" + user.uid + "/cart");
  const cartQuery = query(cartRef);

  try {
    // Get all items in the cart
    const cartSnapshot = await getDocs(cartQuery);

    // Create an array of promises to delete all items in the cart
    const deletePromises = cartSnapshot.docs.map((cartDoc) => {
      return deleteDoc(
        doc(database, "users/" + user.uid + "/cart", cartDoc.id)
      );
    });

    // Wait for all delete operations to complete
    await Promise.all(deletePromises);
    console.log("Cart cleared successfully.");
  } catch (error) {
    console.error("Error clearing cart: ", error);
    showError(error.message); // Use your existing error handling
  }
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

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
import { setupNetworkMonitoring } from "./utils/networkUtils.js";
import { showSuccess, showError } from "./utils/customAlerts.js";
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
const user = auth.currentUser;

(function () {
  emailjs.init({ publicKey: "pZeVBA8Xt9mOrjobf" });
})();

const productInfo = JSON.parse(sessionStorage.getItem("productInfo"));
const paymentBtn = document.getElementById("paymentbtn");
const radio = document.getElementById("radio");
const prices = document.querySelectorAll("#price");
const formatter = Intl.NumberFormat("en-NG");
let userId;
const addressBtn = document.getElementById("addressbtn");
const address = document.getElementById("address");

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

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    try {
      const userRef = doc(database, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists() && userDoc.data().shippingAddress) {
        address.value = userDoc.data().shippingAddress;
      }
    } catch (error) {
      console.log("Error loading address:", error);
    }
    paymentBtn.addEventListener("click", payWithPaystack, false);
  }
});

function payWithPaystack() {
  if (!radio.checked) {
    showError("Please select a payment method");
    return;
  }

  if (!address.value.trim()) {
    showError("Please fill in the field for the shipping address.");
    return;
  }

  const email = sessionStorage.getItem("mail");
  const price = sessionStorage.getItem("price");
  const productInfo = JSON.parse(sessionStorage.getItem("productInfo"));

  if (!email || !price || !productInfo) {
    showError("Invalid session data");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    showError("User is not authenticated.");
    return;
  }

  // Update user's shipping address if needed
  const userRef = doc(database, "users", user.uid);
  updateDoc(userRef, { shippingAddress: address.value.trim() }).catch(
    (error) => {
      showError(`Failed to update shipping address: ${error.message}`);
      return;
    }
  );

  let handler = PaystackPop.setup({
    key: "pk_test_c05702e7cf1cdedcdf4044fd7b97642551aaabb0",
    email: email,
    amount: price * 100,
    currency: "NGN",
    callback: function (response) {
      try {
        const orderRef = collection(database, "orders");

        const productPromises = productInfo.map((product) => {
          const orderInfo = {
            productID: product.productID,
            qtyBought: product.qtyBought,
            owner: user.uid,
            seller: product.seller,
            date: new Date().toLocaleString(),
            price,
          };

          const newOrderRef = doc(orderRef, product.productID);
          const productRef = doc(database, "products", product.productID);

          return setDoc(newOrderRef, orderInfo)
            .then(() => getDoc(productRef))
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

        Promise.all(productPromises)
          .then(() => {
            showSuccess("Order placed successfully").then(() => {
              clearCartAfterPurchase()
                .then(() => {
                  location.replace("index.html");
                })
                .catch((error) => {
                  showError(error.message);
                });
            });
            verifyTransaction(response.reference);
          })
          .catch((error) => {
            showError(error.message);
          });
      } catch (error) {
        showError(error.message);
      }
    },
    onClose: function () {
      showError("Transaction was not completed, window closed.");
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

  sendReceiptByEmail(transactionData.customer.email, pdfData, address.value);
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
  } catch (error) {
    console.error("Error clearing cart: ", error);
    showError(error.message); // Use your existing error handling
  }
}

function sendReceiptByEmail(email, pdfData) {
  // Create HTML content for the email message
  const message = `
  Dear Customer,\n\n
  Thank you for your purchase. Here are the details:\n
  Order Date: ${getTodayDate()}\n
  Total Amount: ₦${formatter.format(sessionStorage.getItem("price"))}\n\n
  Thank you for shopping with us!
`;

  // Send email with HTML content using EmailJS
  emailjs
    .send("service_zfwgbmf", "template_pfuor4j", {
      user_email: email,
      message: message, // Pass the message content as HTML
      attachment: pdfData,
    })
    .then(
      function (response) {},
      function (error) {
        console.error("Failed to send email:", error);
      }
    );
}

prices.forEach((price) => {
  const priceValue = sessionStorage.getItem("price");
  price.textContent = `NGN ₦${formatter.format(priceValue)}`;
});

function getTodayDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0"); // Day with leading zero
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Month with leading zero
  const year = String(today.getFullYear()).slice(-2); // Last two digits of the year
  return `${day}/${month}/${year}`;
}

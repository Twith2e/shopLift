(function () {
  emailjs.init({ publicKey: "pZeVBA8Xt9mOrjobf" });
})();

const paymentBtn = document.getElementById("paymentbtn");
const prices = document.querySelectorAll("#price");
const formatter = Intl.NumberFormat("en-NG");

paymentBtn.addEventListener("click", payWithPaystack, false);

function payWithPaystack() {
  let handler = PaystackPop.setup({
    key: "pk_test_c05702e7cf1cdedcdf4044fd7b97642551aaabb0",
    email: sessionStorage.getItem("mail"),
    amount: sessionStorage.getItem("price") * 100,
    currency: "NGN",
    callback: function (response) {
      showSuccess("Payment complete! Reference: " + response.reference);
      verifyTransaction(response.reference);
    },
    onClose: function () {
      alert("Transaction was not completed, window closed.");
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
  price.textContent = `NGN ₦${formatter.format(
    sessionStorage.getItem("price")
  )}`;
});

function showSuccess(message) {
  Swal.fire({
    background: "#28a745",
    color: "#fff",
    position: "top",
    showConfirmButton: false,
    text: `${message}`,
  });
}

function confirm(message) {
  Swal.fire({
    title: "<strong>HTML <u>example</u></strong>",
    icon: "info",
    html: `
    ${message}
  `,
    showCloseButton: true,
    showCancelButton: true,
    focusConfirm: false,
    confirmButtonText: `
    <i class="fa fa-thumbs-up"></i> Great!
  `,
    confirmButtonAriaLabel: "Thumbs up, great!",
    cancelButtonText: `
    <i class="fa fa-thumbs-down"></i>
  `,
    cancelButtonAriaLabel: "Thumbs down",
  });
}

import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

export function setupNetworkMonitoring(app) {
  const db = getFirestore(app);
  let errorTimeout;
  const testDocRef = doc(db, "networkCheck/testDoc");

  const checkConnection = async () => {
    try {
      await getDoc(testDocRef);
      console.log("Connected to Firestore");
      if (errorTimeout) clearTimeout(errorTimeout);
    } catch (error) {
      errorTimeout = setTimeout(() => {
        showError("Please check your internet connection.");
      }, 3000);
    }
  };

  checkConnection();
  setInterval(checkConnection, 5000);
}

export function showError(message) {
  return Swal.fire({
    icon: "error",
    title: "Connection Error",
    text: message,
    background: "#DC3545",
    color: "#fff",
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    confirmButtonText: "Try Again",
    customClass: {
      popup: "animated fadeInDown swal-wide",
      title: "swal-title",
      content: "swal-text",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.reload();
    }
  });
}

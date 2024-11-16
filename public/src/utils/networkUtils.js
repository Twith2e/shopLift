import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

export function setupNetworkMonitoring(app) {
  const db = getFirestore(app);
  let errorTimeout;

  // Firestore document for testing connection (a small, read-only document is ideal)
  const testDocRef = doc(db, "networkCheck/testDoc");

  const checkConnection = async () => {
    try {
      await getDoc(testDocRef);
      console.log("Connected to Firestore");

      // Clear any pending error display if reconnected
      if (errorTimeout) clearTimeout(errorTimeout);
    } catch (error) {
      // Start a timeout to display error message if the check fails
      errorTimeout = setTimeout(() => {
        showError("Please check your internet connection.");
      }, 3000);
    }
  };

  // Initial connection check and periodic re-check every few seconds
  checkConnection();
  setInterval(checkConnection, 60000); // Checks every 60 seconds
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

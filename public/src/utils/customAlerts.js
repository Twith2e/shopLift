async function showSuccess(message) {
  return new Promise((resolve) => {
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: message,
      background: "#28a745",
      color: "#fff",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      customClass: {
        popup: "animated fadeInDown swal-wide",
        title: "swal-title",
        content: "swal-text",
      },
    }).then(() => resolve());
  });
}

function confirm(message = "Confirmation", icon = "question") {
  return new Promise((resolve) => {
    Swal.fire({
      text: message,
      icon: icon,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#4CAF50",
      cancelButtonColor: "#f44336",
      reverseButtons: true,
      width: "300px",
      toast: true,
      position: "top",
      background: "#2b2b2b",
      color: "#ffffff",
      customClass: {
        popup: "animated fadeInDown",
      },
    }).then((result) => {
      resolve(result.isConfirmed);
    });
  });
}

async function showError(message) {
  Swal.fire({
    icon: "error",
    title: "Error",
    text: message,
    background: "#DC3545",
    color: "#fff",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    customClass: {
      popup: "animated fadeInDown swal-wide",
      title: "swal-title",
      content: "swal-text",
    },
  });
}

export { showSuccess, confirm, showError };

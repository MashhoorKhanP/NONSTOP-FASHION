function showConfirmation() {
    Swal.fire({
        title: 'Are you sure?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, submit!',
        cancelButtonText: 'No, cancel!',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            // If the user confirms, submit the form
            document.getElementById('myForm').submit();
        }
    });
}
document.getElementById('myForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the form from submitting directly
    showConfirmation(); // Show the confirmation box
});
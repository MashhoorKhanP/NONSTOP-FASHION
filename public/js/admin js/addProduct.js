//Image Cropper Start
document.addEventListener("DOMContentLoaded", function () {
    const deleteButtons = document.querySelectorAll(".delete-image-button");
    const addImageButtons = document.querySelectorAll(".add-image-button");
    deleteButtons.forEach((button) => {
        button.addEventListener("click", function () {
            const mainElement = button.closest(".page"); // Find the main container element
            const fileInput = mainElement.querySelector(".image");
            const resultDiv = mainElement.querySelector(".result");
            const imgResultDiv = mainElement.querySelector(".img-result");
            const croppedImage = mainElement.querySelector(".cropped");
            // Clear the currently displayed image and hide related elements
            resultDiv.innerHTML = "";
            imgResultDiv.classList.add("hide");
            croppedImage.src = "";
            // Reset the file input
            fileInput.value = null;
        });
    });
    addImageButtons.forEach((addButton) => {
        addButton.addEventListener("click", function () {
            const mainElement = addButton.closest(".page");
            const newMainElement = mainElement.cloneNode(true);
            const deleteButton = newMainElement.querySelector(".delete-image-button");
            // Reset the input field and hide the result and cropped image
            const fileInput = newMainElement.querySelector(".image");
            const resultDiv = newMainElement.querySelector(".result");
            const imgResultDiv = newMainElement.querySelector(".img-result");
            const saveButton = newMainElement.querySelector(".save");
            const downloadLink = newMainElement.querySelector(".download");
            fileInput.value = "";
            resultDiv.innerHTML = "";
            imgResultDiv.classList.add("hide");
            saveButton.classList.add("hide");
            downloadLink.classList.add("hide");
            // Reset the image width value
            const imgWidthInput = newMainElement.querySelector(".img-w");
            imgWidthInput.value = "300";
            // Append the new set of input fields after the last one
            mainElement.parentNode.insertBefore(newMainElement, mainElement.nextSibling);
        });
    });
    const productForm = document.getElementById("addProductsubmit-form"); // Assuming your form has the id "productForm"
    let imageFiles = []; // Array to store the saved image files
    const fileInputs = document.querySelectorAll(".image");
    let formData = new FormData(productForm);
    productForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        // Append the saved images to the form data
        fileInputs.forEach((fileInput, index) => {
            const croppedImage = document.querySelectorAll('.cropped')[index];
            const blob = dataURItoBlob(croppedImage.src);
            formData.append(`image_${index}`, new File([blob], `image_${index}.png`, fileInput));
        });
        try {
            const response = await fetch("/admin/products/addproduct", {
                method: "POST",
                body: formData,
            });
            if (response.ok) {
                // Handle successful response (e.g., redirect)
            } else {
                // Handle error response
            }
        } catch (error) {
            console.error(error);
        }
    });
    fileInputs.forEach((upload, index) => {
        let result = document.querySelectorAll('.result')[index],
            img_result = document.querySelectorAll('.img-result')[index],
            img_w = document.querySelectorAll('.img-w')[index],
            options = document.querySelectorAll('.options')[index],
            save = document.querySelectorAll('.save')[index],
            cropped = document.querySelectorAll('.cropped')[index],
            dwn = document.querySelectorAll('.download')[index],
            cropper = '';
        upload.addEventListener('change', e => {
            if (e.target.files.length) {
                // start file reader
                const reader = new FileReader();
                reader.onload = e => {
                    if (e.target.result) {
                        // create new image
                        let img = document.createElement('img');
                        img.id = 'image';
                        img.src = e.target.result;
                        // clean result before
                        result.innerHTML = '';
                        // append new image
                        result.appendChild(img);
                        // show save btn and options
                        save.classList.remove('hide');
                        options.classList.remove('hide');
                        // init cropper
                        cropper = new Cropper(img);
                    }
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
        save.addEventListener('click', e => {
            e.preventDefault();
            // get result to data uri
            let imgSrc = cropper.getCroppedCanvas({
                width: img_w.value // input value
            }).toDataURL();
            // remove hide class of img
            cropped.classList.remove('hide');
            img_result.classList.remove('hide');
            // show image cropped
            cropped.src = imgSrc;
            dwn.classList.remove('hide');
            dwn.download = 'imagename.png';
            dwn.setAttribute('href', imgSrc);
            // Add the saved image to the form data
            const blob = dataURItoBlob(imgSrc);
            const croppedImageFile = new File([blob], `cropped_image_${index}.png`);
            formData.append(`cropped_image_${index}`, croppedImageFile);
        });
    });
});
// Function to convert data URI to Blob
function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}
// Image Cropper End
//Size checkbox Start
function handleCheckboxChange() {
    var frCheckboxes = document.querySelectorAll('#size-number input[type="checkbox"]');
    var anDiv = document.getElementById('size-character');
    // Check if any checkbox in the "fr" div is selected
    var isChecked = Array.from(frCheckboxes).some(function (checkbox) {
        return checkbox.checked;
    });
    // Enable or disable the "an" div based on the checkbox state
    if (isChecked) {
        anDiv.style.pointerEvents = 'none'; // Disable the div
        anDiv.style.opacity = '0.5'; // Optional: Reduce the opacity to indicate it's disabled
    } else {
        anDiv.style.pointerEvents = 'auto'; // Enable the div
        anDiv.style.opacity = '1'; // Optional: Restore the original opacity
    }
}
function handleCheckboxChange1() {
    var frCheckboxes = document.querySelectorAll('#size-character input[type="checkbox"]');
    var anDiv = document.getElementById('size-number');
    // Check if any checkbox in the "fr" div is selected
    var isChecked = Array.from(frCheckboxes).some(function (checkbox) {
        return checkbox.checked;
    });
    // Enable or disable the "an" div based on the checkbox state
    if (isChecked) {
        anDiv.style.pointerEvents = 'none'; // Disable the div
        anDiv.style.opacity = '0.5'; // Optional: Reduce the opacity to indicate it's disabled
    } else {
        anDiv.style.pointerEvents = 'auto'; // Enable the div
        anDiv.style.opacity = '1'; // Optional: Restore the original opacity
    }
}
//Size checkbox End
function isSizeChecked() {
    const characterSizes = document.querySelectorAll("#size-character input[type=checkbox]");
    const numberSizes = document.querySelectorAll("#size-number input[type=checkbox]");
    // Check if at least one checkbox is checked in either group
    return Array.from(characterSizes).some(checkbox => checkbox.checked) ||
        Array.from(numberSizes).some(checkbox => checkbox.checked);
}
// Function to handle form submission
function handleSubmit(event) {
    if (!isSizeChecked()) {
        event.preventDefault(); // Prevent form submission
        alert("Please select at least one size.");
    } else if (document.getElementById('category').value == 'null') {
        event.preventDefault(); // Prevent form submission
        alert("Please select a valid category");
    } else {
        // Form is valid, submit the form
    }
}
// Function to handle form submission
function handleSubmit(e) {
    if (!isSizeChecked()) {
        e.preventDefault(); // Prevent form submission
        alert("Please select at least one size.");
    } else {
        form.submit();
    }
}
const form = document.getElementById("addProductsubmit-form");
form.addEventListener("submit", handleSubmit);

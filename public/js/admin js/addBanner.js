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
    const productForm = document.getElementById("addBannerSubmit-form"); // Assuming your form has the id "productForm"
    let imageFiles = []; // Array to store the saved image files
    const fileInputs = document.querySelectorAll(".image");
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
            // Add the saved image to the array
            const blob = dataURItoBlob(imgSrc);
            imageFiles[index] = new File([blob], 'image.png');
        });
    });
    productForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(productForm);
        // Append the saved images to the form data
        imageFiles.forEach((file, index) => {
            formData.append(`images_${index}`, file);
        });
        try {
            const response = await fetch("/admin/updatebanner", {
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
let fileInputs = document.querySelectorAll('.image');
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
    });
});
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
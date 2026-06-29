
// Modal window to edit substances+
const modal = document.getElementById("settings-modal");
const btnModalEdit = document.getElementById("btn-edit");
const btnCloseX = document.getElementById("modal-close-x");
const btnCancel = document.getElementById("modal-cancel-btn");
const btnSave = document.getElementById("modal-save-btn");

btnModalEdit.addEventListener("click", () => {
    modal.style.display = "block";
});

const closeModal = () => {
    modal.style.display = "none";
};

btnCloseX.addEventListener("click", closeModal);
btnCancel.addEventListener("click", closeModal);

btnSave.addEventListener("click", () => {
    closeModal();
});

window.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeModal();
    }
});
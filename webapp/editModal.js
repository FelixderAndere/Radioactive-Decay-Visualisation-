const modal = document.getElementById("settings-modal");
const btnModalEdit = document.getElementById("btn-edit");
const btnCloseX = document.getElementById("modal-close-x");
const btnCancel = document.getElementById("modal-cancel-btn");
const btnSave = document.getElementById("modal-save-btn");

const substancesContainer = document.getElementById("modal-substances-container");
const btnAddSubstance = document.getElementById("btn-add-substance");

let localSubstances = {};

btnModalEdit.addEventListener("click", () => {
    // Pause simulation playback if currently running
    if (typeof isPlaying !== 'undefined' && isPlaying) {
        document.getElementById('btn-play').click();
    }
    
    // Deep copy current active state properties
    localSubstances = JSON.parse(JSON.stringify(currentSubstancesData));
    renderModalSubstances();
    modal.style.display = "block";
});

const closeModal = () => {
    modal.style.display = "none";
};

function renderModalSubstances() {
    substancesContainer.innerHTML = '<h3 style="margin-bottom: 12px;">Bestehende Substanzen bearbeiten</h3>';
    
    Object.keys(localSubstances).forEach(key => {
        const sub = localSubstances[key];
        const displayHL = sub["half life"] === Infinity ? "Infinity" : sub["half life"];
        
        const html = `
            <div class="modal-substance-row" style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
                <span style="font-weight: bold; width: 30px; color: ${colors[key] || '#fff'}">${key}:</span>
                
                <div style="flex: 1;">
                    <label style="font-size: 0.75rem; color: #94a3b8; display: block;">Halbwertszeit</label>
                    <input type="text" class="input-hl" data-key="${key}" value="${displayHL}" style="width:100%; padding: 4px; background:#1e293b; color:#fff; border:1px solid #475569; border-radius:4px;">
                </div>
                
                <div style="flex: 1;">
                    <label style="font-size: 0.75rem; color: #94a3b8; display: block;">Start-Anteil</label>
                    <input type="number" step="0.01" min="0" max="1" class="input-val" data-key="${key}" value="${sub.value}" style="width:100%; padding: 4px; background:#1e293b; color:#fff; border:1px solid #475569; border-radius:4px;">
                </div>
            </div>
        `;
        substancesContainer.insertAdjacentHTML('beforeend', html);
    });
}

// Add substance action located cleanly within structural workflow inside the modal layout view block
btnAddSubstance.addEventListener("click", () => {
    const nameInput = document.getElementById("new-substance-name");
    const hlInput = document.getElementById("new-substance-hl");
    const valInput = document.getElementById("new-substance-val");

    const name = nameInput.value.trim().toUpperCase();
    let hl = hlInput.value.trim();
    const val = parseFloat(valInput.value) || 0.0;

    if (!name) return alert("Bitte einen Namen eingeben!");
    if (localSubstances[name]) return alert("Substanz existiert bereits!");

    if (hl.toLowerCase() === "infinity" || hl === "∞") {
        hl = Infinity;
    } else {
        hl = parseFloat(hl);
        if (isNaN(hl) || hl <= 0) return alert("Ungültige Halbwertszeit!");
    }

    if (!colors[name]) {
        colors[name] = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    }

    localSubstances[name] = {
        value: val,
        "half life": hl,
        "decay products": {}
    };

    // Chain processing sequence logic logic updates dynamically
    const keys = Object.keys(localSubstances);
    if (keys.length > 1) {
        const prevKey = keys[keys.length - 2];
        localSubstances[prevKey]["decay products"] = { [name]: 1.0 };
    }

    // Reset input fields
    nameInput.value = "";
    hlInput.value = "";
    valInput.value = "";
    
    // Refresh modal lists
    renderModalSubstances();
});

btnSave.addEventListener("click", () => {
    // Collect edited dynamic Half Life data changes
    document.querySelectorAll(".input-hl").forEach(input => {
        const key = input.getAttribute("data-key");
        let val = input.value.trim();
        localSubstances[key]["half life"] = (val.toLowerCase() === 'infinity' || val === '∞') ? Infinity : parseFloat(val);
    });

    // Collect edited Initial values data changes
    document.querySelectorAll(".input-val").forEach(input => {
        const key = input.getAttribute("data-key");
        localSubstances[key].value = parseFloat(input.value) || 0.0;
    });

    // Synchronize updates down to global core engine model dataset hook instance
    if (typeof updateSimulationDataset === 'function') {
        updateSimulationDataset(localSubstances);
    }
    
    closeModal();
});

btnCloseX.addEventListener("click", closeModal);
btnCancel.addEventListener("click", closeModal);

window.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeModal();
    }
});
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
        
        // Convert decay products object to a comma-separated string (e.g., "B: 0.7, C: 0.3")
        const decayString = Object.entries(sub["decay products"])
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");

        const html = `
            <div class="modal-substance-row" style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px;">
                <span style="font-weight: bold; width: 30px; color: ${colors[key] || '#fff'}">${key}:</span>
                
                <div style="flex: 1; min-width: 100px;">
                    <label style="font-size: 0.75rem; color: #94a3b8; display: block;">Halbwertszeit</label>
                    <input type="text" class="input-hl" data-key="${key}" value="${displayHL}" style="width:100%; padding: 4px; background:#1e293b; color:#fff; border:1px solid #475569; border-radius:4px;">
                    <div style="display: flex">
                        <input type="checkbox" id="infinite-check" />  
                        <label for="infinite-check">Infinite</label> 
                    </div>
                    </div>
                
                <div style="flex: 1; min-width: 100px;">
                    <label style="font-size: 0.75rem; color: #94a3b8; display: block;">Start-Anteil</label>
                    <input type="number" step="0.01" min="0" max="1" class="input-val" data-key="${key}" value="${sub.value}" style="width:100%; padding: 4px; background:#1e293b; color:#fff; border:1px solid #475569; border-radius:4px;">
                </div>

                <div style="flex: 2; min-width: 200px;">
                    <label style="font-size: 0.75rem; color: #94a3b8; display: block;">Zerfallsprodukte (Format: B: 0.7, C: 0.3)</label>
                    <input type="text" class="input-decay-list" data-key="${key}" value="${decayString}" placeholder="z.B. B: 0.7, C: 0.3" style="width:100%; padding: 4px; background:#1e293b; color:#fff; border:1px solid #475569; border-radius:4px;">
                </div>
            </div>
        `;
        substancesContainer.insertAdjacentHTML('beforeend', html);
    });
}

// Add substance action 
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

    // Chain processing sequence logic updates dynamically by default
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

    // Parse and collect multiple decay products from the string input
    document.querySelectorAll(".input-decay-list").forEach(input => {
        const key = input.getAttribute("data-key");
        localSubstances[key]["decay products"] = {};

        const rawValue = input.value.trim();
        if (!rawValue) return;

        // Split by comma to separate products
        const pairs = rawValue.split(",");
        pairs.forEach(pair => {
            const parts = pair.split(":");
            if (parts.length === 2) {
                const targetProduct = parts[0].trim().toUpperCase();
                const targetRatio = parseFloat(parts[1].trim());

                if (targetProduct && !isNaN(targetRatio) && targetRatio > 0) {
                    localSubstances[key]["decay products"][targetProduct] = targetRatio;
                }
            }
        });
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
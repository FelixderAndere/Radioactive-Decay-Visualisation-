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
    
    console.log("currentSubstancesData", currentSubstancesData);
    localSubstances = JSON.parse(JSON.stringify(currentSubstancesData, (key, value) => {
        if (value === Infinity) {
            return "Infinity";
        }
        return value;
    }));
    console.log("localSubstances", localSubstances);
    renderModalSubstances();
    modal.style.display = "block";
});

const closeModal = () => {
    modal.style.display = "none";
};

function renderModalSubstances() {

    substancesContainer.innerHTML = `
        <h3 style="margin-bottom:18px;">
            Existing substances
        </h3>

        <div class="modal-table">

            <div class="modal-table-header">
                <div>Name</div>
                <div>Half-life</div>
                <div>∞</div>
                <div>Start value</div>
                <div>Decay product</div>
            </div>

            <div id="modal-table-body"></div>

        </div>
    `;

    const body = document.getElementById("modal-table-body");

    Object.keys(localSubstances).forEach(key => {

        const sub = localSubstances[key];

        const displayHL =
            sub["half life"] === "Infinity"
                ? "Infinity"
                : sub["half life"];

        const decayString = Object.entries(
            sub["decay products"]
        )
        .map(([k,v]) => `${k}: ${v}`)
        .join(", ");

        body.insertAdjacentHTML("beforeend", `

            <div class="modal-table-row">

                <div
                    class="substance-name"
                    style="color:${colors[key] || "#fff"}">

                    ${key}

                </div>

                <input
                    class="input-hl"
                    data-key="${key}"
                    type="text"
                    value="${displayHL}">

                <div class="checkbox-cell">

                    <input
                        type="checkbox"
                        id="infinite-check-${key}"
                        ${sub["half life"] === "Infinity" ? "checked" : ""}>

                </div>

                <input
                    class="input-val"
                    data-key="${key}"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value="${sub.value}">

                <input
                    class="input-decay-list"
                    data-key="${key}"
                    type="text"
                    value="${decayString}"
                    placeholder="B:1 oder B:0.7, C:0.3">

            </div>

        `);

        addInfiniteCheckboxListener(
            document.getElementById(`infinite-check-${key}`)
        );

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

    if (!name) return alert("Please enter a valid substance name!");
    if (localSubstances[name]) return alert("Substanz existiert bereits!");

    if (hl.toLowerCase() === "infinity" || hl === "∞") {
        hl = "Infinity";
    } else {
        hl = parseFloat(hl);
        if (isNaN(hl) || hl <= 0) return alert("Invalid half-life!");
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

const addInfiniteCheckboxListener = (checkbox) => {
    checkbox.addEventListener("change", (event) => {
        const key = checkbox.id.replace("infinite-check-", "");
        const hlInput = document.querySelector(`.input-hl[data-key="${key}"]`);
        if (event.target.checked) {
            hlInput.value = "Infinity";
        } else {
            hlInput.value = 1;
        }
    });
};

btnSave.addEventListener("click", () => {
    // Collect edited dynamic Half Life data changes
    document.querySelectorAll(".input-hl").forEach(input => {
        const key = input.getAttribute("data-key");
        let val = input.value.trim();
        localSubstances[key]["half life"] = (val.toLowerCase() === 'infinity' || val === '∞') ? "Infinity" : parseFloat(val);
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
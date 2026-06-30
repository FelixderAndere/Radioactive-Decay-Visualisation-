const modal = document.getElementById("settings-modal");
const btnModalEdit = document.getElementById("btn-edit");
const btnCloseX = document.getElementById("modal-close-x");
const btnCancel = document.getElementById("modal-cancel-btn");
const btnSave = document.getElementById("modal-save-btn");

const substancesContainer = document.getElementById("modal-substances-container");
const addContainer = document.getElementById("modal-add-container"); // ✅ NEU
const btnAddSubstance = document.getElementById("btn-add-substance");

let localSubstances = {};

btnModalEdit.addEventListener("click", () => {
    // Pause simulation playback if currently running
    if (typeof isPlaying !== 'undefined' && isPlaying) {
        document.getElementById('btn-play').click();
    }
    
    console.log("currentSubstancesData", currentSubstancesData);
    localSubstances = JSON.parse(JSON.stringify(currentSubstancesData, (key, value) => {
        if (value === "∞") {
            return "∞";
        }
        return value;
    }));
    renderModalSubstances();
    renderAddRow()
    modal.style.display = "block";
});

const closeModal = () => {
    modal.style.display = "none";
};

function renderAddRow() {

    addContainer.innerHTML = `
        <div class="modal-table">
            ${createAddRow()}
        </div>
    `;

    setTimeout(() => {
        const cb = document.getElementById("new-infinite");
        if (cb) cb.addEventListener("change", syncAddInfinity);
    }, 0);
}

function syncAddInfinity(event) {
    const hlInput = document.getElementById("new-hl");

    if (event.target.checked) {
        hlInput.value = "∞";
        hlInput.disabled = true;
    } else {
        hlInput.value = "";
        hlInput.disabled = false;
    }
}

function createAddRow() {

    return `
        <div class="modal-table-row">

            <input class="input-name modal-input"
                id="new-name"
                placeholder="Name">

            <input class="modal-input"
                id="new-hl"
                placeholder="Half-life">

            <div class="checkbox-cell">
                <input type="checkbox" id="new-infinite">
            </div>

            <input class="modal-input"
                id="new-value"
                type="number"
                step="0.01"
                placeholder="0">

            <input class="modal-input"
                id="new-decay"
                placeholder="B:1, C:0.3">
        </div>

        <div class="checkbox-cell">
            <button id="btn-add-substance" class="primary" style="width:30%">
                Create
            </button>
        </div>
    `;
}

const addInfiniteCheckboxListener = (checkbox) => {
    checkbox.addEventListener("change", (event) => {
        const key = checkbox.id.replace("infinite-check-", "");
        const hlInput = document.querySelector(`.input-hl[data-key="${key}"]`);
        if (event.target.checked) {
            hlInput.value = "∞";
        } else {
            hlInput.value = 1;
        }
    });
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
            sub["half life"] === "∞"
                ? "∞"
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
                        ${sub["half life"] === "∞" ? "checked" : ""}>

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
document.addEventListener("click", (e) => {
    if (e.target.id === "btn-add-substance") {
        addSubstance();
    }
});

function addSubstance() {

    const name = document.getElementById("new-name").value.trim().toUpperCase();
    const hlRaw = document.getElementById("new-hl").value.trim();
    const val = parseFloat(document.getElementById("new-value").value) || 0;
    const decay = document.getElementById("new-decay").value;
    const isInf = document.getElementById("new-infinite").checked;

    if (!name) return alert("Please enter a valid name!");
    if (localSubstances[name]) return alert("Already exists!");

    ensureColor(name);

    localSubstances[name] = {
        value: val,
        "half life": isInf ? "∞" : parseHalfLife(hlRaw),
        "decay products": parseDecay(decay)
    };

    renderModalSubstances();
    renderAddRow(); // wichtig: Add-Row bleibt bestehen
}

function parseDecay(raw) {

    const res = {};
    if (!raw) return res;

    raw.split(",").forEach(p => {
        const [k, v] = p.split(":");
        if (!k || !v) return;

        res[k.trim().toUpperCase()] = parseFloat(v);
    });

    return res;
}

function parseHalfLife(v) {
    const n = parseFloat(v);
    return isNaN(n) ? "" : n;
}

function ensureColor(name) {
    if (!colors[name]) {
        colors[name] =
            "#" + Math.floor(Math.random() * 16777215)
                .toString(16)
                .padStart(6, "0");
    }
}



btnSave.addEventListener("click", () => {
    // Collect edited dynamic Half Life data changes
    document.querySelectorAll(".input-hl").forEach(input => {
        const key = input.getAttribute("data-key");
        let val = input.value.trim();
        localSubstances[key]["half life"] = (val === '∞') ? "∞" : parseFloat(val);
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
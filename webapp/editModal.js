
const modal = document.getElementById("settings-modal");

const btnModalEdit = document.getElementById("btn-edit");
const btnCloseX = document.getElementById("modal-close-x");
const btnCancel = document.getElementById("modal-cancel-btn");
const btnSave = document.getElementById("modal-save-btn");

const substancesContainer = document.getElementById("modal-substances-container");
const addContainer = document.getElementById("modal-add-container");

let localSubstances = {};

/* =========================================================
   OPEN / CLOSE
========================================================= */

btnModalEdit.addEventListener("click", () => {

    localSubstances = structuredClone(currentSubstancesData);

    render();

    modal.style.display = "block";
});

function closeModal() {
    modal.style.display = "none";
}

btnCloseX.addEventListener("click", closeModal);
btnCancel.addEventListener("click", closeModal);

window.addEventListener("click", e => {
    if (e.target === modal) closeModal();
});


function createRow(key, sub) {

    const row = document.createElement("div");
    row.className = "modal-table-row";

    const hl = sub["half life"] === "∞"
        ? "∞"
        : sub["half life"];

    const decay = Object.entries(sub["decay products"] || {})
        .map(([k, v]) => `${k}:${v}`)
        .join(", ");

    row.innerHTML = `
        <div class="substance-name" style="color:${colors[key] || "#fff"}">
            ${key}
        </div>

        <input class="modal-input input-hl"
            data-key="${key}"
            value="${hl}">

        <div class="checkbox-cell">
            <input type="checkbox"
                class="infinite-check"
                data-key="${key}"
                ${sub["half life"] === "∞" ? "checked" : ""}>
        </div>

        <input class="modal-input input-val"
            data-key="${key}"
            type="number"
            step="0.01"
            value="${sub.value}">

        <input class="modal-input input-decay-list"
            data-key="${key}"
            value="${decay}">
    `;

    return row;
}

/* =========================================================
   RENDER
========================================================= */

function render() {

    renderSubstances();
    renderAddRow();
}

function renderSubstances() {

    substancesContainer.innerHTML = `
        <h3 class="modal-section-title">Substances</h3>
        <div id="modal-body" class="modal-table"></div>
    `;

    const body = document.getElementById("modal-body");

    Object.entries(localSubstances).forEach(([key, sub]) => {
        body.appendChild(createRow(key, sub));
    });

    bindInfiniteCheckboxes();
}

/* =========================================================
   ADD ROW (IDENTICAL UI)
========================================================= */

function renderAddRow() {

    addContainer.innerHTML = `
        <div class="modal-table">
            ${createAddRow()}
        </div>
    `;

    document.getElementById("new-infinite")
        .addEventListener("change", syncAddInfinity);
}

function createAddRow() {

    return `
        <div class="modal-table-row">

            <input class="modal-input"
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
            <button id="btn-add-substance" style="width: 30%; flex: none; marign-top: 25px" class="primary">
                Create
            </button>
        </div>
    `;
}

/* =========================================================
   ADD LOGIC
========================================================= */

document.addEventListener("click", e => {

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

    if (!name) return alert("Enter name!");
    if (localSubstances[name]) return alert("Already exists!");

    ensureColor(name);

    localSubstances[name] = {
        value: val,
        "half life": isInf ? "∞" : parseHalfLife(hlRaw),
        "decay products": parseDecay(decay)
    };

    render();
}

/* =========================================================
   SAVE
========================================================= */

btnSave.addEventListener("click", () => {

    document.querySelectorAll(".input-hl").forEach(i => {
        const k = i.dataset.key;
        localSubstances[k]["half life"] =
            i.value === "∞" ? "∞" : parseFloat(i.value);
    });

    document.querySelectorAll(".input-val").forEach(i => {
        const k = i.dataset.key;
        localSubstances[k].value = parseFloat(i.value) || 0;
    });

    document.querySelectorAll(".input-decay-list").forEach(i => {
        const k = i.dataset.key;
        localSubstances[k]["decay products"] = parseDecay(i.value);
    });

    updateSimulationDataset?.(localSubstances);

    closeModal();
});

/* =========================================================
   HELPERS
========================================================= */

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

function bindInfiniteCheckboxes() {

    document.querySelectorAll("#modal-body .infinite-check")
        .forEach(cb => {

            cb.addEventListener("change", e => {

                const k = e.target.dataset.key;

                const input = document.querySelector(
                    `.input-hl[data-key="${k}"]`
                );

                if (input) {
                    input.value = e.target.checked ? "∞" : "";
                }
            });
        });
}

function syncAddInfinity(e) {
    // optional hook (kept for consistency)
}
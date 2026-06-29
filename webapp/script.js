"use strict";

/***************************************************
 * Clean Input-Driven Decay Simulator
 * UI = Input Layer only
 **************************************************/

// ==============================
// Model
// ==============================

let substances = {
    A: { value: 1.0, halfLife: 5, decayProducts: { B: 0.7, C: 0.3 } },
    B: { value: 0.0, halfLife: 3, decayProducts: { C: 1.0 } },
    C: { value: 0.0, halfLife: 8, decayProducts: { D: 1.0 } },
    D: { value: 0.0, halfLife: 1, decayProducts: { E: 1.0 } },
    E: { value: 0.0, halfLife: Infinity, decayProducts: {} }
};

// ==============================
// DOM
// ==============================

const tableBody = document.getElementById("substanceTableBody");
const resultBody = document.getElementById("resultTableBody");

const slider = document.getElementById("timeSlider");
const timeLabel = document.getElementById("timeValue");

const speedSlider = document.getElementById("speedSlider");
const speedLabel = document.getElementById("speedValue");

const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");
const resetButton = document.getElementById("resetButton");
const addButton = document.getElementById("addSubstanceButton");

const template = document.getElementById("substanceRowTemplate");

// ==============================
// Chart
// ==============================

const ctx = document.getElementById("decayChart").getContext("2d");

const chart = new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [] },
    options: {
        responsive: true,
        animation: false,
        scales: { y: { min: 0, max: 1 } }
    }
});

// ==============================
// Simulation State
// ==============================

let simulator;
let currentTime = 0;
let running = false;
let speed = 1;

// ==============================
// INPUT STATE (IMPORTANT)
// ==============================

// zentrale Speicherung der UI-Eingaben
let inputState = {};

// ==============================
// INIT INPUT STATE
// ==============================

function initInputState() {
    for (const name in substances) {
        inputState[name] = {
            name,
            value: substances[name].value,
            halfLife: substances[name].halfLife,
            decayProducts: substances[name].decayProducts
        };
    }
}

// ==============================
// TABLE RENDER (ONLY ONCE / ADD / RESET)
// ==============================

function renderTable() {
    tableBody.innerHTML = "";

    for (const name in inputState) {
        createRow(name, inputState[name]);
    }
}

function createRow(key, data) {
    const node = template.content.cloneNode(true);
    const tr = node.querySelector("tr");

    const nameInput = tr.querySelector(".nameInput");
    const valueInput = tr.querySelector(".valueInput");
    const halfLifeInput = tr.querySelector(".halfLifeInput");
    const productsInput = tr.querySelector(".productsInput");

    nameInput.value = data.name;
    valueInput.value = data.value;
    halfLifeInput.value = data.halfLife === Infinity ? "∞" : data.halfLife;
    productsInput.value = JSON.stringify(data.decayProducts);

    // INPUT HANDLING → nur State aktualisieren, KEIN renderTable!
    nameInput.oninput = () => updateStateFromRow(tr, key);
    valueInput.oninput = () => updateStateFromRow(tr, key);
    halfLifeInput.oninput = () => updateStateFromRow(tr, key);
    productsInput.oninput = () => updateStateFromRow(tr, key);

    tr.querySelector(".deleteButton").onclick = () => {
        delete inputState[key];
        rebuildModel();
        renderTable();
    };

    tableBody.appendChild(tr);
}

// ==============================
// INPUT → STATE SYNC
// ==============================

function updateStateFromRow(row, oldKey) {

    const name = row.querySelector(".nameInput").value || oldKey;

    let value = parseFloat(row.querySelector(".valueInput").value);
    if (isNaN(value)) value = 0;

    let halfLife = row.querySelector(".halfLifeInput").value;
    halfLife = (halfLife === "∞") ? Infinity : parseFloat(halfLife);
    if (isNaN(halfLife)) halfLife = Infinity;

    let decayProducts = {};
    try {
        decayProducts = JSON.parse(row.querySelector(".productsInput").value || "{}");
    } catch {
        decayProducts = {};
    }

    inputState[oldKey] = {
        name,
        value,
        halfLife,
        decayProducts
    };

    rebuildModel();
}

// ==============================
// STATE → MODEL
// ==============================

function rebuildModel() {

    const newModel = {};

    for (const k in inputState) {
        const s = inputState[k];
        newModel[s.name] = {
            value: s.value,
            halfLife: s.halfLife,
            decayProducts: s.decayProducts
        };
    }

    // normalize
    const sum = Object.values(newModel).reduce((a, s) => a + s.value, 0) || 1;

    for (const k in newModel) {
        newModel[k].value /= sum;
    }

    substances = newModel;
    simulator = new DecaySimulator(substances);
}

// ==============================
// SIMULATION STEP
// ==============================

function step() {

    const v = simulator.simulate(currentTime);
    const names = simulator.names;

    const values = names.map(n => v[n].value);

    resultBody.innerHTML = "";

    names.forEach((name, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${name}</td>
            <td>${values[i].toFixed(4)}</td>
            <td>${(values[i] * 100).toFixed(2)}%</td>
        `;
        resultBody.appendChild(tr);
    });

    chart.data.labels.push(currentTime.toFixed(1));

    if (chart.data.datasets.length === 0) {
        chart.data.datasets = names.map(n => ({
            label: n,
            data: []
        }));
    }

    names.forEach((n, i) => {
        chart.data.datasets[i].data.push(values[i]);
    });

    chart.update();

    timeLabel.textContent = currentTime.toFixed(2);
    slider.value = currentTime;
}

// ==============================
// LOOP
// ==============================

function loop() {
    if (running) {
        currentTime += 0.1 * speed;
        step();
    }
    requestAnimationFrame(loop);
}

// ==============================
// EVENTS
// ==============================

playButton.onclick = () => running = true;
pauseButton.onclick = () => running = false;

resetButton.onclick = () => {

    currentTime = 0;

    chart.data.labels = [];
    chart.data.datasets.forEach(d => d.data = []);
    chart.update();

    rebuildModel();
    renderTable();
    step();
};

slider.oninput = () => {
    currentTime = parseFloat(slider.value);
    step();
};

speedSlider.oninput = () => {
    speed = parseFloat(speedSlider.value);
    speedLabel.textContent = speed.toFixed(1);
};

addButton.onclick = () => {

    const key = "X_" + Date.now();

    inputState[key] = {
        name: key,
        value: 0,
        halfLife: 1,
        decayProducts: {}
    };

    rebuildModel();
    renderTable();
};

// ==============================
// INIT
// ==============================

function init() {
    initInputState();
    rebuildModel();
    renderTable();
    step();
    loop();
}

init();
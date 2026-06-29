"use strict";

/***************************************************
 * Radioactive Decay Simulator
 * (relative fractions only, stable version)
 **************************************************/

// ==============================
// Initial system (fractions)
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

let chart = new Chart(ctx, {
    type: "line",
    data: {
        labels: [],
        datasets: []
    },
    options: {
        responsive: true,
        animation: false,
        scales: {
            y: {
                min: 0,
                max: 1
            }
        }
    }
});

// ==============================
// State
// ==============================

let simulator;
let currentTime = 0;
let running = false;
let speed = 1;

let history = {
    values: {}
};

// ==============================
// MATRIX
// ==============================

class Matrix {
    constructor(n) {
        this.n = n;
        this.data = Array.from({ length: n }, () => Array(n).fill(0));
    }

    static identity(n) {
        const m = new Matrix(n);
        for (let i = 0; i < n; i++) m.data[i][i] = 1;
        return m;
    }
}

function add(A, B) {
    const R = new Matrix(A.n);
    for (let i = 0; i < A.n; i++)
        for (let j = 0; j < A.n; j++)
            R.data[i][j] = A.data[i][j] + B.data[i][j];
    return R;
}

function multiply(A, B) {
    const R = new Matrix(A.n);

    for (let i = 0; i < A.n; i++) {
        for (let j = 0; j < A.n; j++) {
            let sum = 0;
            for (let k = 0; k < A.n; k++) {
                sum += A.data[i][k] * B.data[k][j];
            }
            R.data[i][j] = sum;
        }
    }

    return R;
}

function scalar(A, s) {
    const R = new Matrix(A.n);

    for (let i = 0; i < A.n; i++)
        for (let j = 0; j < A.n; j++)
            R.data[i][j] = A.data[i][j] * s;

    return R;
}

function matVec(M, v) {
    const r = Array(M.n).fill(0);

    for (let i = 0; i < M.n; i++)
        for (let j = 0; j < M.n; j++)
            r[i] += M.data[i][j] * v[j];

    return r;
}

// ==============================
// expm (Taylor approximation)
// ==============================

function expm(A, steps = 18) {
    const n = A.n;

    let result = Matrix.identity(n);
    let term = Matrix.identity(n);

    for (let k = 1; k < steps; k++) {
        term = multiply(term, scalar(A, 1 / k));
        result = add(result, term);
    }

    return result;
}

// ==============================
// Simulator
// ==============================

class DecaySimulator {

    constructor(data) {

        this.names = Object.keys(data);
        this.idx = {};

        this.names.forEach((n, i) => this.idx[n] = i);

        this.data = structuredClone(data);
        this.A = this.buildMatrix();
    }

    buildMatrix() {

        const n = this.names.length;
        const A = new Matrix(n);

        for (const name of this.names) {

            const j = this.idx[name];
            const s = this.data[name];

            const lambda = s.halfLife === Infinity
                ? 0
                : Math.log(2) / s.halfLife;

            A.data[j][j] = -lambda;

            for (const p in s.decayProducts) {

                const i = this.idx[p];
                A.data[i][j] += lambda * s.decayProducts[p];
            }
        }

        return A;
    }

    vector() {
        return this.names.map(n => this.data[n].value);
    }

    simulate(t) {

        const expA = expm(this.A, 20);
        const At = scalar(expA, t);

        const v = matVec(At, this.vector());

        // normalize (important: pure fractions)
        const sum = v.reduce((a, b) => a + b, 0) || 1;

        this.names.forEach((n, i) => {
            this.data[n].value = v[i] / sum;
        });

        return this.data;
    }
}

// ==============================
// UI
// ==============================

function addRow(name, s) {

    const row = template.content.cloneNode(true);
    const tr = row.querySelector("tr");

    tr.querySelector(".nameInput").value = name;
    tr.querySelector(".valueInput").value = s.value;
    tr.querySelector(".halfLifeInput").value =
        s.halfLife === Infinity ? "∞" : s.halfLife;

    tr.querySelector(".productsInput").value =
        JSON.stringify(s.decayProducts);

    tr.querySelector(".deleteButton").onclick = () => {
        tr.remove();
        sync();
        renderTable();
    };

    tr.querySelectorAll("input, textarea").forEach(el => {
        el.oninput = () => {
            sync();
            renderTable();
        };
    });

    tableBody.appendChild(tr);
}

function renderTable() {

    tableBody.innerHTML = "";

    for (const n in substances) {
        addRow(n, substances[n]);
    }
}

// ==============================
// Sync UI → Model
// ==============================

function sync() {

    const rows = tableBody.querySelectorAll("tr");

    const newData = {};

    rows.forEach(r => {

        const name = r.querySelector(".nameInput").value;
        if (!name) return;

        let v = parseFloat(r.querySelector(".valueInput").value) || 0;

        let hl = r.querySelector(".halfLifeInput").value;
        hl = (hl === "∞") ? Infinity : parseFloat(hl);

        let products = {};

        try {
            products = JSON.parse(r.querySelector(".productsInput").value || "{}");
        } catch {}

        newData[name] = {
            value: v,
            halfLife: hl,
            decayProducts: products
        };
    });

    // normalize
    const sum = Object.values(newData)
        .reduce((a, s) => a + s.value, 0) || 1;

    for (const k in newData) {
        newData[k].value /= sum;
    }

    substances = newData;
    simulator = new DecaySimulator(substances);
}

// ==============================
// Render Step
// ==============================

function step() {

    const v = simulator.simulate(currentTime);
    const values = simulator.names.map(n => v[n].value);

    // table
    resultBody.innerHTML = "";

    values.forEach((val, i) => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${simulator.names[i]}</td>
            <td>${val.toFixed(4)}</td>
            <td>${(val * 100).toFixed(2)}%</td>
        `;

        resultBody.appendChild(tr);
    });

    // chart (stable append only)
    chart.data.labels.push(currentTime.toFixed(1));

    if (chart.data.datasets.length === 0) {
        chart.data.datasets = simulator.names.map(n => ({
            label: n,
            data: []
        }));
    }

    simulator.names.forEach((n, i) => {
        chart.data.datasets[i].data.push(values[i]);
    });

    chart.update();

    timeLabel.textContent = currentTime.toFixed(2);
    slider.value = currentTime;
}

// ==============================
// Loop
// ==============================

function loop() {

    if (running) {
        currentTime += 0.1 * speed;
        step();
    }

    requestAnimationFrame(loop);
}

// ==============================
// Events
// ==============================

playButton.onclick = () => running = true;
pauseButton.onclick = () => running = false;

resetButton.onclick = () => {

    currentTime = 0;

    chart.data.labels = [];
    chart.data.datasets.forEach(d => d.data = []);
    chart.update();

    history = { values: {} };

    simulator = new DecaySimulator(substances);

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
    addRow("X", { value: 0, halfLife: 1, decayProducts: {} });
    sync();
    renderTable();
};

// ==============================
// Init
// ==============================

function init() {
    renderTable();
    sync();
    step();
    loop();
}

init();
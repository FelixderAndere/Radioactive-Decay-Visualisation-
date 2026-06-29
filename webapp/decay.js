"use strict";

/*
    Radioactive decay simulator
    Pure JavaScript version of the Python implementation.
    No external libraries required.
*/

// --------------------------------------------------
// Matrix utilities
// --------------------------------------------------

function identity(n) {
    const m = [];
    for (let i = 0; i < n; i++) {
        m[i] = new Array(n).fill(0);
        m[i][i] = 1;
    }
    return m;
}

function zeros(rows, cols) {
    return Array.from({ length: rows }, () => new Array(cols).fill(0));
}

function cloneMatrix(A) {
    return A.map(r => [...r]);
}

function matrixAdd(A, B) {
    const rows = A.length;
    const cols = A[0].length;
    const C = zeros(rows, cols);

    for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++)
            C[i][j] = A[i][j] + B[i][j];

    return C;
}

function matrixScale(A, s) {
    return A.map(r => r.map(v => v * s));
}

function matrixMultiply(A, B) {
    const rows = A.length;
    const cols = B[0].length;
    const inner = B.length;

    const C = zeros(rows, cols);

    for (let i = 0; i < rows; i++) {
        for (let k = 0; k < inner; k++) {
            const aik = A[i][k];
            if (aik === 0) continue;

            for (let j = 0; j < cols; j++) {
                C[i][j] += aik * B[k][j];
            }
        }
    }

    return C;
}

function matrixVectorMultiply(A, v) {
    const result = new Array(A.length).fill(0);

    for (let i = 0; i < A.length; i++) {
        let sum = 0;
        for (let j = 0; j < v.length; j++)
            sum += A[i][j] * v[j];
        result[i] = sum;
    }

    return result;
}

function matrixNormInf(A) {
    let max = 0;

    for (const row of A) {
        let s = 0;
        for (const v of row)
            s += Math.abs(v);
        if (s > max)
            max = s;
    }

    return max;
}

// --------------------------------------------------
// Matrix exponential (Scaling & Squaring)
// --------------------------------------------------

function expm(A) {

    const n = A.length;

    const norm = matrixNormInf(A);

    const s = Math.max(0, Math.ceil(Math.log2(norm || 1)));

    let X = matrixScale(A, 1 / Math.pow(2, s));

    let result = identity(n);
    let term = identity(n);

    // Taylor expansion
    for (let k = 1; k <= 40; k++) {

        term = matrixMultiply(term, X);
        term = matrixScale(term, 1 / k);

        result = matrixAdd(result, term);
    }

    // Squaring
    for (let i = 0; i < s; i++)
        result = matrixMultiply(result, result);

    return result;
}

// --------------------------------------------------
// Decay Simulator
// --------------------------------------------------

class DecaySimulator {

    constructor(substances) {
        this.substances = structuredClone(substances);

        const {
            names,
            idx,
            values,
            A
        } = this.decayMatrix(this.substances);

        this.names = names;
        this.idx = idx;
        this.values = values;
        this.A = A;
    }

    decayMatrix(substances) {

        const names = Object.keys(substances);

        const idx = {};

        names.forEach((n, i) => idx[n] = i);

        const values = names.map(n => substances[n].value);

        const total = values.reduce((a, b) => a + b, 0);

        if (Math.abs(total - 1) > 1e-10)
            throw new Error("Initial values must sum to 1.0");

        for (const substance of Object.values(substances)) {

            if (substance["half life"] < 0)
                throw new Error("Half-life must be non-negative");

            let sum = 0;

            for (const p of Object.values(substance["decay products"])) {

                if (p < 0 || p > 1)
                    throw new Error("Decay portions must be between 0 and 1");

                sum += p;
            }

            if (sum > 1 + 1e-10)
                throw new Error("Decay product portions exceed 1");
        }

        const n = names.length;

        const A = zeros(n, n);

        for (const [name, data] of Object.entries(substances)) {

            const j = idx[name];

            const T = data["half life"];

            const lambda = (T === Infinity)
                ? 0
                : Math.log(2) / T;

            A[j][j] = -lambda;

            for (const [product, portion] of Object.entries(data["decay products"])) {

                const i = idx[product];

                A[i][j] += lambda * portion;
            }
        }

        return {
            names,
            idx,
            values,
            A
        };
    }

    simulate(years) {

        const scaled = matrixScale(this.A, years);

        const transition = expm(scaled);

        this.values = matrixVectorMultiply(
            transition,
            this.values
        );

        const result = {};

        this.names.forEach((name, i) => {
            result[name] = Number(this.values[i].toFixed(2));
        });

        return result;
    }
}

// --------------------------------------------------
// CLI Visualization (Browser Console)
// --------------------------------------------------

class ConsoleVisualization {

    constructor(substances) {

        this.substances = structuredClone(substances);

        this.simulator = new DecaySimulator(this.substances);
    }

    run(iterations, dt = 1) {

        console.clear();

        for (let i = 0; i < iterations; i++) {

            const values = this.simulator.simulate(dt);

            for (const name of Object.keys(values))
                this.substances[name].value = values[name];

            this.draw(i + 1, iterations);
        }
    }

    draw(iteration, totalIterations) {

        console.log(
            `Iteration ${iteration}/${totalIterations}\n`
        );

        let total = 0;

        for (const s of Object.values(this.substances))
            total += s.value;

        for (const [name, data] of Object.entries(this.substances)) {

            const frac = total === 0
                ? 0
                : data.value / total;

            const width = 40;

            const filled = Math.round(frac * width);

            const bar =
                "█".repeat(filled) +
                "-".repeat(width - filled);

            console.log(
                `${name.padStart(3)} | ${bar} | ${(frac * 100).toFixed(2)}% | t½ = ${data["half life"] === Infinity ? "∞" : data["half life"]}`
            );
        }

        console.log("Total:", total.toFixed(6));
        console.log("--------------------------------------------");
    }
}

// --------------------------------------------------
// Example
// --------------------------------------------------

const substances = {

    A: {
        value: 1,
        "half life": 5,
        "decay products": {
            B: 0.7,
            C: 0.3
        }
    },

    B: {
        value: 0,
        "half life": 3,
        "decay products": {
            C: 1
        }
    },

    C: {
        value: 0,
        "half life": 8,
        "decay products": {
            D: 1
        }
    },

    D: {
        value: 0,
        "half life": 1,
        "decay products": {
            E: 1
        }
    },

    E: {
        value: 0,
        "half life": Infinity,
        "decay products": {}
    }

};

// Run once
const simulator = new DecaySimulator(substances);

console.log("After 5 years:");
console.log(simulator.simulate(5));

// Continuous simulation
console.log("\n===== Continuous Simulation =====\n");

const cli = new ConsoleVisualization(substances);

cli.run(20, 0.5);
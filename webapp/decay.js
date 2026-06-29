"use strict";

/**
 * ============================================================================
 * DOCUMENTATION & FRONTEND API
 * ============================================================================
 * * Diese Bibliothek simuliert den radioaktiven Zerfall von Substanzen über ein
 * mathematisches System linearer Differentialgleichungen (Matrixexponential).
 * * Verwendung im Frontend:
 * * 1. Instanziierung:
 * const simulator = new DecaySimulator(initialSubstances);
 * - 'initialSubstances' ist ein Objekt, das die Startwerte (Summe = 1.0),
 * Halbwertszeiten und Zerfallsprodukte definiert (siehe Struktur unten).
 * * 2. Simulation eines absoluten Zeitpunkts (Empfohlen für UI-Animationen):
 * const result = simulator.getValuesAtTime(years);
 * - Berechnet die exakte Verteilung nach 'years' Jahren, basierend AUF DEN 
 * URSPRÜNGLICHEN Startwerten. Perfekt für einen Time-Slider oder eine 
 * kontinuierliche `requestAnimationFrame`-Schleife.
 * - Gibt ein Objekt zurück: { A: 0.45, B: 0.2, ... }
 * * 3. Schrittweise Simulation mit Zufall (Zustandsverändernd):
 * const result = simulator.simulate(dt);
 * - Jedes simulierte Atom zerfällt pro Zeitschritt mit der physikalischen
 * Wahrscheinlichkeit p = 1 - e^(-lambda * dt). Das Ergebnis schwankt dadurch
 * realistisch um die theoretische Kurve.
 * * 4. Deterministische Schritt-Simulation:
 * const result = simulator.simulateExpected(dt);
 * - Nutzt weiterhin das Matrixexponential und gibt den Erwartungswert zurück.
 * * 5. Zurücksetzen des Simulators:
 * simulator.reset();
 * - Setzt die internen Werte wieder auf die initialen Startwerte zurück.
 * ============================================================================
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

    constructor(substances, options = {}) {
        this.initialSubstances = structuredClone(substances);
        this.substances = structuredClone(substances);
        this.particleCount = options.particleCount ?? 800;
        this.random = options.random ?? Math.random;

        const { names, idx, values, A, decayInfo } = this.decayMatrix(this.substances);

        this.names = names;
        this.idx = idx;
        this.initialValues = [...values];
        this.values = values;
        this.A = A;
        this.decayInfo = decayInfo;
        this.initialCounts = this.valuesToCounts(this.initialValues, this.particleCount);
        this.counts = [...this.initialCounts];
    }

    reset() {
        this.values = [...this.initialValues];
        this.counts = [...this.initialCounts];
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
        const decayInfo = {};

        for (const [name, data] of Object.entries(substances)) {
            const j = idx[name];
            const T = data["half life"];
            const lambda = (T === Infinity) ? 0 : Math.log(2) / T;

            A[j][j] = -lambda;
            decayInfo[name] = {
                lambda,
                products: Object.entries(data["decay products"]).map(([product, portion]) => ({
                    product,
                    portion
                }))
            };

            for (const [product, portion] of Object.entries(data["decay products"])) {
                const i = idx[product];
                if (i === undefined)
                    throw new Error(`Unknown decay product: ${product}`);
                A[i][j] += lambda * portion;
            }
        }

        return { names, idx, values, A, decayInfo };
    }

    valuesToCounts(values, particleCount) {
        if (!Number.isInteger(particleCount) || particleCount <= 0)
            throw new Error("Particle count must be a positive integer");

        const counts = values.map(v => Math.floor(v * particleCount));
        let assigned = counts.reduce((a, b) => a + b, 0);
        const remainders = values
            .map((v, i) => ({ i, r: (v * particleCount) - counts[i] }))
            .sort((a, b) => b.r - a.r);

        for (let i = 0; assigned < particleCount; i++, assigned++) {
            counts[remainders[i % remainders.length].i]++;
        }

        return counts;
    }

    countsToValues(counts) {
        const total = counts.reduce((a, b) => a + b, 0) || 1;
        return counts.map(c => c / total);
    }

    chooseDecayProduct(products) {
        if (products.length === 0)
            return null;

        const totalPortion = products.reduce((sum, p) => sum + p.portion, 0);
        const roll = this.random();

        if (roll >= totalPortion)
            return null;

        let cumulative = 0;
        for (const product of products) {
            cumulative += product.portion;
            if (roll <= cumulative)
                return product.product;
        }

        return products[products.length - 1].product;
    }

    // Deterministischer Erwartungswert für glatte Kurven
    simulateExpected(years) {
        const scaled = matrixScale(this.A, years);
        const transition = expm(scaled);

        this.values = matrixVectorMultiply(transition, this.values);

        const result = {};
        this.names.forEach((name, i) => {
            result[name] = Math.max(0, this.values[i]); // Verhindert minimale negative Rundungsfehler
        });

        return result;
    }

    // Ändert den Zustand Schritt für Schritt mit realistischen Zufallsschwankungen
    simulate(years) {
        if (years < 0)
            throw new Error("Simulation step must be non-negative");

        const nextCounts = [...this.counts];

        this.names.forEach((name, sourceIndex) => {
            const { lambda, products } = this.decayInfo[name];
            if (lambda === 0 || this.counts[sourceIndex] === 0)
                return;

            const decayProbability = 1 - Math.exp(-lambda * years);
            const sourceCount = this.counts[sourceIndex];

            for (let atom = 0; atom < sourceCount; atom++) {
                if (this.random() >= decayProbability)
                    continue;

                const product = this.chooseDecayProduct(products);
                if (product === null)
                    continue;

                nextCounts[sourceIndex]--;
                nextCounts[this.idx[product]]++;
            }
        });

        this.counts = nextCounts;
        this.values = this.countsToValues(this.counts);

        const result = {};
        this.names.forEach((name, i) => {
            result[name] = this.values[i];
        });

        return result;
    }

    // Gibt Werte für einen absolutem Zeitpunkt zurück, OHNE die Basiswerte dauerhaft zu überschreiben
    getValuesAtTime(years) {
        const scaled = matrixScale(this.A, years);
        const transition = expm(scaled);
        const calculatedValues = matrixVectorMultiply(transition, this.initialValues);

        const result = {};
        this.names.forEach((name, i) => {
            result[name] = Math.max(0, calculatedValues[i]);
        });
        return result;
    }
}

// Global verfügbar machen für das Frontend ohne Bundler
if (typeof window !== 'undefined') {
    window.DecaySimulator = DecaySimulator;
}

"use strict";

// --------------------------------------------------
// Decay Simulator (clean + compact)
// --------------------------------------------------

export class DecaySimulator {

    constructor(substances, options = {}) {

        this.particleCount = options.particleCount ?? 800;
        this.random = options.random ?? Math.random;
        this.timestep = options.timestep ?? 0.05

        const names = Object.keys(substances);
        this.names = names;

        this.idx = Object.fromEntries(names.map((n, i) => [n, i]));

        this.initialValues = names.map(n => substances[n].value);

        this.decayInfo = Object.fromEntries(
            names.map(n => {
                const d = substances[n];
                return [n, {
                    lambda: d["half life"] === "∞" ? 0 : Math.log(2) / d["half life"],
                    products: Object.entries(d["decay products"])
                        .map(([p, v]) => ({ p, v }))
                }];
            })
        );

        this.reset();
    }

    // --------------------------------------------------
    // Core physics
    // --------------------------------------------------

    simulateStep(values, timestep, stochastic = false) {

        const next = [...values];

        for (let i = 0; i < this.names.length; i++) {

            const { lambda, products } = this.decayInfo[this.names[i]];
            if (!lambda) continue;

            const amount = values[i];
            if (!amount) continue;

            const p = 1 - Math.exp(-lambda * timestep);

            let decayed = stochastic
                ? this._stochastic(amount, p)
                : amount * p;

            next[i] -= decayed;

            for (const { p: name, v: portion } of products) {
                next[this.idx[name]] += decayed * portion;
            }
        }

        return next;
    }

    computeCurve(maxTime, steps, stochastic = false) {

        let v = [...this.initialValues];

        const timestep = maxTime / steps;

        const out = [];

        for (let i = 0; i <= steps; i++) {

            out[i] = [...v];

            if (i < steps) {
                v = this.simulateStep(v, timestep, stochastic);
            }
        }

        return out;
    }

    _stochastic(amount, p) {

        const n = Math.round(amount * this.particleCount);
        let c = 0;

        for (let i = 0; i < n; i++) {
            if (this.random() < p) c++;
        }

        return c / this.particleCount;
    }

    // --------------------------------------------------
    // API
    // --------------------------------------------------

    simulate(timestep) {
        this.values = this.simulateStep(this.values, timestep, true);
        return this._toObject(this.values);
    }

    simulateExpected(timestep) {
        this.values = this.simulateStep(this.values, timestep, false);
        return this._toObject(this.values);
    }

    getValuesAtTime(time) {

        let v = [...this.initialValues];

        const timestep = this.timestep;

        for (let t = 0; t < time; t += timestep) {
            v = this.simulateStep(v, Math.min(timestep, time - t), false);
        }

        return this._toObject(v);
    }

    reset() {
        this.values = [...this.initialValues];
    }

    // --------------------------------------------------
    // helper
    // --------------------------------------------------

    _toObject(values) {

        const out = {};
        for (let i = 0; i < this.names.length; i++) {
            out[this.names[i]] = values[i];
        }
        return out;
    }
}

// --------------------------------------------------

if (typeof window !== "undefined") {
    window.DecaySimulator = DecaySimulator;
}

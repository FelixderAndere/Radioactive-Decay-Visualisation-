"use strict";

const ExcelJS = require("exceljs");
const { DecaySimulator } = require("../webapp/decay.js");
const { SUBSTANCE_PRESETS } = require("../webapp/presets.js");

const PRESET_KEY = "demo";

const RUNS = 100;
const PARAM_SCALES = [0.5, 1, 2, 4];

console.log("🚀 Advanced decay analysis starting...");

// --------------------------------------------------
// Preset cloning with modified half-lives
// --------------------------------------------------

function scalePreset(preset, scale) {

    const substances = JSON.parse(JSON.stringify(preset.substances));

    for (const key in substances) {

        const s = substances[key];

        if (s["half life"] !== "∞") {
            s["half life"] *= scale;
        }
    }

    return {
        ...preset,
        substances
    };
}

// --------------------------------------------------

function runSimulation(preset) {

    const sim = new DecaySimulator(preset.substances, {
        timestep: preset.timeStep
    });

    const result = sim.computeCurve(
        preset.maxTime,
        200,
        true
    );

    return result[result.length - 1];
}

// --------------------------------------------------

async function exportAnalysis(preset) {

    const workbook = new ExcelJS.Workbook();

    const substances = Object.keys(preset.substances);

    const overviewSheet = workbook.addWorksheet("overview");
    overviewSheet.addRow([
        "scale",
        "substance",
        "mean",
        "std",
        "min",
        "max"
    ]);

    // --------------------------------------------------
    // LOOP PARAMETER SCALES
    // --------------------------------------------------

    for (const scale of PARAM_SCALES) {

        console.log(`\n📊 Processing scale: ${scale}`);

        const scaledPreset = scalePreset(preset, scale);

        const results = [];

        for (let i = 0; i < RUNS; i++) {

            const final = runSimulation(scaledPreset);

            results.push(final);

            if (i % 20 === 0) {
                console.log(`   ↳ run ${i}/${RUNS}`);
            }
        }

        // --------------------------------------------------
        // Statistik berechnen
        // --------------------------------------------------

        for (const substance of substances) {

            const values = results.map(r => r[substance]);

            const mean = values.reduce((a, b) => a + b, 0) / values.length;

            const std = Math.sqrt(
                values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
            );

            const min = Math.min(...values);
            const max = Math.max(...values);

            overviewSheet.addRow([
                scale,
                substance,
                mean,
                std,
                min,
                max
            ]);
        }

        console.log(`✅ scale ${scale} done`);
    }

    const filename = `decay_analysis_${PRESET_KEY}.xlsx`;
    await workbook.xlsx.writeFile(filename);

    console.log("\n🎉 Analysis complete:", filename);
}

// --------------------------------------------------

(async () => {
    const preset = SUBSTANCE_PRESETS[PRESET_KEY];

    if (!preset) throw new Error("Preset not found");

    await exportAnalysis(preset);
})();
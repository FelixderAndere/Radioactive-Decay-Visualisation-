"use strict";

const ExcelJS = require("exceljs");

const { DecaySimulator } = require("../webapp/decay.js");
const { SUBSTANCE_PRESETS } = require("../webapp/presets.js");

const PRESET_KEY = "demo";
const RUNS = 100;

console.log("🚀 Starting decay Excel export...");
console.log("📦 Preset:", PRESET_KEY);
console.log("🔁 Runs:", RUNS);

// --------------------------------------------------

function runSimulation(preset, runIndex) {
    console.log(`⚙️ Running simulation ${runIndex + 1}/${RUNS}`);

    const sim = new DecaySimulator(preset.substances, {
        timestep: preset.timeStep
    });

    const result = sim.computeCurve(
        preset.maxTime,
        200,
        true
    );

    const finalState = result[result.length - 1];

    console.log("   ↳ final state:", finalState);

    return finalState;
}

// --------------------------------------------------

async function exportToExcel(preset) {
    const workbook = new ExcelJS.Workbook();

    const substanceNames = Object.keys(preset.substances);

    console.log("📊 Substances:", substanceNames.join(", "));

    // ----------------------------
    // Sheets erstellen
    // ----------------------------
    const sheets = {};

    for (const name of substanceNames) {
        const sheet = workbook.addWorksheet(name);

        sheet.columns = [
            { header: "Run", key: "run", width: 10 },
            ...substanceNames.map(s => ({
                header: s,
                key: s,
                width: 18
            }))
        ];

        sheets[name] = sheet;
    }

    // optional: Summary Sheet
    const summary = workbook.addWorksheet("summary");
    summary.addRow(["Run", ...substanceNames]);

    // ----------------------------
    // Simulation Runs
    // ----------------------------
    for (let run = 0; run < RUNS; run++) {

        const finalState = runSimulation(preset, run);

        // safety log
        if (run === 0) {
            console.log("🔬 Example output:", finalState);
        }

        const row = {
            run: run + 1,
            ...finalState
        };

        for (const name of substanceNames) {
            sheets[name].addRow(row);
        }

        summary.addRow([run + 1, ...substanceNames.map(s => finalState[s])]);

        if (run % 10 === 0) {
            console.log(`📈 Progress: ${run}/${RUNS}`);
        }
    }

    const filename = `decay_${PRESET_KEY}.xlsx`;
    await workbook.xlsx.writeFile(filename);

    console.log("✅ Export complete:", filename);
}

// --------------------------------------------------

(async () => {
    const preset = SUBSTANCE_PRESETS[PRESET_KEY];

    if (!preset) {
        throw new Error("Preset not found: " + PRESET_KEY);
    }

    await exportToExcel(preset);
})();
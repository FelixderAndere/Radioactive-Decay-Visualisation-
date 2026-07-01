"use strict";

const ExcelJS = require("exceljs");

// deine Dateien
const { DecaySimulator } = require("../webapp/decay.js");
const { SUBSTANCE_PRESETS } = require("../webapp/presets.js");

const PRESET_KEY = "demo"; // change later easily
const RUNS = 100;


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
// Excel Export
// --------------------------------------------------

async function exportToExcel(preset) {
    const workbook = new ExcelJS.Workbook();

    const substanceNames = Object.keys(preset.substances);

    // pro Substanz ein Sheet
    const sheets = {};
    for (const name of substanceNames) {
        const sheet = workbook.addWorksheet(name);
        sheet.addRow(["Run", ...substanceNames]);
        sheets[name] = sheet;
    }

    // 100 Runs
    for (let run = 0; run < RUNS; run++) {

        const finalState = runSimulation(preset);

        for (const sheetName of substanceNames) {
            const row = [
                run + 1,
                ...substanceNames.map(s => finalState[s])
            ];
            sheets[sheetName].addRow(row);
        }
    }

    const filename = `decay_${PRESET_KEY}.xlsx`;
    await workbook.xlsx.writeFile(filename);

    console.log(`✅ Excel export ready: ${filename}`);
}

// --------------------------------------------------
// Start
// --------------------------------------------------

(async () => {
    const preset = SUBSTANCE_PRESETS[PRESET_KEY];

    if (!preset) {
        throw new Error("Preset nicht gefunden: " + PRESET_KEY);
    }

    await exportToExcel(preset);
})();
import * as XLSX from "xlsx";
import { DecaySimulator } from "../webapp/decay.js";
import { SUBSTANCE_PRESETS } from "../webapp/presets.js";

export function benchmarkStepSizes(outputFile = "decay_test.xlsx") {

    const preset = SUBSTANCE_PRESETS.demo;

    const maxTime = 30;
    const repetitions = 100;

    const stepSizes = [
        5,
        2,
        1,
        0.5,
        0.25,
        0.1,
        0.05,
        0.01
    ];

    const workbook = XLSX.utils.book_new();

    for (const dt of stepSizes) {

        const rows = [];

        rows.push([
            "Run",
            ...Object.keys(preset.substances)
        ]);

        for (let run = 1; run <= repetitions; run++) {

            const simulator = new DecaySimulator(
                preset.substances,
                { particleCount: 800 }
            );

            let t = 0;

            while (t < maxTime) {
                simulator.simulate(Math.min(dt, maxTime - t));
                t += dt;
            }

            const values = simulator.values;

            rows.push([
                run,
                ...values
            ]);
        }

        const sheet = XLSX.utils.aoa_to_sheet(rows);

        XLSX.utils.book_append_sheet(
            workbook,
            sheet,
            `dt=${dt}`
        );
    }

    XLSX.writeFile(workbook, outputFile);

    console.log(`Excel geschrieben: ${outputFile}`);
}

benchmarkStepSizes();
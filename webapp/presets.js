// Real isotope data adapted from reinpk/radioactive (MIT).
// Copyright (C) 2013 Peter Reinhardt.
// Its isotope dataset was compiled from decay-chain and atomic-mass references in 2013.
const SUBSTANCE_PRESETS = {
    demo: {
        label: "Current demo",
        description: "The original A to E demonstration preset.",
        maxTime: 100,
        maxTimeSlider_max: 0,
        maxTimeSlider_min: 200,
        maxTimeSlider_step: 0.25,
        timeStep: 1,
        timeStepSlider_max: 3,
        timeStepSlider_min: 0.01,
        timeStepSlider_step: 0.01,
        substances: {
            A: { value: 1.0, "half life": 5, "decay products": { B: 0.7, C: 0.3 } },
            B: { value: 0.0, "half life": 3, "decay products": { C: 1.0 } },
            C: { value: 0.0, "half life": 8, "decay products": { D: 1.0 } },
            D: { value: 0.0, "half life": 1, "decay products": { E: 1.0 } },
            E: { value: 0.0, "half life": "∞", "decay products": {} }
        }
    },
    u238: {
        label: "Uranium-238 series",
        description: "Natural uranium/radium chain ending in stable Pb-206.",
        maxTime: 40000000000,
        maxTimeSlider_max: 50000000000,
        maxTimeSlider_min: 30000000000,
        maxTimeSlider_step: 0.25,
        timeStep: 50000000,
        timeStepSlider_max: 1000000000,
        timeStepSlider_min: 10000000,
        timeStepSlider_step: 1000000,
        substances: {
            "U-238": { value: 1, "half life": 4468000000, "decay products": { "Th-234": 1 } },
            "Th-234": { value: 0, "half life": 0.0659822039699, "decay products": { "Pa-234m": 1 } },
            "Pa-234m": { value: 0, "half life": 0.00000220549091186, "decay products": { "U-234": 0.9984, "Pa-234": 0.0016 } },
            "Pa-234": { value: 0, "half life": 0.000764316678074, "decay products": { "U-234": 1 } },
            "U-234": { value: 0, "half life": 245500, "decay products": { "Th-230": 1 } },
            "Th-230": { value: 0, "half life": 75380, "decay products": { "Ra-226": 1 } },
            "Ra-226": { value: 0, "half life": 1602, "decay products": { "Rn-222": 1 } },
            "Rn-222": { value: 0, "half life": 0.0104681724846, "decay products": { "Po-218": 1 } },
            "Po-218": { value: 0, "half life": 0.00000589398433341, "decay products": { "Pb-214": 0.9998, "At-218": 0.0002 } },
            "At-218": { value: 0, "half life": 4.7532131721e-8, "decay products": { "Bi-214": 0.999, "Rn-218": 0.001 } },
            "Rn-218": { value: 0, "half life": 1.10908307349e-9, "decay products": { "Po-214": 1 } },
            "Pb-214": { value: 0, "half life": 0.000050954445205, "decay products": { "Bi-214": 1 } },
            "Bi-214": { value: 0, "half life": 0.00003783557685, "decay products": { "Po-214": 0.9998, "Tl-210": 0.0002 } },
            "Tl-210": { value: 0, "half life": 0.00000247167084949, "decay products": { "Pb-210": 1 } },
            "Po-214": { value: 0, "half life": 5.20635282784e-12, "decay products": { "Pb-210": 1 } },
            "Pb-210": { value: 0, "half life": 22.3, "decay products": { "Bi-210": 1 } },
            "Bi-210": { value: 0, "half life": 0.0137248459959, "decay products": { "Po-210": 0.9999987, "Tl-206": 0.0000013 } },
            "Tl-206": { value: 0, "half life": 0.00000798349684387, "decay products": { "Pb-206": 1 } },
            "Po-210": { value: 0, "half life": 0.37885284052, "decay products": { "Pb-206": 1 } },
            "Pb-206": { value: 0, "half life": "∞", "decay products": {} }
        }
    },
    u235: {
        label: "Uranium-235 / actinium series",
        description: "Actinium decay series ending in stable Pb-207.",
        maxTime: 2000000000,
        maxTimeSlider_max: 4000000000,
        maxTimeSlider_min: 1000000000,
        maxTimeSlider_step: 1000000,
        timeStep: 5000000,
        timeStepSlider_max: 10000000,
        timeStepSlider_min: 1000000,
        timeStepSlider_step: 1000,
        substances: {
            "U-235": { value: 1, "half life": 704000000, "decay products": { "Th-231": 1 } },
            "Th-231": { value: 0, "half life": 0.00291124800365, "decay products": { "Pa-231": 1 } },
            "Pa-231": { value: 0, "half life": 32760, "decay products": { "Ac-227": 1 } },
            "Ac-227": { value: 0, "half life": 21.772, "decay products": { "Th-227": 0.9862, "Fr-223": 0.0138 } },
            "Fr-223": { value: 0, "half life": 0.0000418282759145, "decay products": { "Ra-223": 0.99994, "At-219": 0.00006 } },
            "At-219": { value: 0, "half life": 0.00000177453291759, "decay products": { "Bi-215": 0.97, "Rn-219": 0.03 } },
            "Bi-215": { value: 0, "half life": 0.0000144497680432, "decay products": { "Po-215": 1 } },
            "Th-227": { value: 0, "half life": 0.0511430527036, "decay products": { "Ra-223": 1 } },
            "Ra-223": { value: 0, "half life": 0.0312936344969, "decay products": { "Rn-219": 1 } },
            "Rn-219": { value: 0, "half life": 1.25484827744e-7, "decay products": { "Po-215": 1 } },
            "Po-215": { value: 0, "half life": 5.64364843968e-11, "decay products": { "Pb-211": 0.9999977, "At-215": 0.0000023 } },
            "At-215": { value: 0, "half life": 3.1688087814e-12, "decay products": { "Bi-211": 1 } },
            "Pb-211": { value: 0, "half life": 0.0000686363982052, "decay products": { "Bi-211": 1 } },
            "Bi-211": { value: 0, "half life": 0.00000406875047532, "decay products": { "Tl-207": 0.99724, "Po-211": 0.00276 } },
            "Po-211": { value: 0, "half life": 1.6351053312e-8, "decay products": { "Pb-207": 1 } },
            "Tl-207": { value: 0, "half life": 0.00000906913073238, "decay products": { "Pb-207": 1 } },
            "Pb-207": { value: 0, "half life": "∞", "decay products": {} }
        }
    },
    th232: {
        label: "Thorium-232 series",
        description: "Thorium series ending in stable Pb-208.",
        maxTime: 100000000000,
        maxTimeSlider_max: 100000000000,
        maxTimeSlider_min: 50000000000, 
        maxTimeSlider_step: 1000000,       
        timeStep: 100000000,
        timeStepSlider_max: 500000000,
        timeStepSlider_min: 8000000,
        timeStepSlider_step: 100000,
        substances: {
            "Th-232": { value: 1, "half life": 14050000000, "decay products": { "Ra-228": 1 } },
            "Ra-228": { value: 0, "half life": 5.75, "decay products": { "Ac-228": 1 } },
            "Ac-228": { value: 0, "half life": 0.000712981975816, "decay products": { "Th-228": 1 } },
            "Th-228": { value: 0, "half life": 1.9116, "decay products": { "Ra-224": 1 } },
            "Ra-224": { value: 0, "half life": 0.00994360027379, "decay products": { "Rn-220": 1 } },
            "Rn-220": { value: 0, "half life": 0.00000176185768246, "decay products": { "Po-216": 1 } },
            "Po-216": { value: 0, "half life": 4.59477273303e-9, "decay products": { "Pb-212": 1 } },
            "Pb-212": { value: 0, "half life": 0.00121378051563, "decay products": { "Bi-212": 1 } },
            "Bi-212": { value: 0, "half life": 0.000115122823028, "decay products": { "Po-212": 0.6406, "Tl-208": 0.3594 } },
            "Tl-208": { value: 0, "half life": 0.00000580462392577, "decay products": { "Pb-208": 1 } },
            "Po-212": { value: 0, "half life": 9.47473825639e-15, "decay products": { "Pb-208": 1 } },
            "Pb-208": { value: 0, "half life": "∞", "decay products": {} }
        }
    },
    y99: {
        label: "Yttrium-99 short chain",
        description: "Short-lived chain from the radioactive.js README example.",
        maxTime: 0.06,
        maxTimeSlider_max: 0.1,
        maxTimeSlider_min: 0.01,
        maxTimeSlider_step: 0.01,   
        timeStep: 0.000001,
        timeStepSlider_max: 0.00005,
        timeStepSlider_min: 0.0000001,
        timeStepSlider_step: 0.0000001,
        substances: {
            "Y-99": { value: 1, "half life": 4.65814890866e-8, "decay products": { "Zr-99": 1 } },
            "Zr-99": { value: 0, "half life": 6.65449844095e-8, "decay products": { "Nb-99m": 1 } },
            "Nb-99m": { value: 0, "half life": 0.00000494334169899, "decay products": { "Nb-99": 1 } },
            "Nb-99": { value: 0, "half life": 4.7532131721e-7, "decay products": { "Mo-99m2": 1 } },
            "Mo-99m2": { value: 0, "half life": 2.40829467387e-11, "decay products": { "Mo-99m1": 1 } },
            "Mo-99m1": { value: 0, "half life": 4.91165361117e-10, "decay products": { "Mo-99": 1 } },
            "Mo-99": { value: 0, "half life": 0.00752607802875, "decay products": { "Tc-99m": 1 } },
            "Tc-99m": { value: 0, "half life": 0.000685124344057, "decay products": { "Tc-99": 1 } },
            "Tc-99": { value: 0, "half life": 211000, "decay products": { "Ru-99": 1 } },
            "Ru-99": { value: 0, "half life": "∞", "decay products": {} }
        }
    }
};

if (typeof window !== "undefined") {
    window.SUBSTANCE_PRESETS = SUBSTANCE_PRESETS;
}

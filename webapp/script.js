const PRESET_SOURCE = window.SUBSTANCE_PRESETS || {};
const DEFAULT_PRESET_ID = PRESET_SOURCE.demo ? "demo" : Object.keys(PRESET_SOURCE)[0];

function cloneSubstances(substances) {
    return JSON.parse(JSON.stringify(substances));
}

let currentSubstancesData = cloneSubstances(PRESET_SOURCE[DEFAULT_PRESET_ID].substances);
let currentPresetId = DEFAULT_PRESET_ID;

const colors = {
    A: '#ef4444',
    B: '#f97316',
    C: '#eab308',
    D: '#06b6d4',
    E: '#10b981'
};

const generatedColorPalette = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e',
    '#84cc16', '#f59e0b', '#0ea5e9', '#a855f7', '#10b981',
    '#f97316', '#38bdf8', '#fb7185', '#c084fc', '#2dd4bf'
];

function getColorForSubstance(name) {
    if (!colors[name]) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        colors[name] = generatedColorPalette[Math.abs(hash) % generatedColorPalette.length];
    }

    return colors[name];
}

function ensureDatasetColors(dataset) {
    Object.keys(dataset).forEach(getColorForSubstance);
}

window.getColorForSubstance = getColorForSubstance;

const maxTimeSlider = document.getElementById('max-time-input'); 
const yearsMaxSpan = document.getElementById('years-max');
const speedSlider = document.getElementById('speed-slider');
const years_step = document.getElementById('years-step')

let maxTime = parseFloat(maxTimeSlider.value) || 100;
maxTimeSlider.addEventListener('input', function() {
    maxTime = parseFloat(this.value);
    yearsMaxSpan.innerText = maxTime
}); 
maxTimeSlider.addEventListener('change', function() {
    maxTime = parseFloat(this.value);
    yearsMaxSpan.innerText = maxTime
    drawChart(); 
}); 
let time_step = parseFloat(speedSlider.value) || 1;
speedSlider.addEventListener('input', function() {
    time_step = parseFloat(this.value);
    years_step.innerText = time_step
}); 
speedSlider.addEventListener('change', function() {
    time_step = parseFloat(this.value);
    years_step.innerText = time_step
    drawChart(); 
}); 


function applyPresetSettings(preset) {
    if (!preset) return;

    if (typeof preset.maxTime === "number") {
        maxTimeSlider.value = preset.maxTime;
        maxTimeSlider.min = preset.maxTimeSlider_min;
        maxTimeSlider.max = preset.maxTimeSlider_max;
        maxTimeSlider.step = preset.maxTimeSlider_step;
        yearsMaxSpan.innerText = preset.maxTime;
        maxTime = preset.maxTime;
    }

    if (typeof preset.timeStep === "number") {
        speedSlider.value = preset.timeStep;
        speedSlider.min = preset.timeStepSlider_min;
        speedSlider.max = preset.timeStepSlider_max;
        speedSlider.step = preset.timeStepSlider_step;
        years_step.innerText = preset.timeStep;
        time_step = preset.timeStep;
    }
}

window.updateSimulationDataset = function(newDataset, settings = {}) {
    isPlaying = false;
    currentTime = 0;
    btnPlay.innerText = "Start";
    btnPlay.classList.add('primary');

    currentSubstancesData = cloneSubstances(newDataset);
    ensureDatasetColors(currentSubstancesData);

    if (settings.presetId) {
        currentPresetId = settings.presetId;
    }

    if (settings.applyPresetSettings) {
        applyPresetSettings(PRESET_SOURCE[currentPresetId]);
    }
    
    simulator = new DecaySimulator(currentSubstancesData, options = { particleCount: particleCount, timestep: time_step });
    
    initStatsUI();
    initParticles();
    
    const currentValues = simulator.getValuesAtTime(0);
    latestValues = currentValues;
    resetRandomHistory(currentValues);
    updateStatsUI(currentValues);
    drawParticles(currentValues);
    drawChart();
};


// update particles
let particleCount = parseInt(document.getElementById('count-slider').value) || 100;
document.getElementById('count-slider').addEventListener('input', function () {
    particleCount = parseInt(this.value);

    document.getElementById('particleCount-label').innerText = particleCount;

    simulator = new DecaySimulator(currentSubstancesData, {
        particleCount,
        timestep: time_step
    });

    currentTime = 0;
    latestValues = simulator.getValuesAtTime(0);

    initParticles();
    resetRandomHistory(latestValues);
    updateStatsUI(latestValues);
    drawParticles(latestValues);
    drawChart();
});


let simulator = new DecaySimulator(currentSubstancesData, options = { particleCount: particleCount, timestep: time_step });
let currentTime = 0;
let isPlaying = false;
let animationFrameId = null;
let lastTimestamp = 0;
let latestValues = null;
let graphMode = 'theoretical';
let randomHistory = [];
let simulationAccumulator = 0;



// UI elements
const btnPlay = document.getElementById('btn-play');
const btnReset = document.getElementById('btn-reset');
const btnEdit = document.getElementById('btn-edit');
const yearsVal = document.getElementById('years-val');
const statsContainer = document.getElementById('stats-container');
const presetSelect = document.getElementById('preset-select');
const presetDescription = document.getElementById('preset-description');

// Canvas Setup
const particleCanvas = document.getElementById('particle-canvas');
const pCtx = particleCanvas.getContext('2d');
const chartPlot = document.getElementById('chart-plot');
const graphTheoreticalBtn = document.getElementById('graph-theoretical');
const graphRandomBtn = document.getElementById('graph-random');

function initPresetUI() {
    presetSelect.innerHTML = "";

    Object.entries(PRESET_SOURCE).forEach(([id, preset]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = preset.label;
        presetSelect.appendChild(option);
    });

    presetSelect.value = currentPresetId;
    presetDescription.innerText = PRESET_SOURCE[currentPresetId]?.description || "";
}

presetSelect.addEventListener("change", () => {
    const presetId = presetSelect.value;
    const preset = PRESET_SOURCE[presetId];
    if (!preset) return;

    currentPresetId = presetId;
    presetDescription.innerText = preset.description || "";
    updateSimulationDataset(preset.substances, {
        presetId,
        applyPresetSettings: true
    });
});

const particles = [];
const numParticles = particleCount; 

function initParticles() {
    particles.length = 0;
    for(let i=0; i<particleCount; i++) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            randValue: Math.random() 
        });
    }
}



function initStatsUI() {
    statsContainer.innerHTML = '';
    Object.keys(currentSubstancesData).forEach(key => {
        const hl = currentSubstancesData[key]["half life"];
        const hlText = hl === "∞" ? "∞" : `${hl} j`;
        const dp = currentSubstancesData[key]["decay products"];
        // Convert fraction value back to clean legible percentage layout representation
        const dptext = Object.entries(dp).map(([k, v]) => `${k}: ${(v * 100).toFixed(2).replace(/\.?0+$/, "")}%`).join(", ");
        const color = getColorForSubstance(key);
        
        const html = `
            <div class="stat-item" id="stat-${key}">
                <div class="stat-header">
                    <span style="color:${color}">${key} <small style="color:var(--text-muted)">(t½: ${hlText}) (Decay: ${dptext || "stable"})</small></span>
                    <span id="pct-${key}">0.0%</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" id="bar-${key}" style="background-color: ${color}"></div>
                </div>
            </div>
        `;
        statsContainer.insertAdjacentHTML('beforeend', html);
    });
}

function updateStatsUI(currentValues) {
    Object.entries(currentValues).forEach(([key, val]) => {
        const pct = (val * 100).toFixed(1);
        document.getElementById(`pct-${key}`).innerText = `${pct}%`;
        document.getElementById(`bar-${key}`).style.width = `${pct}%`;
    });
    yearsVal.innerText = currentTime.toFixed(2);
}

function drawParticles(currentValues) {
    pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    
    const keys = Object.keys(currentValues);
    const thresholds = [];
    let cumulative = 0;
    
    keys.forEach(key => {
        cumulative += currentValues[key];
        thresholds.push({ key, limit: cumulative });
    });

    particles.forEach(p => {
        let type = keys[keys.length - 1]; 
        for(let t of thresholds) {
            if(p.randValue <= t.limit) {
                type = t.key;
                break;
            }
        }

        pCtx.beginPath();
        pCtx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        pCtx.fillStyle = getColorForSubstance(type);
        pCtx.fill();
    });
}

function resetRandomHistory(initialValues) {
    randomHistory = [{ time: 0, values: { ...initialValues } }];
}

function addRandomHistoryPoint(time, values) {
    const lastPoint = randomHistory[randomHistory.length - 1];
    

    randomHistory.push({ time, values: { ...values } });
}

function setGraphMode(mode) {
    graphMode = mode;
    graphTheoreticalBtn.classList.toggle('active', mode === 'theoretical');
    graphRandomBtn.classList.toggle('active', mode === 'random');
    drawChart();
}

function drawChart() {

    if (typeof Plotly === 'undefined') return;

    const keys = Object.keys(currentSubstancesData);
    const steps = Math.max(1, Math.ceil(maxTime / time_step));
    const visibleTime = Math.min(currentTime, maxTime);

    const curve = graphMode === 'theoretical'
        ? simulator.computeCurve(maxTime, steps, false)
        : null;

    const traces = keys.map(key => {

        if (graphMode === 'random') {

            const visiblePoints = randomHistory.filter(
                p => p.time <= visibleTime
            );

            return {
                x: visiblePoints.map(p => p.time),
                y: visiblePoints.map(p => p.values[key] || 0),
                type: 'scatter',
                mode: 'lines+markers',
                name: `Substance ${key}`,
                line: { color: getColorForSubstance(key), width: 2 },
                marker: { size: 4 },
            };
        }

        const idx = simulator.idx[key];

        return {
            x: curve.map((_, i) => (i / steps) * maxTime),
            y: curve.map(v => v[idx]),
            type: 'scatter',
            mode: 'lines',
            name: `Substance ${key}`,
            line: { color: getColorForSubstance(key), width: 2 }
        };
    });

    const layout = {
        paper_bgcolor: '#141e30',
        plot_bgcolor: '#141e30',
        margin: { l: 58, r: 20, t: 12, b: 54 },
        font: { color: '#f8fafc' },
        xaxis: {
            title: 'Time (years)',
            range: [0, maxTime]
        },
        yaxis: {
            title: 'Fraction',
            range: [0, 1]
        }
    };

    Plotly.react(chartPlot, traces, layout, { responsive: true });
}

function loop() {

    if (isPlaying) {

        const stepYears = parseFloat(speedSlider.value);

        if (currentTime < maxTime) {

            const dt = Math.min(stepYears, maxTime - currentTime);

            currentTime += dt;

            latestValues = simulator.simulate(dt);

            addRandomHistoryPoint(currentTime, latestValues);

            updateStatsUI(latestValues);
            drawParticles(latestValues);
            if (graphMode === 'random') {
                drawChart();
            }
        }

        if (currentTime >= maxTime) {

            currentTime = maxTime;
            isPlaying = false;

            btnPlay.innerText = "Start";
            btnPlay.classList.add("primary");
        }
    }

    requestAnimationFrame(loop);
}

function resizeCanvases() {
    const pRect = particleCanvas.getBoundingClientRect();
    particleCanvas.width = pRect.width;

    initParticles();
    const currentValues = latestValues || simulator.getValuesAtTime(currentTime);
    drawParticles(currentValues);
    if (typeof Plotly !== 'undefined') {
        Plotly.Plots.resize(chartPlot);
    }
    drawChart();
}

btnPlay.addEventListener('click', () => {
    if(currentTime >= maxTime) {
        currentTime = 0;
        simulationAccumulator = 0;
        simulator.reset();
        latestValues = simulator.getValuesAtTime(0);
        resetRandomHistory(latestValues);
    }
    isPlaying = !isPlaying;
    btnPlay.innerText = isPlaying ? "Pause" : "Start";
    btnPlay.classList.toggle('primary', !isPlaying);
});

btnReset.addEventListener('click', () => {
    isPlaying = false;
    currentTime = 0;
    simulationAccumulator = 0;
    btnPlay.innerText = "Start";
    btnPlay.classList.add('primary');
    simulator.reset();
    const currentValues = simulator.getValuesAtTime(0);
    latestValues = currentValues;
    resetRandomHistory(currentValues);
    updateStatsUI(currentValues);
    drawParticles(currentValues);
    drawChart();
});

graphTheoreticalBtn.addEventListener('click', () => setGraphMode('theoretical'));
graphRandomBtn.addEventListener('click', () => setGraphMode('random'));

window.addEventListener('resize', resizeCanvases);

ensureDatasetColors(currentSubstancesData);
initPresetUI();
initStatsUI();
particleCanvas.width = particleCanvas.offsetWidth;
initParticles();

const initialVals = simulator.getValuesAtTime(0);
latestValues = initialVals;
resetRandomHistory(initialVals);
updateStatsUI(initialVals);
drawParticles(initialVals);
drawChart();

animationFrameId = requestAnimationFrame(loop);

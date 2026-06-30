// Setup der initialen Substanzen (analog zum Beispiel)
let currentSubstancesData = {
    A: { value: 1.0, "half life": 5, "decay products": { B: 0.7, C: 0.3 } },
    B: { value: 0.0, "half life": 3, "decay products": { C: 1.0 } },
    C: { value: 0.0, "half life": 8, "decay products": { D: 1.0 } },
    D: { value: 0.0, "half life": 1, "decay products": { E: 1.0 } },
    E: { value: 0.0, "half life": Infinity, "decay products": {} }
};

// Falls dynamisch Farben hinzukommen, stellen wir sicher, dass das Objekt erweiterbar ist
const colors = {
    A: '#ef4444',
    B: '#f97316',
    C: '#eab308',
    D: '#06b6d4',
    E: '#10b981'
};

window.updateSimulationDataset = function(newDataset) {
    isPlaying = false;
    currentTime = 0;
    btnPlay.innerText = "Start";
    btnPlay.classList.add('primary');

    currentSubstancesData = newDataset;
    
    // Simulator komplett neu instanziieren mit neuen Werten
    simulator = new DecaySimulator(currentSubstancesData);
    
    // UI neu aufbauen
    initStatsUI();
    initParticles();
    
    const currentValues = simulator.getValuesAtTime(0);
    latestValues = currentValues;
    resetRandomHistory(currentValues);
    updateStatsUI(currentValues);
    drawParticles(currentValues);
    drawChart();
};

let simulator = new DecaySimulator(currentSubstancesData);
let currentTime = 0;
let isPlaying = false;
let animationFrameId = null;
let lastTimestamp = 0;
let latestValues = null;
let graphMode = 'theoretical';
let randomHistory = [];
let simulationAccumulator = 0;

const maxTimeSlider = document.getElementById('max-time-input'); 
const yearsMaxSpan = document.getElementById('years-max');

let maxTime = parseFloat(maxTimeSlider.value) || 100;


maxTimeSlider.addEventListener('input', function() {
    maxTime = parseFloat(this.value);
    yearsMaxSpan.innerText = maxTime.toFixed(2); 
    
    drawChart(); 
}); 


// UI Elemente
const btnPlay = document.getElementById('btn-play');
const btnReset = document.getElementById('btn-reset');
const btnEdit = document.getElementById('btn-edit');
const speedSlider = document.getElementById('speed-slider');
const yearsVal = document.getElementById('years-val');
const statsContainer = document.getElementById('stats-container');

// Canvas Setup
const particleCanvas = document.getElementById('particle-canvas');
const pCtx = particleCanvas.getContext('2d');
const chartCanvas = document.getElementById('chart-canvas');
const cCtx = chartCanvas.getContext('2d');
const graphTheoreticalBtn = document.getElementById('graph-theoretical');
const graphRandomBtn = document.getElementById('graph-random');

// Erstelle Atome/Partikel für die grafische Darstellung
const particles = [];
const numParticles = 800; // Anzahl der Punkte im Gitter

function initParticles() {
    particles.length = 0;
    for(let i=0; i<numParticles; i++) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            // Zufälliger Schwellenwert für die Zuweisung des Typs basierend auf Wahrscheinlichkeiten
            randValue: Math.random() 
        });
    }
}

// Statistik HTML Struktur aufbauen
function initStatsUI() {
    statsContainer.innerHTML = '';
    Object.keys(currentSubstancesData).forEach(key => {
        const hl = currentSubstancesData[key]["half life"];
        const hlText = hl === Infinity ? "∞" : `${hl}j`;
        const dp = currentSubstancesData[key]["decay products"];
        // Convert fraction value back to clean legible percentage layout representation
        const dptext = Object.entries(dp).map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`).join(", ");
        
        const html = `
            <div class="stat-item" id="stat-${key}">
                <div class="stat-header">
                    <span class="color-${key}">Substanz ${key} <small style="color:var(--text-muted)">(t½: ${hlText}) (Zerfall: ${dptext})</small></span>
                    <span id="pct-${key}">0.0%</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" id="bar-${key}" style="background-color: ${colors[key]}"></div>
                </div>
            </div>
        `;
        statsContainer.insertAdjacentHTML('beforeend', html);
    });
}

// UI & Bars updaten
function updateStatsUI(currentValues) {
    Object.entries(currentValues).forEach(([key, val]) => {
        const pct = (val * 100).toFixed(1);
        document.getElementById(`pct-${key}`).innerText = `${pct}%`;
        document.getElementById(`bar-${key}`).style.width = `${pct}%`;
    });
    yearsVal.innerText = currentTime.toFixed(2);
}

// Zeichnet die Atome als Punkte, deren Verteilung den mathematischen Werten gleicht
function drawParticles(currentValues) {
    pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    
    // Grenzen für Partikel-Zuweisung berechnen
    const keys = Object.keys(currentValues);
    const thresholds = [];
    let cumulative = 0;
    
    keys.forEach(key => {
        cumulative += currentValues[key];
        thresholds.push({ key, limit: cumulative });
    });

    particles.forEach(p => {
        let type = keys[keys.length - 1]; // Fallback auf das letzte Element
        for(let t of thresholds) {
            if(p.randValue <= t.limit) {
                type = t.key;
                break;
            }
        }

        pCtx.beginPath();
        pCtx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        pCtx.fillStyle = colors[type];
        pCtx.fill();
    });
}

function resetRandomHistory(initialValues) {
    randomHistory = [{ time: 0, values: { ...initialValues } }];
}

function addRandomHistoryPoint(time, values) {
    const lastPoint = randomHistory[randomHistory.length - 1];
    if (lastPoint && Math.abs(lastPoint.time - time) < 0.01) {
        lastPoint.values = { ...values };
        return;
    }

    randomHistory.push({ time, values: { ...values } });
}

function setGraphMode(mode) {
    graphMode = mode;
    graphTheoreticalBtn.classList.toggle('active', mode === 'theoretical');
    graphRandomBtn.classList.toggle('active', mode === 'random');
    drawChart();
}

// Verlaufschart im unteren Canvas zeichnen
function drawChart() {
    cCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    const padding = 30;
    const w = chartCanvas.width - padding * 2;
    const h = chartCanvas.height - padding * 2;

    // Achsen zeichnen
    cCtx.strokeStyle = '#334155';
    cCtx.lineWidth = 1;
    cCtx.beginPath();
    cCtx.moveTo(padding, padding);
    cCtx.lineTo(padding, chartCanvas.height - padding);
    cCtx.lineTo(chartCanvas.width - padding, chartCanvas.height - padding);
    cCtx.stroke();

    // Kurven zeichnen von 0 bis maxTime
    const keys = Object.keys(currentSubstancesData);
    const steps = 100;
    const timeScale = maxTime || 1;

    keys.forEach(key => {
        cCtx.beginPath();
        cCtx.strokeStyle = colors[key];
        cCtx.lineWidth = 2;

        if (graphMode === 'random') {
            randomHistory.forEach((point, i) => {
                if (point.time > currentTime) return;

                const cx = padding + (point.time / timeScale) * w;
                const cy = (chartCanvas.height - padding) - ((point.values[key] || 0) * h);

                if(i === 0) cCtx.moveTo(cx, cy);
                else cCtx.lineTo(cx, cy);
            });
        } else {
            for(let i = 0; i <= steps; i++) {
                const t = (i / steps) * maxTime;
                if (t > currentTime) break; // Zeichne nur bis zur aktuellen Zeit

                const vals = simulator.getValuesAtTime(t);
                const cx = padding + (t / timeScale) * w;
                const cy = (chartCanvas.height - padding) - (vals[key] * h);

                if(i === 0) cCtx.moveTo(cx, cy);
                else cCtx.lineTo(cx, cy);
            }
        }
        cCtx.stroke();
    });

    // Aktuelle Zeit-Linie (Cursor)
    const cursorX = padding + (currentTime / timeScale) * w;
    if(cursorX <= padding + w) {
        cCtx.strokeStyle = 'rgba(255,255,255,0.4)';
        cCtx.setLineDash([4, 4]);
        cCtx.beginPath();
        cCtx.moveTo(cursorX, padding);
        cCtx.lineTo(cursorX, chartCanvas.height - padding);
        cCtx.stroke();
        cCtx.setLineDash([]);
    }
}

// Haupt-Animationsloop
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
            drawChart();
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

// Resize Handlers für responsive Canvas-Auflösung
function resizeCanvases() {
    const pRect = particleCanvas.getBoundingClientRect();
    particleCanvas.width = pRect.width;
    
    const cRect = chartCanvas.getBoundingClientRect();
    chartCanvas.width = cRect.width;

    initParticles();
    const currentValues = latestValues || simulator.getValuesAtTime(currentTime);
    drawParticles(currentValues);
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

initStatsUI();
particleCanvas.width = particleCanvas.offsetWidth;
chartCanvas.width = chartCanvas.offsetWidth;
initParticles();

const initialVals = simulator.getValuesAtTime(0);
latestValues = initialVals;
resetRandomHistory(initialVals);
updateStatsUI(initialVals);
drawParticles(initialVals);
drawChart();

// Start the loop
animationFrameId = requestAnimationFrame(loop);

document.addEventListener('DOMContentLoaded', () => {

    // Global State
    let currentScenario = 'video';
    let simulationMetrics = { TCP: {}, UDP: {}, HTTP: {}, HTTPS: {} };
    let timePoint = 0;

    // DOM Elements
    const bandwidthSelect = document.getElementById('bandwidth-select');
    const packetLossSlider = document.getElementById('packet-loss-slider');
    const latencySlider = document.getElementById('latency-slider');

    const lossVal = document.getElementById('loss-val');
    const latVal = document.getElementById('lat-val');

    const scenarioBtns = document.querySelectorAll('.scenario-btn');

    const recProtocol = document.getElementById('rec-protocol');
    const recExplanation = document.getElementById('rec-explanation');

    // Charts references
    let latencyChartInstance = null;
    let throughputChartInstance = null;

    // --- Chart.js Setup ---
    Chart.defaults.color = "rgba(255, 255, 255, 0.7)";
    Chart.defaults.font.family = "'Inter', sans-serif";

    function initCharts() {
        const ctxLat = document.getElementById('latencyChart').getContext('2d');
        const ctxThr = document.getElementById('throughputChart').getContext('2d');

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 400 },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                x: { grid: { display: false }, ticks: { display: false } }
            },
            plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)', font: { family: "'Inter', sans-serif" } } } },
            elements: { point: { radius: 2, hoverRadius: 5 } }
        };

        latencyChartInstance = new Chart(ctxLat, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    { label: 'TCP', data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4 },
                    { label: 'UDP', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 },
                    { label: 'HTTP', data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', fill: true, tension: 0.4 },
                    { label: 'HTTPS', data: [], borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', fill: true, tension: 0.4 }
                ]
            },
            options: commonOptions
        });

        throughputChartInstance = new Chart(ctxThr, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    { label: 'TCP', data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4 },
                    { label: 'UDP', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 },
                    { label: 'HTTP', data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', fill: true, tension: 0.4 },
                    { label: 'HTTPS', data: [], borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', fill: true, tension: 0.4 }
                ]
            },
            options: commonOptions
        });
    }

    function updateCharts(data) {
        timePoint++;
        const maxPoints = 15;

        // Latency
        latencyChartInstance.data.labels.push(timePoint);
        latencyChartInstance.data.datasets[0].data.push(data.TCP.latency);
        latencyChartInstance.data.datasets[1].data.push(data.UDP.latency);
        latencyChartInstance.data.datasets[2].data.push(data.HTTP.latency);
        latencyChartInstance.data.datasets[3].data.push(data.HTTPS.latency);

        if (latencyChartInstance.data.labels.length > maxPoints) {
            latencyChartInstance.data.labels.shift();
            latencyChartInstance.data.datasets.forEach(ds => ds.data.shift());
        }
        latencyChartInstance.update('none');

        // Throughput
        throughputChartInstance.data.labels.push(timePoint);
        throughputChartInstance.data.datasets[0].data.push(data.TCP.throughput_kbps);
        throughputChartInstance.data.datasets[1].data.push(data.UDP.throughput_kbps);
        throughputChartInstance.data.datasets[2].data.push(data.HTTP.throughput_kbps);
        throughputChartInstance.data.datasets[3].data.push(data.HTTPS.throughput_kbps);

        if (throughputChartInstance.data.labels.length > maxPoints) {
            throughputChartInstance.data.labels.shift();
            throughputChartInstance.data.datasets.forEach(ds => ds.data.shift());
        }
        throughputChartInstance.update('none');
    }

    // --- API Calls ---
    async function fetchSimulationData() {
        const payload = {
            bandwidth: bandwidthSelect.value,
            packet_loss: packetLossSlider.value,
            latency: latencySlider.value
        };

        try {
            const resp = await fetch('cn-mini-project-production.up.railway.app/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();
            simulationMetrics = data;
            updateCharts(data);
        } catch (error) {
            console.error("Simulation API Error:", error);
        }
    }

    async function fetchRecommendation() {
        try {
            const resp = await fetch('cn-mini-project-production.up.railway.app/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario: currentScenario })
            });
            const data = await resp.json();
            recProtocol.innerText = `Protocol: ${data.recommended_protocol}`;
            recExplanation.innerText = data.explanation;
        } catch (error) {
            console.error("Recommendation API Error:", error);
        }
    }

    // --- Event Listeners ---
    function updateValuesAndFetch() {
        lossVal.innerText = packetLossSlider.value;
        latVal.innerText = latencySlider.value;
        fetchSimulationData();
    }

    bandwidthSelect.addEventListener('change', updateValuesAndFetch);
    packetLossSlider.addEventListener('input', updateValuesAndFetch);
    latencySlider.addEventListener('input', updateValuesAndFetch);

    scenarioBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            scenarioBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            currentScenario = e.target.dataset.scenario;

            // Auto-configure sliders based on scenario
            if (currentScenario === 'video') {
                packetLossSlider.value = 5;
                latencySlider.value = 100;
                bandwidthSelect.value = 'medium';
            } else if (currentScenario === 'file') {
                packetLossSlider.value = 0;
                latencySlider.value = 150;
                bandwidthSelect.value = 'high';
            } else if (currentScenario === 'chat') {
                packetLossSlider.value = 1;
                latencySlider.value = 40;
                bandwidthSelect.value = 'low';
            }

            updateValuesAndFetch();
            fetchRecommendation();
        });
    });

    // --- GSAP Animations (Sender -> Router -> Receiver) ---
    function resetPackets() {
        gsap.killTweensOf(".packet");
        gsap.set(".packet", {
            opacity: 0,
            left: 0,
            x: 0,
            y: 0,
            scale: 1,
            backgroundColor: "#3b82f6" // Default blue
        });
        gsap.set(".status-label", { opacity: 0 });
        document.getElementById('tls-lock').classList.remove('visible');
    }

    function setStatus(side, text) {
        const el = document.getElementById(`status-${side}`);
        el.innerText = text;
        gsap.killTweensOf(el);
        gsap.fromTo(el, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 });
        gsap.to(el, { opacity: 0, delay: 1.5, duration: 0.5 });
    }

    // TCP ANIMATION
    document.getElementById('btn-animate-tcp').addEventListener('click', () => {
        resetPackets();
        const duration = 1.2;
        let tl = gsap.timeline();

        setStatus('left', 'TCP Handshake');
        tl.set(".packet-tx", { opacity: 1, backgroundColor: "#3b82f6", boxShadow: "0 0 15px 4px rgba(59, 130, 246, 0.6)" })
            .to(".packet-tx", { left: "calc(100% - 14px)", duration: duration, ease: "power1.inOut" })
            .set(".packet-tx", { opacity: 0 })

            .set(".packet-rx", { opacity: 1, backgroundColor: "#3b82f6" })
            .to(".packet-rx", { left: "calc(100% - 14px)", duration: duration, ease: "power1.inOut" })
            .set(".packet-rx", { opacity: 0 });
    });

    // UDP ANIMATION
    document.getElementById('btn-animate-udp').addEventListener('click', () => {
        resetPackets();
        const duration = 0.8;
        let tl = gsap.timeline();

        tl.set(".packet-tx", { opacity: 1, backgroundColor: "#10b981", boxShadow: "0 0 15px 4px rgba(16, 185, 129, 0.6)" })
            .to(".packet-tx", { left: "calc(100% - 14px)", duration: duration, ease: "power1.inOut" })
            .set(".packet-tx", { opacity: 0 })

            .set(".packet-rx", { opacity: 1, backgroundColor: "#10b981" })
            .to(".packet-rx", { left: "calc(100% - 14px)", duration: duration, ease: "power1.inOut" })
            .set(".packet-rx", { opacity: 0 });
    });

    // HTTP ANIMATION
    document.getElementById('btn-animate-http').addEventListener('click', () => {
        resetPackets();
        const duration = 1.0;
        let tl = gsap.timeline();

        setStatus('left', 'HTTP Request');
        tl.set(".packet-tx", { opacity: 1, backgroundColor: "#f59e0b", boxShadow: "0 0 15px 4px rgba(245, 158, 11, 0.6)" })
            .to(".packet-tx", { left: "calc(100% - 14px)", duration: duration, ease: "power1.inOut" })
            .set(".packet-tx", { opacity: 0 })

            .set(".packet-rx", { opacity: 1, backgroundColor: "#f59e0b" })
            .to(".packet-rx", { left: "calc(100% - 14px)", duration: duration, ease: "power1.inOut" })
            .set(".packet-rx", { opacity: 0 })
            .call(() => setStatus('right', 'HTTP Response'))

            .set(".packet-ack", { opacity: 1, left: "calc(100% - 14px)", backgroundColor: "#f59e0b" })
            .to(".packet-ack", { left: 0, duration: duration, ease: "power1.inOut" })
            .set(".packet-ack", { opacity: 0 });
    });

    // HTTPS ANIMATION
    document.getElementById('btn-animate-https').addEventListener('click', () => {
        resetPackets();
        const duration = 1.4;
        let tl = gsap.timeline();

        setStatus('left', 'TLS Handshake');
        tl.to({}, { duration: 0.8 }) // Handshake pause
            .call(() => document.getElementById('tls-lock').classList.add('visible'))
            .set(".packet-tx", { opacity: 1, backgroundColor: "#8b5cf6", boxShadow: "0 0 15px 4px rgba(139, 92, 246, 0.6)" })
            .to(".packet-tx", { left: "calc(100% - 14px)", duration: duration, ease: "power1.inOut" })
            .set(".packet-tx", { opacity: 0 })

            .set(".packet-rx", { opacity: 1, backgroundColor: "#8b5cf6" })
            .to(".packet-rx", { left: "calc(100% - 14px)", duration: duration, ease: "power1.inOut" })
            .set(".packet-rx", { opacity: 0 })
            .call(() => setStatus('right', 'Encrypted Response'))

            .set(".packet-ack", { opacity: 1, left: "calc(100% - 14px)", backgroundColor: "#8b5cf6" })
            .to(".packet-ack", { left: 0, duration: duration, ease: "power1.inOut" })
            .set(".packet-ack", { opacity: 0 });
    });

    // Initialize
    initCharts();
    fetchSimulationData();
    fetchRecommendation();
    setInterval(fetchSimulationData, 2000); // Continuous data flow simulation
});
const canvas = document.getElementById("pidCanvas");
const ctx = canvas.getContext("2d");

const kpInput = document.getElementById("kp");
const kiInput = document.getElementById("ki");
const kdInput = document.getElementById("kd");

const TARGET = 100;
const DT = 0.02;
const DURATION = 8;

function simulatePID(kp, ki, kd){
    let x = 0;
    let v = 0;
    let integral = 0;
    let prevError = TARGET;
    const points = [];

    for (let t = 0; t <= DURATION; t += DT) {
        const error = TARGET - x;

        integral += error * DT;
        integral = Math.max(-200, Math.min(200, integral));

        const derivative = (error - prevError) / DT;
        prevError = error;

        let output = kp * error + ki * integral + kd * derivative;
        output = Math.max(-1500, Math.min(1500, output));

        const accel = 0.05 * output - 1.0 * v;
        v += accel * DT;
        x += v * DT;

        points.push(x);
    }
    return points;
}

function draw() {
    const kp = parseFloat(kpInput.value);
    const ki = parseFloat(kiInput.value);
    const kd = parseFloat(kdInput.value);

    document.getElementById("kpv").textContent = kp;
    document.getElementById("kiv").textContent = ki;
    document.getElementById("kdv").textContent = kd;

    const points = simulatePID(kp, ki, kd);

    const W = canvas.width;
    const H = canvas.height;
    const pad = 28;

    const maxY = Math.max(160, ...points) * 1.05;
    const minY = Math.min(0, ...points);

    const sx = i => pad + (W - 2 * pad) * i / (points.length - 1);
    const sy = y => H - pad - (H - 2 * pad) * (y - minY) / (maxY - minY);

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = "#2a3a5c";
    ctx.lineWidth = 1;
    ctx.strokeRect(pad, pad, W - 2 * pad, H - 2 * pad);

    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = "#ffc857";
    ctx.beginPath();
    ctx.moveTo(pad, sy(TARGET));
    ctx.lineTo(W - pad, sy(TARGET));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "#4da3ff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((y, i) => {
        if (i === 0) ctx.moveTo(sx(i), sy(y));
        else ctx.lineTo(sx(i), sy(y));
    });
    ctx.stroke();

    ctx.fillStyle = "#black";
    ctx.font = "12px system-ui";
    ctx.fillText("target = " + TARGET, pad + 6, sy(TARGET) - 6);
    ctx.fillText("time →", W - pad - 44, H - 10);


    const overshoot = Math.max(0, Math.max(...points) - TARGET);
    let settleTime = 0;
    for (let i = points.length - 1; i >= 0; i--) {
        if (Math.abs(points[i] - TARGET) > 2) {
        settleTime = (i + 1) * DT;
        break;
        }
    }
    const settleText = settleTime >= DURATION - 0.05 ? "never (in " + DURATION + " s)" : settleTime.toFixed(1) + " s";

    document.getElementById("pidInfo").textContent = "Overshoot: " + overshoot.toFixed(1) + "  |  Settles within 2%: " + settleText;
}

function reset() {
    kpInput.value = 8;
    kiInput.value = 0;
    kdInput.value = 0;
    draw();
}

[kpInput, kiInput, kdInput].forEach(el => el.addEventListener("input", draw));
document.getElementById("pidReset").addEventListener("click", reset);

draw();
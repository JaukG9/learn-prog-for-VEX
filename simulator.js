const fieldCanvas = document.getElementById("fieldCanvas");
const fieldCtx = fieldCanvas.getContext("2d");

const FIELD = 144;
const SCALE = fieldCanvas.width / FIELD;
const ROBOT_SIZE = 15;

let robot = {x: 0, y: 0, h: 0};
let trail = [];
let animId = null;

function toScreen(x, y){
    return [(x + 72) * SCALE, (72 - y) * SCALE];
}

function angleDelta(from, to){
    return ((to - from) % 360 + 540) % 360 - 180;
}

function drawField(){
    fieldCtx.clearRect(0, 0, fieldCanvas.width, fieldCanvas.height);

    // tile grid (every 24")
    fieldCtx.strokeStyle = "#dddddd";
    fieldCtx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
        const p = i * 24 * SCALE;
        fieldCtx.beginPath(); fieldCtx.moveTo(p, 0); fieldCtx.lineTo(p, fieldCanvas.height); fieldCtx.stroke();
        fieldCtx.beginPath(); fieldCtx.moveTo(0, p); fieldCtx.lineTo(fieldCanvas.width, p); fieldCtx.stroke();
    }

    // axes through the center
    const [cx, cy] = toScreen(0, 0);
    fieldCtx.strokeStyle = "#999999";
    fieldCtx.lineWidth = 2;
    fieldCtx.beginPath();
    fieldCtx.moveTo(cx, 0); fieldCtx.lineTo(cx, fieldCanvas.height);
    fieldCtx.moveTo(0, cy); fieldCtx.lineTo(fieldCanvas.width, cy);
    fieldCtx.stroke();

    fieldCtx.fillStyle = "#777777";
    fieldCtx.font = "11px system-ui";
    fieldCtx.fillText("+Y", cx + 4, 12);
    fieldCtx.fillText("+X", fieldCanvas.width - 22, cy - 4);

    // path trail
    if (trail.length > 1) {
        fieldCtx.strokeStyle = "#2e9e5b";
        fieldCtx.lineWidth = 2;
        fieldCtx.beginPath();
        trail.forEach((p, i) => {
            const [sx, sy] = toScreen(p.x, p.y);
            if(i === 0) fieldCtx.moveTo(sx, sy);
            else fieldCtx.lineTo(sx, sy);
        });
        fieldCtx.stroke();
    }

    // robot: blue square with a white arrow showing the front
    const [rx, ry] = toScreen(robot.x, robot.y);
    const size = ROBOT_SIZE * SCALE;
    fieldCtx.save();
    fieldCtx.translate(rx, ry);
    fieldCtx.rotate(robot.h * Math.PI / 180);
    fieldCtx.fillStyle = "#1a5fd0";
    fieldCtx.fillRect(-size / 2, -size / 2, size, size);
    fieldCtx.fillStyle = "#ffffff";
    fieldCtx.beginPath();
    fieldCtx.moveTo(0, -size / 2 + 3);
    fieldCtx.lineTo(-size / 4, 0);
    fieldCtx.lineTo(size / 4, 0);
    fieldCtx.closePath();
    fieldCtx.fill();
    fieldCtx.restore();

    const heading = ((robot.h % 360) + 360) % 360;
    document.getElementById("simPose").textContent = "Pose: x=" + robot.x.toFixed(1) + " y=" + robot.y.toFixed(1) + " θ=" + heading.toFixed(1) + "°";
}

const ARG_COUNT = {setPose: 3, turnToHeading: 1, moveToPoint: 2, moveToPose: 3};

function buildSegments(code){
    const segments = [];
    let s = {x: 0, y: 0, h: 0};

    const lines = code
        .split("\n")
        .map(l => l.trim())
        .filter(l => l && !l.startsWith("//"));

    lines.forEach((line, n) => {
        const label = "Line " + (n + 1) + ": ";
        const match = line.match(/^(?:chassis\.)?(\w+)\(([^)]*)\)\s*;?$/);
        if(!match) throw new Error(label + "can't read '" + line + "'");

        const name = match[1];
        const args = match[2].split(",").map(a => a.trim()).filter(a => a !== "").map(Number);

        if(!(name in ARG_COUNT)) throw new Error(label + "unknown command '" + name + "'");
        if(args.some(isNaN)) throw new Error(label + "arguments must be numbers");
        if(args.length < ARG_COUNT[name]){
            throw new Error(label + name + " needs " + ARG_COUNT[name] + " numbers");
        }

        if(name === "setPose"){
            s = { x: args[0], y: args[1], h: args[2] };
            segments.push({ type: "jump", to: { ...s } });
        }else if (name === "turnToHeading"){
            const to = { ...s, h: s.h + angleDelta(s.h, args[0]) };
            segments.push({ type: "move", from: { ...s }, to, dur: 300 + Math.abs(to.h - s.h) * 4 });
            s = to;
        }else if (name === "moveToPoint"){
            const dx = args[0] - s.x;
            const dy = args[1] - s.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0.01){
                const bearing = Math.atan2(dx, dy) * 180 / Math.PI;
                const turned = { ...s, h: s.h + angleDelta(s.h, bearing) };
                segments.push({ type: "move", from: { ...s }, to: turned, dur: 250 + Math.abs(turned.h - s.h) * 4 });

                const to = { x: args[0], y: args[1], h: turned.h };
                segments.push({ type: "move", from: turned, to, dur: 250 + dist * 14 });
                s = to;
            }
        }else if (name === "moveToPose"){
            const dist = Math.hypot(args[0] - s.x, args[1] - s.y);
            const to = { x: args[0], y: args[1], h: s.h + angleDelta(s.h, args[2]) };
            segments.push({ type: "move", from: { ...s }, to, dur: 400 + dist * 14 });
            s = to;
        }
    });

    return segments;
}

function setMessage(text, kind){
    const el = document.getElementById("simMsg");
    el.textContent = text;
    el.className = "readout" + (kind ? " " + kind : "");
}

function runSim(){
    cancelAnimationFrame(animId);
    setMessage("");

    let segments;
    try{
        segments = buildSegments(document.getElementById("simCode").value);
    }catch(err){
        setMessage("Error: " + err.message, "error");
        return;
    }

    trail = [];
    let i = 0;
    let startTime = null;

    function step(timestamp){
        if(i >= segments.length){
            setMessage("Done", "success");
            return;
        }

        const seg = segments[i];

        if(seg.type === "jump"){
            robot = { ...seg.to };
            trail = [{ x: robot.x, y: robot.y }];
            drawField();
            i++;
            startTime = null;
            animId = requestAnimationFrame(step);
            return;
        }

        if(startTime === null) startTime = timestamp;
        const t = Math.min(1, (timestamp - startTime) / seg.dur);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        robot = {
            x: seg.from.x + (seg.to.x - seg.from.x) * eased,
            y: seg.from.y + (seg.to.y - seg.from.y) * eased,
            h: seg.from.h + (seg.to.h - seg.from.h) * eased
        };
        trail.push({ x: robot.x, y: robot.y });
        drawField();

        if(t >= 1){
            i++;
            startTime = null;
        }
        animId = requestAnimationFrame(step);
    }

    animId = requestAnimationFrame(step);
}

function resetSim() {
    cancelAnimationFrame(animId);
    robot = { x: 0, y: 0, h: 0 };
    trail = [];
    setMessage("");
    drawField();
}

document.getElementById("simRun").addEventListener("click", runSim);
document.getElementById("simReset").addEventListener("click", resetSim);

drawField();
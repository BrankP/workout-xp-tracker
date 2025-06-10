// track-extras.js

// Grab DOM elements
const video = document.getElementById("video");
const status = document.getElementById("feed-status");
const logUl = document.getElementById("exercise-log");

// 1) Initialize camera with permission prompt
async function initCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    status.textContent = "Camera API not supported in this browser.";
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    return true;
  } catch (err) {
    console.error("Error accessing camera:", err);
    status.textContent = err.name === "NotAllowedError"
      ? "Camera access was denied. Please allow access and reload."
      : "Unable to access camera: " + err.message;
    return false;
  }
}

// 2) Set up MediaPipe Pose
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`
});
pose.setOptions({
  modelComplexity: 0,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
pose.onResults(onPoseResults);

// 3) Start Camera → Pose pipeline
function startPoseDetection() {
  const camera = new Camera(video, {
    onFrame: async () => await pose.send({ image: video }),
    width: 640,
    height: 480
  });
  camera.start();
}

// 4) Simple push-up detection
let lastRepTime = 0;
let pushupDown = false;
function onPoseResults(results) {
  if (!results.poseLandmarks) return;
  const now = Date.now();
  if (now - lastRepTime < 1000) return;

  const lElbow  = results.poseLandmarks[13];
  const lShould = results.poseLandmarks[11];
  const lWrist  = results.poseLandmarks[15];

  // Compute angle at elbow
  function angle(a,b,c) {
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };
    const dot = ab.x*cb.x + ab.y*cb.y;
    const mag = Math.hypot(ab.x,ab.y)*Math.hypot(cb.x,cb.y);
    return Math.acos(dot/mag)*(180/Math.PI);
  }

  const elbowAngle = angle(lWrist, lElbow, lShould);
  if (elbowAngle < 90) {
    pushupDown = true;
  }
  if (pushupDown && elbowAngle > 160) {
    pushupDown = false;
    lastRepTime = now;
    logExercise("Push up", 10);
  }
}

// 5) Log exercise and award XP/Gp
function logExercise(name, xp) {
  if (logUl.children[0].textContent === "None") logUl.innerHTML = "";
  const li = document.createElement("li");
  li.textContent = `${name}! +${xp} xp`;
  logUl.prepend(li);

  const profile = loadProfile();
  let { xp: strXP, level } = profile.strength;
  strXP += xp;
  while (strXP >= xpNeededForLevel(level) && level < 99) {
    strXP -= xpNeededForLevel(level);
    level++;
  }
  profile.strength = { xp: strXP, level };
  saveProfile(profile);

  let gp = loadGP();
  gp++;
  saveGP(gp);

  renderAll();
}

// 6) On load: init camera, then pose detection
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await initCamera();
  if (ok) startPoseDetection();
});

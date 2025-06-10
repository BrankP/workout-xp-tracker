// js/track-extras.js

// Grab DOM elements
const video = document.getElementById("video");
const status = document.getElementById("feed-status");
const logUl = document.getElementById("exercise-log");

// Helper to prepend an entry (real or debug)
function appendLog(text, isDebug = false) {
  // If first entry is “None”, clear it
  if (logUl.children[0]?.textContent === "None") {
    logUl.innerHTML = "";
  }
  const li = document.createElement("li");
  li.textContent = isDebug ? `DEBUG: ${text}` : text;
  if (isDebug) li.style.color = "#888";
  logUl.prepend(li);
}

// Utility: compute angle at point B between BA and BC
function angle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  return Math.acos(dot / mag) * (180 / Math.PI);
}

// Simple push-up detection state
let lastRepTime = 0;
let pushupDown = false;
let lastDebugTime = 0;

// Called on each frame by MediaPipe Pose
function onPoseResults(results) {
  if (!results.poseLandmarks) return;
  const now = Date.now();

  // Debug elbow angle ~every 200ms
  if (now - lastDebugTime > 200) {
    const lElbow  = results.poseLandmarks[13];
    const lShould = results.poseLandmarks[11];
    const lWrist  = results.poseLandmarks[15];
    const elbowAngle = angle(lWrist, lElbow, lShould);
    appendLog(`elbowAngle=${elbowAngle.toFixed(1)}`, true);
    lastDebugTime = now;
  }

  // Throttle rep detection to once per second
  if (now - lastRepTime < 1000) return;

  const lElbow  = results.poseLandmarks[13];
  const lShould = results.poseLandmarks[11];
  const lWrist  = results.poseLandmarks[15];
  const elbowAngle = angle(lWrist, lElbow, lShould);

  // Down phase
  if (elbowAngle < 90) {
    if (!pushupDown) {
      appendLog("pushupDown = true", true);
      pushupDown = true;
    }
  }

  // Up phase → count rep
  if (pushupDown && elbowAngle > 160) {
    appendLog("pushup detected", true);
    pushupDown = false;
    lastRepTime = now;
    logExercise("Push up", 10);
  }
}

// Log an exercise: update UI + award XP & gp
function logExercise(name, xp) {
  appendLog(`${name}! +${xp} xp`);
  // Award XP to Strength
  const profile = loadProfile();
  let { xp: strXP, level: strLevel } = profile.strength;
  strXP += xp;
  while (strXP >= xpNeededForLevel(strLevel) && strLevel < 99) {
    strXP -= xpNeededForLevel(strLevel);
    strLevel++;
  }
  profile.strength = { xp: strXP, level: strLevel };
  saveProfile(profile);

  // Award 1 gp
  let gp = loadGP();
  gp++;
  saveGP(gp);

  renderAll();
}

// Initialize the camera (prompt user) and attach to video
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

// Set up MediaPipe Pose and start detection
function startPoseDetection() {
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

  const cameraFeed = new Camera(video, {
    onFrame: async () => await pose.send({ image: video }),
    width: 640,
    height: 480
  });
  cameraFeed.start();
}

// On page load, initialize
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await initCamera();
  if (ok) startPoseDetection();
});
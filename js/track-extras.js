// track-extras.js

const video = document.getElementById("video");
const status = document.getElementById("feed-status");
const logUl = document.getElementById("exercise-log");

function appendLog(text) {
  if (logUl.children[0]?.textContent === "None") logUl.innerHTML = "";
  const li = document.createElement("li");
  li.textContent = text;
  logUl.prepend(li);
}

function angle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  return Math.acos(dot / mag) * (180 / Math.PI);
}

let lastRepTime = 0, pushupDown = false, lastDebugTime = 0;

function onPoseResults(results) {
  if (!results.poseLandmarks) return;
  const now = Date.now();

  // Debug elbow angle every 200ms
  if (now - lastDebugTime > 200) {
    const lElbow  = results.poseLandmarks[13];
    const lShould = results.poseLandmarks[11];
    const lWrist  = results.poseLandmarks[15];
    const elbAngle = angle(lWrist, lElbow, lShould);
    appendLog(`DEBUG: elbowAngle=${elbAngle.toFixed(1)}`);
    lastDebugTime = now;
  }

  if (now - lastRepTime < 1000) return;

  const lElbow  = results.poseLandmarks[13];
  const lShould = results.poseLandmarks[11];
  const lWrist  = results.poseLandmarks[15];
  const elbAngle = angle(lWrist, lElbow, lShould);

  if (elbAngle < 90 && !pushupDown) {
    appendLog("DEBUG: pushupDown = true");
    pushupDown = true;
  }

  if (pushupDown && elbAngle > 160) {
    appendLog("DEBUG: pushup detected");
    pushupDown = false;
    lastRepTime = now;
    logExercise("Push up", 10);
  }
}

function logExercise(name, xp) {
  appendLog(`${name}! +${xp} xp`);
  const profile = loadProfile();
  let { xp: strXP, level: strLevel } = profile.strength;
  strXP += xp;
  while (strXP >= xpNeededForLevel(strLevel) && strLevel < 99) {
    strXP -= xpNeededForLevel(strLevel);
    strLevel++;
  }
  profile.strength = { xp: strXP, level: strLevel };
  saveProfile(profile);

  let gp = loadGP(); gp++; saveGP(gp);
  renderAll();
}

async function initTracking() {
  const pose = new Pose({
    locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${f}`
  });
  pose.setOptions({
    modelComplexity: 0,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  pose.onResults(onPoseResults);

  // Camera is now defined, thanks to camera_utils.js
  new Camera(video, {
    onFrame: async () => await pose.send({ image: video }),
    width: 640,
    height: 480
  }).start();
}

document.addEventListener("DOMContentLoaded", () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    status.textContent = "Camera API not supported.";
    return;
  }
  initTracking();
});

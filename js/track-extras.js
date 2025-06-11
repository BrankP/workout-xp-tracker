// js/track-extras.js

const video = document.getElementById("video");
const status = document.getElementById("feed-status");

// Counter for push-ups
let pushupCount = 0;

// Update the on‐page counter
function updateCounter(name) {
  if (name === "Push up") {
    pushupCount++;
    document.getElementById("pushup-count").textContent = pushupCount;
  }
}

// Utility to compute angle at B between BA and BC
function angle(a,b,c) {
  const ab = {x:a.x-b.x, y:a.y-b.y};
  const cb = {x:c.x-b.x, y:c.y-b.y};
  const dot = ab.x*cb.x + ab.y*cb.y;
  const mag = Math.hypot(ab.x,ab.y)*Math.hypot(cb.x,cb.y);
  return Math.acos(dot/mag)*(180/Math.PI);
}

let lastRep=0, pushupDown=false;

// Handle Pose results
function onResults(results) {
  if (!results.poseLandmarks) return;
  const now = Date.now();

  // Throttle to ≤1 rep/sec
  if (now - lastRep < 1000) return;

  const lm = results.poseLandmarks;
  const elbAngle = angle(lm[15], lm[13], lm[11]);

  // Detect “down” phase
  if (elbAngle < 90 && !pushupDown) {
    pushupDown = true;
  }
  // Detect “up” phase → count rep
  if (pushupDown && elbAngle > 160) {
    pushupDown = false;
    lastRep = now;
    logExercise("Push up", 10);
  }
}

// Log and award
function logExercise(name, xp) {
  // 1) Update counter
  updateCounter(name);

  // 2) Award XP & gp
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

// Initialize camera + Pose
async function init() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    status.textContent = "Camera API not supported.";
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    status.textContent = "Camera access denied.";
    return;
  }

  const pose = new Pose({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${f}`
  });
  pose.setOptions({
    modelComplexity:0,
    smoothLandmarks:true,
    minDetectionConfidence:0.5,
    minTrackingConfidence:0.5
  });
  pose.onResults(onResults);

  // feed video frames to pose
  async function frameLoop() {
    await pose.send({ image: video });
    requestAnimationFrame(frameLoop);
  }
  frameLoop();
}

document.addEventListener("DOMContentLoaded", init);
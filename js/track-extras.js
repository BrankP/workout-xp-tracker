// js/track-extras.js

const video = document.getElementById("video");
const status = document.getElementById("feed-status");
const logUl = document.getElementById("exercise-log");

function appendLog(text, debug = false) {
  if (logUl.children[0]?.textContent === "None") logUl.innerHTML = "";
  const li = document.createElement("li");
  li.textContent = debug ? `DEBUG: ${text}` : text;
  if (debug) li.style.color = "#888";
  logUl.prepend(li);
}

// compute angle at B
function angle(a,b,c) {
  const ab = {x:a.x-b.x, y:a.y-b.y};
  const cb = {x:c.x-b.x, y:c.y-b.y};
  const dot = ab.x*cb.x + ab.y*cb.y;
  const mag = Math.hypot(ab.x,ab.y)*Math.hypot(cb.x,cb.y);
  return Math.acos(dot/mag)*(180/Math.PI);
}

let lastRep=0, pushupDown=false, lastDbg=0;

// Set up MediaPipe Pose
const pose = new Pose({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${f}`
});
pose.setOptions({
  modelComplexity:0, smoothLandmarks:true,
  minDetectionConfidence:0.5, minTrackingConfidence:0.5
});
pose.onResults(onResults);

async function onResults(results) {
  if (!results.poseLandmarks) return;
  const now = Date.now();

  if (now - lastDbg > 200) {
    const lm = results.poseLandmarks;
    const elb = angle(lm[15], lm[13], lm[11]);
    appendLog(`elbow=${elb.toFixed(1)}`, true);
    lastDbg = now;
  }
  if (now - lastRep < 1000) return;

  const lm = results.poseLandmarks;
  const elb = angle(lm[15], lm[13], lm[11]);
  if (elb < 90 && !pushupDown) {
    appendLog("down", true);
    pushupDown = true;
  }
  if (pushupDown && elb > 160) {
    appendLog("rep", true);
    pushupDown = false;
    lastRep = now;
    logExercise("Push up", 10);
  }
}

// Logging + awarding
function logExercise(name,xp) {
  appendLog(`${name}! +${xp} xp`);
  const prof = loadProfile();
  let {xp: sXP, level} = prof.strength;
  sXP+=xp;
  while(sXP>=xpNeededForLevel(level)&&level<99){
    sXP-=xpNeededForLevel(level);
    level++;
  }
  prof.strength={xp:sXP,level};
  saveProfile(prof);
  let gp=loadGP(); gp++; saveGP(gp);
  renderAll();
}

// Start video + pose loop
async function init() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({video:true});
    video.srcObject = stream;
    await video.play();
    requestAnimationFrame(runPose);
  } catch (err) {
    console.error(err);
    status.textContent = "Camera denied or unavailable";
  }
}

// Manually feed frames into pose
async function runPose() {
  await pose.send({image:video});
  requestAnimationFrame(runPose);
}

document.addEventListener("DOMContentLoaded", init);
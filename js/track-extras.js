// track-extras.js

// List of exercises with simple name→xp mappings
const EXERCISE_MAP = {
  pushup: 10,
  squat: 5,
  lunge: 8,
  situp: 7
};

// Set up MediaPipe Pose
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

// Hook up camera input
const videoElement = document.getElementById("video");
const camera = new Camera(videoElement, {
  onFrame: async () => await pose.send({ image: videoElement }),
  width: 640,
  height: 480
});
camera.start();

// A simple throttle so we only detect at most one rep per second
let lastRepTime = 0;

function onPoseResults(results) {
  if (!results.poseLandmarks) return;
  const now = Date.now();
  if (now - lastRepTime < 1000) return;

  // Example: detect pushup by checking elbow angle below a threshold
  if (detectPushup(results.poseLandmarks)) {
    logExercise("Push up", EXERCISE_MAP.pushup);
    lastRepTime = now;
  }
  // Add more detectors here...
}

// Utility: compute angle between three points
function angle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  return Math.acos(dot / mag) * (180 / Math.PI);
}

// Push-up detection: elbow angle > 160° (straight) then < 100° (down)
// We'll detect the “down” position to log the rep
let pushupDown = false;
function detectPushup(landmarks) {
  const lElbow  = landmarks[13];
  const lShould = landmarks[11];
  const lWrist  = landmarks[15];
  const angleLeft = angle(lWrist, lElbow, lShould);

  // if elbow angle < 90°, user is in “down” phase
  if (angleLeft < 90) {
    pushupDown = true;
  }
  // if they go back up and were down, count a rep
  if (pushupDown && angleLeft > 160) {
    pushupDown = false;
    return true;
  }
  return false;
}

// Log an exercise: update UI + award XP & gp
function logExercise(name, xp) {
  const logUl = document.getElementById("exercise-log");
  if (logUl.children[0]?.textContent === "None") {
    logUl.innerHTML = "";
  }
  const li = document.createElement("li");
  li.textContent = `${name}! +${xp} xp`;
  logUl.prepend(li);

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
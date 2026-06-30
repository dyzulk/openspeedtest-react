export interface UploadOptions {
  blob: Blob;
  onUpdate: (currentSpeed: number, graphPoints: string, progressOffset: number) => void;
  registerXHR: (xhr: XMLHttpRequest) => void;
  deregisterXHR: (xhr: XMLHttpRequest) => void;
  isRunning: () => boolean;
}

const UL_THREADS = 6;
const UL_DURATION = 12; // seconds
const UP_ADJUST = 1.04;

function easeOutCubicLocal(t: number, b: number, c: number, d: number): number {
  t /= d;
  t--;
  return c * (t * t * t + 1) + b;
}

export async function runUploadPhase(options: UploadOptions): Promise<number> {
  const ulStart = performance.now();
  let uLoaded = 0;
  let uDiff = 0;
  let uTotal = 0;
  let utDiff = 0;
  let utTotal = 0;
  let uRest = 0;

  const speedSamples: number[] = [];
  const graphValues: number[] = [];

  const ulFinal = UL_DURATION * 0.6 > 7 ? 7 : UL_DURATION * 0.6;
  const rampUpTime = UL_DURATION - ulFinal;

  // Progress Bar Animation Interval (400 -> 0)
  const progressStart = Date.now();
  const progressInterval = setInterval(() => {
    const elapsedSec = (Date.now() - progressStart) / 1000;
    const currentOffset = easeOutCubicLocal(elapsedSec, 400, -400, UL_DURATION + 2.5);
    options.onUpdate(-1, "", currentOffset); // Signal progress update
  }, 14);

  let stopThreads = false;

  const runUlThread = (id: number) => {
    if (stopThreads || !options.isRunning()) return;

    let lastLoaded = 0;
    const xhr = new XMLHttpRequest();
    options.registerXHR(xhr);

    xhr.open("POST", `/api/upload?n=${Math.random()}`, true);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");

    xhr.upload.onprogress = (e) => {
      if (stopThreads || !options.isRunning()) {
        xhr.abort();
        return;
      }
      const chunk = e.loaded - lastLoaded;
      if (chunk > 0) {
        uLoaded += chunk;
        lastLoaded = e.loaded;
      }
    };

    xhr.onload = () => {
      options.deregisterXHR(xhr);
      if (!stopThreads && options.isRunning()) {
        runUlThread(id);
      }
    };

    xhr.onerror = () => {
      options.deregisterXHR(xhr);
      if (!stopThreads && options.isRunning()) {
        setTimeout(() => runUlThread(id), 50);
      }
    };

    xhr.send(options.blob);
  };

  // Launch parallel threads
  for (let th = 0; th < UL_THREADS; th++) {
    setTimeout(() => runUlThread(th), th * 300);
  }

  // Monitoring loop (every 100ms)
  const monitorInterval = setInterval(() => {
    const elapsed = (performance.now() - ulStart) / 1000;
    const uTime = elapsed * 1000;

    if (elapsed > rampUpTime && uRest === 0) {
      uRest = 1;
      utTotal = utTotal * 0.1;
      uTotal = uTotal * 0.1;
    }

    const uLoad = uLoaded - uDiff;
    uDiff = uLoaded;
    uTotal += uLoad;

    const utLoad = uTime - utDiff;
    utDiff = uTime;
    utTotal += utLoad;

    let currentSpeed = 0;
    const actualUtTotal = utTotal > 0 ? utTotal : uTime;
    if (uTotal > 0) {
      currentSpeed = (uTotal / actualUtTotal / 125) * UP_ADJUST;
    }

    if (elapsed >= rampUpTime && currentSpeed > 0) {
      speedSamples.push(currentSpeed);
    }

    // Update real-time graph points
    graphValues.push(currentSpeed);
    const maxVal = Math.max(...graphValues, 1);
    let points = "0,50 ";
    for (let idx = 0; idx < graphValues.length; idx++) {
      const perc = graphValues[idx] / maxVal;
      const steps = 130 / Math.max(1, graphValues.length - 1);
      points += `${(steps * idx).toFixed(2)},${(50 - 50 * perc).toFixed(2)} `;
    }
    points += "130,50";

    options.onUpdate(currentSpeed, points, -2); // Signal speed + graph update
  }, 100);

  // Wait for duration to pass
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      stopThreads = true;
      clearInterval(progressInterval);
      clearInterval(monitorInterval);
      resolve();
    }, UL_DURATION * 1000);
  });

  const finalUlSpeed = speedSamples.length > 0
    ? speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length
    : 0;

  return finalUlSpeed;
}

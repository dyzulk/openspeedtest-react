export interface DownloadOptions {
  onUpdate: (currentSpeed: number, graphPoints: string, progressOffset: number) => void;
  registerXHR: (xhr: XMLHttpRequest) => void;
  deregisterXHR: (xhr: XMLHttpRequest) => void;
  isRunning: () => boolean;
}

const DL_THREADS = 6;
const DL_DURATION = 12; // seconds
const DL_ADJUST = 1.04;
const CHUNK_SIZE = 64 * 1024;

let cachedChunk: Uint8Array | null = null;
function getRandomChunk(): Uint8Array {
  if (cachedChunk) return cachedChunk;
  cachedChunk = new Uint8Array(CHUNK_SIZE);
  crypto.getRandomValues(cachedChunk);
  return cachedChunk;
}

// Ease out cubic function local copy to maintain file isolation
function easeOutCubicLocal(t: number, b: number, c: number, d: number): number {
  t /= d;
  t--;
  return c * (t * t * t + 1) + b;
}

export async function runDownloadPhase(options: DownloadOptions): Promise<number> {
  const dlStart = performance.now();
  let dLoaded = 0;
  let dDiff = 0;
  let dTotal = 0;
  let dtDiff = 0;
  let dtTotal = 0;
  let dRest = 0;

  const speedSamples: number[] = [];
  const graphValues: number[] = [];

  const dlFinal = DL_DURATION * 0.6 > 7 ? 7 : DL_DURATION * 0.6;
  const rampUpTime = DL_DURATION - dlFinal;

  // Progress Bar Animation Interval
  const progressStart = Date.now();
  const progressInterval = setInterval(() => {
    const elapsedSec = (Date.now() - progressStart) / 1000;
    const currentOffset = easeOutCubicLocal(elapsedSec, 400, 400, DL_DURATION + 2.5);
    options.onUpdate(-1, "", currentOffset); // Send -1 to signal only updating progress
  }, 14);

  let stopThreads = false;

  const runDlThread = (id: number) => {
    if (stopThreads || !options.isRunning()) return;

    let lastLoaded = 0;
    const xhr = new XMLHttpRequest();
    options.registerXHR(xhr);

    xhr.open("GET", `/api/download?n=${Math.random()}`, true);
    xhr.responseType = "arraybuffer";

    xhr.onprogress = (e) => {
      if (stopThreads || !options.isRunning()) {
        xhr.abort();
        return;
      }
      const chunk = e.loaded - lastLoaded;
      if (chunk > 0) {
        dLoaded += chunk;
        lastLoaded = e.loaded;
      }
    };

    xhr.onload = () => {
      options.deregisterXHR(xhr);
      if (!stopThreads && options.isRunning()) {
        runDlThread(id);
      }
    };

    xhr.onerror = () => {
      options.deregisterXHR(xhr);
      if (!stopThreads && options.isRunning()) {
        setTimeout(() => runDlThread(id), 50);
      }
    };

    xhr.send();
  };

  // Launch parallel threads
  for (let th = 0; th < DL_THREADS; th++) {
    setTimeout(() => runDlThread(th), th * 300);
  }

  // Monitoring loop (every 100ms)
  const monitorInterval = setInterval(() => {
    const elapsed = (performance.now() - dlStart) / 1000;
    const dTime = elapsed * 1000;

    if (elapsed > rampUpTime && dRest === 0) {
      dRest = 1;
      dtTotal = dtTotal * 0.01;
      dTotal = dTotal * 0.01;
    }

    const dLoad = dLoaded - dDiff;
    dDiff = dLoaded;
    dTotal += dLoad;

    const dtLoad = dTime - dtDiff;
    dtDiff = dTime;
    dtTotal += dtLoad;

    let currentSpeed = 0;
    if (dTotal > 0 && dtTotal > 0) {
      currentSpeed = (dTotal / dtTotal / 125) * DL_ADJUST;
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

    options.onUpdate(currentSpeed, points, -2); // Send -2 to signal speed + graph update
  }, 100);

  // Wait for duration to pass
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      stopThreads = true;
      clearInterval(progressInterval);
      clearInterval(monitorInterval);
      resolve();
    }, DL_DURATION * 1000);
  });

  const finalDlSpeed = speedSamples.length > 0
    ? speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length
    : 0;

  return finalDlSpeed;
}

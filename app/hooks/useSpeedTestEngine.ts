import { useState, useEffect, useCallback, useRef } from "react";

export type TestStage = "loading" | "intro" | "ui" | "ping" | "download" | "upload" | "done" | "error";

export interface EngineState {
  stage: TestStage;
  statusText: string;
  ping: number | null;
  jitter: number | null;
  downloadSpeed: number | null;
  uploadSpeed: number | null;
  currentSpeed: number;
  progress: number;
  dlGraphPoints: string;
  ulGraphPoints: string;
  gaugeOffset: number;
  ipAddress: string;
  showIP: boolean;
}

const PING_SAMPLES = 10;
const JITTER_FINAL_SAMPLE = 0.5;
const PING_TIMEOUT = 5000;
const DL_THREADS = 6;
const UL_THREADS = 6;
const DL_DURATION = 12; // seconds
const UL_DURATION = 12; // seconds
const DL_ADJUST = 1.04; // 4% overhead compensation
const UP_ADJUST = 1.04; // 4% overhead compensation
const UL_DATA_SIZE_MB = 30; // Size of random data blob

const SCALE = [
  { value: 0, degree: 681.1 },
  { value: 0.5, degree: 570 },
  { value: 1, degree: 460 },
  { value: 10, degree: 337 },
  { value: 100, degree: 220 },
  { value: 500, degree: 115 },
  { value: 1000, degree: 0 }
];

function getNonlinearOffset(speed: number): number {
  if (speed <= 0 || isNaN(speed)) {
    return 681.1;
  }
  if (speed >= 1000) {
    return 0;
  }
  for (let i = 1; i < SCALE.length; i++) {
    if (speed <= SCALE[i].value) {
      const prev = SCALE[i - 1];
      const curr = SCALE[i];
      const ratio = (speed - prev.value) / (curr.value - prev.value);
      return prev.degree + ratio * (curr.degree - prev.degree);
    }
  }
  return 0;
}

// Ease out cubic function for progress bar
function easeOutCubic(t: number, b: number, c: number, d: number): number {
  t /= d;
  t--;
  return c * (t * t * t + 1) + b;
}

// Ease out quint function for needle returning to zero
function easeOutQuint(t: number, b: number, c: number, d: number): number {
  t /= d;
  t--;
  return c * (t * t * t * t * t + 1) + b;
}

export function useSpeedTestEngine(clientIP: string) {
  const [state, setState] = useState<EngineState>({
    stage: "loading",
    statusText: "Initializing..",
    ping: null,
    jitter: null,
    downloadSpeed: null,
    uploadSpeed: null,
    currentSpeed: 0,
    progress: 0,
    dlGraphPoints: "",
    ulGraphPoints: "",
    gaugeOffset: 681.1,
    ipAddress: clientIP,
    showIP: false,
  });

  const activeXHRs = useRef<XMLHttpRequest[]>([]);
  const isRunning = useRef(false);
  const uploadBlob = useRef<Blob | null>(null);

  // Helper to generate upload binary data
  const getUploadBlob = useCallback(() => {
    if (uploadBlob.current) return uploadBlob.current;
    const size = UL_DATA_SIZE_MB * 1024 * 1024;
    const buffer = new Uint8Array(262144);
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    uploadBlob.current = blob;
    return blob;
  }, []);

  const abortAll = useCallback(() => {
    activeXHRs.current.forEach((xhr) => {
      try {
        xhr.abort();
      } catch (e) {
        // ignore
      }
    });
    activeXHRs.current = [];
  }, []);

  // Reset state
  const resetTest = useCallback(() => {
    abortAll();
    isRunning.current = false;
    setState((s) => ({
      ...s,
      stage: "ui",
      statusText: "Ready",
      ping: null,
      jitter: null,
      downloadSpeed: null,
      uploadSpeed: null,
      currentSpeed: 0,
      progress: 0,
      dlGraphPoints: "",
      ulGraphPoints: "",
      gaugeOffset: 681.1,
    }));
  }, [abortAll]);

  // Transition from loading to intro
  useEffect(() => {
    const timer = setTimeout(() => {
      setState((s) => ({
        ...s,
        stage: "intro",
        statusText: "Automatic Test Starts in ...",
      }));
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Main Speed Test Execution
  const startTest = useCallback(async () => {
    if (isRunning.current) return;
    isRunning.current = true;

    // Transition to UI stage
    setState((s) => ({
      ...s,
      stage: "ui",
      statusText: "Initializing..",
      gaugeOffset: 681.1,
      currentSpeed: 0,
      progress: 0,
      dlGraphPoints: "",
      ulGraphPoints: "",
    }));

    try {
      // Small delay for UI fade-in
      await new Promise((r) => setTimeout(r, 1000));
      if (!isRunning.current) return;

      setState((s) => ({ ...s, stage: "ping", statusText: "Milliseconds" }));

      // ----------------------------------------------------
      // 1. PING & JITTER PENGETESAN
      // ----------------------------------------------------
      const pingResult: number[] = [];
      const jitterResult: number[] = [];

      for (let i = 0; i < PING_SAMPLES; i++) {
        if (!isRunning.current) return;

        const startTime = performance.now();
        const xhr = new XMLHttpRequest();
        activeXHRs.current.push(xhr);

        await new Promise<void>((resolve, reject) => {
          xhr.open("GET", `/api/upload?n=${Math.random()}`, true);
          xhr.timeout = PING_TIMEOUT;

          xhr.onload = () => {
            if (xhr.status === 200) {
              const endTime = Math.floor(performance.now() - startTime);
              // Cek Resource Timing API untuk akurasi tinggi
              const perfNum = performance.getEntries();
              const perfNumLast = perfNum[perfNum.length - 1];
              let perfPing = endTime;

              if (perfNumLast && perfNumLast.name.includes("/api/upload") && "duration" in perfNumLast) {
                perfPing = parseFloat((perfNumLast as any).duration.toFixed(1));
              }

              if (perfPing <= 0) perfPing = 0.1;

              pingResult.push(perfPing);

              if (pingResult.length > 1) {
                const jitterCalc = Math.abs(pingResult[pingResult.length - 1] - pingResult[pingResult.length - 2]);
                jitterResult.push(parseFloat(jitterCalc.toFixed(1)));

                // Update UI secara real-time
                setState((s) => ({
                  ...s,
                  currentSpeed: perfPing,
                  ping: Math.floor(perfPing),
                  jitter: Math.floor(jitterCalc),
                  gaugeOffset: getNonlinearOffset(perfPing),
                }));
              } else {
                setState((s) => ({
                  ...s,
                  currentSpeed: perfPing,
                  ping: Math.floor(perfPing),
                  gaugeOffset: getNonlinearOffset(perfPing),
                }));
              }
              resolve();
            } else {
              reject(new Error("Ping request failed"));
            }
          };

          xhr.onerror = () => reject(new Error("Network Error"));
          xhr.ontimeout = () => reject(new Error("Ping Timeout"));
          xhr.send();
        });

        // Clean up completed XHR
        activeXHRs.current = activeXHRs.current.filter((x) => x !== xhr);
        await new Promise((r) => setTimeout(r, 50));
      }

      // Hitung final ping & jitter
      if (!isRunning.current) return;
      const finalLeastPing = Math.min(...pingResult);
      let finalJitterValue = 0;

      if (jitterResult.length > 0) {
        jitterResult.sort((a, b) => a - b);
        const stableSamples = jitterResult.slice(0, Math.ceil(jitterResult.length * JITTER_FINAL_SAMPLE));
        const sum = stableSamples.reduce((acc, val) => acc + val, 0);
        finalJitterValue = sum / stableSamples.length;
      }

      setState((s) => ({
        ...s,
        ping: Math.floor(finalLeastPing),
        jitter: Math.floor(finalJitterValue),
        currentSpeed: 0,
        gaugeOffset: 681.1,
        statusText: "Initializing..",
      }));

      await new Promise((r) => setTimeout(r, 1000));
      if (!isRunning.current) return;

      // ----------------------------------------------------
      // 2. DOWNLOAD PENGETESAN
      // ----------------------------------------------------
      setState((s) => ({ ...s, stage: "download", statusText: "Mbps download" }));

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

      let progressInterval: any;
      let progressOffset = 400; // start offset

      // Jalankan animasi progress bar (400 -> 800)
      const progressStart = Date.now();
      progressInterval = setInterval(() => {
        const elapsedSec = (Date.now() - progressStart) / 1000;
        const currentOffset = easeOutCubic(elapsedSec, 400, 400, DL_DURATION + 2.5);
        setState((s) => ({ ...s, progress: currentOffset }));
      }, 14);

      // Jalankan loop untuk download thread
      let stopThreads = false;

      const runDlThread = (id: number) => {
        if (stopThreads || !isRunning.current) return;

        let lastLoaded = 0;
        const xhr = new XMLHttpRequest();
        activeXHRs.current.push(xhr);

        xhr.open("GET", `/api/download?n=${Math.random()}`, true);
        xhr.responseType = "arraybuffer";

        xhr.onprogress = (e) => {
          if (stopThreads || !isRunning.current) {
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
          activeXHRs.current = activeXHRs.current.filter((x) => x !== xhr);
          if (!stopThreads && isRunning.current) {
            runDlThread(id); // Loop thread
          }
        };

        xhr.onerror = () => {
          activeXHRs.current = activeXHRs.current.filter((x) => x !== xhr);
          if (!stopThreads && isRunning.current) {
            setTimeout(() => runDlThread(id), 50);
          }
        };

        xhr.send();
      };

      // Jalankan multiple thread secara bertahap
      for (let th = 0; th < DL_THREADS; th++) {
        setTimeout(() => runDlThread(th), th * 300);
      }

      // Monitoring interval (setiap 100ms)
      const monitorInterval = setInterval(() => {
        const elapsed = (performance.now() - dlStart) / 1000;
        const dTime = elapsed * 1000;

        // Reset buffer awal (ramp-up)
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

        // Simpan sample jika sudah lewat ramp-up
        if (elapsed >= rampUpTime) {
          if (currentSpeed > 0) {
            speedSamples.push(currentSpeed);
          }
        }

        // Update grafik
        graphValues.push(currentSpeed);
        const maxVal = Math.max(...graphValues, 1);
        let points = "0,50 ";
        for (let idx = 0; idx < graphValues.length; idx++) {
          const perc = graphValues[idx] / maxVal;
          const steps = 130 / Math.max(1, graphValues.length - 1);
          points += `${(steps * idx).toFixed(2)},${(50 - 50 * perc).toFixed(2)} `;
        }
        points += "130,50";

        setState((s) => ({
          ...s,
          currentSpeed,
          dlGraphPoints: points,
          gaugeOffset: getNonlinearOffset(currentSpeed),
        }));
      }, 100);

      // Tunggu hingga durasi download selesai
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          stopThreads = true;
          clearInterval(progressInterval);
          clearInterval(monitorInterval);
          abortAll();
          resolve();
        }, DL_DURATION * 1000);
      });

      // Hitung final download speed
      const finalDlSpeed = speedSamples.length > 0
        ? speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length
        : 0;

      // Animasi jarum kembali ke 0 sebelum lanjut ke upload
      await new Promise<void>((resolve) => {
        const returnStart = Date.now();
        const duration = 500; // 0.5 sec
        const initialSpeed = state.currentSpeed;
        const returnInterval = setInterval(() => {
          const elapsed = Date.now() - returnStart;
          const progress = elapsed / duration;
          if (progress >= 1) {
            clearInterval(returnInterval);
            setState((s) => ({
              ...s,
              downloadSpeed: finalDlSpeed,
              currentSpeed: 0,
              gaugeOffset: 681.1,
              progress: 800,
            }));
            resolve();
          } else {
            const currentSpeedDecreased = easeOutQuint(elapsed / 1000, initialSpeed, -initialSpeed, duration / 1000);
            setState((s) => ({
              ...s,
              currentSpeed: Math.max(0, currentSpeedDecreased),
              gaugeOffset: getNonlinearOffset(Math.max(0, currentSpeedDecreased)),
            }));
          }
        }, 16);
      });

      await new Promise((r) => setTimeout(r, 1000));
      if (!isRunning.current) return;

      // ----------------------------------------------------
      // 3. UPLOAD PENGETESAN
      // ----------------------------------------------------
      setState((s) => ({ ...s, stage: "upload", statusText: "Mbps upload", progress: 400 }));

      const ulStart = performance.now();
      let uLoaded = 0;
      let uDiff = 0;
      let uTotal = 0;
      let utDiff = 0;
      let utTotal = 0;
      let uRest = 0;

      const ulSpeedSamples: number[] = [];
      const ulGraphValues: number[] = [];

      const ulFinal = UL_DURATION * 0.6 > 7 ? 7 : UL_DURATION * 0.6;
      const rampUpTimeUl = UL_DURATION - ulFinal;

      // Progress bar upload (400 -> 0)
      const progressStartUl = Date.now();
      progressInterval = setInterval(() => {
        const elapsedSec = (Date.now() - progressStartUl) / 1000;
        const currentOffset = easeOutCubic(elapsedSec, 400, -400, UL_DURATION + 2.5);
        setState((s) => ({ ...s, progress: currentOffset }));
      }, 14);

      let stopUlThreads = false;
      const blobData = getUploadBlob();

      const runUlThread = (id: number) => {
        if (stopUlThreads || !isRunning.current) return;

        let lastLoaded = 0;
        const xhr = new XMLHttpRequest();
        activeXHRs.current.push(xhr);

        xhr.open("POST", `/api/upload?n=${Math.random()}`, true);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");

        xhr.upload.onprogress = (e) => {
          if (stopUlThreads || !isRunning.current) {
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
          activeXHRs.current = activeXHRs.current.filter((x) => x !== xhr);
          if (!stopUlThreads && isRunning.current) {
            runUlThread(id);
          }
        };

        xhr.onerror = () => {
          activeXHRs.current = activeXHRs.current.filter((x) => x !== xhr);
          if (!stopUlThreads && isRunning.current) {
            setTimeout(() => runUlThread(id), 50);
          }
        };

        xhr.send(blobData);
      };

      // Mulai upload threads
      for (let th = 0; th < UL_THREADS; th++) {
        setTimeout(() => runUlThread(th), th * 300);
      }

      // Monitoring upload
      const monitorIntervalUl = setInterval(() => {
        const elapsed = (performance.now() - ulStart) / 1000;
        const uTime = elapsed * 1000;

        if (elapsed > rampUpTimeUl && uRest === 0) {
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
        // Fix typo in original calculations to ensure absolute correctness:
        const actualUtTotal = utTotal > 0 ? utTotal : (uTime);
        if (uTotal > 0) {
          currentSpeed = (uTotal / actualUtTotal / 125) * UP_ADJUST;
        }

        if (elapsed >= rampUpTimeUl) {
          if (currentSpeed > 0) {
            ulSpeedSamples.push(currentSpeed);
          }
        }

        ulGraphValues.push(currentSpeed);
        const maxVal = Math.max(...ulGraphValues, 1);
        let points = "0,50 ";
        for (let idx = 0; idx < ulGraphValues.length; idx++) {
          const perc = ulGraphValues[idx] / maxVal;
          const steps = 130 / Math.max(1, ulGraphValues.length - 1);
          points += `${(steps * idx).toFixed(2)},${(50 - 50 * perc).toFixed(2)} `;
        }
        points += "130,50";

        setState((s) => ({
          ...s,
          currentSpeed,
          ulGraphPoints: points,
          gaugeOffset: getNonlinearOffset(currentSpeed),
        }));
      }, 100);

      // Tunggu upload selesai
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          stopUlThreads = true;
          clearInterval(progressInterval);
          clearInterval(monitorIntervalUl);
          abortAll();
          resolve();
        }, UL_DURATION * 1000);
      });

      const finalUlSpeed = ulSpeedSamples.length > 0
        ? ulSpeedSamples.reduce((a, b) => a + b, 0) / ulSpeedSamples.length
        : 0;

      // Jarum kembali ke 0
      await new Promise<void>((resolve) => {
        const returnStart = Date.now();
        const duration = 500;
        const initialSpeed = state.currentSpeed;
        const returnInterval = setInterval(() => {
          const elapsed = Date.now() - returnStart;
          const progress = elapsed / duration;
          if (progress >= 1) {
            clearInterval(returnInterval);
            setState((s) => ({
              ...s,
              uploadSpeed: finalUlSpeed,
              currentSpeed: 0,
              gaugeOffset: 681.1,
              progress: 800,
              stage: "done",
              statusText: "All done",
            }));
            resolve();
          } else {
            const currentSpeedDecreased = easeOutQuint(elapsed / 1000, initialSpeed, -initialSpeed, duration / 1000);
            setState((s) => ({
              ...s,
              currentSpeed: Math.max(0, currentSpeedDecreased),
              gaugeOffset: getNonlinearOffset(Math.max(0, currentSpeedDecreased)),
            }));
          }
        }, 16);
      });

      isRunning.current = false;

    } catch (err: any) {
      console.error(err);
      abortAll();
      isRunning.current = false;
      setState((s) => ({
        ...s,
        stage: "error",
        statusText: "Check your network connection status.",
        currentSpeed: 0,
        gaugeOffset: 681.1,
      }));
    }
  }, [getUploadBlob, abortAll, state.currentSpeed]);

  const toggleIPVisibility = useCallback(() => {
    setState((s) => ({ ...s, showIP: !s.showIP }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortAll();
    };
  }, [abortAll]);

  return {
    state,
    startTest,
    resetTest,
    toggleIPVisibility,
  };
}

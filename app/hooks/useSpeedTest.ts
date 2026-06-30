import { useState, useCallback, useRef } from "react";

export type SpeedTestStage = "idle" | "ping" | "download" | "upload" | "done" | "error";

export interface SpeedTestState {
  stage: SpeedTestStage;
  ping: number | null;
  jitter: number | null;
  downloadSpeed: number | null;
  uploadSpeed: number | null;
  currentSpeed: number; // For real-time display (Mbps)
  progress: number; // 0 - 100
  error: string | null;
}

const PING_SAMPLES = 10;
const DL_THREADS = 6;
const UL_THREADS = 6;
const TEST_DURATION_MS = 12000; // 12 seconds per test
const OVERHEAD_COMPENSATION = 1.04; // 4% compensation

export function useSpeedTest() {
  const [state, setState] = useState<SpeedTestState>({
    stage: "idle",
    ping: null,
    jitter: null,
    downloadSpeed: null,
    uploadSpeed: null,
    currentSpeed: 0,
    progress: 0,
    error: null,
  });

  const abortControllersRef = useRef<XMLHttpRequest[]>([]);
  const isRunningRef = useRef(false);

  const resetState = useCallback(() => {
    setState({
      stage: "idle",
      ping: null,
      jitter: null,
      downloadSpeed: null,
      uploadSpeed: null,
      currentSpeed: 0,
      progress: 0,
      error: null,
    });
  }, []);

  const stopAllRequests = useCallback(() => {
    isRunningRef.current = false;
    abortControllersRef.current.forEach((xhr) => {
      try {
        xhr.abort();
      } catch (e) {
        // ignore
      }
    });
    abortControllersRef.current = [];
  }, []);

  // Helper to generate random data for upload test (cached to avoid re-generating)
  const uploadDataRef = useRef<Blob | null>(null);
  const getUploadData = useCallback(() => {
    if (uploadDataRef.current) return uploadDataRef.current;
    
    // Generate ~4MB of uncompressible random data to reuse across upload requests
    const size = 4 * 1024 * 1024;
    const buffer = new Uint8Array(size);
    crypto.getRandomValues(buffer);
    
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    uploadDataRef.current = blob;
    return blob;
  }, []);

  const runTest = useCallback(async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    
    setState({
      stage: "ping",
      ping: null,
      jitter: null,
      downloadSpeed: null,
      uploadSpeed: null,
      currentSpeed: 0,
      progress: 0,
      error: null,
    });

    try {
      // 1. PING & JITTER TEST
      const pings: number[] = [];
      const jitters: number[] = [];
      
      for (let i = 0; i < PING_SAMPLES; i++) {
        if (!isRunningRef.current) return;
        
        const start = performance.now();
        const xhr = new XMLHttpRequest();
        abortControllersRef.current.push(xhr);
        
        await new Promise<void>((resolve, reject) => {
          xhr.open("GET", `/api/upload?n=${Math.random()}`, true);
          xhr.timeout = 5000;
          
          xhr.onload = () => {
            if (xhr.status === 200) {
              const duration = performance.now() - start;
              pings.push(duration);
              
              if (pings.length > 1) {
                const diff = Math.abs(pings[pings.length - 1] - pings[pings.length - 2]);
                jitters.push(diff);
              }
              resolve();
            } else {
              reject(new Error("Ping request failed"));
            }
          };
          
          xhr.onerror = () => reject(new Error("Ping request error"));
          xhr.ontimeout = () => reject(new Error("Ping request timeout"));
          xhr.send();
        });
        
        // Remove completed XHR
        abortControllersRef.current = abortControllersRef.current.filter((x) => x !== xhr);
        
        // Update ping state incrementally
        const tempPing = pings.length > 0 ? Math.min(...pings) : 0;
        const tempJitter = jitters.length > 0 ? jitters.reduce((a, b) => a + b, 0) / jitters.length : 0;
        
        setState((s) => ({
          ...s,
          ping: parseFloat(tempPing.toFixed(1)),
          jitter: parseFloat(tempJitter.toFixed(1)),
          progress: Math.round(((i + 1) / PING_SAMPLES) * 100),
          currentSpeed: parseFloat(tempPing.toFixed(1)), // reuse needle for ping response visual
        }));
        
        // Brief pause between pings
        await new Promise((r) => setTimeout(r, 50));
      }

      // Calculate final ping & jitter
      const finalPing = Math.min(...pings);
      jitters.sort((a, b) => a - b);
      const stableJitters = jitters.slice(0, Math.ceil(jitters.length * 0.5));
      const finalJitter = stableJitters.length > 0 
        ? stableJitters.reduce((a, b) => a + b, 0) / stableJitters.length 
        : 0;

      setState((s) => ({
        ...s,
        ping: parseFloat(finalPing.toFixed(1)),
        jitter: parseFloat(finalJitter.toFixed(1)),
        currentSpeed: 0,
        progress: 0,
        stage: "download",
      }));

      await new Promise((r) => setTimeout(r, 1000)); // Cool-off period

      // 2. DOWNLOAD SPEED TEST
      if (!isRunningRef.current) return;
      
      const dlStart = performance.now();
      let totalDownloadedBytes = 0;
      const threadBytes = new Array(DL_THREADS).fill(0);
      
      const dlInterval = setInterval(() => {
        const elapsed = performance.now() - dlStart;
        const speed = (totalDownloadedBytes / elapsed / 125) * OVERHEAD_COMPENSATION;
        const progress = Math.min(100, Math.round((elapsed / TEST_DURATION_MS) * 100));
        
        setState((s) => ({
          ...s,
          currentSpeed: parseFloat(speed.toFixed(1)),
          progress,
        }));
      }, 100);

      const runDownloadThread = (threadId: number) => {
        return new Promise<void>((resolve) => {
          if (!isRunningRef.current) return resolve();
          
          let lastLoaded = 0;
          const xhr = new XMLHttpRequest();
          abortControllersRef.current.push(xhr);
          
          xhr.open("GET", `/api/download?n=${Math.random()}`, true);
          xhr.responseType = "arraybuffer";
          
          xhr.onprogress = (e) => {
            if (!isRunningRef.current) {
              xhr.abort();
              return resolve();
            }
            const chunk = e.loaded - lastLoaded;
            if (chunk > 0) {
              threadBytes[threadId] += chunk;
              totalDownloadedBytes += chunk;
              lastLoaded = e.loaded;
            }
          };
          
          xhr.onload = () => {
            abortControllersRef.current = abortControllersRef.current.filter((x) => x !== xhr);
            
            // Loop request if duration is not met
            const elapsed = performance.now() - dlStart;
            if (isRunningRef.current && elapsed < TEST_DURATION_MS) {
              runDownloadThread(threadId).then(resolve);
            } else {
              resolve();
            }
          };
          
          xhr.onerror = xhr.onabort = () => {
            abortControllersRef.current = abortControllersRef.current.filter((x) => x !== xhr);
            resolve();
          };
          
          xhr.send();
        });
      };

      // Launch parallel threads
      const dlThreadPromises = Array.from({ length: DL_THREADS }).map((_, id) => {
        return new Promise<void>((r) => {
          setTimeout(() => runDownloadThread(id).then(r), id * 250); // Stagger threads
        });
      });

      // Wait for test duration to pass
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          clearInterval(dlInterval);
          stopAllRequests();
          resolve();
        }, TEST_DURATION_MS);
      });

      await Promise.all(dlThreadPromises);

      const finalDlSpeed = (totalDownloadedBytes / TEST_DURATION_MS / 125) * OVERHEAD_COMPENSATION;
      
      setState((s) => ({
        ...s,
        downloadSpeed: parseFloat(finalDlSpeed.toFixed(1)),
        currentSpeed: 0,
        progress: 0,
        stage: "upload",
      }));

      await new Promise((r) => setTimeout(r, 1000)); // Cool-off period

      // 3. UPLOAD SPEED TEST
      if (!isRunningRef.current) return;
      isRunningRef.current = true; // reset reference since stopAllRequests turned it off
      
      const ulStart = performance.now();
      let totalUploadedBytes = 0;
      const threadUlBytes = new Array(UL_THREADS).fill(0);
      const uploadBlob = getUploadData();

      const ulInterval = setInterval(() => {
        const elapsed = performance.now() - ulStart;
        const speed = (totalUploadedBytes / elapsed / 125) * OVERHEAD_COMPENSATION;
        const progress = Math.min(100, Math.round((elapsed / TEST_DURATION_MS) * 100));
        
        setState((s) => ({
          ...s,
          currentSpeed: parseFloat(speed.toFixed(1)),
          progress,
        }));
      }, 100);

      const runUploadThread = (threadId: number) => {
        return new Promise<void>((resolve) => {
          if (!isRunningRef.current) return resolve();
          
          let lastLoaded = 0;
          const xhr = new XMLHttpRequest();
          abortControllersRef.current.push(xhr);
          
          xhr.open("POST", `/api/upload?n=${Math.random()}`, true);
          xhr.setRequestHeader("Content-Type", "application/octet-stream");
          
          xhr.upload.onprogress = (e) => {
            if (!isRunningRef.current) {
              xhr.abort();
              return resolve();
            }
            const chunk = e.loaded - lastLoaded;
            if (chunk > 0) {
              threadUlBytes[threadId] += chunk;
              totalUploadedBytes += chunk;
              lastLoaded = e.loaded;
            }
          };
          
          xhr.onload = () => {
            abortControllersRef.current = abortControllersRef.current.filter((x) => x !== xhr);
            
            // Loop request if duration is not met
            const elapsed = performance.now() - ulStart;
            if (isRunningRef.current && elapsed < TEST_DURATION_MS) {
              runUploadThread(threadId).then(resolve);
            } else {
              resolve();
            }
          };
          
          xhr.onerror = xhr.onabort = () => {
            abortControllersRef.current = abortControllersRef.current.filter((x) => x !== xhr);
            resolve();
          };
          
          xhr.send(uploadBlob);
        });
      };

      // Launch parallel threads
      const ulThreadPromises = Array.from({ length: UL_THREADS }).map((_, id) => {
        return new Promise<void>((r) => {
          setTimeout(() => runUploadThread(id).then(r), id * 250); // Stagger threads
        });
      });

      // Wait for test duration to pass
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          clearInterval(ulInterval);
          stopAllRequests();
          resolve();
        }, TEST_DURATION_MS);
      });

      await Promise.all(ulThreadPromises);

      const finalUlSpeed = (totalUploadedBytes / TEST_DURATION_MS / 125) * OVERHEAD_COMPENSATION;
      
      setState((s) => ({
        ...s,
        uploadSpeed: parseFloat(finalUlSpeed.toFixed(1)),
        currentSpeed: 0,
        progress: 100,
        stage: "done",
      }));
      isRunningRef.current = false;

    } catch (e: any) {
      console.error(e);
      stopAllRequests();
      setState((s) => ({
        ...s,
        stage: "error",
        error: e.message || "An error occurred during speed test",
      }));
    }
  }, [getUploadData, stopAllRequests]);

  const cancelTest = useCallback(() => {
    stopAllRequests();
    resetState();
  }, [stopAllRequests, resetState]);

  return {
    ...state,
    startTest: runTest,
    cancelTest,
  };
}

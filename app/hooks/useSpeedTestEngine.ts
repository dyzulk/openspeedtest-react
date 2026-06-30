import { useState, useEffect, useCallback, useRef } from "react";
import { getNonlinearOffset, easeOutQuint } from "@/services/speedtestUtils";
import { runPingPhase } from "@/services/speedtestPing";
import { runDownloadPhase } from "@/services/speedtestDownload";
import { runUploadPhase } from "@/services/speedtestUpload";

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

const UL_DATA_SIZE_MB = 30;

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

  // Transition from loading to intro on mount
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

  // Cleanup active connections on unmount
  useEffect(() => {
    return () => {
      abortAll();
    };
  }, [abortAll]);

  // Easing function to return needle back to zero
  const animNeedleToZero = useCallback(async (initialSpeed: number) => {
    return new Promise<void>((resolve) => {
      const returnStart = Date.now();
      const duration = 500; // 0.5 sec
      const returnInterval = setInterval(() => {
        const elapsed = Date.now() - returnStart;
        if (elapsed >= duration) {
          clearInterval(returnInterval);
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
  }, []);

  // Main Speed Test Execution Flow
  const startTest = useCallback(async () => {
    if (isRunning.current) return;
    isRunning.current = true;

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
      await new Promise((r) => setTimeout(r, 1000));
      if (!isRunning.current) return;

      setState((s) => ({ ...s, stage: "ping", statusText: "Milliseconds" }));

      // ----------------------------------------------------
      // 1. FASE PING & JITTER
      // ----------------------------------------------------
      const { ping, jitter } = await runPingPhase({
        isRunning: () => isRunning.current,
        registerXHR: (xhr) => activeXHRs.current.push(xhr),
        deregisterXHR: (xhr) => {
          activeXHRs.current = activeXHRs.current.filter((x) => x !== xhr);
        },
        onUpdate: (perfPing, jitterCalc) => {
          setState((s) => ({
            ...s,
            currentSpeed: perfPing,
            ping: Math.floor(perfPing),
            jitter: jitterCalc !== undefined ? Math.floor(jitterCalc) : s.jitter,
            gaugeOffset: getNonlinearOffset(perfPing),
          }));
        },
      });

      setState((s) => ({
        ...s,
        ping: Math.floor(ping),
        jitter: Math.floor(jitter),
        currentSpeed: 0,
        gaugeOffset: 681.1,
        statusText: "Initializing..",
      }));

      await new Promise((r) => setTimeout(r, 1000));
      if (!isRunning.current) return;

      // ----------------------------------------------------
      // 2. FASE DOWNLOAD
      // ----------------------------------------------------
      setState((s) => ({ ...s, stage: "download", statusText: "Mbps download" }));

      let currentDLSpeed = 0;
      const finalDownloadSpeed = await runDownloadPhase({
        isRunning: () => isRunning.current,
        registerXHR: (xhr) => activeXHRs.current.push(xhr),
        deregisterXHR: (xhr) => {
          activeXHRs.current = activeXHRs.current.filter((x) => x !== xhr);
        },
        onUpdate: (speed, points, progress) => {
          if (progress === -2) {
            currentDLSpeed = speed;
            setState((s) => ({
              ...s,
              currentSpeed: speed,
              dlGraphPoints: points,
              gaugeOffset: getNonlinearOffset(speed),
            }));
          } else {
            setState((s) => ({ ...s, progress }));
          }
        },
      });

      await animNeedleToZero(currentDLSpeed);
      setState((s) => ({
        ...s,
        downloadSpeed: finalDownloadSpeed,
        currentSpeed: 0,
        gaugeOffset: 681.1,
        progress: 800,
      }));

      await new Promise((r) => setTimeout(r, 1000));
      if (!isRunning.current) return;

      // ----------------------------------------------------
      // 3. FASE UPLOAD
      // ----------------------------------------------------
      setState((s) => ({ ...s, stage: "upload", statusText: "Mbps upload", progress: 400 }));

      let currentULSpeed = 0;
      const finalUploadSpeed = await runUploadPhase({
        blob: getUploadBlob(),
        isRunning: () => isRunning.current,
        registerXHR: (xhr) => activeXHRs.current.push(xhr),
        deregisterXHR: (xhr) => {
          activeXHRs.current = activeXHRs.current.filter((x) => x !== xhr);
        },
        onUpdate: (speed, points, progress) => {
          if (progress === -2) {
            currentULSpeed = speed;
            setState((s) => ({
              ...s,
              currentSpeed: speed,
              ulGraphPoints: points,
              gaugeOffset: getNonlinearOffset(speed),
            }));
          } else {
            setState((s) => ({ ...s, progress }));
          }
        },
      });

      await animNeedleToZero(currentULSpeed);
      setState((s) => ({
        ...s,
        uploadSpeed: finalUploadSpeed,
        currentSpeed: 0,
        gaugeOffset: 681.1,
        progress: 800,
        stage: "done",
        statusText: "All done",
      }));

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
  }, [getUploadBlob, abortAll, animNeedleToZero]);

  const toggleIPVisibility = useCallback(() => {
    setState((s) => ({ ...s, showIP: !s.showIP }));
  }, []);

  return {
    state,
    startTest,
    resetTest,
    toggleIPVisibility,
  };
}

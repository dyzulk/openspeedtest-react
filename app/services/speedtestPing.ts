export interface PingOptions {
  onUpdate: (currentPing: number, currentJitter?: number) => void;
  registerXHR: (xhr: XMLHttpRequest) => void;
  deregisterXHR: (xhr: XMLHttpRequest) => void;
  isRunning: () => boolean;
}

const PING_SAMPLES = 10;
const JITTER_FINAL_SAMPLE = 0.5;
const PING_TIMEOUT = 5000;

export async function runPingPhase(options: PingOptions): Promise<{ ping: number; jitter: number }> {
  const pingResult: number[] = [];
  const jitterResult: number[] = [];

  for (let i = 0; i < PING_SAMPLES; i++) {
    if (!options.isRunning()) {
      throw new Error("Test cancelled");
    }

    const startTime = performance.now();
    const xhr = new XMLHttpRequest();
    options.registerXHR(xhr);

    await new Promise<void>((resolve, reject) => {
      xhr.open("GET", `/api/upload?n=${Math.random()}`, true);
      xhr.timeout = PING_TIMEOUT;

      xhr.onload = () => {
        if (xhr.status === 200) {
          const endTime = Math.floor(performance.now() - startTime);
          const perfEntries = performance.getEntries();
          const lastEntry = perfEntries[perfEntries.length - 1];
          let perfPing = endTime;

          if (lastEntry && lastEntry.name.includes("/api/upload") && "duration" in lastEntry) {
            perfPing = parseFloat((lastEntry as any).duration.toFixed(1));
          }

          if (perfPing <= 0) perfPing = 0.1;

          pingResult.push(perfPing);

          if (pingResult.length > 1) {
            const jitterCalc = Math.abs(pingResult[pingResult.length - 1] - pingResult[pingResult.length - 2]);
            jitterResult.push(parseFloat(jitterCalc.toFixed(1)));
            options.onUpdate(perfPing, jitterCalc);
          } else {
            options.onUpdate(perfPing);
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

    options.deregisterXHR(xhr);
    await new Promise((r) => setTimeout(r, 50));
  }

  const finalLeastPing = Math.min(...pingResult);
  let finalJitterValue = 0;

  if (jitterResult.length > 0) {
    jitterResult.sort((a, b) => a - b);
    const stableSamples = jitterResult.slice(0, Math.ceil(jitterResult.length * JITTER_FINAL_SAMPLE));
    const sum = stableSamples.reduce((acc, val) => acc + val, 0);
    finalJitterValue = sum / stableSamples.length;
  }

  return { ping: finalLeastPing, jitter: finalJitterValue };
}

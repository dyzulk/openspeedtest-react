import React, { useMemo } from "react";
import type { SpeedTestStage } from "../hooks/useSpeedTest";

interface SpeedometerProps {
  stage: SpeedTestStage;
  currentSpeed: number;
  downloadSpeed: number | null;
  uploadSpeed: number | null;
  ping: number | null;
  jitter: number | null;
  progress: number;
}

const SCALE = [
  { value: 0, offset: 681 },
  { value: 0.5, offset: 570 },
  { value: 1, offset: 460 },
  { value: 10, offset: 337 },
  { value: 100, offset: 220 },
  { value: 500, offset: 115 },
  { value: 1000, offset: 0 },
];

function getStrokeOffset(speed: number): number {
  if (speed <= 0 || isNaN(speed)) return 681;
  if (speed >= 1000) return 0;

  for (let i = 1; i < SCALE.length; i++) {
    if (speed <= SCALE[i].value) {
      const prev = SCALE[i - 1];
      const curr = SCALE[i];
      const ratio = (speed - prev.value) / (curr.value - prev.value);
      return prev.offset - ratio * (prev.offset - curr.offset);
    }
  }
  return 0;
}

export function Speedometer({
  stage,
  currentSpeed,
  downloadSpeed,
  uploadSpeed,
  ping,
  jitter,
  progress,
}: SpeedometerProps) {
  // Compute stroke offset for the speedometer ring
  const strokeOffset = useMemo(() => getStrokeOffset(currentSpeed), [currentSpeed]);
  
  // Outer progress bar offset (0 to 100 progress around the outer circle)
  // Outer circle circumference: 2 * PI * 120 = 753.98
  const outerCircumference = 753.98;
  const progressOffset = useMemo(() => {
    return outerCircumference - (progress / 100) * outerCircumference;
  }, [progress]);

  // Determine active colors based on stage
  const themeColor = useMemo(() => {
    switch (stage) {
      case "ping":
        return "from-amber-400 to-orange-500 shadow-orange-500/20";
      case "download":
        return "from-cyan-400 to-blue-500 shadow-blue-500/20";
      case "upload":
        return "from-purple-400 to-fuchsia-500 shadow-purple-500/20";
      case "done":
        return "from-emerald-400 to-teal-500 shadow-emerald-500/20";
      default:
        return "from-slate-400 to-slate-600 shadow-slate-500/10";
    }
  }, [stage]);

  const ringStroke = useMemo(() => {
    switch (stage) {
      case "ping":
        return "#f59e0b"; // Orange/Amber
      case "download":
        return "#06b6d4"; // Cyan
      case "upload":
        return "#a855f7"; // Purple
      case "done":
        return "#10b981"; // Emerald
      default:
        return "#475569"; // Slate
    }
  }, [stage]);

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full mx-auto">
      {/* Glow effect matching active stage */}
      <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-r ${themeColor} opacity-20 blur-xl transition-all duration-1000`} />

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Speedometer SVG */}
        <div className="relative w-72 h-72 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-225" viewBox="0 0 260 260">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={ringStroke} stopOpacity="0.4" />
                <stop offset="100%" stopColor={ringStroke} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Gray background track for speedometer */}
            <circle
              cx="130"
              cy="130"
              r="108.5"
              fill="transparent"
              stroke="#1e293b"
              strokeWidth="12"
              strokeDasharray="681.7"
              strokeDashoffset="170" /* 270 degree arc */
              strokeLinecap="round"
            />

            {/* Glowing active speedometer track */}
            <circle
              cx="130"
              cy="130"
              r="108.5"
              fill="transparent"
              stroke="url(#activeGradient)"
              strokeWidth="12"
              strokeDasharray="681.7"
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 200ms cubic-bezier(0.1, 0.9, 0.2, 1)" }}
              filter="url(#glow)"
            />

            {/* Outer overall stage progress ring (100% full circle) */}
            {stage !== "idle" && stage !== "done" && (
              <circle
                cx="130"
                cy="130"
                r="120"
                fill="transparent"
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray={outerCircumference}
                strokeDashoffset="0"
                strokeOpacity="0.3"
              />
            )}
            {stage !== "idle" && stage !== "done" && (
              <circle
                cx="130"
                cy="130"
                r="120"
                fill="transparent"
                stroke={ringStroke}
                strokeWidth="2"
                strokeDasharray={outerCircumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 150ms linear" }}
              />
            )}
          </svg>

          {/* Central readout container */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              {stage === "idle" ? "Ready" : stage}
            </span>
            <div className="flex items-baseline justify-center my-1">
              <span className="text-5xl font-black text-white tracking-tighter transition-all duration-200">
                {stage === "ping" ? (ping ?? "...") : currentSpeed.toFixed(currentSpeed > 100 ? 0 : 1)}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {stage === "ping" ? "ms Latency" : "Mbps"}
            </span>
          </div>
        </div>

        {/* Speed Grid Scale Indicators */}
        <div className="flex justify-between w-64 -mt-6 mb-8 text-[10px] font-bold text-slate-600">
          <span>0</span>
          <span>10</span>
          <span>100</span>
          <span>500</span>
          <span>1Gbps</span>
        </div>

        {/* Sub-results Panel */}
        <div className="grid grid-cols-2 gap-4 w-full border-t border-slate-800/80 pt-6">
          <div className="flex flex-col items-center p-3 bg-slate-950/40 rounded-2xl border border-slate-800/40">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ping</span>
            <span className="text-lg font-extrabold text-slate-200">
              {ping !== null ? `${ping} ms` : "-"}
            </span>
            <span className="text-[9px] font-medium text-slate-600 uppercase mt-0.5">
              Jitter: {jitter !== null ? `${jitter} ms` : "-"}
            </span>
          </div>

          <div className="flex flex-col items-center p-3 bg-slate-950/40 rounded-2xl border border-slate-800/40">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Download</span>
            <span className="text-lg font-extrabold text-cyan-400">
              {downloadSpeed !== null ? `${downloadSpeed} Mbps` : "-"}
            </span>
            <span className="text-[9px] font-medium text-slate-600 uppercase mt-0.5">Peak speed</span>
          </div>

          <div className="flex flex-col items-center p-3 bg-slate-950/40 rounded-2xl border border-slate-800/40 col-span-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Upload</span>
            <span className="text-lg font-extrabold text-purple-400">
              {uploadSpeed !== null ? `${uploadSpeed} Mbps` : "-"}
            </span>
            <span className="text-[9px] font-medium text-slate-600 uppercase mt-0.5">Throughput</span>
          </div>
        </div>
      </div>
    </div>
  );
}

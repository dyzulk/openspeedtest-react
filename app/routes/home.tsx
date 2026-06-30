import type { Route } from "./+types/home";
import { useSpeedTest } from "../hooks/useSpeedTest";
import { Speedometer } from "../components/Speedometer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "OpenSpeedTest - React & Cloudflare Pages" },
    { name: "description", content: "HTML5 Network Performance Estimation Tool powered by React Router and Cloudflare Pages Edge Functions." },
  ];
}

export default function Home() {
  const {
    stage,
    currentSpeed,
    downloadSpeed,
    uploadSpeed,
    ping,
    jitter,
    progress,
    error,
    startTest,
    cancelTest,
  } = useSpeedTest();

  const isTesting = stage !== "idle" && stage !== "done" && stage !== "error";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30 selection:text-cyan-300">
      {/* Decorative background grid and gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-80" />
      
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />

      <main className="relative z-10 w-full max-w-lg flex flex-col items-center gap-8 py-12">
        {/* Title / Header */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm">
            OpenSpeedTest
          </h1>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            React Router + Cloudflare Pages Edge
          </p>
        </div>

        {/* Speedometer UI */}
        <Speedometer
          stage={stage}
          currentSpeed={currentSpeed}
          downloadSpeed={downloadSpeed}
          uploadSpeed={uploadSpeed}
          ping={ping}
          jitter={jitter}
          progress={progress}
        />

        {/* Control Button */}
        <div className="w-full max-w-md flex flex-col items-center gap-4">
          {error && (
            <div className="w-full p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {stage === "idle" && (
            <button
              onClick={startTest}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-extrabold text-lg rounded-2xl shadow-lg hover:shadow-cyan-500/20 active:scale-98 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
            >
              Start Speed Test
            </button>
          )}

          {isTesting && (
            <button
              onClick={cancelTest}
              className="w-full py-4 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-red-400 font-extrabold text-lg rounded-2xl transition-all duration-200 cursor-pointer active:scale-98"
            >
              Cancel Test
            </button>
          )}

          {stage === "done" && (
            <button
              onClick={startTest}
              className="w-full py-4 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 text-cyan-400 font-extrabold text-lg rounded-2xl transition-all duration-200 cursor-pointer active:scale-98"
            >
              Test Again
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-8 text-center text-[10px] text-slate-600 font-medium">
        <p>&copy; 2026 OpenSpeedTest-React. Created with React Router v7 &amp; Cloudflare Pages.</p>
      </footer>
    </div>
  );
}

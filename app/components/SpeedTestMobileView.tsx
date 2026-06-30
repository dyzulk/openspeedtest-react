import React from "react";
import type { EngineState } from "@/hooks/useSpeedTestEngine";

interface SpeedTestMobileViewProps {
  state: EngineState;
  isDark: boolean;
  toggleTheme: () => void;
  startTest: () => void;
  toggleIPVisibility: () => void;
}

const formatSpeed = (val: number | null): string => {
  if (val === null) return "---";
  return val < 1 ? val.toFixed(3) : val.toFixed(1);
};

export function SpeedTestMobileView({
  state,
  isDark,
  toggleTheme,
  startTest,
  toggleIPVisibility,
}: SpeedTestMobileViewProps) {
  const isTestingOrDone = ["ui", "ping", "download", "upload", "done", "error"].includes(state.stage);

  const formatLiveSpeed = (val: number): string => {
    if (state.stage === "ping") {
      return state.ping !== null ? Math.floor(state.ping).toString() : "...";
    }
    if (val === 0) return "...";
    return val < 1 ? val.toFixed(3) : val.toFixed(1);
  };

  return (
    <svg className="block md:hidden w-full h-full" viewBox="0 0 295.9 363.3">
      {/* 1. Bagian Pengujian Active / Selesai (UI-Mob) */}
      <g id="UI-Mob" className={`transition-all duration-1000 ${isTestingOrDone ? "opacity-100 block" : "opacity-0 hidden pointer-events-none"}`}>
        <use href="#mainGaugebg" className="stroke-[#e7e7e8] dark:stroke-[#000000] fill-none stroke-[22px] stroke-linecap-round" strokeDasharray="681" x="11.18" y="12" width="273.94" height="245.39" />
        <use href="#mainGaugeBlue" className="stroke-[url(#gradient)] fill-none stroke-[22px] stroke-linecap-round transition-all duration-200" style={{ strokeDashoffset: state.gaugeOffset }} strokeDasharray="681" x="11.18" y="12" width="273.94" height="245.39" />
        <use href="#mainGaugeWhite" className="stroke-white fill-none stroke-[15px] stroke-linecap-round transition-all duration-200" style={{ strokeDashoffset: state.gaugeOffset === 0 ? 1 : state.gaugeOffset + 1 }} strokeDasharray="681" x="11.18" y="12" width="273.94" height="245.39" />
        
        {/* Cards mobile */}
        <rect className="fill-[#f2f2f2] dark:fill-black" x="1" y="297.52" width="88.1" height="65.8" rx="5" ry="5" />
        <rect className="fill-[#f2f2f2] dark:fill-black" x="104.1" y="297.52" width="88.1" height="65.8" rx="5" ry="5" />
        <rect className="fill-[#f2f2f2] dark:fill-black" x="207.1" y="297.52" width="88.1" height="65.8" rx="5" ry="5" />

        <use href="#downSymbol" className="fill-[#14b0fe]" style={{ display: state.stage === "download" ? "block" : "none" }} x="134" y="73" width="32.21" height="41.62" />
        <use href="#upSymbol" className="fill-[#14b0fe]" style={{ display: state.stage === "upload" ? "block" : "none" }} x="134" y="73" width="32.21" height="41.62" />
        <use href="#ConnectError" className="fill-[#ffffff]" style={{ display: state.stage === "error" ? "block" : "none" }} x="135.9" y="74.02" width="32.21" height="41.62" />

        <use href="#oDoMeter" x="11.18" y="12" width="273.94" height="245.39" />
        <text className="text-[28px] fill-[#201e1e] dark:fill-white font-medium text-center" x="148.2" y="135" textAnchor="middle">
          {formatLiveSpeed(state.currentSpeed)}
        </text>
        <text className="text-[10px] fill-[#d2d1d2] dark:fill-aliceblue font-medium text-center" x="148.2" y="155" textAnchor="middle">
          {state.statusText}
        </text>

        {/* Progress bar */}
        <use href="#progressBar-symbol" x="1.9" y="272.08" width="293.53" height="18.38" />
        <line className="stroke-[#56c4fb] stroke-[8px] stroke-linecap-round" x1="29" y1="277" x2="260" y2="277" style={{ strokeDashoffset: state.progress, strokeDasharray: "400" }} />

        {/* Card Texts */}
        <text className="text-[10px] fill-[#333] dark:fill-white font-medium text-center" x="45" y="311.63" textAnchor="middle">DOWNLOAD</text>
        <use href="#downSymbol" className="fill-[url(#gradient)]" x="7.7" y="303.42" width="10.6" height="12.4" />
        <text className="text-[18px] fill-[#201e1e] dark:fill-white font-medium text-center" x="45" y="335" textAnchor="middle">
          {formatSpeed(state.downloadSpeed)}
        </text>
        <text className="text-[10px] fill-[#5f5f5f] dark:fill-[#b0b0b0] font-medium text-center" x="45" y="348" textAnchor="middle">Mbps</text>

        <text className="text-[10px] fill-[#333] dark:fill-white font-medium text-center" x="148" y="311.63" textAnchor="middle">PING</text>
        <use href="#pingSymbol" x="126.8" y="303.32" width="12.5" height="12.4" />
        <text className="text-[18px] fill-[#201e1e] dark:fill-white font-medium text-center" x="148" y="335" textAnchor="middle">
          {state.ping !== null ? Math.floor(state.ping) : "--"}
        </text>
        <text className="text-[10px] fill-[#5f5f5f] dark:fill-[#b0b0b0] font-medium text-center" x="148" y="348" textAnchor="middle">ms / J: {state.jitter !== null ? Math.floor(state.jitter) : "--"}</text>

        <text className="text-[10px] fill-[#333] dark:fill-white font-medium text-center" x="251" y="311.63" textAnchor="middle">UPLOAD</text>
        <use href="#upSymbol" className="fill-[url(#gradient)]" x="221.8" y="303.42" width="12.3" height="10.6" />
        <text className="text-[18px] fill-[#201e1e] dark:fill-white font-medium text-center" x="251" y="335" textAnchor="middle">
          {formatSpeed(state.uploadSpeed)}
        </text>
        <text className="text-[10px] fill-[#5f5f5f] dark:fill-[#b0b0b0] font-medium text-center" x="251" y="348" textAnchor="middle">Mbps</text>

        {/* Graphs */}
        <g transform="translate(83.1, 160.45)" style={{ display: state.stage === "download" ? "block" : "none" }}>
          <polygon points={state.dlGraphPoints} className="fill-[url(#gradient)] opacity-30 stroke-[#56c4fb] stroke-2" />
        </g>
        <g transform="translate(83.1, 160.45)" style={{ display: state.stage === "upload" ? "block" : "none" }}>
          <polygon points={state.ulGraphPoints} className="fill-[url(#gradient)] opacity-30 stroke-[#56c4fb] stroke-2" />
        </g>
      </g>

      {/* 2. Bagian Landing / Tombol Start (intro-Mob) */}
      <g id="intro-Mob" className={`transition-all duration-1000 ${state.stage === "intro" ? "opacity-100 block" : "opacity-0 hidden pointer-events-none"}`}>
        <use href={isDark ? "#light-symbol" : "#dark-symbol"} className="cursor-pointer fill-[#75757a] hover:fill-[#000000] dark:hover:fill-white transition-colors duration-300" onClick={toggleTheme} x="10" y="25" width="30" height="30" />
        <use href="#logo-symbol" x="38" y="110" width="218.8" height="50.22" />
        <use href="#mainGaugebg" className="stroke-[#e7e7e8] dark:stroke-black fill-none stroke-[22px] stroke-linecap-round" strokeDasharray="681" x="11.18" y="12" width="273.94" height="245.39" />
        <use href="#playButton" onClick={startTest} x="125" y="280" width="50.2" height="50.2" />
        <use href="#settings" className="cursor-pointer opacity-10 hover:opacity-100 transition-opacity duration-300 fill-[url(#RadialGradient1)]" onClick={toggleIPVisibility} x="100" y="240" width="100" height="40" />

        {/* IP address container */}
        <text className="text-[15px] fill-[#201e1e] dark:fill-aliceblue font-medium text-center" x="148" y="70" textAnchor="middle">
          {state.showIP ? state.ipAddress : ""}
        </text>
      </g>
    </svg>
  );
}

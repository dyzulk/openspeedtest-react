import React from "react";
import type { EngineState } from "@/hooks/useSpeedTestEngine";

interface SpeedTestDesktopViewProps {
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

export function SpeedTestDesktopView({
  state,
  isDark,
  toggleTheme,
  startTest,
  toggleIPVisibility,
}: SpeedTestDesktopViewProps) {
  const isTestingOrDone = ["ui", "ping", "download", "upload", "done", "error"].includes(state.stage);

  const formatLiveSpeed = (val: number): string => {
    if (state.stage === "ping") {
      return state.ping !== null ? Math.floor(state.ping).toString() : "...";
    }
    if (val === 0) return "...";
    return val < 1 ? val.toFixed(3) : val.toFixed(1);
  };

  return (
    <svg className="hidden md:block w-full h-full" viewBox="0 0 586 346">
      {/* 1. Bagian Pengujian Active / Selesai (UI-Desk) */}
      <g id="UI-Desk" className={`transition-all duration-1000 ${isTestingOrDone ? "opacity-100 block" : "opacity-0 hidden pointer-events-none"}`}>
        <use href="#mainGaugebg" className="stroke-[#e7e7e8] dark:stroke-[#000000] fill-none stroke-[22px] stroke-linecap-round" strokeDasharray="681" x="10.28" y="36.11" width="273.94" height="245.39" />
        <use href="#mainGaugeBlue" className="stroke-[url(#gradient)] fill-none stroke-[22px] stroke-linecap-round transition-all duration-200" style={{ strokeDashoffset: state.gaugeOffset }} strokeDasharray="681" x="10.28" y="36.11" width="273.94" height="245.39" />
        <use href="#mainGaugeWhite" className="stroke-white fill-none stroke-[15px] stroke-linecap-round transition-all duration-200" style={{ strokeDashoffset: state.gaugeOffset === 0 ? 1 : state.gaugeOffset + 1 }} strokeDasharray="681" x="10.28" y="36.11" width="273.94" height="245.39" />
        
        {/* Results Cards Background */}
        <rect className="fill-[#f2f2f2] dark:fill-black" x="307.4" y="31" width="278.1" height="85.5" rx="5" ry="5" />
        <rect className="fill-[#f2f2f2] dark:fill-black" x="307.4" y="129.3" width="278.1" height="85.5" rx="5" ry="5" />
        <rect className="fill-[#f2f2f2] dark:fill-black" x="307.4" y="228.5" width="278.1" height="85.5" rx="5" ry="5" />

        {/* Symbols */}
        <use href="#downSymbol" className="fill-[#14b0fe]" style={{ display: state.stage === "download" ? "block" : "none" }} x="133" y="99" width="32.21" height="41.62" />
        <use href="#upSymbol" className="fill-[#14b0fe]" style={{ display: state.stage === "upload" ? "block" : "none" }} x="133" y="99" width="32.21" height="41.62" />
        <use href="#ConnectError" className="fill-[#ffffff]" style={{ display: state.stage === "error" ? "block" : "none" }} x="135" y="107.8" width="32.21" height="41.62" />

        {/* Odometer readout */}
        <use href="#oDoMeter" x="10.28" y="36.11" width="273.94" height="245.39" />
        <text className="text-[28px] fill-[#201e1e] dark:fill-white font-medium text-center" x="147.25" y="159" textAnchor="middle">
          {formatLiveSpeed(state.currentSpeed)}
        </text>
        <text className="text-[10px] fill-[#d2d1d2] dark:fill-aliceblue font-medium text-center" x="147.25" y="179" textAnchor="middle">
          {state.statusText}
        </text>

        {/* Progress Bar */}
        <use href="#progressBar-symbol" x="1" y="295" width="293.53" height="18.38" />
        <line className="stroke-[#56c4fb] stroke-[8px] stroke-linecap-round" x1="29" y1="300" x2="260" y2="300" style={{ strokeDashoffset: state.progress, strokeDasharray: "400" }} />

        {/* Cards Text & Results */}
        {/* Card 1: Download */}
        <text className="text-[12px] fill-[#333] dark:fill-white font-medium" x="335.05" y="60.28">DOWNLOAD</text>
        <use href="#downSymbol" className="fill-[url(#gradient)]" x="318.7" y="47.9" width="11.8" height="13.8" />
        <text className="text-[23px] fill-[#201e1e] dark:fill-white font-medium text-center" x="398" y="87.28" textAnchor="middle">
          {formatSpeed(state.downloadSpeed)}
        </text>
        <text className="text-[12px] fill-[#5f5f5f] dark:fill-[#b0b0b0] font-medium text-center" x="398" y="102.28" textAnchor="middle">Mbps</text>
        <g transform="translate(427.84, 35)">
          <polygon points={state.dlGraphPoints} className="fill-[url(#gradient)] opacity-30 stroke-[#56c4fb] stroke-2" />
        </g>

        {/* Card 2: Upload */}
        <text className="text-[12px] fill-[#333] dark:fill-white font-medium" x="345.33" y="157.2">UPLOAD</text>
        <use href="#upSymbol" className="fill-[url(#gradient)]" x="329" y="145.5" width="11.8" height="13.9" />
        <text className="text-[23px] fill-[#201e1e] dark:fill-white font-medium text-center" x="398" y="184.2" textAnchor="middle">
          {formatSpeed(state.uploadSpeed)}
        </text>
        <text className="text-[12px] fill-[#5f5f5f] dark:fill-[#b0b0b0] font-medium text-center" x="398" y="199.2" textAnchor="middle">Mbps</text>
        <g transform="translate(427.84, 134)">
          <polygon points={state.ulGraphPoints} className="fill-[url(#gradient)] opacity-30 stroke-[#56c4fb] stroke-2" />
        </g>

        {/* Card 3: Ping & Jitter */}
        <path d="M13.92.64a.55.55,0,0,0-.65.13L12.06,2A7.21,7.21,0,0,0,9.79.52a7,7,0,0,0-5.42,0,7,7,0,0,0-3.8,3.8,7,7,0,0,0,0,5.54,7.23,7.23,0,0,0,1.52,2.28,7.25,7.25,0,0,0,2.28,1.53,6.89,6.89,0,0,0,2.77.56,7.12,7.12,0,0,0,5.5-2.57.31.31,0,0,0,.07-.21.23.23,0,0,0-.09-.19L11.35,10a.36.36,0,0,0-.24-.09.27.27,0,0,0-.21.11,4.61,4.61,0,0,1-1.67,1.37,4.68,4.68,0,0,1-2.09.48,4.75,4.75,0,0,1-3.36-1.39A4.84,4.84,0,0,1,2.76,9a4.68,4.68,0,0,1-.38-1.85A4.63,4.63,0,0,1,2.76,5.3,4.74,4.74,0,0,1,5.3,2.76a4.72,4.72,0,0,1,5.09.9L9.1,4.94A.54.54,0,0,0,9,5.58.56.56,0,0,0,9.52,6h4.17a.61.61,0,0,0,.42-.17.57.57,0,0,0,.17-.42V1.19a.56.56,0,0,0-.36-.55Z" className="fill-[#14b0fe]" transform="translate(351.4, 243.8)" />
        <path d="M13.92.64a.55.55,0,0,0-.65.13L12.06,2A7.21,7.21,0,0,0,9.79.52a7,7,0,0,0-5.42,0,7,7,0,0,0-3.8,3.8,7,7,0,0,0,0,5.54,7.23,7.23,0,0,0,1.52,2.28,7.25,7.25,0,0,0,2.28,1.53,6.89,6.89,0,0,0,2.77.56,7.12,7.12,0,0,0,5.5-2.57.31.31,0,0,0,.07-.21.23.23,0,0,0-.09-.19L11.35,10a.36.36,0,0,0-.24-.09.27.27,0,0,0-.21.11,4.61,4.61,0,0,1-1.67,1.37,4.68,4.68,0,0,1-2.09.48,4.75,4.75,0,0,1-3.36-1.39A4.84,4.84,0,0,1,2.76,9a4.68,4.68,0,0,1-.38-1.85A4.63,4.63,0,0,1,2.76,5.3,4.74,4.74,0,0,1,5.3,2.76a4.72,4.72,0,0,1,5.09.9L9.1,4.94A.54.54,0,0,0,9,5.58.56.56,0,0,0,9.52,6h4.17a.61.61,0,0,0,.42-.17.57.57,0,0,0,.17-.42V1.19a.56.56,0,0,0-.36-.55Z" className="fill-[#14b0fe]" transform="translate(481.3, 244.6)" />
        
        <text className="text-[12px] fill-[#333] dark:fill-white font-medium" x="367.01" y="254.68">PING</text>
        <text className="text-[12px] fill-[#333] dark:fill-white font-medium" x="495.61" y="256.3">JITTER</text>

        <text className="text-[23px] fill-[#201e1e] dark:fill-white font-medium text-center" x="398" y="281.55" textAnchor="middle">
          {state.ping !== null ? Math.floor(state.ping) : "--"}
        </text>
        <text className="text-[12px] fill-[#5f5f5f] dark:fill-[#b0b0b0] font-medium text-center" x="398" y="296.55" textAnchor="middle">ms</text>

        <text className="text-[23px] fill-[#201e1e] dark:fill-white font-medium text-center" x="518" y="282.17" textAnchor="middle">
          {state.jitter !== null ? Math.floor(state.jitter) : "--"}
        </text>
        <text className="text-[12px] fill-[#5f5f5f] dark:fill-[#b0b0b0] font-medium text-center" x="518" y="297.17" textAnchor="middle">ms</text>
      </g>

      {/* 2. Bagian Landing / Tombol Start (intro-Desk) */}
      <g id="intro-Desk" className={`transition-all duration-1000 ${state.stage === "intro" ? "opacity-100 block" : "opacity-0 hidden pointer-events-none"}`}>
        <use href="#logo-symbol" x="35" y="140" width="222.8" height="50.22" />
        <use href="#mainGaugebg" className="stroke-[#e7e7e8] dark:stroke-black fill-none stroke-[22px] stroke-linecap-round" strokeDasharray="681" x="10.28" y="36.11" width="273.94" height="245.39" />
        
        {/* Results cards shadows in landing */}
        <rect className="fill-[#f2f2f2] dark:fill-black" x="307.4" y="31" width="278.1" height="85.5" rx="5" ry="5" />
        <rect className="fill-[#f2f2f2] dark:fill-black" x="307.4" y="129.3" width="278.1" height="85.5" rx="5" ry="5" />
        <rect className="fill-[#f2f2f2] dark:fill-black" x="307.4" y="228.5" width="278.1" height="85.5" rx="5" ry="5" />

        {/* Switch theme button */}
        <use href={isDark ? "#light-symbol" : "#dark-symbol"} className="cursor-pointer fill-[#75757a] hover:fill-[#000000] dark:hover:fill-white transition-colors duration-300" onClick={toggleTheme} x="10" y="25" width="30" height="30" />

        <use href="#playButton" onClick={startTest} x="125" y="300.6" width="50.2" height="50.2" />
        <use href="#settings" className="cursor-pointer opacity-10 hover:opacity-100 transition-opacity duration-300 fill-[url(#RadialGradient1)]" onClick={toggleIPVisibility} x="100" y="260" width="100" height="40" />

        {/* IP address container */}
        <text className="text-[15px] fill-[#201e1e] dark:fill-aliceblue font-medium text-center" x="145" y="90" textAnchor="middle">
          {state.showIP ? state.ipAddress : ""}
        </text>
      </g>
    </svg>
  );
}

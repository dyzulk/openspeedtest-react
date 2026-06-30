import React, { useState, useEffect } from "react";
import type { EngineState } from "@/hooks/useSpeedTestEngine";

interface SpeedTestUIProps {
  state: EngineState;
  startTest: () => void;
  resetTest: () => void;
  toggleIPVisibility: () => void;
}

export function SpeedTestUI({
  state,
  startTest,
  resetTest,
  toggleIPVisibility,
}: SpeedTestUIProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Membaca cookie mode skin atau preferensi sistem operasi
    const modeCookie = document.cookie.match("(^|;)\\s*mode\\s*=\\s*([^;]+)")?.pop();
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (modeCookie === "dark" || (!modeCookie && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      document.cookie = "mode=light; path=/; max-age=31536000";
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      document.cookie = "mode=dark; path=/; max-age=31536000";
      setIsDark(true);
    }
  };

  const isTestingOrDone = ["ui", "ping", "download", "upload", "done", "error"].includes(state.stage);

  // Formatter kecepatan Mbps
  const formatSpeed = (val: number | null): string => {
    if (val === null) return "---";
    return val < 1 ? val.toFixed(3) : val.toFixed(1);
  };

  const formatLiveSpeed = (val: number): string => {
    if (state.stage === "ping") {
      return state.ping !== null ? Math.floor(state.ping).toString() : "...";
    }
    if (val === 0) return "...";
    return val < 1 ? val.toFixed(3) : val.toFixed(1);
  };

  return (
    <div className="relative flex flex-col justify-between w-full h-full min-h-screen select-none font-sans bg-white dark:bg-[#181818] transition-colors duration-300">
      
      {/* 1. SPINNER LOADING APP (Asli OpenSpeedTest) */}
      {state.stage === "loading" && (
        <div className="ost-spinner">
          <div className="bounce1"></div>
          <div className="bounce2"></div>
          <div className="bounce3"></div>
        </div>
      )}

      {/* 2. CORE SVG CONTAINER */}
      {state.stage !== "loading" && (
        <div className="flex flex-col items-center justify-center flex-grow p-4">
          <div className="w-full max-w-[586px] aspect-[586/363]">
            <svg
              version="1.1"
              id="OpenSpeedtest"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              className="w-full h-full overflow-hidden block"
            >
              <defs>
                {/* Gradients */}
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#56c4fb" />
                  <stop offset="100%" stopColor="#0baeff" />
                </linearGradient>
                <radialGradient id="RadialGradient1">
                  <stop offset="0%" stopColor="#56c4fb" />
                  <stop offset="100%" stopColor="#0baeff" />
                </radialGradient>

                {/* Symbols */}
                <g id="logo-symbol">
                  <path
                    d="M39.77,15.17A27,27,0,0,0,34,6.71c-2.49-2.13-4.33-2.13-6.68,0a15.2,15.2,0,0,0-2.55,3.06c-5.4,8.59-9.17,17.68-9.31,28a22.39,22.39,0,0,0,.5,5.33C16.83,46.7,19,48,22.66,47.2a32.27,32.27,0,0,0,7-2.56c-1.78,2.63-6.47,5.4-9.38,5.68a7.44,7.44,0,0,1-7.46-3.62,17.59,17.59,0,0,1-2.62-9.16A41.31,41.31,0,0,1,13.42,19C15.55,14.1,18,9.41,21.66,5.51a18.35,18.35,0,0,1,3.91-3.2C29.33.18,33,.82,35.72,4.09a19.33,19.33,0,0,1,4,9.94Z"
                    fill="#4d4d4d"
                    className="dark:fill-[#a0a0a0]"
                  />
                  <path
                    d="M12.93,49.4C9.16,51,5.47,49.76,3.2,46.2A20.53,20.53,0,0,1,.21,37C-.92,25.11,2.56,14.6,9.45,5.08A12.69,12.69,0,0,1,15.06.53a7.51,7.51,0,0,1,7.31,1,5.17,5.17,0,0,1,.71.71A14.47,14.47,0,0,0,20.53,4.3c-2.21-1.28-3.84.14-4.76.92a14.34,14.34,0,0,0-3,3.91C8,18.08,4.9,27.52,5.47,37.89a17.58,17.58,0,0,0,1,5.4c.71,1.85,1.71,3.48,4.48,3.77C11.15,47.06,12,48.69,12.93,49.4Z"
                    fill="#3da6ff"
                  />
                  <path
                    d="M109.31,16.8a16.31,16.31,0,0,1,6,.92A6.55,6.55,0,0,1,119.61,24c0,.78-.15,1.28-1,1.28s-1.42.14-1.7-.92c-.86-3.77-2.13-4.69-6-4.76a12.92,12.92,0,0,0-5,.57,3,3,0,0,0-2.34,3.19A3,3,0,0,0,106,26.39c2.48.71,4.9,1.21,7.39,1.77a22,22,0,0,1,2.77.93,5.47,5.47,0,0,1,3.9,5.25,5.44,5.44,0,0,1-3.34,5.76,14,14,0,0,1-12.35.14c-3-1.28-4.12-3.84-4.27-7,0-.93.36-1.35,1.28-1.35s1.35.28,1.42,1.21c.43,3.76,1.64,4.9,5.4,5.54a11.78,11.78,0,0,0,6.61-.57,3.45,3.45,0,0,0,2.48-3.48c0-1.64-.78-2.63-2.63-3.13-2.34-.71-4.83-1.21-7.17-1.77a22.21,22.21,0,0,1-3-1,5.61,5.61,0,0,1-3.48-6,5.55,5.55,0,0,1,4.26-5.19A11.35,11.35,0,0,1,109.31,16.8Z"
                    fill="#4d4d4d"
                    className="dark:fill-[#e0e0e0]"
                  />
                  <path
                    d="M237.65,41.52c-3.84,0-6-1.35-6.89-4.05a5.87,5.87,0,0,1-.43-2.2c0-.86.36-1.42,1.28-1.42S233,33.92,233,35c0,3.55,4.41,5.26,7.53,3.34a2,2,0,0,0,1.21-1.92,2,2,0,0,0-1.35-1.84c-1.49-.79-3.2-.79-4.9-1.14-3.2-.71-4.76-2.56-4.48-5.61a5.37,5.37,0,0,1,4.69-4.48,10.83,10.83,0,0,1,4.76.29,5.24,5.24,0,0,1,3.84,5.54c-.08.78-.43,1.13-1.14,1.13s-1.63-.07-1.63-.92c.07-3.34-3.56-4.4-6.33-3a2.31,2.31,0,0,0-1.49,2.34c.07,1.14.93,1.49,1.78,1.71,1.85.49,3.83.78,5.68,1.35a4.49,4.49,0,0,1,3.34,4.54,4.62,4.62,0,0,1-3.13,4.55A6,6,0,0,1,237.65,41.52Z"
                    fill="#3da6ff"
                  />
                  <path d="M35,22.27,33.74,24c-2.35-.78-5.83.43-8,3.48A7.15,7.15,0,0,1,35,22.27Z" fill="#3da6ff" />
                  <path d="M39.56,32.35a7.75,7.75,0,0,0-1.35-5.54l.85-1.7C40.7,26.89,40.91,29.73,39.56,32.35Z" fill="#3da6ff" />
                  <path
                    d="M262.79,17.65h0V16.8c0-.36,0-.71-.35-.78s-.57.28-.78.5c-.43.71-.93,1.42-1.42,2.27-.57-.85-1-1.64-1.5-2.27-.14-.29-.35-.71-.78-.5s-.42.42-.42.78V22a.53.53,0,0,0,.49.5h0a.53.53,0,0,0,.5-.5v-4l1.35,2.13c.14.14.43.28.57,0l1.35-1.85v3.84a.53.53,0,0,0,.5.49h0a.53.53,0,0,0,.49-.49V17.72h0Z"
                    fill="#4d4d4d"
                    className="dark:fill-[#e0e0e0]"
                  />
                  <path
                    d="M256.54,16h-3.41a.53.53,0,0,0-.49.49h0a.53.53,0,0,0,.49.5h1.21v5a.54.54,0,0,0,.5.5h0a.54.54,0,0,0,.5-.5v-5h1.2a.53.53,0,0,0,.5-.5h0A.59.59,0,0,0,256.54,16Z"
                    fill="#4d4d4d"
                    className="dark:fill-[#e0e0e0]"
                  />
                  <path
                    d="M252.64,24.4h-1.85V20.14a1,1,0,0,0-.92-.93h-.57a1,1,0,0,0-.93.93V24.4h-1.84a.94.94,0,0,0-.92.92v.57a.93.93,0,0,0,.92.92h1.84v13.5a.94.94,0,0,0,.93.92h.57a.94.94,0,0,0,.92-.92V26.81h1.85a.94.94,0,0,0,.92-.92v-.57A.94.94,0,0,0,252.64,24.4Z"
                    fill="#3da6ff"
                  />
                  <path
                    d="M212.72,18a1,1,0,0,0-.92-.93H194.25a1,1,0,0,0-.92.93v.71a.94.94,0,0,0,.92.92h7.53V40.38a.94.94,0,0,0,.93.92h.71a.94.94,0,0,0,.92-.92V19.5h7.53a.94.94,0,0,0,.92-.92V18Z"
                    fill="#3da6ff"
                  />
                  <path
                    d="M190.06,18v7c-4.4-3.84-11.43-2.77-13.49,3.34a11.48,11.48,0,0,0,.07,8,7.72,7.72,0,0,0,7.53,5.26,8.84,8.84,0,0,0,6-2.27h0v1a.94.94,0,0,0,.93.92h.78a.93.93,0,0,0,.92-.92V18a.94.94,0,0,0-.92-.93h-.78A.92.92,0,0,0,190.06,18Zm-6.82,20.81a4.79,4.79,0,0,1-1.13-.29c-3.06-1.2-4.41-5.39-3.06-9.23a5.49,5.49,0,0,1,7.11-3.55c2.48.71,3.9,3.12,3.9,6.53C190.06,36.62,187.22,39.31,183.24,38.82Z"
                    fill="#4d4d4d"
                    className="dark:fill-[#e0e0e0]"
                  />
                  <path
                    d="M48.58,47.2h0a1.31,1.31,0,0,0,1.35-1.35V39.17c4.4,3.84,11.43,2.77,13.49-3.34a11.48,11.48,0,0,0-.07-8,7.7,7.7,0,0,0-7.52-5.26,8.83,8.83,0,0,0-6,2.28h0v-.57a1.31,1.31,0,0,0-1.35-1.35h0a1.31,1.31,0,0,0-1.35,1.35V45.78A1.42,1.42,0,0,0,48.58,47.2Zm8.17-21.74a6,6,0,0,1,1.13.29c3.06,1.21,4.41,5.4,3.06,9.23a5.47,5.47,0,0,1-7.1,3.55c-2.49-.71-3.91-3.12-3.91-6.53C49.93,27.67,52.7,24.83,56.75,25.46Z"
                    fill="#3da6ff"
                  />
                  <path
                    d="M228.06,33.56c1.21.07,1.64-.5,1.64-1.63.07-3.55-1.64-6.61-4.55-7.89-3.41-1.42-6.68-1.27-9.66,1.28-3.34,2.77-3.91,9-1.42,12.86,2.13,3.19,7,4.33,11.08,2.48a6.57,6.57,0,0,0,3.62-4c.29-.57.36-1.28-.35-1.5a1.51,1.51,0,0,0-1.78.15c-.28.28-.35.71-.57,1-1.13,2.06-3.83,3.05-6.74,2.56a4.77,4.77,0,0,1-3.91-4,10.21,10.21,0,0,1-.14-1.35ZM215.21,31a5.92,5.92,0,0,1,.92-2.55h0a5.81,5.81,0,0,1,5.26-2.56A5.46,5.46,0,0,1,226.85,31Z"
                    fill="#3da6ff"
                  />
                  <path
                    d="M173.37,33.56c1.21.07,1.64-.5,1.64-1.63.07-3.55-1.64-6.61-4.55-7.89-3.41-1.42-6.68-1.27-9.66,1.28-3.34,2.77-3.91,9-1.42,12.86,2.13,3.19,7,4.33,11.08,2.48a6.57,6.57,0,0,0,3.62-4c.29-.57.36-1.28-.35-1.5a1.51,1.51,0,0,0-1.78.15c-.28.28-.35.71-.57,1-1.13,2.06-3.83,3.05-6.74,2.56a4.77,4.77,0,0,1-3.91-4,10.21,10.21,0,0,1-.14-1.35ZM160.52,31a5.92,5.92,0,0,1,.92-2.55h0a5.81,5.81,0,0,1,5.26-2.56A5.46,5.46,0,0,1,172.16,31Z"
                    fill="#4d4d4d"
                    className="dark:fill-[#e0e0e0]"
                  />
                  <path
                    d="M155.4,33.56c1.21.07,1.64-.5,1.64-1.63.07-3.55-1.64-6.61-4.55-7.89-3.41-1.42-6.68-1.27-9.66,1.28-3.34,2.77-3.91,9-1.42,12.86,2.13,3.19,7,4.33,11.08,2.48a6.57,6.57,0,0,0,3.62-4c.29-.57.36-1.28-.35-1.5a1.51,1.51,0,0,0-1.78.15c-.28.28-.35.71-.57,1-1.13,2.06-3.83,3.05-6.74,2.56a4.77,4.77,0,0,1-3.91-4,10.21,10.21,0,0,1-.14-1.35ZM142.55,31a5.92,5.92,0,0,1,.92-2.55h0a5.81,5.81,0,0,1,5.26-2.56A5.49,5.49,0,0,1,154.2,31Z"
                    fill="#4d4d4d"
                    className="dark:fill-[#e0e0e0]"
                  />
                  <path
                    d="M80.4,33.56c1.21.07,1.63-.5,1.63-1.63.07-3.55-1.63-6.61-4.54-7.89-3.41-1.42-6.68-1.27-9.66,1.28-3.34,2.77-3.91,9-1.42,12.86,2.13,3.19,7,4.33,11.08,2.48a6.6,6.6,0,0,0,3.62-4c.28-.57.36-1.28-.36-1.5a1.49,1.49,0,0,0-1.77.15c-.28.28-.36.71-.57,1-1.14,2.06-3.83,3.05-6.75,2.56a4.75,4.75,0,0,1-3.9-4,10.21,10.21,0,0,1-.14-1.35ZM67.54,31a5.88,5.88,0,0,1,.93-2.55h0a5.8,5.8,0,0,1,5.25-2.56A5.46,5.46,0,0,1,79.19,31Z"
                    fill="#3da6ff"
                  />
                  <path
                    d="M97.87,29.51A5.77,5.77,0,0,0,94,23.83a7.7,7.7,0,0,0-7,.5,8.08,8.08,0,0,0-1,.85V25a1.35,1.35,0,1,0-2.7,0V39.81a1.35,1.35,0,0,0,2.7,0V30.65c.07-3,2.2-4.83,5.26-4.76,2.7.07,4,1.63,4,4.76v8.88c0,.92.15,1.49,1.28,1.49s1.35-.71,1.35-1.49C97.87,36.26,97.94,32.92,97.87,29.51Z"
                    fill="#3da6ff"
                  />
                  <path
                    d="M45.38,31.22c-1,8.66-8.16,10.86-14.13,10.15C23.65,40.52,20.38,34.7,21,27.74c.57-7.6,6.32-11.3,13.92-10.59a10.89,10.89,0,0,1,1.5.15c.78.14,1.91.42,1.91.42l-1.2,1.71-.43.71-1.21-.07A9.87,9.87,0,0,0,31.39,20c-5.11.78-7.81,3.76-7.88,9-.07,3.76,1,7,4.69,8.8s7.6,1.78,11.08-.78,4.54-9.09,2.13-13.14l-1.14-1.77,1.14-2.21C45.17,22.91,46,26.89,45.38,31.22Z"
                    fill="#3da6ff"
                  />
                  <path
                    d="M41.34,16.23h0c-3.13,4.41-6.25,8.74-9.52,13.14l-.14.29c-.07.07-.07.14-.15.28-.92,1.28-.85,2.2.29,2.91s2.34.36,3-1c2.28-5,4.55-10.09,6.89-15.2l.93-2.06ZM33.67,31.57a1,1,0,0,1-.72.36.83.83,0,0,1-.85-.85,1,1,0,0,1,.85-.86.81.81,0,0,1,.72.36A1.22,1.22,0,0,1,33.67,31.57Z"
                    fill="#3da6ff"
                  />
                  <path
                    d="M136.08,34.91a5.46,5.46,0,0,1-7.1,3.55c-2.48-.71-3.91-3.12-3.91-6.53,0-4.41,2.77-7.1,6.89-6.61a4.75,4.75,0,0,1,1.14.29C136,26.89,137.43,31.15,136.08,34.91Zm2.42-7A7.72,7.72,0,0,0,131,22.62a8.85,8.85,0,0,0-6,2.28V23.55a.94.94,0,0,0-.92-.93h-.78a.94.94,0,0,0-.92.93V45.92a.93.93,0,0,0,.92.92h.78a.93.93,0,0,0,.92-.92V39.17c4.41,3.84,11.44,2.77,13.5-3.34A11.79,11.79,0,0,0,138.5,27.88Z"
                    fill="#4d4d4d"
                    className="dark:fill-[#e0e0e0]"
                  />
                </g>

                {/* Symbols for Dark Mode Switch */}
                <g id="light-symbol">
                  <path
                    d="M256,108.936c-81.091,0-147.064,65.973-147.064,147.064S174.909,403.064,256,403.064S403.064,337.091,403.064,256
                  S337.091,108.936,256,108.936z M256,370.383c-63.071,0-114.383-51.312-114.383-114.383c0-63.071,51.312-114.383,114.383-114.383
                  c63.071,0,114.383,51.312,114.383,114.383C370.383,319.071,319.071,370.383,256,370.383z"
                  />
                  <path
                    d="M256,83.708c9.024,0,16.34-7.316,16.34-16.34V16.34C272.34,7.316,265.024,0,256,0c-9.024,0-16.34,7.316-16.34,16.34
                  v51.027C239.66,76.391,246.976,83.708,256,83.708z"
                  />
                  <path
                    d="M256,428.292c-9.024,0-16.34,7.316-16.34,16.34v51.027c0,9.024,7.316,16.34,16.34,16.34c9.024,0,16.34-7.316,16.34-16.34
                  v-51.027C272.34,435.609,265.024,428.292,256,428.292z"
                  />
                  <path
                    d="M111.062,134.171c6.38,6.381,16.727,6.381,23.109,0c6.381-6.38,6.381-16.727,0-23.109L98.089,74.981
                  c-6.38-6.381-16.727-6.381-23.109,0c-6.381,6.38-6.381,16.727,0,23.109L111.062,134.171z"
                  />
                  <path
                    d="M400.938,377.829c-6.38-6.381-16.727-6.38-23.109,0c-6.381,6.38-6.381,16.727,0,23.109l36.081,36.082
                  c6.38,6.382,16.727,6.382,23.109,0c6.382-6.38,6.382-16.727,0-23.109L400.938,377.829z"
                  />
                  <path
                    d="M83.708,256c0-9.024-7.316-16.34-16.34-16.34H16.34C7.316,239.66,0,246.976,0,256c0,9.024,7.316,16.34,16.34,16.34
                  h51.027C76.391,272.34,83.708,265.024,83.708,256z"
                  />
                  <path
                    d="M495.66,239.66h-51.027c-9.024,0-16.34,7.316-16.34,16.34c0,9.024,7.316,16.34,16.34,16.34h51.027
                  c9.024,0,16.34-7.316,16.34-16.34C512,246.976,504.684,239.66,495.66,239.66z"
                  />
                  <path
                    d="M111.062,377.829l-36.081,36.082c-6.381,6.382-6.381,16.727,0,23.109c6.38,6.382,16.727,6.383,23.109,0l36.081-36.082
                  c6.381-6.381,6.381-16.727,0-23.109C127.79,371.447,117.443,371.447,111.062,377.829z"
                  />
                  <path
                    d="M400.938,134.171l36.081-36.082c6.382-6.381,6.382-16.727,0-23.109c-6.38-6.381-16.727-6.381-23.109,0l-36.081,36.082
                  c-6.381,6.381-6.381,16.727,0,23.109C384.21,140.552,394.557,140.553,400.938,134.171z"
                  />
                </g>

                <g id="dark-symbol">
                  <path
                    d="M524.8 938.666667h-4.266667a439.893333 439.893333 0 0 1-313.173333-134.4 446.293333 446.293333 0 0 1-11.093333-597.333334 432.213333 432.213333 0 0 1 170.666666-116.906666 42.666667 42.666667 0 0 1 45.226667 9.386666 42.666667 42.666667 0 0 1 10.24 42.666667 358.4 358.4 0 0 0 82.773333 375.893333 361.386667 361.386667 0 0 0 376.746667 82.773334 42.666667 42.666667 0 0 1 54.186667 55.04A433.493333 433.493333 0 0 1 836.266667 810.666667a438.613333 438.613333 0 0 1-311.466667 128z"
                  />
                </g>

                {/* Inner designs */}
                <path id="mainGaugebg" fill="none" d="M64.32,256.41a137,137,0,1,1,192.09-24.8l-.07.09a134.45,134.45,0,0,1-24.71,24.71" />
                <path id="mainGaugeBlue" fill="none" d="M64.32,256.41a137,137,0,1,1,192.09-24.8l-.07.09a134.45,134.45,0,0,1-24.71,24.71" />
                <path id="mainGaugeWhite" fill="none" d="M64.32,256.41a137,137,0,1,1,192.09-24.8l-.07.09a134.45,134.45,0,0,1-24.71,24.71" />
                
                <g id="oDoMeter">
                  <text transform="translate(76.34 264.28) scale(0.9 1)" className="text-[16.6px] fill-gray font-medium">0</text>
                  <text transform="translate(23.81 164.6) scale(0.9 1)" className="text-[16.6px] fill-gray font-medium">.5</text>
                  <text transform="translate(50.01 80.11) scale(0.9 1)" className="text-[16.6px] fill-gray font-medium">1</text>
                  <text transform="translate(140.58 36.04) scale(0.9 1)" className="text-[16.6px] fill-gray font-medium">10</text>
                  <text transform="translate(220.43 79.11) scale(0.9 1)" className="text-[16.6px] fill-gray font-medium">100</text>
                  <text transform="translate(246.71 164.6) scale(0.9 1)" className="text-[16.6px] fill-gray font-medium">500</text>
                  <text className="text-[17px] fill-gray font-medium text-right" transform="translate(220.71 265.99) scale(0.9 1)">1000+</text>
                </g>

                {/* Symbols for layouts */}
                <g id="progressBar-symbol">
                  <path className="fill-[#d2d1d2] dark:fill-black" d="M32.7,4.8a7.81,7.81,0,0,1-4.1,2.8,61.42,61.42,0,0,0-5.7,2.3s-.1.3-.4,1.3-.9.6-.9.6v1.8a6.15,6.15,0,0,1,1.2,1.8,14.72,14.72,0,0,0,.8,1.7h.5c.5,0,.7,1.9.8,3.2s-1.1.8-1.1.8v3.2c0,1.9-.5,2.8-2.3,4.8s-4.7,1.8-4.7,1.8-3.1.1-4.7-1.8-2.3-3-2.3-4.8V21.1s-1.2.5-1.1-.8.3-3.2.8-3.2H10s.3-.6.8-1.7A9.62,9.62,0,0,1,12,13.6V11.8s-.8.4-.9-.6a2.26,2.26,0,0,0-.4-1.3A61.42,61.42,0,0,0,5,7.6,7.41,7.41,0,0,1,.9,4.8C.2,3.6,0,0,0,0H33.4A11.7,11.7,0,0,1,32.7,4.8Z" transform="matrix(0.57, 0, 0, -0.57, 0, 17.49)" />
                  <line className="stroke-[#e7e7e8] dark:stroke-[#202020] stroke-[8px] stroke-linecap-round" x1="28.35" y1="10.5" x2="260" y2="10.5" />
                  <path className="fill-[#d2d1d2] dark:fill-black" d="M0,31.6V21.9H36.8v9.7Zm15.1-6H5.2V28h9.9Zm16.5.3a.9.9,0,1,0,.9.9A.9.9,0,0,0,31.6,25.9Z" transform="matrix(0.58, 0, 0, -0.58, 272.2, 18.38)" />
                  <path className="fill-[#d2d1d2] dark:fill-black" d="M0,20.6V11.1H36.8v9.5Zm15.1-6H5.2v2.2h9.9Zm16.5.2a.9.9,0,1,0,.9.9A.9.9,0,0,0,31.6,14.8Z" transform="matrix(0.58, 0, 0, -0.58, 272.2, 12.38)" />
                  <path className="fill-[#d2d1d2] dark:fill-black" d="M0,9.5V0H36.8V9.5ZM15.1,3.6H5.2V5.9h9.9Zm16.5.2a.9.9,0,1,0,.9.9A.9.9,0,0,0,31.6,3.8Z" transform="matrix(0.58, 0, 0, -0.58, 272.2, 6.38)" />
                </g>

                <g id="downSymbol">
                  <path d="M29.51,15.62H22.66V3.08A2.94,2.94,0,0,0,19.88,0H12.76A2.94,2.94,0,0,0,10,3.08V15.62H3.14l13.18,17.2Z" />
                  <rect y="38.21" width="32.21" height="3.41" />
                </g>

                <g id="upSymbol">
                  <path d="M2.71,26H9.55V38.55a2.93,2.93,0,0,0,2.78,3.07h7.13a2.94,2.94,0,0,0,2.78-3.07V26h6.84L15.89,8.8Z" />
                  <rect width="32.21" height="3.41" />
                </g>

                {/* playButton */}
                <g id="playButton">
                  <rect width="180" height="90" rx="10" ry="10" className="fill-[url(#RadialGradient1)] cursor-pointer" />
                  <text className="text-[40px] fill-white font-medium text-center" x="90" y="60" textAnchor="middle">Start</text>
                </g>

                <g id="settings">
                  <rect fill="transparent" x="0" y="25" width="100" height="50" />
                  <path d="M36.43,29.64,9.29,50,36.43,70.36v6.78L2.5,56.79V43.21L36.43,22.86Z" />
                  <path d="M63.57,70.36,90.71,50,63.57,29.64V22.86L97.5,43.21V56.79L63.57,77.14Z" />
                  <circle cx="29.64" cy="50" r="6.79" />
                  <circle cx="50" cy="50" r="6.79" />
                  <circle cx="70.36" cy="50" r="6.79" />
                </g>

                <g id="ConnectError">
                  <path d="M179.6,235.6c-33.7,10.3-65.5,28.5-92.2,55.1l46.6,46.6c13.9-13.9,30.1-24.8,47.6-32.5L179.6,235.6z" />
                  <path d="M175.8,109C111.3,122,49.9,153.4,0,203.3l46.6,46.6c37.5-37.5,83.1-61.9,131.2-73.7L175.8,109z" />
                  <path d="M313.8,109l-2,67.3c48.1,11.8,93.7,36.2,131.2,73.7l46.6-46.6C439.8,153.4,378.3,122,313.8,109z" />
                  <path d="M307.9,304.8c17.5,7.7,33.7,18.6,47.7,32.6l46.6-46.6c-26.6-26.6-58.5-44.9-92.2-55.2L307.9,304.8z" />
                  <circle cx="244.8" cy="403.2" r="40" />
                  <path d="M260.6,330.4h-31.7c-8.3,0-15.1-6.6-15.3-14.9L206,62.2c-0.3-8.6,6.7-15.8,15.3-15.8h47c8.6,0,15.6,7.1,15.3,15.8l-7.7,253.3C275.7,323.8,268.9,330.4,260.6,330.4z" />
                </g>
              </defs>

              {/* A. DESKTOP SVG VIEW (586 x 346) */}
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

              {/* B. MOBILE SVG VIEW (295.9 x 363.3) */}
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
            </svg>
          </div>
        </div>
      )}

      {/* 3. FOOTER CREDITS (Asli OpenSpeedTest) */}
      <div className="py-4 text-center text-xs text-[#7d7777] font-medium leading-relaxed dark:text-gray-500">
        <a
          href="https://openspeedtest.com?ref=Self-Hosted&Run"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#717171] hover:text-[#14b0fe] transition-colors dark:text-[#a0a0a0] dark:hover:text-[#56c4fb]"
        >
          SpeedTest by OpenSpeedTest™
        </a>{" "}
        is a Free and{" "}
        <a
          href="https://github.com/openspeedtest/Speed-Test"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#717171] hover:text-[#14b0fe] transition-colors dark:text-[#a0a0a0] dark:hover:text-[#56c4fb]"
        >
          Open-Source HTML5 Network Speed Test
        </a>{" "}
        Software.
        <p className="text-[10px] mt-1 text-gray-400 dark:text-gray-600">
          &copy; Copyright 2013-2024 OpenSpeedTest™ All Rights Reserved.
        </p>
      </div>

    </div>
  );
}

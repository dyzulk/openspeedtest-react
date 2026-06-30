import { useState, useEffect } from "react";
import { useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import { useSpeedTestEngine } from "@/hooks/useSpeedTestEngine";
import { SpeedTestDefs } from "@/components/SpeedTestDefs";
import { SpeedTestDesktopView } from "@/components/SpeedTestDesktopView";
import { SpeedTestMobileView } from "@/components/SpeedTestMobileView";
import { SpeedTestFooter } from "@/components/SpeedTestFooter";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Self-Hosted SpeedTest by OpenSpeedTest™" },
    {
      name: "description",
      content: "HTML5 Network Performance Estimation Tool. Self-Hosted SpeedTest by OpenSpeedTest™ powered by React Router v7.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Ambil IP klien dari Cloudflare Header, fallback ke 127.0.0.1 jika local development
  const clientIP = request.headers.get("CF-Connecting-IP") || "127.0.0.1";
  return { clientIP };
}

export default function Home() {
  const { clientIP } = useLoaderData<typeof loader>();
  const { state, startTest, toggleIPVisibility } = useSpeedTestEngine(clientIP);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Sinkronisasi cookie mode dan prefers-color-scheme sistem operasi
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

  return (
    <div className="relative flex flex-col justify-between w-full h-full min-h-screen select-none font-sans bg-white dark:bg-[#181818] transition-colors duration-300">
      {/* 1. SPINNER LOADING APP */}
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
              <SpeedTestDefs />
              
              <SpeedTestDesktopView
                state={state}
                isDark={isDark}
                toggleTheme={toggleTheme}
                startTest={startTest}
                toggleIPVisibility={toggleIPVisibility}
              />

              <SpeedTestMobileView
                state={state}
                isDark={isDark}
                toggleTheme={toggleTheme}
                startTest={startTest}
                toggleIPVisibility={toggleIPVisibility}
              />
            </svg>
          </div>
        </div>
      )}

      {/* 3. FOOTER CREDITS */}
      <SpeedTestFooter />
    </div>
  );
}

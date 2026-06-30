import { useState, useEffect, useRef } from "react";
import { useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import { useSpeedTestEngine } from "@/hooks/useSpeedTestEngine";
import { SpeedTestDOMAdapter } from "@/services/speedtestDOMAdapter";
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
  const { state, startTest, resetTest, toggleIPVisibility } = useSpeedTestEngine(clientIP);
  
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const [isDark, setIsDark] = useState(false);
  
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<SpeedTestDOMAdapter | null>(null);

  // 1. Fetch Raw SVG saat mount
  useEffect(() => {
    fetch("/assets/images/app.svg")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load SVG");
        return res.text();
      })
      .then((text) => {
        setSvgMarkup(text);
      })
      .catch((err) => console.error("Error fetching app.svg:", err));
  }, []);

  // 2. Membaca dan mensinkronisasikan cookie skin / OS preference
  useEffect(() => {
    const modeCookie = document.cookie.match("(^|;)\\s*mode\\s*=\\s*([^;]+)")?.pop();
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = modeCookie === "dark" || (!modeCookie && prefersDark);

    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      document.cookie = "mode=dark; path=/; max-age=31536000";
    } else {
      document.documentElement.classList.remove("dark");
      document.cookie = "mode=light; path=/; max-age=31536000";
    }
  };

  // 3. Inisialisasi Jembatan / Adapter DOM setelah SVG terinjeksi
  useEffect(() => {
    if (!svgMarkup || !svgContainerRef.current) return;

    const svgElement = svgContainerRef.current.querySelector("svg");
    if (svgElement) {
      const adapter = new SpeedTestDOMAdapter(svgElement);
      adapterRef.current = adapter;

      // Hubungkan event klik SVG ke callback React
      adapter.bindEvents({
        startTest,
        toggleTheme,
        toggleIPVisibility,
      });

      // Pemicu inisialisasi visual stage pertama
      adapter.updateStage(state.stage, isDark);
      adapter.updateResults(state);
      adapter.updateSpeed(state.currentSpeed, state.stage, state.gaugeOffset);
      adapter.updateProgress(state.progress);
    }
  }, [svgMarkup]);

  // 4. Sinkronisasi state engine ke DOM SVG melalui Adapter
  useEffect(() => {
    if (!adapterRef.current) return;

    adapterRef.current.updateStage(state.stage, isDark);
    adapterRef.current.updateResults(state);
    adapterRef.current.updateSpeed(state.currentSpeed, state.stage, state.gaugeOffset);
    adapterRef.current.updateProgress(state.progress);
  }, [state, isDark]);

  const isLoading = state.stage === "loading" || !svgMarkup;

  return (
    <div className="relative flex flex-col justify-between w-full h-full min-h-screen select-none font-sans bg-white dark:bg-[#181818] transition-colors duration-300">
      {/* A. Loader Spinner asli */}
      {isLoading ? (
        <div className="ost-spinner">
          <div className="bounce1"></div>
          <div className="bounce2"></div>
          <div className="bounce3"></div>
        </div>
      ) : (
        /* B. Area Injeksi SVG Kontainer */
        <div className="flex flex-col items-center justify-center flex-grow p-4">
          <div
            ref={svgContainerRef}
            className="w-full max-w-[586px] aspect-[586/363] [&>svg]:w-full [&>svg]:h-full [&>svg]:overflow-hidden [&>svg]:block"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        </div>
      )}

      {/* C. Footer Kredit */}
      <SpeedTestFooter />
    </div>
  );
}

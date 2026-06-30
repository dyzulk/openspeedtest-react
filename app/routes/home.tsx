import { useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import { useSpeedTestEngine } from "@/hooks/useSpeedTestEngine";
import { SpeedTestUI } from "@/components/SpeedTestUI";

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

  return (
    <SpeedTestUI
      state={state}
      startTest={startTest}
      resetTest={resetTest}
      toggleIPVisibility={toggleIPVisibility}
    />
  );
}

import gsap from "gsap";
import { getNonlinearOffset } from "./speedtestUtils";
import type { EngineState, TestStage } from "@/hooks/useSpeedTestEngine";

export class SpeedTestDOMAdapter {
  private svg: SVGSVGElement;

  constructor(svgElement: SVGSVGElement) {
    this.svg = svgElement;
  }

  /**
   * Menghubungkan elemen interaktif SVG ke callback React
   */
  public bindEvents(callbacks: {
    startTest: () => void;
    toggleTheme: () => void;
    toggleIPVisibility: () => void;
  }) {
    // Tombol Start
    const startDesk = this.svg.getElementById("startButtonDesk") as SVGElement | null;
    const startMob = this.svg.getElementById("startButtonMob") as SVGElement | null;
    if (startDesk) startDesk.onclick = callbacks.startTest;
    if (startMob) startMob.onclick = callbacks.startTest;

    // Tombol Settings (IP toggle)
    const settings = this.svg.getElementById("settings") as SVGElement | null;
    if (settings) settings.onclick = callbacks.toggleIPVisibility;

    // Tombol Tema (Switch Day/Night)
    const dayMode = this.svg.getElementById("daymode") as SVGElement | null;
    const nightMode = this.svg.getElementById("nightmode") as SVGElement | null;
    const dayModeMob = this.svg.getElementById("daymode-Mob") as SVGElement | null;
    const nightModeMob = this.svg.getElementById("nightmode-Mob") as SVGElement | null;

    const onThemeClick = (e: Event) => {
      e.stopPropagation();
      callbacks.toggleTheme();
    };

    if (dayMode) dayMode.onclick = onThemeClick;
    if (nightMode) nightMode.onclick = onThemeClick;
    if (dayModeMob) dayModeMob.onclick = onThemeClick;
    if (nightModeMob) nightModeMob.onclick = onThemeClick;
  }

  /**
   * Menampilkan/menyembunyikan panel berdasarkan fase pengujian (stage)
   */
  public updateStage(stage: TestStage, isDark: boolean) {
    const isIntro = stage === "intro";
    const isTestingOrDone = ["ui", "ping", "download", "upload", "done", "error"].includes(stage);

    const introDesk = this.svg.getElementById("intro-Desk");
    const introMob = this.svg.getElementById("intro-Mob");
    const uiDesk = this.svg.getElementById("UI-Desk");
    const uiMob = this.svg.getElementById("UI-Mob");

    // Efek transisi halus transisi panel menggunakan GSAP
    if (introDesk) gsap.to(introDesk, { opacity: isIntro ? 1 : 0, duration: 0.3, display: isIntro ? "block" : "none" });
    if (introMob) gsap.to(introMob, { opacity: isIntro ? 1 : 0, duration: 0.3, display: isIntro ? "block" : "none" });
    if (uiDesk) gsap.to(uiDesk, { opacity: isTestingOrDone ? 1 : 0, duration: 0.3, display: isTestingOrDone ? "block" : "none" });
    if (uiMob) gsap.to(uiMob, { opacity: isTestingOrDone ? 1 : 0, duration: 0.3, display: isTestingOrDone ? "block" : "none" });

    // Sinkronisasi icon matahari/bulan di layar intro
    const dayMode = this.svg.getElementById("daymode") as SVGElement | null;
    const nightMode = this.svg.getElementById("nightmode") as SVGElement | null;
    const dayModeMob = this.svg.getElementById("daymode-Mob") as SVGElement | null;
    const nightModeMob = this.svg.getElementById("nightmode-Mob") as SVGElement | null;

    if (dayMode) dayMode.style.display = isDark ? "none" : "inline-block";
    if (nightMode) nightMode.style.display = isDark ? "inline-block" : "none";
    if (dayModeMob) dayModeMob.style.display = isDark ? "none" : "inline-block";
    if (nightModeMob) nightModeMob.style.display = isDark ? "inline-block" : "none";

    // Mengontrol visibilitas ikon sub-fase (download/upload/error)
    const isDl = stage === "download";
    const isUl = stage === "upload";
    const isErr = stage === "error";

    const dlDesk = this.svg.getElementById("downSymbolDesk") as SVGElement | null;
    const ulDesk = this.svg.getElementById("upSymbolDesk") as SVGElement | null;
    const errDesk = this.svg.getElementById("ConnectErrorDesk") as SVGElement | null;

    const dlMob = this.svg.getElementById("downSymbolMob") as SVGElement | null;
    const ulMob = this.svg.getElementById("upSymbolMob") as SVGElement | null;
    const errMob = this.svg.getElementById("ConnectErrorMob") as SVGElement | null;

    if (dlDesk) dlDesk.style.display = isDl ? "block" : "none";
    if (ulDesk) ulDesk.style.display = isUl ? "block" : "none";
    if (errDesk) errDesk.style.display = isErr ? "block" : "none";

    if (dlMob) dlMob.style.display = isDl ? "block" : "none";
    if (ulMob) ulMob.style.display = isUl ? "block" : "none";
    if (errMob) errMob.style.display = isErr ? "block" : "none";
  }

  /**
   * Mengupdate angka kecepatan dan merotasi jarum gauge menggunakan GSAP
   */
  public updateSpeed(speed: number, stage: TestStage, gaugeOffset: number) {
    const liveText = this.svg.getElementById("oDoLiveSpeed");
    if (liveText) {
      if (stage === "ping") {
        liveText.textContent = "..."; // Atau ping value jika mengikut app-2.5.4.js
      } else if (speed === 0) {
        liveText.textContent = "...";
      } else {
        liveText.textContent = speed < 1 ? speed.toFixed(3) : speed.toFixed(1);
      }
    }

    // Animasi putaran jarum speedometer biru dan putih
    const blueDesk = this.svg.getElementById("mainGaugeBlue-Desk");
    const whiteDesk = this.svg.getElementById("mainGaugeWhite-Desk");
    const blueMob = this.svg.getElementById("mainGaugeBlue-Mob");
    const whiteMob = this.svg.getElementById("mainGaugeWhite-Mob");

    const elements = [blueDesk, blueMob].filter(Boolean);
    const whiteElements = [whiteDesk, whiteMob].filter(Boolean);

    if (elements.length > 0) {
      gsap.to(elements, {
        strokeDashoffset: gaugeOffset,
        duration: 0.15,
        ease: "power1.out",
      });
    }

    if (whiteElements.length > 0) {
      gsap.to(whiteElements, {
        strokeDashoffset: gaugeOffset === 0 ? 1 : gaugeOffset + 1,
        duration: 0.15,
        ease: "power1.out",
      });
    }
  }

  /**
   * Mengupdate progress bar
   */
  public updateProgress(progress: number) {
    const progressDesk = this.svg.getElementById("progressStatus-Desk");
    const progressMob = this.svg.getElementById("progressStatus-Mob");
    const elements = [progressDesk, progressMob].filter(Boolean);

    if (elements.length > 0) {
      gsap.to(elements, {
        strokeDashoffset: progress,
        duration: 0.1,
        ease: "power1.out",
      });
    }
  }

  /**
   * Mengupdate data hasil pada kartu panel
   */
  public updateResults(state: EngineState) {
    // Status Text
    const statusText = this.svg.getElementById("oDoLiveStatus");
    if (statusText) statusText.textContent = state.statusText;

    // IP Address
    const ipDesk = this.svg.getElementById("ipDesk") as SVGElement | null;
    const ipMob = this.svg.getElementById("ipMob") as SVGElement | null;
    const ipElements = [ipDesk, ipMob].filter(Boolean);

    ipElements.forEach((el) => {
      if (el) {
        el.style.display = state.showIP ? "block" : "none";
        el.textContent = state.showIP ? state.ipAddress : "";
      }
    });

    // Download Speed Card
    const downResult = this.svg.getElementById("downResult");
    if (downResult) {
      downResult.textContent = state.downloadSpeed !== null
        ? (state.downloadSpeed < 1 ? state.downloadSpeed.toFixed(3) : state.downloadSpeed.toFixed(1))
        : "---";
    }

    // Upload Speed Card
    const upRestxt = this.svg.getElementById("upRestxt");
    if (upRestxt) {
      upRestxt.textContent = state.uploadSpeed !== null
        ? (state.uploadSpeed < 1 ? state.uploadSpeed.toFixed(3) : state.uploadSpeed.toFixed(1))
        : "---";
    }

    // Ping Card
    const pingResult = this.svg.getElementById("pingResult");
    const pingMobres = this.svg.getElementById("pingMobres");
    const pingVal = state.ping !== null ? Math.floor(state.ping).toString() : "--";
    if (pingResult) pingResult.textContent = pingVal;
    if (pingMobres) pingMobres.textContent = pingVal;

    // Jitter Card
    const jitterDesk = this.svg.getElementById("jitterDesk");
    const jitterResultms = this.svg.getElementById("JitterResultms");
    const jitterVal = state.jitter !== null ? Math.floor(state.jitter).toString() : "--";
    if (jitterDesk) jitterDesk.textContent = jitterVal;
    if (jitterResultms) jitterResultms.textContent = jitterVal;

    // Graphs Polygon Points
    const graphc1 = this.svg.getElementById("graphc1"); // Desktop DL
    const graphc2 = this.svg.getElementById("graphc2"); // Desktop UL
    const graphMob1 = this.svg.getElementById("graphMob1"); // Mobile DL
    const graphMob2 = this.svg.getElementById("graphMob2"); // Mobile UL

    if (state.stage === "download") {
      if (graphc1) graphc1.setAttribute("points", state.dlGraphPoints);
      if (graphMob1) graphMob1.setAttribute("points", state.dlGraphPoints);
    } else if (state.stage === "upload") {
      if (graphc2) graphc2.setAttribute("points", state.ulGraphPoints);
      if (graphMob2) graphMob2.setAttribute("points", state.ulGraphPoints);
    } else if (state.stage === "ui") {
      // Reset graphs
      const emptyGraph = "0,50 130,50";
      if (graphc1) graphc1.setAttribute("points", emptyGraph);
      if (graphc2) graphc2.setAttribute("points", emptyGraph);
      if (graphMob1) graphMob1.setAttribute("points", emptyGraph);
      if (graphMob2) graphMob2.setAttribute("points", emptyGraph);
    }
  }
}

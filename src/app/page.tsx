import { prisma } from "@/lib/prisma";
import LiveOceanHero from "@/components/landing/LiveOceanHero";
import ThreeDTitle from "@/components/landing/ThreeDTitle";
import SetSailButton from "@/components/landing/SetSailButton";
import Chronometer from "@/components/landing/Chronometer";
import AudioAmbientToggle from "@/components/landing/AudioAmbientToggle";
import DayEveningToggle from "@/components/landing/DayEveningToggle";

async function getSystemConfig() {
  try {
    const config = await prisma.systemConfig.findFirst();
    return {
      startTime:
        config?.startTime?.toISOString() ||
        new Date(Date.now() + 86400000).toISOString(),
      endTime:
        config?.endTime?.toISOString() ||
        new Date(Date.now() + 86400000 * 3).toISOString(),
      competitionState: config?.competitionState || "UPCOMING",
    };
  } catch (error) {
    console.error("Failed to fetch system config:", error);
    return {
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 3).toISOString(),
      competitionState: "UPCOMING",
    };
  }
}

export const dynamic = "force-dynamic";

/**
 * FIND X — interactive, hardware-accelerated Live Ocean pirate landing.
 */
export default async function LandingPage() {
  const config = await getSystemConfig();
  const countdownTarget =
    config.competitionState === "UPCOMING" ? config.startTime : config.endTime;
  const countdownLabel =
    config.competitionState === "UPCOMING" ? "The Hunt Begins In" : "The Hunt Ends In";

  return (
    <section className="relative h-screen w-screen min-h-[550px] select-none overflow-hidden bg-[#0c0805]">
      {/* 1. Hardware-accelerated WebGL + Canvas 2D Live Ocean Hero */}
      <div className="absolute inset-0 z-0">
        <LiveOceanHero
          className="w-full h-full"
          bgSrc="/assets/bg_seamless.png"
          shipSrc="/assets/ship_cutout.png"
          posterSrc="/assets/bg_seamless.png"
          initialWaveStrength={1.0}
          initialSpeed={1.0}
          initialLightingMode={0}
          showControls={false}
        />
      </div>

      {/* 2. Cinematic gradient vignette overlay matching dashboard & ocean palette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0c0805]/92 via-[#140d08]/25 to-[#1c120a]/40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(12,8,5,0.75)_100%)]"
      />

      {/* 3. Streamlined UI overlay layer */}
      <div className="pointer-events-none relative z-20 flex h-full flex-col items-center justify-between px-6 py-8">
        {/* Top: Day/Evening toggle and ambient audio / sound toggle */}
        <header className="flex w-full items-center justify-end gap-3">
          <div className="pointer-events-auto">
            <DayEveningToggle />
          </div>
          <div className="pointer-events-auto">
            <AudioAmbientToggle />
          </div>
        </header>

        {/* Center: Heroic Title + Set Sail CTA */}
        <div className="flex flex-col items-center justify-center text-center my-auto">
          <div className="pointer-events-auto relative w-full max-w-3xl">
            <ThreeDTitle />
          </div>
          <div className="pointer-events-auto mt-4 sm:mt-6">
            <SetSailButton />
          </div>
        </div>

        {/* Bottom: chronometer */}
        <footer className="pointer-events-auto flex justify-center pb-2">
          <Chronometer targetDate={countdownTarget} label={countdownLabel} />
        </footer>
      </div>
    </section>
  );
}


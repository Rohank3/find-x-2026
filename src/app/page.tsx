import { getEffectiveSystemConfig } from "@/lib/competition";
import ThreeDTitle from "@/components/landing/ThreeDTitle";
import SetSailButton from "@/components/landing/SetSailButton";
import Chronometer from "@/components/landing/Chronometer";
import AudioAmbientToggle from "@/components/landing/AudioAmbientToggle";
import DayEveningToggle from "@/components/landing/DayEveningToggle";
import Link from "next/link";
import { Compass } from "@/components/icons";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getSystemConfig() {
  try {
    const config = await getEffectiveSystemConfig();
    return {
      startTime: config?.startTime ? config.startTime.toISOString() : null,
      freezeTime: config?.freezeTime ? config.freezeTime.toISOString() : null,
      endTime: config?.endTime ? config.endTime.toISOString() : null,
      competitionState: config?.competitionState || "UPCOMING",
    };
  } catch (error) {
    console.error("Failed to fetch system config:", error);
    return {
      startTime: null,
      freezeTime: null,
      endTime: null,
      competitionState: "UPCOMING",
    };
  }
}

export const dynamic = "force-dynamic";

/**
 * FIND X — interactive, hardware-accelerated Live Ocean pirate landing.
 */
export default async function LandingPage() {
  const session = await getServerSession(authOptions).catch(() => null);

  const config = await getSystemConfig();

  let countdownTarget: string | null = null;
  let countdownLabel = "The Hunt Begins In";
  let isEnded = false;

  if (config.competitionState === "UPCOMING") {
    countdownTarget = config.startTime;
    countdownLabel = "The Hunt Begins In";
  } else if (config.competitionState === "LIVE" || config.competitionState === "FROZEN") {
    countdownTarget = config.endTime;
    countdownLabel = "The Hunt Ends In";
  } else if (config.competitionState === "ENDED") {
    countdownTarget = config.endTime || config.startTime;
    countdownLabel = "The Hunt Has Concluded";
    isEnded = true;
  }

  return (
    <section className="relative h-screen w-screen min-h-[550px] select-none overflow-hidden bg-transparent">
      {/* Streamlined UI overlay layer — ocean hero is rendered persistently in RootLayout */}
      <div className="pointer-events-none relative z-20 flex h-full w-full flex-col items-center justify-between p-4 sm:p-6 md:p-8">
        {/* Top: Header with Return to Deck at leftmost corner and Day/Evening + Sound toggle at rightmost corner */}
        <header className="flex w-full items-center justify-between gap-3">
          <div className="pointer-events-auto">
            {session?.user && (
              <Link
                href="/dashboard"
                className="group inline-flex h-10 sm:h-11 items-center gap-2 sm:gap-2.5 px-3.5 sm:px-5 rounded-full border border-amber-400/40 bg-black/60 backdrop-blur-2xl text-amber-300 hover:text-amber-200 hover:border-amber-400/80 transition-all shadow-xl text-xs font-[family-name:var(--font-bangers)] uppercase tracking-wider active:scale-95"
              >
                <Compass className="h-4 w-4 text-amber-400 group-hover:rotate-45 transition-transform" />
                <span className="hidden sm:inline">Return to Deck</span>
                <span className="sm:hidden">Deck</span>
              </Link>
            )}
          </div>
          <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-3 ml-auto">
            <DayEveningToggle />
            <AudioAmbientToggle />
          </div>
        </header>

        {/* Center: Heroic Title + Set Sail CTA */}
        <div className="flex flex-col items-center justify-center text-center my-auto">
          <div className="pointer-events-auto relative w-full max-w-3xl">
            <ThreeDTitle />
          </div>
          <div className="pointer-events-auto mt-4 sm:mt-6">
            <SetSailButton competitionState={config.competitionState} />
          </div>
        </div>

        {/* Bottom: chronometer */}
        <footer className="pointer-events-auto flex justify-center pb-4 sm:pb-2">
          <Chronometer
            targetDate={countdownTarget}
            label={countdownLabel}
            isEnded={isEnded}
            competitionState={config.competitionState}
          />
        </footer>
      </div>
    </section>
  );
}

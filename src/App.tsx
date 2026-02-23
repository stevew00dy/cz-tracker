import {
  Zap,
  RotateCcw,
  Play,
  Check,
  DoorOpen,
  Rocket,
  Shield,
  Map,
} from "lucide-react";
import {
  useHangarTimer,
  useVaultDoor,
  useCompBoards,
  useShipTracker,
  useSimpleTimers,
  useSupervisorCards,
  formatTime,
} from "./hooks";

const ZONE_NAMES: Record<string, string> = { checkmate: "Checkmate", orbituary: "Orbituary", ruin: "Ruin Station" };

/* ─── Intro ─── */

const STAGES = [
  { step: 1, title: "Supervisor Keycards", desc: "Visit PYAM-SUPVISR outposts to print red keycards needed for locked areas in each zone." },
  { step: 2, title: "Checkmate", desc: "Contested zone — collect compboards from the Hangar Area, Server Room, and behind the Red Door." },
  { step: 3, title: "Orbituary", desc: "Contested zone — collect compboards from the Storage Bay and behind Fuse/Blue Doors." },
  { step: 4, title: "Ruin Station", desc: "Contested zone — collect compboards from the Crypt and behind the Vault (Timer Door)." },
  { step: 5, title: "Executive Hangar", desc: "Wait for the green phase, then insert all 7 compboards into the terminal and claim your ship." },
];

function IntroSection({ stagesDone, execBlocked }: { stagesDone: Record<number, boolean>; execBlocked: boolean }) {
  return (
    <section className="card">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold mb-1">How It Works</h2>
        <p className="text-xs text-text-muted">5 stages to claim a ship from the Executive Hangar</p>
      </div>
      <div className="flex gap-3">
        {STAGES.map((s) => {
          const done = !!stagesDone[s.step];
          const blocked = s.step === 5 && execBlocked;
          const borderClass = done
            ? "border-accent-green/40 bg-accent-green/5"
            : blocked
              ? "border-accent-red/40 bg-accent-red/5"
              : "border-dark-700 bg-dark-900/50";
          const circleClass = done
            ? "bg-accent-green/20 text-accent-green"
            : blocked
              ? "bg-accent-red/20 text-accent-red"
              : "bg-accent-amber/20 text-accent-amber";
          return (
            <div key={s.step} className={`flex-1 rounded-xl border ${borderClass} p-3 text-center transition-all duration-300`}>
              <div className={`w-7 h-7 rounded-full ${circleClass} text-xs font-black flex items-center justify-center mx-auto mb-2`}>
                {done ? <Check className="w-3.5 h-3.5" /> : s.step}
              </div>
              <h3 className="text-sm font-semibold">{s.title}</h3>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Executive Hangar ─── */

function HangarSection({ compboards, hangar }: { compboards: ReturnType<typeof useCompBoards>; hangar: ReturnType<typeof useHangarTimer> }) {
  const { isGreen, remaining, progress, sync, ledsLit, changeAtStr } = hangar;
  const { boards, toggle, collected, total, resetAll, getRemaining, startTimer, resetTimer } = compboards;

  return (
    <section className="space-y-4">
      <div style={{ display: "flex", gap: "1rem", alignItems: "stretch" }}>
        {/* Left — Timer + LEDs + Sync */}
        <div style={{ flex: "1 1 50%", minWidth: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Phase Card */}
          <div className={`card border-2 ${isGreen ? "border-accent-green" : "border-accent-red"} text-center relative overflow-hidden`}>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: isGreen
                  ? "radial-gradient(circle at 50% 50%, rgba(16,185,129,0.15) 0%, transparent 70%)"
                  : "radial-gradient(circle at 50% 50%, rgba(239,68,68,0.15) 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${isGreen ? "bg-accent-green/20 text-accent-green" : "bg-accent-red/20 text-accent-red"}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${isGreen ? "bg-accent-green animate-glow-green" : "bg-accent-red animate-glow-red"}`} />
                {isGreen ? "GREEN PHASE — HANGAR OPEN" : "RED PHASE — HANGAR CLOSED"}
              </div>

              <p className="text-text-dim text-sm mb-1">
                {isGreen ? "Insert boards now!" : "Waiting for hangar to open..."}
              </p>
              <p className={`text-xs mb-3 ${isGreen ? "text-accent-green" : "text-accent-red"}`}>
                {isGreen ? "Time Remaining" : "Time Until Opening"}
              </p>

              <div className={`font-mono text-5xl sm:text-6xl font-black tracking-tight mb-1 ${isGreen ? "text-accent-green text-glow" : "text-accent-red text-glow"}`}>
                {formatTime(remaining)}
              </div>

              <p className="text-sm text-text-dim mb-4">
                {isGreen ? "Closes" : "Opens"} at{" "}
                <span className="text-accent-blue font-semibold">{changeAtStr}</span>
              </p>

              <div className="w-full bg-dark-800 rounded-full h-2 mb-1 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${isGreen ? "bg-accent-green" : "bg-accent-red"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-text-muted">Cycle Progress: {Math.round(progress)}%</p>
            </div>

            {/* Sync icon — top right */}
            <button
              onClick={sync}
              title="Sync timer — click the moment you see the hangar open in-game"
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-dark-800/80 border border-dark-600 flex items-center justify-center text-text-muted hover:text-accent-amber hover:border-accent-amber/40 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* LEDs + cycle info */}
          <div className="card py-4">
            <div className="flex items-center justify-center gap-4 sm:gap-6 mb-3">
              {[1, 2, 3, 4, 5].map((i) => {
                const isLit = i <= ledsLit;
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full transition-all duration-500 ${
                      isLit
                        ? "bg-accent-green shadow-lg shadow-accent-green/80 animate-glow-green"
                        : "bg-dark-700 border border-dark-600"
                    }`} />
                    <span className={`text-[10px] font-medium ${isLit ? "text-accent-green" : "text-text-muted"}`}>
                      {isLit ? "ON" : "OFF"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-text-dim text-xs text-center">
              185-minute cycle: <span className="text-accent-green font-semibold">Green (65 min open)</span> &rarr; <span className="text-accent-red font-semibold">Red (120 min closed)</span>
            </p>
          </div>

          {/* Vault Door */}
          <VaultDoorCard />

        </div>

        {/* Right — Compboard Checklist */}
        <div style={{ flex: "1 1 50%", minWidth: 0 }} className="card flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider">Compboards</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => { if (window.confirm("Reset all compboards?")) resetAll(); }} className="text-text-muted hover:text-accent-red text-[10px] flex items-center gap-1 transition-colors">
                <RotateCcw className="w-2.5 h-2.5" /> Reset
              </button>
              <div className="text-right">
                <span className={`font-mono text-xl font-black ${collected === total ? "text-accent-green" : "text-text"}`}>{collected}</span>
                <span className="text-text-muted text-sm">/{total}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {(["checkmate", "orbituary", "ruin"] as const).map((zone) => (
              <div key={zone} className="space-y-1.5">
                {boards.filter((b) => b.zone === zone).map((b) => {
                  const rem = getRemaining(b.id);
                  const running = rem !== null && rem > 0;
                  return (
                <div
                  key={b.id}
                  onClick={() => toggle(b.id)}
                  className={`w-full rounded-lg border ${b.collected ? "border-accent-green/30 bg-accent-green/5" : running ? "border-accent-blue/30 bg-accent-blue/5" : "border-dark-700 bg-dark-900/50"} px-4 py-3 flex flex-nowrap items-center transition-all duration-200 text-left hover:border-accent-green/50 cursor-pointer`}
                  style={{ display: "grid", gridTemplateColumns: "2rem 1fr 1fr 1fr 5rem", alignItems: "center", gap: "0.5rem" }}
                >
                  <div className="w-7 h-7 rounded-full border-2 border-dark-600 flex items-center justify-center">
                    {b.collected ? (
                      <div className="w-6 h-6 rounded-full bg-accent-green flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-dark-950" />
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-text-muted">{b.id}</span>
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${b.collected ? "text-accent-green line-through opacity-60" : "text-text-secondary"}`}>
                    {b.label}
                  </span>
                  <span className="text-sm text-text-muted">{ZONE_NAMES[b.zone]}</span>
                  {b.keycard ? (
                    <span className="flex items-center gap-1.5">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${b.keycard === "red" ? "bg-accent-red" : b.keycard === "blue" ? "bg-accent-blue" : "bg-accent-amber"}`} />
                      <span className={`text-sm ${b.keycard === "red" ? "text-accent-red" : b.keycard === "blue" ? "text-accent-blue" : "text-accent-amber"}`}>
                        {b.keycard === "crypt" ? "Crypt" : b.keycard === "red" ? "Red" : "Blue"} Keycard
                      </span>
                    </span>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {running ? (
                      <>
                        <span className="font-mono text-xs font-bold text-accent-blue">{formatTime(rem!)}</span>
                        <button onClick={() => resetTimer(b.id)} className="text-text-muted hover:text-text-secondary transition-colors">
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startTimer(b.id)} className="rounded px-2.5 py-1 bg-dark-700 hover:bg-dark-600 text-text-muted text-xs flex items-center gap-1 transition-colors">
                        <Play className="w-3 h-3" /> Timer
                      </button>
                    )}
                  </div>
                </div>
                  );
                })}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─── Supervisor Red Keycards ─── */

function SupervisorSection({ supervisorCards }: { supervisorCards: ReturnType<typeof useSupervisorCards> }) {
  const { start, reset, getRemaining } = useSimpleTimers("cz-supervisor", ["sv-34", "sv-35"]);
  const { toggle, isCollected } = supervisorCards;

  const printers = [
    { id: "sv-34", label: "PYAM-SUPVISR-3-4" },
    { id: "sv-35", label: "PYAM-SUPVISR-3-5" },
  ];

  return (
    <section className="card">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-5 h-5 text-accent-red" />
        <h2 className="text-lg font-bold">Supervisor Red Keycards</h2>
      </div>
      <p className="text-sm text-text-dim mb-4">
        You need a red keycard to access certain locked areas. These are found at Supervisor Outposts — not inside the contested zones.
      </p>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        {printers.map((p) => {
          const got = isCollected(p.id);
          const rem = getRemaining(p.id);
          const running = rem !== null && rem > 0;
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              style={{ flex: "1 1 50%" }}
              className={`rounded-xl border ${got ? "border-accent-green/40 bg-accent-green/5" : "border-dark-700 bg-dark-900/50"} p-4 transition-all duration-300 text-left`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-sm font-semibold ${got ? "text-accent-green" : "text-accent-red"}`}>{p.label}</h3>
                {got && <Check className="w-4 h-4 text-accent-green" />}
              </div>
              <div className="flex items-center justify-between">
                {running ? (
                  <>
                    <span className="font-mono text-lg font-bold text-accent-red">{formatTime(rem!)}</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); reset(p.id); }}
                      className="text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-xs text-text-muted">30 min cooldown</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); start(p.id); }}
                      className="rounded-lg px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-text-secondary text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3" /> Timer
                    </span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Zone Compboard Timers ─── */

function VaultDoorCard() {
  const vault = useVaultDoor();

  return (
    <div className="card" style={{ flex: 1 }}>
      <div className="flex items-center gap-2 mb-3">
        <DoorOpen className="w-4 h-4 text-accent-amber" />
        <h3 className="text-sm font-bold">Ruin Station — Vault Door</h3>
        <span className="text-xs text-text-muted">· Opens 1 min, closed 20 min (repeating)</span>
      </div>
      {vault.synced ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`font-mono text-xl font-bold ${vault.isOpen ? "text-accent-green" : "text-accent-red"}`}>
              {vault.isOpen ? "OPEN" : "CLOSED"}
            </span>
            <span className="text-text-dim font-mono text-sm">{formatTime(vault.remaining)}</span>
          </div>
          <button onClick={vault.reset} className="text-text-muted hover:text-text-secondary transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div>
          <p className="text-accent-amber font-mono text-sm font-bold mb-1">UNKNOWN</p>
          <p className="text-[10px] text-text-muted mb-2">Click when you see the vault door open.</p>
          <button
            onClick={vault.sync}
            className="rounded-lg px-3 py-1.5 bg-accent-amber/10 border border-amber-500/30 text-accent-amber text-xs font-semibold hover:bg-accent-amber/20 transition-all"
          >
            Door Opened Now
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Ship Tracker ─── */

function ShipTracker() {
  const { ships, toggle, resetAll, claimed, total } = useShipTracker();

  const grouped = [
    "F8C Lightning",
    "F7A Hornet Mk II",
    "Corsair",
    "Cutlass Black",
    "Syulen",
  ];

  return (
    <section className="card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Rocket className="w-6 h-6 text-accent-amber" /> Ship Rewards
          </h2>
          <p className="text-xs text-text-muted">Track which ships and variants you've claimed</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { if (window.confirm("Reset all claimed ships?")) resetAll(); }} className="text-text-muted hover:text-accent-red text-xs flex items-center gap-1 transition-colors">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
          <div className="text-right">
            <span className={`font-mono text-3xl font-black ${claimed === total ? "text-accent-green" : "text-text"}`}>{claimed}</span>
            <span className="text-text-muted text-lg">/{total}</span>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Claimed</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {grouped.map((shipName) => {
          const variants = ships.filter((s) => s.ship === shipName);
          const allClaimed = variants.every((v) => v.claimed);
          return (
            <div key={shipName} className={`rounded-xl border ${allClaimed ? "border-accent-green/30 bg-accent-green/5" : "border-dark-700 bg-dark-900/50"} px-4 py-3 flex items-center justify-between gap-3 transition-all duration-200`}>
              <h3 className={`font-semibold shrink-0 ${allClaimed ? "text-accent-green" : "text-text-secondary"}`}>{shipName}</h3>
              <div className="flex items-center gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => toggle(v.id)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      v.claimed
                        ? "border-accent-green/40 bg-accent-green/10 text-accent-green"
                        : "border-dark-600 bg-dark-800 text-text-dim hover:border-accent-blue/30 hover:bg-dark-700"
                    }`}
                  >
                    {v.claimed ? (
                      <Check className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-dark-600 shrink-0" />
                    )}
                    <span className="capitalize">{v.variant}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}

/* ─── Maps ─── */

const MAPS = [
  { id: "checkmate", title: "Checkmate", credit: "Terada" },
  { id: "orbituary", title: "Orbituary", credit: "Terada" },
  { id: "ruin", title: "Ruin Station", credit: "Terada" },
  { id: "executive-hangar", title: "Executive Hangar", credit: "u/Kerast" },
  { id: "supervisor", title: "Supervisor", credit: "u/Kerast" },
] as const;

function MapsSection() {
  const base = import.meta.env.BASE_URL;
  const [open, setOpen] = React.useState<string | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Map className="w-5 h-5 text-accent-amber" />
        <h2 className="text-lg font-bold">Zone Maps</h2>
      </div>
      <p className="text-xs text-text-muted">
        Maps by Terada (Checkmate, Orbituary, Ruin) and u/Kerast (Executive Hangar, Supervisor).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MAPS.map(({ id, title, credit }) => (
          <div
            key={id}
            className="card overflow-hidden p-0 cursor-pointer hover:border-accent-amber/30 transition-all"
            onClick={() => setOpen(id)}
          >
            <div className="aspect-[4/3] bg-dark-800 relative">
              <img
                src={`${base}maps/${id}.webp`}
                alt={title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setOpen(null)}
        >
          <img
            src={`${base}maps/${open}.webp`}
            alt={MAPS.find((m) => m.id === open)?.title}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </section>
  );
}

/* ─── App ─── */

export default function App() {
  const supervisorCards = useSupervisorCards();
  const compboards = useCompBoards();
  const hangar = useHangarTimer();

  const stagesDone: Record<number, boolean> = {
    1: supervisorCards.allCollected,
    2: compboards.zoneDone("checkmate"),
    3: compboards.zoneDone("orbituary"),
    4: compboards.zoneDone("ruin"),
    5: compboards.collected === compboards.total && hangar.isGreen,
  };

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-4 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">
            Executive Hangar
          </h1>
          <p className="text-text-muted text-xs tracking-wide uppercase">
            Pyro System &bull; PYAM-EXHANG-0-1
          </p>
        </div>
        <IntroSection stagesDone={stagesDone} execBlocked={compboards.collected === compboards.total && !hangar.isGreen} />
        <SupervisorSection supervisorCards={supervisorCards} />
        <HangarSection compboards={compboards} hangar={hangar} />
        <ShipTracker />
        <MapsSection />
      </main>

      <footer className="border-t border-dark-700 py-6 text-center">
        <p className="text-xs text-text-muted">
          Unofficial fan-made tool. Not affiliated with Cloud Imperium Games.
        </p>
      </footer>
    </div>
  );
}

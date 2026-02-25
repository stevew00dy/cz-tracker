import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  Zap,
  RotateCcw,
  Play,
  Check,
  Rocket,
  Coffee,
  Users,
  ExternalLink,
  X,
  Settings,
  Download,
  Upload,
  Crosshair,
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
        <p className="text-sm text-text-dim">To claim your PYAM EXEC ship you first need to complete the 5 stages below.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
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
            <div key={s.step} className={`rounded-xl border ${borderClass} p-3 text-center sm:text-center transition-all duration-300 flex sm:block items-center gap-3`}>
              <div className={`w-7 h-7 rounded-full ${circleClass} text-xs font-black flex items-center justify-center shrink-0 sm:mx-auto sm:mb-2`}>
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
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left — Compboard Checklist */}
        <div className="card flex flex-col overflow-hidden md:flex-1 md:min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-accent-amber/20 text-accent-amber text-xs font-black flex items-center justify-center shrink-0">2</div>
              <div className="w-7 h-7 rounded-full bg-accent-amber/20 text-accent-amber text-xs font-black flex items-center justify-center shrink-0">3</div>
              <div className="w-7 h-7 rounded-full bg-accent-amber/20 text-accent-amber text-xs font-black flex items-center justify-center shrink-0">4</div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold">Compboards</h2>
              <p className="text-xs text-text-dim hidden sm:block">Collect all 7 compboards from contested zones.</p>
              <p className="text-xs text-text-dim hidden sm:block">Boards 2 &amp; 3 share a blue, Boards 4 &amp; 7 share a red keycard.</p>
            </div>
            <div className="flex items-center gap-4 ml-auto">
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
            {(["checkmate", "orbituary", "ruin"] as const).map((zone) => {
              return (
              <div key={zone} className="space-y-1.5">
                <div className="mb-1">
                  <span className="text-xs font-semibold text-text-secondary">{ZONE_NAMES[zone]}</span>
                </div>
                {boards.filter((b) => b.zone === zone).map((b) => {
                  const rem = getRemaining(b.id);
                  const running = rem !== null && rem > 0;
                  return (
                <div
                  key={b.id}
                  onClick={() => toggle(b.id)}
                  className={`w-full rounded-lg border ${b.collected ? "border-accent-green/30 bg-accent-green/5" : running ? "border-accent-blue/30 bg-accent-blue/5" : "border-dark-700 bg-dark-900/50"} px-3 sm:px-4 py-3 transition-all duration-200 text-left hover:border-accent-green/50 cursor-pointer`}
                >
                  {/* Desktop: grid row */}
                  <div className="hidden sm:grid items-center gap-2" style={{ gridTemplateColumns: "2rem 1fr 1fr 1fr 5rem" }}>
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
                    {b.keycard && b.keycard.length > 0 ? (
                      <span className="flex flex-col gap-0.5">
                        {Object.entries(b.keycard.reduce<Record<string, number>>((acc, k) => { acc[k] = (acc[k] || 0) + 1; return acc; }, {})).map(([k, count]) => {
                          const dotClass = k === "red" ? "bg-accent-red" : k === "blue" ? "bg-accent-blue" : "bg-accent-amber";
                          const textClass = k === "red" ? "text-accent-red" : k === "blue" ? "text-accent-blue" : "text-accent-amber";
                          const label = k === "crypt" ? "Crypt" : k === "red" ? "Red" : "Blue";
                          return (
                            <span key={k} className="flex items-center gap-1.5">
                              <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotClass}`} />
                              <span className={`text-sm ${textClass}`}>{label} Keycard{count > 1 ? ` x${count}` : ""}</span>
                            </span>
                          );
                        })}
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
                        <button onClick={() => startTimer(b.id)} className="rounded px-2.5 py-1 bg-dark-700 hover:bg-dark-600 text-text-muted text-xs flex items-center gap-1 transition-colors cursor-pointer">
                          <Play className="w-3 h-3" /> Timer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile: compact stacked layout */}
                  <div className="flex sm:hidden items-center gap-3">
                    <div className="w-7 h-7 rounded-full border-2 border-dark-600 flex items-center justify-center shrink-0">
                      {b.collected ? (
                        <div className="w-6 h-6 rounded-full bg-accent-green flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-dark-950" />
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-text-muted">{b.id}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-semibold block ${b.collected ? "text-accent-green line-through opacity-60" : "text-text-secondary"}`}>
                        {b.label}
                      </span>
                      {b.keycard && b.keycard.length > 0 && (
                        <span className="flex gap-2 mt-0.5">
                          {Object.entries(b.keycard.reduce<Record<string, number>>((acc, k) => { acc[k] = (acc[k] || 0) + 1; return acc; }, {})).map(([k, count]) => {
                            const dotClass = k === "red" ? "bg-accent-red" : k === "blue" ? "bg-accent-blue" : "bg-accent-amber";
                            const textClass = k === "red" ? "text-accent-red" : k === "blue" ? "text-accent-blue" : "text-accent-amber";
                            const label = k === "crypt" ? "Crypt" : k === "red" ? "Red" : "Blue";
                            return (
                              <span key={k} className="flex items-center gap-1">
                                <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
                                <span className={`text-xs ${textClass}`}>{label}{count > 1 ? ` x${count}` : ""}</span>
                              </span>
                            );
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {running ? (
                        <>
                          <span className="font-mono text-xs font-bold text-accent-blue">{formatTime(rem!)}</span>
                          <button onClick={() => resetTimer(b.id)} className="text-text-muted hover:text-text-secondary transition-colors">
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => startTimer(b.id)} className="rounded px-2 py-1 bg-dark-700 hover:bg-dark-600 text-text-muted text-xs flex items-center gap-1 transition-colors cursor-pointer">
                          <Play className="w-3 h-3" /> Timer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                  );
                })}
              </div>
              );
            })}
          </div>

        </div>

        {/* Right — Timer + LEDs + Sync */}
        <div className="flex flex-col gap-4 md:flex-1 md:min-w-0">

          {/* Phase Card */}
          <div className={`card border-2 flex-1 ${isGreen ? "border-accent-green" : "border-accent-red"} text-center relative overflow-hidden`}>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: isGreen
                  ? "radial-gradient(circle at 50% 50%, rgba(16,185,129,0.15) 0%, transparent 70%)"
                  : "radial-gradient(circle at 50% 50%, rgba(239,68,68,0.15) 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3 text-left">
                <div className="w-7 h-7 rounded-full bg-accent-amber/20 text-accent-amber text-xs font-black flex items-center justify-center shrink-0">5</div>
                <div>
                  <h2 className="text-lg font-bold">Executive Hangar</h2>
                  <p className="text-xs text-text-dim">Insert compboards to open the blast door to the hangar, use the ASOP terminal to claim your new ship. Beware PVP!</p>
                </div>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mt-2 mb-3 ${isGreen ? "bg-accent-green/20 text-accent-green" : "bg-accent-red/20 text-accent-red"}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${isGreen ? "bg-accent-green animate-glow-green" : "bg-accent-red animate-glow-red"}`} />
                {isGreen ? "HANGAR OPEN" : "HANGAR CLOSED"}
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

            {/* LEDs */}
            <div className="relative mt-4 pt-4 border-t border-dark-700/50">
              <div className="flex items-center justify-center gap-4 sm:gap-6 mb-2">
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
          </div>

          {/* Vault Door */}
          <VaultDoorCard />

        </div>
      </div>
    </section>
  );
}

/* ─── Supervisor Red Keycards ─── */

function SupervisorSection({ supervisorCards }: { supervisorCards: ReturnType<typeof useSupervisorCards> }) {
  const { start, reset, getRemaining, getProgress } = useSimpleTimers("cz-supervisor", ["sv-34", "sv-35"]);
  const { toggle, isCollected } = supervisorCards;

  const printers = [
    { id: "sv-34", label: "PYAM-SUPVISR-3-4" },
    { id: "sv-35", label: "PYAM-SUPVISR-3-5" },
  ];

  return (
    <section className="card">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-7 h-7 rounded-full bg-accent-amber/20 text-accent-amber text-xs font-black flex items-center justify-center shrink-0">1</div>
        <div>
          <h2 className="text-lg font-bold">Supervisor Red Keycards</h2>
          <p className="text-xs text-text-dim">Required to access compboards in Checkmate and Orbituary. You can acquire red keycards at the following two locations.</p>
          <p className="text-xs text-text-dim mt-0.5">You need 2 red keycards in total, providing you don't lose any to unexpected deaths.</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        {printers.map((p) => {
          const got = isCollected(p.id);
          const rem = getRemaining(p.id);
          const running = rem !== null && rem > 0;
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`flex-1 rounded-xl border ${got ? "border-accent-green/40 bg-accent-green/5" : "border-dark-700 bg-dark-900/50"} p-4 transition-all duration-300 text-left cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-semibold ${got ? "text-accent-green" : "text-accent-red"}`}>{p.label}</h3>
                  {got && <Check className="w-4 h-4 text-accent-green" />}
                </div>
                <div className="flex items-center gap-2">
                  {running ? (
                    <span
                      onClick={(e) => { e.stopPropagation(); reset(p.id); }}
                      className="text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <>
                      <span className="text-[10px] text-text-muted">30 min cooldown</span>
                      <span
                        onClick={(e) => { e.stopPropagation(); start(p.id); }}
                        className="rounded-lg px-2.5 py-1 bg-dark-700 hover:bg-dark-600 text-text-secondary text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3" /> Timer
                      </span>
                    </>
                  )}
                </div>
              </div>
              {running && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-lg font-bold text-accent-red">{formatTime(rem!)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-dark-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300 bg-accent-red"
                      style={{ width: `${(1 - getProgress(p.id)) * 100}%` }}
                    />
                  </div>
                </>
              )}
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
  const barColor = vault.isOpen ? "bg-accent-green" : "bg-accent-red";

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <div>
          <h2 className="text-lg font-bold">Ruin Station — Vault Door</h2>
          <p className="text-xs text-text-dim">Opens 1 min, closed 20 min (repeating cycle).</p>
        </div>
        {vault.synced && (
          <button onClick={vault.reset} className="text-text-muted hover:text-text-secondary transition-colors ml-auto shrink-0">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {vault.synced ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className={`font-mono text-xl font-bold ${vault.isOpen ? "text-accent-green" : "text-accent-red"}`}>
                {vault.isOpen ? "OPEN" : "CLOSED"}
              </span>
            </div>
            <span className="text-text-dim font-mono text-sm">{formatTime(vault.remaining)}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-dark-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${(1 - vault.progress) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-accent-amber font-mono text-xl font-bold">UNKNOWN</span>
            <span className="text-[10px] text-text-muted">Click when you see the vault door open.</span>
          </div>
          <button
            onClick={vault.sync}
            className="rounded-lg px-3 py-1.5 bg-accent-amber/10 border border-amber-500/30 text-accent-amber text-xs font-semibold hover:bg-accent-amber/20 transition-all shrink-0"
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
        <div className="flex items-center gap-4">
          <button onClick={() => { if (window.confirm("Reset all claimed ships?")) resetAll(); }} className="text-text-muted hover:text-accent-red text-[10px] flex items-center gap-1 transition-colors">
            <RotateCcw className="w-2.5 h-2.5" /> Reset
          </button>
          <div className="text-right">
            <span className={`font-mono text-xl font-black ${claimed === total ? "text-accent-green" : "text-text"}`}>{claimed}</span>
            <span className="text-text-muted text-sm">/{total}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {grouped.map((shipName) => {
          const variants = ships.filter((s) => s.ship === shipName);
          const allClaimed = variants.every((v) => v.claimed);
          return (
            <div key={shipName} className={`rounded-xl border ${allClaimed ? "border-accent-green/30 bg-accent-green/5" : "border-dark-700 bg-dark-900/50"} px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 transition-all duration-200`}>
              <h3 className={`font-semibold shrink-0 ${allClaimed ? "text-accent-green" : "text-text-secondary"}`}>{shipName}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => toggle(v.id)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
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
    <section className="card">
      <div className="flex items-center gap-3 mb-3">
        <div>
          <h2 className="text-lg font-bold">Zone Maps</h2>
          <p className="text-xs text-text-dim">Maps by Terada (Checkmate, Orbituary, Ruin) and u/Kerast (Executive Hangar, Supervisor).</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MAPS.map(({ id, title }) => (
          <div
            key={id}
            className="rounded-xl overflow-hidden border border-dark-700 cursor-pointer hover:border-accent-amber/30 transition-all"
            onClick={() => setOpen(id)}
          >
            <div className="aspect-[4/3] relative" style={{ backgroundColor: "#0a1628" }}>
              <img
                src={`${base}maps/${id}.webp`}
                alt={title}
                className="w-full h-full object-cover object-left-top"
              />
            </div>
          </div>
        ))}
      </div>

      {open && ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setOpen(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-dark-800/80 border border-dark-600 flex items-center justify-center text-text-muted hover:text-white hover:bg-dark-700 transition-all z-10"
            onClick={(e) => { e.stopPropagation(); setOpen(null); }}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={`${base}maps/${open}.webp`}
            alt={MAPS.find((m) => m.id === open)?.title}
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />
        </div>,
        document.body
      )}
    </section>
  );
}

/* ─── Header ─── */

const CZ_STORAGE_KEYS = [
  "cz-hangar-sync", "cz-vault-sync", "cz-compboards",
  "cz-ships", "cz-supervisor-collected", "cz-supervisor-timers",
];

function exportData() {
  const data: Record<string, unknown> = { version: 1, exportedAt: new Date().toISOString() };
  CZ_STORAGE_KEYS.forEach((key) => {
    const raw = localStorage.getItem(key);
    if (raw) data[key] = JSON.parse(raw);
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `exec-hangar-tracker-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (typeof data !== "object" || !data) throw new Error("bad format");
      CZ_STORAGE_KEYS.forEach((key) => {
        if (data[key] !== undefined) localStorage.setItem(key, JSON.stringify(data[key]));
      });
      window.location.reload();
    } catch {
      alert("Invalid backup file. Expected an Exec Hangar Tracker JSON export.");
    }
  };
  reader.readAsText(file);
}

function Header({ stagesCompleted, totalStages, onReset }: { stagesCompleted: number; totalStages: number; onReset: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pct = totalStages > 0 ? Math.round((stagesCompleted / totalStages) * 100) : 0;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <header className="border-b border-dark-700 bg-dark-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-blue/20 flex items-center justify-center">
            <Crosshair className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Executive Hangar Tracker</h1>
            <p className="text-xs text-text-muted">Pyro System &bull; PYAM-EXHANG-0-1</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent-green" />
              <span className="text-text-dim">
                <span className="font-mono font-semibold text-accent-green">{stagesCompleted}</span>
                <span className="text-text-muted">/{totalStages}</span> stages
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="font-mono font-semibold text-text-dim">{pct}%</span>
              <div className="w-20 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-green rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="relative" ref={panelRef}>
            <button
              onClick={() => { setOpen(!open); setConfirming(false); }}
              className={`p-2 rounded-lg transition-all duration-200 ${
                open ? "text-text bg-dark-700" : "text-text-muted hover:text-text hover:bg-dark-800"
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-64 p-3 shadow-xl z-50 rounded-xl border border-dark-700 bg-dark-900">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wide">Settings</h3>
                  <button
                    onClick={() => { setOpen(false); setConfirming(false); }}
                    className="p-0.5 rounded text-text-muted hover:text-text transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => { exportData(); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-text-dim hover:text-text hover:bg-dark-700 transition-all duration-200"
                  >
                    <Download className="w-3.5 h-3.5 text-accent-blue" />
                    Export Progress
                    <span className="ml-auto text-[10px] text-text-muted">.json</span>
                  </button>

                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-text-dim hover:text-text hover:bg-dark-700 transition-all duration-200"
                  >
                    <Upload className="w-3.5 h-3.5 text-accent-amber" />
                    Import Progress
                    <span className="ml-auto text-[10px] text-text-muted">.json</span>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) importData(file);
                      e.target.value = "";
                    }}
                  />

                  <div className="border-t border-dark-700 my-2" />

                  {confirming ? (
                    <div className="px-3 py-2">
                      <p className="text-xs text-accent-red mb-2">Reset all progress? This cannot be undone.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { onReset(); setConfirming(false); setOpen(false); }}
                          className="flex-1 py-1.5 text-xs rounded-md bg-accent-red/20 text-accent-red hover:bg-accent-red/30 transition-colors font-medium"
                        >
                          Yes, reset
                        </button>
                        <button
                          onClick={() => setConfirming(false)}
                          className="flex-1 py-1.5 text-xs rounded-md bg-dark-700 text-text-muted hover:text-text transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirming(true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-all duration-200"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset All Progress
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
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

  const stagesCompleted = Object.values(stagesDone).filter(Boolean).length;

  function handleReset() {
    CZ_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  }

  return (
    <div className="min-h-screen">
      <Header stagesCompleted={stagesCompleted} totalStages={5} onReset={handleReset} />
      <main className="max-w-7xl mx-auto px-4 py-4 space-y-8">
        <IntroSection stagesDone={stagesDone} execBlocked={compboards.collected === compboards.total && !hangar.isGreen} />
        <SupervisorSection supervisorCards={supervisorCards} />
        <HangarSection compboards={compboards} hangar={hangar} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ alignItems: "stretch" }}>
          <ShipTracker />
          <div className="flex flex-col gap-4">
            <div className="rounded-xl overflow-hidden border border-dark-700">
              <div className="aspect-video">
                <iframe
                  src="https://www.youtube.com/embed/p-AwnAFVntw"
                  title="Executive Hangar Guide"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
              <a
                href="https://paypal.me/stevewoody"
                target="_blank"
                rel="noopener noreferrer"
                className="card flex items-center gap-3 px-4 py-3 hover:border-accent-amber/50 transition-all group cursor-pointer"
              >
                <Coffee className="w-5 h-5 text-accent-amber shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold group-hover:text-accent-amber transition-colors">Buy Me a Coffee</p>
                  <p className="text-[10px] text-text-dim">Support the project</p>
                </div>
                <ExternalLink className="w-3 h-3 text-text-muted ml-auto shrink-0" />
              </a>
              <a
                href="https://robertsspaceindustries.com/citizens/stevewoody"
                target="_blank"
                rel="noopener noreferrer"
                className="card flex items-center gap-3 px-4 py-3 hover:border-accent-blue/50 transition-all group cursor-pointer"
              >
                <Users className="w-5 h-5 text-accent-blue shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold group-hover:text-accent-blue transition-colors">Request a Sherpa</p>
                  <p className="text-[10px] text-text-dim">Add @stevewoody for a guided run</p>
                </div>
                <ExternalLink className="w-3 h-3 text-text-muted ml-auto shrink-0" />
              </a>
            </div>
          </div>
        </div>
        <MapsSection />
      </main>

      <footer className="border-t border-dark-700 mt-12 py-6">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <a href="/" className="text-xs text-text-muted hover:text-accent-amber transition-colors">Home</a>
            <a href="/armor-tracker/" className="text-xs text-text-muted hover:text-accent-amber transition-colors">Armour Tracker</a>
            <a href="/exec-hangar-tracker/" className="text-xs text-text-muted hover:text-accent-amber transition-colors">Exec Hangar Tracker</a>
            <a href="/wikelo-tracker/" className="text-xs text-text-muted hover:text-accent-amber transition-colors">Wikelo Tracker</a>
            <a href="/loadout-planner/" className="text-xs text-text-muted hover:text-accent-amber transition-colors">Loadout Planner</a>
            <a href="https://www.youtube.com/@undisputednoobs" target="_blank" rel="noopener noreferrer" className="text-xs text-text-muted hover:text-accent-amber transition-colors">YouTube</a>
          </div>
          <p className="text-[10px] text-text-muted/50">Unofficial fan-made tool. Not affiliated with Cloud Imperium Games.</p>
        </div>
      </footer>
    </div>
  );
}

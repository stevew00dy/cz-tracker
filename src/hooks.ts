import { useState, useEffect, useCallback } from "react";

// Exact values extracted from cztimer.com source — community-calibrated
const CYCLE_TOTAL_MS = 11_101_413;
const GREEN_PHASE_MS = 3_900_415;
const RED_PHASE_MS = 7_200_767;
// Known green-phase start timestamp (from cztimer.com calibration data)
const EPOCH_REF = 1_769_983_794_775;

const VAULT_OPEN_MS = 60 * 1000;
const VAULT_CLOSED_MS = 20 * 60 * 1000;
const VAULT_CYCLE_MS = VAULT_OPEN_MS + VAULT_CLOSED_MS;

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useHangarTimer(syncOffsetKey = "cz-hangar-sync") {
  const [syncOffset, setSyncOffset] = useState(() => loadJson<number>(syncOffsetKey, 0));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const adjustedNow = now + syncOffset;
  const elapsed = adjustedNow - EPOCH_REF;
  const cyclePos = ((elapsed % CYCLE_TOTAL_MS) + CYCLE_TOTAL_MS) % CYCLE_TOTAL_MS;

  // Cycle order: GREEN (0 → GREEN_PHASE_MS) then RED (GREEN_PHASE_MS → CYCLE_TOTAL_MS)
  const isGreen = cyclePos < GREEN_PHASE_MS;
  const isRed = !isGreen;

  const remaining = isGreen
    ? GREEN_PHASE_MS - cyclePos
    : CYCLE_TOTAL_MS - cyclePos;

  const progress = (cyclePos / CYCLE_TOTAL_MS) * 100;

  // LEDs light up progressively during RED phase as a countdown to opening
  const redElapsed = isRed ? cyclePos - GREEN_PHASE_MS : 0;
  const ledsLit = isRed ? Math.min(5, Math.floor((redElapsed / RED_PHASE_MS) * 5)) : 5;

  // "Opens at" / "Closes at" clock time
  const changeAt = new Date(now + remaining);
  const changeAtStr = changeAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }) + " UTC";

  const sync = useCallback(() => {
    // When user clicks sync as hangar OPENS, we nudge so cyclePos = 0 right now
    const currentElapsed = Date.now() - EPOCH_REF;
    const currentPos = ((currentElapsed % CYCLE_TOTAL_MS) + CYCLE_TOTAL_MS) % CYCLE_TOTAL_MS;
    const offset = -currentPos;
    setSyncOffset(offset);
    saveJson(syncOffsetKey, offset);
  }, [syncOffsetKey]);

  const resetSync = useCallback(() => {
    setSyncOffset(0);
    saveJson(syncOffsetKey, 0);
  }, [syncOffsetKey]);

  return { isGreen, isRed, remaining, progress, sync, resetSync, synced: syncOffset !== 0, ledsLit, changeAtStr };
}

export function useVaultDoor(key = "cz-vault-sync") {
  const [syncTime, setSyncTime] = useState(() => loadJson<number | null>(key, null));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const sync = useCallback(() => {
    const t = Date.now();
    setSyncTime(t);
    saveJson(key, t);
  }, [key]);

  const reset = useCallback(() => {
    setSyncTime(null);
    saveJson(key, null);
  }, [key]);

  if (!syncTime) return { isOpen: null, remaining: 0, progress: 0, phaseDuration: 0, sync, reset, synced: false };

  const elapsed = now - syncTime;
  const cyclePos = elapsed % VAULT_CYCLE_MS;
  const isOpen = cyclePos < VAULT_OPEN_MS;
  const phaseDuration = isOpen ? VAULT_OPEN_MS : VAULT_CLOSED_MS;
  const remaining = isOpen ? VAULT_OPEN_MS - cyclePos : VAULT_CYCLE_MS - cyclePos;
  const progress = 1 - remaining / phaseDuration;

  return { isOpen, remaining, progress, phaseDuration, sync, reset, synced: true };
}

export interface CompBoard {
  id: number;
  label: string;
  location: string;
  zone: "checkmate" | "orbituary" | "ruin";
  keycard: ("red" | "blue" | "crypt")[] | null;
  collected: boolean;
  timerEnd: number | null;
}

const BOARDS: Omit<CompBoard, "collected" | "timerEnd">[] = [
  { id: 1, label: "Board 1", location: "Hangar Area", zone: "checkmate", keycard: ["red"] },
  { id: 2, label: "Board 2", location: "Server Room", zone: "checkmate", keycard: ["blue"] },
  { id: 3, label: "Board 3", location: "Behind Red Door", zone: "checkmate", keycard: ["blue"] },
  { id: 4, label: "Board 4", location: "Storage Bay", zone: "orbituary", keycard: ["red"] },
  { id: 7, label: "Board 7", location: "Behind Fuse/Blue Doors", zone: "orbituary", keycard: ["red", "blue", "blue"] },
  { id: 5, label: "Board 5", location: "Crypt", zone: "ruin", keycard: ["crypt"] },
  { id: 6, label: "Board 6", location: "Vault (Timer Door)", zone: "ruin", keycard: null },
];

export function useCompBoards(key = "cz-compboards") {
  const [boards, setBoards] = useState<CompBoard[]>(() => {
    const saved = loadJson<CompBoard[]>(key, []);
    return BOARDS.map((b) => {
      const existing = saved.find((s) => s.id === b.id);
      return { ...b, collected: existing?.collected ?? false, timerEnd: existing?.timerEnd ?? null };
    });
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    saveJson(key, boards);
  }, [boards, key]);

  const toggle = useCallback((id: number) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === id ? { ...b, collected: !b.collected } : b))
    );
  }, []);

  const startTimer = useCallback((id: number) => {
    setBoards((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const duration = b.keycard?.includes("blue") ? 15 * 60 * 1000 : 30 * 60 * 1000;
        return { ...b, timerEnd: Date.now() + duration };
      })
    );
  }, []);

  const resetTimer = useCallback((id: number) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === id ? { ...b, timerEnd: null } : b))
    );
  }, []);

  const getRemaining = useCallback(
    (id: number) => {
      const board = boards.find((b) => b.id === id);
      if (!board?.timerEnd) return null;
      const diff = board.timerEnd - now;
      return diff > 0 ? diff : 0;
    },
    [boards, now]
  );

  const resetAll = useCallback(() => {
    setBoards((prev) => prev.map((b) => ({ ...b, collected: false, timerEnd: null })));
  }, []);

  const byZone = (zone: CompBoard["zone"]) => boards.filter((b) => b.zone === zone);
  const collected = boards.filter((b) => b.collected).length;
  const zoneDone = (zone: CompBoard["zone"]) => byZone(zone).every((b) => b.collected);

  return { boards, toggle, startTimer, resetTimer, getRemaining, resetAll, collected, total: BOARDS.length, byZone, zoneDone };
}

export interface ShipVariant {
  id: string;
  ship: string;
  variant: "military" | "stealth";
  claimed: boolean;
}

const SHIPS = ["F8C Lightning", "F7A Hornet Mk II", "Corsair", "Cutlass Black", "Syulen"];

function buildShipList(): Omit<ShipVariant, "claimed">[] {
  return SHIPS.flatMap((ship) => [
    { id: `${ship}-military`, ship, variant: "military" as const },
    { id: `${ship}-stealth`, ship, variant: "stealth" as const },
  ]);
}

export function useShipTracker(key = "cz-ships") {
  const [ships, setShips] = useState<ShipVariant[]>(() => {
    const saved = loadJson<ShipVariant[]>(key, []);
    return buildShipList().map((s) => {
      const existing = saved.find((e) => e.id === s.id);
      return { ...s, claimed: existing?.claimed ?? false };
    });
  });

  useEffect(() => {
    saveJson(key, ships);
  }, [ships, key]);

  const toggle = useCallback((id: string) => {
    setShips((prev) => prev.map((s) => (s.id === id ? { ...s, claimed: !s.claimed } : s)));
  }, []);

  const resetAll = useCallback(() => {
    setShips((prev) => prev.map((s) => ({ ...s, claimed: false })));
  }, []);

  const claimed = ships.filter((s) => s.claimed).length;

  return { ships, toggle, resetAll, claimed, total: ships.length };
}

export function useSimpleTimers(key: string, _ids?: string[]) {
  const [endTimes, setEndTimes] = useState<Record<string, number | null>>(() => loadJson(key, {}));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { saveJson(key, endTimes); }, [endTimes, key]);

  const start = useCallback((id: string) => {
    setEndTimes((prev) => ({ ...prev, [id]: Date.now() + 30 * 60 * 1000 }));
  }, []);

  const reset = useCallback((id: string) => {
    setEndTimes((prev) => ({ ...prev, [id]: null }));
  }, []);

  const DURATION = 30 * 60 * 1000;

  const getRemaining = useCallback((id: string) => {
    const end = endTimes[id];
    if (!end) return null;
    const diff = end - now;
    return diff > 0 ? diff : 0;
  }, [endTimes, now]);

  const getProgress = useCallback((id: string) => {
    const rem = getRemaining(id);
    if (rem === null || rem === 0) return 0;
    return 1 - rem / DURATION;
  }, [getRemaining]);

  return { start, reset, getRemaining, getProgress };
}

export function useSupervisorCards(key = "cz-supervisor-collected") {
  const [collected, setCollected] = useState<Record<string, boolean>>(() => loadJson(key, {}));

  useEffect(() => { saveJson(key, collected); }, [collected, key]);

  const toggle = useCallback((id: string) => {
    setCollected((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isCollected = useCallback((id: string) => !!collected[id], [collected]);
  const allCollected = collected["sv-34"] && collected["sv-35"];

  return { toggle, isCollected, allCollected };
}

export function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

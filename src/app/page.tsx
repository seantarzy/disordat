"use client";
import { useState } from "react";
import Genie from "@/components/Genie";
import History from "@/components/History";
import { saveToHistory } from "@/lib/history";
import clsx from "clsx";

type Verdict = "dis" | "dat" | "shrug";

export default function Page() {
  const [dis, setDis] = useState("");
  const [dat, setDat] = useState("");
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [reason, setReason] = useState<string>("");
  const disabled = loading || (!dis && !dat);

  async function decide() {
    if (!dis && !dat) return;
    setLoading(true);
    setVerdict(null);
    setReason("");
    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dis, dat })
      });
      const data = await res.json();
      setVerdict(data.verdict);
      setReason(data.reasoning ?? "");
      
      // Save to history (only on client side)
      if (typeof window !== "undefined") {
        saveToHistory({
          dis,
          dat,
          verdict: data.verdict,
          reasoning: data.reasoning ?? "",
        });
      }
    } catch {
      setVerdict("dis");
      setReason("Offline fallback.");
    } finally {
      setLoading(false);
    }
  }

  function swap() {
    setVerdict(null);
    setReason("");
    setDis(dat);
    setDat(dis);
  }
  
  function resetAll() {
    setDis("");
    setDat("");
    setVerdict(null);
    setReason("");
  }

  return (
    <main className="min-h-dvh bg-white text-gray-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold">Dis or Dat</h1>
          <p className="mt-2 text-sm opacity-80">enter a name, object, food, etc.</p>
        </header>

        <Genie verdict={verdict} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className={clsx(
            "rounded-2xl border p-4 transition-colors duration-200",
            verdict === "dis" && "border-green-500 bg-green-50 dark:bg-green-900/20",
            verdict === "dat" && "border-gray-200 dark:border-gray-700"
          )}>
            <label className="block text-sm font-medium mb-2" htmlFor="dis">Dis</label>
            <input
              id="dis"
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="enter a name, object, food, etc."
              value={dis}
              onChange={(e) => setDis(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") decide(); }}
            />
          </div>
          <div className={clsx(
            "rounded-2xl border p-4 transition-colors duration-200",
            verdict === "dat" && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
            verdict === "dis" && "border-gray-200 dark:border-gray-700"
          )}>
            <label className="block text-sm font-medium mb-2" htmlFor="dat">Dat</label>
            <input
              id="dat"
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="enter a name, object, food, etc."
              value={dat}
              onChange={(e) => setDat(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") decide(); }}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={decide}
            disabled={disabled}
            className="rounded-xl bg-indigo-600 text-white px-5 py-2.5 disabled:opacity-50 hover:bg-indigo-700 transition-colors"
          >
            {loading ? "Thinking…" : "Decide"}
          </button>
          <button onClick={swap} className="rounded-xl border px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Swap</button>
          <button onClick={resetAll} className="rounded-xl border px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Reset</button>
        </div>

        {verdict && (
          <div className="mt-6 text-center">
            <span className={clsx(
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold",
              verdict === "dis" ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200" :
              verdict === "dat" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" :
              "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200"
            )}>
              {verdict.toUpperCase()}
            </span>
            {reason && <p className="mt-2 text-sm opacity-80">{reason}</p>}
          </div>
        )}

        <History />

        <footer className="mt-10 text-center text-xs opacity-70">
          We almost never shrug. If your inputs are nonsense, the Genie might.
        </footer>
      </div>
    </main>
  );
}


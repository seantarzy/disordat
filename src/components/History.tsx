"use client";
import { useState, useEffect } from "react";
import { ComparisonHistory, getHistory, removeFromHistory, clearHistory } from "@/lib/history";
import clsx from "clsx";

export default function History() {
  const [history, setHistory] = useState<ComparisonHistory[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadHistory = () => {
    const historyCache = getHistory();
    setHistory(historyCache.values());
  };

  useEffect(() => {
    setMounted(true);
    loadHistory();
    // Listen for storage changes (in case another tab updates history)
    window.addEventListener("storage", loadHistory);
    return () => window.removeEventListener("storage", loadHistory);
  }, []);

  // Listen for custom events to refresh history
  useEffect(() => {
    const handleHistoryUpdate = () => {
      loadHistory();
    };

    window.addEventListener("history-updated", handleHistoryUpdate);
    return () => window.removeEventListener("history-updated", handleHistoryUpdate);
  }, []);

  // Don't render anything until mounted to avoid SSR issues
  if (!mounted) {
    return null;
  }

  const handleRemove = (id: string) => {
    removeFromHistory(id);
    setHistory(getHistory().values());
  };

  const handleClearAll = () => {
    clearHistory();
    setHistory([]);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">History</h2>
        <button
          onClick={handleClearAll}
          className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
        >
          Clear All
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Dis</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Dat</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-gray-100">Verdict</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Reasoning</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Date</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-gray-100">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {history.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-[120px] truncate">
                  {item.dis}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-[120px] truncate">
                  {item.dat}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={clsx(
                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                    item.verdict === "dis" ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200" :
                    item.verdict === "dat" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" :
                    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200"
                  )}>
                    {item.verdict.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                  {item.reasoning}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {formatTimestamp(item.timestamp)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    title="Remove from history"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

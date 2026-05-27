import { useEffect } from "react";

export function usePolling(callback: () => void | Promise<void>, intervalMs: number, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    void callback();
    const interval = window.setInterval(() => {
      void callback();
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [callback, enabled, intervalMs]);
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type EnsLookupResult = {
  address: string;
  ensName?: string;
};

export type UseEnsNamesOptions = {
  /** If true, performs periodic background refresh and visibility/focus refreshes */
  autoRefresh?: boolean;
  /** Background refresh interval in ms */
  refreshIntervalMs?: number;
  /** Visibility/focus refresh cooldown in ms */
  visibilityCooldownMs?: number;
  focusCooldownMs?: number;
};

const defaultOptions: Required<UseEnsNamesOptions> = {
  autoRefresh: true,
  refreshIntervalMs: 120_000,
  visibilityCooldownMs: 10_000,
  focusCooldownMs: 5_000,
};

export function useEnsNames(addresses: string[], options?: UseEnsNamesOptions) {
  const { autoRefresh, refreshIntervalMs, visibilityCooldownMs, focusCooldownMs } = {
    ...defaultOptions,
    ...(options ?? {}),
  };

  const [ensNames, setEnsNames] = useState<Map<string, string>>(new Map());
  const [ensLoading, setEnsLoading] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  // Normalize addresses once to ensure consistent lookup keys
  const normalizedAddresses = useMemo(
    () => Array.from(new Set(addresses.map((a) => a.toLowerCase().trim()))),
    [addresses]
  );

  const lastRequestedAtRef = useRef<number>(0);

  const refresh = useCallback(
    async (showLoading: boolean = true) => {
      if (normalizedAddresses.length === 0) return;
      try {
        if (showLoading) setEnsLoading(true);
        lastRequestedAtRef.current = Date.now();

        const response = await fetch("/api/subname/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addresses: normalizedAddresses }),
        });

        if (!response.ok) {
          console.error("Failed to fetch ENS names:", response.statusText);
          return;
        }

        const result: { data: EnsLookupResult[] } = await response.json();
        const nextEnsMap = new Map<string, string>();
        for (const item of result.data) {
          if (item.ensName) {
            nextEnsMap.set(item.address.toLowerCase().trim(), item.ensName);
          }
        }

        // Only update state if something changed to avoid unnecessary re-renders
        const changed =
          nextEnsMap.size !== ensNames.size ||
          Array.from(nextEnsMap.entries()).some(
            ([k, v]) => ensNames.get(k) !== v
          );
        if (changed) {
          setEnsNames(nextEnsMap);
        }
        setLastRefresh(Date.now());
      } catch (error) {
        console.error("Error fetching ENS names:", error);
      } finally {
        if (showLoading) setEnsLoading(false);
      }
    },
    [normalizedAddresses, ensNames]
  );

  // Initial fetch
  useEffect(() => {
    refresh(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedAddresses.join("|")]);

  // Periodic background refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refresh(false);
    }, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [autoRefresh, refresh, refreshIntervalMs]);

  // Visibility/focus refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const onVisibilityChange = () => {
      if (!document.hidden && Date.now() - lastRefresh > visibilityCooldownMs) {
        refresh(false);
      }
    };
    const onFocus = () => {
      if (Date.now() - lastRefresh > focusCooldownMs) {
        refresh(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [autoRefresh, refresh, lastRefresh, visibilityCooldownMs, focusCooldownMs]);

  // Cross-tab refresh via localStorage signal
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "ensRefreshNeeded" && e.newValue === "true") {
        refresh(false);
        localStorage.removeItem("ensRefreshNeeded");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  return {
    ensNames,
    ensLoading,
    lastRefresh,
    refresh,
  } as const;
}



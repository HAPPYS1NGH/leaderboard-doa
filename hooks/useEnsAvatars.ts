import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type EnsAvatarResult = {
  address: string;
  avatar?: string;
  url?: string;
  fid?: string;
};

export type UseEnsAvatarsOptions = {
  /** If true, performs periodic background refresh and visibility/focus refreshes */
  autoRefresh?: boolean;
  /** Background refresh interval in ms */
  refreshIntervalMs?: number;
  /** Visibility/focus refresh cooldown in ms */
  visibilityCooldownMs?: number;
  focusCooldownMs?: number;
};

const defaultOptions: Required<UseEnsAvatarsOptions> = {
  autoRefresh: true,
  refreshIntervalMs: 300_000, // 5 minutes for avatars
  visibilityCooldownMs: 30_000,
  focusCooldownMs: 15_000,
};

export function useEnsAvatars(addresses: string[], options?: UseEnsAvatarsOptions) {
  const { autoRefresh, refreshIntervalMs, visibilityCooldownMs, focusCooldownMs } = {
    ...defaultOptions,
    ...(options ?? {}),
  };

  const [ensAvatars, setEnsAvatars] = useState<Map<string, string>>(new Map());
  const [ensUrls, setEnsUrls] = useState<Map<string, string>>(new Map());
  const [ensFids, setEnsFids] = useState<Map<string, string>>(new Map());
  const [ensAvatarLoading, setEnsAvatarLoading] = useState<boolean>(false);
  const [lastAvatarRefresh, setLastAvatarRefresh] = useState<number>(0);

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
        if (showLoading) setEnsAvatarLoading(true);
        lastRequestedAtRef.current = Date.now();

        const response = await fetch("/api/subname/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addresses: normalizedAddresses }),
        });

        if (!response.ok) {
          console.error("Failed to fetch ENS avatars:", response.statusText);
          return;
        }

        const result: { data: EnsAvatarResult[] } = await response.json();
        const nextAvatarMap = new Map<string, string>();
        const nextUrlMap = new Map<string, string>();
        const nextFidMap = new Map<string, string>();
        for (const item of result.data) {
          if (item.avatar) {
            nextAvatarMap.set(item.address.toLowerCase().trim(), item.avatar);
          }
          if (item.url) {
            nextUrlMap.set(item.address.toLowerCase().trim(), item.url);
          }
          if (item.fid) {
            nextFidMap.set(item.address.toLowerCase().trim(), item.fid);
          }
        }

        // Only update state if something changed to avoid unnecessary re-renders
        const avatarChanged =
          nextAvatarMap.size !== ensAvatars.size ||
          Array.from(nextAvatarMap.entries()).some(
            ([k, v]) => ensAvatars.get(k) !== v
          );
        const urlChanged =
          nextUrlMap.size !== ensUrls.size ||
          Array.from(nextUrlMap.entries()).some(
            ([k, v]) => ensUrls.get(k) !== v
          );
        const fidChanged =
          nextFidMap.size !== ensFids.size ||
          Array.from(nextFidMap.entries()).some(
            ([k, v]) => ensFids.get(k) !== v
          );
        
        if (avatarChanged) {
          setEnsAvatars(nextAvatarMap);
        }
        if (urlChanged) {
          setEnsUrls(nextUrlMap);
        }
        if (fidChanged) {
          setEnsFids(nextFidMap);
        }
        setLastAvatarRefresh(Date.now());
      } catch (error) {
        console.error("Error fetching ENS avatars:", error);
      } finally {
        if (showLoading) setEnsAvatarLoading(false);
      }
    },
    [normalizedAddresses, ensAvatars, ensUrls, ensFids]
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
      if (!document.hidden && Date.now() - lastAvatarRefresh > visibilityCooldownMs) {
        refresh(false);
      }
    };
    const onFocus = () => {
      if (Date.now() - lastAvatarRefresh > focusCooldownMs) {
        refresh(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [autoRefresh, refresh, lastAvatarRefresh, visibilityCooldownMs, focusCooldownMs]);

  // Cross-tab refresh via localStorage signal
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "ensAvatarRefreshNeeded" && e.newValue === "true") {
        refresh(false);
        localStorage.removeItem("ensAvatarRefreshNeeded");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  return {
    ensAvatars,
    ensUrls,
    ensFids,
    ensAvatarLoading,
    lastAvatarRefresh,
    refresh,
  } as const;
}

import { useCallback, useMemo } from "react";

export type LeaderboardRecord = {
  totalUsdcSent: string;
  transactionCount: number;
  destinationAddresses?: string[];
};

export type LeaderboardJson = Record<string, LeaderboardRecord>;

export type LeaderboardEntry = {
  wallet: string;
  totalUsdcSent: string;
  transactionCount: number;
  destinationAddresses?: string[];
  originalRank: number;
};

export type SortBy = "amount" | "transactions";

export function useLeaderboardData(
  data: LeaderboardJson,
  sortBy: SortBy,
  searchQuery: string,
  maxEntries: number,
  ensNames: Map<string, string>
) {
  const allEntries = useMemo<LeaderboardEntry[]>(() => {
    return Object.entries(data)
      .map(([wallet, record]) => ({
        wallet,
        totalUsdcSent: record.totalUsdcSent,
        transactionCount: record.transactionCount,
        destinationAddresses: record.destinationAddresses ?? [],
        originalRank: 0,
      }))
      .sort((a, b) => parseFloat(b.totalUsdcSent) - parseFloat(a.totalUsdcSent))
      .map((entry, index) => ({ ...entry, originalRank: index + 1 }));
  }, [data]);

  const filteredAndSorted = useMemo<LeaderboardEntry[]>(() => {
    const term = searchQuery.toLowerCase().trim();
    const filtered = term
      ? allEntries.filter((entry) => {
          const walletMatch = entry.wallet.toLowerCase().includes(term);
          const ens = ensNames.get(entry.wallet.toLowerCase().trim());
          const ensMatch = ens ? ens.toLowerCase().includes(term) : false;
          return walletMatch || ensMatch;
        })
      : allEntries;

    const sorted = filtered.sort((a, b) => {
      if (sortBy === "amount") {
        return parseFloat(b.totalUsdcSent) - parseFloat(a.totalUsdcSent);
      }
      return b.transactionCount - a.transactionCount;
    });

    return sorted.slice(0, maxEntries);
  }, [allEntries, sortBy, maxEntries, searchQuery, ensNames]);

  const totalUsdcClaimed = useMemo(() => {
    return filteredAndSorted.reduce(
      (sum, entry) => sum + parseFloat(entry.totalUsdcSent),
      0
    );
  }, [filteredAndSorted]);

  const totalTaps = useMemo(() => {
    return filteredAndSorted.reduce((sum, entry) => sum + entry.transactionCount, 0);
  }, [filteredAndSorted]);

  const totalFarmers = filteredAndSorted.length;

  const formatWallet = useCallback(
    (wallet: string) => {
      const normalized = wallet.toLowerCase().trim();
      const ens = ensNames.get(normalized);
      if (ens) return ens;
      return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
    },
    [ensNames]
  );

  const formatUsdc = useCallback((amount: string) => {
    return parseFloat(amount).toFixed(2);
  }, []);

  const calculateCapProgress = useCallback((amount: string) => {
    const usdcAmount = parseFloat(amount);
    const capAmount = 100;
    return Math.min((usdcAmount / capAmount) * 100, 100);
  }, []);

  return {
    entries: filteredAndSorted,
    totalUsdcClaimed,
    totalTaps,
    totalFarmers,
    formatWallet,
    formatUsdc,
    calculateCapProgress,
  } as const;
}



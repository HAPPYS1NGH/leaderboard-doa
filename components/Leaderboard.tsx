import React, { useState, useMemo, useEffect } from "react";
import leaderboardData from "../constants/usdc_transfer_leaderboard.json";

interface LeaderboardEntry {
  wallet: string;
  totalUsdcSent: string;
  transactionCount: number;
  destinationAddresses?: string[];
  originalRank: number;
}

interface EnsLookupResult {
  address: string;
  ensName?: string;
}

interface LeaderboardProps {
  maxEntries?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ maxEntries = 50 }) => {
  const [sortBy, setSortBy] = useState<"amount" | "transactions">("amount");
  const [searchQuery, setSearchQuery] = useState("");
  const [ensNames, setEnsNames] = useState<Map<string, string>>(new Map());
  const [ensLoading, setEnsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Fetch ENS names for all addresses
  const fetchEnsNames = async (showLoading = true) => {
    try {
      if (showLoading) setEnsLoading(true);
      const addresses = Object.keys(leaderboardData);
      
      const response = await fetch('/api/subname/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses }),
      });

      if (response.ok) {
        const result = await response.json();
        const ensMap = new Map<string, string>();
        
        result.data.forEach((item: EnsLookupResult) => {
          if (item.ensName) {
            const normalizedAddress = item.address.toLowerCase().trim();
            ensMap.set(normalizedAddress, item.ensName);
          }
        });
        
        setEnsNames(ensMap);
        setLastRefresh(Date.now());
      } else {
        console.error('Failed to fetch ENS names:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching ENS names:', error);
    } finally {
      if (showLoading) setEnsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchEnsNames();
  }, []);

  // Periodic refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEnsNames(false); // Don't show loading for background refreshes
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  // Refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh if it's been more than 10 seconds since last refresh (reduced from 30s)
        if (Date.now() - lastRefresh > 10000) {
          fetchEnsNames(false);
        }
      }
    };

    // Also listen for focus events (when user clicks back to tab)
    const handleFocus = () => {
      if (Date.now() - lastRefresh > 5000) { // 5 seconds for focus events
        fetchEnsNames(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [lastRefresh]);

  // Check localStorage for refresh signals (from other tabs/pages)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ensRefreshNeeded' && e.newValue === 'true') {
        fetchEnsNames(false);
        localStorage.removeItem('ensRefreshNeeded'); // Clear the signal
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const sortedData = useMemo(() => {
    // First, create entries with original ranking
    const allEntries: LeaderboardEntry[] = Object.entries(leaderboardData)
      .map(([wallet, data]) => ({
        wallet,
        totalUsdcSent: data.totalUsdcSent,
        transactionCount: data.transactionCount,
        destinationAddresses: data.destinationAddresses || [],
        originalRank: 0, // Will be set below
      }))
      .sort((a, b) => parseFloat(b.totalUsdcSent) - parseFloat(a.totalUsdcSent))
      .map((entry, index) => ({
        ...entry,
        originalRank: index + 1,
      }));

    // Filter by search query (search both wallet address and ENS name)
    const filteredEntries = searchQuery
      ? allEntries.filter((entry) => {
          const searchTerm = searchQuery.toLowerCase().trim();
          const walletMatch = entry.wallet.toLowerCase().includes(searchTerm);
          const normalizedWallet = entry.wallet.toLowerCase().trim();
          const ensName = ensNames.get(normalizedWallet);
          const ensMatch = ensName ? ensName.toLowerCase().includes(searchTerm) : false;
          return walletMatch || ensMatch;
        })
      : allEntries;

    // Sort filtered entries by the current sort criteria
    return filteredEntries
      .sort((a, b) => {
        if (sortBy === "amount") {
          return parseFloat(b.totalUsdcSent) - parseFloat(a.totalUsdcSent);
        } else {
          return b.transactionCount - a.transactionCount;
        }
      })
      .slice(0, maxEntries);
  }, [sortBy, maxEntries, searchQuery, ensNames]);

  const formatWallet = (wallet: string) => {
    const normalizedWallet = wallet.toLowerCase().trim();
    const ensName = ensNames.get(normalizedWallet);
    if (ensName) {
      return ensName;
    }
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const formatUsdc = (amount: string) => {
    return parseFloat(amount).toFixed(2);
  };

  const calculateCapProgress = (amount: string) => {
    const usdcAmount = parseFloat(amount);
    const capAmount = 100; // $100 cap
    return Math.min((usdcAmount / capAmount) * 100, 100);
  };

  const totalUsdcClaimed = sortedData.reduce(
    (sum, entry) => sum + parseFloat(entry.totalUsdcSent),
    0
  );

  return (
    <div className="min-h-screen bg-cream py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-futura-bold text-forest mb-4 md:mb-6">
            🏆 The Tap Day Leaderboard
          </h1>
          <p className="text-lg md:text-xl text-forest/80 max-w-3xl mx-auto px-4 mb-6">
            Who's been sipping the yield the fastest? Find out here.
          </p>
          {ensLoading && (
            <p className="text-sm text-forest/60 mb-4">
              Loading ENS names...
            </p>
          )}
          <div className="flex justify-center items-center gap-4 mb-4">
            <button
              onClick={() => fetchEnsNames(true)}
              disabled={ensLoading}
              className="px-4 py-2 bg-forest text-cream rounded-lg hover:bg-forest/80 disabled:opacity-50 disabled:cursor-not-allowed font-futura-bold text-sm transition-colors"
            >
              {ensLoading ? 'Refreshing...' : 'Refresh ENS Names'}
            </button>
            <p className="text-xs text-forest/60">
              Last updated: {new Date(lastRefresh).toLocaleTimeString()}
            </p>
          </div>
        </div>
        {/* Search Box */}
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-forest/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by wallet address or ENS name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-forest/20 rounded-lg bg-white/70 backdrop-blur-sm text-forest placeholder-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest/50 font-futura-bold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg
                  className="h-5 w-5 text-forest/40 hover:text-forest/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        {/* Search Results Info */}
        {searchQuery && (
          <div className="text-center mb-6">
            <p className="text-forest/70 font-futura-bold">
              Found {sortedData.length} farmer
              {sortedData.length !== 1 ? "s" : ""} matching "{searchQuery}"
            </p>
          </div>
        )}
        {/* Sort Controls */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm p-1">
            <button
              onClick={() => setSortBy("amount")}
              className={`px-6 py-3 rounded-md text-sm font-futura-bold transition-colors ${
                sortBy === "amount"
                  ? "bg-forest text-cream"
                  : "text-forest hover:text-forest/80"
              }`}
            >
              Sort by Yield
            </button>
            <button
              onClick={() => setSortBy("transactions")}
              className={`px-6 py-3 rounded-md text-sm font-futura-bold transition-colors ${
                sortBy === "transactions"
                  ? "bg-forest text-cream"
                  : "text-forest hover:text-forest/80"
              }`}
            >
              Sort by Taps
            </button>
          </div>
        </div>
        {/* Leaderboard Table */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-forest text-cream">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-futura-bold">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-futura-bold">
                    Farmer
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-futura-bold">
                    Yield
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-futura-bold">
                    Taps
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-futura-bold">
                    Cap Progress
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/10">
                {sortedData.map((entry) => (
                  <tr
                    key={entry.wallet}
                    className="hover:bg-white/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-futura-bold ${
                            entry.originalRank === 1
                              ? "bg-yellow-100 text-yellow-800"
                              : entry.originalRank === 2
                              ? "bg-gray-100 text-gray-800"
                              : entry.originalRank === 3
                              ? "bg-orange-100 text-orange-800"
                              : "bg-forest/10 text-forest"
                          }`}
                        >
                          {entry.originalRank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-forest to-forest/80 rounded-full flex items-center justify-center mr-3">
                          <span className="text-cream text-xs font-futura-bold">
                            {entry.wallet.slice(2, 4).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-mono text-sm text-forest font-futura-bold">
                            {formatWallet(entry.wallet)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-lg font-futura-bold text-forest">
                        ${formatUsdc(entry.totalUsdcSent)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-futura-bold text-forest">
                        {entry.transactionCount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <div className="w-full max-w-xs">
                          <div className="flex justify-between text-xs text-forest/60 mb-1">
                            <span>0%</span>
                            <span>100%</span>
                          </div>
                          <div className="w-full bg-forest/20 rounded-full h-2">
                            <div
                              className="bg-forest h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${calculateCapProgress(
                                  entry.totalUsdcSent
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-forest/60 mt-1 text-center">
                            {calculateCapProgress(entry.totalUsdcSent).toFixed(
                              1
                            )}
                            %
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {sortedData.map((entry) => (
              <div
                key={entry.wallet}
                className="p-4 border-b border-forest/10 hover:bg-white/50 transition-colors duration-150"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-futura-bold mr-3 ${
                        entry.originalRank === 1
                          ? "bg-yellow-100 text-yellow-800"
                          : entry.originalRank === 2
                          ? "bg-gray-100 text-gray-800"
                          : entry.originalRank === 3
                          ? "bg-orange-100 text-orange-800"
                          : "bg-forest/10 text-forest"
                      }`}
                    >
                      {entry.originalRank}
                    </span>
                    <div className="w-8 h-8 bg-gradient-to-r from-forest to-forest/80 rounded-full flex items-center justify-center mr-3">
                      <span className="text-cream text-xs font-futura-bold">
                        {entry.wallet.slice(2, 4).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-futura-bold text-forest">
                      ${formatUsdc(entry.totalUsdcSent)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <div className="font-mono text-sm text-forest font-futura-bold">
                    {formatWallet(entry.wallet)}
                  </div>
                  <div className="text-sm font-futura-bold text-forest">
                    {entry.transactionCount} taps
                  </div>
                </div>
                <div className="text-xs text-forest/60 mb-2">
                  {entry.destinationAddresses?.length || 0} destination
                  addresses
                </div>
                <div className="w-full">
                  <div className="flex justify-between text-xs text-forest/60 mb-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-forest/20 rounded-full h-2 mb-1">
                    <div
                      className="bg-forest h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${calculateCapProgress(entry.totalUsdcSent)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-forest/60 text-center">
                    {calculateCapProgress(entry.totalUsdcSent).toFixed(1)}% of
                    cap
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg">
            <div className="text-xl md:text-2xl font-futura-bold text-forest">
              {sortedData.length}
            </div>
            <div className="text-xs md:text-sm text-forest/60">
              Total Farmers
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg">
            <div className="text-xl md:text-2xl font-futura-bold text-forest">
              {formatUsdc(totalUsdcClaimed.toString())}
            </div>
            <div className="text-xs md:text-sm text-forest/60">
              Total USDC Claimed
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg sm:col-span-2 lg:col-span-1">
            <div className="text-xl md:text-2xl font-futura-bold text-forest">
              {sortedData.reduce(
                (sum, entry) => sum + entry.transactionCount,
                0
              )}
            </div>
            <div className="text-xs md:text-sm text-forest/60">Total Taps</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

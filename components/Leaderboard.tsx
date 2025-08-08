import React, { useState, useMemo } from "react";
import leaderboardData from "../constants/usdc_transfer_leaderboard.json";

interface LeaderboardEntry {
  wallet: string;
  totalUsdcSent: string;
  transactionCount: number;
  transactionHashes: string[];
}

interface LeaderboardProps {
  maxEntries?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ maxEntries = 50 }) => {
  const [sortBy, setSortBy] = useState<"amount" | "transactions">("amount");

  const sortedData = useMemo(() => {
    const entries: LeaderboardEntry[] = Object.entries(leaderboardData).map(
      ([wallet, data]) => ({
        wallet,
        totalUsdcSent: data.totalUsdcSent,
        transactionCount: data.transactionCount,
        transactionHashes: data.transactionHashes,
      })
    );

    return entries
      .sort((a, b) => {
        if (sortBy === "amount") {
          return parseFloat(b.totalUsdcSent) - parseFloat(a.totalUsdcSent);
        } else {
          return b.transactionCount - a.transactionCount;
        }
      })
      .slice(0, maxEntries);
  }, [sortBy, maxEntries]);

  const formatWallet = (wallet: string) => {
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
        </div>

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
                    Total USDC
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
                {sortedData.map((entry, index) => (
                  <tr
                    key={entry.wallet}
                    className="hover:bg-white/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-futura-bold ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-800"
                              : index === 1
                              ? "bg-gray-100 text-gray-800"
                              : index === 2
                              ? "bg-orange-100 text-orange-800"
                              : "bg-forest/10 text-forest"
                          }`}
                        >
                          {index + 1}
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
                          <div className="text-xs text-forest/60">
                            {entry.transactionHashes.length} tx hashes
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-lg font-futura-bold text-forest">
                        {formatUsdc(entry.totalUsdcSent)} USDC
                      </div>
                      <div className="text-xs text-forest/60">
                        ${(parseFloat(entry.totalUsdcSent) * 1).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-futura-bold text-forest">
                        {entry.transactionCount}
                      </div>
                      <div className="text-xs text-forest/60">taps</div>
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
            {sortedData.map((entry, index) => (
              <div
                key={entry.wallet}
                className="p-4 border-b border-forest/10 hover:bg-white/50 transition-colors duration-150"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-futura-bold mr-3 ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-800"
                          : index === 1
                          ? "bg-gray-100 text-gray-800"
                          : index === 2
                          ? "bg-orange-100 text-orange-800"
                          : "bg-forest/10 text-forest"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="w-8 h-8 bg-gradient-to-r from-forest to-forest/80 rounded-full flex items-center justify-center mr-3">
                      <span className="text-cream text-xs font-futura-bold">
                        {entry.wallet.slice(2, 4).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-futura-bold text-forest">
                      {formatUsdc(entry.totalUsdcSent)} USDC
                    </div>
                    <div className="text-xs text-forest/60">
                      ${(parseFloat(entry.totalUsdcSent) * 1).toFixed(2)}
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
                  {entry.transactionHashes.length} transaction hashes
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

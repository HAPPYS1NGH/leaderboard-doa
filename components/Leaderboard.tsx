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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
            USDC Transfer Leaderboard
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Top contributors by USDC transfer volume and transaction count
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => setSortBy("amount")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                sortBy === "amount"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sort by Amount
            </button>
            <button
              onClick={() => setSortBy("transactions")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                sortBy === "transactions"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sort by Transactions
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Wallet
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">
                    Total USDC
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedData.map((entry, index) => (
                  <tr
                    key={entry.wallet}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-800"
                              : index === 1
                              ? "bg-gray-100 text-gray-800"
                              : index === 2
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-xs font-bold">
                            {entry.wallet.slice(2, 4).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-mono text-sm text-gray-900">
                            {formatWallet(entry.wallet)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.transactionHashes.length} tx hashes
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatUsdc(entry.totalUsdcSent)} USDC
                      </div>
                      <div className="text-xs text-gray-500">
                        ${(parseFloat(entry.totalUsdcSent) * 1).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {entry.transactionCount}
                      </div>
                      <div className="text-xs text-gray-500">transactions</div>
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
                className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-800"
                          : index === 1
                          ? "bg-gray-100 text-gray-800"
                          : index === 2
                          ? "bg-orange-100 text-orange-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs font-bold">
                        {entry.wallet.slice(2, 4).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatUsdc(entry.totalUsdcSent)} USDC
                    </div>
                    <div className="text-xs text-gray-500">
                      ${(parseFloat(entry.totalUsdcSent) * 1).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-mono text-sm text-gray-900">
                    {formatWallet(entry.wallet)}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {entry.transactionCount} tx
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {entry.transactionHashes.length} transaction hashes
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg">
            <div className="text-xl md:text-2xl font-bold text-gray-900">
              {sortedData.length}
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              Total Participants
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg">
            <div className="text-xl md:text-2xl font-bold text-gray-900">
              {formatUsdc(
                sortedData
                  .reduce(
                    (sum, entry) => sum + parseFloat(entry.totalUsdcSent),
                    0
                  )
                  .toString()
              )}
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              Total USDC Transferred
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg sm:col-span-2 lg:col-span-1">
            <div className="text-xl md:text-2xl font-bold text-gray-900">
              {sortedData.reduce(
                (sum, entry) => sum + entry.transactionCount,
                0
              )}
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              Total Transactions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

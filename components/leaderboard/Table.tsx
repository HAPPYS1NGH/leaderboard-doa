import React from "react";
import { LeaderboardEntry } from "../../hooks/useLeaderboardData";

type TableProps = {
  entries: LeaderboardEntry[];
  formatUsdc: (amount: string) => string;
  calculateCapProgress: (amount: string) => number;
  formatWallet: (wallet: string) => string;
};

export const Table: React.FC<TableProps> = ({ entries, formatUsdc, calculateCapProgress, formatWallet }) => {
  return (
    <div className="hidden md:block bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
      {/* Leaderboard Header */}
      <div className="bg-gradient-to-r from-forest to-forest/90 text-cream px-6 py-4">
        <h2 className="text-xl font-futura-bold text-center">🏆 Top Farmers Leaderboard</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-forest text-cream">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-futura-bold">Rank</th>
              <th className="px-6 py-4 text-left text-sm font-futura-bold">Farmer</th>
              <th className="px-6 py-4 text-right text-sm font-futura-bold">Yield</th>
              <th className="px-6 py-4 text-right text-sm font-futura-bold">Taps</th>
              <th className="px-6 py-4 text-center text-sm font-futura-bold">Cap Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest/10">
            {entries.map((entry) => (
              <tr key={entry.wallet} className="hover:bg-white/50 transition-colors duration-150">
                <td className="px-6 py-4">
                  <div className="flex items-center">
              <span
                className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-futura-bold  "bg-forest/10 text-forest"
                }`}
              >
                {entry.originalRank}
              </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 mr-3">
                      <img src="/images/avatar-placeholder.svg" alt="avatar" className="w-10 h-10 rounded-full" />
                    </div>
                    <div>
                      <div className="font-mono text-sm text-forest font-futura-bold">{formatWallet(entry.wallet)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="text-lg font-futura-bold text-forest">${formatUsdc(entry.totalUsdcSent)}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="text-sm font-futura-bold text-forest">{entry.transactionCount}</div>
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
                          style={{ width: `${calculateCapProgress(entry.totalUsdcSent)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-forest/60 mt-1 text-center">
                        {calculateCapProgress(entry.totalUsdcSent).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};



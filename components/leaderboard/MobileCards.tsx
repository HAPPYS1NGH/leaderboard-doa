import React from "react";
import { LeaderboardEntry } from "../../hooks/useLeaderboardData";

type MobileCardsProps = {
  entries: LeaderboardEntry[];
  formatUsdc: (amount: string) => string;
  calculateCapProgress: (amount: string) => number;
  formatWallet: (wallet: string) => string;
};

export const MobileCards: React.FC<MobileCardsProps> = ({ entries, formatUsdc, calculateCapProgress, formatWallet }) => {
  return (
    <div className="md:hidden bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
      {/* Mobile Leaderboard Header */}
      <div className="bg-gradient-to-r from-forest to-forest/90 text-cream px-4 py-3">
        <h2 className="text-lg font-futura-bold text-center">🏆 Top Farmers</h2>
      </div>
      {entries.map((entry) => (
        <div key={entry.wallet} className="p-4 border-b border-forest/10 hover:bg-white/50 transition-colors duration-150 last:border-b-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-base font-futura-bold mr-3 bg-forest/10 text-forest`}>
                {entry.originalRank}
              </span>
              <div className="w-10 h-10 mr-3">
                <img src="/images/avatar-placeholder.svg" alt="avatar" className="w-10 h-10 rounded-full" />
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-futura-bold text-forest">${formatUsdc(entry.totalUsdcSent)}</div>
            </div>
          </div>
          <div className="flex justify-between items-center mb-2">
            <div className="font-mono text-sm text-forest font-futura-bold">{formatWallet(entry.wallet)}</div>
            <div className="text-sm font-futura-bold text-forest">{entry.transactionCount} taps</div>
          </div>
          <div className="w-full">
            <div className="flex justify-between text-xs text-forest/60 mb-1">
              <span>0%</span>
              <span>100%</span>
            </div>
            <div className="w-full bg-forest/20 rounded-full h-2 mb-1">
              <div
                className="bg-forest h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateCapProgress(entry.totalUsdcSent)}%` }}
              ></div>
            </div>
            <div className="text-xs text-forest/60 text-center">
              {calculateCapProgress(entry.totalUsdcSent).toFixed(1)}% of cap
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};


